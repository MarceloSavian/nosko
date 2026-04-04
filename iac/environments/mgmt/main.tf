terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket         = "nosko-terraform-state"
    key            = "nosko/mgmt/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "nosko-terraform-locks"
    encrypt        = true
  }

  required_version = ">= 1.3"
}

provider "aws" {
  region = var.aws_region
}
