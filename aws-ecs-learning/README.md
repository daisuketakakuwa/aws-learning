# ECS学習プロジェクト
WEBアプリ(FE-BE)をECS上で稼働させるためのインフラ構築手順、アーキテクチャ勉強用プロジェクト

## アーキテクチャ

<img src="https://github.com/user-attachments/assets/22853fd8-21e8-43e5-a5e3-e23d2038d4d1" width="900px">

👉地理的な可用性確保のために、**2つのAZで各Taskを起動** & ALBでルーティング<br>
👉**APIも負荷分散**できるように、InternalALBを用意。<br>
👉**FEとBEでサービス/タスクをそれぞれ定義**<br>
　→ **FEとBEでそれぞれLBを紐づけたい**... サービス-LBは1対1で紐づくので別々作成。<br>
　→ **Scaling対象は「FE」「BE」と別にしたい**ため、Scaling担当のサービスは別々作成。<br>
👉ECS Task = 1つの**コンテナインスタンス**(**EC2/Fargate**)上で実行するコンテナ群(WEB/API)<br>
　→ 今回はFargate上でタスク実行。EC2の場合4つのコンテナインスタンスを管理する必要あり。<br>
👉ECS Task定義 = Taskの設計図(イメージURL,環境変数,ポート設定)<br>
👉SecurityGroup = 1Taskに1つのみ = ホスト(EC2)に1つAttachするイメージ。<br>
<br>

## 開発の中でイメージの作成/登録を何度も行う。
1. featureブランチマージする。
2. Dockerイメージ作成する。
3. ECRリポジトリにイメージ登録する。

### Dockerイメージを作成

```
# FEイメージ
cd ecs-learn-frontend
docker build -t <aws_account_id>.dkr.ecr.<region>.amazonaws.com/ecr-learn-app:frontend-<version> .

# BEイメージ
cd ecs-learn-backend
docker build -t <aws_account_id>.dkr.ecr.<region>.amazonaws.com/ecr-learn-app:backend-<version> .
```

### ECRリポジトリにイメージを登録する
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
<br>

## ECSの土台構築手順
### ネットワーク/セキュリティ周り
- VPC
    - IPv4 CIDR：10.0.0.0/24
    - DNS解決を有効化 → VPCエンドポイント作成を可能にする
    - DNSホスト名を有効化 → VPCエンドポイント作成を可能にする
- IGW
    - VPCへアタッチ（PublicSubnetを作成するため）
- ルートテーブル
    - ルートテーブル for Publicサブネット
        - 0.0.0.0/0 → IGW へルーティング
    - ルートテーブル for Privateサブネット
- サブネット（**2つのAZにPublic/Subnetを用意**）
    - Publicサブネット on AZ1　CIDR：10.0.0.0/26 = 第4オクテット(00/000000)
    - Publicサブネット on AZ2　CIDR：10.0.0.64/26 = 第4オクテット(01/000000)
    - Privateサブネット on AZ1　CIDR：10.0.0.128/26 = 第4オクテット(10/000000)
    - Privateサブネット on AZ2　CIDR：10.0.0.192/26 = 第4オクテット(11/000000)
- ルートテーブル と サブネット を紐づける
- セキュリティグループ
    - ECSタスク用SG（**ECSサービス起動時に指定**）
        - Inbound TCP 3000/8080を許可  
    - VPCエンドポイント用SG（**VPCエンドポイント作成時に指定**）
        - Inbound ECSタスク用SG からの HTTPS 443を許可(**ECR等のAWSサービスに対するアクセス**)
