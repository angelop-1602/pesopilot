"use client"

import { useMemo, useState, type ReactElement } from "react"
import {
  RiAddLine,
  RiDeleteBinLine,
  RiEditLine,
  RiFlagLine,
  RiPieChartLine,
} from "@remixicon/react"
import { toast } from "sonner"

import type {
  BudgetFormValues,
  GoalFormValues,
  SavingsGoal,
} from "@/types/finance"
import { ConfirmDialog } from "@/components/app/confirm-dialog"
import { EmptyState } from "@/components/app/empty-state"
import { PageHeader } from "@/components/app/page-header"
import { BottomSheetForm } from "@/components/shared/bottom-sheet-form"
import { Button } from "@/components/ui/button"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BUDGETING_METHODS } from "@/lib/finance/budgeting-methods"
import {
  getBudgetSpend,
  getGoalProgress,
} from "@/lib/finance/calculations"
import { centavosToInput, formatPeso } from "@/lib/finance/currency"
import { getCurrentMonthId } from "@/lib/finance/dates"
import { deleteBudget, saveBudget } from "@/lib/db/repositories/budgets"
import { deleteGoal, saveGoal } from "@/lib/db/repositories/goals"
import { updateSettings } from "@/lib/db/repositories/settings"
import { useFinanceData } from "@/lib/hooks/use-finance-data"
import { cn } from "@/lib/utils"

