output "bucket_name" {
  description = "S3 bucket name for deploying static files"
  value       = aws_s3_bucket.site.id
}

output "distribution_id" {
  description = "CloudFront distribution ID for cache invalidation"
  value       = aws_cloudfront_distribution.site.id
}

output "distribution_domain_name" {
  description = "CloudFront distribution domain name"
  value       = aws_cloudfront_distribution.site.domain_name
}

output "distribution_hosted_zone_id" {
  description = "CloudFront distribution hosted zone ID for Route53 alias record"
  value       = aws_cloudfront_distribution.site.hosted_zone_id
}
