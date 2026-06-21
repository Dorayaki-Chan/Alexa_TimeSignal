# 要件定義書

## 文書情報

| 項目 | 内容 |
|------|------|
| 文書名 | Alexa時報システム 要件定義書 |
| プロジェクト名 | alexa_timesignal |
| バージョン | 2.1.0 |
| 作成日 | 2026-06-21 |

---

## 1. プロジェクト概要

### 1.1 目的

Amazon Alexaデバイスを利用し、海上自衛隊スタイルのラッパ音による時報を自動再生するシステムを構築する。

### 1.2 背景

- `alexa_remote_control.sh`（外部bashスクリプト）を利用してAlexaデバイスをプログラム制御する
- Alexa の SSML（Speech Synthesis Markup Language）を活用し、音源再生と音声合成を組み合わせた時報を実現する
- HomeAssistant との統合により、家庭内のスマートホーム環境から時報設定を操作可能にする

### 1.3 スコープ

| 対象 | 説明 |
|------|------|
| バックエンドサーバー | Node.js + TypeScript による REST API・スケジューラー |
| フロントエンドUI | React + Material-UI によるイベント時報管理画面 |
| HomeAssistant統合 | YAML設定による HA ダッシュボード・オートメーション連携 |
| コンテナ化 | Docker + docker-compose による本番デプロイ |

### 1.4 ステークホルダー

| 役割 | 説明 |
|------|------|
| 利用者 | HomeAssistant を利用する家庭内ユーザー |
| 操作手段 | HomeAssistant ダッシュボード / ブラウザUI（iframe埋め込み） |

---

## 2. 機能要件

### FR-001: 朝の連続動作（起床シーケンス）

起床時刻を基準に、10分間隔で3つのラッパを連続再生する。

| 項目 | 内容 |
|------|------|
| 起床ラッパ | 設定時刻（デフォルト 07:00）に再生 |
| 点呼ラッパ | 起床時刻 + 10分後に再生 |
| 食事ラッパ | 起床時刻 + 20分後に再生 |
| 起床時刻設定 | ユーザーが HH:MM 形式で変更可能 |
| 有効/無効 | 起床シーケンス全体の ON/OFF 切り替え |
| 週末スキップ | 設定により土日の実行をスキップ可能（デフォルト: スキップ） |
| 祝日スキップ | `@holiday-jp/holiday_jp` による日本祝日判定でスキップ可能（デフォルト: スキップ） |

### FR-002: 君が代（国旗掲揚・降下時報）

毎日2回、国旗掲揚/降下のタイミングで君が代を再生する。

**朝の君が代（07:59:50）**

SSML による複合音声演出:
1. 「10秒前」（音声合成）
2. 気をつけラッパ音源再生
3. 4秒間のブレイク
4. 「時間」（音声合成）
5. 君が代音源再生
6. 「かかれ」（音声合成）
7. かかれラッパ音源再生

**日没の君が代**

- `suncalc` ライブラリにより緯度経度から日没時刻を動的計算
- 日没10秒前に朝と同じ演出で再生
- 朝の君が代実行時に当日の日没スケジュールを `setTimeout` で予約

### FR-003: 消灯ラッパ

| 項目 | 内容 |
|------|------|
| 実行時刻 | ユーザー設定可能（デフォルト 23:00） |
| 有効/無効 | ON/OFF 切り替え可能 |
| 再生内容 | 消灯ラッパ音源のみ |

### FR-004: イベント時報

ユーザーがサイドパイプ音源と号令テキストを組み合わせて、カスタム時報を登録できる。

**サイドパイプ音源（5種類）**

| ID | 名称 |
|-----|------|
| `zarei` | 雑令 |
| `tanfu` | 短符 |
| `souin` | 総員 |
| `wakare` | 別れ |
| `genmon_sougei` | 舷門送迎 |

**イベント設定項目**

