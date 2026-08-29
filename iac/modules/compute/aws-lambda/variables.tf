variable "project" {
  description = "Project name"
  type        = string
}

variable "environment" {
  description = "Environment name (e.g. test, prod)"
  type        = string
}

variable "functions" {
  description = "Map of function name to its configuration"
  type = map(object({
    handler                        = string
    runtime                        = string
    source_path                    = string
    memory_size                    = optional(number, 256)
    timeout                        = optional(number, 30)
    reserved_concurrent_executions = optional(number, -1)
    env_vars                       = map(string)
    secret_arns                    = optional(list(string), [])
  }))
}

variable "extra_policies" {
  description = "Map of function name to an inline IAM policy JSON to attach to that function's role"
  type        = map(string)
  default     = {}
}

variable "alarm_sns_topic_arn" {
  description = "SNS topic ARN for CloudWatch alarm notifications"
  type        = string
  default     = ""
}

variable "alarms_enabled" {
  description = "Whether to create CloudWatch alarms"
  type        = bool
  default     = false
}

variable "log_retention_days" {
  description = "CloudWatch log retention in days"
  type        = number
  default     = 30
}
