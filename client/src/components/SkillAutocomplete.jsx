import { useState, useEffect, useRef, useCallback } from 'react';
import { searchSkills } from '../services/api';

export default function SkillAutocomplete({ value, onChange, onSelect, onCustomSubmit, placeholder, id, className, clearOnSelect, allowCreate = true, excludeIds, excludeNames, mode }) {
    const [query, setQuery] = useState(value || '');
    const [suggestions, setSuggestions] = useState([]);
    // Track the raw (unfiltered) count from the API so we can tell the
    // difference between "no results at all" vs "all results filtered out
    // because they map to already-selected skills".
    const [rawResultCount, setRawResultCount] = useState(0);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    const wrapperRef = useRef(null);
    const debounceRef = useRef(null);
    // Track whether the user is actively typing so the value-sync
    // effect doesn't fight with local edits and cause flicker.
    const isTypingRef = useRef(false);

    // Build a Set from the prop for fast lookups
    const excludeSet = excludeIds instanceof Set ? excludeIds : new Set(excludeIds || []);

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
            setRawResultCount(0);
            setShowSuggestions(false);
            return;
        }

        debounceRef.current = setTimeout(async () => {
            try {
                const data = await searchSkills(val, mode);
                const raw = data.suggestions || [];
                setRawResultCount(raw.length);

                // Filter out suggestions whose canonical skill ID is already selected
                const filtered = excludeSet.size > 0
                    ? raw.filter(s => !excludeSet.has(s.id))
                    : raw;

                setSuggestions(filtered);
                setShowSuggestions(true);
            } catch {
                setSuggestions([]);
                setRawResultCount(0);
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

    // Determine whether the "Add as new skill" should show:
    // - allowCreate must be true
    // - query >= 2 chars
    // - typed text doesn't exactly match a visible canonical suggestion
    // - typed text doesn't exactly match an already-selected skill name
    const queryTrimmed = query.trim();
    const queryLower = queryTrimmed.toLowerCase();
    const exactMatchVisible = suggestions.some(s => s.isCanonical && s.name.toLowerCase() === queryLower);
    const allResultsFiltered = rawResultCount > 0 && suggestions.length === 0;
    const excludeNameSet = excludeNames instanceof Set ? excludeNames : new Set((excludeNames || []).map(n => n.toLowerCase()));
    const exactMatchAlreadySelected = excludeNameSet.has(queryLower);
    const showCreateNew = allowCreate && queryTrimmed.length >= 2 && !exactMatchVisible && !exactMatchAlreadySelected;

    return (
        <div className={`skill-autocomplete ${className || ''}`} ref={wrapperRef}>
            <input
                id={id}
                type="text"
                className="form-input"
                placeholder={placeholder || 'What do you want to learn?'}
                value={query}
                onChange={handleInputChange}
                onFocus={(e) => {
                    if (suggestions.length > 0 || query.trim().length >= 2) setShowSuggestions(true);
                    // On mobile, scroll the filter bar to the top so dropdown is visible above keyboard
                    if (window.innerWidth <= 768) {
                        setTimeout(() => {
                            const filterBar = e.target.closest('.search-filters');
                            if (filterBar && filterBar.getBoundingClientRect().top > 5) {
                                filterBar.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            }
                        }, 300);
                    }
                }}
                onKeyDown={handleKeyDown}
                autoComplete="off"
            />
            {showSuggestions && (suggestions.length > 0 || query.trim().length >= 2) && (
                <div className="skill-suggestions">
                    {suggestions.map((s, i) => (
                        <button
                            key={`${s.id}-${s.label}`}
                            className={`skill-suggestion ${i === activeIndex ? 'active' : ''}`}
                            type="button"
                            onClick={() => handleSelect(s)}
                            onMouseEnter={() => setActiveIndex(i)}
                        >
                            <div className="skill-suggestion-main">
                                <span className="skill-suggestion-name">{s.label || s.name}</span>
                                {mode === 'coach' && s.parentGroup && (
                                    <span className="skill-suggestion-group">{s.parentGroup}</span>
                                )}
                            </div>
                            {mode === 'coach' && s.matchedAliases && s.matchedAliases.length > 0 && (
                                <span className="skill-suggestion-aliases">Also matches: {s.matchedAliases.join(', ')}</span>
                            )}
                        </button>
                    ))}
                    {/* "Add as new skill" — only for coach-facing usage, hidden when term maps to already-selected skill */}
                    {showCreateNew && (
                        <button
                            className={`skill-suggestion skill-suggestion-create ${suggestions.length === activeIndex ? 'active' : ''}`}
                            type="button"
                            onClick={() => {
                                const name = query.trim();
                                setShowSuggestions(false);
                                setSuggestions([]);
                                if (clearOnSelect) { setQuery(''); onChange && onChange(''); }
                                onCustomSubmit && onCustomSubmit(name, { createNew: true });
                            }}
                            onMouseEnter={() => setActiveIndex(suggestions.length)}
                        >
                            <span className="skill-suggestion-create-icon">+</span>
                            <span>Add "<strong>{query.trim()}</strong>" as new skill</span>
                        </button>
                    )}
                    {/* Show hint when all results were filtered out */}
                    {allResultsFiltered && (
                        <div className="skill-suggestion-info">
                            Already in your skills
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
