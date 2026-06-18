import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import { COUNTRIES } from '../../utils/countries';
import { motion, AnimatePresence } from 'framer-motion';

export default function CountrySelect({ selectedCountry, setSelectedCountry }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const wrapperRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredCountries = COUNTRIES.filter(country => 
    country.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedCountryName = selectedCountry 
    ? COUNTRIES.find(c => c.code === selectedCountry)?.name 
    : 'Select Country (Optional)';

  return (
    <div className="relative w-full text-left" ref={wrapperRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between bg-white text-black font-semibold text-lg py-3 px-4 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
      >
        <div className="flex items-center gap-2">
          {selectedCountry && (
            <img 
              src={`https://flagcdn.com/${selectedCountry.toLowerCase()}.svg`} 
              className="w-5 h-auto shadow-sm border border-black/10" 
              alt="flag" 
            />
          )}
          <span className="truncate max-w-[200px] text-sm md:text-base">
            {selectedCountryName}
          </span>
        </div>
        <ChevronDown className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 w-full mt-2 bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col"
          >
            <div className="p-2 border-b-2 border-black flex items-center gap-2">
              <Search className="w-4 h-4 text-gray-500 shrink-0" />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full outline-none text-sm font-medium placeholder-gray-400"
                autoFocus
              />
            </div>
            
            <div className="max-h-48 overflow-y-auto">
              <button
                type="button"
                onClick={() => {
                  setSelectedCountry(null);
                  setIsOpen(false);
                  setSearchTerm('');
                }}
                className="w-full text-left px-4 py-2 text-sm font-medium text-gray-500 hover:bg-gray-100 border-b border-gray-100"
              >
                None
              </button>
              {filteredCountries.map((country) => (
                <button
                  key={country.code}
                  type="button"
                  onClick={() => {
                    setSelectedCountry(country.code);
                    setIsOpen(false);
                    setSearchTerm('');
                  }}
                  className="w-full text-left px-4 py-2 flex items-center gap-3 hover:bg-black hover:text-white group transition-colors border-b border-gray-100 last:border-none"
                >
                  <img 
                    src={`https://flagcdn.com/${country.code.toLowerCase()}.svg`} 
                    className="w-5 h-auto shadow-sm border border-black/10" 
                    alt={country.name} 
                  />
                  <span className="text-sm font-medium">{country.name}</span>
                </button>
              ))}
              {filteredCountries.length === 0 && (
                <div className="px-4 py-3 text-sm text-gray-500 text-center font-medium">
                  No countries found
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
