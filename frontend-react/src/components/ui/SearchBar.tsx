import React, { useId } from 'react';
import { Search, X } from 'lucide-react';

export interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  id?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  placeholder = 'Search...',
  className = '',
  id,
}) => {
  const generatedId = useId();
  const searchInputId = id || `search-${generatedId}`;

  return (
    <div className={`relative flex items-center w-full ${className}`}>
      <Search className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" aria-hidden="true" />
      <input
        type="text"
        id={searchInputId}
        name="search"
        autoComplete="off"
        aria-label={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-10 pr-10 py-2.5 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 rounded-lg min-h-[44px] transition-all placeholder:text-slate-400 dark:placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-navy/15 dark:focus:ring-sky-500/20 focus:border-navy dark:focus:border-sky-400 shadow-2xs"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute right-1.5 p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy dark:focus-visible:ring-sky-400 min-h-[40px] min-w-[40px] flex items-center justify-center cursor-pointer"
          aria-label="Clear search"
        >
          <X className="w-4 h-4" aria-hidden="true" />
        </button>
      )}
    </div>
  );
};

