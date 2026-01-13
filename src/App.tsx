import React, { useState, useEffect } from 'react';
import { Search, Shield, User, Sword, RefreshCw, ChevronRight, LayoutGrid, List } from 'lucide-react';

const App: React.FC = () => {
  const [db, setDb] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('pilots');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/data/db.json');
        if (!response.ok) throw new Error('Failed to fetch database');
        const json = await response.json();
        setDb(json);
      } catch (err) {
        setError('データの読み込みに失敗しました。GitHub Actionsの実行完了を確認してください。');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const currentData = db?.[activeTab] || [];
  const filteredData = currentData.filter((item: any) =>
    Object.values(item).some(val => 
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0a0c10] text-white">
        <RefreshCw className="w-12 h-12 animate-spin mb-4 text-blue-500" />
        <p className="text-blue-200 animate-pulse font-mono">INITIALIZING SYSTEM...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0a0c10] text-red-400 p-4 text-center">
        <div className="max-w-md p-6 bg-red-900/10 border border-red-900/50 rounded-lg">
          <p className="font-bold mb-2">ERROR</p>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d1117] text-slate-300">
      {/* Navigation */}
      <header className="sticky top-0 z-50 bg-[#161b22]/80 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center font-bold text-white shadow-lg shadow-blue-900/40">
                M
              </div>
              <span className="text-xl font-black tracking-tighter text-white uppercase hidden sm:block">
                Mecharashi Tools
              </span>
            </div>

            <div className="flex-1 max-w-md mx-4">
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                <input
                  type="text"
                  placeholder="パイロット、機体、武器を検索..."
                  className="w-full bg-[#0d1117] border border-slate-700 rounded-md py-1.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-1 border border-slate-800 rounded p-1">
              <button 
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-slate-800 text-blue-400' : 'text-slate-500 hover:text-slate-300'}`}
              >
                <LayoutGrid size={18} />
              </button>
              <button 
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-slate-800 text-blue-400' : 'text-slate-500 hover:text-slate-300'}`}
              >
                <List size={18} />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Tabs */}
        <nav className="flex flex-wrap gap-2 mb-8" aria-label="Tabs">
          <TabItem active={activeTab === 'pilots'} icon={<User size={18}/>} label="操縦士" onClick={() => setActiveTab('pilots')} />
          <TabItem active={activeTab === 'mechs'} icon={<Shield size={18}/>} label="機体" onClick={() => setActiveTab('mechs')} />
          <TabItem active={activeTab === 'weapons'} icon={<Sword size={18}/>} label="武器" onClick={() => setActiveTab('weapons')} />
        </nav>

        {/* Content */}
        <div className={viewMode === 'grid' 
          ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" 
          : "space-y-2"
        }>
          {filteredData.length > 0 ? (
            filteredData.map((item: any, idx: number) => (
              <DataView key={idx} item={item} mode={viewMode} />
            ))
          ) : (
            <div className="col-span-full py-20 text-center bg-[#161b22] border border-dashed border-slate-800 rounded-xl">
              <p className="text-slate-500">条件に一致するデータが存在しません。</p>
            </div>
          )}
        </div>
      </main>

      <footer className="mt-20 py-10 border-t border-slate-900 bg-[#0d1117] text-center">
        <p className="text-slate-600 text-xs tracking-widest uppercase">
          Synced with Google Sheets Archive
        </p>
      </footer>
    </div>
  );
};

const TabItem = ({ active, icon, label, onClick }: any) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all border ${
      active 
        ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-900/20' 
        : 'bg-[#161b22] border-slate-800 text-slate-400 hover:border-slate-600 hover:text-slate-200'
    }`}
  >
    {icon} {label}
  </button>
);

const DataView = ({ item, mode }: any) => {
  const name = item['名前'] || item['機体名'] || item['武器名'] || 'Unknown';
  const rarity = item['レアリティ'] || 'N';
  
  const getRarityStyle = (r: string) => {
    if (r.includes('S')) return 'from-orange-500/20 to-transparent border-orange-500/50 text-orange-400';
    if (r.includes('A')) return 'from-purple-500/20 to-transparent border-purple-500/50 text-purple-400';
    return 'from-blue-500/20 to-transparent border-blue-500/50 text-blue-400';
  };

  if (mode === 'list') {
    return (
      <div className="flex items-center justify-between p-3 bg-[#161b22] hover:bg-[#1c2128] border border-slate-800 rounded transition-colors group">
        <div className="flex items-center gap-4">
          <div className={`w-1 h-8 rounded-full ${rarity.includes('S') ? 'bg-orange-500' : rarity.includes('A') ? 'bg-purple-500' : 'bg-blue-500'}`} />
          <div>
            <span className="text-white font-bold">{name}</span>
            <span className="ml-3 text-xs text-slate-500">{item['クラス'] || item['タイプ']}</span>
          </div>
        </div>
        <ChevronRight size={14} className="text-slate-700 group-hover:text-slate-400 transition-colors" />
      </div>
    );
  }

  return (
    <div className={`bg-[#161b22] border border-slate-800 rounded-xl overflow-hidden hover:border-slate-500 transition-all group flex flex-col h-full`}>
      <div className={`p-4 bg-gradient-to-br border-b ${getRarityStyle(rarity)}`}>
        <div className="flex justify-between items-start">
          <span className="text-xs font-black tracking-widest">{rarity} CLASS</span>
          <ChevronRight size={16} className="text-slate-500 group-hover:translate-x-1 transition-transform" />
        </div>
        <h3 className="text-lg font-bold mt-2 text-white leading-tight">{name}</h3>
      </div>
      <div className="p-4 flex-1 space-y-2">
        {Object.entries(item).slice(1, 6).map(([key, value]) => (
          value && key !== 'レアリティ' && (
            <div key={key} className="flex justify-between text-xs border-b border-slate-800/50 pb-1.5 last:border-0">
              <span className="text-slate-500 font-medium uppercase tracking-tighter">{key}</span>
              <span className="text-slate-300 font-mono">{String(value)}</span>
            </div>
          )
        ))}
      </div>
    </div>
  );
};

export default App;
