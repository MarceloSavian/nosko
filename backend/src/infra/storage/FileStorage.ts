import { Context, Data, type Effect } from "effect"

export class FileStorageError extends Data.TaggedError("FileStorageError")<{
  readonly cause: unknown
}> {}

export interface PutFileInput {
  readonly key: string
  readonly body: string
  readonly contentType: string
}

export class FileStorage extends Context.Tag("FileStorage")<
  FileStorage,
  {
    readonly put: (input: PutFileInput) => Effect.Effect<void, FileStorageError>
  }
>() {}
