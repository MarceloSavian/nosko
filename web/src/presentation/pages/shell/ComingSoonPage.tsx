import { useTranslate } from "../../../main/LocaleProvider"
import { Card } from "../../components/Card"

export const ComingSoonPage = () => {
  const t = useTranslate()
  return (
    <Card className="flex min-h-[40vh] items-center justify-center text-center text-sm text-slate-500 dark:text-slate-400">
      {t("shell.comingSoon")}
    </Card>
  )
}
