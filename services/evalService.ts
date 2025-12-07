import { EvalRun, EvalResultItem, Prompt, PromptVersion } from '../types';
import { storage } from './storage';
import { runPrompt, evaluateResponse, generateImprovementSuggestions } from './llmService';

export interface EvalDataset {
  id: string;
  name: string;
  description: string;
  testCases: Array<{
    inputs: Record<string, string>;
    expectedOutput?: string;
    criteria?: string;
  }>;
}

// Mock eval datasets - in production, these would be stored in the database
export const MOCK_EVAL_DATASETS: EvalDataset[] = [
  {
    id: 'ds1',
    name: 'Customer Support Quality',
    description: 'Tests empathy, clarity, and actionability of support responses across various customer scenarios',
    testCases: [
      {
        inputs: {
          order_id: '12345',
          discount_percent: '10',
          customer_message: 'My order is late and I am very frustrated! This is unacceptable!'
        },
        criteria: 'Response should be empathetic, acknowledge the frustration, offer the discount clearly, and provide next steps or timeline.'
      },
      {
        inputs: {
          order_id: '67890',
          discount_percent: '15',
          customer_message: 'When will my package arrive?'
        },
        criteria: 'Response should provide helpful information, include the discount offer, and be professional yet friendly.'
      },
      {
        inputs: {
          order_id: 'ORD-999',
          discount_percent: '20',
          customer_message: 'I received the wrong item. The package says "Widget A" but I ordered "Widget B". This is the third time this has happened!'
        },
        criteria: 'Response must acknowledge the repeated issue, apologize sincerely, offer immediate resolution steps, and include the discount as compensation.'
      },
      {
        inputs: {
          order_id: 'SHIP-456',
          discount_percent: '5',
          customer_message: 'The product arrived damaged. The box was crushed and the item inside is broken.'
        },
        criteria: 'Response should express concern, offer replacement or refund options, include discount, and provide clear instructions for next steps.'
      },
      {
        inputs: {
          order_id: 'REF-789',
          discount_percent: '25',
          customer_message: 'I want to return this item. It doesn\'t work as advertised.'
        },
        criteria: 'Response should be understanding, provide clear return instructions, offer the discount for future purchase, and maintain positive relationship.'
      }
    ]
  },
  {
    id: 'ds2',
    name: 'Product Description Quality',
    description: 'Tests SEO optimization, marketing appeal, and feature highlighting across different product types',
    testCases: [
      {
        inputs: {
          product_name: 'Wireless Headphones',
          features: 'Noise cancelling, 30hr battery, Bluetooth 5.0',
          audience: 'Tech enthusiasts and commuters'
        },
        criteria: 'Description should be engaging, highlight key features, appeal to the target audience, and include SEO-friendly keywords naturally.'
      },
      {
        inputs: {
          product_name: 'Organic Coffee Beans',
          features: 'Single origin, Fair trade certified, Medium roast, 12oz bag',
          audience: 'Coffee connoisseurs and health-conscious consumers'
        },
        criteria: 'Description should emphasize quality, ethical sourcing, flavor profile, and appeal to both connoisseurs and health-conscious buyers.'
      },
      {
        inputs: {
          product_name: 'Smart Home Security Camera',
          features: '4K resolution, Night vision, Motion detection, Cloud storage, Mobile app',
          audience: 'Homeowners concerned about security'
        },
        criteria: 'Description should highlight security benefits, technical specifications, ease of use, and address privacy concerns.'
      }
    ]
  },
  {
    id: 'ds3',
    name: 'Code Review Assistant',
    description: 'Tests code review quality, bug detection, and actionable feedback across different code patterns',
    testCases: [
      {
        inputs: {
          code: 'function add(a, b) { return a + b; }'
        },
        criteria: 'Review should identify missing input validation, suggest type checking, note edge cases (null, undefined, non-numeric), and provide code examples for improvements.'
      },
      {
        inputs: {
          code: 'for (let i = 0; i < arr.length; i++) { arr[i] = arr[i] * 2; }'
        },
        criteria: 'Review should suggest modern alternatives (map), explain performance implications, note mutability concerns, and provide before/after code examples.'
      },
      {
        inputs: {
          code: 'async function fetchData(url) { const response = await fetch(url); return response.json(); }'
        },
        criteria: 'Review should identify missing error handling, suggest try-catch blocks, note potential security issues (input validation), and recommend timeout handling.'
      },
      {
        inputs: {
          code: 'const user = users.find(u => u.id === userId); user.email = newEmail;'
        },
        criteria: 'Review should identify potential null reference errors, suggest defensive programming, note immutability concerns, and provide safer alternatives.'
      }
    ]
  },
  {
    id: 'ds4',
    name: 'Email Subject Line Generator',
    description: 'Tests subject line effectiveness, engagement, and compliance with email marketing best practices',
    testCases: [
      {
        inputs: {
          topic: 'Summer Sale - 30% off all items, ends July 31st'
        },
        criteria: 'Subject line should be 5-8 words, include urgency, mention discount percentage, create FOMO, and avoid spam trigger words.'
      },
      {
        inputs: {
          topic: 'New Product Launch: AI-Powered Smart Watch with Health Tracking'
        },
        criteria: 'Subject line should highlight innovation, mention key benefit (health tracking), create curiosity, and be concise (under 50 characters).'
      },
      {
        inputs: {
          topic: 'Account Security Alert: Unusual login detected from new location'
        },
        criteria: 'Subject line should convey urgency without being alarmist, be clear about the issue, and prompt immediate action while maintaining trust.'
      },
      {
        inputs: {
          topic: 'Your order #12345 has shipped - Expected delivery: Tomorrow'
        },
        criteria: 'Subject line should include order number, convey positive news, set delivery expectations, and be informative yet concise.'
      }
    ]
  },
  {
    id: 'ds5',
    name: 'SQL Query Builder',
    description: 'Tests SQL generation accuracy, safety, and handling of complex queries across different schemas',
    testCases: [
      {
        inputs: {
          schema_json: '{"users": {"id": "int", "name": "string", "email": "string", "created_at": "timestamp"}, "orders": {"id": "int", "user_id": "int", "total": "decimal", "status": "string"}}',
          question: 'Find all users who have placed orders with total greater than $100'
        },
        criteria: 'Query should correctly join tables, filter by total > 100, use proper SQL syntax, avoid SQL injection risks, and return only necessary columns.'
      },
      {
        inputs: {
          schema_json: '{"products": {"id": "int", "name": "string", "price": "decimal", "category_id": "int"}, "categories": {"id": "int", "name": "string"}}',
          question: 'Get the average price per category, showing category name'
        },
        criteria: 'Query should correctly group by category, calculate average, join tables properly, and handle NULL values appropriately.'
      },
      {
        inputs: {
          schema_json: '{"employees": {"id": "int", "name": "string", "manager_id": "int", "salary": "decimal"}}',
          question: 'Find employees who earn more than their manager'
        },
        criteria: 'Query should correctly self-join the table, compare salaries, and handle edge cases like employees without managers.'
      }
    ]
  }
];

