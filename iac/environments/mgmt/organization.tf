resource "aws_organizations_organization" "org" {
  feature_set = "ALL"
}

resource "aws_organizations_organizational_unit" "test" {
  name      = "test"
  parent_id = aws_organizations_organization.org.roots[0].id
}

resource "aws_organizations_organizational_unit" "prod" {
  name      = "prod"
  parent_id = aws_organizations_organization.org.roots[0].id
}

resource "aws_organizations_account" "test" {
  name      = "${var.project}-test"
  email     = var.test_account_email
  parent_id = aws_organizations_organizational_unit.test.id
  role_name = "OrganizationAccountAccessRole"
}

resource "aws_organizations_account" "prod" {
  name      = "${var.project}-prod"
  email     = var.prod_account_email
  parent_id = aws_organizations_organizational_unit.prod.id
  role_name = "OrganizationAccountAccessRole"
}
