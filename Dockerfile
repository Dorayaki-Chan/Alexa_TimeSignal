#Node.jsのimage をベースにする
FROM node:20-bullseye-slim

# 言語を設定
ENV LANG=ja_JP.UTF-8

# タイムゾーンを設定
ENV TZ=Asia/Tokyo

# 必要なパッケージをインストール
RUN apt-get update \
    && apt-get install -y curl jq oathtool

# npmのアップデート
RUN npm install -g npm

# 作業ディレクトリを指定
WORKDIR /app

# シェルスクリプトをコピー
COPY ./alexa_remote_control.sh /app/
# COPY ./.env /app/

# シェルスクリプトを実行
# CMD ["./alexa_remote_control.sh",  "-e",  "speak:こんにちは!Windowsのコマンドプロンプトから、Alexaに話させてみました。"]
