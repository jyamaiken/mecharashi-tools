import React, { useState, useEffect } from 'react';
import { Search, Shield, User, Sword, RefreshCw, ChevronRight, LayoutGrid, List, AlertCircle, Database, Box, Layers } from 'lucide-react';

const App: React.FC = () => {
  const [db, setDb] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    const loadDatabase = async () => {
      try {
        const response = await fetch(`/data/db.json?t=${Date.now()}`);
        if (!response.ok) throw new Error('Database file not found');
        const data = await response.json();
        
        if (!data || Object.keys(data).length === 0) {
          throw new Error('Database is empty');
        }
        
        setDb(data);
        const firstSheet = Object.keys(data)[0];
        setActiveTab(firstSheet);
      } catch (err: any) {
        setError(err.message || 'データの読み込みに失敗しました。');
      } finally {
        setLoading(false);
      }
    };
    loadDatabase();
  }, []);

  const getTabIcon = (name: string) => {
    if (name.includes('操縦士') || name.includes('キャラ')) return <User size={18} />;
    if (name.includes('機体') || name.includes('メカ') || name.includes('ユニット')) return <Shield size={18} />;
    if (name.includes('武器')) return <Sword size={18} />;
    if (name.includes('ST')) return <Layers size={18} />;
    return <Box size={18} />;
  };

  const sheetNames = db ? Object.keys(db) : [];
  const currentData = db && activeTab ? db[activeTab] : [];
  
  // 検索フィルタリング
  const filteredItems = currentData.filter((item: any) =>
    Object.values(item).some(val => 
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  // 「ST」タブの場合のグループ化ロジック
  const renderContent = () => {
    if (filteredItems.length === 0) {
      return (
        <div className="py-20 text-center text-slate-600 bg-[#161b22] border border-dashed border-slate-800 rounded-2xl">
          <p>該当するデータが見つかりませんでした。</p>
        </div>
      );
    }

    if (activeTab === 'ST') {
      // 「免」でグループ化
      const groups: { [key: string]: any[] } = {};
      filteredItems.forEach((item: any) => {
        const groupName = item['免'] || '未設定';
        if (!groups[groupName]) groups[groupName] = [];
        groups[groupName].push(item);
      });

      // グループ名をソート（昇順）
      const sortedGroupNames = Object.keys(groups).sort();

      return (
        <div className="space-y-12">
          {sortedGroupNames.map(groupName => (
            <div key={groupName} className="space-y-4">
              <div className="flex items-center gap-3 border-l-4 border-blue-500 pl-4 py-1">
                <h2 className="text-xl font-bold text-white tracking-tight">免: {groupName}</h2>
                <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">
                  {groups[groupName].length} 件
                </span>
              </div>
              <div className={viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" : "space-y-2"}>
                {groups[groupName].map((item: any, i: number) => (
                  <ItemCard key={i} item={item} mode={viewMode} tabName={activeTab} />
                ))}
              </div>
            </div>
          ))}
        </div>
      );
    }

    // 通常の表示
    return (
      <div className={viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" : "space-y-2"}>
        {filteredItems.map((item: any, i: number) => (
          <ItemCard key={i} item={item} mode={viewMode} tabName={activeTab} />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0a0c10] text-blue-400">
        <RefreshCw className="w-12 h-12 animate-spin mb-4" />
        <p className="font-mono tracking-widest uppercase animate-pulse">Syncing Database...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d1117] text-slate-300 font-sans">
      <header className="sticky top-0 z-50 bg-[#161b22]/95 backdrop-blur-sm border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4 cursor-pointer" onClick={() => window.location.reload()}>
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded flex items-center justify-center text-white font-black text-xl italic shadow-lg">
              M
            </div>
            <h1 className="text-lg font-black tracking-tighter text-white uppercase hidden md:block">
              Mecharashi DB
            </h1>
          </div>

          <div className="flex-1 max-w-md mx-6">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
              <input
                type="text"
                placeholder={`${activeTab} 内を検索...`}
                className="w-full bg-[#0d1117] border border-slate-700 rounded-lg py-1.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="flex bg-[#0d1117] border border-slate-800 rounded-md p-1 shadow-inner">
            <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded transition-colors ${viewMode === 'grid' ? 'bg-slate-800 text-blue-400' : 'text-slate-500 hover:text-slate-400'}`}>
              <LayoutGrid size={18} />
            </button>
            <button onClick={() => setViewMode('list')} className={`p-1.5 rounded transition-colors ${viewMode === 'list' ? 'bg-slate-800 text-blue-400' : 'text-slate-500 hover:text-slate-400'}`}>
              <List size={18} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {error ? (
          <div className="bg-red-950/10 border border-red-900/30 rounded-2xl p-12 text-center text-red-400">
            <AlertCircle className="w-16 h-16 mx-auto mb-6 opacity-20" />
            <h2 className="text-xl font-bold mb-2">DATABASE ERROR</h2>
            <p className="text-sm text-red-400/70">{error}</p>
          </div>
        ) : (
          <>
            <nav className="flex flex-wrap gap-2 mb-8">
              {sheetNames.map((name) => (
                <NavButton 
                  key={name}
                  active={activeTab === name} 
                  icon={getTabIcon(name)} 
                  label={name} 
                  onClick={() => {
                    setActiveTab(name);
                    setSearchTerm('');
                  }} 
                  count={db?.[name]?.length || 0} 
                />
              ))}
            </nav>

            {renderContent()}
          </>
        )}
      </main>

      <footer className="py-16 border-t border-slate-900 text-center bg-[#0a0c10]">
        <p className="text-slate-700 text-[10px] tracking-[0.4em] uppercase font-bold">
          Mecharashi dynamic archive system v2.0
        </p>
      </footer>
    </div>
  );
};

const NavButton = ({ active, icon, label, onClick, count }: any) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-3 px-6 py-2.5 rounded-xl text-sm font-bold transition-all border ${
      active 
        ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-900/40' 
        : 'bg-[#161b22] border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
    }`}
  >
    {icon} 
    <span>{label}</span>
    {count > 0 && <span className={`text-[10px] px-1.5 py-0.5 rounded ${active ? 'bg-blue-400 text-blue-900' : 'bg-slate-800 text-slate-500'}`}>{count}</span>}
  </button>
);

const ItemCard = ({ item, mode, tabName }: any) => {
  const itemEntries = Object.entries(item);
  
  // 表示用タイトルの決定
  let name = '';
  if (tabName === 'ST') {
    name = item['日本名'] || item['名前'] || itemEntries[0][1];
  } else {
    name = item['名前'] || item['Name'] || item['機体名'] || item['武器名'] || itemEntries[0][1];
  }

  const rarity = item['レアリティ'] || item['Rarity'] || 'N';
  
  const rarityClass = rarity.includes('S') ? 'border-orange-500/30 bg-orange-500/5 text-orange-400' 
                   : rarity.includes('A') ? 'border-purple-500/30 bg-purple-500/5 text-purple-400'
                   : 'border-blue-500/30 bg-blue-500/5 text-blue-400';

  if (mode === 'list') {
    return (
      <div className="flex items-center justify-between p-4 bg-[#161b22] border border-slate-800 rounded-lg hover:border-slate-600 transition-colors group">
        <div className="flex items-center gap-4">
          <div className={`w-1 h-6 rounded-full ${rarity.includes('S') ? 'bg-orange-500' : rarity.includes('A') ? 'bg-purple-500' : 'bg-blue-500'}`} />
          <span className="text-white font-bold">{name}</span>
          {tabName === 'ST' && item['免'] && (
             <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-400">免: {item['免']}</span>
          )}
        </div>
        <ChevronRight size={14} className="text-slate-700 group-hover:text-slate-400 transition-transform group-hover:translate-x-1" />
      </div>
    );
  }

  return (
    <div className="bg-[#161b22] border border-slate-800 rounded-2xl overflow-hidden hover:border-slate-500 transition-all flex flex-col h-full shadow-lg">
      <div className={`p-4 border-b ${rarityClass}`}>
        <div className="flex justify-between items-center mb-1">
          <span className="text-[10px] font-black tracking-widest uppercase opacity-70">{rarity}</span>
          <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
        <h3 className="text-white font-black text-lg tracking-tight group-hover:text-blue-400 transition-colors line-clamp-1">{name}</h3>
      </div>
      <div className="p-4 flex-1">
        <div className="space-y-2">
          {itemEntries.slice(0, 12).map(([key, val]) => (
            val && !['レアリティ', 'Rarity', 'Name', '名前', '機体名', '武器名', '日本名'].includes(key) && (
              <div key={key} className="flex justify-between text-[11px] border-b border-slate-800/30 pb-1.5 last:border-0">
                <span className="text-slate-500 uppercase tracking-tighter font-bold">{key}</span>
                <span className="text-slate-300 font-medium text-right ml-2">{String(val)}</span>
              </div>
            )
          ))}
        </div>
      </div>
    </div>
  );
};

export default App;
