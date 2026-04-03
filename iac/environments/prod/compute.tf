locals {
  artifacts_dir = "${path.module}/artifacts"

  common_env = {
    DATABASE_URL = var.database_url
    JWT_SECRET   = var.jwt_secret
  }

  email_env = merge(local.common_env, {
    RESEND_API_KEY = var.resend_api_key
    EMAIL_FROM     = var.email_from
  })

  db_env = {
    DATABASE_URL = var.database_url
  }

  common_secret_arns = [
    module.secrets.secret_arns["DATABASE_URL"],
    module.secrets.secret_arns["JWT_SECRET"],
  ]

  email_secret_arns = concat(local.common_secret_arns, [
    module.secrets.secret_arns["RESEND_API_KEY"],
    module.secrets.secret_arns["EMAIL_FROM"],
  ])

  db_secret_arns = [
    module.secrets.secret_arns["DATABASE_URL"],
  ]

  handlers = {
    customer-v1    = { env_vars = local.email_env, secret_arns = local.email_secret_arns, concurrency = -1 }
    profile-v1     = { env_vars = local.common_env, secret_arns = local.common_secret_arns, concurrency = -1 }
    account-v1     = { env_vars = local.common_env, secret_arns = local.common_secret_arns, concurrency = -1 }
    institution-v1 = { env_vars = local.common_env, secret_arns = local.common_secret_arns, concurrency = -1 }
    partnership-v1 = { env_vars = local.email_env, secret_arns = local.email_secret_arns, concurrency = -1 }
    transaction-v1 = { env_vars = local.common_env, secret_arns = local.common_secret_arns, concurrency = -1 }
    budget-v1      = { env_vars = local.common_env, secret_arns = local.common_secret_arns, concurrency = -1 }
    dashboard-v1   = { env_vars = local.common_env, secret_arns = local.common_secret_arns, concurrency = -1 }
    migration-v1   = { env_vars = local.db_env, secret_arns = local.db_secret_arns, concurrency = -1 }
  }
}

module "compute" {
  source      = "../../modules/compute/aws-lambda"
  project     = var.project
  environment = var.environment

  alarms_enabled      = true
  alarm_sns_topic_arn = aws_sns_topic.alarms.arn

  functions = {
    for name, cfg in local.handlers : name => {
      handler                        = "index.handler"
      runtime                        = "nodejs20.x"
      source_path                    = "${local.artifacts_dir}/${name}.zip"
      env_vars                       = cfg.env_vars
      secret_arns                    = cfg.secret_arns
      reserved_concurrent_executions = cfg.concurrency
    }
  }
}
