terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket         = "nosko-terraform-state"
    key            = "nosko/test/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "nosko-terraform-locks"
    encrypt        = true
  }

  required_version = ">= 1.3"
}

provider "aws" {
  region = var.aws_region
  assume_role {
    role_arn = "arn:aws:iam::${var.account_id}:role/OrganizationAccountAccessRole"
  }
}

provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"
  assume_role {
    role_arn = "arn:aws:iam::${var.account_id}:role/OrganizationAccountAccessRole"
  }
}

provider "aws" {
  alias  = "mgmt"
  region = var.aws_region
}
