variable "project" {
  description = "Project name"
  type        = string
}

variable "environment" {
  description = "Environment name (e.g. prod, dev)"
  type        = string
}

variable "domain_name" {
  description = "Custom domain for the static site (e.g. web.marcelosavian.com)"
  type        = string
}

variable "certificate_arn" {
  description = "ACM certificate ARN for the custom domain (must be in us-east-1)"
  type        = string
}

variable "zone_id" {
  description = "Route53 zone ID for the custom domain DNS record"
  type        = string
}