export const getDatasets = async (): Promise<EvalDataset[]> => {
  const customDatasets = await storage.getEvalDatasets();
  return [...MOCK_EVAL_DATASETS, ...customDatasets];
};

export const runEval = async (
  promptId: string,
  versionId: string,
  datasetId: string,
  customCriteria?: string
): Promise<EvalRun> => {
  const prompt = await storage.getPromptById(promptId);
  if (!prompt) {
    throw new Error('Prompt not found');
  }

  const version = prompt.versions.find(v => v.id === versionId);
  if (!version) {
    throw new Error('Version not found');
  }

  const allDatasets = await getDatasets();
  const dataset = allDatasets.find(d => d.id === datasetId);
  if (!dataset) {
    throw new Error('Dataset not found');
  }

  // Create eval run
  const evalRun: EvalRun = {
    id: `eval-${Date.now()}`,
    name: `${dataset.name} - ${prompt.name}`,
    date: new Date().toISOString(),
    promptVersionId: versionId,
    promptId: promptId,
    score: 0,
    status: 'running',
    sampleSize: dataset.testCases.length,
    results: []
  };

  // Save initial state
  await storage.saveEvalRun(evalRun);

  // Run tests
  const results: EvalResultItem[] = [];
  let totalScore = 0;

  for (const testCase of dataset.testCases) {
    try {
      // Run the prompt
      const execution = await runPrompt(
        version.model,
        version.template,
        testCase.inputs,
        version.temperature
      );

      // Evaluate the output
      const criteria = customCriteria || testCase.criteria || 'Output should be relevant, accurate, and well-formatted.';
      const evaluation = await evaluateResponse(
        JSON.stringify(testCase.inputs),
        execution.text,
        criteria
      );

      const result: EvalResultItem = {
        input: testCase.inputs,
        output: execution.text,
        expectedOutput: testCase.expectedOutput,
        score: evaluation.score,
        gradeReason: evaluation.reasoning,
        suggestions: evaluation.suggestions
      };

      results.push(result);
      totalScore += evaluation.score;

      // Log the execution
      await storage.addLog({
        id: `eval-log-${Date.now()}-${Math.random()}`,
        promptId,
        versionId,
        timestamp: new Date().toISOString(),
        inputs: testCase.inputs,
        output: execution.text,
        latency: execution.latency,
        cost: execution.cost,
        tokens: execution.tokens,
        status: execution.status,
        model: version.model
      });
    } catch (error: any) {
      results.push({
        input: testCase.inputs,
        output: `Error: ${error.message}`,
        score: 0,
        gradeReason: 'Test execution failed',
        suggestions: [
          'Check that all required variables are provided in the test case inputs',
          'Verify the prompt template syntax is correct and variables are properly formatted',
          'Ensure the model API key is configured and the model is accessible'
        ]
      });
    }
  }

  // Calculate final score
  const avgScore = results.length > 0 ? Math.round(totalScore / results.length) : 0;
  const passed = avgScore >= 70; // Threshold for passing

  // Generate improvement suggestions for failed tests
  const failedResults = results.filter(r => r.score < 70);
  let improvementSuggestions: string[] = [];

  if (failedResults.length > 0) {
    try {
      improvementSuggestions = await generateImprovementSuggestions(version.template, failedResults);
    } catch (error) {
      console.error('Failed to generate improvement suggestions:', error);
    }
  }

  evalRun.score = avgScore;
  evalRun.status = passed ? 'passed' : 'failed';
  evalRun.results = results;
  evalRun.improvementSuggestions = improvementSuggestions;

  // Save final state
  await storage.saveEvalRun(evalRun);

  return evalRun;
};

// Run regression test on prompt save
export const runRegressionTest = async (
  promptId: string,
  versionId: string
): Promise<EvalRun | null> => {
  // Find the first available dataset for this prompt
  // In production, you'd have dataset associations with prompts
  const dataset = MOCK_EVAL_DATASETS[0];
  if (!dataset) {
    return null;
  }

  try {
    const evalRun = await runEval(promptId, versionId, dataset.id);

    // If regression failed, log it
    if (evalRun.status === 'failed') {
      console.warn(`Regression test failed for prompt ${promptId}, version ${versionId}. Score: ${evalRun.score}`);
      // In production, you might want to send notifications here
    }

    return evalRun;
  } catch (error) {
    console.error('Regression test failed:', error);
    return null;
  }
};

