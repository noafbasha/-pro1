
import React, { useState, useRef, useEffect } from 'react';

interface Option {
  id: string;
  name: string;
}

interface Props {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  label?: string;
  className?: string;
}

const SearchableSelect: React.FC<Props> = ({ options, value, onChange, placeholder, label, className }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(o => o.id === value);
  const filteredOptions = options.filter(o => 
    o.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (option: Option) => {
    onChange(option.id);
    setSearchTerm('');
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && <label className="text-[10px] font-black text-slate-400 uppercase px-2 mb-1 block">{label}</label>}
      
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full p-4 md:p-5 bg-slate-50 dark:bg-slate-800 border-2 md:border-4 border-transparent hover:border-emerald-500/30 rounded-2xl md:rounded-3xl outline-none font-black text-lg md:text-xl dark:text-white shadow-inner cursor-pointer flex justify-between items-center transition-all ${isOpen ? 'border-emerald-500 shadow-lg' : ''}`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={label ? `اختيار ${label}` : placeholder}
      >
        <span className={selectedOption ? 'text-slate-900 dark:text-white' : 'text-slate-400'}>
          {selectedOption ? selectedOption.name : placeholder}
        </span>
        <span className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} aria-hidden="true">▼</span>
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 animate-in fade-in duration-300 md:absolute md:inset-auto md:w-full md:mt-2 md:p-0">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md md:hidden" onClick={() => setIsOpen(false)} aria-label="إغلاق القائمة المنسدلة"></div>
          <div className="relative w-full sm:max-w-md bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-[1.5rem] md:rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300 my-auto md:animate-in md:fade-in md:slide-in-from-top-2 md:duration-200">
            <div className="p-3 border-b dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex justify-between items-center">
              <input 
                autoFocus
                type="text"
                placeholder="ابحث هنا..."
                className="w-full p-3 bg-white dark:bg-slate-800 rounded-xl outline-none font-bold dark:text-white border border-slate-200 dark:border-slate-700 focus:border-emerald-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                aria-label="حقل البحث"
              />
              <button onClick={() => setIsOpen(false)} className="md:hidden ml-2 text-2xl text-slate-500" aria-label="إغلاق البحث">✕</button>
            </div>
            <div className="max-h-60 overflow-y-auto no-scrollbar" role="listbox">
              {filteredOptions.length > 0 ? (
                filteredOptions.map(option => (
                  <div 
                    key={option.id}
                    onClick={() => handleSelect(option)}
                    className={`p-4 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 cursor-pointer font-black text-right transition-colors ${value === option.id ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-400' : 'dark:text-slate-200'}`}
                    role="option"
                    aria-selected={value === option.id}
                  >
                    {option.name}
                  </div>
                ))
              ) : (
                <div className="p-10 text-center text-slate-400 font-bold italic">لا توجد نتائج مطابقة..</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchableSelect;
