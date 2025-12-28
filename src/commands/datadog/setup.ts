import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import * as readline from 'readline';
import { logIfVerbose } from '../../utils/logger.js';

export interface DataDogSetupOptions {
  verbose?: boolean;
  apiKey?: string;
  site?: string;
  nodeEnv?: string;
}

/**
 * Interactive setup for DataDog logging configuration
 * Creates a .env file with DataDog credentials
 */
export async function dataDogSetup(options: DataDogSetupOptions = {}): Promise<void> {
  const { verbose, apiKey, site, nodeEnv } = options;
  const cwd = process.cwd();
  const envPath = join(cwd, '.env');
  const envExamplePath = join(cwd, '.env.example');

  logIfVerbose(verbose, 'Setting up DataDog configuration...');

  // Check if .env already exists
  if (existsSync(envPath)) {
    logIfVerbose(verbose, '.env file already exists');
    const shouldOverwrite = await promptUser(
      'A .env file already exists. Do you want to overwrite it? (y/N): '
    );
    if (shouldOverwrite.toLowerCase() !== 'y') {
      console.error('Setup cancelled. Edit your .env file manually if needed.');
      process.exit(0);
    }
  }

  // Get API key
  let finalApiKey = apiKey;
  if (!finalApiKey) {
    logIfVerbose(verbose, 'Prompting for DataDog API key...');
    console.error(
      '\nGet your API key from: https://app.datadoghq.com/organization-settings/api-keys\n'
    );
    finalApiKey = await promptUser('Enter your DataDog API key: ');
    if (!finalApiKey) {
      console.error('Error: API key is required');
      process.exit(1);
    }
  }

  // Get site (optional)
  let finalSite = site;
  if (!finalSite) {
    logIfVerbose(verbose, 'Prompting for DataDog site...');
    console.error(
      '\nCommon sites: datadoghq.com (US1), datadoghq.eu (EU), us3.datadoghq.com, us5.datadoghq.com'
    );
    const siteInput = await promptUser('Enter DataDog site (press Enter for datadoghq.com): ');
    finalSite = siteInput || 'datadoghq.com';
  }

  // Get NODE_ENV (optional)
  let finalNodeEnv = nodeEnv;
  if (!finalNodeEnv) {
    logIfVerbose(verbose, 'Prompting for NODE_ENV...');
    const nodeEnvInput = await promptUser('Enter NODE_ENV (press Enter for development): ');
    finalNodeEnv = nodeEnvInput || 'development';
  }

  // Read template from .env.example if it exists
  let envContent: string;
  if (existsSync(envExamplePath)) {
    logIfVerbose(verbose, 'Using .env.example as template');
    envContent = readFileSync(envExamplePath, 'utf-8');
    // Replace placeholder values
    envContent = envContent.replace(/DD_API_KEY=.*/, `DD_API_KEY=${finalApiKey}`);
    envContent = envContent.replace(/DD_SITE=.*/, `DD_SITE=${finalSite}`);
    envContent = envContent.replace(/NODE_ENV=.*/, `NODE_ENV=${finalNodeEnv}`);
  } else {
    // Create from scratch
    logIfVerbose(verbose, 'Creating .env from scratch');
    envContent = `# DataDog Configuration
# Your DataDog API key (required for DataDog logging)
DD_API_KEY=${finalApiKey}

# DataDog site (optional, defaults to datadoghq.com)
DD_SITE=${finalSite}

# Environment for tagging logs (optional)
NODE_ENV=${finalNodeEnv}
`;
  }

  // Write .env file
  try {
    writeFileSync(envPath, envContent, 'utf-8');
    logIfVerbose(verbose, '.env file created successfully');
    console.log(envPath);
    console.error('\nDataDog configuration complete!');
    console.error('Your .env file has been created with DataDog credentials.');
    console.error('\nIMPORTANT: Never commit your .env file to version control!');
  } catch (error) {
    console.error('Error: Failed to write .env file');
    if (error instanceof Error) {
      console.error(error.message);
    }
    process.exit(1);
  }
}

/**
 * Prompt user for input using readline
 */
function promptUser(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stderr,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}
