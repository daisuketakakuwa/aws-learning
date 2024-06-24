// terraformブロック
// - terraformが利用するProviderを指定/設定する。
// - 今回だとAWSへデプロイするためのプラグインをインストールする。
terraform {
  // Terraform Registry から該当のproviderを探してインストールする。
  required_providers {
    aws = {
      source  = "hashicorp/aws" // registry.terraform.io/hashicorp/aws の略
      version = "~> 4.16"
    }
  }

  required_version = ">= 1.2.0"
}

// providerブロック
// - デプロイ対象のProviderに関する設定
// - 今回だとAWSに関する設定をする。
provider "aws" {
  region = "us-west-2"
}

// resourceブロック
// 【resource [type] [name]】
// - terraformでデプロイしたいリソース
// - 例) EC2インスタンス「app_server」という名前
// -     インスタンスのIDは「aws_instance.app_server」となる?
resource "aws_instance" "app_server" {
  ami           = "ami-830c94e3"
  instance_type = "t2.micro"

  tags = {
    Name = "ExampleAppServerInstance"
  }
}


// ケース1: VPC、Subnet、EC2インスタンス作成

// ※ファイル分割？


// ケース2: ECSタスク(IAMロール、タスク定義)


