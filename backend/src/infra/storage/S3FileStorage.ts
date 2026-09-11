import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3"
import { Config, Effect, Layer } from "effect"
import { FileStorage, FileStorageError } from "./FileStorage"

export const S3FileStorageLive = Layer.effect(
  FileStorage,
  Effect.gen(function* () {
    const bucket = yield* Config.string("UPLOADS_BUCKET")
    const client = new S3Client({})

    return {
      put: (input) =>
        Effect.tryPromise({
          try: () =>
            client.send(
              new PutObjectCommand({
                Bucket: bucket,
                Key: input.key,
                Body: input.body,
                ContentType: input.contentType,
              }),
            ),
          catch: (cause) => new FileStorageError({ cause }),
        }).pipe(Effect.asVoid),
    }
  }),
)
