output "api_endpoint" {
  description = "The default API Gateway endpoint URL"
  value       = aws_apigatewayv2_api.api.api_endpoint
}

output "api_id" {
  description = "The API Gateway ID"
  value       = aws_apigatewayv2_api.api.id
}
