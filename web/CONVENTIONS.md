# Nosko Web — Coding Conventions

This document defines the architecture, patterns, and rules for all frontend code in this project.
It is intended to be read by LLMs generating code so that all output is consistent with the established standards.

---

## Architecture: Clean Architecture

Dependencies always point **inward**. Outer layers depend on inner layers — never the reverse.

```
web/src/
├── domain/          # Innermost layer — business rules, Zod schemas, use case interfaces
├── data/            # Application layer — use case implementations, protocol interfaces
├── infra/           # External systems — HTTP client, local storage, etc.
├── presentation/    # UI layer — React components, pages, hooks, styles
├── main/            # Composition root — factories, adapters, routing, App entry
└── test/            # Test utilities — setup, mocks
```

### Dependency Flow

```
main (composition root)
  ├── presentation/pages → domain/usecases (interfaces only)
  ├── data/usecases      → domain/ + data/protocols (interfaces only)
  └── infra/*            → implements data/protocols
```

- `presentation/` depends on `domain/` interfaces (via injection) — never imports `data/` or `infra/`
- `data/usecases` depends on `domain/` and `data/protocols` interfaces
- `infra/*` implements `data/protocols` — never imported directly outside `main/`
- `main/` is the only layer that knows about all other layers — it wires everything together
- Nothing in `domain/` imports from any other layer

---

## Folder Structure per Feature

Each feature gets its own subfolder inside every layer. When adding a new feature (e.g. `account`), create files across all relevant layers:

```
domain/
  models/account/Account.ts                    # Zod schemas and inferred types
  usecases/account/IAccountService.ts          # Use case interface
  errors/account.ts                            # Domain-specific errors

data/
  protocols/account/IAccountGateway.ts         # Gateway interface (HTTP abstraction)
  usecases/account/RemoteLoadAccounts.ts       # Use case implementation
  usecases/account/RemoteLoadAccounts.test.ts  # Unit test

infra/
  http/account/AccountGateway.ts               # Concrete HTTP implementation of gateway
  http/account/AccountGateway.test.ts          # Integration test

presentation/
  pages/account/AccountList.tsx                # Page component
  pages/account/AccountList.test.tsx           # Component test
  pages/account/components/AccountCard.tsx     # Page-specific sub-component
  components/                                  # Shared reusable components (not feature-specific)

main/
  factories/account.ts                         # Wires concrete instances for account feature
```

---

## Naming Conventions

### Files
- Interfaces: `I{Name}.ts` — e.g. `IAccountGateway.ts`
- Use cases: `Remote{Action}.ts` (data layer) — e.g. `RemoteLoadAccounts.ts`
- Page components: `{PageName}.tsx` — e.g. `AccountList.tsx`
- Shared components: `{ComponentName}.tsx` — e.g. `Spinner.tsx`
- Tests: co-located with implementation, suffix `.test.ts` or `.test.tsx`
- Factories: `{feature}.ts` in `main/factories/` — e.g. `account.ts`

### Types and Interfaces
- Interfaces: `I` prefix — `IAccountGateway`, `IHttpClient`
- Types inferred from Zod: `type AccountSchema = z.infer<typeof accountSchema>`
- React component props: `{ComponentName}Props` — e.g. `AccountCardProps`

### Variables and Parameters
- camelCase throughout
- React components use PascalCase function names
- Hooks: `use` prefix — `useAuth`, `useLogout`

---

## Schema and Types (Zod)

- Use **Zod** for all schema definition, runtime validation, and type extraction
- Never write manual types that duplicate a Zod schema — always use `z.infer<>`
- Use `z.enum()` instead of TypeScript enums
- Domain schemas in `domain/models/{feature}/` are the single source of truth

```typescript
// domain/models/account/Account.ts
import { z } from 'zod/v4';

export const accountSchema = z.object({
  id: z.string(),
  name: z.string(),
  currency: z.string(),
  balance: z.number(),
});

export type AccountSchema = z.infer<typeof accountSchema>;
```

---

## Dependency Injection

- Use **manual injection** via factory functions — no DI framework
- The **composition root** lives in `main/factories/{feature}.ts`
- Use cases and gateways must never instantiate their own dependencies
- Page components receive use cases as props, injected by the factory

```typescript
// main/factories/account.ts
import { HttpClient } from '@/infra/http/HttpClient';
import { AccountGateway } from '@/infra/http/account/AccountGateway';
import { RemoteLoadAccounts } from '@/data/usecases/account/RemoteLoadAccounts';

const httpClient = new HttpClient();
const accountGateway = new AccountGateway(httpClient);
export const loadAccounts = new RemoteLoadAccounts(accountGateway);
```

---

## Presentation Layer

### Component Types

