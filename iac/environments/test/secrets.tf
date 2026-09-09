module "secrets" {
  source      = "../../modules/secrets/aws-ssm"
  project     = var.project
  environment = var.environment

  secrets = {
    DATABASE_URL     = var.database_url
    APP_DATABASE_URL = var.app_database_url
    APP_DB_PASSWORD  = var.app_db_password
    JWT_SECRET       = var.jwt_secret
  }
}
