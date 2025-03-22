## HLD

・APIGW(Private)
　- Resource(hello)
　　- GET /hello

↑↓

・VPC
　- VPC Endpoint

✅**VPC 内からプライベートに呼べるようにするために、Private な API を使う。なので、Private な APIGW 構築時には「VPC Endpoint」の指定が必要である。**

✅VPC Endpoint を指定して Private な APIGW を生成すると、**Route53Alias として自動的に下記の DNS レコードを定義してくれる。**

👉Public な DNS レコードなので Internet 経由で名前解決は可能だが、正常に呼び出せるのは指定の VPC 内からのアクセスのみ。

```
{rest-api-id}-{vpce-id}.execute-api.{region}.amazonaws.com
```

## Technical Stack

- Node.js 18
- TypeScript
- Serverless
- AWS CloudFormation
- AWS Lambda
- AWS S3

## About Serverless

### 1. Need admin role to execute `sls deploy`

- `sls`コマンドは、`.aws/credentials`ファイルを参照する。
- Admin 権限をもつ IAM ユーザーをコンソールで作成する＆`aws configure`で設定する。

### 2. Serverless creates IAM role for service(one serverless.yml) automatically.

- Lambda は各 AWS 資源(CloudWatch 等)にアクセスするために IAM ロールを assume する。そのためのロール。
- `provider.iam`で既存の IAM ロールを指定することも可能。

https://www.serverless.com/framework/docs/providers/aws/guide/iam/

### 3. `functions.hogeFunc.events.s3`は、自動で S3 バケットを生成する。

- `Resources`配下で作成することも可能だが、これは serverless がデプロイ時に生成する CloudFormation template に直接書くようなもの。
- `functions.hogeFunc.events.s3`で自動生成される S3 バケットの設定をしたい場合は、`provider.s3`で設定を行う。

### 4. `provider.apiGateway`は、`functions`配下の Lambda を Integrate する APIGW を構築する。

- `resouces`配下で CloudFormation でハードコーディングする必要はない。

#### `provider.s3`設定時の注意

以下のように`provider.s3.xxxxBucket`の`xxxxBucket`を、functions 側で参照する。ここで丸 2 日くらいはまったな...

```yml
provider:
  s3:
    helloBucket:
      name: serverless-ts-learning-bucket
      LifecycleConfiguration:
        Rules:
          - Id: GlacierRule
            Prefix: folder1/
            Status: Enabled
            ExpirationInDays: 7

functions:
  hello:
    handler: src/functions/hello.default
    events:
      - s3:
          bucket: helloBucket
```

https://www.serverless.com/framework/docs/providers/aws/events/s3

### 4. `sls deploy`で CloudFormation の template は`.serverless/`配下に生成される。

Upload する CloudFormation の Template がどんなものかローカルで確認できる。

## How to run on local

### set aws credentials

```
$ aws configure --profile offline
AWS Access Key ID [None]: S3EVER
AWS Secret Key ID [None]: S3EVER
Default region name [None]: ap-northeast-1
Default output format [None]: json
```

### start the lambda

```
npx sls offline start
```

### JWT

・Create JWT in https://jwt.io/
・PEM → JWKS in https://irrte.ch/jwt-js-decode/pem2jwk.html

```
eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InRlc3QifQ.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWUsImlhdCI6MTUxNjIzOTAyMn0.cJhvFV2N_-llnvNJLtRutGsTGxsnOwY8OvVGT-TUv9pO2LZuVGzFlOu3mPe5MZWpc_ZAhMudGnvSTPpGTWxE1yHrNu1hWfmO80R4VI83rusHeTcbhPgfnwAuqofKYZg_dYWkd5HQz1tTl062oqcnGYQ8GjXxNZI6UXdbe0Hd1SHdlg4G31h8Q9z_qChBTTjrFJcqXJNd2FbEAiX_LcD5e7aySxNi_1zq5LkONCY8qb5sNLgH-kZoazqts308GXb7zpULbSPXfcB2H3xvwXlvXCJLmpd6zVZzVK77Jxtjr5gZUV50QEsKuvBoYtofoPhfalUk8jOWT9APTf--uN9tTg
```

### deploy a csv file to s3 bucket

```
aws  --endpoint http://localhost:4569 s3 cp tests/resources/sample.csv s3://hello-bucket/sample.csv
```

## How to deploy on AWS

1. Create a IAM role on AWS console and get accessKeyId and secretAccessKey from that.
2. Set ./aws/credentials with accessKeyId and secretAccessKey from 1.
3. Deploy to AWS

```
npx sls deploy --stage dev
```
