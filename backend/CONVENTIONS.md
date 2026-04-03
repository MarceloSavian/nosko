# Suomi Backend — Coding Conventions

This document defines the architecture, patterns, and rules for all backend code in this project.
It is intended to be read by LLMs generating code so that all output is consistent with the established standards.

---

## Architecture: Clean Architecture (Hexagonal)

Dependencies always point **inward**. Outer layers depend on inner layers — never the reverse.

```
backend/
├── domain/          # Innermost layer — business rules, Zod schemas, use case interfaces
├── data/            # Application layer — service interfaces and implementations
├── infra/           # External systems — database, JWT, hashing, email, etc.
├── handlers/        # HTTP adapters — API handlers and routing
└── shared/          # Cross-cutting utilities (BaseError, etc.)
```

### Dependency Flow

```
handlers → data/services → domain
                ↓
         data/domain (interfaces)
                ↓
         infra/* (concrete implementations)
```

- `handlers` depends on `data/services`
- `data/services` depends on `domain/usecases` interfaces and `data/domain` interfaces
- `infra/*` implements `data/domain` interfaces
- Nothing in `domain/` or `data/` imports from `infra/` or `handlers/`

---

## Folder Structure per Feature

Each feature gets its own subfolder inside every layer. When adding a new feature (e.g. `user`), create files across all relevant layers:

```
domain/
  models/user/User.ts                        # Zod schemas and inferred types
  usecases/user/User.ts                      # IUserService interface

data/
  domain/user/UserRepository.ts             # IUserRepository interface
  services/user/User.ts                     # UserService implementation
  services/user/User.test.ts                # Unit tests for UserService

infra/
  repositories/user/UserRepository.ts       # DB implementation of IUserRepository
  repositories/user/UserRepository.test.ts  # Integration tests

handlers/
  api/user-routes.ts                        # Route factories + makeUserHandler + routeHandler
  api/user-routes.meta.ts                   # OpenAPI metadata for the feature's routes
  api/user-routes.test.ts                   # Tests for all route factories and handler
  api/user-v1.ts                            # Lambda entry point — imports factory + makeHandler
  domain/proxy.ts                           # ProxyRoute type definition
  factories/user.ts                         # Instantiates and exports concrete service instances
  shared/response.ts                        # formatResponse utility
  shared/error.ts                           # logErrorAndFormat utility

shared/
  error.ts                                  # BaseError class
```

This structure scales cleanly as new features are added — each feature is self-contained within its subfolder across all layers.

---

## Naming Conventions

### Files
- Interfaces: `I{Name}.ts` — e.g. `IUserRepository.ts`
- Services: `{Entity}Service` class inside `{Entity}.ts`
- Repositories: `{Entity}Repository` class inside `{Entity}Repository.ts`
- Handlers: `{feature}-v{version}.ts` — e.g. `user-v1.ts`
- Tests: co-located with implementation, suffix `.test.ts` — e.g. `User.test.ts`
- Utilities: kebab-case — e.g. `response.ts`, `error.ts`

### Classes and Interfaces
- Classes: PascalCase — `UserService`, `UserRepository`, `Hasher`
- Interfaces: `I` prefix — `IUserService`, `IUserRepository`, `IHasher`
- No suffix on infrastructure classes: `Hasher`, `JwtBuilder`, `EmailService`

### Variables and Parameters
- camelCase throughout
- Constructor parameters use `private readonly`:
  ```typescript
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly hasher: IHasher,
  ) {}
  ```

### Constants
- Named constants for magic values:
  ```typescript
  const EXPIRES_IN = 60 * 60; // 1 hour
  ```

---

## Schema and Types (Zod)

- Use **Zod** for all schema definition, runtime validation, and type extraction
- Never write manual types that duplicate a Zod schema — always use `z.infer<>`
- Use `z.enum()` instead of TypeScript enums

```typescript
// domain/models/user/User.ts
import { z } from 'zod';

const email = z.string().email('Invalid email').max(254);

export const userSchema = z.object({
  id: z.string(),
  email,
  username: z.string().min(3).max(32),
});

export type UserSchema = z.infer<typeof userSchema>;

export const userRoles = z.enum(['ADMIN', 'USER']);
export type UserRoles = z.infer<typeof userRoles>;
```

---

## Dependency Injection

- Use **manual constructor injection** — no DI framework
- The **composition root** lives in `handlers/factories/{feature}.ts`
- Services and repositories must never instantiate their own dependencies

```typescript
// handlers/factories/customer.ts — composition root
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const hasher = new Hasher(10);
const customerRepository = new CustomerRepository(pool);
export const customerService = new CustomerService(customerRepository, hasher);
```

The Lambda entry point (`handlers/api/{feature}-v1.ts`) imports the service from the factory and wires it into the handler — nothing else:

```typescript
// handlers/api/customer-v1.ts
import { customerService } from '../factories/customer.js';
import { makeCustomerHandler } from './customer-routes.js';

export const handler = makeCustomerHandler(customerService);
```

---

## HTTP Handlers

Per feature, three files live in `handlers/`:

