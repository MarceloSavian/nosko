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
  default = "test"
}

variable "lambda_runtime" {
  # AWS Lambda's newest managed Node runtime is nodejs22.x (no 24 yet). Local dev stays Node 24.
  type    = string
  default = "nodejs22.x"
}

variable "database_url" {
  description = "Neon PostgreSQL pooled connection string"
  type        = string
  sensitive   = true
}

variable "jwt_secret" {
  description = "Signing secret for session/access tokens"
  type        = string
  sensitive   = true
}

variable "email_from" {
  description = "Verified SES sender address for verification/MFA/invite emails"
  type        = string
  default     = "noreply@example.com"
}

variable "web_domain" {
  description = "Optional custom domain for the SPA (null = CloudFront default domain)"
  type        = string
  default     = null
}

variable "api_domain" {
  description = "Optional custom domain for the API (null = API Gateway default endpoint)"
  type        = string
  default     = null
}

# --- Cost controls (strict by default) ---

variable "throttling_rate_limit" {
  description = "API Gateway steady-state requests/second (strict cost cap)"
  type        = number
  default     = 5
}

variable "throttling_burst_limit" {
  description = "API Gateway burst request cap"
  type        = number
  default     = 10
}

variable "bff_reserved_concurrency" {
  # -1 = unreserved. The nosko-test account's total concurrency limit is 10, which already caps
  # every Lambda account-wide; reserving any slice is disallowed until that limit is raised.
  description = "Reserved concurrency for the BFF Lambda (-1 = unreserved / use the account pool)"
  type        = number
  default     = -1
}

variable "monthly_budget_usd" {
  description = "Monthly AWS budget in USD used for alert thresholds"
  type        = string
  default     = "5"
}

variable "budget_email" {
  description = "Email for budget alerts; when null, no budget is created"
  type        = string
  default     = null
}
