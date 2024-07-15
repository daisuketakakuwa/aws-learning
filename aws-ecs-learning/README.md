# ECS学習プロジェクト
WEBアプリ(FE-BE)をECS上で稼働させるためのインフラ構築手順、アーキテクチャ勉強用プロジェクト

## アーキテクチャ

<img src="https://github.com/user-attachments/assets/94ea9faf-eb8d-4b87-a83b-c956930e9e1b" width="700px">

👉Service作成時に、タスクとLBを一緒に作成できる👍<br>
　→**タスクをTargetとしたLBを作成できる。**(事前にLBだけ手動で作るわけではなさそう)<br>
👉地理的な可用性確保のために、**2つのAZで各Taskを起動** & ALBでルーティング<br>
👉**APIも負荷分散**できるように、InternalALBを用意。<br>
👉ECS Task = 1つの**コンテナインスタンス**(EC2/Fargate)上で実行するコンテナ群(WEB/API)<br>
👉ECS Task定義 = Taskの設計図(イメージURL,環境変数,ポート設定)<br>
👉SecurityGroup = 1Taskに1つのみ = ホスト(EC2)に1つAttachするイメージ。<br>

## Dockerイメージを作成

```
# FEイメージ
cd ecs-learn-frontend
docker build -t <aws_account_id>.dkr.ecr.<region>.amazonaws.com/ecr-learn-app:frontend-<version> .

# BEイメージ
cd ecs-learn-backend
docker build -t <aws_account_id>.dkr.ecr.<region>.amazonaws.com/ecr-learn-app:backend-<version> .
```

## ECRリポジトリにイメージを登録する
`aws ecr describe-repositories`コマンドで諸情報取得。

ECRにログイン
```
aws ecr get-login-password --region <region> | docker login --username AWS --password-stdin <aws_account_id>.dkr.ecr.<region>.amazonaws.com
```
対象リポジトリへプッシュ
```
docker push <aws_account_id>.dkr.ecr.<region>.amazonaws.com/ecr-learn-app:frontend-<version>
docker push <aws_account_id>.dkr.ecr.<region>.amazonaws.com/ecr-learn-app:backend-<version>
```
ECRよりログアウト
```
docker logout
```

## ECSの土台構築
- VPC
- ルートテーブル
- IGW
- サブネット

## ECS構築
Cluster作成<br>
→ 1. BE資材作成(タスク定義/サービス)<br>
→ 2. FE資材作成(タスク定義/サービス)<br>
<br>
👉**依存される順番(BE→FE)でリソース構築する。**

### BE資材作成
- Dockerイメージ作成/更新 → ECRへ登録
- BEタスク定義作成(最新のイメージ参照)
- BEサービス作成<br>
・InternalALBも一緒に作成(TargetはBEタスク)<br>
・SecurityGroupも一緒に作成(InternalLBから許可)<br>

### FE資材作成
- Dockerイメージ作成/更新 → ECRへ登録
- FEタスク定義作成(最新のイメージ参照)
- FEサービス作成<br>
・ExternalALBも一緒に作成(TargetはFEタスク)<br>
・SecurityGroupも一緒に作成(外部NWから許可)<br>

### コンテナインスタンスの構築(起動タイプの選択)

|起動タイプ|やること|
|----|----|
|EC2|方法1. ECSエージェント搭載のEC2を手動構築。<br>方法2. AutoScalingグループで自動構築 → キャパシティプロバイダーとしてASグループを指定。|
|Fargate|何もしなくてOK👍|


### ECSタスク定義の作成
|||
|----|----|
|タスクロール|コンテナが使うIAMロール<br>→ アプリからAWSサービス(S3/SQS等)にアクセスするための設定|
|タスク実行ロール|ECSエージェントが使うIAMロール<br>1. ECRからイメージをプルする<br>2. CloudWatch Logsにログを転送する。<br>3. SecretManagerへｎのアクセス
