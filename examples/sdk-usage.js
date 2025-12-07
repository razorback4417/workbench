/**
 * Flux SDK Usage Examples
 *
 * This file demonstrates how to use the Flux SDK to integrate
 * prompt management into your applications.
 *
 * Note: This is a browser-based example. For Node.js usage,
 * you would need to adapt the storage layer.
 */

// Import from the local SDK
import { FluxClient } from '../sdk/index.js';

// Initialize the SDK
// Note: In browser, API keys are managed through the Settings page
// The SDK uses the existing Flux storage and services
const flux = new FluxClient({
  // Config is optional - SDK uses existing storage
});

// Example 1: Run a prompt with variables
async function runPromptExample() {
  try {
    const response = await flux.prompts.run('email-summarizer', {
      email: 'Long email content here...',
      maxLength: '200'
    });

    console.log('Response:', response.text);
    console.log('Latency:', response.latency, 'ms');
    console.log('Cost:', `$${response.cost.toFixed(4)}`);
    console.log('Tokens:', response.tokens);
  } catch (error) {
    console.error('Error running prompt:', error.message);
  }
}

// Example 2: Get prompt details
async function getPromptExample() {
  const prompt = await flux.prompts.get('email-summarizer');
  console.log('Prompt:', prompt.name);
  console.log('Description:', prompt.description);
  console.log('Active Version:', prompt.activeVersionId);
  console.log('Variables:', prompt.versions[0].variables);
}

// Example 3: Create a new prompt
async function createPromptExample() {
  const newPrompt = await flux.prompts.create({
    name: 'Code Review Assistant',
    description: 'Reviews code for bugs and best practices',
    template: 'Review this code for bugs and security issues:\n\n{{code}}\n\nProvide feedback:',
    variables: ['code'],
    model: 'gemini-2.5-flash',
    temperature: 0.3
  });

  console.log('Created prompt:', newPrompt.id);
}

// Example 4: Get execution logs
async function getLogsExample() {
  const logs = await flux.logs.list({
    promptId: 'email-summarizer',
    limit: 10,
    status: 'success'
  });

  console.log(`Found ${logs.length} logs`);
  logs.forEach(log => {
    console.log(`- ${log.timestamp}: ${log.status} (${log.latency}ms, $${log.cost.toFixed(4)})`);
  });
}

// Example 5: Run an evaluation
async function runEvaluationExample() {
  const evalRun = await flux.evaluations.run({
    promptId: 'email-summarizer',
    datasetId: 'test-dataset',
    criteria: 'Check for accuracy, completeness, and clarity'
  });

  console.log('Evaluation ID:', evalRun.id);
  console.log('Status:', evalRun.status);
  console.log('Score:', evalRun.score, '/100');
}

// Example 6: Create and monitor A/B test
async function abTestExample() {
  // Create A/B test
  const abTest = await flux.abTests.create({
    name: 'Email Summarizer Variants',
    description: 'Testing different prompt templates',
    variants: [
      { promptId: 'email-summarizer-v1', versionId: 'v1', weight: 50 },
      { promptId: 'email-summarizer-v2', versionId: 'v1', weight: 50 }
    ]
  });

  console.log('A/B Test created:', abTest.id);

  // Check results after some time
  const results = await flux.abTests.get(abTest.id);
  console.log('Success Rate:', results.metrics.successRate, '%');
  console.log('Avg Latency:', results.metrics.avgLatency, 'ms');
  console.log('Winner:', results.winnerVariantId);
}

// Example 7: Error handling
async function errorHandlingExample() {
  try {
    await flux.prompts.run('non-existent-prompt', {});
  } catch (error) {
    switch (error.code) {
      case 'PROMPT_NOT_FOUND':
        console.error('Prompt does not exist');
        break;
      case 'API_KEY_INVALID':
        console.error('Invalid API key');
        break;
      case 'RATE_LIMIT_EXCEEDED':
        console.error('Rate limit exceeded, please retry later');
        break;
      default:
        console.error('Unknown error:', error.message);
    }
  }
}

// Example 8: Batch processing
async function batchProcessingExample() {
  const inputs = [
    { email: 'Email 1 content...' },
    { email: 'Email 2 content...' },
    { email: 'Email 3 content...' }
  ];

  const results = await Promise.all(
    inputs.map(input =>
      flux.prompts.run('email-summarizer', input)
    )
  );

  console.log(`Processed ${results.length} emails`);
  const totalCost = results.reduce((sum, r) => sum + r.cost, 0);
  console.log('Total cost:', `$${totalCost.toFixed(4)}`);
}

// Example 9: Using specific prompt version
async function useSpecificVersionExample() {
  // Get prompt with specific version
  const prompt = await flux.prompts.get('email-summarizer', { version: 2 });

  // Or run a specific version directly
  const response = await flux.prompts.run('email-summarizer', {
    email: 'Test email'
  }, {
    version: 2 // Use version 2 instead of production
  });

  console.log('Response from version 2:', response.text);
}

// Example 10: Webhook integration (server-side)
async function webhookExample(req, res) {
  // In your Express/Next.js server
  const { promptId, variables } = req.body;

  try {
    const response = await flux.prompts.run(promptId, variables);
    res.json({ success: true, data: response });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

// Run examples
if (require.main === module) {
  console.log('Flux SDK Examples\n');

  // Uncomment to run specific examples:
  // runPromptExample();
  // getPromptExample();
  // createPromptExample();
  // getLogsExample();
  // runEvaluationExample();
  // abTestExample();
  // errorHandlingExample();
  // batchProcessingExample();
  // useSpecificVersionExample();
}

export {
  runPromptExample,
  getPromptExample,
  createPromptExample,
  getLogsExample,
  runEvaluationExample,
  abTestExample,
  errorHandlingExample,
  batchProcessingExample,
  useSpecificVersionExample
};

