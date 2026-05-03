import { useState, useEffect, useRef } from 'react';
import { searchSkills } from '../services/api';

export default function SkillAutocomplete({ value, onChange, onSelect, onCustomSubmit, placeholder, id, className, clearOnSelect }) {
    const [query, setQuery] = useState(value || '');
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    const wrapperRef = useRef(null);
    const debounceRef = useRef(null);
    // Track whether the user is actively typing so the value-sync
    // effect doesn't fight with local edits and cause flicker.
    const isTypingRef = useRef(false);

    // Only sync from parent prop when it changes externally
    // (e.g. clearOnSelect, programmatic reset), NOT while the user is typing.
    useEffect(() => {
        if (!isTypingRef.current) {
            setQuery(value || '');
        }
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
        isTypingRef.current = true;
        setQuery(val);
        setActiveIndex(-1);
        onChange && onChange(val);

        // Clear the typing flag after React has flushed this render cycle
        // so the useEffect won't overwrite what the user just typed.
        requestAnimationFrame(() => { isTypingRef.current = false; });

        if (debounceRef.current) clearTimeout(debounceRef.current);

        // Don't show autocomplete for short input or long NL phrases
        const wordCount = val.trim().split(/\s+/).length;
        if (val.length < 2 || wordCount > 4) {
            setSuggestions([]);
            setShowSuggestions(false);
            return;
        }

        debounceRef.current = setTimeout(async () => {
            try {
                const data = await searchSkills(val);
                setSuggestions(data.suggestions || []);
                setShowSuggestions(true);
            } catch {
                setSuggestions([]);
            }
        }, 300);
    };

    const handleSelect = (skill) => {
        const searchTerm = skill.label || skill.name;
        isTypingRef.current = false;
        if (clearOnSelect) {
            setQuery('');
            onChange && onChange('');
        } else {
            setQuery(searchTerm);
            onChange && onChange(searchTerm);
        }
        setShowSuggestions(false);
        setSuggestions([]);
        setActiveIndex(-1);
        onSelect && onSelect({ ...skill, name: searchTerm, resolvedName: skill.name });
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            if (showSuggestions && activeIndex >= 0 && suggestions[activeIndex]) {
                e.preventDefault();
                handleSelect(suggestions[activeIndex]);
            } else if (query.trim() && onCustomSubmit) {
                e.preventDefault();
                onCustomSubmit(query.trim());
                if (clearOnSelect) {
                    setQuery('');
                    onChange && onChange('');
                }
                setShowSuggestions(false);
                setSuggestions([]);
            }
            return;
        }

        if (!showSuggestions || suggestions.length === 0) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActiveIndex(prev => Math.min(prev + 1, suggestions.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveIndex(prev => Math.max(prev - 1, -1));
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
                    {/* "Add as new skill" option — always shown when query doesn't exactly match a canonical suggestion */}
                    {query.trim().length >= 2 && !suggestions.some(s => s.isCanonical && s.name.toLowerCase() === query.trim().toLowerCase()) && (
                        <button
                            className={`skill-suggestion skill-suggestion-create ${suggestions.length === activeIndex ? 'active' : ''}`}
                            type="button"
                            onClick={() => {
                                const name = query.trim();
                                setShowSuggestions(false);
                                setSuggestions([]);
                                if (clearOnSelect) { setQuery(''); onChange && onChange(''); }
                                onCustomSubmit && onCustomSubmit(name, { force: true });
                            }}
                            onMouseEnter={() => setActiveIndex(suggestions.length)}
                        >
                            <span className="skill-suggestion-create-icon">+</span>
                            <span>Add "<strong>{query.trim()}</strong>" as new skill</span>
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
