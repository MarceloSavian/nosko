variable "project" {
  description = "Project name"
  type        = string
}

variable "environment" {
  description = "Environment name (e.g. prod, dev)"
  type        = string
}

variable "routes" {
  description = "Map of route key (e.g. 'POST /v1/signup') to handler name"
  type        = map(string)
}

variable "function_invoke_arns" {
  description = "Map of handler name to Lambda invoke ARN"
  type        = map(string)
}

variable "function_arns" {
  description = "Map of handler name to Lambda ARN (for permissions)"
  type        = map(string)
}

variable "domain_name" {
  description = "Custom domain for the API (e.g. api.marcelosavian.com)"
  type        = string
  default     = null
}

variable "certificate_arn" {
  description = "ACM certificate ARN for the custom domain"
  type        = string
  default     = null
}

variable "zone_id" {
  description = "Route53 zone ID for the custom domain DNS record"
  type        = string
  default     = null
}