**Pages** (`presentation/pages/{feature}/`):
- Smart components that receive injected use cases as props
- Handle page-level state and side effects
- Compose smaller components
- One page per file

**Page Sub-Components** (`presentation/pages/{feature}/components/`):
- Components specific to a single page
- Receive data via props — no direct access to use cases

**Shared Components** (`presentation/components/`):
- Reusable across multiple pages
- Pure presentational — props in, JSX out
- No business logic, no use case dependencies

### Component Rules

- Functional components only — no class components
- Named exports — no default exports
- Props defined as a type: `type Props = { ... }`
- Destructure props in the function signature

```typescript
// presentation/pages/account/AccountList.tsx
type Props = {
  loadAccounts: ILoadAccounts;
};

export function AccountList({ loadAccounts }: Props) {
  // ...
}
```

### Hooks (`presentation/hooks/`)

- Custom hooks encapsulate reusable stateful logic
- Hooks never import from `infra/` or `data/` — they depend on domain interfaces
- Name: `use{Description}.ts` — e.g. `useAuth.ts`

---

## Styling (Tailwind CSS)

- Use **Tailwind CSS v4** utility classes directly in JSX
- No CSS-in-JS runtime, no SCSS, no CSS Modules
- Global styles in `presentation/styles/global.css` — import Tailwind and define custom theme extensions
- Prefer Tailwind's built-in design tokens (spacing, colors, typography) for consistency
- Extract repeated class combinations into components, not into CSS files

```tsx
<button className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
  Save
</button>
```

---

## HTTP Layer

### Protocol (`data/protocols/`)

Define abstract interfaces for any external communication:

```typescript
// data/protocols/http/IHttpClient.ts
export type HttpRequest = {
  url: string;
  method: 'get' | 'post' | 'put' | 'delete';
  body?: unknown;
  headers?: Record<string, string>;
};

export type HttpResponse<T = unknown> = {
  statusCode: number;
  body: T;
};

export interface IHttpClient {
  request: <T>(data: HttpRequest) => Promise<HttpResponse<T>>;
}
```

### Infrastructure (`infra/http/`)

Concrete HTTP implementation. Only this layer imports the actual HTTP library:

```typescript
// infra/http/HttpClient.ts — wraps the chosen HTTP library
import type { IHttpClient, HttpRequest, HttpResponse } from '@/data/protocols/http/IHttpClient';

export class HttpClient implements IHttpClient {
  async request<T>(data: HttpRequest): Promise<HttpResponse<T>> {
    // Implementation using fetch, ky, or generated client
  }
}
```

---

## Data Layer — Use Cases

Each use case in `data/usecases/` implements a domain interface and depends on gateway protocols:

```typescript
// data/usecases/account/RemoteLoadAccounts.ts
import type { ILoadAccounts } from '@/domain/usecases/account/ILoadAccounts';
import type { IAccountGateway } from '@/data/protocols/account/IAccountGateway';
import type { AccountSchema } from '@/domain/models/account/Account';

export class RemoteLoadAccounts implements ILoadAccounts {
  constructor(private readonly gateway: IAccountGateway) {}

  async loadAll(): Promise<AccountSchema[]> {
    const response = await this.gateway.loadAll();
    // Map response, handle errors, etc.
    return response;
  }
}
```

---

## Error Handling

### Domain Errors (`domain/errors/`)

Each feature defines its own error file in `domain/errors/{feature}.ts`:

```typescript
// domain/errors/account.ts
export class AccessDeniedError extends Error {
  constructor() {
    super('Access denied');
    this.name = 'AccessDeniedError';
  }
}

export class UnexpectedError extends Error {
  constructor() {
    super('Something went wrong. Please try again.');
    this.name = 'UnexpectedError';
  }
}
```

### Error Propagation
1. **Data layer**: Use case catches HTTP errors → throws domain error
2. **Presentation layer**: Page catches domain error → updates UI state
3. **Global**: `AccessDeniedError` triggers logout via a shared hook

---

## Testing

- Use **Vitest** as the test runner with `@testing-library/react` for component tests
- Test files are **co-located** with the implementation they test
- Every test file uses a `makeSut()` factory pattern

### Test Structure

Two nested `describe` blocks:

1. **Outer** — the class, component, or hook name
2. **Inner** — the method or behavior being tested

```typescript
// data/usecases/account/RemoteLoadAccounts.test.ts
import { describe, expect, it, vi } from 'vitest';
import { RemoteLoadAccounts } from './RemoteLoadAccounts';

describe('RemoteLoadAccounts', () => {
  const makeSut = () => {
    const gatewaySpy = { loadAll: vi.fn() };
    const sut = new RemoteLoadAccounts(gatewaySpy);
    return { sut, gatewaySpy };
  };

  describe('loadAll()', () => {
    it('should call gateway', async () => {
      const { sut, gatewaySpy } = makeSut();
      gatewaySpy.loadAll.mockResolvedValueOnce([]);
      await sut.loadAll();
      expect(gatewaySpy.loadAll).toHaveBeenCalledOnce();
    });
  });
});
```

