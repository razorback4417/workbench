import React, { useState, useEffect } from 'react';
import { Search, Plus, Tag, MoreHorizontal } from 'lucide-react';
import { Prompt } from '../types';
import { storage } from '../services/storage';

export const PromptRegistry: React.FC<{ onSelectPrompt: (promptId: string) => void }> = ({ onSelectPrompt }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPrompts = async () => {
      const data = await storage.getPrompts();
      setPrompts(data);
      setLoading(false);
    };
    loadPrompts();
  }, []);

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
        <button className="bg-gray-900 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors flex items-center shadow-lg shadow-gray-200">
            <Plus size={16} className="mr-2" />
            New Prompt
        </button>
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
                                Updated {new Date(prompt.updatedAt).toLocaleDateString()}
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
