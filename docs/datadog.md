# DataDog Logging

This document describes the DataDog logging integration in tsutils.

## Overview

tsutils includes built-in support for logging errors and warnings to DataDog. This integration is optional and can be enabled by configuring environment variables.

## Configuration

### Environment Variables

DataDog logging is controlled by environment variables:

- **`DD_API_KEY`** (required): Your DataDog API key
- **`DD_SITE`** (optional): DataDog site (default: `datadoghq.com`)
  - Common values: `datadoghq.com`, `datadoghq.eu`, `us3.datadoghq.com`, `us5.datadoghq.com`
- **`NODE_ENV`** (optional): Environment tag for logs (default: `development`)

### Setup

#### Option 1: Using the setup command (Recommended)

Run the interactive setup command:

```bash
tsu datadog setup
```

This will prompt you for:
- Your DataDog API key (get it from [DataDog API Keys](https://app.datadoghq.com/organization-settings/api-keys))
- DataDog site (defaults to `datadoghq.com`)
- NODE_ENV (defaults to `development`)

You can also run it non-interactively with flags:

```bash
tsu datadog setup --api-key YOUR_KEY --site datadoghq.com --node-env production
```

#### Option 2: Manual setup

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add your DataDog API key:
   ```bash
   DD_API_KEY=your_api_key_here
   DD_SITE=datadoghq.com  # Optional, defaults to datadoghq.com
   NODE_ENV=production     # Optional, defaults to development
   ```

3. Get your API key from [DataDog API Keys](https://app.datadoghq.com/organization-settings/api-keys)

### Verifying Your Setup

After setting up DataDog, verify the connection works:

```bash
tsu datadog check
```

This will:
- Verify your DataDog configuration is valid
- Send a test log to DataDog
- Provide a direct link to view your logs

If successful, you'll see:
```
success
✅ DataDog connection successful!
Test log has been sent to DataDog.
Check your logs at: https://app.datadoghq.com/logs
```

Use the `-v` flag for more detailed output:
```bash
tsu datadog check -v
```

### Local Development

For local development without DataDog logging:
- Simply don't set `DD_API_KEY` in your environment
- The logger will work normally but won't send logs to DataDog
- All logs will still be printed to console

## Usage

### Automatic Logging

Errors and warnings are automatically logged to DataDog when you use the existing logger functions:

```typescript
import { logError, logWarn, logInfo } from 'tsutils';

// These automatically send to DataDog if configured
logError('Something went wrong');
logWarn('This is a warning');
logInfo('Informational message');
```

### Setup Script Integration

The setup script (`script/setup.sh`) automatically logs errors and warnings to DataDog during the setup process. This helps track setup issues across different environments.

### Programmatic Usage

For library consumers who want more control:

```typescript
import {
  loadDataDogConfig,
  initializeDataDogClient,
  createDataDogLogger,
  DataDogLogLevel,
} from 'tsutils';

// Initialize DataDog client
const config = loadDataDogConfig();
const client = initializeDataDogClient(config);
const logger = createDataDogLogger(client);

// Use the logger
await logger.error('Error message', { userId: '123', action: 'test' });
await logger.warn('Warning message', { context: 'additional data' });
await logger.info('Info message');
```

## Log Structure

Logs sent to DataDog include:

- **`message`**: The log message
- **`level`**: Log level (`info`, `warn`, `error`)
- **`service`**: Set to `tsutils`
- **`ddsource`**: Set to `tsutils`
- **`ddtags`**: Environment and level tags
- **Custom metadata**: Any additional metadata passed to the logger

## Security

- **Never commit your `.env` file**: The `.gitignore` file already excludes `.env` files
- **Use environment variables in production**: Set `DD_API_KEY` via your deployment platform's environment variable configuration
- **Keep API keys secure**: Treat DataDog API keys as sensitive credentials

## Troubleshooting

### Logs not appearing in DataDog

First, run the check command to diagnose the issue:

```bash
tsu datadog check -v
```

This will help identify common problems:

1. **DataDog not configured**: Run `tsu datadog setup` to configure your API key
2. **Invalid API key**: Verify your API key is correct at [DataDog API Keys](https://app.datadoghq.com/organization-settings/api-keys)
3. **Wrong DataDog site**: Check that `DD_SITE` matches your DataDog account region
4. **Network issues**: Ensure you have internet connectivity
5. **Environment variables**: Check that `DD_API_KEY` is set in your current environment

### Setup script not logging to DataDog

The setup script only logs to DataDog after the project is built:
1. First run builds the project but logs only to console
2. Subsequent runs can log to DataDog since `dist/utils/logger.js` exists

## Disabling DataDog Logging

To disable DataDog logging:
- Remove or unset the `DD_API_KEY` environment variable
- Logs will continue to work normally but won't be sent to DataDog

## Dependencies

DataDog integration uses:
- [`@datadog/datadog-api-client`](https://github.com/DataDog/datadog-api-client-typescript) - Official DataDog API client

This is the only additional production dependency added for DataDog functionality.
