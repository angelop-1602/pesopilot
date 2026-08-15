# PesoPilot Agent Instructions

These instructions apply to all automated coding agents working in this repository.

---

# Next.js Version

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data.

Before implementing Next.js-specific behavior, read the relevant documentation installed under:

```text
node_modules/next/dist/docs/
```

Do not assume older Next.js APIs or conventions are still correct.

Heed all deprecation notices.

<!-- END:nextjs-agent-rules -->

---

# Understand Before Editing

Before modifying a feature:

1. Inspect the existing route.
2. Inspect the components used by the route.
3. Inspect associated types.
4. Inspect repositories/data-access functions.
5. Inspect financial calculations.
6. Inspect related validators.
7. Inspect existing reusable components.
8. Understand how the feature currently persists data.

Do not implement a parallel architecture simply because it is easier than understanding the existing one.

Reuse and improve existing functionality whenever reasonable.

---

# Product Context

PesoPilot is a private, local-first personal finance application.

Its main domains include:

* Accounts
* Transactions
* Categories
* Budgets
* Bills
* Savings goals
* Financial calculations
* Reports
* Settings
* Backup and restore

The application currently persists data locally using Dexie and IndexedDB.

Do not introduce backend infrastructure unless explicitly requested.

---

# Architecture Principles

Maintain clear separation between:

```text
app/
    Routing and route-level composition

components/
    UI and feature components

lib/finance/
    Financial domain logic and calculations

lib/db/
    Database configuration

lib/db/repositories/
    Persistence and mutations

lib/hooks/
    Data/query hooks

types/
    Shared domain types
```

Business logic should not be buried inside large React components.

Database logic should not be implemented directly inside presentation components.

Financial calculations should be pure functions whenever practical.

---

# Keep Files Focused

Avoid creating very large files containing an entire feature.

A page should not contain:

* Every form
* Every modal
* Every row
* Every calculation
* Every data mutation
* Every empty state
* Every helper

Break complex features into focused modules.

For example:

```text
components/budget/
├── budget-workspace.tsx
├── monthly-plan/
│   ├── monthly-plan.tsx
│   ├── monthly-plan-summary.tsx
│   ├── commitment-list.tsx
│   └── commitment-row.tsx
├── spending-limits/
│   ├── spending-limits.tsx
│   ├── budget-row.tsx
│   ├── budget-dialog.tsx
│   └── budget-form.tsx
├── goals/
│   ├── goals-panel.tsx
│   ├── goal-row.tsx
│   ├── goal-dialog.tsx
│   └── goal-form.tsx
└── method/
    └── budgeting-method-panel.tsx
```

This is an example of responsibility separation, not an instruction to create every file regardless of need.

Extract when doing so improves readability, testability, reuse, or maintainability.

Do not over-fragment trivial components.

---

# Route Files

Keep `app/**/page.tsx` files thin.

Prefer:

```tsx
import { FeatureWorkspace } from "@/components/feature/feature-workspace"

export default function Page() {
  return <FeatureWorkspace />
}
```

Do not place entire feature implementations directly inside route files.

---

# Loading and Error States

Every meaningful page or asynchronous feature must account for:

* Loading
* Empty
* Error
* Success

Use reusable global loading/error components when behavior is generic.

Create feature-specific states when the page requires specialized behavior.

Do not place all loading and error implementations inside a single massive component.

---

# Financial Data Rules

Money must use integer centavos in persisted data and calculations.

Example:

```text
₱1,250.50
↓
125050 centavos
```

Never store financial values as floating-point peso amounts.

Use the existing currency utilities for conversion and formatting.

---

# Financial Source of Truth

Respect these responsibilities:

```text
Account
→ current location/balance of money

Transaction
→ actual financial event

Bill
→ recurring expected obligation

MonthlyBudget
→ monthly category spending limit

SavingsGoal
→ target the user is saving toward
```

Do not duplicate a concept by adding another table or field unless a real domain requirement exists.

Prefer derived values over synchronized duplicate state.

---

# Transactions Are Actual Events

Once money actually moves, a Transaction should normally represent the event.

Do not create separate fake expense records to represent something that already has a transaction.

Relationships such as bill payments should reference the real transaction.

---

# Budgeting Rules

Treat these concepts separately:

### Commitment

Money already expected to be used for an obligation.

### Spending Limit

A maximum or planned amount for discretionary/category spending.

### Actual Spending

Expense transactions that have occurred.

### Safe to Spend

Money currently available after accounting for pending commitments.

Do not use one concept to represent all four.

---

# Safe-to-Spend Principle

Safe to Spend should be derived from existing financial information whenever possible.

Conceptually:

```text
Safe to Spend =
max(
  Available Asset Balance
  - Pending Commitments,
  0
)
```

Do not persist Safe to Spend as a standalone balance unless a future architectural requirement explicitly demands it.

---

# Bills

Reuse the existing Bill domain for recurring commitments.

Do not create another recurring-obligation model that duplicates bills.

Payment status should preferably be determined from linked transactions where possible.

When paying a bill, create an actual expense transaction linked using the existing bill relationship.

Allow actual payment values to differ from expected bill values.

---

# Database Changes

Treat IndexedDB schema changes carefully.

Before changing the Dexie schema:

