import React, { useState, useEffect } from 'react';
import { Search, Shield, User, Sword, RefreshCw, ChevronRight, LayoutGrid, List, AlertCircle, Database, Box, Layers, Filter, Languages, Cpu, X } from 'lucide-react';

const App: React.FC = () => {
  const [db, setDb] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('');
  const [selectedSubGroup, setSelectedSubGroup] = useState<string>('すべて');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedItem, setSelectedItem] = useState<any>(null);

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

  // タブが切り替わった際にサブグループを「すべて」にリセットする
  useEffect(() => {
    if (!db || !activeTab) return;

    if (activeTab === 'ST' || activeTab === '武器' || activeTab === 'コア') {
      setSelectedSubGroup('すべて');
    } else {
      setSelectedSubGroup('');
    }
  }, [activeTab, db]);

  // モーダル表示時のスクロール制御
  useEffect(() => {
    if (selectedItem) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [selectedItem]);

  const getTabIcon = (name: string) => {
    if (name.includes('操縦士') || name.includes('キャラST')) return <User size={18} />;
    if (name.includes('キャラ訳')) return <Languages size={18} />;
    if (name.includes('機体') || name.includes('メカ') || name.includes('ユニット')) return <Shield size={18} />;
    if (name.includes('武器')) return <Sword size={18} />;
    if (name.includes('ST')) return <Layers size={18} />;
    if (name.includes('コア')) return <Cpu size={18} />;
    return <Box size={18} />;
  };

  const sheetNames = db ? Object.keys(db) : [];
  
  // データの正規化（キャラ訳などの複数行データを統合）
  const getProcessedData = () => {
    const rawData = (db && activeTab && db[activeTab]) ? db[activeTab] : [];
    
    if (activeTab === 'キャラ訳') {
      const grouped: any[] = [];
      let currentItem: any = null;

      rawData.forEach((row: any) => {
        const name = row['名前'] || row['Name'] || Object.values(row)[0];
        if (name && String(name).trim() !== "") {
          if (currentItem) grouped.push(currentItem);
          currentItem = { ...row, _subRows: [] };
        } else if (currentItem) {
          currentItem._subRows.push(row);
        }
      });
      if (currentItem) grouped.push(currentItem);
      return grouped;
    }
    
    return rawData;
  };

  const processedData = getProcessedData();
  const currentData = (db && activeTab && db[activeTab]) ? db[activeTab] : [];
  
  // 検索フィルタリング
  const searchedItems = processedData.filter((item: any) =>
    Object.values(item).some(val => 
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    ) || (item._subRows && item._subRows.some((sub: any) => 
      Object.values(sub).some(sv => String(sv).toLowerCase().includes(searchTerm.toLowerCase()))
    ))
  );

  const renderContent = () => {
    if (searchedItems.length === 0) {
      return (
        <div className="py-20 text-center text-slate-600 bg-[#161b22] border border-dashed border-slate-800 rounded-2xl">
          <p>該当するデータが見つかりませんでした。</p>
        </div>
      );
    }

    const groupField = activeTab === 'ST' ? '免' : (activeTab === '武器' || activeTab === 'コア') ? '種別' : null;

    if (groupField) {
      const uniqueGroups = [...new Set(currentData.map((item: any) => String(item[groupField] || '未設定')))].sort();
      const allGroups = ['すべて', ...uniqueGroups];
      
      const groupFilteredItems = selectedSubGroup === 'すべて' 
        ? searchedItems 
        : searchedItems.filter((item: any) => String(item[groupField] || '未設定') === selectedSubGroup);

      return (
        <div className="space-y-6">
          {/* サブタブ選択 */}
          <div className="flex flex-wrap gap-2 p-2 bg-[#161b22] border border-slate-800 rounded-xl shadow-inner shadow-black/40">
            <div className="flex items-center gap-2 px-3 text-slate-500 border-r border-slate-800 mr-1">
              <Filter size={14} />
              <span className="text-xs font-bold uppercase tracking-wider">{groupField}選択</span>
            </div>
            {allGroups.map(group => (
              <button
                key={group}
                onClick={() => setSelectedSubGroup(group)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  selectedSubGroup === group
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40'
                    : 'text-slate-500 hover:bg-slate-800 hover:text-slate-300'
                }`}
              >
                {group}
              </button>
            ))}
          </div>

          {/* 表示 */}
          <div className={viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" : "space-y-2"}>
            {groupFilteredItems.map((item: any, i: number) => (
              <ItemCard key={i} item={item} mode={viewMode} tabName={activeTab} onSelect={setSelectedItem} />
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className={viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" : "space-y-2"}>
        {searchedItems.map((item: any, i: number) => (
          <ItemCard key={i} item={item} mode={viewMode} tabName={activeTab} onSelect={setSelectedItem} />
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#0d1117] text-slate-300 font-sans">
      <header className="sticky top-0 z-50 bg-[#161b22]/95 backdrop-blur-sm border-b border-slate-800 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4 cursor-pointer" onClick={() => window.location.reload()}>
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded flex items-center justify-center text-white font-black text-xl italic shadow-lg">
              M
            </div>
            <h1 className="text-lg font-black tracking-tighter text-white uppercase hidden md:block border-l border-slate-800 pl-4 ml-1">
              Mecharashi DB
            </h1>
          </div>

          <div className="flex-1 max-md:mx-2 mx-6">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
              <input
                type="text"
                placeholder={`${activeTab} 内を検索...`}
                className="w-full bg-[#0d1117] border border-slate-700 rounded-lg py-1.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all shadow-inner"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="flex bg-[#0d1117] border border-slate-800 rounded-md p-1 shadow-inner">
            <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded transition-colors ${viewMode === 'grid' ? 'bg-slate-800 text-blue-400 shadow-sm' : 'text-slate-500 hover:text-slate-400'}`}>
              <LayoutGrid size={18} />
            </button>
            <button onClick={() => setViewMode('list')} className={`p-1.5 rounded transition-colors ${viewMode === 'list' ? 'bg-slate-800 text-blue-400 shadow-sm' : 'text-slate-500 hover:text-slate-400'}`}>
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

      {/* 詳細モーダル */}
      {selectedItem && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm transition-all" onClick={() => setSelectedItem(null)}>
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-hidden bg-[#161b22] border border-slate-700 rounded-3xl shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-slate-800">
              <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
                {getTabIcon(activeTab)}
                {selectedItem['名前'] || selectedItem['日本名'] || selectedItem['Name'] || selectedItem['機体名'] || selectedItem['武器名'] || '詳細データ'}
              </h2>
              <button onClick={() => setSelectedItem(null)} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                {/* ステータスセクション */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {Object.entries(selectedItem).filter(([k]) => !k.startsWith('_')).map(([key, val]) => (
                    val && (
                      <div key={key} className="p-3 bg-black/20 border border-slate-800/50 rounded-xl flex flex-col gap-1">
                        <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{key}</span>
                        <span className="text-sm text-slate-200 font-medium break-words">{String(val)}</span>
                      </div>
                    )
                  ))}
                </div>

                {/* 拡張データ（サブ行） */}
                {selectedItem._subRows && selectedItem._subRows.length > 0 && (
                  <div className="space-y-4">
                    <p className="text-xs text-blue-400 font-black tracking-[0.2em] uppercase flex items-center gap-2">
                      <Database size={14} /> EXTENDED DATA
                    </p>
                    {selectedItem._subRows.map((sub: any, idx: number) => (
                      <div key={idx} className="p-4 bg-blue-900/5 border border-blue-900/20 rounded-2xl space-y-3">
                        {Object.entries(sub).map(([sk, sv]) => (
                          sv && (
                            <div key={sk} className="flex flex-col gap-1">
                              <span className="text-[10px] text-blue-500/70 font-bold uppercase">{sk}</span>
                              <span className="text-sm text-slate-300 leading-relaxed">{String(sv)}</span>
                            </div>
                          )
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="p-4 bg-black/20 text-center border-t border-slate-800">
              <button 
                onClick={() => setSelectedItem(null)}
                className="px-8 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-full text-sm font-bold transition-all border border-slate-700"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="py-12 border-t border-slate-900 bg-[#0a0c10] px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-slate-700 text-[10px] tracking-[0.4em] uppercase font-bold text-center md:text-left">
            Mecharashi dynamic archive system v2.6
          </p>
          <div className="text-[9px] text-slate-600 text-center md:text-right leading-relaxed opacity-60 hover:opacity-100 transition-opacity">
            <p>作成者：vinotamon</p>
            <p>データソース：nikoraehu2様作成</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

const NavButton = ({ active, icon, label, onClick, count }: any) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-3 px-6 py-2.5 rounded-xl text-sm font-bold transition-all border ${
      active 
        ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-900/40 translate-y-[-2px]' 
        : 'bg-[#161b22] border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
    }`}
  >
    {icon} 
    <span>{label}</span>
    {count > 0 && <span className={`text-[10px] px-1.5 py-0.5 rounded ${active ? 'bg-blue-400 text-blue-900' : 'bg-slate-800 text-slate-500'}`}>{count}</span>}
  </button>
);

const ItemCard = ({ item, mode, tabName, onSelect }: any) => {
  const itemEntries = Object.entries(item).filter(([k]) => !k.startsWith('_'));
  
  let name = '';
  if (tabName === 'ST') {
    name = item['日本名'] || item['名前'] || (itemEntries.length > 0 ? itemEntries[0][1] : 'Unknown');
  } else {
    name = item['名前'] || item['Name'] || item['機体名'] || item['武器名'] || (itemEntries.length > 0 ? itemEntries[0][1] : 'Unknown');
  }

  const rarity = item['レアリティ'] || item['Rarity'] || 'N';
  const rarityClass = rarity.includes('S') ? 'border-orange-500/30 bg-orange-500/5 text-orange-400' 
                   : rarity.includes('A') ? 'border-purple-500/30 bg-purple-500/5 text-purple-400'
                   : 'border-blue-500/30 bg-blue-500/5 text-blue-400';

  if (mode === 'list') {
    return (
      <div 
        className="flex items-center justify-between p-4 bg-[#161b22] border border-slate-800 rounded-lg hover:border-blue-500/50 hover:bg-[#1c232d] transition-all group cursor-pointer shadow-sm active:scale-[0.98]"
        onClick={() => onSelect(item)}
      >
        <div className="flex items-center gap-4">
          <div className={`w-1 h-6 rounded-full ${rarity.includes('S') ? 'bg-orange-500' : rarity.includes('A') ? 'bg-purple-500' : 'bg-blue-500'}`} />
          <span className="text-white font-bold group-hover:text-blue-400 transition-colors flex items-center gap-2">
            {name}
            {tabName === 'コア' && item['要度'] && (
              <span className="text-[10px] text-slate-500 font-normal italic">
                (要度: {item['要度']})
              </span>
            )}
          </span>
          {tabName === 'ST' && item['免'] && <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-400">免: {item['免']}</span>}
          {(tabName === '武器' || tabName === 'コア') && item['種別'] && <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-400">{item['種別']}</span>}
          {tabName === 'コア' && item['条件or効果'] && (
            <span className="text-[10px] text-blue-400 underline decoration-blue-900/50 truncate max-w-[200px] italic hidden sm:inline opacity-70">
              {item['条件or効果']}
            </span>
          )}
          {item._subRows?.length > 0 && <span className="text-[10px] text-blue-400 border border-blue-900/50 px-1.5 rounded">+{item._subRows.length} rows</span>}
        </div>
        <ChevronRight size={14} className="text-slate-700 group-hover:text-blue-500 transition-all group-hover:translate-x-1" />
      </div>
    );
  }

  return (
    <div 
      className="bg-[#161b22] border border-slate-800 rounded-2xl overflow-hidden hover:border-slate-500 transition-all flex flex-col h-full shadow-lg cursor-pointer group hover:shadow-blue-900/10 active:scale-[0.99]"
      onClick={() => onSelect(item)}
    >
      <div className={`p-4 border-b ${rarityClass}`}>
        <div className="flex justify-between items-center mb-1">
          <span className="text-[10px] font-black tracking-widest uppercase opacity-70">{rarity}</span>
          <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-1" />
        </div>
        <h3 className="text-white font-black text-lg tracking-tight group-hover:text-blue-400 transition-colors flex items-baseline gap-2">
          <span className="truncate">{name}</span>
          {tabName === 'コア' && item['要度'] && (
            <span className="text-[10px] font-bold text-slate-500 whitespace-nowrap">要度: {item['要度']}</span>
          )}
        </h3>
      </div>
      
      <div className="p-4 flex-1 overflow-hidden">
        <div className="space-y-4">
          {tabName === 'コア' && (
            <div className="space-y-3 mb-4 border-b border-slate-800/80 pb-3">
              {item['条件or効果'] && (
                <div className="flex flex-col gap-1">
                  <span className="text-slate-500 uppercase tracking-tighter font-bold text-[9px]">条件or効果</span>
                  <span className="text-blue-400 font-bold text-xs underline decoration-blue-500/40 underline-offset-4 leading-relaxed line-clamp-2">
                    {item['条件or効果']}
                  </span>
                </div>
              )}
            </div>
          )}

          <div className="space-y-2">
            {itemEntries.slice(1, 8).map(([key, val]) => (
              val && !['レアリティ', 'Rarity', 'Name', '名前', '機体名', '武器名', '日本名', '免', '種別', '条件or効果', '要度'].includes(key) && (
                <div key={key} className="flex justify-between text-[11px] border-b border-slate-800/30 pb-1.5 last:border-0">
                  <span className="text-slate-500 uppercase tracking-tighter font-bold">{key}</span>
                  <span className="text-slate-300 font-medium text-right ml-2 truncate">{String(val)}</span>
                </div>
              )
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
