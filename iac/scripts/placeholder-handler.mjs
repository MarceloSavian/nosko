// Throwaway placeholder Lambda handler so the infrastructure can be deployed before the real
// backend bundle exists (built at U4). Returns a simple 200 so the API is reachable.
export const handler = async () => ({
  statusCode: 200,
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ status: "ok", service: "finance-app", placeholder: true }),
})
