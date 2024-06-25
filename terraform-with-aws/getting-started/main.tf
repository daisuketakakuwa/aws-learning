// resourceブロック
// 【resource [type] [name]】
// - terraformでデプロイしたいリソース
// - 例) EC2インスタンス「app_server」という名前
// -     インスタンスのIDは「aws_instance.app_server」となる

// "aws_instance"単体で作成する場合は、以下が存在することが前提。
// ・ 同じAZ内でdefault_subnet (default_vpc)
//    → default_subnetはCLIからのみ作成可能
//        aws ec2 create-default-subnet --availability-zone ap-northeast-1a
resource "aws_instance" "app_server" {
  ami               = "ami-061a125c7c02edb39" // regionごとにAMI IDは異なる
  instance_type     = "t2.micro"
  availability_zone = "ap-northeast-1a" // provider.region内のAZであること

  tags = {
    Name = "ExampleAppServerInstance"
  }
}

// 🔴フォルダ? モジュール? を指定して、実行する。

// 🔵provider.tfを分ける


// ケース1: VPC、Subnet、EC2インスタンス作成

// ※ファイル分割？


// ケース2: ECSタスク(IAMロール、タスク定義)


