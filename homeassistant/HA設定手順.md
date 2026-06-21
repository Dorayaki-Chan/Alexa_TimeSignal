# HomeAssistant 設定手順

## 前提
- Alexa時報コンテナが `<your-ip-address>:3001` で起動済み
- HAはDocker上で動作

## 手順

### 1. HAコンテナに入る
```bash
sudo docker exec -it <HAコンテナID> bash
```

### 2. secrets.yaml にAPIキーを追加
```bash
vi secrets.yaml
```
末尾に追加（.envの`HA_API_KEY`と同じ値）:
```
alexa_api_key: "your-api-key-here"
```

### 3. configuration.yaml を上書き
```bash
cat > configuration.yaml << 'EOF'
ここにconfiguration.yamlの内容を貼り付け
EOF
```
※ configuration.yaml の最新版は `homeassistant/configuration.yaml` を参照

### 4. HAを再起動
HA画面 → 設定 → サーバー管理 → 再起動

### 5. オートメーション作成（HA UI上で）
- 設定 → オートメーションとシーン → +作成
- 名前: `Alexa時報 設定同期`

#### WHEN（トリガー）
- 種類: エンティティ → 状態
- YAMLエディタで以下を貼り付け:
```yaml
trigger: state
entity_id:
  - input_boolean.alexa_timesignal_enabled
  - input_boolean.alexa_kisho_enabled
  - input_boolean.alexa_shoto_enabled
  - input_boolean.alexa_stop_period_enabled
  - input_datetime.alexa_kisho_time
  - input_datetime.alexa_shoto_time
  - input_datetime.alexa_stop_start
  - input_datetime.alexa_stop_end
```

#### Then Do（アクション）
- アクションを追加 → RESTful Command → `rest_command.alexa_update_config`
- 「応答変数」のチェックは不要
- 保存

### 6. ダッシュボードにカード追加
- 概要 → 編集 → カードを追加
- YAMLエディタで以下を貼り付け:
```yaml
type: vertical-stack
cards:
  - type: entities
    title: Alexa時報
    entities:
      - entity: input_boolean.alexa_timesignal_enabled
      - entity: input_boolean.alexa_kisho_enabled
      - entity: input_datetime.alexa_kisho_time
      - entity: input_boolean.alexa_shoto_enabled
      - entity: input_datetime.alexa_shoto_time
      - type: divider
      - entity: input_boolean.alexa_stop_period_enabled
      - entity: input_datetime.alexa_stop_start
      - entity: input_datetime.alexa_stop_end
      - type: divider
      - entity: sensor.alexashi_bao_sutetasu
  - type: iframe
    url: http://<your-ip-address>:3001/
    aspect_ratio: 50%
```

### 7. HA画面で初期値を設定
- 時報マスタースイッチ → ON
- 起床ラッパ → ON
- 起床時刻 → 7:00
- 消灯ラッパ → ON
- 消灯時刻 → 23:00
- 演奏停止期間 → OFF
