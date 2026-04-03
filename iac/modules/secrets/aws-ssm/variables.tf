variable "project" {
  description = "Project name"
  type        = string
}

variable "environment" {
  description = "Environment name (e.g. prod, dev)"
  type        = string
}

variable "secrets" {
  description = "Map of secret name to value"
  type        = map(string)
}
