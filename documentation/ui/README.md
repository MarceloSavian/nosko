# Generated UI reference (Google Stitch)

The screens Google Stitch generated from `../stitch-prompts.md`, merged from the two exports.
Each folder holds a `code.html` (static HTML/Tailwind mockup) plus its image assets. This is a
**visual reference for the build**, not the final app — the real UI is rebuilt in React + Effect
against the BFF, and the requirements/data model derived from these screens live in
`../requirements.md` and `../design/database-design.md`.

Design tokens (colors, typography, radii) for the "Shared Ledger" theme are in
`shared_ledger/DESIGN.md` (emerald primary, indigo secondary/personal, rose tertiary).

## When implementing, adjust for locked decisions

- **No bank sync / Open Finance.** Several screens show "Open Finance", "Sincronizar", and live
  sync affordances — **remove these**; ingestion is file import only (CSV primarily; PDF for
  Amex/C6). See requirements FR-ING / FR-ACC.
- **Personal privacy** = server-side isolation + KMS envelope encryption (the UI's "E2E / cofre"
  language maps to this, not to client-side zero-knowledge crypto).
- **Withdrawals are user-defined** after seeing `availableAfterPayments`; the split
  (equal/proportional/custom) applies only to the household's monthly shared payments.

## Screens

### Auth & onboarding
- `entrada_nosko` — landing / entry
- `criar_conta_nosko` — sign up
- `entrar_nosko` — log in
- `verificar_e_mail_nosko` — email verification
- `recuperar_senha_nosko` / `nova_senha_nosko` — password reset
- `adicione_suas_contas_nosko`, `onboarding_accounts_preview` — add your accounts
- `nova_conta_nosko` — add/edit an account (visibility personal/shared)
- `crie_sua_casa_convite_nosko` — create household + invite partner
- `voc_foi_convidada_nosko` — accept invitation

### App shell
- `app_shell_casa_compartilhado` — shell, Casa (shared) space
- `app_shell_pessoal_privado_escuro` — shell, Pessoal (personal) space, dark

### Casa (Shared)
- `casa_vis_o_geral`, `casa_vis_o_geral_do_or_amento` — shared overview / budget overview
- `contas_compartilhadas_nosko` — shared accounts
- `pagamentos_espa_o_casa` — payments (couple ledger: payer + split)
- `ciclos_espa_o_casa` — cycles list
- `detalhes_do_ciclo_23_ago_a_22_set` — cycle detail
- `contas_fixas_espa_o_casa` — fixed bills + recurring rules
- `metas_espa_o_casa` — goals / vaults
- `resumo_do_ciclo_nosko` — WhatsApp cycle summary

### Pessoal (Personal — private)
- `pessoal_vis_o_geral` — personal overview
- `minhas_contas_cart_es_nosko` — my accounts & cards
- `poupan_a_e_investimentos_espa_o_pessoal` — savings & investments
- `proje_o_de_poupan_a_espa_o_pessoal` — savings projection (two-phase + Box 3)
- `assinaturas_recorrentes_espa_o_pessoal` — subscription audit

### Cross-cutting
- `importar_extratos_nosko` — import statements
- `fila_de_revis_o_nosko` — review queue
- `configura_es_nosko` — settings

### Assets
- `shared_ledger/DESIGN.md` — theme tokens
- `nosko_logo`, `professional_clean_headshot…` — logo / avatar assets

## Viewing

Open any `code.html` in a browser, e.g.:

```
open documentation/ui/casa_vis_o_geral_do_or_amento/code.html
```
