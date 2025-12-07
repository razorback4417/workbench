import React, { useState, useEffect } from 'react';
import { Search, Plus, Tag, MoreHorizontal, X, Upload, Download } from 'lucide-react';
import { Prompt, PromptVersion, ModelType } from '../types';
import { storage } from '../services/storage';

export const PromptRegistry: React.FC<{ onSelectPrompt: (promptId: string) => void }> = ({ onSelectPrompt }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewPromptModal, setShowNewPromptModal] = useState(false);
  const [newPromptName, setNewPromptName] = useState('');
  const [newPromptDescription, setNewPromptDescription] = useState('');
  const [newPromptTags, setNewPromptTags] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);

  useEffect(() => {
    const loadPrompts = async () => {
      const data = await storage.getPrompts();
      setPrompts(data);
      setLoading(false);
    };
    loadPrompts();
  }, []);

  const handleCreatePrompt = async () => {
    if (!newPromptName.trim()) {
      alert('Please enter a prompt name');
      return;
    }

    const tags = newPromptTags.split(',').map(t => t.trim()).filter(t => t);
    const newPrompt: Prompt = {
      id: `p${Date.now()}`,
      name: newPromptName,
      description: newPromptDescription || 'No description',
      tags: tags,
      activeVersionId: '',
      updatedAt: new Date().toISOString(),
      versions: []
    };

    // Create initial version
    const initialVersion = await storage.createPromptVersion(newPrompt.id, {
      template: 'You are a helpful assistant. {{user_message}}',
      variables: ['user_message'],
      model: ModelType.GEMINI_2_5_FLASH,
      temperature: 0.7,
      commitMessage: 'Initial version'
    });

    newPrompt.activeVersionId = initialVersion.id;
    newPrompt.versions = [initialVersion];

    await storage.savePrompt(newPrompt);

    // Refresh list
    const updatedPrompts = await storage.getPrompts();
    setPrompts(updatedPrompts);

    // Reset form and close modal
    setNewPromptName('');
    setNewPromptDescription('');
    setNewPromptTags('');
    setShowNewPromptModal(false);

    // Open the new prompt in editor
    onSelectPrompt(newPrompt.id);
  };

  const handleBulkUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      // Handle array of prompts or single prompt
      const promptsToImport = Array.isArray(data) ? data : [data];
      let importedCount = 0;

      for (const promptData of promptsToImport) {
        // Extract version data
        const template = promptData.template || promptData.version?.template;
        const variables = promptData.variables || promptData.version?.variables || [];
        const modelString = promptData.model || promptData.version?.model || ModelType.GEMINI_2_5_FLASH;
        // Validate model is a valid ModelType
        const model = Object.values(ModelType).includes(modelString as ModelType)
          ? (modelString as ModelType)
          : ModelType.GEMINI_2_5_FLASH;
        const temperature = promptData.temperature || promptData.version?.temperature || 0.7;
        const commitMessage = promptData.commitMessage || promptData.version?.commitMessage || 'Imported from file';
        const status = promptData.version?.status || 'draft';

        // Create version object directly
        const newVersion: PromptVersion = {
          id: `v${Date.now()}-${Math.random()}`,
          version: 1,
          createdAt: new Date().toISOString(),
          status: status as 'draft' | 'staging' | 'production' | 'archived',
          template: template || '',
          variables: variables,
          model: model,
          temperature: temperature,
          createdBy: 'Theo',
          commitMessage: commitMessage,
        };

        // Create new prompt with version
        const newPrompt: Prompt = {
          id: `p${Date.now()}-${Math.random()}`,
          name: promptData.name || `Imported Prompt ${importedCount + 1}`,
          description: promptData.description || 'Imported prompt',
          tags: promptData.tags || [],
          activeVersionId: template ? newVersion.id : '',
          updatedAt: new Date().toISOString(),
          versions: template ? [newVersion] : []
        };

        await storage.savePrompt(newPrompt);
        importedCount++;
      }

      // Refresh list
      const updatedPrompts = await storage.getPrompts();
      setPrompts(updatedPrompts);
      setShowUploadModal(false);
      alert(`Successfully imported ${importedCount} prompt(s)!`);
    } catch (error: any) {
      console.error('Failed to import prompts:', error);
      alert(`Failed to import prompts: ${error.message}`);
    }

    // Reset file input
    event.target.value = '';
  };

  const handleExportAll = () => {
    const exportData = prompts.map(p => {
      const activeVersion = p.versions.find(v => v.id === p.activeVersionId);
      return {
        name: p.name,
        description: p.description,
        tags: p.tags,
        version: activeVersion ? {
          template: activeVersion.template,
          variables: activeVersion.variables,
          model: activeVersion.model,
          temperature: activeVersion.temperature,
          status: activeVersion.status
        } : null
      };
    });

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prompts-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const filteredPrompts = prompts.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-500">
       <div className="flex justify-between items-center">
        <div>
           <h1 className="text-2xl font-bold text-gray-900">Prompt Registry</h1>
           <p className="text-gray-500 text-sm mt-1">Manage and version control your prompts</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowUploadModal(true)}
            className="bg-white border border-gray-200 text-gray-700 text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors flex items-center shadow-sm"
          >
            <Upload size={16} className="mr-2" />
            Upload
          </button>
          <button
            onClick={handleExportAll}
            className="bg-white border border-gray-200 text-gray-700 text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors flex items-center shadow-sm"
          >
            <Download size={16} className="mr-2" />
            Export All
          </button>
          <button
            onClick={() => setShowNewPromptModal(true)}
            className="bg-gray-900 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors flex items-center shadow-lg shadow-gray-200"
          >
            <Plus size={16} className="mr-2" />
            New Prompt
          </button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
        <input
            type="text"
            placeholder="Search prompts by name or tag..."
            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* New Prompt Modal */}
      {showNewPromptModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">Create New Prompt</h3>
              <button
                onClick={() => setShowNewPromptModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  value={newPromptName}
                  onChange={(e) => setNewPromptName(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  placeholder="e.g., Customer Support Bot"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={newPromptDescription}
                  onChange={(e) => setNewPromptDescription(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  rows={3}
                  placeholder="What does this prompt do?"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma-separated)</label>
                <input
                  type="text"
                  value={newPromptTags}
                  onChange={(e) => setNewPromptTags(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  placeholder="support, chatbot, customer-facing"
                />
              </div>
              <div className="pt-4 flex justify-end space-x-2">
                <button
                  onClick={() => setShowNewPromptModal(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreatePrompt}
                  className="px-4 py-2 bg-black text-white rounded-lg text-sm font-medium"
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">Upload Prompts</h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select JSON file (single prompt or array of prompts)
                </label>
                <label className="w-full px-4 py-3 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg text-sm font-medium flex items-center justify-center hover:bg-gray-100 cursor-pointer">
                  <Upload size={16} className="mr-2" />
                  Choose File to Upload
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleBulkUpload}
                    className="hidden"
                  />
                </label>
                <p className="text-xs text-gray-500 mt-2">
                  Upload a JSON file containing one or more prompts. Each prompt should have: name, description, tags, and version data (template, variables, model, temperature).
                </p>
              </div>
              <div className="pt-4 flex justify-end">
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {loading ? (
            <div className="text-center py-12 text-gray-400">Loading prompts...</div>
        ) : filteredPrompts.map((prompt: Prompt) => (
            <div
                key={prompt.id}
                onClick={() => onSelectPrompt(prompt.id)}
                className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-gray-300 transition-all cursor-pointer group"
            >
                <div className="flex justify-between items-start">
                    <div className="flex-1">
                        <div className="flex items-center space-x-3">
                            <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">{prompt.name}</h3>
                            <span className="px-2 py-0.5 bg-green-50 text-green-700 text-xs font-medium rounded-full border border-green-100">
                                {prompt.versions.find(v => v.id === prompt.activeVersionId)?.status.toUpperCase()}
                            </span>
                        </div>
                        <p className="text-gray-500 text-sm mt-1 mb-4 max-w-2xl">{prompt.description}</p>

                        <div className="flex items-center space-x-2">
                            {prompt.tags.map(tag => (
                                <span key={tag} className="inline-flex items-center px-2 py-1 bg-gray-50 text-gray-600 text-xs rounded-md border border-gray-100">
                                    <Tag size={10} className="mr-1" />
                                    {tag}
                                </span>
                            ))}
                            <span className="text-xs text-gray-400 pl-2">
                                Updated {new Date(prompt.updatedAt).toLocaleString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    hour: 'numeric',
                                    minute: '2-digit',
                                    hour12: true
                                })}
                            </span>
                        </div>
                    </div>
                    <button className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full opacity-0 group-hover:opacity-100 transition-all">
                        <MoreHorizontal size={20} />
                    </button>
                </div>
            </div>
        ))}
      </div>
    </div>
  );
};
