# Flux SDK Examples

This directory contains example code demonstrating how to use the Flux SDK in various scenarios.

## Files

- **`sdk-usage.js`** - Comprehensive examples covering all major SDK features
- **`test-sdk.html`** - Interactive browser-based test page for the SDK
- **`simple-test.js`** - Node.js test script (placeholder - see note below)

## Quick Start

### Browser Usage (Recommended)

1. Start the development server:
```bash
npm run dev
```

2. Open `examples/test-sdk.html` in your browser, or navigate to:
```
http://localhost:3000/examples/test-sdk.html
```

3. Click the test buttons to try different SDK features!

### Using SDK in Your Code

```javascript
// In any React component or JavaScript file
import { FluxClient } from '../sdk/index.js';

const flux = new FluxClient();

// List prompts
const prompts = await flux.prompts.list();

// Run a prompt
const response = await flux.prompts.run('prompt-id', {
  variable1: 'value1'
});
```

### Node.js Usage

The SDK currently uses `localStorage` which is browser-only. For Node.js usage, you would need to:
1. Create a custom storage adapter
2. Or use the SDK in a browser/Electron environment

## Example Scenarios

### Basic Usage
- Running prompts with variables
- Fetching prompt details
- Creating new prompts

### Advanced Features
- Execution logging and observability
- Running evaluations
- A/B testing
- Batch processing
- Version management

### Error Handling
- Proper error handling patterns
- Rate limiting
- API key validation

### Integration Patterns
- Webhook integration
- Server-side usage
- Batch operations

## Next Steps

- Check the [main README](../README.md) for full SDK documentation
- Visit [docs.flux.ai](https://docs.flux.ai) for complete API reference
- See the [test-chatbot](../test-chatbot/) for a complete integration example

