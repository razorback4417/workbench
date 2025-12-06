import React from 'react';

export const Settings: React.FC = () => {
  return (
    <div className="max-w-3xl space-y-8 animate-in fade-in duration-500">
        <div>
           <h1 className="text-2xl font-bold text-gray-900">Workspace Settings</h1>
           <p className="text-gray-500 text-sm mt-1">Manage API keys and team access</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">API Configuration</h3>
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Gemini API Key</label>
                    <div className="flex space-x-2">
                        <input 
                            type="password" 
                            value="********************************"
                            disabled
                            className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-500 cursor-not-allowed"
                        />
                        <button className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-50 font-medium">
                            Rotate Key
                        </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                        This key is used for the Prompt Sandbox. It is loaded securely from the environment variables.
                    </p>
                </div>
            </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Team Members</h3>
            <div className="space-y-4">
                {['Theo Designer', 'Sarah Content', 'Mike Dev'].map((name, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                        <div className="flex items-center space-x-3">
                            <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
                                {name.split(' ').map(n => n[0]).join('')}
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-900">{name}</p>
                                <p className="text-xs text-gray-500">{i === 0 ? 'Admin' : 'Editor'}</p>
                            </div>
                        </div>
                        <select className="text-sm border-gray-200 rounded-md text-gray-600 bg-white">
                            <option>Admin</option>
                            <option>Editor</option>
                            <option>Viewer</option>
                        </select>
                    </div>
                ))}
                <button className="mt-4 w-full py-2 border-2 border-dashed border-gray-200 rounded-lg text-sm font-medium text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-all">
                    + Invite Member
                </button>
            </div>
        </div>
    </div>
  );
};
