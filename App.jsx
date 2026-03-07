import React, { useState, useEffect } from 'react';
import { ChevronUp, ChevronDown, Trash2, Plus } from 'lucide-react';

export default function EquityLedger() {
  const [ledger, setLedger] = useState([]);
  const [totalFees, setTotalFees] = useState(0);
  const [newAsset, setNewAsset] = useState({ name: '', quantity: '', buyPrice: '' });
  const [search, setSearch] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });

  // Initialize with localStorage
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
    
    if (storedFees) {
      setTotalFees(parseFloat(storedFees));
    }
  }, []);

  // Persist ledger to localStorage
  useEffect(() => {
    localStorage.setItem('equityLedger', JSON.stringify(ledger));
  }, [ledger]);

  // Persist fees to localStorage
  useEffect(() => {
    localStorage.setItem('totalFees', totalFees.toString());
  }, [totalFees]);

  // Live tick simulation - fluctuate market prices
  useEffect(() => {
    const interval = setInterval(() => {
      setLedger(prev =>
        prev.map(asset => ({
          ...asset,
          currentPrice: asset.currentPrice * (1 + (Math.random() - 0.5) * 0.001)
        }))
      );
    }, 3000);

    return () => clearInterval(interval);
  }, []);

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

  const deleteAsset = (id) => {
    setLedger(ledger.filter(asset => asset.id !== id));
  };

  const calculateMetrics = (asset) => {
    const totalInvested = asset.quantity * asset.buyPrice;
    const currentValue = asset.quantity * asset.currentPrice;
    const plAbsolute = currentValue - totalInvested;
    const plPercent = ((plAbsolute / totalInvested) * 100).toFixed(2);

    return {
      totalInvested: totalInvested.toFixed(2),
      currentValue: currentValue.toFixed(2),
      plAbsolute: plAbsolute.toFixed(2),
      plPercent
    };
  };

  const filteredLedger = ledger.filter(asset =>
    asset.name.toLowerCase().includes(search.toLowerCase())
  );

  const sortedLedger = [...filteredLedger].sort((a, b) => {
    let aVal = a[sortConfig.key];
    let bVal = b[sortConfig.key];

    if (sortConfig.key === 'name') {
      aVal = a.name;
      bVal = b.name;
    } else if (['totalInvested', 'currentValue', 'plAbsolute', 'plPercent'].includes(sortConfig.key)) {
      const metricsA = calculateMetrics(a);
      const metricsB = calculateMetrics(b);
      aVal = parseFloat(metricsA[sortConfig.key]);
      bVal = parseFloat(metricsB[sortConfig.key]);
    } else {
      aVal = parseFloat(aVal);
      bVal = parseFloat(bVal);
    }

    return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
  });

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Calculate portfolio stats
  const portfolioStats = (() => {
    let totalInvested = 0;
    let totalCurrent = 0;
    let totalPL = 0;

    ledger.forEach(asset => {
      const metrics = calculateMetrics(asset);
      totalInvested += parseFloat(metrics.totalInvested);
      totalCurrent += parseFloat(metrics.currentValue);
      totalPL += parseFloat(metrics.plAbsolute);
    });

    const netPL = totalPL - totalFees;

    return {
      totalInvested: totalInvested.toFixed(2),
      totalCurrent: totalCurrent.toFixed(2),
      grossPL: totalPL.toFixed(2),
      netPL: netPL.toFixed(2),
      portfolioValue: totalCurrent.toFixed(2)
    };
  })();

  const SortButton = ({ label, sortKey }) => (
    <button
      onClick={() => handleSort(sortKey)}
      className="flex items-center gap-1 hover:text-cyan-300 transition-colors font-semibold"
    >
      {label}
      <div className="flex flex-col gap-0.5">
        <ChevronUp size={12} className={sortConfig.key === sortKey && sortConfig.direction === 'asc' ? 'text-cyan-400 animate-pulse' : 'text-gray-500'} />
        <ChevronDown size={12} className={sortConfig.key === sortKey && sortConfig.direction === 'desc' ? 'text-cyan-400 animate-pulse' : 'text-gray-500'} />
      </div>
    </button>
  );

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 25%, #1a1a2e 50%, #16213e 75%, #0a0e27 100%)',
      color: '#e2e8f0',
      fontFamily: 'monospace'
    }}>
      {/* Main Content */}
      <div style={{ flex: 1, overflow: 'auto', background: 'linear-gradient(to bottom, rgba(15, 23, 42, 0.8), rgba(30, 41, 59, 0.9))' }}>
        <div style={{ padding: '24px' }}>
          {/* Search Bar */}
          <div className="mb-6">
            <input
              type="text"
              placeholder="Search stocks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-4 py-3 bg-gradient-to-r from-slate-800 to-slate-700 border-2 border-purple-500/30 rounded-lg text-gray-100 placeholder-gray-400 focus:outline-none focus:border-cyan-400 focus:shadow-lg focus:shadow-cyan-400/20 transition-all"
            />
          </div>

          {/* Ledger Table */}
          <div className="overflow-x-auto rounded-lg border border-purple-500/20 shadow-lg shadow-purple-500/10">
            <table className="w-full text-sm">
              <thead className="bg-gradient-to-r from-slate-800 via-purple-800 to-slate-800 border-b border-purple-500/20 sticky top-0">
                <tr>
                  <th className="px-4 py-4 text-left font-bold text-purple-300">
                    <SortButton label="Stock" sortKey="name" />
                  </th>
                  <th className="px-4 py-4 text-right font-bold text-cyan-300">
                    <SortButton label="Qty" sortKey="quantity" />
                  </th>
                  <th className="px-4 py-4 text-right font-bold text-cyan-300">
                    <SortButton label="Buy Price" sortKey="buyPrice" />
                  </th>
                  <th className="px-4 py-4 text-right font-bold text-cyan-300">
                    <SortButton label="Current Price" sortKey="currentPrice" />
                  </th>
                  <th className="px-4 py-4 text-right font-bold text-orange-300">
                    <SortButton label="Total Invested" sortKey="totalInvested" />
                  </th>
                  <th className="px-4 py-4 text-right font-bold text-blue-300">
                    <SortButton label="Current Value" sortKey="currentValue" />
                  </th>
                  <th className="px-4 py-4 text-right font-bold text-green-300">
                    <SortButton label="P&L (₹)" sortKey="plAbsolute" />
                  </th>
                  <th className="px-4 py-4 text-right font-bold text-green-300">
                    <SortButton label="P&L (%)" sortKey="plPercent" />
                  </th>
                  <th className="px-4 py-4 text-center font-bold text-red-300">Action</th>
                </tr>
              </thead>
              <tbody>
                {sortedLedger.map((asset) => {
                  const metrics = calculateMetrics(asset);
                  const isPositivepl = parseFloat(metrics.plAbsolute) >= 0;

                  return (
                    <tr key={asset.id} className="border-b border-purple-500/10 hover:bg-gradient-to-r hover:from-purple-900/30 hover:to-cyan-900/30 transition-all duration-200">
                      <td className="px-4 py-4 font-bold text-purple-200">{asset.name}</td>
                      <td className="px-4 py-4 text-right text-cyan-200">{asset.quantity.toFixed(0)}</td>
                      <td className="px-4 py-4 text-right text-cyan-200">₹{asset.buyPrice.toFixed(2)}</td>
                      <td className="px-4 py-4 text-right text-cyan-200">₹{asset.currentPrice.toFixed(2)}</td>
                      <td className="px-4 py-4 text-right text-orange-200">₹{metrics.totalInvested}</td>
                      <td className="px-4 py-4 text-right text-blue-200">₹{metrics.currentValue}</td>
                      <td className={`px-4 py-4 text-right font-bold ${isPositivepl ? 'text-green-400' : 'text-red-400'}`}>
                        ₹{metrics.plAbsolute}
                      </td>
                      <td className={`px-4 py-4 text-right font-bold ${isPositivepl ? 'text-green-400' : 'text-red-400'}`}>
                        {metrics.plPercent}%
                      </td>
                      <td className="px-4 py-4 text-center">
                        <button
                          onClick={() => deleteAsset(asset.id)}
                          className="p-2 hover:bg-red-500/20 rounded-lg transition-all text-red-400 hover:text-red-300 hover:shadow-lg hover:shadow-red-500/20"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Portfolio Stats */}
          <div style={{ marginTop: '32px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={{
              background: 'linear-gradient(135deg, rgba(194, 120, 49, 0.3) 0%, rgba(194, 120, 49, 0.1) 100%)',
              border: '2px solid rgba(234, 179, 8, 0.4)',
              borderRadius: '8px',
              padding: '16px',
              boxShadow: '0 0 20px rgba(234, 179, 8, 0.2)'
            }}>
              <div style={{ fontSize: '12px', color: '#fed7aa', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px' }}>Total Invested</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#fbbf24', marginTop: '8px' }}>₹{portfolioStats.totalInvested}</div>
            </div>
            <div style={{
              background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.3) 0%, rgba(37, 99, 235, 0.1) 100%)',
              border: '2px solid rgba(59, 130, 246, 0.4)',
              borderRadius: '8px',
              padding: '16px',
              boxShadow: '0 0 20px rgba(59, 130, 246, 0.2)'
            }}>
              <div style={{ fontSize: '12px', color: '#93c5fd', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px' }}>Portfolio Value</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#60a5fa', marginTop: '8px' }}>₹{portfolioStats.portfolioValue}</div>
            </div>
            {parseFloat(portfolioStats.grossPL) >= 0 ? (
              <div style={{
                background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.3) 0%, rgba(34, 197, 94, 0.1) 100%)',
                border: '2px solid rgba(34, 197, 94, 0.4)',
                borderRadius: '8px',
                padding: '16px',
                boxShadow: '0 0 20px rgba(34, 197, 94, 0.3)'
              }}>
                <div style={{ fontSize: '12px', color: '#86efac', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px' }}>Gross P&L</div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#4ade80', marginTop: '8px' }}>₹{portfolioStats.grossPL}</div>
              </div>
            ) : (
              <div style={{
                background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.3) 0%, rgba(239, 68, 68, 0.1) 100%)',
                border: '2px solid rgba(239, 68, 68, 0.4)',
                borderRadius: '8px',
                padding: '16px',
                boxShadow: '0 0 20px rgba(239, 68, 68, 0.3)'
              }}>
                <div style={{ fontSize: '12px', color: '#fca5a5', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px' }}>Gross P&L</div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ef4444', marginTop: '8px' }}>₹{portfolioStats.grossPL}</div>
              </div>
            )}
            {parseFloat(portfolioStats.netPL) >= 0 ? (
              <div style={{
                background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.3) 0%, rgba(34, 197, 94, 0.1) 100%)',
                border: '2px solid rgba(34, 197, 94, 0.4)',
                borderRadius: '8px',
                padding: '16px',
                boxShadow: '0 0 20px rgba(34, 197, 94, 0.3)'
              }}>
                <div style={{ fontSize: '12px', color: '#86efac', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px' }}>Net P&L (After Fees)</div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#4ade80', marginTop: '8px' }}>₹{portfolioStats.netPL}</div>
              </div>
            ) : (
              <div style={{
                background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.3) 0%, rgba(239, 68, 68, 0.1) 100%)',
                border: '2px solid rgba(239, 68, 68, 0.4)',
                borderRadius: '8px',
                padding: '16px',
                boxShadow: '0 0 20px rgba(239, 68, 68, 0.3)'
              }}>
                <div style={{ fontSize: '12px', color: '#fca5a5', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px' }}>Net P&L (After Fees)</div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ef4444', marginTop: '8px' }}>₹{portfolioStats.netPL}</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div className="w-80 bg-gradient-to-b from-slate-800 to-purple-900 border-l border-purple-500/20 p-6 overflow-y-auto shadow-lg shadow-purple-500/10">
        {/* Add Asset Form */}
        <div className="mb-8">
          <h2 className="text-lg font-bold text-purple-200 mb-4 uppercase tracking-widest">Add Asset</h2>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Stock Name"
              value={newAsset.name}
              onChange={(e) => setNewAsset({ ...newAsset, name: e.target.value })}
              className="w-full px-3 py-2 bg-slate-700/50 border-2 border-purple-500/30 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:border-cyan-400 focus:shadow-lg focus:shadow-cyan-400/20 transition-all text-sm"
            />
            <input
              type="number"
              placeholder="Quantity"
              value={newAsset.quantity}
              onChange={(e) => setNewAsset({ ...newAsset, quantity: e.target.value })}
              className="w-full px-3 py-2 bg-slate-700/50 border-2 border-purple-500/30 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:border-cyan-400 focus:shadow-lg focus:shadow-cyan-400/20 transition-all text-sm"
            />
            <input
              type="number"
              placeholder="Buy Price"
              value={newAsset.buyPrice}
              onChange={(e) => setNewAsset({ ...newAsset, buyPrice: e.target.value })}
              className="w-full px-3 py-2 bg-slate-700/50 border-2 border-purple-500/30 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:border-cyan-400 focus:shadow-lg focus:shadow-cyan-400/20 transition-all text-sm"
            />
            <button
              onClick={addAsset}
              className="w-full px-4 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-slate-900 font-bold rounded-lg transition-all shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 flex items-center justify-center gap-2"
            >
              <Plus size={18} /> Add Asset
            </button>
          </div>
        </div>

        {/* Friction Tracker */}
        <div className="border-t border-purple-500/20 pt-6">
          <h2 className="text-lg font-bold text-orange-200 mb-4 uppercase tracking-widest">Friction Tracker</h2>
          <div>
            <label className="text-xs text-orange-300 uppercase tracking-wider font-semibold">Total Fees (₹)</label>
            <input
              type="number"
              value={totalFees}
              onChange={(e) => setTotalFees(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 mt-2 bg-orange-900/30 border-2 border-orange-500/30 rounded-lg text-orange-200 placeholder-orange-600 focus:outline-none focus:border-orange-400 focus:shadow-lg focus:shadow-orange-400/20 transition-all text-sm"
            />
          </div>
        </div>

        {/* Summary Stats */}
        <div className="border-t border-purple-500/20 mt-6 pt-6">
          <h2 className="text-lg font-bold text-green-200 mb-4 uppercase tracking-widest">Summary</h2>
          <div className="space-y-3 text-sm bg-slate-700/30 rounded-lg p-4 border border-purple-500/20">
            <div className="flex justify-between">
              <span className="text-gray-300">Gross P&L:</span>
              <span className={parseFloat(portfolioStats.grossPL) >= 0 ? 'text-green-400 font-bold' : 'text-red-400 font-bold'}>
                ₹{portfolioStats.grossPL}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Fees:</span>
              <span className="text-red-400 font-semibold">-₹{totalFees.toFixed(2)}</span>
            </div>
            <div className="border-t border-purple-500/20 pt-3 flex justify-between font-bold">
              <span className="text-gray-100">Net P&L:</span>
              <span className={parseFloat(portfolioStats.netPL) >= 0 ? 'text-green-400' : 'text-red-400'}>
                ₹{portfolioStats.netPL}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
