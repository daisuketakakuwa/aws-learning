## TerraformでAWSリソースを作成する


１．設定ファイル `main.tf`を用意する。

- terraformブロック, providerブロックで基盤設定。
- resouceブロック、moduleブロックでデプロイするリソースを定義。

２．設定ファイルに定義したProviderをインストールする(`terraform init`)

- `.terraform`配下にProviderがダウンロードされる。
- ロックファイル(`.terraform.lock.hcl`)でダウンロードしたProviderを記録/Version管理する。


３．定義した設定ファイルが正しいかどうか確認（`terraform validate`）





## ModuleでらくらくResouce生成
複数のリソース生成をまとめたテンプレート = モジュール として提供している。