### `handlers/api/{feature}-routes.ts`
Contains all route factories, the generic `routeHandler`, and `make{Feature}Handler`. No side effects — fully unit testable.

```typescript
// handlers/api/customer-routes.ts

export function makeSignupRoute(service: ICustomerService) {
  return async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResult> => {
    try {
      const body = JSON.parse(event.body ?? '{}');
      const input = signupInputSchema.parse(body);
      return formatResponse(201, await service.signup(input));
    } catch (error) {
      return logErrorAndFormat(error);
    }
  };
}

export async function routeHandler(routes: ProxyRoute, event: APIGatewayProxyEventV2) {
  const route = routes[event.routeKey];
  return route ? await route(event) : { statusCode: 404, body: `Request path ${event.routeKey} not found` };
}

export function makeCustomerHandler(service: ICustomerService) {
  const routes: ProxyRoute = {
    'POST /signup': makeSignupRoute(service),
  };
  return (event: APIGatewayProxyEventV2) => routeHandler(routes, event);
}
```

### `handlers/api/{feature}-v1.ts`
Lambda entry point only — imports factory and wires handler. Three lines maximum.

```typescript
// handlers/api/customer-v1.ts
import { customerService } from '../factories/customer.js';
import { makeCustomerHandler } from './customer-routes.js';

export const handler = makeCustomerHandler(customerService);
```

### `handlers/api/{feature}-routes.meta.ts`
OpenAPI metadata for each feature's routes. Co-located with the route file, suffix `.meta.ts`. Exports a `RouteMeta[]` array describing every endpoint's method, path, auth, request/response schemas.

- Import Zod schemas from `domain/models/` — never duplicate schema definitions
- For composite response shapes not defined in the domain (e.g. `{ plan, items }`), define a local Zod schema in the meta file
- Set `auth: false` for unauthenticated endpoints, `auth: true` for authenticated ones
- Every success response (200, 201) must include a `schema` — only omit for 204 (no content) and error responses
- After adding or changing meta files, regenerate the spec: `npm run generate:openapi`

```typescript
// handlers/api/customer-routes.meta.ts
import { customerSchema, signupInputSchema } from '../../domain/models/customer/Customer.js';
import type { RouteMeta } from '../../openapi/route-descriptor.js';

export const customerRouteMetas: RouteMeta[] = [
  {
    method: 'post',
    path: '/v1/signup',
    summary: 'Create a new account',
    tags: ['Auth'],
    auth: false,
    request: { body: signupInputSchema },
    responses: {
      201: { description: 'Account created', schema: customerSchema },
      400: { description: 'Validation error' },
    },
  },
];
```

---

## Error Handling

### BaseError (`shared/error.ts`)

```typescript
export class BaseError extends Error {
  constructor(message: string, readonly statusCode: number) {
    super(message);
  }
}
```

### Handler Error Formatting (`handlers/shared/error.ts`)

```typescript
import { ZodError } from 'zod';
import { BaseError } from '../../shared/error';

export const logErrorAndFormat = (error: unknown): APIGatewayProxyResult => {
  if (error instanceof BaseError) {
    return { statusCode: error.statusCode, body: JSON.stringify({ message: error.message }) };
  }
  if (error instanceof ZodError) {
    console.warn(error.issues);
    return { statusCode: 400, body: JSON.stringify({ message: 'Validation error', issues: error.issues }) };
  }
  if (error instanceof Error) {
    console.error(error);
  }
  return { statusCode: 500, body: JSON.stringify({ message: 'Internal server error' }) };
};
```

---

## Testing

- Use **Node.js built-in test runner**: `node:test` and `node:assert`
- No Vitest, Jest, or any external test framework
- Test files are **co-located** with the implementation they test
- Every test file uses a `makeSut()` factory function defined inside the outer `describe`

### Describe structure

Two nested `describe` blocks are required:

1. **Outer** — the class or file name (e.g. `'CustomerService'`)
2. **Inner** — the method being tested, with parentheses (e.g. `'signup()'`)

```
describe('CustomerService', () => {
  describe('signup()', () => {
    it('should ...', ...)
  })
})
```

### Mock Classes

Each interface that needs mocking gets a **mock class** in `test/mocks/`. The class implements the interface, using `mock.fn()` for each method. A pre-created instance is exported — tests import the instance directly.

```typescript
// test/mocks/MockCustomerRepository.ts
import { mock } from 'node:test';
import type { ICustomerRepository } from '../../data/domain/customer/ICustomerRepository.js';
import type { CustomerSchema } from '../../domain/models/customer/Customer.js';

class MockCustomerRepository implements ICustomerRepository {
  findByEmail = mock.fn(async (_email: string): Promise<CustomerSchema | null> => null);
  insert = mock.fn(
    async (_data: { email: string; passwordHash: string }): Promise<CustomerSchema> => ({
      id: '',
      email: '',
      verifiedAt: null,
      createdAt: '',
    }),
  );
}

export const mockCustomerRepository = new MockCustomerRepository();
```

### Resetting Mocks

Use the `resetMock` helper from `test/helpers/resetMock.ts` in `beforeEach` to reset call history on all mock instances used in the test:

