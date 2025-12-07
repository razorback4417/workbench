import React, { useEffect, useState, useMemo } from 'react';
import { storage } from '../services/storage';
import { EvalRun, Prompt } from '../types';
import { CheckCircle, XCircle, Play, Plus, ChevronDown, ChevronRight, AlertTriangle, Eye, Edit2, Trash2, Rocket, Lightbulb, Search, Filter, TrendingUp, TrendingDown } from 'lucide-react';
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
  const [showDeployModal, setShowDeployModal] = useState<string | null>(null);
  const [deployStatus, setDeployStatus] = useState<'draft' | 'staging' | 'production'>('staging');
  const [viewMode, setViewMode] = useState<'grouped' | 'list'>('grouped');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'passed' | 'failed'>('all');
  const [expandedPrompts, setExpandedPrompts] = useState<Set<string>>(new Set());

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

  // Group evaluations by prompt and version
  const groupedEvaluations = useMemo(() => {
    const grouped: Record<string, {
      prompt: Prompt;
      versions: Record<string, {
        version: Prompt['versions'][0];
        evals: EvalRun[];
        bestScore: number;
        latestEval?: EvalRun;
        isPassing: boolean;
      }>;
    }> = {};

    evals.forEach(evalRun => {
      const prompt = prompts.find(p => p.id === evalRun.promptId || p.versions.some(v => v.id === evalRun.promptVersionId));
      if (!prompt) return;

      const version = prompt.versions.find(v => v.id === evalRun.promptVersionId);
      if (!version) return;

      if (!grouped[prompt.id]) {
        grouped[prompt.id] = {
          prompt,
          versions: {}
        };
      }

      if (!grouped[prompt.id].versions[version.id]) {
        grouped[prompt.id].versions[version.id] = {
          version,
          evals: [],
          bestScore: 0,
          isPassing: false
        };
      }

      grouped[prompt.id].versions[version.id].evals.push(evalRun);

      // Update best score and latest eval
      const versionData = grouped[prompt.id].versions[version.id];
      if (evalRun.score > versionData.bestScore) {
        versionData.bestScore = evalRun.score;
      }
      if (!versionData.latestEval || new Date(evalRun.date) > new Date(versionData.latestEval.date)) {
        versionData.latestEval = evalRun;
      }
      versionData.isPassing = versionData.latestEval.status === 'passed';
    });

    // Sort evaluations within each version by date (newest first)
    Object.values(grouped).forEach(group => {
      Object.values(group.versions).forEach(versionData => {
        versionData.evals.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      });
    });

    return grouped;
  }, [evals, prompts]);

  // Filter and search
  const filteredGroupedEvaluations = useMemo(() => {
    let filtered = { ...groupedEvaluations };

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = Object.fromEntries(
        Object.entries(filtered).filter(([_, group]) =>
          group.prompt.name.toLowerCase().includes(searchLower) ||
          group.prompt.description.toLowerCase().includes(searchLower)
        )
      );
    }

    // Apply status filter
    if (filterStatus !== 'all') {
      Object.keys(filtered).forEach(promptId => {
        Object.keys(filtered[promptId].versions).forEach(versionId => {
          const versionData = filtered[promptId].versions[versionId];
          if (filterStatus === 'passed' && !versionData.isPassing) {
            delete filtered[promptId].versions[versionId];
          } else if (filterStatus === 'failed' && versionData.isPassing) {
            delete filtered[promptId].versions[versionId];
          }
        });
        // Remove prompt if no versions left
        if (Object.keys(filtered[promptId].versions).length === 0) {
          delete filtered[promptId];
        }
      });
    }

    return filtered;
  }, [groupedEvaluations, searchTerm, filterStatus]);

  const togglePromptExpanded = (promptId: string) => {
    setExpandedPrompts(prev => {
      const next = new Set(prev);
      if (next.has(promptId)) {
        next.delete(promptId);
      } else {
        next.add(promptId);
      }
      return next;
    });
  };

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

        {/* Summary Stats */}
        {evals.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <div className="text-xs text-gray-500 font-medium mb-1">Total Evaluations</div>
                    <div className="text-2xl font-bold text-gray-900">{evals.length}</div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <div className="text-xs text-gray-500 font-medium mb-1">Prompts Evaluated</div>
                    <div className="text-2xl font-bold text-gray-900">{Object.keys(groupedEvaluations).length}</div>
                </div>
                <div className="bg-white rounded-xl border border-green-200 p-4 bg-green-50/50">
                    <div className="text-xs text-green-600 font-medium mb-1">Passing Versions</div>
                    <div className="text-2xl font-bold text-green-700">
                        {Object.values(groupedEvaluations).reduce((sum, group) =>
                            sum + Object.values(group.versions).filter(v => v.isPassing).length, 0
                        )}
                    </div>
                </div>
                <div className="bg-white rounded-xl border border-red-200 p-4 bg-red-50/50">
                    <div className="text-xs text-red-600 font-medium mb-1">Failing Versions</div>
                    <div className="text-2xl font-bold text-red-700">
                        {Object.values(groupedEvaluations).reduce((sum, group) =>
                            sum + Object.values(group.versions).filter(v => !v.isPassing).length, 0
                        )}
                    </div>
                </div>
            </div>
        )}

        {/* Filters and View Toggle */}
        <div className="flex items-center justify-between bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center space-x-4 flex-1">
                <div className="relative flex-1 max-w-md">
                    <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search prompts..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>
                <div className="flex items-center space-x-2">
                    <Filter size={16} className="text-gray-400" />
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value as any)}
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="all">All Status</option>
                        <option value="passed">Passing Only</option>
                        <option value="failed">Failing Only</option>
                    </select>
                </div>
            </div>
            <div className="flex items-center space-x-2">
                <button
                    onClick={() => setViewMode('grouped')}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        viewMode === 'grouped'
                            ? 'bg-gray-900 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                    Grouped by Prompt
                </button>
                <button
                    onClick={() => setViewMode('list')}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        viewMode === 'list'
                            ? 'bg-gray-900 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                    All Evaluations
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

        {/* Deploy Modal */}
        {showDeployModal && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                        <Rocket size={20} className="mr-2 text-green-600" />
                        Deploy Prompt Version
                    </h3>
                    {(() => {
                        const evalRun = evals.find(e => e.id === showDeployModal);
                        const prompt = prompts.find(p => p.id === evalRun?.promptId);
                        const version = prompt?.versions.find(v => v.id === evalRun?.promptVersionId);

                        return (
                            <div className="space-y-4">
                                <div>
                                    <div className="text-sm text-gray-600 mb-2">
                                        <div className="font-semibold">Prompt:</div> {prompt?.name || 'Unknown'}
                                    </div>
                                    <div className="text-sm text-gray-600 mb-4">
                                        <div className="font-semibold">Version:</div> v{version?.version || '?'}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Deploy Status</label>
                                    <div className="space-y-2">
                                        <label className={`flex items-center p-3 border-2 rounded-lg cursor-pointer transition-all ${
                                            deployStatus === 'draft' ? 'border-gray-400 bg-gray-50' : 'border-gray-200 hover:border-gray-300'
                                        }`}>
                                            <input
                                                type="radio"
                                                name="deployStatus"
                                                value="draft"
                                                checked={deployStatus === 'draft'}
                                                onChange={(e) => setDeployStatus(e.target.value as any)}
                                                className="mr-3"
                                            />
                                            <div>
                                                <div className="font-semibold text-gray-900">Draft</div>
                                                <div className="text-xs text-gray-500">Keep as draft for further editing</div>
                                            </div>
                                        </label>
                                        <label className={`flex items-center p-3 border-2 rounded-lg cursor-pointer transition-all ${
                                            deployStatus === 'staging' ? 'border-yellow-400 bg-yellow-50' : 'border-gray-200 hover:border-gray-300'
                                        }`}>
                                            <input
                                                type="radio"
                                                name="deployStatus"
                                                value="staging"
                                                checked={deployStatus === 'staging'}
                                                onChange={(e) => setDeployStatus(e.target.value as any)}
                                                className="mr-3"
                                            />
                                            <div>
                                                <div className="font-semibold text-gray-900">Staging</div>
                                                <div className="text-xs text-gray-500">Deploy to staging environment for testing</div>
                                            </div>
                                        </label>
                                        <label className={`flex items-center p-3 border-2 rounded-lg cursor-pointer transition-all ${
                                            deployStatus === 'production' ? 'border-purple-400 bg-purple-50' : 'border-gray-200 hover:border-gray-300'
                                        }`}>
                                            <input
                                                type="radio"
                                                name="deployStatus"
                                                value="production"
                                                checked={deployStatus === 'production'}
                                                onChange={(e) => setDeployStatus(e.target.value as any)}
                                                className="mr-3"
                                            />
                                            <div>
                                                <div className="font-semibold text-gray-900">Production</div>
                                                <div className="text-xs text-gray-500">Deploy to production - live for all users</div>
                                            </div>
                                        </label>
                                    </div>
                                </div>
                                <div className="pt-4 flex justify-end space-x-2">
                                    <button
                                        onClick={() => setShowDeployModal(null)}
                                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={async () => {
                                            if (evalRun?.promptId && evalRun?.promptVersionId) {
                                                try {
                                                    await storage.updateVersionStatus(
                                                        evalRun.promptId,
                                                        evalRun.promptVersionId,
                                                        deployStatus
                                                    );
                                                    // Refresh prompts
                                                    const updatedPrompts = await storage.getPrompts();
                                                    setPrompts(updatedPrompts);
                                                    setShowDeployModal(null);
                                                    alert(`Version deployed to ${deployStatus.toUpperCase()} successfully!`);
                                                } catch (error: any) {
                                                    alert(`Failed to deploy: ${error.message}`);
                                                }
                                            }
                                        }}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium text-white ${
                                            deployStatus === 'production' ? 'bg-purple-600 hover:bg-purple-700' :
                                            deployStatus === 'staging' ? 'bg-yellow-600 hover:bg-yellow-700' :
                                            'bg-gray-600 hover:bg-gray-700'
                                        }`}
                                    >
                                        Deploy to {deployStatus.toUpperCase()}
                                    </button>
                                </div>
                            </div>
                        );
                    })()}
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
        ) : viewMode === 'grouped' ? (
            /* Grouped View by Prompt */
            <div className="space-y-4">
                {Object.keys(filteredGroupedEvaluations).length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                        <p className="text-gray-500">No evaluations match your filters</p>
                    </div>
                ) : (
                    Object.values(filteredGroupedEvaluations).map(({ prompt, versions }) => {
                        const isExpanded = expandedPrompts.has(prompt.id);
                        const versionEntries = Object.values(versions);
                        const hasPassingVersion = versionEntries.some(v => v.isPassing);
                        const hasFailingVersion = versionEntries.some(v => !v.isPassing);

                        return (
                            <div key={prompt.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                                {/* Prompt Header */}
                                <div
                                    className="p-6 cursor-pointer hover:bg-gray-50 transition-colors border-b border-gray-200"
                                    onClick={() => togglePromptExpanded(prompt.id)}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-3 mb-2">
                                                <h3 className="text-lg font-bold text-gray-900">{prompt.name}</h3>
                                                {hasPassingVersion && (
                                                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                                                        Has Passing Version
                                                    </span>
                                                )}
                                                {hasFailingVersion && (
                                                    <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded-full">
                                                        Has Failing Version
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-gray-600 mb-3">{prompt.description}</p>
                                            <div className="flex items-center space-x-4 text-xs text-gray-500">
                                                <span>{versionEntries.length} version{versionEntries.length !== 1 ? 's' : ''} evaluated</span>
                                                <span>•</span>
                                                <span>{versionEntries.reduce((sum, v) => sum + v.evals.length, 0)} total evaluation{versionEntries.reduce((sum, v) => sum + v.evals.length, 0) !== 1 ? 's' : ''}</span>
                                            </div>
                                        </div>
                                        <div className="ml-4">
                                            {isExpanded ? <ChevronDown size={20} className="text-gray-400" /> : <ChevronRight size={20} className="text-gray-400" />}
                                        </div>
                                    </div>
                                </div>

                                {/* Versions List */}
                                {isExpanded && (
                                    <div className="bg-gray-50 p-6 space-y-4">
                                        {versionEntries
                                            .sort((a, b) => b.version.version - a.version.version) // Sort by version number descending
                                            .map(({ version, evals: versionEvals, latestEval, isPassing, bestScore }) => {
                                                const isVersionExpanded = expandedEvalId === latestEval?.id;

                                                return (
                                                    <div key={version.id} className="bg-white rounded-lg border-2 border-gray-200 overflow-hidden">
                                                        {/* Version Header */}
                                                        <div className="p-4">
                                                            <div className="flex items-start justify-between">
                                                                <div className="flex-1">
                                                                    <div className="flex items-center space-x-3 mb-2">
                                                                        <h4 className="font-semibold text-gray-900">
                                                                            Version {version.version}
                                                                        </h4>
                                                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                                                            version.status === 'production' ? 'bg-purple-100 text-purple-800' :
                                                                            version.status === 'staging' ? 'bg-yellow-100 text-yellow-800' :
                                                                            'bg-gray-100 text-gray-800'
                                                                        }`}>
                                                                            {version.status.toUpperCase()}
                                                                        </span>
                                                                        {isPassing ? (
                                                                            <span className="flex items-center px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                                                                                <CheckCircle size={12} className="mr-1" />
                                                                                PASSING
                                                                            </span>
                                                                        ) : (
                                                                            <span className="flex items-center px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-semibold">
                                                                                <XCircle size={12} className="mr-1" />
                                                                                FAILING
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    {latestEval && (
                                                                        <div className="flex items-center space-x-4 text-sm text-gray-600 mt-2">
                                                                            <span>Latest: {new Date(latestEval.date).toLocaleDateString()}</span>
                                                                            <span>•</span>
                                                                            <span className="font-semibold">Score: {latestEval.score}%</span>
                                                                            {bestScore > latestEval.score && (
                                                                                <span className="text-green-600 flex items-center">
                                                                                    <TrendingUp size={12} className="mr-1" />
                                                                                    Best: {bestScore}%
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                    <div className="text-xs text-gray-500 mt-1">
                                                                        {versionEvals.length} evaluation{versionEvals.length !== 1 ? 's' : ''}
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center space-x-3 ml-4">
                                                                    {latestEval && (
                                                                        <div className="text-right">
                                                                            <div className={`text-2xl font-bold ${
                                                                                isPassing ? 'text-green-600' : 'text-red-600'
                                                                            }`}>
                                                                                {latestEval.score}%
                                                                            </div>
                                                                            <div className="text-xs text-gray-500">Latest Score</div>
                                                                        </div>
                                                                    )}
                                                                    {latestEval && isPassing && (
                                                                        <button
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                setShowDeployModal(latestEval.id);
                                                                                setDeployStatus(version.status === 'draft' ? 'staging' : version.status);
                                                                            }}
                                                                            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium flex items-center shadow-sm"
                                                                        >
                                                                            <Rocket size={14} className="mr-2" />
                                                                            Deploy
                                                                        </button>
                                                                    )}
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setExpandedEvalId(isVersionExpanded ? null : (latestEval?.id || null));
                                                                        }}
                                                                        className="p-2 hover:bg-gray-100 rounded-lg text-gray-500"
                                                                    >
                                                                        {isVersionExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Expanded Evaluation Details */}
                                                        {isVersionExpanded && latestEval && (
                                                            <div className="border-t border-gray-200 bg-gray-50 p-6">
                                                                <div className="mb-4">
                                                                    <div className="text-sm font-semibold text-gray-700 mb-2">Evaluation Details</div>
                                                                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                                                                        <div className="grid grid-cols-3 gap-4 mb-4">
                                                                            <div className="bg-green-50 rounded-lg p-3">
                                                                                <div className="text-xs text-green-600 font-medium mb-1">Passed</div>
                                                                                <div className="text-lg font-bold text-green-700">
                                                                                    {latestEval.results?.filter(r => r.score >= 70).length || 0}
                                                                                </div>
                                                                            </div>
                                                                            <div className="bg-red-50 rounded-lg p-3">
                                                                                <div className="text-xs text-red-600 font-medium mb-1">Failed</div>
                                                                                <div className="text-lg font-bold text-red-700">
                                                                                    {latestEval.results?.filter(r => r.score < 70).length || 0}
                                                                                </div>
                                                                            </div>
                                                                            <div className="bg-gray-50 rounded-lg p-3">
                                                                                <div className="text-xs text-gray-600 font-medium mb-1">Total</div>
                                                                                <div className="text-lg font-bold text-gray-700">{latestEval.sampleSize}</div>
                                                                            </div>
                                                                        </div>
                                                                        <div className="text-xs text-gray-500">
                                                                            Date: {new Date(latestEval.date).toLocaleString()}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                {latestEval.results && latestEval.results.length > 0 && (
                                                                    <div>
                                                                        <div className="text-sm font-semibold text-gray-700 mb-3">Test Cases</div>
                                                                        <div className="space-y-3">
                                                                            {latestEval.results.map((result, idx) => {
                                                                                const passed = result.score >= 70;
                                                                                return (
                                                                                    <div
                                                                                        key={idx}
                                                                                        className={`bg-white rounded-lg p-3 border-2 ${
                                                                                            passed ? 'border-green-200' : 'border-red-200'
                                                                                        }`}
                                                                                    >
                                                                                        <div className="flex items-center justify-between mb-2">
                                                                                            <span className="text-sm font-medium text-gray-700">Test Case {idx + 1}</span>
                                                                                            <span className={`text-xs font-semibold ${
                                                                                                passed ? 'text-green-700' : 'text-red-700'
                                                                                            }`}>
                                                                                                {result.score}% {passed ? 'PASSED' : 'FAILED'}
                                                                                            </span>
                                                                                        </div>
                                                                                        {result.gradeReason && (
                                                                                            <div className="text-xs text-gray-600 mt-2">
                                                                                                {result.gradeReason.substring(0, 200)}
                                                                                                {result.gradeReason.length > 200 ? '...' : ''}
                                                                                            </div>
                                                                                        )}
                                                                                    </div>
                                                                                );
                                                                            })}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        ) : (
            /* Original List View */
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
                                            <span className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center ${
                                                evalRun.status === 'passed' ? 'bg-green-100 text-green-800 border border-green-300' :
                                                evalRun.status === 'failed' ? 'bg-red-100 text-red-800 border border-red-300' :
                                                'bg-blue-100 text-blue-800 border border-blue-300'
                                            }`}>
                                                {evalRun.status === 'passed' && <CheckCircle size={14} className="mr-1.5" />}
                                                {evalRun.status === 'failed' && <XCircle size={14} className="mr-1.5" />}
                                                {evalRun.status === 'running' && <Play size={14} className="mr-1.5" />}
                                                {evalRun.status.toUpperCase()}
                                            </span>
                                            {version && (
                                                <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${
                                                    version.status === 'production' ? 'bg-purple-100 text-purple-800 border border-purple-300' :
                                                    version.status === 'staging' ? 'bg-yellow-100 text-yellow-800 border border-yellow-300' :
                                                    version.status === 'draft' ? 'bg-gray-100 text-gray-800 border border-gray-300' :
                                                    'bg-gray-100 text-gray-600 border border-gray-300'
                                                }`}>
                                                    {version.status.toUpperCase()}
                                                </span>
                                            )}
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
                                        {evalRun.status === 'passed' && evalRun.promptId && version && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setShowDeployModal(evalRun.id);
                                                    setDeployStatus(version.status === 'draft' ? 'staging' : version.status);
                                                }}
                                                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium flex items-center shadow-sm"
                                                title="Deploy this version"
                                            >
                                                <Rocket size={14} className="mr-2" />
                                                Deploy
                                            </button>
                                        )}
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
                                                    {result.suggestions && result.suggestions.length > 0 && (
                                                        <div className="mt-3 pt-3 border-t border-gray-200">
                                                            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center">
                                                                <Lightbulb size={12} className="mr-1" />
                                                                Improvement Suggestions
                                                            </div>
                                                            <ul className="text-sm text-gray-700 space-y-1">
                                                                {result.suggestions.map((suggestion, i) => (
                                                                    <li key={i} className="flex items-start">
                                                                        <span className="text-blue-500 mr-2">•</span>
                                                                        <span>{suggestion}</span>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Overall Improvement Suggestions */}
                                    {evalRun.improvementSuggestions && evalRun.improvementSuggestions.length > 0 && (
                                        <div className="mt-6 pt-6 border-t-2 border-yellow-300 bg-yellow-50/50 rounded-lg p-4">
                                            <div className="flex items-center space-x-2 mb-4">
                                                <Lightbulb size={18} className="text-yellow-600" />
                                                <div className="text-base font-bold text-gray-900">How to Improve This Prompt</div>
                                            </div>
                                            <div className="bg-white border-2 border-yellow-200 rounded-lg p-4">
                                                <div className="text-xs font-semibold text-yellow-700 uppercase tracking-wider mb-3">
                                                  AI-Generated Improvement Suggestions
                                                </div>
                                                <ul className="space-y-3">
                                                    {evalRun.improvementSuggestions.map((suggestion, i) => (
                                                        <li key={i} className="text-sm text-gray-800 flex items-start">
                                                            <span className="text-yellow-600 mr-3 font-bold text-base">{i + 1}.</span>
                                                            <span className="flex-1">{suggestion}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                            <div className="mt-3 text-xs text-gray-600 italic">
                                                These suggestions are based on the failed test cases. Implement these changes and re-run the evaluation to see improvements.
                                            </div>
                                        </div>
                                    )}

                                    {/* Improvement Tracking */}
                                    {evalRun.results && evalRun.results.length > 0 && (
                                        <div className="mt-6 pt-6 border-t-2 border-gray-300">
                                            <div className="text-sm font-bold text-gray-900 mb-3">Improvement Analysis</div>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                                    <div className="text-xs text-blue-600 font-medium mb-1">Mistakes Identified</div>
                                                    <div className="text-lg font-bold text-blue-700">
                                                        {evalRun.results.filter(r => r.score < 70).length}
                                                    </div>
                                                    <div className="text-xs text-blue-600 mt-1">
                                                        {evalRun.results.filter(r => r.score < 70).length > 0
                                                            ? 'Test cases that need improvement'
                                                            : 'All tests passed!'}
                                                    </div>
                                                </div>
                                                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                                    <div className="text-xs text-green-600 font-medium mb-1">Improvements Made</div>
                                                    <div className="text-lg font-bold text-green-700">
                                                        {evalRun.improvementSuggestions?.length || 0}
                                                    </div>
                                                    <div className="text-xs text-green-600 mt-1">
                                                        Actionable suggestions provided
                                                    </div>
                                                </div>
                                                <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                                                    <div className="text-xs text-purple-600 font-medium mb-1">Quality Score</div>
                                                    <div className="text-lg font-bold text-purple-700">
                                                        {evalRun.score}%
                                                    </div>
                                                    <div className="text-xs text-purple-600 mt-1">
                                                        {evalRun.score >= 70 ? 'Passing threshold' : 'Below threshold'}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Deploy Section */}
                                    {evalRun.status === 'passed' && evalRun.promptId && version && (
                                        <div className="mt-6 pt-6 border-t-2 border-gray-300">
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center space-x-2">
                                                    <Rocket size={16} className="text-green-600" />
                                                    <div className="text-sm font-bold text-gray-900">Deploy This Version</div>
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        setShowDeployModal(evalRun.id);
                                                        setDeployStatus(version.status === 'draft' ? 'staging' : version.status);
                                                    }}
                                                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium flex items-center shadow-sm"
                                                >
                                                    <Rocket size={14} className="mr-2" />
                                                    Deploy
                                                </button>
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                Current status: <span className="font-semibold">{version.status.toUpperCase()}</span>
                                            </div>
                                        </div>
                                    )}
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
