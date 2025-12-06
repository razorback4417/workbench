import React, { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { storage } from '../services/storage';
import { LogEntry } from '../types';

export const LogsViewer: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    storage.getLogs().then(data => {
      setLogs(data);
      setLoading(false);
    });
  }, []);

  const filteredLogs = logs.filter(log => 
    log.id.includes(searchTerm) || 
    log.promptId.includes(searchTerm) ||
    JSON.stringify(log.inputs).includes(searchTerm) ||
    log.output.includes(searchTerm)
  );

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-500">
        <div>
           <h1 className="text-2xl font-bold text-gray-900">Logs & Traces</h1>
           <p className="text-gray-500 text-sm mt-1">Full history of LLM executions</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center space-x-4">
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input 
                    type="text" 
                    placeholder="Search logs by ID, prompt name, or content..." 
                    className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-900 transition-all"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <select className="bg-gray-50 border border-gray-200 text-sm rounded-lg px-3 py-2 text-gray-700">
                <option>All Statuses</option>
                <option>Success</option>
                <option>Error</option>
            </select>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prompt</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Model</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Latency</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200 font-mono text-sm">
                        {loading ? (
                             <tr><td colSpan={6} className="px-6 py-4 text-center text-gray-500">Loading logs...</td></tr>
                        ) : filteredLogs.map(log => (
                            <tr key={log.id} className="hover:bg-gray-50 transition-colors cursor-pointer group">
                                <td className="px-6 py-3 whitespace-nowrap text-gray-500">
                                    {new Date(log.timestamp).toLocaleTimeString()}
                                </td>
                                <td className="px-6 py-3 whitespace-nowrap">
                                    <span className="font-medium text-gray-900">{log.promptId}</span>
                                    <span className="text-gray-400 ml-1">@{log.versionId.substring(0,6)}</span>
                                </td>
                                <td className="px-6 py-3 whitespace-nowrap text-gray-600 text-xs">
                                    {log.model}
                                </td>
                                <td className="px-6 py-3 whitespace-nowrap text-gray-600">
                                    {Math.round(log.latency)}ms
                                </td>
                                <td className="px-6 py-3 whitespace-nowrap text-gray-600">
                                    ${log.cost.toFixed(5)}
                                </td>
                                <td className="px-6 py-3 whitespace-nowrap">
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${log.status === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                        {log.status.toUpperCase()}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
  );
};
