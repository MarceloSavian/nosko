data "aws_route53_zone" "main" {
  provider = aws.mgmt
  name     = "nosko.app"
}

resource "aws_acm_certificate" "api" {
  domain_name       = var.api_domain
  validation_method = "DNS"

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_route53_record" "api_cert_validation" {
  provider = aws.mgmt

  for_each = {
    for dvo in aws_acm_certificate.api.domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      type   = dvo.resource_record_type
      record = dvo.resource_record_value
    }
  }

  zone_id = data.aws_route53_zone.main.zone_id
  name    = each.value.name
  type    = each.value.type
  ttl     = 60
  records = [each.value.record]
}

resource "aws_acm_certificate_validation" "api" {
  certificate_arn         = aws_acm_certificate.api.arn
  validation_record_fqdns = [for record in aws_route53_record.api_cert_validation : record.fqdn]
}

resource "aws_acm_certificate" "web" {
  provider          = aws.us_east_1
  domain_name       = var.web_domain
  validation_method = "DNS"

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_route53_record" "web_cert_validation" {
  provider = aws.mgmt

  for_each = {
    for dvo in aws_acm_certificate.web.domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      type   = dvo.resource_record_type
      record = dvo.resource_record_value
    }
  }

  zone_id = data.aws_route53_zone.main.zone_id
  name    = each.value.name
  type    = each.value.type
  ttl     = 60
  records = [each.value.record]
}

resource "aws_acm_certificate_validation" "web" {
  provider                = aws.us_east_1
  certificate_arn         = aws_acm_certificate.web.arn
  validation_record_fqdns = [for record in aws_route53_record.web_cert_validation : record.fqdn]
}

resource "aws_route53_record" "api" {
  provider = aws.mgmt
  zone_id  = data.aws_route53_zone.main.zone_id
  name     = var.api_domain
  type     = "A"

  alias {
    name                   = module.api_routing.api_domain_target_domain_name
    zone_id                = module.api_routing.api_domain_target_zone_id
    evaluate_target_health = false
  }
}

resource "aws_route53_record" "web" {
  provider = aws.mgmt
  zone_id  = data.aws_route53_zone.main.zone_id
  name     = var.web_domain
  type     = "A"

  alias {
    name                   = module.static_site.distribution_domain_name
    zone_id                = module.static_site.distribution_hosted_zone_id
    evaluate_target_health = false
  }
}

resource "aws_acm_certificate" "admin" {
  provider          = aws.us_east_1
  domain_name       = var.admin_domain
  validation_method = "DNS"

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_route53_record" "admin_cert_validation" {
  provider = aws.mgmt

  for_each = {
    for dvo in aws_acm_certificate.admin.domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      type   = dvo.resource_record_type
      record = dvo.resource_record_value
    }
  }

  zone_id = data.aws_route53_zone.main.zone_id
  name    = each.value.name
  type    = each.value.type
  ttl     = 60
  records = [each.value.record]
}

resource "aws_acm_certificate_validation" "admin" {
  provider                = aws.us_east_1
  certificate_arn         = aws_acm_certificate.admin.arn
  validation_record_fqdns = [for record in aws_route53_record.admin_cert_validation : record.fqdn]
}

resource "aws_route53_record" "admin" {
  provider = aws.mgmt
  zone_id  = data.aws_route53_zone.main.zone_id
  name     = var.admin_domain
  type     = "A"

  alias {
    name                   = module.admin_site.distribution_domain_name
    zone_id                = module.admin_site.distribution_hosted_zone_id
    evaluate_target_health = false
  }
}
