import { EvalRun, EvalResultItem, Prompt, PromptVersion } from '../types';
import { storage } from './storage';
import { runPrompt, evaluateResponse } from './llmService';

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
    description: 'Tests empathy, clarity, and actionability of support responses',
    testCases: [
      {
        inputs: {
          order_id: '12345',
          discount_percent: '10',
          customer_message: 'My order is late and I am very frustrated!'
        },
        criteria: 'Response should be empathetic, acknowledge the frustration, and offer the discount clearly.'
      },
      {
        inputs: {
          order_id: '67890',
          discount_percent: '15',
          customer_message: 'When will my package arrive?'
        },
        criteria: 'Response should provide helpful information and include the discount offer.'
      }
    ]
  },
  {
    id: 'ds2',
    name: 'Product Description Quality',
    description: 'Tests SEO optimization and marketing appeal',
    testCases: [
      {
        inputs: {
          product_name: 'Wireless Headphones',
          features: 'Noise cancelling, 30hr battery, Bluetooth 5.0',
          audience: 'Tech enthusiasts and commuters'
        },
        criteria: 'Description should be engaging, highlight key features, and appeal to the target audience.'
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
        gradeReason: evaluation.reasoning
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
        gradeReason: 'Test execution failed'
      });
    }
  }

  // Calculate final score
  const avgScore = results.length > 0 ? Math.round(totalScore / results.length) : 0;
  const passed = avgScore >= 70; // Threshold for passing

  evalRun.score = avgScore;
  evalRun.status = passed ? 'passed' : 'failed';
  evalRun.results = results;

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

