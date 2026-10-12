
# Ebanx case

## Overview
This is a simple API for account transactions: create account (implicitly, by the first deposit), get balance, deposit, withdraw, and transfer.

## Tech stack
The technologies were selected based on my familiarity with the ecosystem, allowing me to focus on the business rules, code organization, and testing strategy while keeping the implementation simple and maintainable.
- Node.js
- NestJS
- TypeScript
- Jest
- Swagger

## How to run
### Project setup

```bash
$ npm install
```

### Compile and run the project

```bash
$ npm run start
```

## Features
- Accounts are created implicitly by the first deposit
- Deposit, withdraw and transfer, with validation of amount, balance and unknown accounts
- GET /balance has no side effects (covered by a test)
- Account balance cannot go negative
- Failed transfers restore both balances to their previous values


## API

Full interactive documentation (Swagger): http://localhost:3000/api

| Method | Route | Description | Responses |
|---|---|---|---|
| GET | `/balance?account_id=100` | Returns the account balance | 200, 404 account not found |
| POST | `/event` | Executes a `deposit`, `withdraw` or `transfer` | 201, 400 invalid input or insufficient funds, 404 account not found |

Example (transfer):

```text
POST /event
{ "type": "transfer", "origin": 100, "amount": 15, "destination": 300 }

201 Created
{ "origin": { "id": 100, "balance": 0 }, "destination": { "id": 300, "balance": 15 } }
```

## Architecture and Project Structure
The application follows a modular structure with a layered design:

- Controller: Handles HTTP requests and responses.
- Service: Implements business rules and transaction flows.
- Repository: Manages in-memory account storage.

This separation keeps responsibilities clear and makes the business logic easier to test.it

```text
src/
├── accounts/
│   ├── entities/
│   │   └── accounts.entity.ts
│   ├── accounts.eventDTO.ts
│   ├── accounts.interface.ts
│   ├── accounts.controller.ts
│   ├── accounts.service.ts
│   ├── accounts.service.spec.ts
│   ├── accounts.repository.ts
│   └── accounts.module.ts
├── app.module.ts
└── main.ts
test/
└── app.e2e-spec.ts
```

## Tests
Project developed following Test-Driven Development principles. I was already familiar with it but had never applied it fully. Having the tests structured upfront sped up development significantly and reduced time spent on manual console.log and debugging.

- **Unit tests:** Exercise the service with the real in-memory repository and assert the resulting state. `jest.spyOn` is used only to inject a failure in the rollback scenario.
- **E2E Tests:** Validate API behavior through HTTP requests, covering account balances and transaction flows.

**Run:**
```bash
npm run test        # unit
npm run test:e2e    # e2e
npm run test:cov    # coverage
```

### Decisions and Limitations
**Decisions:**
- **Layered Architecture:** Chosen to keep the project easy to understand and maintainable.
- **Swagger:** Added to speed up manual testing and API documentation.
- **In-Memory Storage:** Accounts are stored in local memory using a Map structure for simplicity, following this structure:
```typescript
private accounts = new Map<number, Account>();
```

Initially, I ensured transfer consistency by comparing balance values after the transfer and reverting if the source or destination balance was incorrect.

However, during E2E tests I noticed that when an exception was thrown, the execution stopped before reaching the balance check and the rollback wasn't executed.

So I refactored the implementation: before changing anything, I take a snapshot of both accounts and wrap the updates in a try/catch. If an error occurs, `restoreBalances` restores the previous state.

**Limitations:**
- The data is lost when the project is restarted
- The rollback is compensation-based, not a real transaction: if the process crashes between the two writes, the state can be left inconsistent.
- There is no locking, so concurrent transfers on the same account could read stale balances.

### Future Improvements
- Create a dedicated route for account creation with more details
- Create a separate file for validation and error messages
- Create a transaction history / bank statement feature
- Replace in-memory storage with a persistent database
- Add authentication with JWT

