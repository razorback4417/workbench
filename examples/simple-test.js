/**
 * Simple SDK Test Script
 *
 * Run this in Node.js with: node examples/simple-test.js
 *
 * Note: This requires a browser-like environment or adaptation
 * since the SDK uses localStorage. For browser usage, see test-sdk.html
 */

// This is a placeholder for Node.js usage
// In a real Node.js environment, you'd need to:
// 1. Use a different storage adapter (e.g., file system, database)
// 2. Or use the SDK in a browser environment

console.log(`
Flux SDK Test Script
====================

For browser-based testing, open examples/test-sdk.html in your browser.

For Node.js usage, you would need to:
1. Create a storage adapter that works with Node.js
2. Or use the SDK in a browser/Electron environment

The SDK is designed to work with the existing Flux services
which use localStorage (browser-only).
`);

// Example of how it would work in Node.js with a custom adapter:
/*
import { FluxClient } from './sdk/index.js';
import { createNodeStorageAdapter } from './sdk/adapters/node-storage.js';

const flux = new FluxClient({
  storage: createNodeStorageAdapter('./data')
});

// Then use normally:
const prompts = await flux.prompts.list();
console.log('Prompts:', prompts);
*/

