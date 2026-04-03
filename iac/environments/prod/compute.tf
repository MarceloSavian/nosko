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

  handlers = {
    customer-v1    = { env_vars = local.email_env }
    profile-v1     = { env_vars = local.common_env }
    account-v1     = { env_vars = local.common_env }
    institution-v1 = { env_vars = local.common_env }
    partnership-v1 = { env_vars = local.email_env }
    transaction-v1 = { env_vars = local.common_env }
    budget-v1      = { env_vars = local.common_env }
    dashboard-v1   = { env_vars = local.common_env }
    migration-v1   = { env_vars = local.db_env }
  }
}

module "compute" {
  source      = "../../modules/compute/aws-lambda"
  project     = var.project
  environment = var.environment
  secret_arns = values(module.secrets.secret_arns)

  functions = {
    for name, cfg in local.handlers : name => {
      handler     = "index.handler"
      runtime     = "nodejs20.x"
      source_path = "${local.artifacts_dir}/${name}.zip"
      env_vars    = cfg.env_vars
    }
  }
}
