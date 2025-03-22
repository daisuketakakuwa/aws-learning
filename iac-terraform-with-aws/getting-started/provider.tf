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
  region = var.aws_region
}

