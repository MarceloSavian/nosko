variable "project" {
  description = "Project name"
  type        = string
}

variable "environment" {
  description = "Environment name (e.g. test, prod)"
  type        = string
}

variable "domain_name" {
  description = "Optional custom domain; when null, CloudFront uses its default *.cloudfront.net domain"
  type        = string
  default     = null
}

variable "certificate_arn" {
  description = "ACM certificate ARN (us-east-1) for the custom domain; required only when domain_name is set"
  type        = string
  default     = null
}