### Component Test Pattern

```typescript
// presentation/pages/account/AccountList.test.tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AccountList } from './AccountList';

describe('AccountList', () => {
  const makeSut = () => {
    const loadAccountsSpy = { loadAll: vi.fn() };
    render(<AccountList loadAccounts={loadAccountsSpy} />);
    return { loadAccountsSpy };
  };

  describe('render', () => {
    it('should display loading state initially', () => {
      makeSut();
      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });
  });
});
```

### Mocks

- Use `vi.fn()` for simple mocks directly in the test file
- For shared mock classes reused across many tests, place them in `test/mocks/`
- Mock files export a pre-created instance

### Rules
- `makeSut()` is defined inside the outer `describe`
- Use `vi.fn()`, `vi.spyOn()`, `vi.mock()` from Vitest
- Tests must not depend on each other or on execution order
- Test user-visible behavior, not implementation details

---

## Code Style

Enforced via **Biome** (replaces both Prettier and ESLint):

| Rule | Value |
|---|---|
| Quotes | Single |
| Semicolons | Required |
| Trailing commas | All |
| Print width | 100 |
| Indentation | 2 spaces |

---

## Build Tooling

| Tool | Purpose |
|---|---|
| **Vite** | Dev server and production bundler |
| **TypeScript** | Type checking (no emit — Vite handles transpilation) |
| **Biome** | Linting and formatting |
| **Vitest** | Unit and component testing |

---

## Dependencies

| Purpose | Package |
|---|---|
| UI framework | `react`, `react-dom` |
| Schema validation | `zod` |
| Styling | `tailwindcss`, `@tailwindcss/vite` |
| Testing | `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event` |
| Linting & formatting | `@biomejs/biome` |
| Build | `vite`, `@vitejs/plugin-react` |
| Language | TypeScript 5+ |

> Packages for routing, state management, HTTP clients, and forms will be added as needed. See the **Future Packages** section for planned additions.

### Adding New Packages

Any third-party package that provides an external capability (HTTP client, storage, analytics, etc.) **must** be wrapped in the `infra/` layer:

1. Define an interface in `data/protocols/{feature}/` describing what the capability does — not how
2. Implement the interface in `infra/{type}/{feature}/` using the actual package
3. Inject the implementation via the factory in `main/factories/`

**The rest of the codebase must never import a third-party package directly** — only the `infra/` layer is allowed to do so (except `zod` in `domain/` and `react` in `presentation/`).

---

## Future Packages (add when needed)

These packages are pre-approved for use when their functionality is required. Each should follow the integration pattern above.

| Concern | Package | When to Add |
|---|---|---|
| Routing | TanStack Router | When adding a second page |
| Server state | TanStack Query | When fetching data from the API |
| Client state | Zustand | When sharing non-server state across components |
| Forms | React Hook Form + `@hookform/resolvers` | When building the first form |
| API client generation | Orval | When integrating with backend API |
| E2E testing | Playwright | When the first user flow is complete |

---

## Git Commits

All commits must follow the **Conventional Commits** specification:

```
<type>(<scope>): <description>

feat:     a new feature
fix:      a bug fix
chore:    tooling, config, dependencies
docs:     documentation only
refactor: code change that neither fixes a bug nor adds a feature
test:     adding or correcting tests
```

Examples:
```
feat(account): add account list page
chore: add tailwind and biome config
```

---

## Rules Summary for Code Generation

When generating code for this project, always:

1. Follow Clean Architecture — respect layer boundaries, dependencies point inward
2. Each feature gets its own subfolder inside every layer
3. Define Zod schemas in `domain/models/{feature}/`, derive all types with `z.infer<>`
4. Place interfaces in `data/protocols/{feature}/` prefixed with `I`
5. Implement use cases in `data/usecases/{feature}/` depending only on interfaces
6. Implement infrastructure in `infra/{type}/{feature}/` — never import `infra` from `data`, `domain`, or `presentation`
7. Inject dependencies via factories in `main/factories/` — components receive use cases as props
8. Use Tailwind CSS utility classes for all styling — no CSS files per component
9. Write tests with Vitest, co-located, using the `makeSut()` pattern
10. Never write types manually when a Zod schema already defines the shape
11. Any new third-party package must be wrapped in `infra/` with a corresponding interface in `data/protocols/`
12. Named exports only — no default exports
13. Functional components only — no class components
