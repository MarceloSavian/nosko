module "static_site" {
  source      = "../../modules/static-site/aws-s3-cloudfront"
  project     = var.project
  environment = var.environment

  # Custom domain (var.web_domain) served via a us-east-1 ACM certificate (data.tf).
  domain_name     = var.web_domain
  certificate_arn = aws_acm_certificate_validation.web.certificate_arn
}
