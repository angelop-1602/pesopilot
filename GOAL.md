# PesoPilot Development Goal

## Product Vision

PesoPilot is a private, local-first personal finance application designed to help a user understand not only where their money is, but also what that money is already intended for and how much is genuinely safe to spend.

PesoPilot should answer four core questions:

1. How much money do I currently have?
2. Where is my money?
3. What financial obligations and spending plans are already assigned to that money?
4. How much can I safely spend right now?

The product should progressively become a practical personal financial operating system without becoming unnecessarily complicated.

---

# Current Development Goal

Improve PesoPilot's budgeting system by evolving the existing category-limit budgeting feature into a complete monthly financial planning experience.

Do NOT replace the existing:

* Accounts
* Transactions
* Bills
* Monthly budgets
* Savings goals
* Budgeting methods
* Credit-card handling
* Loans
* Investments
* IndexedDB architecture

Build on top of them.

---

# Core Budgeting Model

PesoPilot must clearly distinguish between:

## 1. Account Balance

Money physically represented by the user's asset accounts.

This answers:

> How much money do I have?

---

## 2. Commitments

Money that has not necessarily been spent yet but is already expected to be used for an obligation.

Examples:

* Rent
* Electricity
* Internet
* Insurance
* Subscriptions
* Loan payments
* Other recurring bills

An unpaid commitment must not be treated as freely spendable money.

---

## 3. Spending Limits

Existing `MonthlyBudget` category limits continue to represent discretionary or controlled spending.

Examples:

* Groceries
* Transportation
* Dining
* Entertainment
* Shopping

These should automatically calculate actual spending from categorized transactions.

Do not turn category budgets into bills.

---

## 4. Safe to Spend

Introduce **Safe to Spend** as a first-class financial metric.

Conceptually:

```text
Safe to Spend =
max(
  Available Asset Balance
  - Pending Commitments,
  0
)
```

The implementation must use integer centavos.

Do not duplicate financial data simply to calculate this value.

Whenever possible, derive it from existing accounts, bills, and transactions.

---

# Monthly Plan

Improve `/budget` so that it becomes a monthly financial planning workspace.

The ideal structure is:

```text
Budget
├── Monthly Plan
├── Spending Limits
├── Goals
└── Method
```

## Monthly Plan

The Monthly Plan should summarize:

* Current month
* Monthly income
* Current available balance
* Paid commitments
* Pending commitments
* Total committed
* Safe to Spend
* Budget allocation status

A user should be able to quickly understand the condition of the current month without opening several screens.

---

# Bill and Commitment Logic

Reuse the existing `Bill` model for recurring commitments.

Do not create another recurring-commitment model that duplicates bills.

A bill occurrence for a month should be considered paid when an appropriate transaction linked through `transaction.billId` exists for that billing period.

The UI may display statuses such as:

* Pending
* Paid
* Overdue

These statuses should preferably be derived rather than permanently stored when they can be reliably calculated.

---

# Paying a Bill

Improve the current bill payment flow.

Selecting **Pay** or **Mark as Paid** should open a prefilled transaction form rather than immediately creating a rigid transaction.

Prefill:

* Expected amount
* Account
* Category
* Bill
* Description
* Suggested payment date

Allow the user to modify:

* Actual amount paid
* Account used
* Category
* Payment date
* Notes

The resulting expense transaction remains the source of truth.

The transaction must retain the related `billId`.

This allows PesoPilot to distinguish:

```text
Expected: ₱2,500
Actual:   ₱2,430
Difference: ₱70 under expected
```

without creating duplicate expense records.

---

# Spending Limits

Preserve the current automatic category-budget logic.

For example:

```text
Groceries

Budget     ₱5,000
Spent      ₱2,750
Remaining  ₱2,250
Progress   55%
```

Expense transactions assigned to the category should automatically affect the month's spending limit.

No separate manual "paid" status should be required for spending limits.

---

# Dashboard Improvement

The dashboard must gradually become decision-oriented rather than simply balance-oriented.

Important metrics should include:

* Net Worth
* Available Assets
* Safe to Spend
* Pending Commitments
* Monthly Income
* Monthly Expenses
* Debt

Do not overload the dashboard.

Prioritize the information needed for everyday financial decisions.

**Safe to Spend should become one of the most prominent day-to-day metrics.**

---

# Savings Goals

Keep the existing savings-goal system.

Do not combine goals with monthly expenses.

Goals answer:

> What am I saving toward?

Budgets answer:

> How much may I spend?

Commitments answer:

> What money is already spoken for?

These concepts must remain distinct.

---

# Surplus Allocation

After the core monthly planning system is stable, PesoPilot may introduce manual surplus allocation.

Example:

```text
Safe Surplus: ₱13,000

Emergency Fund     ₱5,000
Travel Goal        ₱3,000
Investment         ₱3,000
Keep Available     ₱2,000
```

PesoPilot may calculate available amounts but should not automatically move or allocate money without explicit user action.

The user remains responsible for financial decisions.

---

# One-Time Planned Expenses

Do not immediately create a large planning subsystem.

First implement recurring commitments using the existing Bill architecture.

A later phase may introduce one-time planned expenses for expenses such as:

* Appliance repair
* School payment
* Annual registration
* Trip expense
* Device purchase
* Medical appointment

If implemented, one-time planned expenses should integrate cleanly with transactions and Safe to Spend rather than creating an isolated subsystem.

---

# Data Principles

PesoPilot remains:

* Local-first
* Offline-capable
* Privacy-focused
* Single-user
* PHP-first
* Simple to back up and restore

Financial values must continue to be stored in integer centavos.

IndexedDB/Dexie remains the source of persistent application data unless a future development goal explicitly changes this decision.

Do not introduce:

* Authentication
* Cloud databases
* User accounts
* SaaS infrastructure
* Third-party financial APIs
* Bank synchronization

unless specifically requested.

---

# Source of Truth Rules

Avoid duplicated financial state.

Use:

```text
Accounts
→ Where the money is

Transactions
→ What actually happened

Bills
→ Expected recurring obligations

Monthly Budgets
→ Category spending limits

Savings Goals
→ Future savings targets

Derived Calculations
→ Financial insight
```

Whenever a value can be safely derived from existing persisted data, prefer calculating it rather than storing another copy.

---

# Development Priority

Implement improvements in this general sequence:

1. Pending-bill calculation
2. Commitment calculation
3. Safe-to-Spend calculation
4. Dashboard Safe-to-Spend presentation
5. Monthly Plan UI
6. Improved bill-payment flow
7. Spending-limit improvements
8. Budget month navigation/history
9. One-time planned expenses
10. Manual surplus allocation
11. Advanced reports and insights

Complete and stabilize each layer before introducing unnecessary complexity.

---

# UX Goal

PesoPilot should feel like a polished personal finance mobile application rather than a spreadsheet or accounting system.

Prefer:

* Clear financial hierarchy
* Simple language
* Progressive disclosure
* Mobile-first layouts
* Fast entry
* Minimal taps
* Clear empty states
* Useful summaries
* Bottom sheets for focused actions
* Consistent interaction patterns

Avoid showing every possible financial detail at once.

The application's primary experience should remain understandable to someone who is not an accountant.

---

# Final Product Principle

PesoPilot should evolve from:

> "A tracker that shows where my money went."

into:

> **"A financial companion that shows what my money is doing, what it is already committed to, and what I can safely use."**

Every new feature should reinforce that goal.
