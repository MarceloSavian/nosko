module "secrets" {
  source      = "../../modules/secrets/aws-ssm"
  project     = var.project
  environment = var.environment

  secrets = {
    DATABASE_URL = var.database_url
    JWT_SECRET   = var.jwt_secret
  }
}
