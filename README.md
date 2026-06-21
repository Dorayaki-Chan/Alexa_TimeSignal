# Alexa時報

プロジェクトの概要や目的を簡潔に説明します。

## インストール方法

プロジェクトを実行するための手順や依存関係を記述します。

## 使い方

プロジェクトの使用方法やコマンドの実行例を示します。


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
