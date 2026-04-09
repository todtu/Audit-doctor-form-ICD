import React, { useState, useEffect } from 'react';
import { Search, Plus, X, Loader2 } from 'lucide-react';
import { searchICD, ICDResult } from '../services/geminiService';

interface ICDSearchProps {
  type: 'ICD10' | 'ICD9';
  onSelect: (code: string) => void;
  selectedCodes: string[];
}

export default function ICDSearch({ type, onSelect, selectedCodes }: ICDSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ICDResult[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const data = await searchICD(query, type);
      setResults(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-semibold text-accent-brown">{type} Codes</label>
      <div className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Search ${type}...`}
          className="input-field"
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleSearch())}
        />
        <button
          type="button"
          onClick={handleSearch}
          disabled={loading}
          className="p-2 bg-pastel-orange rounded-xl hover:bg-pastel-orange-dark transition-colors"
        >
          {loading ? <Loader2 className="animate-spin" /> : <Search size={20} />}
        </button>
      </div>

      {results.length > 0 && (
        <div className="mt-2 max-h-40 overflow-y-auto border border-pastel-brown-dark rounded-xl bg-white p-2 space-y-1">
          {results.map((res) => (
            <button
              key={res.code}
              type="button"
              onClick={() => {
                onSelect(res.code);
                setResults([]);
                setQuery('');
              }}
              className="w-full text-left p-2 hover:bg-pastel-orange-light rounded-lg text-sm flex justify-between items-center"
            >
              <span><span className="font-bold">{res.code}</span>: {res.description}</span>
              <Plus size={16} />
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-2 mt-2">
        {selectedCodes.map((code) => (
          <span
            key={code}
            className="px-3 py-1 bg-pastel-orange-dark text-accent-brown rounded-full text-xs font-medium flex items-center gap-1"
          >
            {code}
            <button type="button" onClick={() => onSelect(code)}>
              <X size={14} />
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}
