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

    # admin-v1
    "POST /v1/admin/login"                       = "admin-v1"
    "POST /v1/admin/request-password-reset"      = "admin-v1"
    "POST /v1/admin/reset-password"              = "admin-v1"
    "GET /v1/admin/customers"                    = "admin-v1"
    "GET /v1/admin/customers/{id}"               = "admin-v1"
    "DELETE /v1/admin/customers/{id}"            = "admin-v1"
    "GET /v1/admin/institutions"                 = "admin-v1"
    "POST /v1/admin/institutions"                = "admin-v1"
    "PUT /v1/admin/institutions/{id}"            = "admin-v1"
    "DELETE /v1/admin/institutions/{id}"         = "admin-v1"
    "GET /v1/admin/budget-categories"            = "admin-v1"
    "POST /v1/admin/budget-categories"           = "admin-v1"
    "PUT /v1/admin/budget-categories/{id}"       = "admin-v1"
    "DELETE /v1/admin/budget-categories/{id}"    = "admin-v1"
    "GET /v1/admin/admins"                       = "admin-v1"
    "POST /v1/admin/admins"                      = "admin-v1"
    "DELETE /v1/admin/admins/{id}"               = "admin-v1"
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
    "https://${var.web_domain}",
    "http://localhost:3000",
    "http://localhost:5173",
  ]

  domain_name     = var.api_domain
  certificate_arn = aws_acm_certificate.api.arn
}
