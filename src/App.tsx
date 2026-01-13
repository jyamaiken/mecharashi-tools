import React, { useState } from 'react';
import { Shield, Sword, Zap, Flame, Droplets, Leaf, User, Briefcase, ChevronRight } from 'lucide-react';

const App = () => {
  const [activeTab, setActiveTab] = useState('type');

  // サンプルデータ: タイプ
  const types = [
    { id: 1, name: '炎属性', description: '強力な攻撃力と爆発力を持ちます。', icon: <Flame className="w-6 h-6 text-red-500" />, color: 'bg-red-50' },
    { id: 2, name: '水属性', description: '柔軟な対応力と回復に長けています。', icon: <Droplets className="w-6 h-6 text-blue-500" />, color: 'bg-blue-50' },
    { id: 3, name: '雷属性', description: 'スピードと連続攻撃が特徴です。', icon: <Zap className="w-6 h-6 text-yellow-500" />, color: 'bg-yellow-50' },
    { id: 4, name: '森属性', description: '防御力と持続的な支援が得意です。', icon: <Leaf className="w-6 h-6 text-green-500" />, color: 'bg-green-50' },
  ];

  // サンプルデータ: ジョブ
  const jobs = [
    { id: 1, name: 'ウォーリアー', role: 'アタッカー', difficulty: '初級', icon: <Sword className="w-6 h-6 text-slate-700" /> },
    { id: 2, name: 'ナイト', role: 'タンク', difficulty: '中級', icon: <Shield className="w-6 h-6 text-slate-700" /> },
    { id: 3, name: 'メイジ', role: '魔法アタッカー', difficulty: '上級', icon: <Zap className="w-6 h-6 text-slate-700" /> },
    { id: 4, name: 'エージェント', role: 'サポート', difficulty: '中級', icon: <Briefcase className="w-6 h-6 text-slate-700" /> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 flex justify-center">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        
        {/* ヘッダーエリア */}
        <div className="p-6 border-bottom border-slate-100 bg-white">
          <h1 className="text-2xl font-bold text-slate-800">カテゴリー選択</h1>
          <p className="text-slate-500 mt-1">詳細情報を確認するタブを選択してください。</p>
        </div>

        {/* サブタブナビゲーション */}
        <div className="flex px-6 space-x-1 bg-white">
          <button
            onClick={() => setActiveTab('type')}
            className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium transition-all border-b-2 ${
              activeTab === 'type'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <User className="w-4 h-4" />
            <span>タイプ (Type)</span>
          </button>
          <button
            onClick={() => setActiveTab('job')}
            className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium transition-all border-b-2 ${
              activeTab === 'job'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            <span>ジョブ (Job)</span>
          </button>
        </div>

        {/* コンテンツエリア */}
        <div className="p-6 bg-slate-50/50 min-h-[400px]">
          {activeTab === 'type' ? (
            <div className="grid grid-cols-1 gap-4">
              {types.map((item) => (
                <div 
                  key={item.id} 
                  className={`flex items-center p-4 rounded-xl border border-white shadow-sm transition-transform hover:scale-[1.01] bg-white`}
                >
                  <div className={`p-3 rounded-lg ${item.color} mr-4`}>
                    {item.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-slate-800">{item.name}</h3>
                    <p className="text-sm text-slate-500">{item.description}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-300" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {jobs.map((item) => (
                <div 
                  key={item.id} 
                  className="flex items-center p-4 rounded-xl border border-white shadow-sm bg-white hover:border-indigo-100 transition-all"
                >
                  <div className="p-3 bg-slate-100 rounded-lg mr-4">
                    {item.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-bold text-slate-800">{item.name}</h3>
                      <span className="px-2 py-0.5 text-[10px] font-bold uppercase bg-indigo-100 text-indigo-700 rounded">
                        {item.difficulty}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500">役割: {item.role}</p>
                  </div>
                  <button className="px-4 py-1.5 text-xs font-semibold bg-slate-800 text-white rounded-full hover:bg-slate-700 transition-colors">
                    詳細
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* フッター */}
        <div className="p-4 bg-white border-t border-slate-100 text-center">
          <p className="text-xs text-slate-400">© 2026 Dashboard Interface</p>
        </div>
      </div>
    </div>
  );
};

export default App;