```typescript
import { resetMock } from '../../../test/helpers/resetMock.js';

beforeEach(() => {
  resetMock(mockCustomerRepository);
  resetMock(mockHasher);
});
```

### Unit Test Pattern

```typescript
// data/services/customer/CustomerService.test.ts
import { beforeEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mockCustomerRepository } from '../../../test/mocks/MockCustomerRepository.js';
import { mockHasher } from '../../../test/mocks/MockHasher.js';
import { resetMock } from '../../../test/helpers/resetMock.js';
import { CustomerService } from './CustomerService.js';

describe('CustomerService', () => {
  const makeSut = () => {
    const sut = new CustomerService(mockCustomerRepository, mockHasher);
    return { sut };
  };

  beforeEach(() => {
    resetMock(mockCustomerRepository);
    resetMock(mockHasher);
  });

  describe('signup()', () => {
    it('should call findByEmail with correct email', async () => {
      const { sut } = makeSut();
      mockCustomerRepository.findByEmail.mock.mockImplementationOnce(async () => null);
      await sut.signup({ email: 'test@test.com', password: 'password123' });
      assert.equal(mockCustomerRepository.findByEmail.mock.calls[0]?.arguments[0], 'test@test.com');
    });
  });
});
```

### Rules
- Each interface gets a mock class in `test/mocks/` that implements the interface with `mock.fn()` methods
- Mock files export a pre-created instance (not the class)
- Use `resetMock()` in `beforeEach` to reset all mock call history between tests
- `makeSut()` is defined inside the outer `describe`, not at module level
- Use `assert.equal`, `assert.deepEqual`, `assert.rejects`, etc. from `node:assert/strict`
- Tests must not depend on each other or on execution order

---

## Code Style

Enforced via **Biome** (replaces both Prettier and ESLint — no separate config needed for each):

| Rule | Value |
|---|---|
| Quotes | Single |
| Semicolons | Required |
| Trailing commas | All |
| Print width | 100 |
| Indentation | 2 spaces |

Use `async/await` consistently — no raw `.then()` chains.

---

## Database

- **PostgreSQL** via **Neon** (serverless PostgreSQL, scales to zero)
- Neon is not AWS-native but has a Terraform provider and works seamlessly with Lambda
- Connection via standard PostgreSQL connection string (stored in AWS Secrets Manager or environment variable)
- Use a connection pooler (Neon provides one built-in) — Lambda creates many short-lived connections, pooling is required

### Migration strategy
- Use SQL migration files, applied in order (e.g. `001_create_users.sql`, `002_create_accounts.sql`)
- Migrations run as a separate step before deployment, never automatically on Lambda cold start

---

## Dependencies

| Purpose | Package |
|---|---|
| Schema validation | `zod` |
| OpenAPI generation | `@asteasolutions/zod-to-openapi` |
| Testing | `node:test` (built-in) |
| HTTP types | `@types/aws-lambda` |
| Linting & formatting | `@biomejs/biome` |
| Language | TypeScript 5+ |

> Other packages (PostgreSQL client, JWT, hashing, etc.) are added as needed and always wrapped in `infra/`.

### Adding New Packages

Any third-party package that provides an external capability (database client, email sender, HTTP client, file storage, etc.) **must** be wrapped in the `infra/` layer:

1. Define an interface in `data/domain/{feature}/` describing what the capability does — not how
2. Implement the interface in `infra/{type}/{feature}/` using the actual package
3. Inject the implementation via constructor at the composition root in the handler

**The rest of the codebase must never import a third-party package directly** — only the `infra/` layer is allowed to do so (except `zod` in `domain/` and `node:*` built-ins anywhere).

```
New package: some-sms-client

data/domain/sms/ISmsService.ts       # interface: send(to: string, message: string): Promise<void>
infra/services/sms/SmsService.ts     # implementation using some-sms-client
infra/services/sms/SmsService.test.ts
```

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
feat(customer): add signup route
chore: add biome and tsconfig
```

---

## Rules Summary for Code Generation

When generating code for this project, always:

1. Follow Clean Architecture — respect layer boundaries, dependencies point inward
2. Each feature gets its own subfolder inside every layer (e.g. `services/user/`, `models/user/`)
3. Define Zod schemas in `domain/models/{feature}/`, derive all types with `z.infer<>`
4. Place interfaces in `data/domain/{feature}/` prefixed with `I`
5. Implement services in `data/services/{feature}/` depending only on interfaces
6. Implement infrastructure in `infra/{type}/{feature}/` — never import `infra` from `data` or `domain`
7. Inject dependencies via constructor at the composition root in the handler file
8. Validate input with Zod `parse()` inside the handler, not inside services
9. Use `BaseError` for domain errors with explicit HTTP status codes
10. Write tests with `node:test`, co-located, using the `makeSut()` pattern
11. Never write types manually when a Zod schema already defines the shape
12. Any new third-party package must be wrapped in `infra/` with a corresponding interface in `data/domain/` — never import packages directly in `data/` or `domain/`
13. Every route file must have a co-located `*.meta.ts` file with OpenAPI metadata — register it in `openapi/generate.ts` and regenerate the spec
