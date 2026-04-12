variable "project" {
  description = "Project name"
  type        = string
}

variable "environment" {
  description = "Environment name (e.g. prod, test)"
  type        = string
}

variable "domain_name" {
  description = "Custom domain for the admin site (e.g. admin.nosko.app)"
  type        = string
}

variable "certificate_arn" {
  description = "ACM certificate ARN for the custom domain (must be in us-east-1)"
  type        = string
}

variable "api_domain" {
  description = "API Gateway custom domain (e.g. api.nosko.app)"
  type        = string
}

variable "admin_api_key" {
  description = "Admin API key injected by CloudFront on /v1/admin/* requests"
  type        = string
  sensitive   = true
}
