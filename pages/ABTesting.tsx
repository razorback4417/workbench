import React, { useEffect, useState } from 'react';
import { Plus, Play, Pause, Trophy, TrendingUp, Clock, DollarSign, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { ABTest, Prompt, LogEntry } from '../types';
import { getABTests, saveABTest, getVariantMetrics, determineWinner } from '../services/abTestService';
import { storage } from '../services/storage';

export const ABTesting: React.FC = () => {
  const [tests, setTests] = useState<ABTest[]>([]);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewTestModal, setShowNewTestModal] = useState(false);
  const [expandedTestId, setExpandedTestId] = useState<string | null>(null);
  const [variantMetrics, setVariantMetrics] = useState<Record<string, any[]>>({});

  // New test form state
  const [newTest, setNewTest] = useState<Partial<ABTest>>({
    name: '',
    description: '',
    variants: [],
    status: 'draft'
  });

  useEffect(() => {
    const loadData = async () => {
      const [testsData, promptsData] = await Promise.all([
        getABTests(),
        storage.getPrompts()
      ]);
      setTests(testsData);
      setPrompts(promptsData);
      setLoading(false);
    };
    loadData();
  }, []);

  useEffect(() => {
    // Load metrics for running/completed tests
    const loadMetrics = async () => {
      const activeTests = tests.filter(t => t.status === 'running' || t.status === 'completed');
      const metrics: Record<string, any[]> = {};

      for (const test of activeTests) {
        try {
          const variantMetricsList = await Promise.all(
            test.variants.map((_, idx) => getVariantMetrics(test.id, idx).catch(() => null))
          );
          metrics[test.id] = variantMetricsList.filter(m => m !== null);
        } catch (error) {
          console.error('Failed to load metrics:', error);
        }
      }

      setVariantMetrics(metrics);
    };

    if (tests.length > 0) {
      loadMetrics();
    }
  }, [tests]);

  const handleCreateTest = async () => {
    if (!newTest.name || !newTest.variants || newTest.variants.length < 2) {
      alert('Please fill in test name and add at least 2 variants');
      return;
    }

    const test: ABTest = {
      id: `ab-${Date.now()}`,
      name: newTest.name!,
      description: newTest.description || '',
      variants: newTest.variants,
      status: 'draft',
      startDate: new Date().toISOString(),
      metrics: {
        totalRequests: 0,
        successRate: 0,
        avgLatency: 0,
        avgCost: 0,
        errorRate: 0
      }
    };

    await saveABTest(test);
    setTests(await getABTests());
    setShowNewTestModal(false);
    setNewTest({ name: '', description: '', variants: [], status: 'draft' });
  };

  const handleStartTest = async (testId: string) => {
    const test = tests.find(t => t.id === testId);
    if (!test) return;

    test.status = 'running';
    test.startDate = new Date().toISOString();
    await saveABTest(test);
    setTests(await getABTests());
  };

  const handlePauseTest = async (testId: string) => {
    const test = tests.find(t => t.id === testId);
    if (!test) return;

    test.status = 'paused';
    await saveABTest(test);
    setTests(await getABTests());
  };

  const handleEndTest = async (testId: string) => {
    const test = tests.find(t => t.id === testId);
    if (!test) return;

    try {
      const winnerIndex = await determineWinner(testId);
      test.status = 'completed';
      test.endDate = new Date().toISOString();
      test.winnerVariantId = winnerIndex !== null ? winnerIndex.toString() : undefined;
      await saveABTest(test);
      setTests(await getABTests());
    } catch (error) {
      console.error('Failed to determine winner:', error);
      alert('Could not determine winner. Make sure there are enough requests (minimum 10 per variant).');
    }
  };

  const addVariant = () => {
    if (prompts.length === 0) {
      alert('No prompts available. Create a prompt first.');
      return;
    }

    // Find first prompt with at least one version
    const promptWithVersion = prompts.find(p => p.versions && p.versions.length > 0);

    if (!promptWithVersion || !promptWithVersion.versions[0]) {
      alert('No prompts with versions available. Create a prompt with at least one version first.');
      return;
    }

    const firstVersion = promptWithVersion.versions[0];
    const currentVariants = newTest.variants || [];
    const numVariants = currentVariants.length;

    // Calculate weight: if first variant, use 50, otherwise distribute evenly
    const weight = numVariants === 0 ? 50 : Math.floor(100 / (numVariants + 2));

    setNewTest({
      ...newTest,
      variants: [
        ...currentVariants,
        {
          promptId: promptWithVersion.id,
          versionId: firstVersion.id,
          weight: weight
        }
      ]
    });
  };

  const removeVariant = (index: number) => {
    const updated = newTest.variants?.filter((_, i) => i !== index) || [];
    // Rebalance weights to sum to 100
    if (updated.length > 0) {
      const equalWeight = Math.floor(100 / updated.length);
      const remainder = 100 - (equalWeight * updated.length);
      updated.forEach((v, i) => {
        v.weight = equalWeight + (i === 0 ? remainder : 0);
      });
    }
    setNewTest({ ...newTest, variants: updated });
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">A/B Testing</h1>
          <p className="text-gray-500 text-sm mt-1">Compare different prompts or versions to find the best performer</p>
        </div>
        <button
          onClick={() => setShowNewTestModal(true)}
          className="bg-black text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors shadow-sm flex items-center"
        >
          <Plus size={14} className="mr-2" />
          New A/B Test
        </button>
      </div>

      {/* New Test Modal */}
      {showNewTestModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Create A/B Test</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Test Name *</label>
                <input
                  type="text"
                  value={newTest.name || ''}
                  onChange={(e) => setNewTest({ ...newTest, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  placeholder="e.g., Support Response Optimization"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={newTest.description || ''}
                  onChange={(e) => setNewTest({ ...newTest, description: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  rows={2}
                  placeholder="What are you testing?"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">Variants (Select different prompts or versions)</label>
                  <button
                    onClick={addVariant}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                  >
                    + Add Variant
                  </button>
                </div>
                <div className="space-y-3">
                  {newTest.variants?.map((variant, idx) => {
                    const selectedPrompt = prompts.find(p => p.id === variant.promptId);
                    return (
                      <div key={idx} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-start justify-between mb-2">
                          <span className="text-xs font-semibold text-gray-600">Variant {idx + 1}</span>
                          {newTest.variants && newTest.variants.length > 2 && (
                            <button
                              onClick={() => removeVariant(idx)}
                              className="text-red-600 hover:text-red-800 text-xs"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Prompt</label>
                            <select
                              value={variant.promptId}
                              onChange={(e) => {
                                const updated = [...(newTest.variants || [])];
                                const newPrompt = prompts.find(p => p.id === e.target.value);
                                if (newPrompt?.versions[0]) {
                                  updated[idx] = {
                                    ...updated[idx],
                                    promptId: e.target.value,
                                    versionId: newPrompt.versions[0].id
                                  };
                                }
                                setNewTest({ ...newTest, variants: updated });
                              }}
                              className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
                            >
                              {prompts.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Version</label>
                            <select
                              value={variant.versionId}
                              onChange={(e) => {
                                const updated = [...(newTest.variants || [])];
                                updated[idx].versionId = e.target.value;
                                setNewTest({ ...newTest, variants: updated });
                              }}
                              className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
                            >
                              {selectedPrompt?.versions.map(v => (
                                <option key={v.id} value={v.id}>
                                  v{v.version} - {v.status}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div className="mt-2 flex items-center space-x-2">
                          <label className="block text-xs text-gray-600">Weight:</label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={variant.weight}
                            onChange={(e) => {
                              const updated = [...(newTest.variants || [])];
                              updated[idx].weight = parseInt(e.target.value) || 0;
                              setNewTest({ ...newTest, variants: updated });
                            }}
                            className="w-20 border border-gray-300 rounded px-2 py-1 text-sm"
                          />
                          <span className="text-xs text-gray-500">%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {newTest.variants && newTest.variants.length > 0 && (
                  <div className="mt-2 text-xs text-gray-500">
                    Total Weight: {newTest.variants.reduce((sum, v) => sum + v.weight, 0)}%
                  </div>
                )}
              </div>

              <div className="pt-4 flex justify-end space-x-2">
                <button
                  onClick={() => {
                    setShowNewTestModal(false);
                    setNewTest({ name: '', description: '', variants: [], status: 'draft' });
                  }}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateTest}
                  className="px-4 py-2 bg-black text-white rounded-lg text-sm font-medium"
                >
                  Create Test
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Summary Stats */}
      {!loading && tests.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="text-xs text-gray-500 font-medium mb-1">Total Tests</div>
            <div className="text-2xl font-bold text-gray-900">{tests.length}</div>
          </div>
          <div className="bg-white rounded-xl border border-green-200 p-4 bg-green-50/50">
            <div className="text-xs text-green-600 font-medium mb-1">Running</div>
            <div className="text-2xl font-bold text-green-700">
              {tests.filter(t => t.status === 'running').length}
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="text-xs text-gray-500 font-medium mb-1">Completed</div>
            <div className="text-2xl font-bold text-gray-900">
              {tests.filter(t => t.status === 'completed').length}
            </div>
          </div>
          <div className="bg-white rounded-xl border border-yellow-200 p-4 bg-yellow-50/50">
            <div className="text-xs text-yellow-600 font-medium mb-1">Draft</div>
            <div className="text-2xl font-bold text-yellow-700">
              {tests.filter(t => t.status === 'draft').length}
            </div>
          </div>
        </div>
      )}

      {/* Tests List */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading tests...</div>
      ) : tests.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <p className="text-gray-500 mb-4">No A/B tests yet</p>
          <button
            onClick={() => setShowNewTestModal(true)}
            className="bg-black text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-800"
          >
            Create Your First Test
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {tests.map(test => {
            const isRunning = test.status === 'running';
            const isCompleted = test.status === 'completed';
            const metrics = variantMetrics[test.id] || [];
            const winnerIndex = test.winnerVariantId !== undefined && test.winnerVariantId !== null
              ? parseInt(test.winnerVariantId)
              : null;

            return (
              <div key={test.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{test.name}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        test.status === 'running' ? 'bg-green-50 text-green-700' :
                        test.status === 'completed' ? 'bg-gray-50 text-gray-700' :
                        test.status === 'paused' ? 'bg-yellow-50 text-yellow-700' :
                        'bg-gray-50 text-gray-500'
                      }`}>
                        {test.status.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">{test.description || 'No description'}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Started: {new Date(test.startDate).toLocaleDateString()}
                      {test.endDate && ` • Ended: ${new Date(test.endDate).toLocaleDateString()}`}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {isRunning && (
                      <>
                        <button
                          onClick={() => handlePauseTest(test.id)}
                          className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-lg text-xs font-medium hover:bg-yellow-200 flex items-center"
                        >
                          <Pause size={12} className="mr-1" />
                          Pause
                        </button>
                        <button
                          onClick={() => handleEndTest(test.id)}
                          className="px-3 py-1 bg-gray-900 text-white rounded-lg text-xs font-medium hover:bg-gray-800 flex items-center"
                        >
                          End Test
                        </button>
                      </>
                    )}
                    {test.status === 'draft' && (
                      <button
                        onClick={() => handleStartTest(test.id)}
                        className="px-3 py-1 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 flex items-center"
                      >
                        <Play size={12} className="mr-1" />
                        Start
                      </button>
                    )}
                    {test.status === 'paused' && (
                      <button
                        onClick={() => handleStartTest(test.id)}
                        className="px-3 py-1 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 flex items-center"
                      >
                        <Play size={12} className="mr-1" />
                        Resume
                      </button>
                    )}
                    <button
                      onClick={() => setExpandedTestId(expandedTestId === test.id ? null : test.id)}
                      className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-200"
                    >
                      {expandedTestId === test.id ? 'Collapse' : 'View Details'}
                    </button>
                  </div>
                </div>

                {/* Variants Comparison */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  {test.variants.map((variant, idx) => {
                    const prompt = prompts.find(p => p.id === variant.promptId);
                    const version = prompt?.versions.find(v => v.id === variant.versionId);
                    const variantMetric = metrics.find(m => m.variantIndex === idx);
                    const isWinner = winnerIndex === idx;

                    return (
                      <div
                        key={idx}
                        className={`p-4 rounded-lg border-2 ${
                          isWinner ? 'border-green-500 bg-green-50' :
                          isRunning ? 'border-gray-200 bg-gray-50' :
                          'border-gray-200 bg-white'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-semibold text-gray-900">
                                Variant {idx + 1}: {prompt?.name || 'Unknown'}
                              </span>
                              {isWinner && (
                                <span className="flex items-center text-green-700 text-xs font-medium">
                                  <Trophy size={12} className="mr-1" />
                                  Winner
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              v{version?.version || '?'} • {variant.weight}% traffic
                            </div>
                          </div>
                        </div>

                        {variantMetric ? (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="text-2xl font-bold text-gray-900">{variantMetric.successRate.toFixed(1)}%</div>
                              <div className="text-xs text-gray-500">Success Rate</div>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div>
                                <span className="text-gray-500">Requests:</span>
                                <span className="ml-1 font-mono font-semibold">{variantMetric.totalRequests}</span>
                              </div>
                              <div>
                                <span className="text-gray-500">Success:</span>
                                <span className={`ml-1 font-mono font-semibold ${variantMetric.successRate >= 90 ? 'text-green-600' : variantMetric.successRate >= 70 ? 'text-yellow-600' : 'text-red-600'}`}>
                                  {variantMetric.successRequests}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-500">Failed:</span>
                                <span className={`ml-1 font-mono font-semibold ${variantMetric.failedRequests > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                                  {variantMetric.failedRequests}
                                </span>
                              </div>
                              <div className="flex items-center">
                                <Clock size={12} className="text-gray-400 mr-1" />
                                <span className="text-gray-500">Latency:</span>
                                <span className="ml-1 font-mono">{variantMetric.avgLatency}ms</span>
                              </div>
                              <div className="flex items-center">
                                <DollarSign size={12} className="text-gray-400 mr-1" />
                                <span className="text-gray-500">Cost:</span>
                                <span className="ml-1 font-mono">${variantMetric.avgCost.toFixed(4)}</span>
                              </div>
                              <div>
                                <span className="text-gray-500">Error Rate:</span>
                                <span className={`ml-1 font-mono font-semibold ${variantMetric.errorRate > 10 ? 'text-red-600' : 'text-gray-900'}`}>
                                  {variantMetric.errorRate.toFixed(1)}%
                                </span>
                              </div>
                            </div>

                            {variantMetric.errorLogs && variantMetric.errorLogs.length > 0 && (
                              <div className="mt-3 pt-2 border-t border-gray-200">
                                <div className="text-xs font-semibold text-red-600 mb-2">Recent Errors ({variantMetric.errorLogs.length}):</div>
                                <div className="space-y-2 max-h-48 overflow-y-auto">
                                  {variantMetric.errorLogs.map((log: LogEntry, i: number) => (
                                    <div key={i} className="text-xs text-red-700 bg-red-50 p-2 rounded border border-red-200">
                                      <div className="font-mono whitespace-pre-wrap break-words">
                                        {log.output}
                                      </div>
                                      {log.inputs && Object.keys(log.inputs).length > 0 && (
                                        <div className="mt-1 text-red-600 text-xs">
                                          Input: {JSON.stringify(log.inputs)}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-xs text-gray-400 italic">No data yet</div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {expandedTestId === test.id && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="text-sm font-semibold text-gray-700 mb-3">Test Details</div>
                    <div className="space-y-3">
                      {test.variants.map((variant, idx) => {
                        const prompt = prompts.find(p => p.id === variant.promptId);
                        const version = prompt?.versions.find(v => v.id === variant.versionId);
                        return (
                          <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                            <div className="text-sm font-medium text-gray-900 mb-1">
                              Variant {idx + 1}: {prompt?.name} (v{version?.version})
                            </div>
                            <div className="text-xs text-gray-600 font-mono whitespace-pre-wrap">
                              {version?.template.substring(0, 200)}
                              {version && version.template.length > 200 ? '...' : ''}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {winnerIndex !== null && isCompleted && winnerIndex >= 0 && winnerIndex < test.variants.length && (() => {
                  const winnerVariant = test.variants[winnerIndex];
                  const winnerPrompt = prompts.find(p => p.id === winnerVariant.promptId);
                  const winnerVersion = winnerPrompt?.versions.find(v => v.id === winnerVariant.versionId);
                  const winnerMetric = metrics.find(m => m.variantIndex === winnerIndex);
                  const otherMetrics = metrics.filter(m => m.variantIndex !== winnerIndex);

                  return (
                    <div className="mt-4 p-4 bg-green-50 border-2 border-green-300 rounded-lg">
                      <div className="flex items-start space-x-3 mb-3">
                        <Trophy size={20} className="text-green-700 mt-0.5" />
                        <div className="flex-1">
                          <div className="text-base font-bold text-green-900 mb-1">
                            Test Completed - Winner: Variant {winnerIndex + 1}
                          </div>
                          <div className="text-sm text-green-800">
                            {winnerPrompt?.name} (v{winnerVersion?.version})
                          </div>
                        </div>
                      </div>

                      {winnerMetric && otherMetrics.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-green-300">
                          <div className="text-xs font-semibold text-green-800 mb-2">Why This Variant Won:</div>
                          <div className="grid grid-cols-2 gap-3 text-xs">
                            {winnerMetric.successRate > (otherMetrics[0]?.successRate || 0) && (
                              <div className="bg-white/50 p-2 rounded border border-green-200">
                                <div className="text-green-700 font-semibold">Success Rate</div>
                                <div className="text-green-900">
                                  {winnerMetric.successRate.toFixed(1)}% vs {otherMetrics[0]?.successRate.toFixed(1)}%
                                  <span className="text-green-600 ml-1">(+{(winnerMetric.successRate - (otherMetrics[0]?.successRate || 0)).toFixed(1)}%)</span>
                                </div>
                              </div>
                            )}
                            {winnerMetric.avgLatency < (otherMetrics[0]?.avgLatency || Infinity) && (
                              <div className="bg-white/50 p-2 rounded border border-green-200">
                                <div className="text-green-700 font-semibold">Latency</div>
                                <div className="text-green-900">
                                  {winnerMetric.avgLatency}ms vs {otherMetrics[0]?.avgLatency}ms
                                  <span className="text-green-600 ml-1">({((otherMetrics[0]?.avgLatency || 0) - winnerMetric.avgLatency).toFixed(0)}ms faster)</span>
                                </div>
                              </div>
                            )}
                            {winnerMetric.avgCost < (otherMetrics[0]?.avgCost || Infinity) && (
                              <div className="bg-white/50 p-2 rounded border border-green-200">
                                <div className="text-green-700 font-semibold">Cost</div>
                                <div className="text-green-900">
                                  ${winnerMetric.avgCost.toFixed(4)} vs ${otherMetrics[0]?.avgCost.toFixed(4)}
                                  <span className="text-green-600 ml-1">(${((otherMetrics[0]?.avgCost || 0) - winnerMetric.avgCost).toFixed(4)} cheaper)</span>
                                </div>
                              </div>
                            )}
                            {winnerMetric.errorRate < (otherMetrics[0]?.errorRate || Infinity) && (
                              <div className="bg-white/50 p-2 rounded border border-green-200">
                                <div className="text-green-700 font-semibold">Error Rate</div>
                                <div className="text-green-900">
                                  {winnerMetric.errorRate.toFixed(1)}% vs {otherMetrics[0]?.errorRate.toFixed(1)}%
                                  <span className="text-green-600 ml-1">({((otherMetrics[0]?.errorRate || 0) - winnerMetric.errorRate).toFixed(1)}% lower)</span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
