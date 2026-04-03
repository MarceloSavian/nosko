locals {
  route_map = {
    # customer-v1
    "POST /v1/signup"                 = "customer-v1"
    "POST /v1/login"                  = "customer-v1"
    "POST /v1/verify-email"           = "customer-v1"
    "POST /v1/resend-verification"    = "customer-v1"
    "POST /v1/request-password-reset" = "customer-v1"
    "POST /v1/reset-password"         = "customer-v1"

    # profile-v1
    "GET /v1/me"            = "profile-v1"
    "PUT /v1/me"            = "profile-v1"
    "DELETE /v1/me"         = "profile-v1"
    "GET /v1/me/currencies" = "profile-v1"
    "PUT /v1/me/currencies" = "profile-v1"

    # account-v1
    "GET /v1/accounts"          = "account-v1"
    "POST /v1/accounts"         = "account-v1"
    "GET /v1/accounts/overview" = "account-v1"
    "GET /v1/accounts/{id}"     = "account-v1"
    "PUT /v1/accounts/{id}"     = "account-v1"
    "DELETE /v1/accounts/{id}"  = "account-v1"

    # institution-v1
    "GET /v1/institutions" = "institution-v1"

    # partnership-v1
    "POST /v1/partnership/invite"                   = "partnership-v1"
    "GET /v1/partnership/invitations"               = "partnership-v1"
    "POST /v1/partnership/invitations/{id}/accept"  = "partnership-v1"
    "POST /v1/partnership/invitations/{id}/decline" = "partnership-v1"
    "DELETE /v1/partnership/invitations/{id}"       = "partnership-v1"
    "GET /v1/partnership"                           = "partnership-v1"
    "DELETE /v1/partnership"                        = "partnership-v1"
    "GET /v1/partnership/contribution-rules"        = "partnership-v1"
    "PUT /v1/partnership/contribution-rules"        = "partnership-v1"
    "GET /v1/partnership/shared-accounts"           = "partnership-v1"
    "PUT /v1/partnership/shared-accounts"           = "partnership-v1"

    # transaction-v1
    "GET /v1/transactions"         = "transaction-v1"
    "POST /v1/transactions"        = "transaction-v1"
    "PUT /v1/transactions/{id}"    = "transaction-v1"
    "DELETE /v1/transactions/{id}" = "transaction-v1"

    # budget-v1
    "GET /v1/budget-categories"                   = "budget-v1"
    "POST /v1/budget-categories"                  = "budget-v1"
    "PUT /v1/budget-categories/{id}"              = "budget-v1"
    "DELETE /v1/budget-categories/{id}"           = "budget-v1"
    "GET /v1/budget-plans"                        = "budget-v1"
    "POST /v1/budget-plans"                       = "budget-v1"
    "DELETE /v1/budget-plans/{id}"                = "budget-v1"
    "GET /v1/partnership/budget-plans"            = "budget-v1"
    "POST /v1/partnership/budget-plans"           = "budget-v1"
    "DELETE /v1/partnership/budget-plans/{id}"    = "budget-v1"
    "GET /v1/budget-plans/summary"                = "budget-v1"
    "POST /v1/budget-plans/{planId}/items"        = "budget-v1"
    "PUT /v1/budget-plans/{planId}/items/{id}"    = "budget-v1"
    "DELETE /v1/budget-plans/{planId}/items/{id}" = "budget-v1"

    # dashboard-v1
    "GET /v1/dashboard" = "dashboard-v1"

    # docs-v1
    "GET /v1/docs"              = "docs-v1"
    "GET /v1/docs/openapi.json" = "docs-v1"
  }

}

module "api_routing" {
  source      = "../../modules/api-routing/aws-apigw-v2"
  project     = var.project
  environment = var.environment

  routes               = local.route_map
  function_invoke_arns = module.compute.function_invoke_arns
  function_arns        = module.compute.function_arns

  cors_origins = [
    "https://web.${var.domain_name}",
    "https://app.${var.domain_name}",
    "http://localhost:3000",
    "http://localhost:5173",
  ]

  domain_name     = "api.${var.domain_name}"
  certificate_arn = aws_acm_certificate.api.arn
  zone_id         = data.aws_route53_zone.main.zone_id
}
