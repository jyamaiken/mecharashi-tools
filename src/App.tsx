import React, { useState, useEffect } from 'react';
import { Search, Shield, User, Sword, RefreshCw, ChevronRight, LayoutGrid, List, AlertCircle, Database } from 'lucide-react';

const App: React.FC = () => {
  const [db, setDb] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('pilots');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    const loadDatabase = async () => {
      try {
        // キャッシュを避けるためにタイムスタンプを付与
        const response = await fetch(`/data/db.json?t=${Date.now()}`);
        if (!response.ok) throw new Error('Database file not found');
        const data = await response.json();
        
        // データ構造のチェック
        if (!data || Object.keys(data).length === 0) {
          throw new Error('Database is empty');
        }
        
        setDb(data);
      } catch (err: any) {
        setError(err.message || 'データの読み込みに失敗しました。');
      } finally {
        setLoading(false);
      }
    };
    loadDatabase();
  }, []);

  const currentData = db?.[activeTab] || [];
  const filteredItems = currentData.filter((item: any) =>
    Object.values(item).some(val => 
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0a0c10] text-blue-400">
        <RefreshCw className="w-12 h-12 animate-spin mb-4" />
        <p className="font-mono tracking-widest uppercase animate-pulse">Accessing Mecharashi Database...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d1117] text-slate-300 font-sans">
      <header className="sticky top-0 z-50 bg-[#161b22]/95 backdrop-blur-sm border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
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
                placeholder="キーワードで検索..."
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
            <p className="text-sm text-red-400/70 mb-6">{error}</p>
            <div className="bg-black/40 p-4 rounded-lg text-left text-xs font-mono inline-block max-w-lg mx-auto">
              <p>解決策:</p>
              <ul className="list-disc ml-4 mt-2 space-y-1">
                <li>GitHubリポジトリの public/data/db.json が空でないか確認してください。</li>
                <li>スプレッドシートのGID設定が正しいか scripts/sync_sheets.py を確認してください。</li>
                <li>GitHub Actions が正常に終了しているか確認してください。</li>
              </ul>
            </div>
          </div>
        ) : (
          <>
            <nav className="flex flex-wrap gap-2 mb-8">
              <NavButton active={activeTab === 'pilots'} icon={<User size={18}/>} label="操縦士" onClick={() => setActiveTab('pilots')} count={db?.['pilots']?.length || 0} />
              <NavButton active={activeTab === 'mechs'} icon={<Shield size={18}/>} label="機体" onClick={() => setActiveTab('mechs')} count={db?.['mechs']?.length || 0} />
              <NavButton active={activeTab === 'weapons'} icon={<Sword size={18}/>} label="武器" onClick={() => setActiveTab('weapons')} count={db?.['weapons']?.length || 0} />
            </nav>

            {filteredItems.length === 0 && currentData.length > 0 ? (
                <div className="py-20 text-center text-slate-600 bg-[#161b22] border border-dashed border-slate-800 rounded-2xl">
                   <p>検索結果が見つかりませんでした。</p>
                </div>
            ) : currentData.length === 0 ? (
                <div className="py-20 text-center text-slate-500 bg-[#161b22]/50 border border-slate-800 rounded-2xl">
                   <Database className="w-12 h-12 mx-auto mb-4 opacity-10" />
                   <p className="font-bold text-slate-400">NO DATA FOUND IN "{activeTab.toUpperCase()}"</p>
                   <p className="text-xs mt-1">スプレッドシートのGIDが正しいか、データが入力されているか確認してください。</p>
                </div>
            ) : (
              <div className={viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" : "space-y-2"}>
                {filteredItems.map((item, i) => (
                  <ItemCard key={i} item={item} mode={viewMode} />
                ))}
              </div>
            )}
          </>
        )}
      </main>

      <footer className="py-16 border-t border-slate-900 text-center bg-[#0a0c10]">
        <p className="text-slate-700 text-[10px] tracking-[0.4em] uppercase font-bold">
          Encrypted Data Link :: Mecharashi STACS System
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

const ItemCard = ({ item, mode }: any) => {
  // スプレッドシートのカラム名が「名前」でも「Name」でも動くように調整
  const name = item['名前'] || item['Name'] || item['機体名'] || item['武器名'] || Object.values(item)[0] || 'Unknown';
  const rarity = item['レアリティ'] || item['Rarity'] || 'N';
  
  const rarityClass = rarity.includes('S') ? 'border-orange-500/30 bg-orange-500/5 text-orange-400' 
                   : rarity.includes('A') ? 'border-purple-500/30 bg-purple-500/5 text-purple-400'
                   : 'border-blue-500/30 bg-blue-500/5 text-blue-400';

  if (mode === 'list') {
    return (
      <div className="flex items-center justify-between p-4 bg-[#161b22] border border-slate-800 rounded-lg hover:border-slate-600 transition-colors group cursor-pointer">
        <div className="flex items-center gap-4">
          <div className={`w-1 h-6 rounded-full ${rarity.includes('S') ? 'bg-orange-500' : rarity.includes('A') ? 'bg-purple-500' : 'bg-blue-500'}`} />
          <span className="text-white font-bold">{name}</span>
          <span className="text-xs text-slate-500 hidden sm:inline">{item['クラス'] || item['タイプ'] || item['Class']}</span>
        </div>
        <ChevronRight size={14} className="text-slate-700 group-hover:text-slate-400 transition-transform group-hover:translate-x-1" />
      </div>
    );
  }

  return (
    <div className="bg-[#161b22] border border-slate-800 rounded-2xl overflow-hidden hover:border-slate-500 transition-all flex flex-col group h-full shadow-lg hover:shadow-blue-900/5">
      <div className={`p-4 border-b ${rarityClass}`}>
        <div className="flex justify-between items-center mb-1">
          <span className="text-[10px] font-black tracking-widest uppercase opacity-70">{rarity} TYPE</span>
          <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
        <h3 className="text-white font-black text-lg tracking-tight group-hover:text-blue-400 transition-colors">{name}</h3>
      </div>
      <div className="p-4 flex-1">
        <div className="space-y-2">
          {Object.entries(item).slice(1, 8).map(([key, val]) => (
            val && !['レアリティ', 'Rarity', 'Name', '名前'].includes(key) && (
              <div key={key} className="flex justify-between text-[11px] border-b border-slate-800/30 pb-1.5 last:border-0">
                <span className="text-slate-500 uppercase tracking-tighter font-bold">{key}</span>
                <span className="text-slate-300 font-medium">{String(val)}</span>
              </div>
            )
          ))}
        </div>
      </div>
    </div>
  );
};

export default App;
