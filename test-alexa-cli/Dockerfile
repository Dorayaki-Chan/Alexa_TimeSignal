FROM node:20-bullseye-slim

ENV LANG=ja_JP.UTF-8
ENV TZ=Asia/Tokyo

RUN apt-get update && apt-get install -y curl jq && rm -rf /var/lib/apt/lists/*

WORKDIR /app

CMD ["tail", "-f", "/dev/null"]
