import pandas as pd
import requests
import os
import json
import re
from io import StringIO

# ==========================================
# 設定エリア
# ==========================================

# スプレッドシートのID
SHEET_ID = os.environ.get('SHEET_ID', '1cG37dxatVK7go9rDvu4VMrp1XN4qCvgbVyyiqHqLBy0')

# ==========================================
# 処理エリア
# ==========================================

def get_all_sheets_metadata(sheet_id):
    """スプレッドシートのHTMLから全シートの名称とGIDを自動抽出する"""
    url = f"https://docs.google.com/spreadsheets/d/{sheet_id}/edit"
    try:
        headers = {'User-Agent': 'Mozilla/5.0'}
        response = requests.get(url, headers=headers, timeout=15)
        response.raise_for_status()
        
        # HTML内の bootstrapData 変数からシート情報を抽出
        # パターン: {"name":"シート名","id":123456789,...}
        content = response.text
        
        # シート名とGIDのペアを探す正規表現
        # Googleスプレッドシートの内部データ構造に基づいた抽出
        matches = re.findall(r'\{"1":"(?P<name>[^"]+)","2":(?P<id>\d+)', content)
        
        if not matches:
            # 別のパターン（旧形式や別プロパティ）を試行
            matches = re.findall(r'\{"name":"(?P<name>[^"]+)","id":(?P<id>\d+)', content)

        sheets = {}
        for name, gid in matches:
            # 重複を排除しつつ辞書に追加
            if name not in sheets:
                sheets[name] = gid
        
        return sheets
    except Exception as e:
        print(f"!!! シートメタデータの取得に失敗しました: {e}")
        return {}

def fetch_csv(sheet_id, gid):
    """指定されたGIDのCSVデータを取得する"""
    url = f"https://docs.google.com/spreadsheets/d/{sheet_id}/export?format=csv&gid={gid}"
    try:
        headers = {'User-Agent': 'Mozilla/5.0'}
        response = requests.get(url, headers=headers, timeout=15)
        response.raise_for_status()
        return response.text
    except Exception as e:
        print(f"!!! GID {gid} のCSV取得に失敗しました: {e}")
        return None

def main():
    output_path = 'public/data'
    os.makedirs(output_path, exist_ok=True)
    
    # 1. シート構成を自動取得
    print(f"スプレッドシート ID: {SHEET_ID} から全シートをスキャン中...")
    discovered_sheets = get_all_sheets_metadata(SHEET_ID)
    
    if not discovered_sheets:
        print("致命的エラー: シート構成を読み取れませんでした。スプレッドシートが公開設定になっているか確認してください。")
        return

    print(f"検出されたシート: {list(discovered_sheets.keys())}")
    
    db_full = {}
    valid_sheets_count = 0

    # 2. 検出された各シートをループ処理
    for name, gid in discovered_sheets.items():
        # JSONキーとして使いやすいように名前を整形（英字推奨だが日本語でも可）
        # 例: 「操縦士(Pilots)」のようなシート名なら「操縦士(Pilots)」がキーになる
        key = name.strip()
        print(f"--- 同期中: {key} (GID: {gid}) ---")
        
        csv_text = fetch_csv(SHEET_ID, gid)
        
        if csv_text:
            try:
                df = pd.read_csv(StringIO(csv_text))
                df = df.dropna(how='all').fillna("")
                
                if len(df) > 0:
                    records = df.to_dict(orient='records')
                    db_full[key] = records
                    
                    # 個別ファイルも保存
                    with open(f'{output_path}/{key}.json', 'w', encoding='utf-8') as f:
                        json.dump(records, f, ensure_ascii=False, indent=2)
                    
                    print(f"成功: {len(df)} 件のデータを取得しました。")
                    valid_sheets_count += 1
                else:
                    print(f"警告: シート '{key}' はデータが空です。")
            except Exception as e:
                print(f"エラー: CSV解析に失敗しました ({key}): {e}")
        
    # 3. 統合ファイルの作成
    if valid_sheets_count > 0:
        with open(f'{output_path}/db.json', 'w', encoding='utf-8') as f:
            json.dump(db_full, f, ensure_ascii=False, indent=2)
        print(f"完了: 合計 {valid_sheets_count} 個のシートを db.json に統合しました。")
    else:
        print("エラー: 有効なデータが1件も取得できませんでした。")

if __name__ == "__main__":
    main()
