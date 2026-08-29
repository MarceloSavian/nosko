data "aws_iam_policy_document" "assume_role" {
  statement {
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "lambda" {
  for_each = var.functions

  name               = "${var.project}-${var.environment}-${each.key}"
  assume_role_policy = data.aws_iam_policy_document.assume_role.json
}

resource "aws_iam_role_policy_attachment" "lambda_logs" {
  for_each = var.functions

  role       = aws_iam_role.lambda[each.key].name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

locals {
  functions_with_secrets = {
    for k, v in var.functions : k => v if length(v.secret_arns) > 0
  }
}

data "aws_iam_policy_document" "ssm_read" {
  for_each = local.functions_with_secrets

  statement {
    actions   = ["ssm:GetParameter"]
    resources = each.value.secret_arns
  }
}

resource "aws_iam_role_policy" "ssm_read" {
  for_each = local.functions_with_secrets

  name   = "${var.project}-${var.environment}-${each.key}-ssm-read"
  role   = aws_iam_role.lambda[each.key].id
  policy = data.aws_iam_policy_document.ssm_read[each.key].json
}

resource "aws_iam_role_policy" "extra" {
  for_each = var.extra_policies

  name   = "${var.project}-${var.environment}-${each.key}-policy"
  role   = aws_iam_role.lambda[each.key].id
  policy = each.value
}

resource "aws_cloudwatch_log_group" "lambda" {
  for_each = var.functions

  name              = "/aws/lambda/${var.project}-${var.environment}-${each.key}"
  retention_in_days = var.log_retention_days
}

resource "aws_cloudwatch_metric_alarm" "lambda_errors" {
  for_each = var.alarms_enabled ? var.functions : {}

  alarm_name          = "${var.project}-${var.environment}-${each.key}-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = 300
  statistic           = "Sum"
  threshold           = 5
  alarm_description   = "Lambda ${each.key} error count exceeded threshold"
  treat_missing_data  = "notBreaching"

  dimensions = {
    FunctionName = aws_lambda_function.fn[each.key].function_name
  }

  alarm_actions = [var.alarm_sns_topic_arn]
  ok_actions    = [var.alarm_sns_topic_arn]
}

resource "aws_lambda_function" "fn" {
  for_each = var.functions

  function_name                  = "${var.project}-${var.environment}-${each.key}"
  role                           = aws_iam_role.lambda[each.key].arn
  handler                        = each.value.handler
  runtime                        = each.value.runtime
  memory_size                    = each.value.memory_size
  timeout                        = each.value.timeout
  reserved_concurrent_executions = each.value.reserved_concurrent_executions

  filename         = each.value.source_path
  source_code_hash = filebase64sha256(each.value.source_path)

  environment {
    variables = each.value.env_vars
  }

  depends_on = [aws_cloudwatch_log_group.lambda]
}