- VPCエンドポイント（**ECSタスクからVPC外部のAWSリソースへのアクセス許可**）
    - 作成したVPCに対して下記4つのVPCエンドポイントを作成する。
        - `com.amazonaws.<region>.ecr.dkr` ECRのDockerリポジトリへのアクセス
        - `com.amazonaws.<region>.ecr.api` ECRのAPIエンドポイント
        - `com.amazonaws.<region>.s3` 　　　CloudWatchログをS3に保管
        - `com.amazonaws.<region>.logs` 　　awslogsログドライバーがCloudWatch利用
            - VPC：作成したVPC
            - Subnet：ECSタスクを起動するPrivateSubnet ×2
            - SG：Inbound HTTPS443を許可するVPCエンドポイント用SG
    - 参考：[ECSに必要なVPCエンドポイントまとめ（2022年版）](https://dev.classmethod.jp/articles/vpc-endpoints-for-ecs-2022/)



### LB周り

- TargetGroup
    - ※ **Fargateの場合「ECSタスクが実行されるサブネットのネットワークIPアドレス＆Port」でルーティングする👍**
    - FE-fargate-tasksターゲット
        - タイプ: IP
        - VPC: 作成したVPC
        - IP: PublicサブネットのネットワークIPアドレス × 2
        - Port: 3000(FEタスクが公開してる**hostPort**)
    - BE-fargate-tasksターゲット
        - タイプ: IP
        - VPC: 作成したVPC
        - IP: PrivateサブネットのネットワークIPアドレス × 2
        - Port: 8080(BEタスクが公開してる**hostPort**)

- LoadBalancer
    - Externel LB for FE
        - タイプ：Application
        - スキーム：インターネット向け
        - マッピング：AZ1, AZ2（ALBを配置するAZ）
        - ネットワークマッピング：PublicSubnet × 2（**PublicSubnetにExternalALBを配置**）
        - SG：80(HTTP) Inboundを許可する
        - リスナー：FE-fargate-tasksターゲット（**FEのECSタスクへルーティング**）
    - Internal LB for BE
        - タイプ：Application
        - スキーム：内部
        - マッピング：AZ1, AZ2（ALBを配置するAZ）
        - ネットワークマッピング：PrivateSubnet × 2（**PrivateSubnetにInternalALBを配置**）
        - SG：80(HTTP) Inboundを許可する
        - リスナー：BE-fargate-tasksターゲット（**BEのECSタスクへルーティング**）

## 土台の上でECSサービス/タスクを実行
Cluster作成<br>
→ 1. FE資材作成(タスク定義/サービス)<br>
→ 2. BE資材作成(タスク定義/サービス)<br>

### FE資材作成＆サービス/タスク起動
- Dockerイメージ作成/更新 → ECRへ登録
- FEタスク定義作成
    - hostPort/containerPortともに3000指定 ※hostPort0にするとランダムにport指定
    - イメージURI指定
- FEサービス作成
    - VPC：作成したVPC
    - Subnet：PirvateSubnet ×2
    - SecurityGroup：**ECSタスク用SG(Inbound TCP 3000/8080を許可)**

### BE資材作成＆サービス/タスク起動
- Dockerイメージ作成/更新 → ECRへ登録
- BEタスク定義作成
    - hostPort/containerPortともに8080指定 ※hostPort0にするとランダムにport指定
    - イメージURI指定
- BEサービス作成
    - VPC：作成したVPC
    - Subnet：PirvateSubnet ×2
    - SecurityGroup：**ECSタスク用SG(Inbound TCP 3000/8080を許可)**


### コンテナインスタンスの構築(起動タイプの選択)

|起動タイプ|やること|
|----|----|
|EC2|方法1. ECSエージェント搭載のEC2を手動構築。<br>方法2. AutoScalingグループで自動構築 → キャパシティプロバイダーとしてASグループを指定。|
|Fargate|何もしなくてOK👍|


### ECS タスクロールとタスク実行ロール の違い
|||
|----|----|
|タスクロール|コンテナが使うIAMロール<br>→ アプリからAWSサービス(S3/SQS等)にアクセスするための設定|
|タスク実行ロール|ECSエージェントが使うIAMロール<br>1. ECRからイメージをプルする<br>2. CloudWatch Logsにログを転送する。<br>3. SecretManagerへｎのアクセス
