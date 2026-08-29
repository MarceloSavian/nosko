output "function_arns" {
  description = "Map of function name to ARN"
  value       = { for k, fn in aws_lambda_function.fn : k => fn.arn }
}

output "function_invoke_arns" {
  description = "Map of function name to invoke ARN"
  value       = { for k, fn in aws_lambda_function.fn : k => fn.invoke_arn }
}

output "function_names" {
  description = "Map of function name to deployed function name"
  value       = { for k, fn in aws_lambda_function.fn : k => fn.function_name }
}

output "role_names" {
  description = "Map of function name to IAM role name"
  value       = { for k, r in aws_iam_role.lambda : k => r.name }
}
