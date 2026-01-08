
```markdown
# Contributing to BSV Health-Chain Frontend

Thank you for contributing to our health-chain dApp! This guide helps ensure smooth collaboration.

## Table of Contents
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Branch Strategy](#branch-strategy)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Code Style](#code-style)
- [Testing](#testing)
- [Health Data Compliance](#health-data-compliance)

---

## Getting Started

### Prerequisites
- Node.js v18+
- npm or yarn
- Git
- BSV Wallet (for testing)

### Setup
```bash
git clone https://github.com/your-org/bsv-health-chain-frontend.git
cd bsv-health-chain-frontend
npm install
npm run dev
```

### Local Development

```shellscript
npm run dev         # Start dev server
npm run build       # Build for production
npm test            # Run tests
npm run lint        # Check code style
```

---

## Development Workflow

### 1. Branch Strategy

We use **Git Flow** model:

```plaintext
main      → Production releases (stable)
develop   → Integration branch (next release)
feature/* → New features
bugfix/*  → Bug fixes
docs/*    → Documentation
hotfix/*  → Emergency fixes for main
```

### 2. Creating a Branch

Always branch from `develop`:

```shellscript
git checkout develop
git pull origin develop
git checkout -b feature/your-feature-name
```

### 3. Branch Naming Convention

```plaintext
feature/user-authentication       # New feature
feature/health-records-upload     # Feature with context
bugfix/wallet-connection-error    # Bug fix
docs/setup-instructions           # Documentation
```

---

## Commit Guidelines

### Commit Message Format

Use **Conventional Commits**:

```plaintext
type(scope): subject

body

footer
```

### Types

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation
- `style:` - Code style (formatting, missing semicolons)
- `refactor:` - Code refactoring
- `test:` - Adding/updating tests
- `chore:` - Dependency updates, build config


### Examples

```shellscript
git commit -m "feat(auth): add wallet authentication flow"
git commit -m "fix(records): resolve health record sync issue"
git commit -m "docs(setup): add deployment instructions"
git commit -m "refactor(components): improve health card component"
```

### Commit Best Practices

- ✅ Commit frequently (small, logical units)
- ✅ Write clear, descriptive messages
- ✅ Reference issue numbers: `fix(wallet): resolve #123`
- ❌ Don't commit large unrelated changes
- ❌ Don't use vague messages like "update" or "fixes"


---

## Pull Request Process

### Before Creating PR

1. Update your branch:


```shellscript
git fetch origin
git rebase origin/develop
```

2. Test locally:


```shellscript
npm run lint
npm test
npm run build
```

3. Ensure commits are clean:


```shellscript
git log --oneline -5  # Review last 5 commits
```

### Creating a Pull Request

1. Push your branch:


```shellscript
git push -u origin feature/your-feature
```

2. On GitHub, click "Compare & pull request"
3. Fill PR template:


```markdown
## Description
Brief description of your changes

## Type of Change
- [ ] New feature
- [ ] Bug fix
- [ ] Documentation
- [ ] Refactoring

## Testing
Describe testing you performed:
- [ ] Unit tests passed
- [ ] Manual testing completed
- [ ] No console errors

## Health Data Considerations
Does this change affect health data?
- [ ] Yes (describe security measures)
- [ ] No

## Screenshots/Logs
(If applicable)
```

### Review Requirements

- ✅ At least 1 approval required from team members
- ✅ All checks must pass (linting, tests, builds)
- ✅ Branch must be up to date with develop
- ✅ No merge conflicts


### After Approval

1. Squash and merge (recommended):


```shellscript
# GitHub UI: "Squash and merge"
```

2. Delete branch:


```shellscript
git push origin --delete feature/your-feature
git branch -d feature/your-feature
```

---

## Code Style

### ESLint & Prettier

```shellscript
npm run lint        # Check code style
npm run lint:fix    # Auto-fix issues
npm run format      # Format with Prettier
```

### React/TypeScript Guidelines

- Use functional components
- Use TypeScript for type safety
- Use meaningful variable names
- Keep components small and focused
- Add comments for complex logic


### File Organization

```plaintext
src/
├── components/        # React components
├── pages/             # Next.js pages
├── hooks/             # Custom hooks
├── utils/             # Utility functions
├── types/             # TypeScript types
├── services/          # BSV services, APIs
├── styles/            # Global styles
└── __tests__/         # Test files
```

---

## Testing

### Running Tests

```shellscript
npm test                    # Run all tests
npm test -- --watch        # Watch mode
npm test -- --coverage     # Coverage report
```

### Writing Tests

- Write tests for new features
- Aim for 80%+ code coverage
- Use descriptive test names
- Mock BSV services appropriately


---

## Health Data Compliance

### Security Requirements

⚠️ **Critical for health data:**

1. **No hardcoded credentials** in code
2. **Use environment variables** for API keys
3. **Encrypt sensitive data** in transit and at rest
4. **Validate user input** thoroughly
5. **Never log** personal health information
6. **Follow HIPAA** guidelines where applicable


### Before Committing

- No API keys in code
- No hardcoded endpoints
- No sensitive data in logs
- Use `.env.local` for secrets


---

## Reporting Issues

### Bug Reports

Include:

- Description of the bug
- Steps to reproduce
- Expected behavior
- Actual behavior
- Browser/OS information
- Screenshots


### Feature Requests

Include:

- Use case/motivation
- Proposed solution
- Alternatives considered
- Any additional context


---

## Questions?

- **Documentation:** Check `/docs` folder
- **Issues:** Open a GitHub issue
- **Discussions:** Use GitHub Discussions


---

## Code of Conduct

- Be respectful and inclusive
- Assume good intent
- Focus on code, not criticism
- Help others learn and grow


Thank you for contributing! 🙏

```plaintext

```