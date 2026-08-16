"use client"

import { usePathname } from "next/navigation"

import { AutomaticBackupRunner } from "@/features/settings"
import { TransactionDialog } from "@/features/transactions"
import { BottomNav } from "@/features/shell/components/bottom-nav"
import { FloatingActionButton } from "@/features/shell/components/floating-action-button"
import { ServiceWorkerRegister } from "@/features/shell/components/service-worker-register"
import { TopBar } from "@/features/shell/components/top-bar"
import { Toaster } from "@/components/ui/sonner"
import {
  FinanceDataProvider,
  useFinanceData,
} from "@/lib/hooks/use-finance-data"

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <FinanceDataProvider>
      <AppShellContent>{children}</AppShellContent>
    </FinanceDataProvider>
  )
}

function AppShellContent({ children }: { children: React.ReactNode }) {
  const { data } = useFinanceData()
  const pathname = usePathname()
  const isDashboard = pathname === "/"

  return (
    <div className="min-h-svh bg-[linear-gradient(180deg,oklch(0.965_0.019_165)_0%,oklch(0.985_0.008_95)_45%,oklch(0.957_0.012_240)_100%)] text-foreground">
      <div className="mx-auto min-h-svh w-full max-w-[480px] bg-background shadow-[0_0_72px_rgba(15,23,42,0.12)]">
        {!isDashboard && <TopBar settings={data.settings} />}
        <main className="flex min-h-svh w-full flex-col gap-5 overflow-hidden px-4 pb-28 pt-4">
          {children}
        </main>
      </div>
      <FloatingActionButton
        renderDialog={(trigger) => (
          <TransactionDialog
            accounts={data.accounts}
            bills={data.bills}
            budgets={data.budgets}
            categories={data.categories}
            transactions={data.transactions}
            trigger={trigger}
          />
        )}
      />
      <BottomNav />
      <AutomaticBackupRunner />
      <ServiceWorkerRegister />
      <Toaster position="top-center" richColors />
    </div>
  )
}
