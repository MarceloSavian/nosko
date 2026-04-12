module "secrets" {
  source      = "../../modules/secrets/aws-ssm"
  project     = var.project
  environment = var.environment

  secrets = {
    DATABASE_URL     = var.database_url
    JWT_SECRET       = var.jwt_secret
    RESEND_API_KEY   = var.resend_api_key
    EMAIL_FROM       = var.email_from
    ADMIN_API_KEY    = var.admin_api_key
    ADMIN_JWT_SECRET = var.admin_jwt_secret
  }
}
