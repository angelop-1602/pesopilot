import { getDb } from "@/lib/db/client"
import { deleteBudgetRecord } from "@/lib/db/repositories/budgets"
import { resolveExpenseBudgetId } from "@/lib/finance/budget-spending"

export async function deleteUnusedBudget(id: string) {
  const db = getDb()

  await db.transaction("rw", [db.budgets, db.transactions], async () => {
    const budget = await db.budgets.get(id)

    if (!budget) {
      return
    }

    const [monthBudgets, categoryTransactions, explicitlyLinkedTransactions] =
      await Promise.all([
        db.budgets.where("monthId").equals(budget.monthId).toArray(),
        db.transactions
          .where("categoryId")
          .equals(budget.categoryId)
          .filter(
            (transaction) =>
              transaction.type === "expense" &&
              transaction.date.slice(0, 7) === budget.monthId
          )
          .toArray(),
        db.transactions.where("budgetId").equals(id).toArray(),
      ])
    const transactions = new Map(
      [...categoryTransactions, ...explicitlyLinkedTransactions].map(
        (transaction) => [transaction.id, transaction]
      )
    )
    const hasAllocatedExpenses = [...transactions.values()].some(
      (transaction) =>
        transaction.budgetId === id ||
        resolveExpenseBudgetId(monthBudgets, transaction, budget.monthId) === id
    )

    if (hasAllocatedExpenses) {
      throw new Error(
        "Move or delete this budget's expenses before deleting the budget."
      )
    }

    await deleteBudgetRecord(id)
  })
}
