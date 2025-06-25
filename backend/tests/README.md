# Test Organization

This directory contains all tests for the backend application, organized by test type and functionality.

## Directory Structure

```
tests/
├── unit/                   # Unit tests
│   ├── controllers/        # Controller unit tests
│   │   ├── auth/          # Authentication controller tests
│   │   └── ...            # Other controller tests
│   ├── services/          # Service layer unit tests
│   ├── models/            # Model unit tests
│   ├── routes/            # Route unit tests
│   ├── utils/             # Utility function tests
│   │   └── dataStructures/ # Data structure tests
│   ├── middleware/        # Middleware tests
│   └── setup.ts           # Test setup configuration
├── integration/           # Integration tests
├── e2e/                  # End-to-end tests
└── manual/               # Manual testing scripts
    ├── simple-socket-test.js
    ├── test-group-chat.js
    └── test-socketio-client.js
```

## Test Types

### Unit Tests (`/unit`)

- Test individual functions, methods, and classes in isolation
- Use mocks and stubs for dependencies
- Fast execution
- High code coverage

### Integration Tests (`/integration`)

- Test how different parts of the application work together
- May use test databases or external services
- Slower than unit tests but faster than E2E

### End-to-End Tests (`/e2e`)

- Test complete user workflows
- Use real databases and services
- Slowest execution but highest confidence

### Manual Tests (`/manual`)

- Scripts for manual testing and debugging
- Socket.IO connection tests
- Group chat functionality tests
- Not run automatically in CI/CD

## Running Tests

```bash
# Run all tests
npm test

# Run only unit tests
npm run test:unit

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch
```

## Writing Tests

### Naming Convention

- Use `.test.ts` for TypeScript test files
- Use `.test.js` for JavaScript test files
- Match the source file structure: `src/controllers/AuthController.ts` → `tests/unit/controllers/AuthController.test.ts`

### Test Structure

```typescript
describe("ComponentName", () => {
	describe("methodName", () => {
		it("should do something when condition", () => {
			// Test implementation
		});
	});
});
```

### Setup and Teardown

- Use `setup.ts` for global test configuration
- Use `beforeEach`/`afterEach` for test-specific setup
- Clean up resources in `afterAll`/`afterEach`
