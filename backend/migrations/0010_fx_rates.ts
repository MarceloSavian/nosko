import { SqlClient } from "@effect/sql"
import { Effect } from "effect"

export default Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient

  yield* sql.unsafe(`
    CREATE TABLE fx_rates (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      rate_date date NOT NULL,
      base char(3) NOT NULL,
      quote char(3) NOT NULL,
      rate numeric(20, 10) NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT fx_rates_unique UNIQUE (rate_date, base, quote)
    )
  `)
  yield* sql.unsafe(`CREATE INDEX fx_rates_lookup_idx ON fx_rates (base, quote, rate_date DESC)`)
  yield* sql.unsafe(`GRANT SELECT, INSERT ON fx_rates TO app_role`)
})
