module "uploads" {
  source      = "../../modules/storage/aws-s3-private"
  project     = var.project
  environment = var.environment
  name        = "uploads"
}
