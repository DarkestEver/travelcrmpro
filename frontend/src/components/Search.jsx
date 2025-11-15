import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  FiSearch, 
  FiX, 
  FiUser, 
  FiCalendar, 
  FiFileText,
  FiMapPin,
  FiDollarSign
} from 'react-icons/fi';
import { searchAPI } from '../services/apiEndpoints';

const Search = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);

  // Fetch search results
  const { data: searchResults, isLoading } = useQuery({
    queryKey: ['search', query, category],
    queryFn: () => searchAPI.search({ query, category }),
    enabled: query.length > 2,
  });

  const results = searchResults?.data || [];

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Cmd/Ctrl + K to open
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (!isOpen) {
          onClose && onClose(true);
        }
      }

      // ESC to close
      if (e.key === 'Escape' && isOpen) {
        onClose && onClose();
        setQuery('');
        setSelectedIndex(0);
      }

      // Arrow navigation
      if (isOpen && results.length > 0) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSelectedIndex((prev) => Math.max(prev - 1, 0));
        }
        if (e.key === 'Enter') {
          e.preventDefault();
          handleResultClick(results[selectedIndex]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, selectedIndex]);

  const handleResultClick = (result) => {
    if (result) {
      // Navigate to the result
      window.location.href = result.url;
      onClose && onClose();
      setQuery('');
      setSelectedIndex(0);
    }
  };

  const getCategoryIcon = (type) => {
    const icons = {
      customer: FiUser,
      agent: FiUser,
      booking: FiCalendar,
      quote: FiFileText,
      itinerary: FiMapPin,
      supplier: FiDollarSign,
    };
    return icons[type] || FiFileText;
  };

  const getCategoryColor = (type) => {
    const colors = {
      customer: 'bg-blue-100 text-blue-600',
      agent: 'bg-purple-100 text-purple-600',
      booking: 'bg-green-100 text-green-600',
      quote: 'bg-yellow-100 text-yellow-600',
      itinerary: 'bg-pink-100 text-pink-600',
      supplier: 'bg-orange-100 text-orange-600',
    };
    return colors[type] || 'bg-gray-100 text-gray-600';
  };

  const highlightMatch = (text, query) => {
    if (!query || !text) return text;

    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, index) => 
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={index} className="bg-yellow-200 font-medium">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={() => {
          onClose && onClose();
          setQuery('');
          setSelectedIndex(0);
        }}
      ></div>

      {/* Search Modal */}
      <div className="flex min-h-screen items-start justify-center p-4 sm:p-8">
        <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl mt-20">
          {/* Search Input */}
          <div className="flex items-center gap-3 p-4 border-b border-gray-200">
            <FiSearch className="w-5 h-5 text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelectedIndex(0);
              }}
              placeholder="Search customers, bookings, quotes..."
              className="flex-1 outline-none text-lg"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="text-gray-400 hover:text-gray-600"
              >
                <FiX className="w-5 h-5" />
              </button>
            )}
            <kbd className="hidden sm:inline-block px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded">
              ESC
            </kbd>
          </div>

          {/* Category Filters */}
          <div className="flex gap-2 p-3 border-b border-gray-200 overflow-x-auto">
            {['all', 'customer', 'agent', 'booking', 'quote', 'itinerary', 'supplier'].map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-3 py-1.5 text-sm font-medium rounded-full whitespace-nowrap transition-colors ${
                  category === cat
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ))}
          </div>

          {/* Search Results */}
          <div className="max-h-96 overflow-y-auto">
            {isLoading && query.length > 2 ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                <p className="text-gray-500 mt-2">Searching...</p>
              </div>
            ) : query.length <= 2 ? (
              <div className="p-8 text-center text-gray-500">
                <FiSearch className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                <p>Type at least 3 characters to search</p>
                <div className="mt-4 text-sm">
                  <p className="font-medium mb-2">Quick tips:</p>
                  <ul className="space-y-1 text-left max-w-xs mx-auto">
                    <li>• Use <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-xs">Cmd/Ctrl + K</kbd> to open search</li>
                    <li>• Use <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-xs">↑ ↓</kbd> arrows to navigate</li>
                    <li>• Press <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-xs">Enter</kbd> to select</li>
                  </ul>
                </div>
              </div>
            ) : results.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <p>No results found for "{query}"</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {results.map((result, index) => {
                  const Icon = getCategoryIcon(result.type);
                  const colorClass = getCategoryColor(result.type);

                  return (
                    <div
                      key={result.id}
                      onClick={() => handleResultClick(result)}
                      onMouseEnter={() => setSelectedIndex(index)}
                      className={`p-4 cursor-pointer transition-colors ${
                        index === selectedIndex
                          ? 'bg-blue-50'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Icon */}
                        <div className={`flex-shrink-0 w-10 h-10 rounded-lg ${colorClass} flex items-center justify-center`}>
                          <Icon className="w-5 h-5" />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-sm font-medium text-gray-900 truncate">
                              {highlightMatch(result.title, query)}
                            </h4>
                            <span className="flex-shrink-0 text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full capitalize">
                              {result.type}
                            </span>
                          </div>
                          {result.description && (
                            <p className="text-sm text-gray-600 truncate">
                              {highlightMatch(result.description, query)}
                            </p>
                          )}
                          {result.metadata && (
                            <div className="flex gap-3 mt-2 text-xs text-gray-500">
                              {Object.entries(result.metadata).map(([key, value]) => (
                                <span key={key}>
                                  {key}: <span className="font-medium">{value}</span>
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Keyboard hint */}
                        {index === selectedIndex && (
                          <div className="flex-shrink-0 text-xs text-gray-400">
                            <kbd className="px-1.5 py-0.5 bg-gray-100 rounded">↵</kbd>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-3 border-t border-gray-200 bg-gray-50 text-xs text-gray-500">
            <div className="flex gap-4">
              <span>
                <kbd className="px-1.5 py-0.5 bg-white border border-gray-200 rounded">↑</kbd>
                <kbd className="px-1.5 py-0.5 bg-white border border-gray-200 rounded ml-1">↓</kbd>
                {' '}to navigate
              </span>
              <span>
                <kbd className="px-1.5 py-0.5 bg-white border border-gray-200 rounded">↵</kbd>
                {' '}to select
              </span>
              <span>
                <kbd className="px-1.5 py-0.5 bg-white border border-gray-200 rounded">ESC</kbd>
                {' '}to close
              </span>
            </div>
            {results.length > 0 && (
              <span>{results.length} results</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Search;
