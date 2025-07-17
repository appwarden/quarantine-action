# appwarden/quarantine-action

![Test Coverage](https://img.shields.io/badge/coverage-94.78%25-brightgreen)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

Easy-to-use GitHub Action to lock or unlock (quarantine) your Appwarden-protected domains

> Read the docs [to learn more](http://appwarden.io/docs/guides/quarantine-using-github-actions)

## Features

- 🔒 **Lock/Unlock Domains**: Control access to your Appwarden-protected domains
- 🧪 **Test Modes**: Support for test-lock and test-unlock modes for safe testing
- 🚀 **Easy Integration**: Simple GitHub Actions workflow integration
- 🛡️ **Type Safe**: Written in TypeScript with comprehensive type definitions
- ✅ **Well Tested**: 80%+ test coverage with comprehensive unit tests
- 🔧 **Configurable**: Debug mode and flexible configuration options

## Usage

```yaml
name: Deploy and Lock Domain
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Lock domain during deployment
        uses: appwarden/quarantine-action@v1
        with:
          domain-name: 'example.com'
          domain-mode: 'lock'
          appwarden-token: ${{ secrets.APPWARDEN_TOKEN }}
          debug: 'false'

      # Your deployment steps here

      - name: Unlock domain after deployment
        uses: appwarden/quarantine-action@v1
        with:
          domain-name: 'example.com'
          domain-mode: 'unlock'
          appwarden-token: ${{ secrets.APPWARDEN_TOKEN }}
```

## Inputs

| Input | Description | Required | Default |
|-------|-------------|----------|---------|
| `domain-name` | Domain to place into a mode (e.g. appwarden.io) | ✅ | - |
| `domain-mode` | Mode to place domain in: `lock`, `unlock`, `test-lock`, `test-unlock` | ✅ | - |
| `appwarden-token` | Your Appwarden API token | ✅ | - |
| `debug` | Enable debug mode | ❌ | `false` |

## Development

### Prerequisites

- Node.js 20+
- npm

### Setup

```bash
# Clone the repository
git clone https://github.com/appwarden/quarantine-action.git
cd quarantine-action

# Install dependencies
npm install
```

### Testing

This project has comprehensive test coverage using Vitest with undici for network mocking:

```bash
# Run tests in watch mode
npm test

# Run tests once
npm run test:run

# Run tests with coverage
npm run test:coverage

# Run tests with coverage (single run)
npm run test:run:coverage
```

#### Coverage Thresholds

The project maintains high test coverage standards:

- **Statements**: 80%+
- **Branches**: 80%+
- **Functions**: 80%+
- **Lines**: 80%+

### Code Quality

```bash
# Format code
npm run format

# Check formatting
npm run check
```

## License

MIT
