import React, { useState, useEffect } from 'react';
import { Search, Shield, User, Sword, RefreshCw, ChevronRight, LayoutGrid, List, AlertCircle, Database, Box, Layers, Filter, Languages, Cpu } from 'lucide-react';

const App = () => {
  const [db, setDb] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('');
  const [selectedSubGroup, setSelectedSubGroup] = useState('すべて');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grid');

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
      } catch (err) {
        setError(err.message || 'データの読み込みに失敗しました。');
      } finally {
        setLoading(false);
      }
    };
    loadDatabase();
  }, []);

  useEffect(() => {
    if (!db || !activeTab) return;

    if (activeTab === 'ST' || activeTab === '武器' || activeTab === 'コア') {
      setSelectedSubGroup('すべて');
    } else {
      setSelectedSubGroup('');
    }
  }, [activeTab, db]);

  const getTabIcon = (name) => {
    if (name.includes('操縦士') || name.includes('キャラST')) return <User size={18} />;
    if (name.includes('キャラ訳')) return <Languages size={18} />;
    if (name.includes('機体') || name.includes('メカ') || name.includes('ユニット')) return <Shield size={18} />;
    if (name.includes('武器')) return <Sword size={18} />;
    if (name.includes('ST')) return <Layers size={18} />;
    if (name.includes('コア')) return <Cpu size={18} />;
    return <Box size={18} />;
  };

  const sheetNames = db ? Object.keys(db) : [];
  
  // データの正規化ロジック
  const getProcessedData = () => {
    const rawData = (db && activeTab && db[activeTab]) ? db[activeTab] : [];
    if (rawData.length === 0) return [];

    let dataToProcess = rawData;
    let keyMapping = null;

    // 1. キャラSTのみ：2行にわたるヘッダーを統合
    if (activeTab === 'キャラST' && rawData.length > 1) {
      const subHeaderRow = rawData[0];
      dataToProcess = rawData.slice(1);
      
      keyMapping = {};
      let lastValidMainHeader = '';

      Object.keys(subHeaderRow).forEach(key => {
        // メインヘッダーの特定 (Unnamed対策)
        if (!key.includes('Unnamed')) {
          lastValidMainHeader = key;
        }
        const subHeaderValue = String(subHeaderRow[key] || '').trim();
        
        // 統合キーの作成 (例: ST_名前、名前_トワイライトなど)
        if (subHeaderValue && subHeaderValue !== lastValidMainHeader) {
          keyMapping[key] = `${lastValidMainHeader}_${subHeaderValue}`;
        } else {
          keyMapping[key] = lastValidMainHeader;
        }
      });
    }

    // 2. データの正規化と独立処理
    return dataToProcess.map((row) => {
      const normalizedRow = {};
      Object.keys(row).forEach(key => {
        const newKey = keyMapping ? (keyMapping[key] || key) : key;
        normalizedRow[newKey] = row[key];
      });
      return normalizedRow;
    });
  };

  const processedData = getProcessedData();
  const currentData = (db && activeTab && db[activeTab]) ? db[activeTab] : [];
  
  const searchedItems = processedData.filter((item) =>
    Object.values(item).some(val => 
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    )
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
      const uniqueGroups = [...new Set(currentData.map((item) => String(item[groupField] || '未設定')))].sort();
      const allGroups = ['すべて', ...uniqueGroups];
      
      const groupFilteredItems = selectedSubGroup === 'すべて' 
        ? searchedItems 
        : searchedItems.filter((item) => String(item[groupField] || '未設定') === selectedSubGroup);

      return (
        <div className="space-y-6">
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

          <div className={viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" : "space-y-2"}>
            {groupFilteredItems.map((item, i) => (
              <ItemCard key={i} item={item} mode={viewMode} tabName={activeTab} />
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className={viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" : "space-y-2"}>
        {searchedItems.map((item, i) => (
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

      <footer className="py-12 border-t border-slate-900 bg-[#0a0c10] px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-slate-700 text-[10px] tracking-[0.4em] uppercase font-bold text-center md:text-left">
            Mecharashi dynamic archive system v3.0
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

const NavButton = ({ active, icon, label, onClick, count }) => (
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

const ItemCard = ({ item, mode, tabName }) => {
  const itemEntries = Object.entries(item).filter(([k]) => !k.startsWith('_'));
  
  // 「名前」に関連するキーを動的に探す
  const findNameKey = (obj) => {
    // キャラSTの場合は「名前」や「Name」を含むキーを優先的に探す
    return Object.keys(obj).find(k => k.includes('名前') || k.includes('Name')) || null;
  };

  const nameKey = findNameKey(item);

  // 名前とレアリティの特定
  const getName = (obj) => {
    if (tabName === 'キャラST' && nameKey) {
      return obj[nameKey] || 'Unknown';
    }
    return obj['名前'] || obj['Name'] || obj['日本名'] || obj['機体名'] || obj['武器名'] ||
           obj['基本情報_名前'] || obj['基本情報_Name'] || obj['基本情報_日本名'] ||
           (Object.values(obj).find(v => v && typeof v === 'string' && v.length > 1) || 'Unknown');
  };

  const name = getName(item);
  const rarity = item['レアリティ'] || item['Rarity'] || item['基本情報_レアリティ'] || 'N';
  const rarityClass = String(rarity).includes('S') ? 'border-orange-500/30 bg-orange-500/5 text-orange-400' 
                   : String(rarity).includes('A') ? 'border-purple-500/30 bg-purple-500/5 text-purple-400'
                   : 'border-blue-500/30 bg-blue-500/5 text-blue-400';

  // 情報として表示するキーのフィルタリング
  const displayEntries = itemEntries.filter(([key]) => {
    if (tabName === 'キャラST') {
      // タイトルに使用したキー(nameKey)とレアリティ関連を詳細情報から除外
      return key !== nameKey && !key.includes('レアリティ') && !key.includes('Rarity');
    }
    return !['レアリティ', 'Rarity', 'Name', '名前', '機体名', '武器名', '日本名'].includes(key);
  });

  if (mode === 'list') {
    return (
      <div className="bg-[#161b22] border border-slate-800 rounded-lg p-4 transition-all shadow-sm">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-1 h-6 rounded-full ${String(rarity).includes('S') ? 'bg-orange-500' : String(rarity).includes('A') ? 'bg-purple-500' : 'bg-blue-500'}`} />
              <span className="text-white font-bold flex items-center gap-2">
                {name}
                {tabName === 'コア' && item['要度'] && (
                  <span className="text-[10px] text-slate-500 font-normal italic">(要度: {item['要度']})</span>
                )}
              </span>
              {item['免'] && <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-400">免: {item['免']}</span>}
              {item['種別'] && <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-400">{item['種別']}</span>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-2 pt-2 border-t border-slate-800/50">
             {displayEntries.map(([key, val]) => (
                <div key={key} className="flex justify-between text-[11px] border-b border-slate-800/30 pb-1">
                  <span className="text-slate-500 font-bold uppercase tracking-tighter">{key}</span>
                  <span className="text-slate-300 ml-4 text-right">{val !== undefined && val !== null ? String(val) : ''}</span>
                </div>
             ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#161b22] border border-slate-800 rounded-2xl overflow-hidden hover:border-slate-500 transition-all flex flex-col h-full shadow-lg group">
      <div className={`p-4 border-b ${rarityClass}`}>
        <div className="flex justify-between items-center mb-1">
          <span className="text-[10px] font-black tracking-widest uppercase opacity-70">{rarity}</span>
          <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-1" />
        </div>
        <h3 className="text-white font-black text-lg tracking-tight flex items-baseline gap-2">
          <span className="truncate">{name}</span>
          {tabName === 'コア' && item['要度'] && (
            <span className="text-[10px] font-bold text-slate-500 whitespace-nowrap">要度: {item['要度']}</span>
          )}
        </h3>
      </div>
      
      <div className="p-4 flex-1">
        <div className="space-y-4">
          {item['条件or効果'] && (
            <div className="space-y-1 mb-4 border-b border-slate-800/80 pb-3">
              <span className="text-slate-500 uppercase tracking-tighter font-bold text-[9px]">条件or効果</span>
              <span className="text-blue-400 font-bold text-xs underline decoration-blue-500/40 underline-offset-4 leading-relaxed block">
                {item['条件or効果']}
              </span>
            </div>
          )}

          <div className="space-y-2">
            {displayEntries.map(([key, val]) => (
              !['免', '種別', '条件or効果', '要度'].includes(key) && (
                <div key={key} className="flex justify-between text-[11px] border-b border-slate-800/30 pb-1.5 last:border-0">
                  <span className="text-slate-500 uppercase tracking-tighter font-bold leading-tight mr-2">{key}</span>
                  <span className="text-slate-300 font-medium text-right ml-2 break-all">{val !== undefined && val !== null ? String(val) : ''}</span>
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
