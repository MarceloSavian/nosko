variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "eu-west-1"
}

variable "project" {
  description = "Project name"
  type        = string
  default     = "nosko"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "prod"
}

variable "domain_name" {
  description = "Root domain name"
  type        = string
  default     = "marcelosavian.com"
}

variable "database_url" {
  description = "PostgreSQL connection string (Neon)"
  type        = string
  sensitive   = true
}

variable "jwt_secret" {
  description = "Secret for JWT signing"
  type        = string
  sensitive   = true
}

variable "resend_api_key" {
  description = "Resend email service API key"
  type        = string
  sensitive   = true
}

variable "email_from" {
  description = "Sender email address"
  type        = string
  default     = "noreply@marcelosavian.com"
}

variable "alarm_email" {
  description = "Email address to receive CloudWatch alarm notifications"
  type        = string
}
