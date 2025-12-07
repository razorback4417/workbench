# Flux SDK

The Flux SDK provides a simple, type-safe API for interacting with Flux prompt management from your applications.

## Installation

The SDK is included in this repository. Import it directly:

```typescript
import { FluxClient } from './sdk/index.js';
```

## Quick Start

```typescript
import { FluxClient } from './sdk/index.js';

// Initialize
const flux = new FluxClient();

// List all prompts
const prompts = await flux.prompts.list();

// Run a prompt
const response = await flux.prompts.run('prompt-id', {
  variable1: 'value1',
  variable2: 'value2'
});

console.log(response.text);
console.log(`Latency: ${response.latency}ms`);
console.log(`Cost: $${response.cost.toFixed(4)}`);
```

## API Reference

### FluxClient

Main client class for interacting with Flux.

```typescript
const flux = new FluxClient(config?: FluxClientConfig);
```

#### Config Options

- `apiKey?: string` - API key (optional, uses Settings if not provided)
- `baseUrl?: string` - Base URL (optional, for future API support)
- `timeout?: number` - Request timeout in ms (optional)

### Prompts API

#### `flux.prompts.list()`

Get all prompts.

```typescript
const prompts = await flux.prompts.list();
```

#### `flux.prompts.get(id, options?)`

Get a specific prompt by ID.

```typescript
const prompt = await flux.prompts.get('prompt-id');
const promptV2 = await flux.prompts.get('prompt-id', { version: 2 });
```

#### `flux.prompts.run(id, variables, options?)`

Run a prompt with variables.

```typescript
const response = await flux.prompts.run('prompt-id', {
  userMessage: 'Hello!',
  context: 'Support'
}, {
  version: 2,        // Optional: use specific version
  temperature: 0.7   // Optional: override temperature
});
```

Returns:
```typescript
{
  text: string;
  latency: number;    // ms
  cost: number;       // USD
  tokens: number;
  status: 'success' | 'error';
  error?: string;
}
```

#### `flux.prompts.create(options)`

Create a new prompt.

```typescript
const prompt = await flux.prompts.create({
  name: 'My Prompt',
  description: 'Does something useful',
  template: 'You are a helpful assistant. {{user_message}}',
  variables: ['user_message'],
  model: ModelType.GEMINI_2_5_FLASH,
  temperature: 0.7,
  tags: ['support', 'chat'],
  commitMessage: 'Initial version'
});
```

#### `flux.prompts.createVersion(promptId, options)`

Create a new version of an existing prompt.

```typescript
const version = await flux.prompts.createVersion('prompt-id', {
  template: 'Updated template with {{variable}}',
  variables: ['variable'],
  commitMessage: 'Improved clarity'
});
```

#### `flux.prompts.updateVersionStatus(promptId, versionId, status)`

Update the status of a prompt version.

```typescript
await flux.prompts.updateVersionStatus(
  'prompt-id',
  'version-id',
  'production'
);
```

### Logs API

#### `flux.logs.list(options?)`

List execution logs with optional filters.

```typescript
const logs = await flux.logs.list({
  promptId: 'prompt-id',
  status: 'success',
  limit: 100,
  offset: 0
});
```

#### `flux.logs.get(id)`

Get a specific log entry.

```typescript
const log = await flux.logs.get('log-id');
```

### Evaluations API

#### `flux.evaluations.run(options)`

Run an evaluation on a prompt.

```typescript
const evalRun = await flux.evaluations.run({
  promptId: 'prompt-id',
  versionId: 'version-id',  // Optional
  datasetId: 'dataset-id',
  criteria: 'Check for accuracy'  // Optional
});
```

#### `flux.evaluations.list()`

Get all evaluation runs.

```typescript
const evals = await flux.evaluations.list();
```

#### `flux.evaluations.get(id)`

Get a specific evaluation.

```typescript
const eval = await flux.evaluations.get('eval-id');
```

#### `flux.evaluations.getDatasets()`

Get available evaluation datasets.

```typescript
const datasets = await flux.evaluations.getDatasets();
```

### A/B Tests API

#### `flux.abTests.create(options)`

Create a new A/B test.

```typescript
const test = await flux.abTests.create({
  name: 'Prompt Variant Test',
  description: 'Testing two versions',
  variants: [
    { promptId: 'prompt-1', versionId: 'v1', weight: 50 },
    { promptId: 'prompt-2', versionId: 'v1', weight: 50 }
  ]
});
```

#### `flux.abTests.list()`

Get all A/B tests.

```typescript
const tests = await flux.abTests.list();
```

#### `flux.abTests.get(id)`

Get a specific A/B test.

```typescript
const test = await flux.abTests.get('test-id');
```

#### `flux.abTests.start(id)`

Start an A/B test.

```typescript
await flux.abTests.start('test-id');
```

#### `flux.abTests.pause(id)`

Pause an A/B test.

```typescript
await flux.abTests.pause('test-id');
```

#### `flux.abTests.selectVariant(testId)`

Select a variant for A/B testing (weighted random).

```typescript
const variant = await flux.abTests.selectVariant('test-id');
// Returns: { promptId: string, versionId: string }
```

#### `flux.abTests.determineWinner(testId)`

Determine the winner of an A/B test.

```typescript
const winnerIndex = await flux.abTests.determineWinner('test-id');
```

## Examples

See the `examples/` directory for complete examples:
- `test-sdk.html` - Interactive browser test page
- `sdk-usage.js` - Comprehensive usage examples
- `ReactComponentExample.tsx` - React component integration

## TypeScript Support

The SDK is fully typed. All methods and return types are available:

```typescript
import { FluxClient, Prompt, LogEntry, EvalRun, ABTest } from './sdk/index.js';

const flux = new FluxClient();
const prompt: Prompt = await flux.prompts.get('id');
```

## Error Handling

The SDK throws errors for common issues:

```typescript
try {
  await flux.prompts.run('invalid-id', {});
} catch (error) {
  if (error.message.includes('not found')) {
    console.error('Prompt does not exist');
  }
}
```

## Browser vs Node.js

The SDK currently uses `localStorage` which is browser-only. For Node.js usage, you would need to:
1. Create a custom storage adapter
2. Or use the SDK in a browser/Electron environment

## License

MIT

