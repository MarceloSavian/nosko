variable "aws_region" {
  type    = string
  default = "eu-west-1"
}

variable "project" {
  type    = string
  default = "nosko"
}

variable "environment" {
  type    = string
  default = "prod"
}

variable "account_id" {
  type = string
}

variable "web_domain" {
  type    = string
  default = "nosko.app"
}

variable "api_domain" {
  type    = string
  default = "api.nosko.app"
}

variable "database_url" {
  type      = string
  sensitive = true
}

variable "jwt_secret" {
  type      = string
  sensitive = true
}

variable "resend_api_key" {
  type      = string
  sensitive = true
}

variable "email_from" {
  type    = string
  default = "noreply@nosko.app"
}

variable "alarm_email" {
  type = string
}

variable "admin_api_key" {
  type      = string
  sensitive = true
}

variable "admin_jwt_secret" {
  type      = string
  sensitive = true
}
