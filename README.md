# Alexa時報

alexa_remote_control を使用して、Amazon Echo で海上自衛隊のラッパによる時報を鳴らすシステムです。

## 構成

- `alexa-controller-app/` - バックエンド (Node.js + TypeScript + Express)
- `alexa-controller-app/client/` - フロントエンド (React + Vite + MUI)
- `docker-compose.yml` - 本番用 Docker Compose
- `docker-compose.dev.yml` - 開発用 Docker Compose

## インストール方法

```bash
cd alexa-controller-app
npm install
```

`.env` ファイルをプロジェクトルートに作成し、必要な環境変数を設定してください。

## 使い方

### 本番デプロイ

```bash
docker compose up --build -d
```

API サーバーは `:3001` で起動します。ヘルスチェックは `GET /api/status` です。

### 開発（Docker ホットリロード）

```bash
docker compose -f docker-compose.dev.yml up --build
```

`alexa-controller-app/src/` 内のファイルを編集すると、コンテナが自動的に再起動します。

### ローカル開発サーバー

```bash
cd alexa-controller-app
npm run dev
```

## テスト

テストフレームワークは [Vitest](https://vitest.dev/) を使用しています。

### ローカルでテスト実行

```bash
cd alexa-controller-app

# 全テスト実行
npm test

# ウォッチモード（ファイル変更で自動再実行）
npm run test:watch

# カバレッジ付き
npm run test:coverage
```

### Docker 内でテスト実行

```bash
docker compose -f docker-compose.dev.yml run --rm alexa_control npm test
```

### テスト対象モジュール

| モジュール | テスト内容 |
|-----------|-----------|
| `config-store` | deepMerge、設定の読み書き、イベント発火 |
| `logger` | JSONL ログの追記・クエリ・トリム |
| `sun` | 日没時刻の計算・フォーマット |
| `api-server` | REST API 全エンドポイント・認証・バリデーション |

## 音源ファイルの変換

Alexa SSMLの`<audio>`タグで再生する音源は、以下の仕様を満たす必要があります。

| 項目 | 要件 |
|------|------|
| フォーマット | MP3 (MPEG version 2, Layer III) |
| サンプルレート | 22050 / 24000 / 16000 Hz |
| ビットレート | 48 kbps |
| 最大長 | 240秒 |
| ホスト | HTTPS |

以下のコマンドで変換してください。

```bash
ffmpeg -i <input> -ac 2 -codec:a libmp3lame -b:a 48k -ar 24000 -write_xing 0 -map_metadata -1 -id3v2_version 0 <output>
```

| オプション | 目的 |
|-----------|------|
| `-write_xing 0` | Xing/LAMEヘッダーを除去（Alexaが正しく再生できない原因になる） |
| `-map_metadata -1` | メタデータを除去 |
| `-id3v2_version 0` | ID3タグを付与しない |

## 参照

- [thorsten-gehrig/alexa-remote-control](https://github.com/thorsten-gehrig/alexa-remote-control)
