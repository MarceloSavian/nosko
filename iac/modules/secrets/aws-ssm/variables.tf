variable "project" {
  description = "Project name"
  type        = string
}

variable "environment" {
  description = "Environment name (e.g. test, prod)"
  type        = string
}

variable "secrets" {
  description = "Map of secret name to value (values are stored as SecureString)"
  type        = map(string)
}
