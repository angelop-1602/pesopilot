# PesoPilot architecture

PesoPilot uses a feature-first frontend with explicit domain and persistence
boundaries. A module should depend only on layers below it:

```text
app routes
  -> feature public entrypoints
    -> feature components and hooks
      -> feature services
        -> database repositories/services
        -> pure finance and backup modules
          -> shared persisted domain types
```

## Folder ownership

- `app/` owns route declarations and composes one feature workspace per page.
- `features/` owns user-facing domains. Components, orchestration hooks,
  commands, form types, and feature utilities stay with their feature.
- `components/ui/` contains the installed shadcn design-system source.
- `components/shared/` contains UI reused by more than one feature.
- `lib/finance/` contains pure financial calculations and domain rules. It has
  no React or IndexedDB dependencies.
- `lib/backup/` contains backup schemas, types, and encryption primitives.
- `lib/db/repositories/` contains IndexedDB CRUD and indexed queries only.
- `lib/db/services/` owns atomic writes that span multiple tables.
- `lib/db/queries/` owns aggregate read models used across features.
- `lib/hooks/` contains cross-feature React data orchestration.
- `types/finance.ts` contains persisted and derived finance-domain types. Form
  DTOs belong to the feature that owns the form.

Folders are created when a responsibility exists; features should not contain
empty `hooks`, `services`, `types`, or `utils` directories merely for symmetry.

## Feature rules

Every routable feature exposes its workspace from `features/<name>/index.ts`.
Other features should consume that public entrypoint where practical. Feature
components may use hooks, services, pure domain functions, shared components,
and UI primitives, but must not import database repositories directly.

Hooks coordinate React state, subscriptions, memoization, and effects. They do
not implement financial rules or persistence. Services validate commands,
build domain records, coordinate repositories, and emit post-commit change
notifications. Repositories receive and return persisted records without
knowing about React or form values.

## Local data flow

`FinanceDataProvider` is mounted once by the app shell. It runs startup
maintenance once per browser runtime and shares one Dexie live snapshot with
all workspaces. User mutations flow through feature command services. Writes
that change transactions and account balances use a single Dexie transaction,
then notify the shared query after commit.

Backup exports read all included tables in one read transaction. Restore and
reset operations are isolated in settings services and DB-only backup data
repositories. The IndexedDB database name, schema versions, and existing record
fields remain backward compatible.

## Financial invariants

- Persisted and calculated money uses integer centavos.
- Accounts represent the location and current balance of money.
- Transactions represent actual financial events.
- Bills represent expected recurring obligations and link payments to real
  expense transactions.
- Budgets are monthly category limits; goals are independent savings targets.
- Safe to Spend is derived from available assets minus pending commitments and
  is never persisted as a second balance.

## Automated boundaries

ESLint prevents route pages from bypassing feature entrypoints, feature
components from importing repositories, finance modules from importing React or
the database, and repositories from importing feature or finance rules.

Before merging architecture changes, run:

```bash
npm test
npm run lint
npm run build
```
