import { ABTest, Prompt, LogEntry } from '../types';
import { storage } from './storage';

const STORAGE_KEY = 'pw_ab_tests';

// Get all A/B tests
export const getABTests = async (): Promise<ABTest[]> => {
  const tests = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  return tests;
};

// Save A/B test
export const saveABTest = async (test: ABTest): Promise<void> => {
  const tests = await getABTests();
  const index = tests.findIndex(t => t.id === test.id);
  if (index !== -1) {
    tests[index] = test;
  } else {
    tests.push(test);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tests));
};

// Get A/B test by ID
export const getABTestById = async (id: string): Promise<ABTest | undefined> => {
  const tests = await getABTests();
  return tests.find(t => t.id === id);
};

// Select a variant based on weighted random
export const selectVariant = (test: ABTest): { promptId: string; versionId: string } => {
  if (test.variants.length === 0) {
    throw new Error('No variants in A/B test');
  }

  // Normalize weights to sum to 100
  const totalWeight = test.variants.reduce((sum, v) => sum + v.weight, 0);
  const normalizedWeights = test.variants.map(v => ({
    ...v,
    weight: (v.weight / totalWeight) * 100
  }));

  // Weighted random selection
  const random = Math.random() * 100;
  let cumulative = 0;

  for (const variant of normalizedWeights) {
    cumulative += variant.weight;
    if (random <= cumulative) {
      return { promptId: variant.promptId, versionId: variant.versionId };
    }
  }

  // Fallback to first variant
  return { promptId: normalizedWeights[0].promptId, versionId: normalizedWeights[0].versionId };
};

// Get variant-specific metrics
export const getVariantMetrics = async (testId: string, variantIndex: number) => {
  const logs = await storage.getLogs();
  const test = await getABTestById(testId);

  if (!test || !test.variants[variantIndex]) {
    throw new Error('A/B test or variant not found');
  }

  const variant = test.variants[variantIndex];
  const variantLogs = logs.filter(log =>
    log.promptId === variant.promptId &&
    log.versionId === variant.versionId &&
    new Date(log.timestamp) >= new Date(test.startDate) &&
    (!test.endDate || new Date(log.timestamp) <= new Date(test.endDate))
  );

  const totalRequests = variantLogs.length;
  const successCount = variantLogs.filter(l => l.status === 'success').length;
  const successRate = totalRequests > 0 ? (successCount / totalRequests) * 100 : 0;
  const avgLatency = totalRequests > 0
    ? variantLogs.reduce((sum, l) => sum + l.latency, 0) / totalRequests
    : 0;
  const avgCost = totalRequests > 0
    ? variantLogs.reduce((sum, l) => sum + l.cost, 0) / totalRequests
    : 0;
  const errorRate = totalRequests > 0 ? ((totalRequests - successCount) / totalRequests) * 100 : 0;
  const errorLogs = variantLogs.filter(l => l.status === 'error');

  return {
    variantIndex,
    promptId: variant.promptId,
    versionId: variant.versionId,
    totalRequests,
    successRequests: successCount,
    failedRequests: totalRequests - successCount,
    successRate,
    avgLatency: Math.round(avgLatency),
    avgCost,
    errorRate,
    errorLogs: errorLogs.slice(0, 5) // Last 5 errors
  };
};

// Determine winner based on metrics
export const determineWinner = async (testId: string): Promise<number | null> => {
  const test = await getABTestById(testId);
  if (!test || test.variants.length < 2) {
    return null;
  }

  try {
    const variantMetrics = await Promise.all(
      test.variants.map((_, idx) => getVariantMetrics(testId, idx).catch(() => null))
    );

    // Filter out null results (variants with errors)
    const validMetrics = variantMetrics.filter((m, idx) => m !== null) as Array<{
      variantIndex: number;
      totalRequests: number;
      successRate: number;
      errorRate: number;
      avgLatency: number;
    }>;

    if (validMetrics.length === 0) {
      return null; // No valid metrics
    }

    // Simple winner determination: highest success rate, lowest error rate, lowest latency
    let bestScore = -1;
    let winner: number | null = null;

    for (const metrics of validMetrics) {
      if (metrics.totalRequests < 10) continue; // Need minimum sample size

      // Composite score: success rate (60%), inverse error rate (20%), inverse latency (20%)
      const score =
        (metrics.successRate * 0.6) +
        ((100 - metrics.errorRate) * 0.2) +
        ((1000 - Math.min(metrics.avgLatency, 1000)) / 10 * 0.2);

      if (score > bestScore) {
        bestScore = score;
        winner = metrics.variantIndex;
      }
    }

    return winner;
  } catch (error) {
    console.error('Error determining winner:', error);
    return null;
  }
};
