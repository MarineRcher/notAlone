# Coding Standards - notAlone Project

This document outlines the coding standards for the notAlone project, adapted from the 42 School normes for TypeScript/JavaScript development.

## Overview

The project uses ESLint and Prettier to enforce consistent code style and quality. The standards are designed to improve code readability, maintainability, and collaboration.

## Core Rules

### 1. Function Length
- **Rule**: Each function must have a maximum of 25 lines (excluding opening and closing braces)
- **Rationale**: Promotes single responsibility principle and easier testing
- **ESLint Rule**: `max-lines-per-function`

### 2. Line Length
- **Rule**: Each line cannot exceed 80 characters (including comments)
- **Rationale**: Ensures code readability on various screen sizes and when reviewing code
- **ESLint Rule**: `max-len`

### 3. Statement Structure
- **Rule**: One instruction per line
- **Rationale**: Improves debugging and code clarity
- **ESLint Rule**: `max-statements-per-line`

### 4. Whitespace Management
- **Rule**: 
  - Empty lines must not contain spaces or tabs
  - Lines must not end with trailing spaces or tabs
- **Rationale**: Prevents invisible characters that can cause version control issues
- **ESLint Rules**: `no-trailing-spaces`, `no-mixed-spaces-and-tabs`

### 5. Brace Style
- **Rule**: Allman brace style - opening braces on new lines
- **Rationale**: Clear visual separation of code blocks
- **ESLint Rule**: `brace-style`

### 6. Indentation
- **Rule**: Use tabs (4-space width) for indentation
- **Rationale**: Consistent visual structure, allows personal preference for tab width
- **Prettier Setting**: `useTabs: true`, `tabWidth: 4`

### 7. Spacing Rules
- **Rule**: 
  - Commas and semicolons followed by space (unless end of line)
  - Binary and ternary operators separated by single space
  - Keywords followed by space
- **Rationale**: Improves readability and consistency
- **ESLint Rules**: `comma-spacing`, `semi-spacing`, `space-infix-ops`, `keyword-spacing`

### 8. Variable Declarations
- **Rule**: 
  - One variable declaration per line
  - Variables declared at the top of functions
  - Blank line after variable declarations
- **Rationale**: Clear separation between declarations and implementation
- **ESLint Rules**: `one-var`, `vars-on-top`, `newline-after-var`

### 9. Operator Line Breaks
- **Rule**: When breaking lines, operators should be at the beginning of the new line
- **Rationale**: Clear visual indication of continuation
- **ESLint Rule**: `operator-linebreak`

### 10. TypeScript Specific Rules
- **Rule**: 
  - Explicit function return types required
  - No `any` type usage
  - Prefer `const` over `let` when possible
- **Rationale**: Type safety and better code documentation
- **ESLint Rules**: `@typescript-eslint/explicit-function-return-type`, `@typescript-eslint/no-explicit-any`

## Usage

### Backend
```bash
cd backend

# Check for linting errors
yarn lint:check

# Fix linting errors automatically
yarn lint

# Check formatting
yarn format:check

# Format code
yarn format
```

### Frontend
```bash
cd frontend

# Check for linting errors
yarn lint:check

# Fix linting errors automatically
yarn lint

# Check formatting
yarn format:check

# Format code
yarn format
```

## Configuration Files

- **Backend**: `.eslintrc.js`, `.prettierrc`, `.eslintignore`, `.prettierignore`
- **Frontend**: `.eslintrc.js`, `.prettierrc`, `.eslintignore`, `.prettierignore`

## IDE Integration

Most modern IDEs support ESLint and Prettier integration. Configure your IDE to:
1. Show ESLint errors and warnings inline
2. Format code with Prettier on save
3. Use the project's configuration files

## Enforcement

These standards are enforced through:
1. Pre-commit hooks (recommended to add)
2. CI/CD pipeline checks (recommended to add)
3. Code review process

## Exceptions

In rare cases where the rules cannot be applied (e.g., external library requirements), use ESLint disable comments sparingly and document the reason:

```typescript
// eslint-disable-next-line rule-name
// Reason: External library requires this specific format
const externalLibraryCall = someLibrary.method();
```

## Migration

When migrating existing code:
1. Run `yarn format` to apply automatic formatting
2. Run `yarn lint` to fix auto-fixable issues
3. Manually address remaining linting errors
4. Split large functions into smaller, focused functions
5. Add explicit type annotations where missing 