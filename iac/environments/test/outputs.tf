output "api_endpoint" {
  description = "API Gateway default endpoint (BFF)"
  value       = module.api_routing.api_endpoint
}

output "static_site_bucket" {
  description = "S3 bucket for the SPA (sync web/dist here)"
  value       = module.static_site.bucket_name
}

output "static_site_distribution_id" {
  description = "CloudFront distribution ID (for cache invalidation)"
  value       = module.static_site.distribution_id
}

output "static_site_url" {
  description = "SPA URL"
  value       = "https://${module.static_site.distribution_domain_name}"
}

output "uploads_bucket" {
  description = "Private S3 bucket for uploaded bank statements"
  value       = module.uploads.bucket_name
}
