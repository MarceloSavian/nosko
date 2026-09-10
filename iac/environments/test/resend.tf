# Resend transactional-email sending domain: mail.nosko.app (separate from the web/api domains
# to keep sending reputation isolated). DMARC sits at the organizational root (nosko.app), same
# pattern as the personal/terraform repo's resend.tf for marcelosavian.com; DKIM/SPF-equivalent
# records are scoped to the mail. subdomain being verified. Resend verifies on SPF+DKIM+MX alone,
# so DMARC isn't required to send but is still published.

resource "aws_route53_record" "resend_dkim" {
  provider = aws.mgmt
  zone_id  = data.aws_route53_zone.main.zone_id
  name     = "resend._domainkey.mail.nosko.app"
  type     = "TXT"
  ttl      = 300
  records  = ["p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDwdaGdTki0YbNs7vzyHcEtxDL3UfsxG8E7D3IMnwq9hNyQD+qn3l7lDYaslGf/dS9bcPbUWR+ikd7h72V9xY1YmGoFO3ULd5jskm2te2H6l186iTpdlaIEkMjEQxzAQF5nss3jBfFisB2TzHC+nP9vUhwZT3/mnoQIcoAnQeewNQIDAQAB"]
}

resource "aws_route53_record" "resend_spf_rsend" {
  provider = aws.mgmt
  zone_id  = data.aws_route53_zone.main.zone_id
  name     = "rsend.mail.nosko.app"
  type     = "CNAME"
  ttl      = 300
  records  = ["rsend-euw1.forge.rmta.net"]
}

resource "aws_route53_record" "resend_spf_send" {
  provider = aws.mgmt
  zone_id  = data.aws_route53_zone.main.zone_id
  name     = "send.mail.nosko.app"
  type     = "CNAME"
  ttl      = 300
  records  = ["send.forge.rmta.net"]
}

resource "aws_route53_record" "resend_dmarc" {
  provider = aws.mgmt
  zone_id  = data.aws_route53_zone.main.zone_id
  name     = "_dmarc.nosko.app"
  type     = "TXT"
  ttl      = 300
  records  = ["v=DMARC1; p=none;"]
}
