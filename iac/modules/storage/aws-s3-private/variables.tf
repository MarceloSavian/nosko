variable "project" {
  description = "Project name"
  type        = string
}

variable "environment" {
  description = "Environment name (e.g. test, prod)"
  type        = string
}

variable "name" {
  description = "Bucket suffix (e.g. uploads)"
  type        = string
}

variable "versioning" {
  description = "Whether to enable object versioning"
  type        = bool
  default     = true
}