| フィールド | 型 | 説明 |
|-----------|-----|------|
| id | UUID | 自動生成 |
| enabled | boolean | 有効/無効トグル |
| time | HH:MM | 実行時刻 |
| sound | SidePipeSound | 上記5種から選択 |
| announcement | string | Alexaに発声させる号令テキスト |
| recurring | boolean | `true`: 毎日繰り返し / `false`: 単発 |
| date | YYYY-MM-DD | 単発イベントの実行日（recurringがfalseの場合） |

**例**: 音源「雑令」 時間「08:55」 号令「出港用意 5分前」

**自動削除ルール**
- 単発イベントは実行後に自動削除される
- スケジュール再構築時（`rebuild`）に、期限切れの単発イベント（日付が過去）を自動削除する

### FR-005: 設定管理

以下の設定をJSON形式で永続化する。

| 設定グループ | 設定項目 | デフォルト値 |
|-------------|---------|-------------|
| timeSignal | enabled（マスタースイッチ） | `true` |
| wakeUp | enabled（起床シーケンス有効化） | `true` |
| wakeUp | defaultTime（起床時刻） | `"07:00"` |
| wakeUp | weekendEnabled（週末実行） | `false` |
| wakeUp | holidayEnabled（祝日実行） | `false` |
| shoto | enabled（消灯ラッパ有効化） | `true` |
| shoto | time（消灯時刻） | `"23:00"` |
| stopPeriod | enabled（停止期間有効化） | `false` |
| stopPeriod | startDate / endDate（停止開始/終了日） | `""` |
| stopPeriod | startTime / endTime（停止開始/終了時刻） | `"00:00"` / `"23:59"` |
| events | イベント時報の配列 | `[]` |

**停止期間**: 旅行中など、すべての時報を一時停止する期間を日時範囲で設定可能。

### FR-006: HomeAssistant統合

HomeAssistant から時報設定を操作し、ステータスを確認できるようにする。

**入力ヘルパー**

| Entity ID | 型 | 用途 |
|-----------|-----|------|
| `input_boolean.alexa_timesignal_enabled` | Boolean | 時報マスタースイッチ |
| `input_boolean.alexa_kisho_enabled` | Boolean | 起床ラッパ有効化 |
| `input_boolean.alexa_shoto_enabled` | Boolean | 消灯ラッパ有効化 |
| `input_boolean.alexa_stop_period_enabled` | Boolean | 停止期間有効化 |
| `input_datetime.alexa_kisho_time` | DateTime | 起床時刻 |
| `input_datetime.alexa_shoto_time` | DateTime | 消灯時刻 |
| `input_datetime.alexa_stop_start` | DateTime | 停止開始日時 |
| `input_datetime.alexa_stop_end` | DateTime | 停止終了日時 |

**連携方式**
- RESTセンサー: `/api/status` を60秒間隔でポーリングし、次の時報予定を表示
- RESTコマンド: 入力ヘルパー変更時にオートメーションで `/api/config` へPUT送信
- iframeパネル: イベント管理UI をHomeAssistant内に埋め込み表示
- ダッシュボードカード: Entitiesカードで設定トグル・ステータスを一覧表示

### FR-007: REST API

バックエンドが提供する REST API エンドポイント。

**認証必須エンドポイント（X-API-Key ヘッダー）**

| メソッド | パス | 説明 |
|---------|------|------|
| GET | `/api/config` | 全設定取得 |
| PUT | `/api/config` | 設定の部分更新 |
| GET | `/api/status` | 次の時報予定・システム状態 |
| POST | `/api/test-signal` | サイドパイプ音源のテスト再生 |

**認証不要エンドポイント（ブラウザUI用）**

| メソッド | パス | 説明 |
|---------|------|------|
| GET | `/api/events` | イベント一覧取得 |
| POST | `/api/events` | イベント作成 |
| PUT | `/api/events/:id` | イベント更新 |
| DELETE | `/api/events/:id` | イベント削除 |
| GET | `/api/logs` | 操作ログ取得 |

