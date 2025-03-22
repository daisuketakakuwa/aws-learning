# ビルドステージ
FROM maven:3.9.8-amazoncorretto-17-al2023 AS builder

# アプリケーション用のディレクトリを作成
WORKDIR /app

# Mavenの依存関係をダウンロードするために、先にpom.xmlをコピー
COPY pom.xml .

# 依存関係を解決し、ローカルリポジトリにキャッシュする
RUN mvn dependency:go-offline -B

# ソースコードをコピー
COPY src ./src

# アプリケーションをビルド
RUN mvn clean package -DskipTests

# 実行ステージ
FROM amazoncorretto:17-alpine-jdk

# アプリケーション用のディレクトリを作成
WORKDIR /app

# ビルドステージからビルドされたJARファイルをコピー
COPY --from=builder /app/target/*.jar /app/ecs-learn-backend.jar

# アプリケーションを実行するコマンド
ENTRYPOINT ["java", "-jar", "/app/ecs-learn-backend.jar"]

# (オプション) コンテナがリッスンするポートを指定
EXPOSE 8080
