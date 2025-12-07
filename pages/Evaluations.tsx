import React, { useEffect, useState } from 'react';
import { storage } from '../services/storage';
import { EvalRun, Prompt } from '../types';
import { CheckCircle, XCircle, Play, Plus, ChevronDown, ChevronRight, AlertTriangle, Eye, Edit2, Trash2 } from 'lucide-react';
import { runEval, getDatasets, MOCK_EVAL_DATASETS, EvalDataset } from '../services/evalService';

export const Evaluations: React.FC = () => {
  const [evals, setEvals] = useState<EvalRun[]>([]);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [datasets, setDatasets] = useState<EvalDataset[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedPromptId, setSelectedPromptId] = useState<string>('');
  const [selectedVersionId, setSelectedVersionId] = useState<string>('');
  const [selectedDatasetId, setSelectedDatasetId] = useState<string>('');
  const [customCriteria, setCustomCriteria] = useState<string>('');
  const [expandedEvalId, setExpandedEvalId] = useState<string | null>(null);
  const [showNewEvalModal, setShowNewEvalModal] = useState(false);
  const [showDatasetModal, setShowDatasetModal] = useState(false);
  const [viewingDatasetId, setViewingDatasetId] = useState<string | null>(null);
  const [newDataset, setNewDataset] = useState<Partial<EvalDataset>>({
    name: '',
    description: '',
    testCases: []
  });

  useEffect(() => {
    const loadData = async () => {
      const [evalsData, promptsData, datasetsData] = await Promise.all([
        storage.getEvals(),
        storage.getPrompts(),
        getDatasets()
      ]);
      setEvals(evalsData);
      setPrompts(promptsData);
      setDatasets(datasetsData);

      // Auto-select first prompt/version if available
      if (promptsData.length > 0) {
        const firstPrompt = promptsData[0];
        setSelectedPromptId(firstPrompt.id);
        if (firstPrompt.activeVersionId) {
          setSelectedVersionId(firstPrompt.activeVersionId);
        }
      }
      if (datasetsData.length > 0) {
        setSelectedDatasetId(datasetsData[0].id);
      }
    };
    loadData();
  }, []);

  const handleRunNewEval = async () => {
    if (!selectedPromptId || !selectedVersionId || !selectedDatasetId) {
      alert('Please select a prompt, version, and dataset');
      return;
    }

    setIsRunning(true);
    setShowNewEvalModal(false);

    try {
      const evalRun = await runEval(selectedPromptId, selectedVersionId, selectedDatasetId, customCriteria || undefined);

      // Refresh evals list
      const updatedEvals = await storage.getEvals();
      setEvals(updatedEvals);
      setExpandedEvalId(evalRun.id); // Auto-expand the new eval
      setCustomCriteria(''); // Reset custom criteria
    } catch (error: any) {
      alert(`Failed to run evaluation: ${error.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const handleCreateDataset = async () => {
    if (!newDataset.name || !newDataset.testCases || newDataset.testCases.length === 0) {
      alert('Please provide a name and at least one test case');
      return;
    }

    const dataset: EvalDataset = {
      id: `ds-${Date.now()}`,
      name: newDataset.name!,
      description: newDataset.description || '',
      testCases: newDataset.testCases
    };

    await storage.saveEvalDataset(dataset);
    const updatedDatasets = await getDatasets();
    setDatasets(updatedDatasets);
    setShowDatasetModal(false);
    setNewDataset({ name: '', description: '', testCases: [] });
    setSelectedDatasetId(dataset.id);
  };

  const addTestCase = () => {
    setNewDataset({
      ...newDataset,
      testCases: [
        ...(newDataset.testCases || []),
        { inputs: {}, criteria: 'Output should be relevant, accurate, and well-formatted.' }
      ]
    });
  };

  const removeTestCase = (index: number) => {
    const updated = newDataset.testCases?.filter((_, i) => i !== index) || [];
    setNewDataset({ ...newDataset, testCases: updated });
  };

  const updateTestCase = (index: number, field: string, value: any) => {
    const updated = [...(newDataset.testCases || [])];
    updated[index] = { ...updated[index], [field]: value };
    setNewDataset({ ...newDataset, testCases: updated });
  };

  const selectedPrompt = prompts.find(p => p.id === selectedPromptId);
  const selectedVersion = selectedPrompt?.versions.find(v => v.id === selectedVersionId);
  const selectedDataset = datasets.find(d => d.id === selectedDatasetId);

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-500">
        <div className="flex justify-between items-center">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Evaluations</h1>
                <p className="text-gray-500 text-sm mt-1">Test prompts against datasets to measure quality and catch regressions</p>
            </div>
            <div className="flex space-x-2">
                <button
                    onClick={() => setShowDatasetModal(true)}
                    className="bg-white border border-gray-200 text-gray-700 text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors flex items-center"
                >
                    <Plus size={14} className="mr-2" />
                    New Dataset
                </button>
                 <button
                    onClick={() => setShowNewEvalModal(true)}
                    disabled={isRunning}
                    className="bg-black text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors shadow-sm flex items-center"
                 >
                    <Plus size={14} className="mr-2" />
                    Run Evaluation
                </button>
            </div>
        </div>

        {/* New Dataset Modal */}
        {showDatasetModal && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Create Evaluation Dataset</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Dataset Name *</label>
                            <input
                                type="text"
                                value={newDataset.name || ''}
                                onChange={(e) => setNewDataset({ ...newDataset, name: e.target.value })}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                placeholder="e.g., Support Response Quality"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                            <textarea
                                value={newDataset.description || ''}
                                onChange={(e) => setNewDataset({ ...newDataset, description: e.target.value })}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                rows={2}
                                placeholder="What does this dataset test?"
                            />
                        </div>

                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label className="block text-sm font-medium text-gray-700">Test Cases *</label>
                                <button
                                    onClick={addTestCase}
                                    className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                                >
                                    + Add Test Case
                                </button>
                            </div>
                            <div className="space-y-3">
                                {newDataset.testCases?.map((testCase, idx) => (
                                    <div key={idx} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                                        <div className="flex justify-between items-start mb-3">
                                            <span className="text-xs font-semibold text-gray-600">Test Case {idx + 1}</span>
                                            <button
                                                onClick={() => removeTestCase(idx)}
                                                className="text-red-600 hover:text-red-800 text-xs"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                        <div className="space-y-3">
                                            <div>
                                                <label className="block text-xs text-gray-600 mb-1">Input Variables (JSON)</label>
                                                <textarea
                                                    value={JSON.stringify(testCase.inputs || {}, null, 2)}
                                                    onChange={(e) => {
                                                        try {
                                                            const parsed = JSON.parse(e.target.value);
                                                            updateTestCase(idx, 'inputs', parsed);
                                                        } catch {}
                                                    }}
                                                    className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs font-mono"
                                                    rows={4}
                                                    placeholder='{"variable1": "value1", "variable2": "value2"}'
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs text-gray-600 mb-1">Evaluation Criteria *</label>
                                                <textarea
                                                    value={testCase.criteria || ''}
                                                    onChange={(e) => updateTestCase(idx, 'criteria', e.target.value)}
                                                    className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs"
                                                    rows={2}
                                                    placeholder="What should the output achieve? (e.g., 'Response should be empathetic and include the discount offer')"
                                                />
                                            </div>
                                            {testCase.expectedOutput && (
                                                <div>
                                                    <label className="block text-xs text-gray-600 mb-1">Expected Output (Optional)</label>
                                                    <textarea
                                                        value={testCase.expectedOutput}
                                                        onChange={(e) => updateTestCase(idx, 'expectedOutput', e.target.value)}
                                                        className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs"
                                                        rows={2}
                                                        placeholder="Expected output text (if applicable)"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="pt-4 flex justify-end space-x-2">
                            <button
                                onClick={() => {
                                    setShowDatasetModal(false);
                                    setNewDataset({ name: '', description: '', testCases: [] });
                                }}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreateDataset}
                                className="px-4 py-2 bg-black text-white rounded-lg text-sm font-medium"
                            >
                                Create Dataset
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* View Dataset Modal */}
        {viewingDatasetId && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">
                                {datasets.find(d => d.id === viewingDatasetId)?.name}
                            </h3>
                            <p className="text-sm text-gray-500 mt-1">
                                {datasets.find(d => d.id === viewingDatasetId)?.description}
                            </p>
                        </div>
                        <button
                            onClick={() => setViewingDatasetId(null)}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            ×
                        </button>
                    </div>
                    <div className="space-y-3">
                        <div className="text-sm font-semibold text-gray-700 mb-2">
                            Test Cases ({datasets.find(d => d.id === viewingDatasetId)?.testCases.length || 0})
                        </div>
                        {datasets.find(d => d.id === viewingDatasetId)?.testCases.map((testCase, idx) => (
                            <div key={idx} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                                <div className="text-xs font-semibold text-gray-600 mb-2">Test Case {idx + 1}</div>
                                <div className="space-y-2">
                                    <div>
                                        <div className="text-xs text-gray-500 mb-1">Input:</div>
                                        <div className="text-xs font-mono bg-white p-2 rounded border border-gray-200">
                                            {JSON.stringify(testCase.inputs, null, 2)}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-gray-500 mb-1">Criteria:</div>
                                        <div className="text-xs bg-white p-2 rounded border border-gray-200">
                                            {testCase.criteria || 'No criteria specified'}
                                        </div>
                                    </div>
                                    {testCase.expectedOutput && (
                                        <div>
                                            <div className="text-xs text-gray-500 mb-1">Expected Output:</div>
                                            <div className="text-xs bg-white p-2 rounded border border-gray-200">
                                                {testCase.expectedOutput}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )}

        {/* New Eval Modal */}
        {showNewEvalModal && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Run New Evaluation</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Prompt</label>
                            <select
                                value={selectedPromptId}
                                onChange={(e) => {
                                    setSelectedPromptId(e.target.value);
                                    const prompt = prompts.find(p => p.id === e.target.value);
                                    if (prompt?.activeVersionId) {
                                        setSelectedVersionId(prompt.activeVersionId);
                                    }
                                }}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                            >
                                <option value="">Select a prompt...</option>
                                {prompts.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                        </div>
                        {selectedPrompt && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Version</label>
                                <select
                                    value={selectedVersionId}
                                    onChange={(e) => setSelectedVersionId(e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                >
                                    <option value="">Select a version...</option>
                                    {selectedPrompt.versions.map(v => (
                                        <option key={v.id} value={v.id}>v{v.version} - {v.status}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Test Dataset</label>
                            <div className="flex space-x-2">
                                <select
                                    value={selectedDatasetId}
                                    onChange={(e) => setSelectedDatasetId(e.target.value)}
                                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                >
                                    <option value="">Select a dataset...</option>
                                    {datasets.map(d => (
                                        <option key={d.id} value={d.id}>{d.name}</option>
                                    ))}
                                </select>
                                {selectedDatasetId && (
                                    <button
                                        onClick={() => setViewingDatasetId(selectedDatasetId)}
                                        className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm"
                                        title="View test cases"
                                    >
                                        <Eye size={16} />
                                    </button>
                                )}
                            </div>
                            {selectedDataset && (
                                <div className="mt-2">
                                    <p className="text-xs text-gray-500">{selectedDataset.description}</p>
                                    <p className="text-xs text-gray-400 mt-1">
                                        {selectedDataset.testCases.length} test case(s)
                                    </p>
                                </div>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Custom Evaluation Criteria (Optional)
                            </label>
                            <textarea
                                value={customCriteria}
                                onChange={(e) => setCustomCriteria(e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                rows={3}
                                placeholder="Override default criteria for all test cases. Leave empty to use criteria from each test case."
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                If provided, this will override individual test case criteria
                            </p>
                        </div>
                        <div className="pt-4 flex justify-end space-x-2">
                            <button
                                onClick={() => {
                                    setShowNewEvalModal(false);
                                    setCustomCriteria('');
                                }}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleRunNewEval}
                                disabled={isRunning || !selectedPromptId || !selectedVersionId || !selectedDatasetId}
                                className="px-4 py-2 bg-black text-white rounded-lg text-sm font-medium flex items-center disabled:opacity-50"
                            >
                                {isRunning ? 'Running...' : (
                                    <>
                                        <Play size={14} className="mr-2" />
                                        Run Evaluation
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* Evaluations List */}
        {evals.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                <p className="text-gray-500 mb-4">No evaluations yet</p>
                <button
                    onClick={() => setShowNewEvalModal(true)}
                    className="bg-black text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-800"
                >
                    Run Your First Evaluation
                </button>
            </div>
        ) : (
            <div className="space-y-4">
                {evals.map(evalRun => {
                    const prompt = prompts.find(p => p.versions.some(v => v.id === evalRun.promptVersionId));
                    const version = prompt?.versions.find(v => v.id === evalRun.promptVersionId);
                    const passedTests = evalRun.results?.filter(r => r.score >= 70).length || 0;
                    const failedTests = evalRun.results?.filter(r => r.score < 70).length || 0;
                    const isExpanded = expandedEvalId === evalRun.id;

                    return (
                        <div key={evalRun.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                            {/* Header */}
                            <div
                                className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                                onClick={() => setExpandedEvalId(isExpanded ? null : evalRun.id)}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center space-x-3 mb-2">
                                            <h3 className="text-lg font-semibold text-gray-900">{evalRun.name}</h3>
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center ${
                                                evalRun.status === 'passed' ? 'bg-green-50 text-green-700' :
                                                evalRun.status === 'failed' ? 'bg-red-50 text-red-700' :
                                                'bg-blue-50 text-blue-700'
                                            }`}>
                                                {evalRun.status === 'passed' && <CheckCircle size={12} className="mr-1" />}
                                                {evalRun.status === 'failed' && <XCircle size={12} className="mr-1" />}
                                                {evalRun.status === 'running' && <Play size={12} className="mr-1" />}
                                                {evalRun.status.toUpperCase()}
                                            </span>
                                        </div>
                                        <div className="text-sm text-gray-500 space-y-1">
                                            <div>Prompt: {prompt?.name || 'Unknown'} • Version: v{version?.version || '?'}</div>
                                            <div>Date: {new Date(evalRun.date).toLocaleString()} • {evalRun.sampleSize} test cases</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-4 ml-4">
                                        <div className="text-right">
                                            <div className="text-2xl font-bold text-gray-900">{evalRun.score}%</div>
                                            <div className="text-xs text-gray-500">Overall Score</div>
                                        </div>
                                        {isExpanded ? <ChevronDown size={20} className="text-gray-400" /> : <ChevronRight size={20} className="text-gray-400" />}
                                    </div>
                                </div>

                                {/* Summary Stats */}
                                <div className="mt-4 grid grid-cols-3 gap-4">
                                    <div className="bg-green-50 rounded-lg p-3">
                                        <div className="text-xs text-green-600 font-medium mb-1">Passed</div>
                                        <div className="text-lg font-bold text-green-700">{passedTests}</div>
                                    </div>
                                    <div className="bg-red-50 rounded-lg p-3">
                                        <div className="text-xs text-red-600 font-medium mb-1">Failed</div>
                                        <div className="text-lg font-bold text-red-700">{failedTests}</div>
                                    </div>
                                    <div className="bg-gray-50 rounded-lg p-3">
                                        <div className="text-xs text-gray-600 font-medium mb-1">Total</div>
                                        <div className="text-lg font-bold text-gray-700">{evalRun.sampleSize}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Expanded Test Cases */}
                            {isExpanded && evalRun.results && evalRun.results.length > 0 && (
                                <div className="border-t border-gray-200 bg-gray-50 p-6">
                                    <div className="text-sm font-semibold text-gray-700 mb-4">Test Cases</div>
                                    <div className="space-y-4">
                                        {evalRun.results.map((result, idx) => {
                                            const passed = result.score >= 70;
                                            return (
                                                <div
                                                    key={idx}
                                                    className={`bg-white rounded-lg p-4 border-2 ${
                                                        passed ? 'border-green-200' : 'border-red-200'
                                                    }`}
                                                >
                                                    <div className="flex items-start justify-between mb-3">
                                                        <div className="flex items-center space-x-2">
                                                            <span className="text-sm font-medium text-gray-600">Test Case {idx + 1}</span>
                                                            {passed ? (
                                                                <span className="flex items-center text-green-700 text-xs font-medium">
                                                                    <CheckCircle size={14} className="mr-1" />
                                                                    PASSED ({result.score}%)
                                                                </span>
                                                            ) : (
                                                                <span className="flex items-center text-red-700 text-xs font-medium">
                                                                    <XCircle size={14} className="mr-1" />
                                                                    FAILED ({result.score}%)
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                                                        <div>
                                                            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Input</div>
                                                            <div className="bg-gray-50 rounded p-3 text-xs font-mono text-gray-800 whitespace-pre-wrap">
                                                                {JSON.stringify(result.input, null, 2)}
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Output</div>
                                                            <div className="bg-gray-50 rounded p-3 text-xs font-mono text-gray-800 whitespace-pre-wrap max-h-32 overflow-y-auto">
                                                                {result.output.substring(0, 500)}
                                                                {result.output.length > 500 ? '...' : ''}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {result.gradeReason && (
                                                        <div className="mt-3 pt-3 border-t border-gray-200">
                                                            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">AI Judge Reasoning</div>
                                                            <div className={`text-sm ${
                                                                passed ? 'text-green-700' : 'text-red-700'
                                                            }`}>
                                                                {result.gradeReason}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        )}
    </div>
  );
};
