output "secret_arns" {
  description = "Map of secret name to ARN"
  value       = { for k, v in aws_ssm_parameter.secret : k => v.arn }
}
