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
    bucket       = "nosko-tfstate-936834757679"
    key          = "nosko/test/terraform.tfstate"
    region       = "eu-west-1"
    encrypt      = true
    use_lockfile = true
  }

  required_version = ">= 1.6"
}

# Run as the management profile (aws-vault exec mgmt). App infra lives in the test
# account, so the default/us_east_1 providers assume OrganizationAccountAccessRole there;
# the mgmt provider keeps the ambient management creds for the nosko.app Route53 zone.
provider "aws" {
  region = var.aws_region

  assume_role {
    role_arn = "arn:aws:iam::${var.account_id}:role/OrganizationAccountAccessRole"
  }

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

  assume_role {
    role_arn = "arn:aws:iam::${var.account_id}:role/OrganizationAccountAccessRole"
  }

  default_tags {
    tags = {
      Project     = var.project
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}

# The nosko.app Route53 zone lives in the management account. This alias uses the
# ambient management-account creds (no assume_role) to manage records in that zone.
provider "aws" {
  alias  = "mgmt"
  region = var.aws_region
}
