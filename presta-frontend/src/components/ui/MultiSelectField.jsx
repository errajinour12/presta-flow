import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';

/**
 * MultiSelectField – Reusable searchable dropdown with checkboxes for selecting multiple options.
 *
 * Props:
 *  - label       : string   — Field label displayed above the input.
 *  - options     : Array<{ id: number|string, label: string }> — Full list of options.
 *  - value       : Array<number|string> — Currently selected options (controlled).
 *  - onChange    : (ids: Array<number|string>) => void — Called when selection changes.
 *  - placeholder : string   — Placeholder text for the search input.
 *  - required    : boolean  — Whether the field is required (default false).
 *  - id          : string   — Optional id for the input element.
 */
const MultiSelectField = ({
  label,
  options = [],
  value = [],
  onChange,
  placeholder = 'Rechercher des tâches…',
  required = false,
  id,
}) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const containerRef = useRef(null);
  const inputRef = useRef(null);

  // Filter options based on search query
  const filteredOptions = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return options;
    return options.filter((o) => o.label.toLowerCase().includes(term));
  }, [query, options]);

  const toggleOption = useCallback(
    (optionId) => {
      const isSelected = value.includes(optionId);
      let newValue;
      if (isSelected) {
        newValue = value.filter((id) => id !== optionId);
      } else {
        newValue = [...value, optionId];
      }
      onChange(newValue);
    },
    [value, onChange]
  );

  const clearSelection = useCallback(
    (e) => {
      e.stopPropagation();
      onChange([]);
      setQuery('');
    },
    [onChange]
  );

  // Click-outside listener
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        setQuery('');
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const hasSelection = value.length > 0;

  // Display label when closed vs open
  const displayValue = useMemo(() => {
    if (!hasSelection) return '';
    if (value.length === 1) {
      const found = options.find((o) => o.id === value[0]);
      return found ? found.label : '1 tâche sélectionnée';
    }
    return `${value.length} tâches sélectionnées`;
  }, [value, options, hasSelection]);

  return (
    <div className={`relative ${label ? 'space-y-2' : ''}`} ref={containerRef}>
      {label && (
        <label htmlFor={id} className="block text-sm font-semibold text-slate-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 pointer-events-none">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </span>

        <input
          ref={inputRef}
          id={id}
          type="text"
          autoComplete="off"
          placeholder={isOpen ? 'Tapez pour filtrer…' : (displayValue || placeholder)}
          value={isOpen ? query : displayValue}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => setQuery(e.target.value)}
          className={`w-full bg-slate-50 border rounded-xl pl-10 pr-10 py-3 text-[14px] text-slate-800
            focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#3b62ad]/20
            focus:border-[#3b62ad]/50 transition-all
            ${isOpen ? 'border-[#3b62ad]/50 bg-white ring-2 ring-[#3b62ad]/20' : 'border-slate-200'}
            ${hasSelection && !isOpen ? 'text-[#3b62ad] font-semibold' : 'text-slate-500'}
          `}
          readOnly={!isOpen}
        />

        {hasSelection && (
          <button
            type="button"
            onClick={clearSelection}
            className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-slate-600 transition-colors"
            tabIndex={-1}
            aria-label="Effacer tout"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}

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

      {isOpen && (
        <div className="absolute z-50 w-full bg-white border border-slate-100 rounded-xl shadow-lg mt-1 overflow-hidden">
          {filteredOptions.length === 0 ? (
            <div className="px-4 py-6 flex flex-col items-center text-center">
              <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center mb-2">
                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-[13px] text-slate-400 font-medium">Aucune tâche disponible</p>
            </div>
          ) : (
            <ul className="max-h-52 overflow-y-auto py-1">
              {filteredOptions.map((option) => {
                const isSelected = value.includes(option.id);
                return (
                  <li
                    key={option.id}
                    onMouseDown={(e) => {
                      e.preventDefault(); // Prevent input blur
                      toggleOption(option.id);
                    }}
                    className={`flex items-center gap-3 px-4 py-2.5 text-[14px] cursor-pointer hover:bg-slate-50 transition-colors text-slate-700
                      ${isSelected ? 'bg-blue-50/50 text-[#3b62ad] font-medium' : ''}
                    `}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      readOnly
                      className="w-4 h-4 rounded border-slate-300 text-[#3b62ad] focus:ring-[#3b62ad]"
                    />
                    <span className="truncate">{option.label}</span>
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

export default MultiSelectField;
