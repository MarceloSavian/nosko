import { Schema } from "effect"

export class AccountNotFound extends Schema.TaggedError<AccountNotFound>("AccountNotFound")(
  "AccountNotFound",
  {},
) {}

export class JointAccountVisibilityLocked extends Schema.TaggedError<JointAccountVisibilityLocked>(
  "JointAccountVisibilityLocked",
)("JointAccountVisibilityLocked", {}) {}
