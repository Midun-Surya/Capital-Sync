import React, { useState, useEffect, useMemo } from 'react';
import { ChevronUp, ChevronDown, Trash2, Plus, Zap, ShieldCheck, Activity } from 'lucide-react';

export default function EquityLedger() {
  const [ledger, setLedger] = useState([]);
  const [totalFees, setTotalFees] = useState(0);
  const [newAsset, setNewAsset] = useState({ name: '', quantity: '', buyPrice: '' });
  const [search, setSearch] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });
  const [lastSync, setLastSync] = useState(null);

  // Initialize from LocalStorage
  useEffect(() => {
    const stored = localStorage.getItem('equityLedger');
    const storedFees = localStorage.getItem('totalFees');
    
    if (stored) {
      setLedger(JSON.parse(stored));
    } else {
      const initial = [{ id: 1, name: 'INFY', quantity: 3, buyPrice: 1305.00, currentPrice: 1305.00 }];
      setLedger(initial);
      localStorage.setItem('equityLedger', JSON.stringify(initial));
    }
    if (storedFees) setTotalFees(parseFloat(storedFees));
  }, []);

  // Persist Data
  useEffect(() => {
    localStorage.setItem('equityLedger', JSON.stringify(ledger));
    localStorage.setItem('totalFees', totalFees.toString());
  }, [ledger, totalFees]);

  // LIVE NSE FETCH ENGINE (The "Pulse")
  useEffect(() => {
    const fetchMarketData = async () => {
      if (ledger.length === 0) return;

      const updatedLedger = await Promise.all(ledger.map(async (asset) => {
        try {
          // NSE Ticker format for Yahoo is SYMBOL.NS
          const symbol = asset.name.includes('.') ? asset.name : `${asset.name}.NS`;
          const proxy = "https://api.allorigins.win/raw?url=";
          const target = `https://query1.financeapi.com/v8/finance/chart/${symbol}?interval=1m&range=1d`;
          
          const response = await fetch(proxy + encodeURIComponent(target));
          const data = await response.json();
          const livePrice = data.chart.result[0].meta.regularMarketPrice;

          return { ...asset, currentPrice: livePrice };
        } catch (err) {
          console.error("Fetch Error:", err);
          return asset; // Fallback to current state
        }
      }));

      setLedger(updatedLedger);
      setLastSync(new Date().toLocaleTimeString());
    };

    fetchMarketData(); // Immediate first fetch
    const interval = setInterval(fetchMarketData, 5000); // 5-second pulse
    return () => clearInterval(interval);
  }, [ledger.length]);

  const addAsset = () => {
    if (newAsset.name && newAsset.quantity && newAsset.buyPrice) {
      const asset = {
        id: Date.now(),
        name: newAsset.name.toUpperCase(),
        quantity: parseFloat(newAsset.quantity),
        buyPrice: parseFloat(newAsset.buyPrice),
        currentPrice: parseFloat(newAsset.buyPrice)
      };
      setLedger([...ledger, asset]);
      setNewAsset({ name: '', quantity: '', buyPrice: '' });
    }
  };

  const deleteAsset = (id) => setLedger(ledger.filter(a => a.id !== id));

  const calculateMetrics = (asset) => {
    const totalInvested = asset.quantity * asset.buyPrice;
    const currentValue = asset.quantity * asset.currentPrice;
    const plAbsolute = currentValue - totalInvested;
    return {
      totalInvested,
      currentValue,
      plAbsolute,
      plPercent: ((plAbsolute / totalInvested) * 100).toFixed(2)
    };
  };

  const portfolioStats = useMemo(() => {
    let totalInvested = 0, totalCurrent = 0;
    ledger.forEach(asset => {
      totalInvested += asset.quantity * asset.buyPrice;
      totalCurrent += asset.quantity * asset.currentPrice;
    });
    const grossPL = totalCurrent - totalInvested;
    return {
      totalInvested: totalInvested.toFixed(2),
      totalCurrent: totalCurrent.toFixed(2),
      grossPL: grossPL.toFixed(2),
      netPL: (grossPL - totalFees).toFixed(2)
    };
  }, [ledger, totalFees]);

  const sortedLedger = useMemo(() => {
    return [...ledger]
      .filter(a => a.name.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => {
        let aVal = a[sortConfig.key], bVal = b[sortConfig.key];
        return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
      });
  }, [ledger, search, sortConfig]);

  return (
    <div className="flex min-h-screen bg-[#050505] text-zinc-300 font-mono">
      {/* Sidebar: Controls */}
      <div className="w-80 bg-[#0a0a0a] border-r border-zinc-800 p-6">
        <div className="mb-8">
          <h1 className="text-blue-500 font-black tracking-tighter text-xl mb-1 flex items-center gap-2">
            <Zap size={20} fill="currentColor"/> TERMINAL_V6
          </h1>
          <p className="text-[10px] text-zinc-600 uppercase tracking-widest">High Frequency Sync</p>
        </div>

        <div className="space-y-6">
          <section>
            <h2 className="text-[10px] text-zinc-500 uppercase mb-3 font-bold">New Position</h2>
            <div className="space-y-2">
              <input type="text" placeholder="TICKER (e.g. RELIANCE)" value={newAsset.name} onChange={e => setNewAsset({...newAsset, name: e.target.value})} className="w-full bg-zinc-900 border border-zinc-800 p-2 text-xs focus:border-blue-500 outline-none rounded" />
              <input type="number" placeholder="QTY" value={newAsset.quantity} onChange={e => setNewAsset({...newAsset, quantity: e.target.value})} className="w-full bg-zinc-900 border border-zinc-800 p-2 text-xs focus:border-blue-500 outline-none rounded" />
              <input type="number" placeholder="BUY_PRICE" value={newAsset.buyPrice} onChange={e => setNewAsset({...newAsset, buyPrice: e.target.value})} className="w-full bg-zinc-900 border border-zinc-800 p-2 text-xs focus:border-blue-500 outline-none rounded" />
              <button onClick={addAsset} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded text-xs transition">EXECUTE_TRADE</button>
            </div>
          </section>

          <section className="pt-6 border-t border-zinc-900">
            <h2 className="text-[10px] text-zinc-500 uppercase mb-3 font-bold">Friction (Fees)</h2>
            <input type="number" value={totalFees} onChange={e => setTotalFees(parseFloat(e.target.value) || 0)} className="w-full bg-zinc-900 border border-zinc-800 p-2 text-xs text-rose-400 outline-none rounded" />
          </section>
        </div>
      </div>

      {/* Main Panel */}
      <div className="flex-1 p-8 overflow-y-auto">
        <header className="flex justify-between items-end mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Activity size={14} className="text-emerald-500 animate-pulse" />
              <span className="text-[10px] text-zinc-500 uppercase">Live Market Feed</span>
            </div>
            <h2 className="text-4xl font-bold text-white tracking-tighter">₹{portfolioStats.totalCurrent}</h2>
            <p className="text-[10px] text-zinc-600 mt-1">LAST_SYNC: {lastSync || 'CONNECTING...'}</p>
          </div>
          
          <div className="grid grid-cols-2 gap-8 text-right">
            <div>
              <span className="text-[10px] text-zinc-500 block">GROSS_PL</span>
              <span className={`text-xl font-bold ${parseFloat(portfolioStats.grossPL) >= 0 ? 'text-emerald-400' : 'text-rose-500'}`}>
                {parseFloat(portfolioStats.grossPL) >= 0 ? '+' : ''}{portfolioStats.grossPL}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-zinc-500 block">NET_SURPLUS</span>
              <span className={`text-xl font-bold ${parseFloat(portfolioStats.netPL) >= 0 ? 'text-emerald-400' : 'text-rose-500'}`}>
                {parseFloat(portfolioStats.netPL) >= 0 ? '+' : ''}{portfolioStats.netPL}
              </span>
            </div>
          </div>
        </header>

        <div className="bg-[#0a0a0a] border border-zinc-800 rounded-lg overflow-hidden">
          <table className="w-full text-[11px] text-left">
            <thead className="bg-zinc-900/50 text-zinc-500 uppercase border-b border-zinc-800">
              <tr>
                <th className="p-4">Ticker</th>
                <th className="p-4">Qty</th>
                <th className="p-4">Entry</th>
                <th className="p-4">LTP</th>
                <th className="p-4">P&L (Abs)</th>
                <th className="p-4">P&L (%)</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedLedger.map(asset => {
                const m = calculateMetrics(asset);
                const isUp = m.plAbsolute >= 0;
                return (
                  <tr key={asset.id} className="border-b border-zinc-900 hover:bg-zinc-800/20 transition">
                    <td className="p-4 font-bold text-white">{asset.name}</td>
                    <td className="p-4 text-zinc-500">{asset.quantity}</td>
                    <td className="p-4 text-zinc-500">₹{asset.buyPrice.toFixed(2)}</td>
                    <td className="p-4 text-blue-400 font-bold">₹{asset.currentPrice.toFixed(2)}</td>
                    <td className={`p-4 font-bold ${isUp ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {isUp ? '+' : ''}{m.plAbsolute.toFixed(2)}
                    </td>
                    <td className={`p-4 font-bold ${isUp ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {m.plPercent}%
                    </td>
                    <td className="p-4 text-center">
                      <button onClick={() => deleteAsset(asset.id)} className="text-zinc-700 hover:text-rose-500 transition">
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}