### FR-008: フロントエンドUI

React + Material-UI によるイベント時報管理画面を提供する。

| 機能 | 説明 |
|------|------|
| イベント一覧 | 登録済みイベントをリスト表示（有効/無効トグル、削除ボタン） |
| イベント追加 | ダイアログで時刻・音源・号令・繰り返し設定を入力 |
| 通知 | 操作結果を Snackbar で表示 |
| 空状態 | イベント未登録時に案内メッセージを表示 |

### FR-009: SSML音声合成

Alexa の SSML タグを活用した音声演出を行う。

| SSMLタグ | 用途 |
|----------|------|
| `<audio src='URL'/>` | 外部MP3音源の再生 |
| `<amazon:emotion name='excited'>` | 感情表現（興奮した口調） |
| `<prosody volume='x-fast'>` | 音量・速度調整 |
| `<break time='Ns'/>` | 指定秒数の無音挿入 |

### FR-010: 起動モード

環境変数 `START_MODE` で動作モードを切り替える。

| モード | 動作 |
|--------|------|
| `dev` | 定時点検ラッパ → 10秒後に食事ラッパ（動作確認用） |
| `prod` | 撃ち方始めラッパ → 10秒後にスケジュール再構築 |

---

## 3. 非機能要件

### NFR-001: 可用性

| 項目 | 仕様 |
|------|------|
| コンテナ再起動 | `restart: unless-stopped` で自動復帰 |
| ヘルスチェック | 60秒間隔で `/api/status` に対してcurlを実行（タイムアウト10秒、リトライ3回） |
| 起動猶予 | `start_period: 30s` で初期化完了を待機 |

### NFR-002: Alexa通信リトライ

| 項目 | 仕様 |
|------|------|
| 最大試行回数 | 3回（初回 + リトライ2回） |
| リトライ間隔 | 3秒 |
| 失敗時の動作 | エラーログ記録、例外をスロー |

### NFR-003: ログ管理

| 項目 | 仕様 |
|------|------|
| 形式 | JSONL（JSON Lines） |
| ログタイプ | `signal`, `config_change`, `error`, `system` |
| 最大行数 | 1,000行 |
| トリム後行数 | 500行（超過時に最新500行を保持） |
| 取得順序 | 新しい順（reverse） |
| ページネーション | `limit`（デフォルト50）, `offset`（デフォルト0） |

### NFR-004: データ安全性

| 項目 | 仕様 |
|------|------|
| 設定書き込み | 原子的操作（一時ファイルに書き込み後、renameで置換） |
| 設定読み込み | 起動時にファイルが存在しない場合はデフォルト値で初期化 |
| 設定マージ | `deepMerge` により部分更新をサポート（配列は置換、オブジェクトは再帰マージ） |

### NFR-005: セキュリティ

| 項目 | 仕様 |
|------|------|
| API認証 | `X-API-Key` ヘッダーによるAPIキー認証 |
| 認証対象 | 設定変更系（config, status, test-signal） |
| 認証不要 | イベントCRUD、ログ取得（ブラウザUI / HomeAssistant iframe用） |
| CORS | 全オリジン許可 |

### NFR-006: タイムゾーン

| 項目 | 仕様 |
|------|------|
| コンテナTZ | `Asia/Tokyo` |
| 言語設定 | `ja_JP.UTF-8` |

### NFR-007: 環境変数管理

起動時に以下の環境変数を検証し、不足があればプロセスを終了する。

**必須環境変数（起動時検証対象）**

