import { RegistryProvider } from "@effect-atom/atom-react"
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "../styles.css"
import { LocaleProvider } from "./LocaleProvider"
import { AppRouter } from "./router"

const root = document.getElementById("root")
if (root) {
  createRoot(root).render(
    <StrictMode>
      <RegistryProvider>
        <LocaleProvider>
          <AppRouter />
        </LocaleProvider>
      </RegistryProvider>
    </StrictMode>,
  )
}
