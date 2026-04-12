module "static_site" {
  source      = "../../modules/static-site/aws-s3-cloudfront"
  project     = var.project
  environment = var.environment

  domain_name     = var.web_domain
  certificate_arn = aws_acm_certificate_validation.web.certificate_arn
}

output "static_site_bucket_name" {
  value = module.static_site.bucket_name
}

output "static_site_distribution_id" {
  value = module.static_site.distribution_id
}

module "admin_site" {
  source      = "../../modules/admin-site/aws-s3-cloudfront-proxy"
  project     = var.project
  environment = var.environment

  domain_name     = var.admin_domain
  certificate_arn = aws_acm_certificate_validation.admin.certificate_arn
  api_domain      = var.api_domain
  admin_api_key   = var.admin_api_key
}

output "admin_site_bucket_name" {
  value = module.admin_site.bucket_name
}

output "admin_site_distribution_id" {
  value = module.admin_site.distribution_id
}