| 変数名 | 説明 |
|--------|------|
| `AUDIO_SYUKKOU_PATH` | 出港ラッパ音源URL |
| `AUDIO_KIOTSUKE_PATH` | 気をつけラッパ音源URL |
| `AUDIO_KIMIGAYO_PATH` | 君が代音源URL |
| `AUDIO_KAKARE_PATH` | かかれラッパ音源URL |
| `AUDIO_TEIJITENKEN_PATH` | 定時点検ラッパ音源URL |
| `AUDIO_UCHIKATAHAZIME_PATH` | 撃ち方始めラッパ音源URL |
| `AUDIO_SHOTO_PATH` | 消灯ラッパ音源URL |
| `AUDIO_KISHO_PATH` | 起床ラッパ音源URL |
| `AUDIO_TENKO_PATH` | 点呼ラッパ音源URL |
| `AUDIO_SHOKUJI_PATH` | 食事ラッパ音源URL |
| `MY_LATITUDE` | 日没計算用の緯度 |
| `MY_LONGITUDE` | 日没計算用の経度 |

**任意環境変数**

| 変数名 | デフォルト値 | 説明 |
|--------|-------------|------|
| `AUDIO_ZAREI_PATH` | `""` | 雑令音源URL |
| `AUDIO_TANFU_PATH` | `""` | 短符音源URL |
| `AUDIO_SOUIN_PATH` | `""` | 総員音源URL |
| `AUDIO_WAKARE_PATH` | `""` | 別れ音源URL |
| `AUDIO_GENMON_SOUGEI_PATH` | `""` | 舷門送迎音源URL |
| `SET_REFRESH_TOKEN` | - | Alexaリフレッシュトークン |
| `START_MODE` | `"dev"` | 起動モード（dev/prod） |
| `DATA_DIR` | `"/app/data"` | データディレクトリパス |
| `API_PORT` | `"3001"` | APIサーバーポート |
| `HA_API_KEY` | `"default-api-key"` | HomeAssistant連携用APIキー |

---

## 4. 制約事項

| 制約 | 説明 |
|------|------|
| Alexa制御 | `alexa_remote_control.sh`（外部bashスクリプト v0.21b）に依存。コンテナ内 `/app/` に配置 |
| 音源形式 | HTTPS URL 経由の MP3 形式のみ対応（Alexa SSML の制約） |
| 音源ホスティング | Dropbox CDN を利用 |
| 祝日判定 | 日本の祝日のみ対応（`@holiday-jp/holiday_jp` ライブラリ） |
| 実行環境 | Linux コンテナ上での実行を前提（`alexa_remote_control.sh` が bash 依存） |
| 追加パッケージ | `curl`, `jq`, `oathtool` がコンテナ内に必要（Alexa認証処理用） |

---

## 5. 用語集

### ラッパ音源

| 名称 | 読み | 用途 |
|------|------|------|
| 起床（kisho） | きしょう | 起床時刻の通知 |
| 点呼（tenko） | てんこ | 点呼時刻の通知 |
| 食事（shokuji） | しょくじ | 食事時刻の通知 |
| 君が代（kimigayo） | きみがよ | 国旗掲揚・降下時（08:00、日没） |
| 消灯（shoto） | しょうとう | 消灯時刻の通知 |
| 気をつけ（kiotsuke） | きをつけ | 敬礼準備の号令音 |
| かかれ（kakare） | かかれ | 動作開始の号令音 |
| 出港（syukkou） | しゅっこう | 出港時の通知 |
| 定時点検（teijitenken） | ていじてんけん | 開発モードテスト用 |
| 撃ち方始め（uchikatahajime） | うちかたはじめ | 本番起動通知用 |

### サイドパイプ音源

| 名称 | 読み | 用途 |
|------|------|------|
| 雑令（zarei） | ざれい | 一般的な号令・通知 |
| 短符（tanfu） | たんぷ | 短い合図 |
| 総員（souin） | そういん | 全員召集の合図 |
| 別れ（wakare） | わかれ | 別れの合図 |
| 舷門送迎（genmon_sougei） | げんもんそうげい | 来客・VIP送迎の儀式的合図 |
