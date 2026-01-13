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

# 【バックアップ】自動取得に失敗した場合や、特定のシートを確実に取得したい場合用
# ユーザーから提供された最新のリストを反映しました
FALLBACK_SHEETS = {
    "キャラST": "401271395",
    "予定": "1955477458",
    "キャラ訳": "347170430",
    "ST": "1007690338",
    "武器": "122249602",
    "コア": "838155022",
    "ユニット": "1191652583",
    "強敵": "1085841251",
    "他リンク": "1438940995",
    "編集中": "1725386654"
}

# ==========================================
# 処理エリア
# ==========================================

def sanitize_filename(filename):
    """ファイル名に使えない記号を除去する"""
    return re.sub(r'[\\/*?:"<>|]', "", filename)

def get_all_sheets_metadata(sheet_id):
    """スプレッドシートの内部データから全シートの名称とGIDを抽出する"""
    url = f"https://docs.google.com/spreadsheets/d/{sheet_id}/edit"
    sheets = {}
    
    try:
        # ブラウザのように振る舞うためのヘッダー
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36'
        }
        response = requests.get(url, headers=headers, timeout=15)
        response.raise_for_status()
        content = response.text
        
        # パターン1: bootstrapData 内の配列構造 (もっとも一般的)
        # [0, "シート名", null, 0, null, null, null, null, null, 123456789] 
        # のような構造を探す
        matches = re.findall(r'\[(\d+),"([^"]+)",(?:null|true|false|0),', content)
        for gid, name in matches:
            if name and gid not in sheets.values():
                sheets[name] = gid

        # パターン2: JSONライクなメタデータ構造
        if not sheets:
            matches = re.findall(r'\{"1":"([^"]+)","2":(\d+)', content)
            for name, gid in matches:
                sheets[name] = gid

        # パターン3: 別形式のJSON構造
        if not sheets:
            matches = re.findall(r'\{"name":"([^"]+)","id":(\d+)', content)
            for name, gid in matches:
                sheets[name] = gid

        return sheets
    except Exception as e:
        print(f"メタデータ自動取得中にエラー: {e}")
        return {}

def fetch_csv(sheet_id, gid):
    """CSVデータを取得する"""
    url = f"https://docs.google.com/spreadsheets/d/{sheet_id}/export?format=csv&gid={gid}"
    try:
        response = requests.get(url, timeout=15)
        response.raise_for_status()
        return response.text
    except Exception as e:
        print(f"!!! GID {gid} のCSV取得エラー: {e}")
        return None

def main():
    output_path = 'public/data'
    os.makedirs(output_path, exist_ok=True)
    
    print(f"ターゲット Sheet ID: {SHEET_ID}")
    
    # 1. 自動検出を試みる
    discovered = get_all_sheets_metadata(SHEET_ID)
    
    # 2. 自動検出の結果とバックアップを統合
    # 自動検出で見つかったものを優先し、見つからなかった分をバックアップで補完
    final_sheets = {**FALLBACK_SHEETS, **discovered}

    print(f"処理対象シート: {json.dumps(final_sheets, ensure_ascii=False)}")
    
    db_full = {}
    valid_count = 0

    for name, gid in final_sheets.items():
        # ファイル名として安全な名前に変換
        safe_name = sanitize_filename(name)
        print(f"--- 取得中: {name} (GID: {gid}) ---")
        
        csv_text = fetch_csv(SHEET_ID, gid)
        
        if csv_text and len(csv_text.strip()) > 0:
            try:
                df = pd.read_csv(StringIO(csv_text))
                df = df.dropna(how='all').fillna("")
                
                if len(df) > 0:
                    records = df.to_dict(orient='records')
                    db_full[name] = records
                    
                    # 個別保存 (ファイル名は記号抜き)
                    with open(f'{output_path}/{safe_name}.json', 'w', encoding='utf-8') as f:
                        json.dump(records, f, ensure_ascii=False, indent=2)
                    
                    print(f"成功: {len(df)} 件取得")
                    valid_count += 1
                else:
                    print(f"警告: {name} はヘッダーのみ、または空です。")
                    db_full[name] = []
            except Exception as e:
                print(f"解析失敗 ({name}): {e}")
                db_full[name] = []
        else:
            print(f"失敗: {name} のデータが取得できませんでした。")
            db_full[name] = []
        
    if valid_count > 0:
        with open(f'{output_path}/db.json', 'w', encoding='utf-8') as f:
            json.dump(db_full, f, ensure_ascii=False, indent=2)
        print(f"完了: 合計 {valid_count} シートを更新しました。")
    else:
        print("エラー: 有効なデータが1つも取得できませんでした。")

if __name__ == "__main__":
    main()
