#Node.jsのimage をベースにする
FROM node:18-bullseye-slim

# 言語を設定
ENV LANG=ja_JP.UTF-8

# タイムゾーンを設定
ENV TZ=Asia/Tokyo

# 必要なパッケージをインストール
RUN apt-get update \
    && apt-get upgrade

# npmのアップデート
RUN npm install -g npm

# 作業ディレクトリを指定
WORKDIR /app

# Client
COPY ./client/!{dist,node_modules}/** ./client
RUN npm install
RUN npm run build

# Server
COPY ./server/!{dist,public,node_modules}/** ./server
WORKDIR /server
RUN npm install
RUN tsc index.ts

# 最終的なイメージ
FROM alpine:latest

WORKDIR /app

COPY --from=builder /app/client/dist .
COPY --from=builder /app/server/dist .

CMD ["node", "server/dist/index.js"]