# alexa_remote_control.sh テスト環境

音量の取得・変更など、alexa_remote_control.sh のコマンドを単体テストするための環境。

## 使い方

```bash
# ① コンテナ起動
cd test-alexa-cli
docker compose up -d

# ② デバイス一覧を確認（デバイス名を把握する）
docker compose exec alexa-cli ./alexa_remote_control.sh -a

# ③ 現在の音量を取得
docker compose exec alexa-cli ./alexa_remote_control.sh -d "デバイス名" -z

# ④ 音量を変更（例: 50に設定）
docker compose exec alexa-cli ./alexa_remote_control.sh -d "デバイス名" -e vol:50

# ⑤ 変更後の音量を確認
docker compose exec alexa-cli ./alexa_remote_control.sh -d "デバイス名" -z

# ⑥ 終了
docker compose down
```

## その他のコマンド例

```bash
# TTS（テキスト読み上げ）
docker compose exec alexa-cli ./alexa_remote_control.sh -d "デバイス名" -e speak:"こんにちは"

# 天気予報
docker compose exec alexa-cli ./alexa_remote_control.sh -d "デバイス名" -e weather
```
