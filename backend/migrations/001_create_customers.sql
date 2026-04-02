-- 1. Customers & Auth
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  language VARCHAR(10) NOT NULL DEFAULT 'en',
  avatar_url TEXT,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  code VARCHAR(6) NOT NULL,
  type VARCHAR(20) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Currency Defaults
CREATE TABLE IF NOT EXISTS currency_defaults (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  currency_code VARCHAR(3) NOT NULL,
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(customer_id, currency_code)
);

-- 3. Partnerships
CREATE TABLE IF NOT EXISTS partner_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inviter_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  invitee_email TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS partnerships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invitation_id UUID NOT NULL REFERENCES partner_invitations(id),
  customer_a_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  customer_b_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(customer_a_id, customer_b_id)
);

CREATE TABLE IF NOT EXISTS contribution_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partnership_id UUID NOT NULL REFERENCES partnerships(id) ON DELETE CASCADE,
  type VARCHAR(30) NOT NULL,
  customer_a_percentage INT,
  customer_b_percentage INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Bank Accounts
CREATE TABLE IF NOT EXISTS institutions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  country_code VARCHAR(2) NOT NULL,
  logo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bank_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES institutions(id),
  account_name TEXT NOT NULL,
  currency_code VARCHAR(3) NOT NULL,
  balance BIGINT NOT NULL DEFAULT 0,
  account_type VARCHAR(20) NOT NULL DEFAULT 'CHECKING',
  balance_updated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bank_account_ownerships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bank_account_id UUID NOT NULL REFERENCES bank_accounts(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  partnership_id UUID REFERENCES partnerships(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(bank_account_id, customer_id)
);

-- 5. Budget Planning
CREATE TABLE IF NOT EXISTS budget_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  icon TEXT,
  is_system BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS budget_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  partnership_id UUID REFERENCES partnerships(id) ON DELETE CASCADE,
  year_month VARCHAR(7) NOT NULL,
  currency_code VARCHAR(3) NOT NULL,
  is_joint BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (
    (customer_id IS NOT NULL AND partnership_id IS NULL AND is_joint = false) OR
    (customer_id IS NULL AND partnership_id IS NOT NULL AND is_joint = true)
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS budget_plans_personal_unique
  ON budget_plans (customer_id, year_month) WHERE is_joint = false;

CREATE UNIQUE INDEX IF NOT EXISTS budget_plans_joint_unique
  ON budget_plans (partnership_id, year_month) WHERE is_joint = true;

CREATE TABLE IF NOT EXISTS budget_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES budget_plans(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES budget_categories(id),
  name TEXT NOT NULL,
  planned_amount BIGINT NOT NULL,
  direction VARCHAR(10) NOT NULL,
  type VARCHAR(10) NOT NULL,
  recurrence VARCHAR(15) NOT NULL,
  installment_total INT,
  installment_number INT,
  source_item_id UUID REFERENCES budget_items(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Transactions
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bank_account_id UUID NOT NULL REFERENCES bank_accounts(id) ON DELETE CASCADE,
  category_id UUID REFERENCES budget_categories(id),
  budget_item_id UUID REFERENCES budget_items(id) ON DELETE SET NULL,
  amount BIGINT NOT NULL,
  description TEXT,
  transaction_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Indexes
CREATE INDEX IF NOT EXISTS idx_tokens_customer_id ON tokens (customer_id);
CREATE INDEX IF NOT EXISTS idx_currency_defaults_customer_id ON currency_defaults (customer_id);
CREATE INDEX IF NOT EXISTS idx_partner_invitations_inviter_id ON partner_invitations (inviter_id);
CREATE INDEX IF NOT EXISTS idx_partner_invitations_invitee_email ON partner_invitations (invitee_email);
CREATE INDEX IF NOT EXISTS idx_partnerships_customer_a_id ON partnerships (customer_a_id);
CREATE INDEX IF NOT EXISTS idx_partnerships_customer_b_id ON partnerships (customer_b_id);
CREATE INDEX IF NOT EXISTS idx_contribution_rules_partnership_id ON contribution_rules (partnership_id);
CREATE INDEX IF NOT EXISTS idx_bank_account_ownerships_customer_id ON bank_account_ownerships (customer_id);
CREATE INDEX IF NOT EXISTS idx_bank_account_ownerships_bank_account_id ON bank_account_ownerships (bank_account_id);
CREATE INDEX IF NOT EXISTS idx_bank_account_ownerships_partnership_id ON bank_account_ownerships (partnership_id);
CREATE INDEX IF NOT EXISTS idx_budget_items_plan_id ON budget_items (plan_id);
CREATE INDEX IF NOT EXISTS idx_budget_items_category_id ON budget_items (category_id);
CREATE INDEX IF NOT EXISTS idx_transactions_bank_account_id ON transactions (bank_account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_category_id ON transactions (category_id);
CREATE INDEX IF NOT EXISTS idx_transactions_budget_item_id ON transactions (budget_item_id);
CREATE INDEX IF NOT EXISTS idx_transactions_transaction_date ON transactions (transaction_date);
CREATE INDEX IF NOT EXISTS idx_transactions_account_date ON transactions (bank_account_id, transaction_date);
CREATE UNIQUE INDEX IF NOT EXISTS idx_partner_invitations_pending_unique
  ON partner_invitations (inviter_id, invitee_email) WHERE status = 'PENDING';
