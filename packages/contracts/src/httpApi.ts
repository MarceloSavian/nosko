import { HttpApi } from "@effect/platform"
import { AuthApiGroup } from "./authHttp"
import { PaymentsApiGroup } from "./paymentsHttp"

export const NoskoHttpApi = HttpApi.make("nosko").add(AuthApiGroup).add(PaymentsApiGroup)
