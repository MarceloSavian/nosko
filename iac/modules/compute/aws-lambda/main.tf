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
  name               = "${var.project}-${var.environment}-lambda"
  assume_role_policy = data.aws_iam_policy_document.assume_role.json
}

resource "aws_iam_role_policy_attachment" "lambda_logs" {
  role       = aws_iam_role.lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

data "aws_iam_policy_document" "ssm_read" {
  count = length(var.secret_arns) > 0 ? 1 : 0

  statement {
    actions   = ["ssm:GetParameter"]
    resources = var.secret_arns
  }
}

resource "aws_iam_role_policy" "ssm_read" {
  count = length(var.secret_arns) > 0 ? 1 : 0

  name   = "${var.project}-${var.environment}-ssm-read"
  role   = aws_iam_role.lambda.id
  policy = data.aws_iam_policy_document.ssm_read[0].json
}

resource "aws_lambda_function" "fn" {
  for_each = var.functions

  function_name = "${var.project}-${var.environment}-${each.key}"
  role          = aws_iam_role.lambda.arn
  handler       = each.value.handler
  runtime       = each.value.runtime
  memory_size   = each.value.memory_size
  timeout       = each.value.timeout

  filename         = each.value.source_path
  source_code_hash = filebase64sha256(each.value.source_path)

  environment {
    variables = each.value.env_vars
  }
}
