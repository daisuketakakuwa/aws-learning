# これは何
WEBアプリ(FE-BE)をECS上で稼働させるための手順、アーキテクチャのお勉強用プロジェクト<br>
👉**1Taskでサービス稼動可能**となる単位で = FE/BEを1Taskで起動!!!<br>
👉**地理的な可用性確保**のために、2つのAZで各Taskを起動 & ALBでルーティング<br>
👉ECS Task = 1つの**コンテナインスタンス**(EC2/Fargate)上で実行するコンテナ群(WEB/API)<br>
👉ECS Task定義 = Taskの設計図(イメージURL,環境変数,ポート設定)<br>
👉SecurityGroup = 1Taskに1つのみ = ホスト(EC2)に1つAttachするイメージ。<br>

<img src="https://github.com/user-attachments/assets/66a1316f-82e4-44c8-b205-38c29ff9070f" width="700px">

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
