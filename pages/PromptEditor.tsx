import React, { useState, useEffect } from 'react';
import { ArrowLeft, Play, Save, GitBranch, History, Layers, Upload, Download, RefreshCw } from 'lucide-react';
import { Prompt, PromptVersion, ModelType } from '../types';
import { runPrompt } from '../services/llmService';
import { storage } from '../services/storage';
import { runRegressionTest } from '../services/evalService';

interface PromptEditorProps {
  promptId: string;
  onBack: () => void;
  onPromptUpdated?: () => void;
}

export const PromptEditor: React.FC<PromptEditorProps> = ({ promptId, onBack, onPromptUpdated }) => {
  const [prompt, setPrompt] = useState<Prompt | undefined>(undefined);
  const [activeVersionId, setActiveVersionId] = useState<string | undefined>(undefined);

  // Editor State
  const [currentTemplate, setCurrentTemplate] = useState('');
  const [variables, setVariables] = useState<string[]>([]);
  const [variableValues, setVariableValues] = useState<Record<string, string>>({});
  const [selectedModel, setSelectedModel] = useState<ModelType>(ModelType.GEMINI_2_5_FLASH);
  const [temp, setTemp] = useState(0.7);

  // Execution State
  const [output, setOutput] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [lastRunStats, setLastRunStats] = useState<{latency: number, cost: number, tokens: number} | null>(null);
  const [runError, setRunError] = useState<string | null>(null);

  // Mode: Edit vs Diff
  const [viewMode, setViewMode] = useState<'edit' | 'diff'>('edit');
  const [compareVersionId, setCompareVersionId] = useState<string>('');

  // Saving State
  const [isSaving, setIsSaving] = useState(false);

  // File Upload/Download State
  const [showFileModal, setShowFileModal] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      const p = await storage.getPromptById(promptId);
      if (p) {
        setPrompt(p);
        setActiveVersionId(p.activeVersionId);
      }
    };
    loadData();
  }, [promptId]);

  useEffect(() => {
    if (prompt && activeVersionId) {
      const version = prompt.versions.find(v => v.id === activeVersionId);
      if (version) {
        setCurrentTemplate(version.template);
        setVariables(version.variables);
        setSelectedModel(version.model);
        setTemp(version.temperature);

        // Initialize mock variable values for testing
        const initialValues: Record<string, string> = {};
        version.variables.forEach(v => {
            if (!variableValues[v]) initialValues[v] = `[Test ${v}]`;
        });
        setVariableValues(prev => ({ ...initialValues, ...prev }));
      }
    }
  }, [prompt, activeVersionId]);

  // Parse variables from template
  useEffect(() => {
    const regex = /{{([^}]+)}}/g;
    const found = [];
    let match;
    while ((match = regex.exec(currentTemplate)) !== null) {
      found.push(match[1].trim());
    }
    const unique = Array.from(new Set(found));
    setVariables(unique);
  }, [currentTemplate]);

  const handleSave = async () => {
    if (!prompt) return;
    setIsSaving(true);

    try {
      const newVersion = await storage.createPromptVersion(prompt.id, {
        template: currentTemplate,
        variables: variables,
        model: selectedModel,
        temperature: temp,
        commitMessage: `Update via Editor ${new Date().toLocaleTimeString()}`
      });

      // Refresh prompt data
      const updatedPrompt = await storage.getPromptById(prompt.id);
      if (updatedPrompt) {
        setPrompt(updatedPrompt);
        setActiveVersionId(newVersion.id);

        // Notify parent to refresh registry
        if (onPromptUpdated) {
          onPromptUpdated();
        }

        // Run regression test automatically
        try {
          await runRegressionTest(prompt.id, newVersion.id);
        } catch (error) {
          console.error('Regression test failed:', error);
        }
      }
    } catch (e) {
      console.error("Failed to save", e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRun = async () => {
    if (!prompt || !activeVersionId) return;
    setIsRunning(true);
    setOutput(null);
    setRunError(null);
    setLastRunStats(null);

    // Call LLM Service
    const result = await runPrompt(selectedModel, currentTemplate, variableValues, temp);

    setOutput(result.text);

    if (result.status === 'error') {
        setRunError("Execution failed. Check console for details.");
    }

    setLastRunStats({
        latency: result.latency,
        cost: result.cost,
        tokens: result.tokens
    });

    // Log the run
    await storage.addLog({
        id: `log-${Date.now()}`,
        promptId: prompt.id,
        versionId: activeVersionId,
        timestamp: new Date().toISOString(),
        inputs: variableValues,
        output: result.text,
        latency: result.latency,
        cost: result.cost,
        tokens: result.tokens,
        status: result.status,
        model: selectedModel
    });

    setIsRunning(false);
  };

  const handleExportPrompt = () => {
    if (!prompt || !currentVersion) return;

    const promptData = {
      name: prompt.name,
      description: prompt.description,
      tags: prompt.tags,
      version: currentVersion.version,
      template: currentVersion.template,
      variables: currentVersion.variables,
      model: currentVersion.model,
      temperature: currentVersion.temperature,
      status: currentVersion.status,
      createdAt: currentVersion.createdAt,
      commitMessage: currentVersion.commitMessage
    };

    const blob = new Blob([JSON.stringify(promptData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${prompt.name.replace(/\s+/g, '-').toLowerCase()}-v${currentVersion.version}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportPrompt = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const promptData = JSON.parse(text);

      // Update current template and variables
      if (promptData.template) {
        setCurrentTemplate(promptData.template);
      }
      if (promptData.variables) {
        setVariables(promptData.variables);
      }
      if (promptData.model) {
        setSelectedModel(promptData.model as ModelType);
      }
      if (promptData.temperature !== undefined) {
        setTemp(promptData.temperature);
      }

      setShowFileModal(false);
      alert('Prompt imported successfully! Click "Save New Version" to save it.');
    } catch (error) {
      console.error('Failed to import prompt:', error);
      alert('Failed to import prompt. Please check the file format.');
    }

    // Reset file input
    event.target.value = '';
  };

  // Diff algorithm - line-based diff with proper alignment
  const computeDiff = (oldText: string, newText: string) => {
    const oldLines = oldText.split('\n');
    const newLines = newText.split('\n');

    // Create arrays to hold aligned lines
    const oldDiff: Array<{ type: 'removed' | 'unchanged'; text: string; lineNumber: number }> = [];
    const newDiff: Array<{ type: 'added' | 'unchanged'; text: string; lineNumber: number }> = [];

    let oldIndex = 0;
    let newIndex = 0;
    let lineNum = 1;

    while (oldIndex < oldLines.length || newIndex < newLines.length) {
      if (oldIndex >= oldLines.length) {
        // Only new lines remain - these are additions
        newDiff.push({ type: 'added', text: newLines[newIndex], lineNumber: lineNum });
        oldDiff.push({ type: 'unchanged', text: '', lineNumber: lineNum }); // Empty line on left
        newIndex++;
        lineNum++;
      } else if (newIndex >= newLines.length) {
        // Only old lines remain - these are deletions
        oldDiff.push({ type: 'removed', text: oldLines[oldIndex], lineNumber: lineNum });
        newDiff.push({ type: 'unchanged', text: '', lineNumber: lineNum }); // Empty line on right
        oldIndex++;
        lineNum++;
      } else if (oldLines[oldIndex] === newLines[newIndex]) {
        // Lines match - unchanged
        oldDiff.push({ type: 'unchanged', text: oldLines[oldIndex], lineNumber: lineNum });
        newDiff.push({ type: 'unchanged', text: newLines[newIndex], lineNumber: lineNum });
        oldIndex++;
        newIndex++;
        lineNum++;
      } else {
        // Lines differ - try to find matching lines ahead
        let foundMatch = false;

        // Look ahead in old lines for a match with current new line
        for (let i = oldIndex + 1; i < Math.min(oldIndex + 10, oldLines.length); i++) {
          if (oldLines[i] === newLines[newIndex]) {
            // Found match - lines between are deletions
            for (let j = oldIndex; j < i; j++) {
              oldDiff.push({ type: 'removed', text: oldLines[j], lineNumber: lineNum });
              newDiff.push({ type: 'unchanged', text: '', lineNumber: lineNum });
              lineNum++;
            }
            oldIndex = i;
            foundMatch = true;
            break;
          }
        }

        // Look ahead in new lines for a match with current old line
        if (!foundMatch) {
          for (let i = newIndex + 1; i < Math.min(newIndex + 10, newLines.length); i++) {
            if (newLines[i] === oldLines[oldIndex]) {
              // Found match - lines between are additions
              for (let j = newIndex; j < i; j++) {
                oldDiff.push({ type: 'unchanged', text: '', lineNumber: lineNum });
                newDiff.push({ type: 'added', text: newLines[j], lineNumber: lineNum });
                lineNum++;
              }
              newIndex = i;
              foundMatch = true;
              break;
            }
          }
        }

        if (!foundMatch) {
          // No match found - both lines changed
          oldDiff.push({ type: 'removed', text: oldLines[oldIndex], lineNumber: lineNum });
          newDiff.push({ type: 'added', text: newLines[newIndex], lineNumber: lineNum });
          oldIndex++;
          newIndex++;
          lineNum++;
        }
      }
    }

    return { oldDiff, newDiff };
  };

  const currentVersion = prompt?.versions.find(v => v.id === activeVersionId);
  const compareVersion = prompt?.versions.find(v => v.id === compareVersionId);

  // Compute diff when in diff mode
  const diffResult = viewMode === 'diff' && currentVersion && compareVersion
    ? computeDiff(compareVersion.template, currentVersion.template)
    : { oldDiff: [], newDiff: [] };

  // Render template with variable preview
  const renderPreview = (template: string, vars: Record<string, string>) => {
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    const regex = /{{([^}]+)}}/g;
    let match;

    while ((match = regex.exec(template)) !== null) {
      // Add text before the match
      if (match.index > lastIndex) {
        parts.push(template.substring(lastIndex, match.index));
      }

      const key = match[1].trim();
      const value = vars[key] || '';

      if (value) {
        parts.push(
          <span key={match.index} className="bg-blue-100 text-blue-800 px-1 rounded font-mono">
            {value}
          </span>
        );
      } else {
        parts.push(
          <span key={match.index} className="bg-gray-200 text-gray-500 px-1 rounded font-mono">
            {match[0]}
          </span>
        );
      }

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < template.length) {
      parts.push(template.substring(lastIndex));
    }

    return parts.length > 0 ? parts : [template];
  };

  if (!prompt) return <div className="p-8">Loading prompt...</div>;

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-in fade-in duration-300 relative">

      {/* File Import/Export Modal */}
      {showFileModal && (
        <div className="absolute inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                    <Upload className="mr-2" size={20}/> Import/Export Prompt
                </h3>
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-2">Export Current Version</label>
                        <button
                            onClick={handleExportPrompt}
                            className="w-full px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium flex items-center justify-center hover:bg-gray-800"
                        >
                            <Download size={16} className="mr-2" />
                            Download as JSON
                        </button>
                        <p className="text-xs text-gray-500 mt-2">Export the current prompt version to a JSON file</p>
                    </div>
                    <div className="border-t border-gray-200 pt-4">
                        <label className="block text-xs font-medium text-gray-700 mb-2">Import Prompt</label>
                        <label className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm font-medium flex items-center justify-center hover:bg-gray-100 cursor-pointer">
                            <Upload size={16} className="mr-2" />
                            Choose File to Import
                            <input
                                type="file"
                                accept=".json"
                                onChange={handleImportPrompt}
                                className="hidden"
                            />
                        </label>
                        <p className="text-xs text-gray-500 mt-2">Import a prompt from a JSON file</p>
                    </div>
                    <div className="pt-4 flex justify-end">
                        <button
                            onClick={() => setShowFileModal(false)}
                            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="h-16 border-b border-gray-200 flex items-center justify-between px-6 bg-white flex-shrink-0">
        <div className="flex items-center space-x-4">
            <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500">
                <ArrowLeft size={20} />
            </button>
            <div>
                <div className="flex items-center space-x-2">
                    <h2 className="font-bold text-gray-900">{prompt.name}</h2>
                    <button
                        onClick={() => setShowFileModal(true)}
                        className="text-gray-400 hover:text-gray-900 transition-colors flex items-center space-x-1"
                        title="Import/Export Prompt"
                    >
                        <Upload size={16}/>
                    </button>
                </div>
                <div className="flex items-center space-x-2 text-xs text-gray-500">
                    <GitBranch size={12} />
                    <select
                        className="bg-transparent border-none p-0 focus:ring-0 font-medium text-gray-700 cursor-pointer"
                        value={activeVersionId}
                        onChange={(e) => setActiveVersionId(e.target.value)}
                    >
                        {prompt.versions.map(v => (
                            <option key={v.id} value={v.id}>v{v.version} ({v.status})</option>
                        ))}
                    </select>
                    {currentVersion && (
                        <select
                            className="ml-2 text-xs border border-gray-300 rounded px-2 py-1 bg-white"
                            value={currentVersion.status}
                            onChange={async (e) => {
                                const newStatus = e.target.value as 'draft' | 'staging' | 'production' | 'archived';
                                try {
                                    await storage.updateVersionStatus(prompt.id, currentVersion.id, newStatus);
                                    const updated = await storage.getPromptById(prompt.id);
                                    if (updated) {
                                        setPrompt(updated);
                                        if (onPromptUpdated) onPromptUpdated();
                                    }
                                } catch (error) {
                                    console.error('Failed to update status:', error);
                                    alert('Failed to update version status');
                                }
                            }}
                            title="Change version status"
                        >
                            <option value="draft">Draft</option>
                            <option value="staging">Staging</option>
                            <option value="production">Production</option>
                            <option value="archived">Archived</option>
                        </select>
                    )}
                    <span>•</span>
                    <span>Last edited by {currentVersion?.createdBy}</span>
                </div>
            </div>
        </div>

        <div className="flex items-center space-x-3">
             <div className="flex bg-gray-100 rounded-lg p-1">
                 <button
                    onClick={() => setViewMode('edit')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${viewMode === 'edit' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
                 >
                    Editor
                 </button>
                 <button
                    onClick={() => {
                        setViewMode('diff');
                        // Default to comparing with previous version if available
                        if (!compareVersionId && prompt.versions.length > 1) {
                            const idx = prompt.versions.findIndex(v => v.id === activeVersionId);
                            if (idx < prompt.versions.length - 1) {
                                setCompareVersionId(prompt.versions[idx + 1].id);
                            }
                        }
                    }}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${viewMode === 'diff' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
                 >
                    Diff
                 </button>
             </div>
             <div className="h-6 w-px bg-gray-200 mx-2"></div>
             <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-70"
            >
                {isSaving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
                <span>{isSaving ? 'Saving...' : 'Save New Version'}</span>
             </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">

        {/* Left Pane: Editor or Diff Left */}
        <div className={`flex-1 flex flex-col border-r border-gray-200 ${viewMode === 'diff' ? 'w-1/2' : 'w-1/2'}`}>
            <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {viewMode === 'diff' ? `Current (v${currentVersion?.version})` : 'Prompt Template'}
                </span>
                {viewMode === 'edit' && (
                    <div className="flex items-center space-x-2">
                        <select
                            className="text-xs border border-gray-300 rounded px-2 py-1 bg-white"
                            value={selectedModel}
                            onChange={(e) => setSelectedModel(e.target.value as ModelType)}
                        >
                            {Object.values(ModelType).map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                        <div className="flex items-center space-x-1 border border-gray-300 rounded px-2 py-1 bg-white">
                            <span className="text-xs text-gray-500">Temp:</span>
                            <input
                                type="number"
                                min="0" max="1" step="0.1"
                                className="w-12 text-xs focus:outline-none"
                                value={temp}
                                onChange={(e) => setTemp(parseFloat(e.target.value))}
                            />
                        </div>
                    </div>
                )}
            </div>
            {viewMode === 'edit' ? (
                <div className="flex-1 flex flex-col">
            <textarea
                className="flex-1 p-6 font-mono text-sm resize-none focus:outline-none bg-white text-gray-800 leading-relaxed"
                value={currentTemplate}
                onChange={(e) => setCurrentTemplate(e.target.value)}
                placeholder="Enter your prompt here using {{variables}}..."
                spellCheck={false}
                style={{
                    tabSize: 2,
                    WebkitFontSmoothing: 'antialiased',
                }}
            />
                    {variables.length > 0 && (
                        <div className="border-t border-gray-200 bg-gray-50 p-4">
                            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Preview (with current variable values)</div>
                            <div className="font-mono text-sm text-gray-800 whitespace-pre-wrap">
                                {renderPreview(currentTemplate, variableValues)}
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="flex-1 p-6 font-mono text-sm overflow-auto bg-white whitespace-pre-wrap">
                    {diffResult.newDiff.length > 0 ? (
                        <div className="space-y-0">
                            {diffResult.newDiff.map((segment, idx) => (
                                <div
                                    key={idx}
                                    className={`px-2 py-0.5 ${
                                        segment.type === 'added'
                                            ? 'bg-green-50 text-green-800 border-l-2 border-green-400'
                                            : 'text-gray-800'
                                    }`}
                                >
                                    <span className="text-gray-400 text-xs mr-2 select-none">
                                        {segment.lineNumber}
                                    </span>
                                    {segment.text || '\u00A0'}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-gray-800">{currentVersion?.template}</div>
                    )}
                </div>
            )}
        </div>

        {/* Right Pane: Test Runner or Diff Right */}
        <div className="flex-1 flex flex-col w-1/2 bg-gray-50/50">
            {viewMode === 'diff' ? (
                <>
                    <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                         <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Comparing With</span>
                         <select
                            className="text-xs border border-gray-300 rounded px-2 py-1 bg-white"
                            value={compareVersionId}
                            onChange={(e) => setCompareVersionId(e.target.value)}
                        >
                            <option value="">Select version...</option>
                            {prompt.versions.filter(v => v.id !== activeVersionId).map(v => (
                                <option key={v.id} value={v.id}>v{v.version} - {new Date(v.createdAt).toLocaleDateString()}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex-1 p-6 font-mono text-sm overflow-auto bg-gray-50 whitespace-pre-wrap">
                        {compareVersion && diffResult.oldDiff.length > 0 ? (
                            <div className="space-y-0">
                                {diffResult.oldDiff.map((segment, idx) => (
                                    <div
                                        key={idx}
                                        className={`px-2 py-0.5 ${
                                            segment.type === 'removed'
                                                ? 'bg-red-50 text-red-800 border-l-2 border-red-400'
                                                : 'text-gray-600'
                                        }`}
                                    >
                                        <span className="text-gray-400 text-xs mr-2 select-none">
                                            {segment.lineNumber}
                                        </span>
                                        {segment.text || '\u00A0'}
                                    </div>
                                ))}
                            </div>
                        ) : compareVersion ? (
                            <div className="text-gray-600">{compareVersion.template}</div>
                        ) : (
                            <div className="text-gray-400 italic">Select a version to compare...</div>
                        )}
                    </div>
                </>
            ) : (
                <>
                    {/* Test Runner Mode */}
                    <div className="p-4 border-b border-gray-200 bg-white shadow-sm z-10">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Test Variables</span>
                            <button
                                onClick={handleRun}
                                disabled={isRunning}
                                className={`flex items-center space-x-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide transition-all ${
                                    isRunning
                                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                    : 'bg-green-500 text-white hover:bg-green-600 shadow-md shadow-green-200'
                                }`}
                            >
                                {isRunning ? (
                                    <span>Running...</span>
                                ) : (
                                    <>
                                        <Play size={12} fill="currentColor" />
                                        <span>Run</span>
                                    </>
                                )}
                            </button>
                        </div>
                        <div className="grid grid-cols-1 gap-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                            {variables.length === 0 && <p className="text-xs text-gray-400 italic">No variables detected in template.</p>}
                            {variables.map(variable => (
                                <div key={variable} className="flex flex-col space-y-1">
                                    <label className="text-xs font-medium text-gray-600 font-mono">{`{{${variable}}}`}</label>
                                    <input
                                        type="text"
                                        className="border border-gray-200 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
                                        value={variableValues[variable] || ''}
                                        onChange={(e) => setVariableValues({...variableValues, [variable]: e.target.value})}
                                        placeholder={`Value for ${variable}`}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex-1 flex flex-col p-6 overflow-hidden">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Output</span>
                            {lastRunStats && (
                                <div className="flex items-center space-x-3 text-xs text-gray-500">
                                    <span className="flex items-center"><Layers size={12} className="mr-1"/> {lastRunStats.tokens} tok</span>
                                    <span className="flex items-center"><History size={12} className="mr-1"/> {lastRunStats.latency}ms</span>
                                    <span className="flex items-center text-green-600 font-medium">${lastRunStats.cost.toFixed(5)}</span>
                                </div>
                            )}
                        </div>
                        <div className="flex-1 bg-white border border-gray-200 rounded-lg p-4 font-mono text-sm text-gray-800 overflow-y-auto whitespace-pre-wrap leading-relaxed shadow-inner">
                            {output && <span>{output}</span>}
                            {!output && !isRunning && !runError && <span className="text-gray-300 italic">Run the prompt to see output...</span>}
                            {runError && <span className="text-red-500">{runError}</span>}
                        </div>
                    </div>
                </>
            )}
        </div>
      </div>
    </div>
  );
};
