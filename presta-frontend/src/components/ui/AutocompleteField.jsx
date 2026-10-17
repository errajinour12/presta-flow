import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';

/**
 * AutocompleteField – Reusable searchable autocomplete dropdown.
 *
 * Props:
 *  - label       : string   — Field label displayed above the input.
 *  - options     : Array<{ id: number|string, label: string }> — Full list of options.
 *  - value       : number|string|null — Currently selected option id (controlled).
 *  - onChange    : (id: number|string | null) => void — Called on selection or clear.
 *  - placeholder : string   — Placeholder text for the search input.
 *  - required    : boolean  — Whether the field is required (default false).
 *  - id          : string   — Optional id for the input element.
 */
const AutocompleteField = ({
  label,
  options = [],
  value,
  onChange,
  placeholder = 'Rechercher…',
  required = false,
  id,
}) => {
  // The text the user is currently typing
  const [query, setQuery] = useState('');
  // Whether the dropdown is visible
  const [isOpen, setIsOpen] = useState(false);
  // Index of the keyboard-highlighted item (-1 = none)
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  // Derive the label of the currently selected option
  const selectedLabel = useMemo(() => {
    if (value === '' || value === null || value === undefined) return '';
    const found = options.find((o) => String(o.id) === String(value));
    return found ? found.label : '';
  }, [value, options]);

  // Client-side immediate filtering – no debounce needed (data is already in memory)
  const filteredOptions = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return options;
    return options.filter((o) => o.label.toLowerCase().includes(term));
  }, [query, options]);

  // -------------------------------------------------------------------------
  // Open / close helpers
  // -------------------------------------------------------------------------
  const openDropdown = useCallback(() => {
    setQuery('');
    setHighlightedIndex(-1);
    setIsOpen(true);
  }, []);

  const closeDropdown = useCallback(() => {
    setIsOpen(false);
    setQuery('');
    setHighlightedIndex(-1);
  }, []);

  const selectOption = useCallback(
    (option) => {
      onChange(option.id);
      closeDropdown();
    },
    [onChange, closeDropdown]
  );

  const clearSelection = useCallback(
    (e) => {
      e.stopPropagation();
      onChange(null);
      closeDropdown();
    },
    [onChange, closeDropdown]
  );

  // -------------------------------------------------------------------------
  // Click-outside to close
  // -------------------------------------------------------------------------
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        closeDropdown();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, closeDropdown]);

  // -------------------------------------------------------------------------
  // Scroll highlighted item into view
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const item = listRef.current.children[highlightedIndex];
      if (item) {
        item.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex]);

  // -------------------------------------------------------------------------
  // Keyboard navigation
  // -------------------------------------------------------------------------
  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openDropdown();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < filteredOptions.length - 1 ? prev + 1 : 0
        );
        break;

      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : filteredOptions.length - 1
        );
        break;

      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
          selectOption(filteredOptions[highlightedIndex]);
        }
        break;

      case 'Escape':
        e.preventDefault();
        closeDropdown();
        inputRef.current?.blur();
        break;

      case 'Tab':
        closeDropdown();
        break;

      default:
        break;
    }
  };

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  const hasSelection = value !== '' && value !== null && value !== undefined;

  return (
    <div className={`relative ${label ? 'space-y-2' : ''}`} ref={containerRef}>
      {/* Label */}
      {label && (
        <label
          htmlFor={id}
          className="block text-sm font-semibold text-slate-700"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* Input wrapper */}
      <div className="relative">
        {/* Search icon */}
        <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 pointer-events-none">
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </span>

        {/* Text input */}
        <input
          ref={inputRef}
          id={id}
          type="text"
          autoComplete="off"
          placeholder={isOpen ? 'Tapez pour rechercher…' : (selectedLabel || placeholder)}
          value={isOpen ? query : selectedLabel}
          onFocus={openDropdown}
          onChange={(e) => {
            setQuery(e.target.value);
            setHighlightedIndex(-1);
          }}
          onKeyDown={handleKeyDown}
          className={`input-field cursor-pointer flex items-center justify-between
            ${isOpen ? 'border-[#3b62ad]/50 bg-white ring-2 ring-[#3b62ad]/20' : 'border-slate-200'}
            ${hasSelection && !isOpen ? 'text-slate-800 font-medium' : 'text-slate-500'}
          `}
          readOnly={!isOpen}
        />

        {/* Clear (×) button — only shown when a value is selected */}
        {hasSelection && (
          <button
            type="button"
            onClick={clearSelection}
            className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-slate-600 transition-colors"
            tabIndex={-1}
            aria-label="Effacer la sélection"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}

        {/* Chevron — shown when no selection */}
        {!hasSelection && (
          <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 pointer-events-none">
            <svg
              className={`w-4 h-4 transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </span>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full bg-white border border-slate-100 rounded-xl shadow-lg mt-1 overflow-hidden">
          {filteredOptions.length === 0 ? (
            /* Empty state */
            <div className="px-4 py-6 flex flex-col items-center text-center">
              <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center mb-2">
                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-[13px] text-slate-400 font-medium">Aucun résultat trouvé</p>
            </div>
          ) : (
            /* Results list */
            <ul
              ref={listRef}
              role="listbox"
              className="max-h-52 overflow-y-auto py-1"
            >
              {filteredOptions.map((option, index) => {
                const isHighlighted = index === highlightedIndex;
                const isSelected = String(option.id) === String(value);
                return (
                  <li
                    key={option.id}
                    role="option"
                    aria-selected={isSelected}
                    onMouseDown={(e) => {
                      // Use mousedown (before blur) so the click registers
                      e.preventDefault();
                      selectOption(option);
                    }}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    className={`flex items-center justify-between px-4 py-2.5 text-[14px] cursor-pointer transition-colors
                      ${isHighlighted
                        ? 'bg-[#f0f4f8] text-[#3b62ad] font-semibold'
                        : isSelected
                          ? 'bg-blue-50 text-[#3b62ad] font-medium'
                          : 'text-slate-700 hover:bg-slate-50'
                      }
                    `}
                  >
                    <span>{option.label}</span>
                    {/* Checkmark for the already-selected item */}
                    {isSelected && (
                      <svg className="w-4 h-4 text-[#3b62ad] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default AutocompleteField;
