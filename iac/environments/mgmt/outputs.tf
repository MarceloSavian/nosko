output "zone_id" {
  value = aws_route53_zone.main.zone_id
}

output "zone_name_servers" {
  value = aws_route53_zone.main.name_servers
}

output "test_account_id" {
  value = aws_organizations_account.test.id
}

output "prod_account_id" {
  value = aws_organizations_account.prod.id
}

output "organization_id" {
  value = aws_organizations_organization.org.id
}
