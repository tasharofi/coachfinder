import { useState, useEffect, useRef } from 'react';
import { searchSuburbs } from '../services/api';

export default function SuburbAutocomplete({ value, onChange, placeholder, id }) {
    const [query, setQuery] = useState(value || '');
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [loading, setLoading] = useState(false);
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

        // Notify parent when field is cleared or changed (not from selection)
        if (!val.trim()) {
            onChange({ suburb: '', state: '', postcode: '', lat: null, lng: null, display: '' });
        }

        if (debounceRef.current) clearTimeout(debounceRef.current);

        if (val.length < 2) {
            setSuggestions([]);
            setShowSuggestions(false);
            return;
        }

        debounceRef.current = setTimeout(async () => {
            setLoading(true);
            try {
                const data = await searchSuburbs(val);
                setSuggestions(data.suburbs || []);
                setShowSuggestions(true);
            } catch {
                setSuggestions([]);
            } finally {
                setLoading(false);
            }
        }, 250);
    };

    const handleSelect = (suburb) => {
        const display = `${suburb.suburb}, ${suburb.state} ${suburb.postcode}`;
        setQuery(display);
        setShowSuggestions(false);
        onChange({
            suburb: suburb.suburb,
            state: suburb.state,
            postcode: suburb.postcode,
            lat: suburb.lat,
            lng: suburb.lng,
            display,
        });
    };

    return (
        <div className="suburb-autocomplete" ref={wrapperRef}>
            <input
                id={id}
                type="text"
                className="form-input"
                placeholder={placeholder || 'Start typing a suburb...'}
                value={query}
                onChange={handleInputChange}
                onFocus={(e) => {
                    if (suggestions.length > 0) setShowSuggestions(true);
                    if (window.innerWidth <= 768) {
                        setTimeout(() => {
                            const filterBar = e.target.closest('.search-filters');
                            if (filterBar && filterBar.getBoundingClientRect().top > 5) {
                                filterBar.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            }
                        }, 300);
                    }
                }}
                autoComplete="off"
            />
            {showSuggestions && suggestions.length > 0 && (
                <div className="suburb-suggestions">
                    {suggestions.map((s, i) => (
                        <button
                            key={`${s.suburb}-${s.postcode}-${i}`}
                            className="suburb-suggestion"
                            type="button"
                            onClick={() => handleSelect(s)}
                        >
                            <span className="suburb-suggestion-name">{s.suburb}</span>
                            <span className="suburb-suggestion-detail">{s.state} {s.postcode}</span>
                        </button>
                    ))}
                </div>
            )}
            {loading && <div className="suburb-loading">Searching...</div>}
        </div>
    );
}
