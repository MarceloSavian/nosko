import { S3Client } from "@aws-sdk/client-s3"
import { describe, expect, it, jest } from "@jest/globals"
import { ConfigProvider, Effect } from "effect"
import { FileStorage } from "./FileStorage"
import { S3FileStorageLive } from "./S3FileStorage"

const withConfig = ConfigProvider.fromMap(new Map([["UPLOADS_BUCKET", "nosko-test-uploads"]]))

const run = <A, E>(effect: Effect.Effect<A, E, FileStorage>) =>
  Effect.runPromiseExit(
    effect.pipe(Effect.provide(S3FileStorageLive), Effect.withConfigProvider(withConfig)),
  )

describe("S3FileStorageLive", () => {
  it("puts a file to the configured bucket", async () => {
    const sendSpy = jest.spyOn(S3Client.prototype, "send").mockResolvedValue({} as never)

    const exit = await run(
      Effect.gen(function* () {
        const storage = yield* FileStorage
        return yield* storage.put({ key: "a/b.csv", body: "Data,Valor\n", contentType: "text/csv" })
      }),
    )

    expect(exit._tag).toBe("Success")
    expect(sendSpy).toHaveBeenCalledTimes(1)
    const command = sendSpy.mock.calls[0]?.[0] as unknown as { input: Record<string, unknown> }
    expect(command.input.Bucket).toBe("nosko-test-uploads")
    expect(command.input.Key).toBe("a/b.csv")

    sendSpy.mockRestore()
  })

  it("maps a failed S3 call to FileStorageError", async () => {
    const sendSpy = jest
      .spyOn(S3Client.prototype, "send")
      .mockRejectedValue(new Error("down") as never)

    const exit = await run(
      Effect.gen(function* () {
        const storage = yield* FileStorage
        return yield* storage.put({ key: "a/b.csv", body: "x", contentType: "text/csv" })
      }),
    )

    expect(exit._tag).toBe("Failure")
    if (exit._tag === "Failure" && exit.cause._tag === "Fail") {
      expect(exit.cause.error._tag).toBe("FileStorageError")
    }

    sendSpy.mockRestore()
  })
})
