module "api_routing" {
  source      = "../../modules/api-routing/aws-apigw-v2"
  project     = var.project
  environment = var.environment

  # Single BFF Lambda: a catch-all route lets the Effect app route internally
  # (/api/rpc and /api/http/*). Migration Lambda is invoked directly, not via the API.
  routes = {
    "$default" = "bff-v1"
  }

  function_invoke_arns = { for k, v in module.compute.function_invoke_arns : k => v if k == "bff-v1" }
  function_arns        = { for k, v in module.compute.function_arns : k => v if k == "bff-v1" }

  cors_origins = compact([
    var.web_domain != null ? "https://${var.web_domain}" : "",
    "http://localhost:5173",
  ])

  throttling_rate_limit  = var.throttling_rate_limit
  throttling_burst_limit = var.throttling_burst_limit

  # Custom domain (var.api_domain) served via a regional ACM certificate (data.tf).
  domain_name     = var.api_domain
  certificate_arn = aws_acm_certificate_validation.api.certificate_arn
}
