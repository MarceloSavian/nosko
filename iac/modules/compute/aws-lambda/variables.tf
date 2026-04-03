variable "project" {
  description = "Project name"
  type        = string
}

variable "environment" {
  description = "Environment name (e.g. prod, dev)"
  type        = string
}

variable "functions" {
  description = "Map of function name to its configuration"
  type = map(object({
    handler     = string
    runtime     = string
    source_path = string
    memory_size = optional(number, 256)
    timeout     = optional(number, 30)
    env_vars    = map(string)
  }))
}

variable "secret_arns" {
  description = "List of SSM parameter ARNs the functions need read access to"
  type        = list(string)
  default     = []
}
