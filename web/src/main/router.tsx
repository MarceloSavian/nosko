import { BrowserRouter, Route, Routes } from "react-router"
import { ForgotPasswordPage } from "../presentation/pages/ForgotPasswordPage"
import { CasaOverviewPage } from "../presentation/pages/household/CasaOverviewPage"
import { CycleDetailPage } from "../presentation/pages/household/CycleDetailPage"
import { CyclesListPage } from "../presentation/pages/household/CyclesListPage"
import { FixedBillsPage } from "../presentation/pages/household/FixedBillsPage"
import { PaymentsPage } from "../presentation/pages/household/PaymentsPage"
import { SharedAccountsPage } from "../presentation/pages/household/SharedAccountsPage"
import { ImportPage } from "../presentation/pages/ingestion/ImportPage"
import { ReviewQueuePage } from "../presentation/pages/ingestion/ReviewQueuePage"
import { LandingPage } from "../presentation/pages/LandingPage"
import { LoginPage } from "../presentation/pages/LoginPage"
import { MfaChallengePage } from "../presentation/pages/MfaChallengePage"
import { AcceptInvitationPage } from "../presentation/pages/onboarding/AcceptInvitationPage"
import { AccountFormPage } from "../presentation/pages/onboarding/AccountFormPage"
import { AddAccountsPage } from "../presentation/pages/onboarding/AddAccountsPage"
import { CreateHouseholdPage } from "../presentation/pages/onboarding/CreateHouseholdPage"
import { MyAccountsPage } from "../presentation/pages/personal/MyAccountsPage"
import { MyPaymentsPage } from "../presentation/pages/personal/MyPaymentsPage"
import { PersonalOverviewPage } from "../presentation/pages/personal/PersonalOverviewPage"
import { ResetPasswordPage } from "../presentation/pages/ResetPasswordPage"
import { SignUpPage } from "../presentation/pages/SignUpPage"
import { AppShell } from "../presentation/pages/shell/AppShell"
import { ComingSoonPage } from "../presentation/pages/shell/ComingSoonPage"
import { VerifyEmailPage } from "../presentation/pages/VerifyEmailPage"
import { RequireAuth } from "./guards/RequireAuth"
import { RequireGuest } from "./guards/RequireGuest"
import { RequireHousehold } from "./guards/RequireHousehold"

export const AppRouter = () => (
  <BrowserRouter>
    <Routes>
      <Route element={<RequireGuest />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/mfa" element={<MfaChallengePage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
      </Route>

      <Route element={<RequireAuth />}>
        <Route path="/onboarding/household" element={<CreateHouseholdPage />} />
        <Route path="/onboarding/accounts" element={<AddAccountsPage />} />
        <Route path="/onboarding/accounts/new" element={<AccountFormPage />} />
        <Route path="/invite/accept" element={<AcceptInvitationPage />} />

        <Route element={<RequireHousehold />}>
          <Route element={<AppShell />}>
            <Route path="/household" element={<CasaOverviewPage />} />
            <Route path="/household/accounts" element={<SharedAccountsPage />} />
            <Route path="/household/payments" element={<PaymentsPage />} />
            <Route path="/household/cycles" element={<CyclesListPage />} />
            <Route path="/household/cycles/:id" element={<CycleDetailPage />} />
            <Route path="/household/fixed-bills" element={<FixedBillsPage />} />
            <Route path="/household/goals" element={<ComingSoonPage />} />
            <Route path="/household/summary" element={<ComingSoonPage />} />
            <Route path="/personal" element={<PersonalOverviewPage />} />
            <Route path="/personal/accounts" element={<MyAccountsPage />} />
            <Route path="/personal/payments" element={<MyPaymentsPage />} />
            <Route path="/personal/savings" element={<ComingSoonPage />} />
            <Route path="/personal/projection" element={<ComingSoonPage />} />
            <Route path="/personal/subscriptions" element={<ComingSoonPage />} />
            <Route path="/import" element={<ImportPage />} />
            <Route path="/review" element={<ReviewQueuePage />} />
            <Route path="/settings" element={<ComingSoonPage />} />
          </Route>
        </Route>
      </Route>
    </Routes>
  </BrowserRouter>
)
