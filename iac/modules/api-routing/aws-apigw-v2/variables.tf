variable "project" {
  description = "Project name"
  type        = string
}

variable "environment" {
  description = "Environment name (e.g. test, prod)"
  type        = string
}

variable "routes" {
  description = "Map of route key (e.g. 'POST /api/rpc', '$default') to handler name"
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
  description = "Optional custom domain for the API"
  type        = string
  default     = null
}

variable "certificate_arn" {
  description = "ACM certificate ARN for the custom domain (regional)"
  type        = string
  default     = null
}

variable "cors_origins" {
  description = "List of allowed CORS origins"
  type        = list(string)
}

variable "throttling_burst_limit" {
  description = "Max concurrent requests (burst)"
  type        = number
  default     = 20
}

variable "throttling_rate_limit" {
  description = "Steady-state requests per second"
  type        = number
  default     = 20
}
