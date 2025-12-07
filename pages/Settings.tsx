import React, { useState, useEffect } from 'react';
import { Check, Eye, EyeOff, Save } from 'lucide-react';
import { storage } from '../services/storage';

export const Settings: React.FC = () => {
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const loadKeys = async () => {
      const keys = await storage.getAllApiKeys();
      setApiKeys(keys);
    };
    loadKeys();
  }, []);

  const handleKeyChange = (provider: string, value: string) => {
    setApiKeys(prev => ({ ...prev, [provider]: value }));
    setSaved(prev => ({ ...prev, [provider]: false }));
  };

  const handleSaveKey = async (provider: 'gemini' | 'openai' | 'anthropic') => {
    await storage.setApiKey(provider, apiKeys[provider] || '');
    setSaved(prev => ({ ...prev, [provider]: true }));
    setTimeout(() => setSaved(prev => ({ ...prev, [provider]: false })), 2000);
  };

  const toggleShowKey = (provider: string) => {
    setShowKeys(prev => ({ ...prev, [provider]: !prev[provider] }));
  };

  const getMaskedKey = (key: string | undefined) => {
    if (!key) return '';
    return key.length > 8 ? `${key.substring(0, 4)}${'*'.repeat(key.length - 8)}${key.substring(key.length - 4)}` : '****';
  };

  return (
    <div className="max-w-3xl space-y-8 animate-in fade-in duration-500">
        <div>
           <h1 className="text-2xl font-bold text-gray-900">Workspace Settings</h1>
           <p className="text-gray-500 text-sm mt-1">Manage API keys and configuration</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">API Configuration</h3>
            <div className="space-y-6">
                {/* Gemini API Key */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Gemini API Key</label>
                    <div className="flex space-x-2">
                        <div className="relative flex-1">
                            <input
                                type={showKeys.gemini ? "text" : "password"}
                                value={apiKeys.gemini || ''}
                                onChange={(e) => handleKeyChange('gemini', e.target.value)}
                                placeholder={apiKeys.gemini ? getMaskedKey(apiKeys.gemini) : "Enter your Gemini API key"}
                                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent pr-10"
                            />
                            <button
                                onClick={() => toggleShowKey('gemini')}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                {showKeys.gemini ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                        <button
                            onClick={() => handleSaveKey('gemini')}
                            className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-800 font-medium flex items-center space-x-2 disabled:opacity-50"
                            disabled={saved.gemini}
                        >
                            {saved.gemini ? <Check size={16} /> : <Save size={16} />}
                            <span>{saved.gemini ? 'Saved' : 'Save'}</span>
                        </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                        Required for all LLM operations. Supports: gemini-2.0-flash-exp, gemini-2.0-flash-lite, gemini-2.0-flash, gemini-2.5-flash. Get your key from <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Google AI Studio</a>.
                    </p>
                </div>
            </div>
        </div>
    </div>
  );
};