1. Determine whether the feature can be derived from existing data.
2. Inspect existing schema versions.
3. Preserve backward compatibility.
4. Add a new schema version rather than destructively modifying old versions.
5. Ensure existing users' IndexedDB data remains readable.
6. Update backup/restore handling when the stored schema changes.

Never delete or rename persisted fields casually.

Legacy compatibility code may exist intentionally.

---

# Backup Compatibility

Any persisted-data change must trigger a review of:

* Backup schema
* Export
* Import
* Validation
* Migration
* Older backup compatibility

Do not add persisted records without considering backup and restore behavior.

---

# TypeScript

Use strict, explicit TypeScript.

Avoid:

```ts
any
```

unless integration with an external API genuinely requires it and the boundary is documented.

Prefer domain types from `types/finance.ts`.

Do not duplicate equivalent local interfaces across components.

---

# Validation

Validate user input before persistence.

Prefer existing Zod validators and finance utilities.

Validation should cover:

* Required values
* Positive monetary amounts
* Valid account relationships
* Valid transaction relationships
* Date requirements
* Duplicate constraints where applicable

Never rely solely on HTML input attributes for financial validation.

---

# React

Prefer small, focused components.

Avoid unnecessary state.

Do not copy persisted Dexie data into React state unless required for an editing workflow.

Derived values should generally use pure functions or memoization rather than synchronized state.

Avoid unnecessary `useEffect`.

---

# Reuse Existing UI

Before creating a new UI primitive, inspect:

```text
components/ui/
components/shared/
components/app/
```

Reuse existing:

* Buttons
* Inputs
* Dialogs
* Bottom sheets
* Confirmation dialogs
* Empty states
* Progress indicators
* Tabs
* Form patterns
* Toasts

Do not create visually inconsistent versions of components that already exist.

---

# Mobile First

PesoPilot should behave like a polished mobile financial application.

Design for the small-screen experience first.

Important actions should remain accessible without excessive scrolling.

Avoid desktop-only assumptions.

Use responsive enhancements for larger screens.

---

# Forms

For creation/editing workflows:

* Prefer established PesoPilot form patterns.
* Use bottom sheets where appropriate for mobile interactions.
* Prefill known values.
* Do not force the user to re-enter data already known by the system.
* Keep destructive actions explicit.
* Show useful success and failure feedback.

---

# Accessibility

Interactive controls must have meaningful accessible names.

Icon-only buttons require `aria-label`.

Form controls require labels.

Do not rely only on color to indicate financial state.

Maintain keyboard accessibility where supported by the existing UI primitives.

---

# User Experience

Prefer clear language over accounting terminology when both communicate the same idea.

Good:

```text
Safe to Spend
Pending Bills
Spent
Remaining
Paid
```

Avoid unnecessarily technical labels unless they are financially important.

Never hide important financial consequences behind ambiguous terminology.

---

# Empty States

A new installation may contain little or no user financial data.

Every screen must behave correctly with:

* No accounts
* No transactions
* No bills
* No budgets
* No goals

Do not assume seeded personal financial information exists.

System categories/settings may exist, but never hard-code personal financial balances or transactions.

---

# Error Handling

Do not silently swallow persistence failures.

For user-triggered actions:

* show actionable error feedback;
* preserve form state where practical;
* avoid partially completed financial mutations.

Operations involving multiple related financial records should be atomic where consistency requires it.

---

# Performance

Do not prematurely optimize.

However:

* avoid repeatedly scanning large transaction collections inside nested rendering loops when a single derived calculation can be reused;
* memoize expensive derived financial summaries where appropriate;
* use IndexedDB indexes when queries justify them.

Correctness is more important than micro-optimization.

---

# Refactoring Rules

When modifying an existing feature:

1. Preserve behavior that is unrelated to the requested change.
2. Refactor oversized code when it materially improves the implementation.
3. Do not mix broad unrelated refactors into a focused feature change.
4. Keep public APIs stable unless changing them provides clear benefit.
5. Update all consumers when interfaces change.

---

# No Placeholder Implementations

Do not leave:

```text
TODO
Coming later
Mock implementation
Fake financial values
Hard-coded example balances
```

inside a feature declared complete.

If something is intentionally outside the current scope, omit it rather than pretending it is implemented.

---

# Verification

Before considering work complete:

1. Run TypeScript/build validation.
2. Run linting.
3. Inspect changed financial calculations.
4. Verify empty-state behavior.
5. Verify editing behavior.
6. Verify deletion behavior where applicable.
7. Verify persistence after reload.
8. Verify that account balances remain correct.
9. Verify bill/transaction relationships.
10. Verify old IndexedDB records remain usable when schema changes.
11. Verify backup compatibility when persisted models change.
12. Check mobile layout.

Do not report a task complete if known build or lint errors caused by the change remain.

---

# Scope Discipline

Do not redesign unrelated parts of PesoPilot while implementing a focused task.

If you identify an unrelated improvement:

* note it;
* do not automatically implement it unless it is necessary for the requested change.

Avoid feature creep.

---

# Development Philosophy

PesoPilot should become more capable without becoming harder to understand or maintain.

Prefer:

```text
Existing data
+ derived intelligence
+ clear UI
```

over:

```text
More tables
+ more state
+ duplicated concepts
+ unnecessary abstraction
```

The best implementation is the simplest architecture that accurately models the user's financial reality.
