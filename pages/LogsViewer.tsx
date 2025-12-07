import React, { useEffect, useState } from 'react';
import { Search, ChevronDown, ChevronRight, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { storage } from '../services/storage';
import { LogEntry, Prompt } from '../types';

export const LogsViewer: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      const [logsData, promptsData] = await Promise.all([
        storage.getLogs(),
        storage.getPrompts()
      ]);
      setLogs(logsData);
      setPrompts(promptsData);
      setLoading(false);
    };
    loadData();
  }, []);

  const getPromptName = (promptId: string) => {
    const prompt = prompts.find(p => p.id === promptId);
    return prompt?.name || promptId;
  };

  const getErrorCategory = (log: LogEntry): string => {
    if (log.status !== 'error') return '';
    const output = log.output.toLowerCase();
    if (output.includes('api key') || output.includes('authentication')) return 'Authentication';
    if (output.includes('rate limit') || output.includes('quota')) return 'Rate Limit';
    if (output.includes('timeout') || output.includes('network')) return 'Network';
    if (output.includes('invalid') || output.includes('malformed')) return 'Invalid Request';
    return 'Unknown Error';
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch =
      log.id.includes(searchTerm) ||
      getPromptName(log.promptId).toLowerCase().includes(searchTerm.toLowerCase()) ||
      JSON.stringify(log.inputs).toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.output.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.model.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || log.status === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

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
            <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-gray-50 border border-gray-200 text-sm rounded-lg px-3 py-2 text-gray-700"
            >
                <option value="all">All Statuses</option>
                <option value="success">Success</option>
                <option value="error">Error</option>
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
                        ) : filteredLogs.length === 0 ? (
                            <tr><td colSpan={6} className="px-6 py-4 text-center text-gray-500">No logs found</td></tr>
                        ) : filteredLogs.map(log => {
                            const errorCategory = getErrorCategory(log);
                            return (
                                <React.Fragment key={log.id}>
                                    <tr
                                        className="hover:bg-gray-50 transition-colors cursor-pointer group"
                                        onClick={() => setExpandedLogId(expandedLogId === log.id ? null : log.id)}
                                    >
                                        <td className="px-6 py-3 whitespace-nowrap text-gray-500">
                                            <div className="flex items-center space-x-2">
                                                {expandedLogId === log.id ? (
                                                    <ChevronDown size={14} className="text-gray-400" />
                                                ) : (
                                                    <ChevronRight size={14} className="text-gray-400" />
                                                )}
                                                <div>
                                                    <div>{new Date(log.timestamp).toLocaleDateString()}</div>
                                                    <div className="text-xs text-gray-400">{new Date(log.timestamp).toLocaleTimeString()}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-3 whitespace-nowrap">
                                            <div>
                                                <span className="font-medium text-gray-900">{getPromptName(log.promptId)}</span>
                                                <span className="text-gray-400 ml-1 text-xs">@{log.versionId.substring(0,6)}</span>
                                            </div>
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
                                            <div className="flex items-center space-x-2">
                                                <span className={`px-2 py-1 rounded text-xs font-medium flex items-center space-x-1 ${
                                                    log.status === 'success'
                                                        ? 'bg-green-50 text-green-700'
                                                        : 'bg-red-50 text-red-700'
                                                }`}>
                                                    {log.status === 'success' ? (
                                                        <CheckCircle size={12} />
                                                    ) : (
                                                        <XCircle size={12} />
                                                    )}
                                                    <span>{log.status.toUpperCase()}</span>
                                                </span>
                                                {errorCategory && (
                                                    <span className="px-2 py-1 rounded text-xs bg-orange-50 text-orange-700 border border-orange-200">
                                                        {errorCategory}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                    {expandedLogId === log.id && (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-4 bg-gray-50">
                                                <div className="space-y-4">
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Input Variables</div>
                                                            <div className="bg-white rounded-lg p-3 border border-gray-200">
                                                                <pre className="text-xs text-gray-800 whitespace-pre-wrap">
                                                                    {JSON.stringify(log.inputs, null, 2)}
                                                                </pre>
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Metadata</div>
                                                            <div className="bg-white rounded-lg p-3 border border-gray-200 space-y-1 text-xs">
                                                                <div><span className="text-gray-500">Tokens:</span> <span className="font-mono">{log.tokens}</span></div>
                                                                <div><span className="text-gray-500">Latency:</span> <span className="font-mono">{log.latency}ms</span></div>
                                                                <div><span className="text-gray-500">Cost:</span> <span className="font-mono">${log.cost.toFixed(6)}</span></div>
                                                                <div><span className="text-gray-500">Model:</span> <span className="font-mono">{log.model}</span></div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Output</div>
                                                        <div className="bg-white rounded-lg p-3 border border-gray-200">
                                                            <pre className="text-xs text-gray-800 whitespace-pre-wrap max-h-96 overflow-y-auto">
                                                                {log.output}
                                                            </pre>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
  );
};
