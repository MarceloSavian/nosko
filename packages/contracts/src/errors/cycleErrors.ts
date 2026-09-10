import { Schema } from "effect"

export class CycleNotFound extends Schema.TaggedError<CycleNotFound>("CycleNotFound")(
  "CycleNotFound",
  {},
) {}

export class CycleAlreadyExists extends Schema.TaggedError<CycleAlreadyExists>(
  "CycleAlreadyExists",
)("CycleAlreadyExists", {}) {}

export class CycleClosed extends Schema.TaggedError<CycleClosed>("CycleClosed")(
  "CycleClosed",
  {},
) {}

export class MemberTransferNotFound extends Schema.TaggedError<MemberTransferNotFound>(
  "MemberTransferNotFound",
)("MemberTransferNotFound", {}) {}
