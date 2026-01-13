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
        headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'}
        response = requests.get(url, headers=headers, timeout=15)
        response.raise_for_status()
        content = response.text
        
        sheets = {}

        # パターン1: bootstrapData 内のシート情報 (より広範な一致を狙う)
        # 形式例: {"1":"シート名","2":12345} や {"name":"シート名","id":12345}
        # JSON風の文字列から名前と数値を抽出
        raw_matches = re.findall(r'\{"1":"([^"]+)","2":(\d+)', content)
        for name, gid in raw_matches:
            if name not in sheets:
                sheets[name] = gid

        # パターン2: 古い形式や別プロパティの検索
        if not sheets:
            raw_matches = re.findall(r'\{"name":"([^"]+)","id":(\d+)', content)
            for name, gid in raw_matches:
                if name not in sheets:
                    sheets[name] = gid

        # パターン3: スクリプトタグ内の sheetInfo などの構造を狙う
        if not sheets:
            # 非常に単純な正規表現でIDと名前っぽいペアを拾う
            raw_matches = re.findall(r'gid[:=]\s*(\d+).*?name[:=]\s*"([^"]+)"', content)
            for gid, name in raw_matches:
                if name not in sheets:
                    sheets[name] = gid

        return sheets
    except Exception as e:
        print(f"!!! メタデータの取得失敗: {e}")
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
        print(f"!!! GID {gid} の取得エラー: {e}")
        return None

def main():
    output_path = 'public/data'
    os.makedirs(output_path, exist_ok=True)
    
    print(f"Target Sheet ID: {SHEET_ID}")
    discovered_sheets = get_all_sheets_metadata(SHEET_ID)
    
    if not discovered_sheets:
        print("致命的エラー: シートが1つも見つかりませんでした。")
        # デバッグ用にHTMLの一部を出力（Actionsのログで確認用）
        return

    print(f"発見されたシート構成: {json.dumps(discovered_sheets, ensure_ascii=False)}")
    
    db_full = {}
    valid_count = 0

    for name, gid in discovered_sheets.items():
        # キー名は正規化（空白除去など）
        key = name.strip()
        print(f"--- Fetching: {key} (GID: {gid}) ---")
        
        csv_text = fetch_csv(SHEET_ID, gid)
        
        if csv_text:
            try:
                # 1行目が空でないかチェック
                if not csv_text.strip():
                    print(f"結果: {key} は中身が空です")
                    db_full[key] = []
                    continue

                df = pd.read_csv(StringIO(csv_text))
                df = df.dropna(how='all').fillna("")
                
                if len(df) > 0:
                    records = df.to_dict(orient='records')
                    db_full[key] = records
                    
                    with open(f'{output_path}/{key}.json', 'w', encoding='utf-8') as f:
                        json.dump(records, f, ensure_ascii=False, indent=2)
                    
                    print(f"成功: {len(df)} 件取得")
                    valid_count += 1
                else:
                    print(f"警告: {key} にデータ行がありません")
                    db_full[key] = []
            except Exception as e:
                print(f"解析失敗 ({key}): {e}")
                db_full[key] = []
        else:
            db_full[key] = []
        
    if valid_count > 0:
        with open(f'{output_path}/db.json', 'w', encoding='utf-8') as f:
            json.dump(db_full, f, ensure_ascii=False, indent=2)
        print(f"完了: db.json を更新しました。")
    else:
        print("エラー: 読み込めるデータが1件もありませんでした。")

if __name__ == "__main__":
    main()
