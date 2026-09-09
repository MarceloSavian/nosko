locals {
  artifacts_dir = "${path.module}/artifacts"

  bff_env = {
    APP_ENV        = var.environment
    UPLOADS_BUCKET = module.uploads.bucket_name
    EMAIL_FROM     = var.email_from
    # app_role only — never the admin database_url (it would bypass RLS via neon_superuser).
    DATABASE_URL = var.app_database_url
    JWT_SECRET   = var.jwt_secret
  }

  bff_secret_arns = [
    module.secrets.secret_arns["APP_DATABASE_URL"],
    module.secrets.secret_arns["JWT_SECRET"],
  ]

  # migration-v1 runs DDL and provisions app_role, so it needs the admin connection plus the
  # password to set on app_role.
  db_env = {
    DATABASE_URL    = var.database_url
    APP_DB_PASSWORD = var.app_db_password
  }
  db_secret_arns = [
    module.secrets.secret_arns["DATABASE_URL"],
    module.secrets.secret_arns["APP_DB_PASSWORD"],
  ]
}

data "aws_iam_policy_document" "bff" {
  statement {
    sid       = "UploadsBucket"
    actions   = ["s3:GetObject", "s3:PutObject", "s3:ListBucket"]
    resources = [module.uploads.bucket_arn, "${module.uploads.bucket_arn}/*"]
  }

  statement {
    sid       = "SendEmail"
    actions   = ["ses:SendEmail", "ses:SendRawEmail"]
    resources = ["*"]
  }
}

module "compute" {
  source      = "../../modules/compute/aws-lambda"
  project     = var.project
  environment = var.environment

  functions = {
    bff-v1 = {
      handler                        = "index.handler"
      runtime                        = var.lambda_runtime
      source_path                    = "${local.artifacts_dir}/bff-v1.zip"
      memory_size                    = 512
      timeout                        = 30
      reserved_concurrent_executions = var.bff_reserved_concurrency
      env_vars                       = local.bff_env
      secret_arns                    = local.bff_secret_arns
    }

    migration-v1 = {
      handler                        = "index.handler"
      runtime                        = var.lambda_runtime
      source_path                    = "${local.artifacts_dir}/migration-v1.zip"
      timeout                        = 60
      reserved_concurrent_executions = -1
      env_vars                       = local.db_env
      secret_arns                    = local.db_secret_arns
    }
  }

  extra_policies = {
    bff-v1 = data.aws_iam_policy_document.bff.json
  }
}
