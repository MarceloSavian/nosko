import { FetchHttpClient } from "@effect/platform"
import * as RpcClient from "@effect/rpc/RpcClient"
import * as RpcSerialization from "@effect/rpc/RpcSerialization"
import { AtomRpc } from "@effect-atom/atom-react"
import { AppRpcs } from "@nosko/contracts"
import { Layer } from "effect"

// In dev, requests go to a relative "/api/..." path so they hit Vite's own dev-server proxy
// (vite.config.ts) rather than the deployed API directly — see the proxy's own comment for why.
export const apiBaseUrl: string =
  import.meta.env.VITE_API_BASE_URL ?? (import.meta.env.DEV ? "" : "https://test.api.nosko.app")

// nosko_at/nosko_rt are httpOnly, so the browser (not this code) attaches them automatically on
// every fetch to the API's origin as long as credentials are included.
const FetchWithCredentials = FetchHttpClient.layer.pipe(
  Layer.provide(Layer.succeed(FetchHttpClient.RequestInit, { credentials: "include" })),
)

const ProtocolLive = RpcClient.layerProtocolHttp({
  url: `${apiBaseUrl}/api/rpc`,
}).pipe(Layer.provide(Layer.mergeAll(RpcSerialization.layerJson, FetchWithCredentials)))

// The one infra "port" for every RPC call: presentation and data/usecases never import
// @effect/rpc or AppRpcs directly, only this tag's .query()/.mutation() atoms.
export class ApiClient extends AtomRpc.Tag<ApiClient>()("ApiClient", {
  group: AppRpcs,
  protocol: ProtocolLive,
}) {}
