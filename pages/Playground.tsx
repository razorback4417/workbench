import React, { useState, useEffect } from 'react';
import { Play, Layers, History, Zap, Settings, Eye } from 'lucide-react';
import { runPrompt } from '../services/geminiService';
import { ModelType } from '../types';
import { storage } from '../services/storage';

export const Playground: React.FC = () => {
  const [template, setTemplate] = useState('');
  const [variables, setVariables] = useState<string[]>([]);
  const [variableValues, setVariableValues] = useState<Record<string, string>>({});
  const [model, setModel] = useState<ModelType>(ModelType.GEMINI_FLASH);
  const [temperature, setTemperature] = useState(0.7);
  const [showPreview, setShowPreview] = useState(false);
  
  const [output, setOutput] = useState<string | null>(null);
  const [stats, setStats] = useState<{latency: number, cost: number, tokens: number} | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  // Extract variables
  useEffect(() => {
    const regex = /{{([^}]+)}}/g;
    const found = new Set<string>();
    let match;
    while ((match = regex.exec(template)) !== null) {
      found.add(match[1].trim());
    }
    const newVars = Array.from(found);
    setVariables(newVars);
  }, [template]);

  const handleRun = async () => {
    setIsRunning(true);
    const result = await runPrompt(model, template, variableValues);
    setOutput(result.text);
    setStats({ latency: result.latency, cost: result.cost, tokens: result.tokens });
    
    // Log the run
    await storage.addLog({
        id: `run-${Date.now()}`,
        promptId: 'playground',
        versionId: 'draft',
        timestamp: new Date().toISOString(),
        inputs: variableValues,
        output: result.text,
        latency: result.latency,
        cost: result.cost,
        tokens: result.tokens,
        status: result.status,
        model: model
    });

    setIsRunning(false);
  };

  const renderedPrompt = template.replace(/{{([^}]+)}}/g, (_, key) => variableValues[key] || `{{${key}}}`);

  return (
    <div className="h-full flex flex-col space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Playground</h1>
          <p className="text-gray-500 text-sm mt-1">Experiment with prompts and models in a sandbox environment</p>
        </div>
        <div className="flex space-x-3">
            <div className="flex items-center space-x-2 bg-white border border-gray-200 rounded-lg px-3 py-2">
                <Settings size={14} className="text-gray-400"/>
                <select 
                    value={model} 
                    onChange={e => setModel(e.target.value as ModelType)}
                    className="text-sm bg-transparent border-none focus:ring-0 text-gray-700 font-medium cursor-pointer outline-none"
                >
                    {Object.values(ModelType).map(m => (
                        <option key={m} value={m}>{m}</option>
                    ))}
                </select>
            </div>
        </div>
      </div>

      <div className="flex-1 flex space-x-6 min-h-0">
        {/* Left Column: Editor */}
        <div className="flex-1 flex flex-col bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-3 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                <div className="flex items-center space-x-2">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Prompt Template</span>
                    <button 
                        onClick={() => setShowPreview(!showPreview)}
                        className={`p-1 rounded hover:bg-gray-200 transition-colors ${showPreview ? 'text-blue-600 bg-blue-50' : 'text-gray-400'}`}
                        title="Toggle Preview"
                    >
                        <Eye size={14} />
                    </button>
                </div>
                <div className="flex items-center space-x-2">
                     <span className="text-xs text-gray-400">Temp: {temperature}</span>
                     <input 
                        type="range" min="0" max="1" step="0.1" 
                        value={temperature} 
                        onChange={e => setTemperature(parseFloat(e.target.value))}
                        className="w-20 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                     />
                </div>
            </div>
            {showPreview ? (
                <div className="flex-1 p-6 font-mono text-sm bg-gray-50 text-gray-800 whitespace-pre-wrap overflow-auto">
                    {renderedPrompt}
                </div>
            ) : (
                <textarea
                    value={template}
                    onChange={e => setTemplate(e.target.value)}
                    placeholder="Write your prompt here using {{variable}} syntax..."
                    className="flex-1 p-6 font-mono text-sm resize-none focus:outline-none bg-white text-gray-800 leading-relaxed"
                    spellCheck={false}
                />
            )}
        </div>

        {/* Right Column: Variables & Output */}
        <div className="w-96 flex flex-col space-y-6">
            
            {/* Variables Panel */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col max-h-[40%] overflow-hidden">
                <div className="p-3 border-b border-gray-100 bg-gray-50/50">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Variables</span>
                </div>
                <div className="p-4 space-y-3 overflow-y-auto custom-scrollbar">
                    {variables.length === 0 ? (
                        <p className="text-sm text-gray-400 italic text-center py-2">No variables detected in template.</p>
                    ) : variables.map(v => (
                        <div key={v}>
                            <label className="block text-xs font-medium text-gray-500 mb-1">{v}</label>
                            <input 
                                type="text"
                                value={variableValues[v] || ''}
                                onChange={e => setVariableValues(prev => ({...prev, [v]: e.target.value}))}
                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-black/5 focus:border-gray-900 transition-all outline-none"
                                placeholder={`Value for ${v}`}
                            />
                        </div>
                    ))}
                </div>
            </div>

            {/* Output Panel */}
            <div className="flex-1 bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col overflow-hidden">
                 <div className="p-3 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Output</span>
                    <button 
                        onClick={handleRun}
                        disabled={isRunning}
                        className="flex items-center space-x-2 bg-gray-900 hover:bg-gray-800 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 shadow-sm"
                    >
                        {isRunning ? <span>Running...</span> : <><Play size={12}/> <span>Run</span></>}
                    </button>
                </div>
                <div className="flex-1 p-4 overflow-y-auto font-mono text-sm bg-gray-50/50">
                    {output ? (
                        <div className="text-gray-800 whitespace-pre-wrap animate-in fade-in duration-300">{output}</div>
                    ) : (
                        <div className="text-gray-400 italic text-center mt-10">
                            Enter a prompt and click Run to see the response.
                        </div>
                    )}
                </div>
                {stats && (
                    <div className="p-3 bg-white border-t border-gray-100 flex justify-around text-xs text-gray-500">
                        <span className="flex items-center" title="Latency"><History size={12} className="mr-1.5"/> {stats.latency}ms</span>
                        <span className="flex items-center" title="Tokens"><Layers size={12} className="mr-1.5"/> {stats.tokens} tok</span>
                        <span className="flex items-center" title="Cost"><Zap size={12} className="mr-1.5"/> ${stats.cost.toFixed(5)}</span>
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};