export function BudgetWorkspace() {
  const { data } = useFinanceData()
  const [optimisticBudgetMethod, setOptimisticBudgetMethod] = useState<
    typeof data.settings.budgetMethod | null
  >(null)
  const monthId = getCurrentMonthId()
  const activeBudgetMethod =
    optimisticBudgetMethod ?? data.settings.budgetMethod
  const expenseCategories = data.categories.filter(
    (category) => category.kind === "expense"
  )
  const budgetSpend = useMemo(
    () => getBudgetSpend(data.budgets, data.transactions, monthId),
    [data.budgets, data.transactions, monthId]
  )
  const budgetedCentavos = budgetSpend.reduce(
    (total, budget) => total + budget.limitCentavos,
    0
  )
  const spentCentavos = budgetSpend.reduce(
    (total, budget) => total + budget.spentCentavos,
    0
  )

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Budget"
        description="Monthly spending limits, savings goals, and simple planning rules."
      />
      <div className="rounded-[1.65rem] bg-white/76 p-3 shadow-[0_12px_34px_rgba(15,23,42,0.06)]">
        <div className="grid grid-cols-2 divide-x divide-border/70">
          <SummaryValue label="Budgeted" value={budgetedCentavos} />
          <SummaryValue
            label="Spent"
            tone={spentCentavos > budgetedCentavos ? "danger" : "default"}
            value={spentCentavos}
          />
        </div>
      </div>
      <Tabs defaultValue="budgets">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="budgets">Budgets</TabsTrigger>
          <TabsTrigger value="goals">Goals</TabsTrigger>
          <TabsTrigger value="method">Method</TabsTrigger>
        </TabsList>
        <TabsContent value="budgets" className="flex flex-col gap-3">
          <div className="flex justify-end">
            <BudgetDialog
              categories={expenseCategories}
              monthId={monthId}
              trigger={
                <Button className="rounded-full">
                  <RiAddLine data-icon="inline-start" aria-hidden="true" />
                  Budget
                </Button>
              }
            />
          </div>
          {budgetSpend.length === 0 ? (
            <EmptyState
              icon={<RiPieChartLine aria-hidden="true" />}
              title="No budgets set"
              description="Add monthly category limits to see what is safe to spend."
              action={
                <BudgetDialog
                  categories={expenseCategories}
                  monthId={monthId}
                  trigger={
                    <Button className="rounded-full">
                      <RiAddLine data-icon="inline-start" aria-hidden="true" />
                      Add budget
                    </Button>
                  }
                />
              }
            />
          ) : (
            <div className="overflow-hidden rounded-[1.6rem] bg-white/78 shadow-[0_14px_36px_rgba(15,23,42,0.06)]">
              {budgetSpend.map((budget) => {
                const category = data.categories.find(
                  (item) => item.id === budget.categoryId
                )

                return (
                  <BudgetRow
                    budget={budget}
                    categoryName={category?.name ?? "Category"}
                    categories={expenseCategories}
                    key={budget.id}
                    monthId={monthId}
                  />
                )
              })}
            </div>
          )}
        </TabsContent>
        <TabsContent value="goals" className="flex flex-col gap-3">
          <div className="flex justify-end">
            <GoalDialog
              trigger={
                <Button className="rounded-full">
                  <RiAddLine data-icon="inline-start" aria-hidden="true" />
                  Goal
                </Button>
              }
            />
          </div>
          {data.goals.length === 0 ? (
            <EmptyState
              icon={<RiFlagLine aria-hidden="true" />}
              title="No savings goals"
              description="Track targets like emergency funds, tuition, travel, or debt payoff buffers."
              action={
                <GoalDialog
                  trigger={
                    <Button className="rounded-full">
                      <RiAddLine data-icon="inline-start" aria-hidden="true" />
                      Add goal
                    </Button>
                  }
                />
              }
            />
          ) : (
            <div className="overflow-hidden rounded-[1.6rem] bg-white/78 shadow-[0_14px_36px_rgba(15,23,42,0.06)]">
              {data.goals.map((goal) => (
                <GoalRow key={goal.id} goal={goal} />
              ))}
            </div>
          )}
        </TabsContent>
        <TabsContent value="method" className="flex flex-col gap-3">
          <div className="overflow-hidden rounded-[1.6rem] bg-white/78 shadow-[0_14px_36px_rgba(15,23,42,0.06)]">
            {BUDGETING_METHODS.map((method) => (
              <div
                className="flex items-start justify-between gap-3 border-b border-border/70 p-4 last:border-b-0"
                key={method.id}
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold">{method.name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {method.description}
                  </p>
                </div>
                {activeBudgetMethod === method.id ? (
                  <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                    Active
                  </span>
                ) : (
                  <Button
                    className="shrink-0 rounded-full"
                    variant="outline"
                    onClick={async () => {
                      setOptimisticBudgetMethod(method.id)
                      try {
                        await updateSettings({
                          budgetMethod: method.id,
                        })
                        window.setTimeout(
                          () => setOptimisticBudgetMethod(null),
                          150
                        )
                        toast.success("Budget method updated")
                      } catch (error) {
                        setOptimisticBudgetMethod(null)
                        toast.error(
                          error instanceof Error
                            ? error.message
                            : "Unable to update budget method."
                        )
                      }
                    }}
                  >
                    Use
                  </Button>
                )}
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function SummaryValue({
  label,
  tone = "default",
  value,
}: {
  label: string
  tone?: "default" | "danger"
  value: number
}) {
  return (
    <div className="min-w-0 px-2 text-center">
      <p className="text-[0.68rem] font-semibold text-muted-foreground">
        {label}
      </p>
      <p
        className={cn(
          "mt-1 truncate font-mono text-sm font-semibold",
          tone === "danger" && "text-destructive"
        )}
      >
        {formatPeso(value)}
      </p>
    </div>
  )
}

function BudgetRow({
  budget,
  categoryName,
  categories,
  monthId,
}: {
  budget: ReturnType<typeof getBudgetSpend>[number]
  categoryName: string
  categories: ReturnType<typeof useFinanceData>["data"]["categories"]
  monthId: string
}) {
  return (
    <div className="border-b border-border/70 p-4 last:border-b-0">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{categoryName}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {formatPeso(budget.remainingCentavos)} remaining
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <BudgetDialog
            budget={{
              id: budget.id,
              monthId: budget.monthId,
              categoryId: budget.categoryId,
              limit: centavosToInput(budget.limitCentavos),
            }}
            categories={categories}
            monthId={monthId}
            trigger={
              <Button
                aria-label={`Edit ${categoryName}`}
                className="rounded-full"
                size="icon-sm"
                variant="ghost"
              >
                <RiEditLine aria-hidden="true" />
              </Button>
            }
          />
          <ConfirmDialog
            title="Delete budget?"
            description="This removes the monthly limit only. Transactions stay untouched."
            confirmLabel="Delete"
            trigger={
              <Button
                aria-label={`Delete ${categoryName}`}
                className="rounded-full"
                size="icon-sm"
                variant="ghost"
              >
                <RiDeleteBinLine aria-hidden="true" />
              </Button>
            }
            onConfirm={async () => {
              await deleteBudget(budget.id)
              toast.success("Budget deleted")
            }}
          />
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between gap-3 text-xs">
        <span>{formatPeso(budget.spentCentavos)} spent</span>
        <span>{formatPeso(budget.limitCentavos)} limit</span>
      </div>
      <Progress className="mt-2" value={budget.progress} />
    </div>
  )
}

function BudgetDialog({
  budget,
  categories,
  monthId,
  trigger,
}: {
  budget?: BudgetFormValues
  categories: ReturnType<typeof useFinanceData>["data"]["categories"]
  monthId: string
  trigger: ReactElement
}) {
  const [open, setOpen] = useState(false)
  const initialValues: BudgetFormValues = budget ?? {
    monthId,
    categoryId: categories[0]?.id ?? "",
    limit: "",
  }

  return (
    <BottomSheetForm
      description="Pick a category limit for the selected month."
      open={open}
      title={budget ? "Edit budget" : "Add budget"}
      trigger={trigger}
      onOpenChange={setOpen}
    >
      <BudgetForm
        categories={categories}
        initialValues={initialValues}
        onSaved={() => setOpen(false)}
      />
    </BottomSheetForm>
  )
}

function BudgetForm({
  categories,
  initialValues,
  onSaved,
}: {
  categories: ReturnType<typeof useFinanceData>["data"]["categories"]
  initialValues: BudgetFormValues
  onSaved: () => void
}) {
  const [values, setValues] = useState(initialValues)
  const [isSaving, setIsSaving] = useState(false)

  const updateValue = <Key extends keyof BudgetFormValues>(
    key: Key,
    value: BudgetFormValues[Key]
  ) => setValues((current) => ({ ...current, [key]: value }))

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSaving(true)

    try {
      await saveBudget(values)
      toast.success("Budget saved")
      onSaved()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form className="flex flex-col gap-4 pb-1" onSubmit={handleSubmit}>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="budget-category">Category</FieldLabel>
          <NativeSelect
            id="budget-category"
            value={values.categoryId}
            onChange={(event) => updateValue("categoryId", event.target.value)}
          >
            {categories.map((category) => (
              <NativeSelectOption key={category.id} value={category.id}>
                {category.name}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </Field>
        <Field>
          <FieldLabel htmlFor="budget-limit">Monthly limit</FieldLabel>
          <Input
            id="budget-limit"
            inputMode="decimal"
            min="0"
            placeholder="0.00"
            step="0.01"
            type="number"
            value={values.limit}
            onChange={(event) => updateValue("limit", event.target.value)}
          />
        </Field>
      </FieldGroup>
      <div className="sticky bottom-0 -mx-5 bg-background px-5 pb-1 pt-3">
        <Button className="h-11 w-full rounded-full" disabled={isSaving} type="submit">
          {isSaving ? "Saving..." : "Save budget"}
        </Button>
      </div>
    </form>
  )
}

function GoalRow({ goal }: { goal: SavingsGoal }) {
  const progress = getGoalProgress(goal)

  return (
    <div className="border-b border-border/70 p-4 last:border-b-0">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{goal.name}</p>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {formatPeso(goal.currentCentavos)} of{" "}
            {formatPeso(goal.targetCentavos)}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <GoalDialog
            goal={goal}
            trigger={
              <Button
                aria-label={`Edit ${goal.name}`}
                className="rounded-full"
                size="icon-sm"
                variant="ghost"
              >
                <RiEditLine aria-hidden="true" />
              </Button>
            }
          />
          <ConfirmDialog
            title="Delete savings goal?"
            description="Only the goal tracker is removed. Account balances stay untouched."
            confirmLabel="Delete"
            trigger={
              <Button
                aria-label={`Delete ${goal.name}`}
                className="rounded-full"
                size="icon-sm"
                variant="ghost"
              >
                <RiDeleteBinLine aria-hidden="true" />
              </Button>
            }
            onConfirm={async () => {
              await deleteGoal(goal.id)
              toast.success("Goal deleted")
            }}
          />
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between gap-3">
        <span
          className={cn(
            "rounded-full px-2.5 py-1 text-xs font-semibold capitalize",
            goal.status === "completed"
              ? "bg-primary/10 text-primary"
              : "bg-muted text-muted-foreground"
          )}
        >
          {goal.status}
        </span>
        <span className="text-xs text-muted-foreground">
          {Math.round(progress)}%
        </span>
      </div>
      <Progress className="mt-2" value={progress} />
    </div>
  )
}

function GoalDialog({
  goal,
  trigger,
}: {
  goal?: SavingsGoal
  trigger: ReactElement
}) {
  const [open, setOpen] = useState(false)
  const { data } = useFinanceData()
  const initialValues: GoalFormValues = {
    id: goal?.id,
    name: goal?.name ?? "",
    target: goal ? centavosToInput(goal.targetCentavos) : "",
    current: goal ? centavosToInput(goal.currentCentavos) : "",
    targetDate: goal?.targetDate,
    linkedAccountId: goal?.linkedAccountId,
    status: goal?.status ?? "active",
  }

  return (
    <BottomSheetForm
      description="Goal progress is local and manual, so it never changes account balances unless you record a transaction."
      open={open}
      title={goal ? "Edit goal" : "Add savings goal"}
      trigger={trigger}
      onOpenChange={setOpen}
    >
      <GoalForm
        accounts={data.accounts}
        initialValues={initialValues}
        onSaved={() => setOpen(false)}
      />
    </BottomSheetForm>
  )
}

function GoalForm({
  accounts,
  initialValues,
  onSaved,
}: {
  accounts: ReturnType<typeof useFinanceData>["data"]["accounts"]
  initialValues: GoalFormValues
  onSaved: () => void
}) {
  const [values, setValues] = useState(initialValues)
  const [isSaving, setIsSaving] = useState(false)

  const updateValue = <Key extends keyof GoalFormValues>(
    key: Key,
    value: GoalFormValues[Key]
  ) => setValues((current) => ({ ...current, [key]: value }))

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSaving(true)

    try {
      await saveGoal(values)
      toast.success("Goal saved")
      onSaved()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form className="flex flex-col gap-4 pb-1" onSubmit={handleSubmit}>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="goal-name">Name</FieldLabel>
          <Input
            id="goal-name"
            placeholder="Emergency fund"
            value={values.name}
            onChange={(event) => updateValue("name", event.target.value)}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field>
            <FieldLabel htmlFor="goal-target">Target</FieldLabel>
            <Input
              id="goal-target"
              inputMode="decimal"
              min="0"
              placeholder="0.00"
              step="0.01"
              type="number"
              value={values.target}
              onChange={(event) => updateValue("target", event.target.value)}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="goal-current">Current</FieldLabel>
            <Input
              id="goal-current"
              inputMode="decimal"
              min="0"
              placeholder="0.00"
              step="0.01"
              type="number"
              value={values.current}
              onChange={(event) => updateValue("current", event.target.value)}
            />
          </Field>
        </div>
        <Field>
          <FieldLabel htmlFor="goal-target-date">Target date</FieldLabel>
          <Input
            id="goal-target-date"
            type="date"
            value={values.targetDate ?? ""}
            onChange={(event) => updateValue("targetDate", event.target.value)}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="goal-account">Linked account</FieldLabel>
          <NativeSelect
            id="goal-account"
            value={values.linkedAccountId ?? ""}
            onChange={(event) =>
              updateValue("linkedAccountId", event.target.value)
            }
          >
            <NativeSelectOption value="">No link</NativeSelectOption>
            {accounts.map((account) => (
              <NativeSelectOption key={account.id} value={account.id}>
                {account.displayName}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </Field>
        <Field>
          <FieldLabel htmlFor="goal-status">Status</FieldLabel>
          <NativeSelect
            id="goal-status"
            value={values.status}
            onChange={(event) =>
              updateValue("status", event.target.value as SavingsGoal["status"])
            }
          >
            <NativeSelectOption value="active">Active</NativeSelectOption>
            <NativeSelectOption value="paused">Paused</NativeSelectOption>
            <NativeSelectOption value="completed">Completed</NativeSelectOption>
          </NativeSelect>
        </Field>
      </FieldGroup>
      <div className="sticky bottom-0 -mx-5 bg-background px-5 pb-1 pt-3">
        <Button className="h-11 w-full rounded-full" disabled={isSaving} type="submit">
          {isSaving ? "Saving..." : "Save goal"}
        </Button>
      </div>
    </form>
  )
}
