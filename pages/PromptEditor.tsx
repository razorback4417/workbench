import React, { useState, useEffect } from 'react';
import { ArrowLeft, Play, Save, GitBranch, History, Layers, Github, RefreshCw } from 'lucide-react';
import { Prompt, PromptVersion, ModelType } from '../types';
import { runPrompt } from '../services/geminiService';
import { storage } from '../services/storage';

interface PromptEditorProps {
  promptId: string;
  onBack: () => void;
}

export const PromptEditor: React.FC<PromptEditorProps> = ({ promptId, onBack }) => {
  const [prompt, setPrompt] = useState<Prompt | undefined>(undefined);
  const [activeVersionId, setActiveVersionId] = useState<string | undefined>(undefined);
  
  // Editor State
  const [currentTemplate, setCurrentTemplate] = useState('');
  const [variables, setVariables] = useState<string[]>([]);
  const [variableValues, setVariableValues] = useState<Record<string, string>>({});
  const [selectedModel, setSelectedModel] = useState<ModelType>(ModelType.GEMINI_FLASH);
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

  // GitHub State
  const [showRepoConfig, setShowRepoConfig] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

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
        
        // If GitHub synced, pretend to push
        if (updatedPrompt.github?.connected) {
            console.log("Syncing to GitHub...");
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
    
    // Call Gemini Service
    const result = await runPrompt(selectedModel, currentTemplate, variableValues);
    
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

  const handleSyncRepo = async () => {
    setIsSyncing(true);
    await new Promise(r => setTimeout(r, 1500)); // Mock delay
    setIsSyncing(false);
    setShowRepoConfig(false);
    alert("Successfully synced with GitHub repository!");
  };

  const currentVersion = prompt?.versions.find(v => v.id === activeVersionId);
  const compareVersion = prompt?.versions.find(v => v.id === compareVersionId);

  if (!prompt) return <div className="p-8">Loading prompt...</div>;

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-in fade-in duration-300 relative">
      
      {/* Repo Config Modal (Simplified) */}
      {showRepoConfig && (
        <div className="absolute inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                    <Github className="mr-2" size={20}/> Repository Settings
                </h3>
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Repository URL</label>
                        <input type="text" defaultValue={prompt.github?.repoUrl || "github.com/myorg/my-prompts"} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                    </div>
                    <div className="flex space-x-4">
                        <div className="flex-1">
                            <label className="block text-xs font-medium text-gray-700 mb-1">Branch</label>
                            <input type="text" defaultValue={prompt.github?.branch || "main"} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                        </div>
                        <div className="flex-1">
                             <label className="block text-xs font-medium text-gray-700 mb-1">File Path</label>
                            <input type="text" defaultValue={prompt.github?.filePath || `/prompts/${prompt.id}.md`} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                        </div>
                    </div>
                    <div className="pt-4 flex justify-end space-x-2">
                        <button onClick={() => setShowRepoConfig(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm">Cancel</button>
                        <button onClick={handleSyncRepo} disabled={isSyncing} className="px-4 py-2 bg-black text-white rounded-lg text-sm font-medium flex items-center">
                            {isSyncing ? 'Syncing...' : 'Link & Sync'}
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
                    <button onClick={() => setShowRepoConfig(true)} className="text-gray-400 hover:text-gray-900 transition-colors" title="Configure GitHub">
                        {prompt.github?.connected ? <div className="flex items-center text-green-600 text-xs bg-green-50 px-2 py-0.5 rounded-full"><Github size={12} className="mr-1"/> Linked</div> : <Github size={16}/>}
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
            <textarea
                className="flex-1 p-6 font-mono text-sm resize-none focus:outline-none bg-white text-gray-800 leading-relaxed"
                value={currentTemplate}
                onChange={(e) => setCurrentTemplate(e.target.value)}
                placeholder="Enter your prompt here using {{variables}}..."
                spellCheck={false}
                disabled={viewMode === 'diff'}
            />
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
                    <div className="flex-1 p-6 font-mono text-sm overflow-auto bg-gray-100 text-gray-600 whitespace-pre-wrap">
                        {compareVersion ? compareVersion.template : "Select a version to compare..."}
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
                                    <label className="text-xs font-medium text-gray-600 font-mono">{{{variable}}}</label>
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
