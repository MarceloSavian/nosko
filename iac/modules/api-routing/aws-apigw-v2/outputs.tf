output "api_endpoint" {
  description = "The default API Gateway endpoint URL"
  value       = aws_apigatewayv2_api.api.api_endpoint
}

output "api_id" {
  description = "The API Gateway ID"
  value       = aws_apigatewayv2_api.api.id
}

output "api_domain_target_domain_name" {
  description = "Target domain name for Route53 alias record"
  value       = var.domain_name != null ? aws_apigatewayv2_domain_name.api[0].domain_name_configuration[0].target_domain_name : null
}

output "api_domain_target_zone_id" {
  description = "Target hosted zone ID for Route53 alias record"
  value       = var.domain_name != null ? aws_apigatewayv2_domain_name.api[0].domain_name_configuration[0].hosted_zone_id : null
}
