terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # State bucket in the nosko-test account (create once via scripts/bootstrap-state.sh).
  # S3-native locking (use_lockfile) — no DynamoDB table required.
  backend "s3" {
    bucket       = "finance-app-tfstate-936834757679"
    key          = "finance-app/test/terraform.tfstate"
    region       = "eu-west-1"
    encrypt      = true
    use_lockfile = true
  }

  required_version = ">= 1.6"
}

# aws-vault exec nosko-test already assumes OrganizationAccountAccessRole into the test account,
# so Terraform runs directly as that account — no provider-level assume_role.
provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = var.project
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}

# CloudFront ACM certificates must live in us-east-1 (used only when a custom domain is set).
provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"

  default_tags {
    tags = {
      Project     = var.project
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}
