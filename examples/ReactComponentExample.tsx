/**
 * Example: Using Flux SDK in a React Component
 *
 * This shows how to integrate the Flux SDK into your React components
 */

import React, { useState, useEffect } from 'react';
import { FluxClient } from '../sdk/index';
import { Prompt } from '../sdk/index';

export const PromptRunner: React.FC = () => {
  const [flux] = useState(() => new FluxClient());
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [selectedPromptId, setSelectedPromptId] = useState<string>('');
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [response, setResponse] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // Load prompts on mount
  useEffect(() => {
    loadPrompts();
  }, []);

  const loadPrompts = async () => {
    try {
      const allPrompts = await flux.prompts.list();
      setPrompts(allPrompts);
      if (allPrompts.length > 0 && !selectedPromptId) {
        setSelectedPromptId(allPrompts[0].id);
        // Initialize variables
        const prompt = allPrompts[0];
        const version = prompt.versions.find(v => v.id === prompt.activeVersionId) || prompt.versions[0];
        if (version) {
          const vars: Record<string, string> = {};
          version.variables.forEach(v => {
            vars[v] = '';
          });
          setVariables(vars);
        }
      }
    } catch (error) {
      console.error('Failed to load prompts:', error);
    }
  };

  const handleRun = async () => {
    if (!selectedPromptId) return;

    setLoading(true);
    try {
      const result = await flux.prompts.run(selectedPromptId, variables);
      setResponse(result.text);
    } catch (error: any) {
      setResponse(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const selectedPrompt = prompts.find(p => p.id === selectedPromptId);
  const version = selectedPrompt?.versions.find(v => v.id === selectedPrompt.activeVersionId) || selectedPrompt?.versions[0];

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Flux SDK - React Example</h1>

      <div style={{ marginBottom: '20px' }}>
        <label>
          Select Prompt:
          <select
            value={selectedPromptId}
            onChange={(e) => {
              setSelectedPromptId(e.target.value);
              const prompt = prompts.find(p => p.id === e.target.value);
              if (prompt) {
                const v = prompt.versions.find(v => v.id === prompt.activeVersionId) || prompt.versions[0];
                if (v) {
                  const vars: Record<string, string> = {};
                  v.variables.forEach(v => {
                    vars[v] = '';
                  });
                  setVariables(vars);
                }
              }
            }}
            style={{ marginLeft: '10px', padding: '5px' }}
          >
            {prompts.map(p => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {version && (
        <div style={{ marginBottom: '20px' }}>
          <h3>Variables:</h3>
          {version.variables.map(v => (
            <div key={v} style={{ marginBottom: '10px' }}>
              <label>
                {v}:
                <input
                  type="text"
                  value={variables[v] || ''}
                  onChange={(e) => setVariables({ ...variables, [v]: e.target.value })}
                  style={{ marginLeft: '10px', padding: '5px', width: '300px' }}
                />
              </label>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={handleRun}
        disabled={loading || !selectedPromptId}
        style={{
          padding: '10px 20px',
          backgroundColor: '#6366f1',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: loading ? 'not-allowed' : 'pointer'
        }}
      >
        {loading ? 'Running...' : 'Run Prompt'}
      </button>

      {response && (
        <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '6px' }}>
          <h3>Response:</h3>
          <pre style={{ whiteSpace: 'pre-wrap' }}>{response}</pre>
        </div>
      )}
    </div>
  );
};

