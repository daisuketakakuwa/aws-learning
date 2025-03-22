## TerraformでAWSリソースを作成する


１．設定ファイル `main.tf`を用意する。

- terraformブロック, providerブロックで基盤設定 -> `provider.tf`
- resouceブロック、moduleブロックでデプロイするリソースを定義。 -> `main.tf`

２．設定ファイルに定義したProviderをインストールする(`terraform init`)

```
cd 対象ディレクトリ
terraform init
```

- `.terraform`配下にProviderがダウンロードされる。
- ロックファイル(`.terraform.lock.hcl`)でダウンロードしたProviderを記録/Version管理する。


３．定義した設定ファイルが正しいかどうか確認（`terraform validate`）

４．作成予定のリソースを確認（`terraform plan`）

５．デプロイ（`terraform apply`）

６．確認（`terraform show`）

７．取消（`terraform destroy`）

<br>

## variable宣言 で 変数定義
どこにでも定義可能であるが、`variables.tf`ファイルに定義するのが公式推奨。

```
variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "ap-northeast-1"
}
```

`default`に設定値がないと、`apply`コマンド実行時に対話形式で入力を求められる。

```
C:\Users\daisu\Desktop\workspace\cloud-learning\terraform-with-aws>terraform apply
var.aws_region
  AWS region

  Enter a value:
```

**説明用にvariable定義するだけで、defaultは設定しないもあり👍**

<br>

## ModuleでらくらくResouce生成
複数のリソース生成をまとめたテンプレート = モジュール として提供している。

