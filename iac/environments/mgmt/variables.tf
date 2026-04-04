variable "aws_region" {
  type    = string
  default = "eu-west-1"
}

variable "project" {
  type    = string
  default = "nosko"
}

variable "domain_name" {
  type    = string
  default = "nosko.app"
}

variable "test_account_email" {
  type = string
}

variable "prod_account_email" {
  type = string
}

variable "alarm_email" {
  type = string
}
