module "static_site" {
  source      = "../../modules/static-site/aws-s3-cloudfront"
  project     = var.project
  environment = var.environment

  # Baseline uses the default *.cloudfront.net domain. To attach a custom domain,
  # set web_domain and pass a us-east-1 ACM certificate_arn.
  domain_name = var.web_domain
}
