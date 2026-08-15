# PesoPilot

PesoPilot is a private, local-first personal finance application built with
Next.js, TypeScript, Dexie, and shadcn/ui. Accounts, transactions, bills,
budgets, goals, settings, and encrypted backups remain on the user's device.

## Development

```bash
npm run dev
npm test
npm run lint
npm run build
```

Open [http://localhost:3000](http://localhost:3000) after starting the
development server.

## Architecture

Routes are thin compositions over self-contained feature modules. Financial
rules are pure, React components never call IndexedDB repositories directly,
and multi-table writes are isolated in transactional DB services. See
[docs/architecture.md](docs/architecture.md) for folder ownership and dependency
rules.
