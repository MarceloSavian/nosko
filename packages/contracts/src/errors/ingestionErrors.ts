import { Schema } from "effect"

export class UnsupportedBankFormat extends Schema.TaggedError<UnsupportedBankFormat>(
  "UnsupportedBankFormat",
)("UnsupportedBankFormat", {}) {}

export class StatementUploadNotFound extends Schema.TaggedError<StatementUploadNotFound>(
  "StatementUploadNotFound",
)("StatementUploadNotFound", {}) {}

export class TransactionNotFound extends Schema.TaggedError<TransactionNotFound>(
  "TransactionNotFound",
)("TransactionNotFound", {}) {}

export class TransactionAlreadyProcessed extends Schema.TaggedError<TransactionAlreadyProcessed>(
  "TransactionAlreadyProcessed",
)("TransactionAlreadyProcessed", {}) {}

export class CategoryRequired extends Schema.TaggedError<CategoryRequired>("CategoryRequired")(
  "CategoryRequired",
  {},
) {}
