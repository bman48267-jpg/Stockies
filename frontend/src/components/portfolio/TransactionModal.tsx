import React, { useState, useEffect, useRef } from 'react';
import { X, Search } from 'lucide-react';
import { addTransaction, searchMutualFunds, stocksApi, getMFSchemeDetails } from '@/api';


interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  defaultAssetType?: 'stock' | 'mutual_fund' | 'emergency_fund' | 'fixed_deposit' | 'bond';
  defaultSymbol?: string;
  defaultName?: string;
  defaultTxnType?: 'BUY' | 'SELL' | 'SIP' | 'DIVIDEND' | 'BONUS' | 'SPLIT';
}

export function TransactionModal({
  isOpen,
  onClose,
  onSuccess,
  defaultAssetType = 'stock',
  defaultSymbol,
  defaultName,
  defaultTxnType,
}: TransactionModalProps) {
  const [assetType, setAssetType] = useState<'stock' | 'mutual_fund' | 'emergency_fund' | 'fixed_deposit' | 'bond'>(defaultAssetType);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{ symbol: string; name: string; price?: number }>>([]);
  const [selectedAsset, setSelectedAsset] = useState<{ symbol: string; name: string } | null>(null);
  
  const [txnType, setTxnType] = useState<'BUY' | 'SELL' | 'SIP' | 'DIVIDEND' | 'BONUS' | 'SPLIT'>('BUY');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [brokerage, setBrokerage] = useState('0');
  const [taxes, setTaxes] = useState('0');
  const [notes, setNotes] = useState('');
  
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorHeader, setErrorHeader] = useState<string | null>(null);

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const [showResults, setShowResults] = useState(false);

  // Sync default type when opened
  useEffect(() => {
    if (isOpen) {
      setAssetType(defaultAssetType);
      setSearchQuery(defaultName || '');
      setSelectedAsset(defaultSymbol && defaultName ? { symbol: defaultSymbol, name: defaultName } : null);
      setTxnType(defaultTxnType || 'BUY');
      setDate(new Date().toISOString().split('T')[0]);
      setQuantity('');
      setPrice('');
      setBrokerage('0');
      setTaxes('0');
      setNotes('');
      setErrorHeader(null);

      if (defaultSymbol) {
        (async () => {
          try {
            if (defaultAssetType === 'stock') {
              const quote = await stocksApi.getQuote(defaultSymbol);
              if (quote?.current_price) {
                setPrice(quote.current_price.toString());
              }
            } else {
              const mf = await getMFSchemeDetails(defaultSymbol);
              if (mf?.current_nav) {
                setPrice(mf.current_nav.toString());
              }
            }
          } catch (e) {
            console.error('Failed to pre-fetch price:', e);
          }
        })();
      }
    }
  }, [isOpen, defaultAssetType, defaultSymbol, defaultName, defaultTxnType]);


  // Handle autocomplete search
  useEffect(() => {
    if (searchQuery.length < 2 || selectedAsset) {
      setSearchResults([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setLoadingSearch(true);
      try {
        if (assetType === 'stock') {
          const res = await stocksApi.search(searchQuery);
          setSearchResults(
            res.results.map((r) => ({
              symbol: r.symbol,
              name: r.company_name,
              price: r.current_price ?? undefined,
            }))
          );
        } else {
          const res = await searchMutualFunds(searchQuery);
          setSearchResults(
            res.map((r) => ({
              symbol: r.scheme_code,
              name: r.scheme_name,
              price: r.nav ?? undefined,
            }))
          );
        }
        setShowResults(true);
      } catch (err) {
        console.error('Failed to search asset:', err);
      } finally {
        setLoadingSearch(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, assetType, selectedAsset]);

  // Close search results overlay when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const resetForm = () => {
    setSearchQuery(defaultName || '');
    setSearchResults([]);
    setSelectedAsset(defaultSymbol && defaultName ? { symbol: defaultSymbol, name: defaultName } : null);
    setTxnType(defaultTxnType || 'BUY');
    setDate(new Date().toISOString().split('T')[0]);
    setQuantity('');
    setPrice('');
    setBrokerage('0');
    setTaxes('0');
    setNotes('');
    setErrorHeader(null);
  };

  const handleSelectAsset = async (item: { symbol: string; name: string; price?: number }) => {
    setSelectedAsset(item);
    setSearchQuery(item.name);
    setShowResults(false);
    
    if (item.price) {
      setPrice(item.price.toString());
    } else {
      // Fetch fresh quotes if not present
      try {
        if (assetType === 'stock') {
          const quote = await stocksApi.getQuote(item.symbol);
          if (quote?.current_price) {
            setPrice(quote.current_price.toString());
          }
        }
      } catch (e) {
        console.error('Error fetching price', e);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAsset) {
      setErrorHeader('Please select an asset from the search listing.');
      return;
    }

    const qtyVal = parseFloat(quantity);
    const priceVal = parseFloat(price);

    if (isNaN(qtyVal) || qtyVal <= 0) {
      setErrorHeader('Quantity must be a positive number.');
      return;
    }
    if (isNaN(priceVal) || priceVal < 0) {
      setErrorHeader('Price must be a non-negative number.');
      return;
    }

    setSubmitting(true);
    setErrorHeader(null);

    try {
      await addTransaction({
        asset_type: assetType,
        symbol: selectedAsset.symbol,
        name: selectedAsset.name,
        transaction_type: txnType,
        transaction_date: date,
        quantity: qtyVal,
        price: priceVal,
        brokerage: parseFloat(brokerage) || 0,
        taxes: parseFloat(taxes) || 0,
        notes: notes || undefined,
      });
      onSuccess();
      onClose();
      resetForm();
    } catch (err: any) {
      console.error(err);
      setErrorHeader(err.response?.data?.detail || 'Failed to save transaction. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#09090b]/80 backdrop-blur-md animate-fade-in">
      <div
        className="w-full max-w-lg overflow-hidden rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col max-h-[88vh] animate-slide-up"
        style={{
          backgroundColor: 'rgba(24, 24, 27, 0.95)',
          border: '1px solid rgba(63, 63, 70, 0.4)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-800/80">
          <div>
            <h2 className="text-base font-bold text-zinc-100 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Add Transaction Record
            </h2>
            <p className="text-[11px] text-zinc-400 mt-1">Record purchases, sales or SIP schedules to track your returns.</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-zinc-800/60 hover:bg-zinc-700/80 text-zinc-400 hover:text-zinc-100 transition-all active:scale-95"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {errorHeader && (
            <div className="p-3.5 rounded-xl text-xs font-semibold bg-rose-500/10 border border-rose-500/30 text-rose-400">
              {errorHeader}
            </div>
          )}

          {/* Toggle buttons for Asset Category */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
              Asset Category
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-1 p-1 rounded-xl bg-zinc-900 border border-zinc-800">
              {[
                { type: 'stock', label: 'Stocks', color: 'text-emerald-400' },
                { type: 'mutual_fund', label: 'MFs', color: 'text-purple-400' },
                { type: 'emergency_fund', label: 'Emergency', color: 'text-blue-400' },
                { type: 'fixed_deposit', label: 'FDs', color: 'text-yellow-400' },
                { type: 'bond', label: 'Bonds', color: 'text-teal-400' },
              ].map((cat) => (
                <button
                  key={cat.type}
                  type="button"
                  className={`py-1.5 text-[10px] font-semibold rounded-lg transition-all text-center ${
                    assetType === cat.type
                      ? `bg-zinc-800 ${cat.color} font-bold shadow-sm`
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                  onClick={() => {
                    setAssetType(cat.type as any);
                    setSelectedAsset(null);
                    setSearchQuery('');
                    setSearchResults([]);
                  }}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Autocomplete Search or Manual Inputs */}
          {['stock', 'mutual_fund'].includes(assetType) ? (
            <div ref={searchContainerRef} className="space-y-1.5 relative">
              <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                Search Asset Name / Symbol
              </label>
              <div className="relative">
                <Search className="absolute left-3.5 top-3.5 text-zinc-500" size={14} />
                <input
                  type="text"
                  placeholder={assetType === 'stock' ? 'Match Reliance, TCS, HDFC, Infosys...' : 'Match Parag Parikh, SBI Equity, Nippon Growth...'}
                  className="w-full pl-10 pr-9 py-2.5 text-xs rounded-xl border border-zinc-800 focus:border-zinc-500 focus:ring-1 focus:ring-zinc-700 bg-zinc-900/60 text-zinc-100 outline-none transition-all placeholder:text-zinc-500"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    if (selectedAsset) setSelectedAsset(null);
                  }}
                  required
                />
                {selectedAsset && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="absolute right-3.5 top-3 text-zinc-500 hover:text-zinc-200"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Results popup */}
              {showResults && searchResults.length > 0 && (
                <div
                  className="absolute z-20 top-full left-0 right-0 mt-1 max-h-56 overflow-y-auto rounded-xl shadow-2xl border border-zinc-805 py-1.5"
                  style={{ backgroundColor: '#18181b' }}
                >
                  {searchResults.map((item) => (
                    <button
                      key={item.symbol}
                      type="button"
                      className="w-full text-left px-4 py-2 hover:bg-zinc-800/80 transition-all flex justify-between items-center"
                      onClick={() => handleSelectAsset(item)}
                    >
                      <div>
                        <p className="text-xs font-semibold text-zinc-200">{item.name}</p>
                        <p className="text-[10px] text-zinc-500 uppercase font-mono mt-0.5">{item.symbol}</p>
                      </div>
                      {item.price && (
                        <span className="text-xs font-mono font-bold text-zinc-400">
                          ₹{item.price.toFixed(2)}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
              {loadingSearch && (
                <div className="absolute right-3.5 top-3.5 text-[10px] text-zinc-500 animate-pulse">
                  Searching...
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                  Asset / Provider Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. HDFC Fixed Deposit"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-zinc-800 focus:border-zinc-500 focus:ring-1 focus:ring-zinc-700 bg-zinc-900/60 text-zinc-100 outline-none transition-all placeholder:text-zinc-500"
                  value={searchQuery}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSearchQuery(val);
                    setSelectedAsset({ symbol: selectedAsset?.symbol || '', name: val });
                  }}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                  Unique Symbol / Identifier
                </label>
                <input
                  type="text"
                  placeholder="e.g. HDFC_FD_01"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-zinc-800 focus:border-zinc-500 focus:ring-1 focus:ring-zinc-700 bg-zinc-900/60 text-zinc-100 outline-none transition-all placeholder:text-zinc-500"
                  value={selectedAsset?.symbol || ''}
                  onChange={(e) => {
                    const val = e.target.value.toUpperCase().replace(/\s+/g, '_');
                    setSelectedAsset({ symbol: val, name: searchQuery });
                  }}
                  required
                />
              </div>
            </div>
          )}

          {/* Row layout for Txn Type & Date */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                Transaction Type
              </label>
              <select
                className="w-full p-2.5 text-xs rounded-xl border border-zinc-800 focus:border-zinc-500 bg-zinc-900 text-zinc-100 outline-none cursor-pointer transition-all"
                value={txnType}
                onChange={(e: any) => setTxnType(e.target.value)}
              >
                <option value="BUY">BUY</option>
                <option value="SELL">SELL</option>
                {assetType === 'mutual_fund' && <option value="SIP">SIP</option>}
                <option value="DIVIDEND">DIVIDEND</option>
                <option value="BONUS">BONUS (Free Shares)</option>
                <option value="SPLIT">STOCK SPLIT</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                Transaction Date
              </label>
              <input
                type="date"
                className="w-full p-2.5 text-xs rounded-xl border border-zinc-800 focus:border-zinc-500 bg-zinc-900 text-zinc-100 outline-none transition-all"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Row layout for Qty & Price */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                {txnType === 'SPLIT' ? 'Split Ratio (e.g. 2 for 1:2 Split)' : (['stock', 'mutual_fund'].includes(assetType) ? (assetType === 'stock' ? 'Shares Quantity' : 'Fund Units') : 'Quantity / Units')}
              </label>
              <input
                type="number"
                step="any"
                placeholder={txnType === 'SPLIT' ? '2.0' : 'e.g. 10'}
                className="w-full p-2.5 text-xs rounded-xl border border-zinc-800 focus:border-zinc-500 bg-zinc-900 text-zinc-100 outline-none transition-all placeholder:text-zinc-650"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                {assetType === 'stock' ? 'Price per Share (₹)' : (assetType === 'mutual_fund' ? 'NAV value (₹)' : 'Value per Unit (₹)')}
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="any"
                  placeholder="e.g. 350.50"
                  className="w-full p-2.5 text-xs rounded-xl border border-zinc-800 focus:border-zinc-500 bg-zinc-900 text-zinc-100 outline-none transition-all placeholder:text-zinc-650 disabled:opacity-40"
                  value={price}
                  disabled={txnType === 'BONUS' || txnType === 'SPLIT'}
                  onChange={(e) => setPrice(e.target.value)}
                  required={txnType !== 'BONUS' && txnType !== 'SPLIT'}
                />
                {!price && ['stock', 'mutual_fund'].includes(assetType) && selectedAsset && (
                  <span className="absolute right-3.5 top-2.5 text-[9px] text-zinc-500 animate-pulse">Fetching quotes...</span>
                )}
              </div>
            </div>
          </div>

          {/* Charges Collapsible or Sub-fields */}
          {txnType !== 'BONUS' && txnType !== 'SPLIT' && (
            <div className="grid grid-cols-2 gap-4 pt-1">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                  Brokerage Charges (₹)
                </label>
                <input
                  type="number"
                  step="any"
                  className="w-full p-2.5 text-xs rounded-xl border border-zinc-800 focus:border-zinc-500 bg-zinc-900 text-zinc-100 outline-none transition-all"
                  value={brokerage}
                  onChange={(e) => setBrokerage(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                  STT & Stamp Taxes (₹)
                </label>
                <input
                  type="number"
                  step="any"
                  className="w-full p-2.5 text-xs rounded-xl border border-zinc-800 focus:border-zinc-500 bg-zinc-900 text-zinc-100 outline-none transition-all"
                  value={taxes}
                  onChange={(e) => setTaxes(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
              Notes (Optional)
            </label>
            <textarea
              placeholder="e.g. Purchased on dip, SIP setup, long-term portfolio accumulation..."
              rows={2}
              className="w-full p-2.5 text-xs rounded-xl border border-zinc-800 focus:border-zinc-500 bg-zinc-900 text-zinc-100 outline-none transition-all placeholder:text-zinc-650 resize-none"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </form>

        {/* Footer Actions */}
        <div className="flex justify-end gap-3 p-5 border-t border-zinc-800/80 bg-zinc-900/40">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 text-xs font-semibold rounded-xl border border-zinc-800 hover:bg-zinc-850 text-zinc-450 hover:text-zinc-200 transition-all"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="px-6 py-2.5 text-xs font-bold rounded-xl bg-emerald-500 text-black hover:bg-emerald-450 active:scale-[0.98] transition-all flex items-center gap-2"
          >
            {submitting ? 'Registering Record...' : 'Confirm Transaction'}
          </button>
        </div>
      </div>
    </div>
  );
}
