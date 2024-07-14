# これは何
WEBアプリ(FE-BE)をECS上で稼働させるための手順

TODO
- FEイメージの追加
- PrivateSubnetにして、LoadBalancerを追加する。
- ExternalLB → FE → InternalLB → BE の構成にする。

## Dockerイメージを作成

```
cd ecs-learn-app
docker build -t <aws_account_id>.dkr.ecr.<region>.amazonaws.com/<repositoryName>:<tag> .
```

## ECRリポジトリにイメージを登録する
`aws ecr describe-repositories`コマンドで諸情報取得。

ECRにログイン
```
aws ecr get-login-password --region <region> | docker login --username AWS --password-stdin <aws_account_id>.dkr.ecr.<region>.amazonaws.com
```
対象リポジトリへプッシュ
```
docker push  <aws_account_id>.dkr.ecr.<region>.amazonaws.com/<repositoryName>:<tag>
```
ECRよりログアウト
```
docker logout
```

## ECSの土台構築
- VPC
- ルートテーブル
- IGW　※PublicSubnetにする場合
- サブネット
- SG作成(HTTP/HTTPS許可) - コンテナインスタンスに紐づく

## ECS構築
Cluster作成　→　タスク定義作成　→　サービス作成

|起動タイプ|やること|
|----|----|
|EC2|方法1. ECSエージェント搭載のEC2を手動構築。<br>方法2. AutoScalingグループで自動構築 → キャパシティプロバイダーとしてASグループを指定。|
|Fargate|何もしなくてOK👍|


### ECSタスク定義の作成
|||
|----|----|
|タスクロール|コンテナが使うIAMロール<br>→ アプリからAWSサービス(S3/SQS等)にアクセスするための設定|
|タスク実行ロール|ECSエージェントが使うIAMロール<br>1. ECRからイメージをプルする<br>2. CloudWatch Logsにログを転送する。<br>3. SecretManagerへｎのアクセス
