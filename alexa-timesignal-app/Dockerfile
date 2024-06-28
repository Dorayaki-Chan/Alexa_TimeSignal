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

# package.jsonをコピー
COPY ./package.json /app/
# package-lock.jsonをコピー
COPY ./package-lock.json /app/
# tsconfig.jsonをコピー
COPY ./tsconfig.json /app/
# npm install
RUN npm install
# ソースをコピー
COPY ./src /app/src
COPY ./alexa_remote_control.sh /app/

# シェルスクリプトに権限を付与
RUN chmod +x ./alexa_remote_control.sh

# tsをコンパイル
RUN npm run build

# 起動！
CMD ["npm", "run", "start"]

# シェルスクリプトを実行
# CMD ["./src/alexa_remote_control.sh",  "-e",  "speak:'こんにちは!Windowsのコマンドプロンプトから、Alexaに話させてみました。'"]
# CMD ["./src/alexa_remote_control.sh", "-h"]


