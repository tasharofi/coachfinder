import { useState, useEffect, useRef } from 'react';
import { searchSkills } from '../services/api';

export default function SkillAutocomplete({ value, onChange, onSelect, placeholder, id, className }) {
    const [query, setQuery] = useState(value || '');
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [loading, setLoading] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    const wrapperRef = useRef(null);
    const debounceRef = useRef(null);

    useEffect(() => {
        setQuery(value || '');
    }, [value]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleInputChange = (e) => {
        const val = e.target.value;
        setQuery(val);
        setActiveIndex(-1);
        onChange && onChange(val);

        if (debounceRef.current) clearTimeout(debounceRef.current);

        if (val.length < 2) {
            setSuggestions([]);
            setShowSuggestions(false);
            return;
        }

        debounceRef.current = setTimeout(async () => {
            setLoading(true);
            try {
                const data = await searchSkills(val);
                setSuggestions(data.suggestions || []);
                setShowSuggestions(true);
            } catch {
                setSuggestions([]);
            } finally {
                setLoading(false);
            }
        }, 200);
    };

    const handleSelect = (skill) => {
        // Use the label as the search term (could be alias or canonical)
        // Backend search resolution maps it to the same skill cluster
        const searchTerm = skill.label || skill.name;
        setQuery(searchTerm);
        setShowSuggestions(false);
        setSuggestions([]);
        setActiveIndex(-1);
        onChange && onChange(searchTerm);
        onSelect && onSelect({ ...skill, name: searchTerm, resolvedName: skill.name });
    };

    const handleKeyDown = (e) => {
        if (!showSuggestions || suggestions.length === 0) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActiveIndex(prev => Math.min(prev + 1, suggestions.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveIndex(prev => Math.max(prev - 1, -1));
        } else if (e.key === 'Enter' && activeIndex >= 0) {
            e.preventDefault();
            handleSelect(suggestions[activeIndex]);
        } else if (e.key === 'Escape') {
            setShowSuggestions(false);
        }
    };

    return (
        <div className={`skill-autocomplete ${className || ''}`} ref={wrapperRef}>
            <input
                id={id}
                type="text"
                className="form-input"
                placeholder={placeholder || 'What do you want to learn?'}
                value={query}
                onChange={handleInputChange}
                onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                onKeyDown={handleKeyDown}
                autoComplete="off"
            />
            {showSuggestions && suggestions.length > 0 && (
                <div className="skill-suggestions">
                    {suggestions.map((s, i) => (
                        <button
                            key={`${s.id}-${s.label}`}
                            className={`skill-suggestion ${i === activeIndex ? 'active' : ''}`}
                            type="button"
                            onClick={() => handleSelect(s)}
                            onMouseEnter={() => setActiveIndex(i)}
                        >
                            <span className="skill-suggestion-name">{s.label || s.name}</span>
                            {!s.isCanonical && s.parentSkill && (
                                <span className="skill-suggestion-group">→ {s.parentSkill}</span>
                            )}
                            {s.isCanonical && s.parentGroup && (
                                <span className="skill-suggestion-group">{s.parentGroup}</span>
                            )}
                        </button>
                    ))}
                </div>
            )}
            {loading && <div className="skill-loading">Searching...</div>}
        </div>
    );
}
