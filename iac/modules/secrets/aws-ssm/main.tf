resource "aws_ssm_parameter" "secret" {
  for_each = var.secrets

  name  = "/${var.project}/${var.environment}/${each.key}"
  type  = "SecureString"
  value = sensitive(each.value)
}
