import { Effect, Layer } from "effect"
import { FileStorage, type PutFileInput } from "../infra/storage/FileStorage"

export const makeFakeFileStorage = () => {
  const puts: Array<PutFileInput> = []

  const layer = Layer.succeed(FileStorage, {
    put: (input) =>
      Effect.sync(() => {
        puts.push(input)
      }),
  })

  return { layer, puts }
}
