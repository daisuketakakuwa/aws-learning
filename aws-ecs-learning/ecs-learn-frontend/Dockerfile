# ベースイメージとしてNode.jsの公式イメージを使用
FROM node:16

# 作業ディレクトリを設定
WORKDIR /app

# package.jsonとpackage-lock.jsonをコピー
COPY package*.json ./

# 依存関係をインストール
RUN npm install

# アプリケーションのソースコードをコピー
COPY . .

# アプリケーションが使用するポートを開放
EXPOSE 3000

# npm scriptを実行してアプリケーションを起動
CMD ["npm", "run", "start"]
