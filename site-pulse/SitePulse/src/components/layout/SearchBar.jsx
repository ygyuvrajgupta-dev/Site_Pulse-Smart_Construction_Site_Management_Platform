import { useState, useRef, useEffect } from 'react';
import { FiSearch, FiX } from 'react-icons/fi';

/**
 * Search Bar
 * Reusable search component with keyboard shortcut support.
 * 
 * @param {string} placeholder - Search placeholder text
 * @param {function} onSearch - Callback when search is submitted
 * @param {function} onChange - Callback when search value changes
 * @param {string} className - Additional CSS classes
 */
function SearchBar({ placeholder = 'Search...', onSearch, onChange, className = '' }) {
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);

  // Keyboard shortcut: Cmd/Ctrl + K to focus search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === 'Escape') {
        inputRef.current?.blur();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleChange = (e) => {
    setQuery(e.target.value);
    if (onChange) onChange(e.target.value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSearch) onSearch(query);
  };

  const handleClear = () => {
    setQuery('');
    if (onChange) onChange('');
    inputRef.current?.focus();
  };

  return (
    <form onSubmit={handleSubmit} className={`relative ${className}`}>
      <div className="relative">
        <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleChange}
          placeholder={placeholder}
          className="w-full pl-9 pr-9 py-2 text-sm bg-gray-100 dark:bg-gray-700 border border-transparent focus:border-secondary focus:bg-white dark:focus:bg-gray-800 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-secondary transition-all"
        />
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <FiX className="w-4 h-4" />
          </button>
        )}
        {!query && (
          <kbd className="absolute right-3 top-1/2 transform -translate-y-1/2 hidden md:flex items-center gap-0.5 px-1.5 py-0.5 text-xs text-gray-400 bg-gray-200 dark:bg-gray-600 rounded">
            ⌘K
          </kbd>
        )}
      </div>
    </form>
  );
}

export default SearchBar;