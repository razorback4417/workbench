import React, { useEffect, useState } from 'react';
import { storage } from '../services/storage';
import { EvalRun } from '../types';
import { CheckCircle, XCircle, Play, Plus } from 'lucide-react';

export const Evaluations: React.FC = () => {
  const [evals, setEvals] = useState<EvalRun[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    storage.getEvals().then(setEvals);
  }, []);

  const handleRunNewEval = async () => {
    setIsRunning(true);
    // Simulate a regression run
    const newEval: EvalRun = {
        id: `e${Date.now()}`,
        name: `Manual Regression Run ${new Date().toLocaleDateString()}`,
        date: new Date().toLocaleDateString(),
        promptVersionId: 'v2 (current)',
        score: 0,
        status: 'running',
        sampleSize: 10
    };
    
    // Add to UI immediately
    setEvals(prev => [newEval, ...prev]);

    // Mock processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Update with result
    newEval.score = 85 + Math.floor(Math.random() * 15);
    newEval.status = newEval.score > 70 ? 'passed' : 'failed';
    
    await storage.saveEvalRun(newEval);
    setEvals(prev => prev.map(e => e.id === newEval.id ? newEval : e));
    setIsRunning(false);
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-500">
        <div className="flex justify-between items-center">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Evaluations</h1>
                <p className="text-gray-500 text-sm mt-1">Automated regression testing results</p>
            </div>
            <div className="flex space-x-2">
                 <button 
                    onClick={handleRunNewEval}
                    disabled={isRunning}
                    className="bg-black text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors shadow-sm flex items-center"
                 >
                    {isRunning ? (
                        <span>Running...</span>
                    ) : (
                        <>
                            <Play size={14} className="mr-2" />
                            Run Regression
                        </>
                    )}
                </button>
                <button className="bg-white border border-gray-200 text-gray-900 text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors shadow-sm flex items-center">
                    <Plus size={14} className="mr-2" />
                    New Eval Set
                </button>
            </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Eval Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prompt Version</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {evals.map(evalRun => (
                        <tr key={evalRun.id} className="hover:bg-gray-50 transition-colors cursor-pointer">
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">{evalRun.name}</div>
                                <div className="text-xs text-gray-500">{evalRun.sampleSize} test cases</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                    {evalRun.promptVersionId}
                                </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {evalRun.date}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                    {evalRun.status === 'running' ? (
                                        <div className="w-16 bg-gray-200 rounded-full h-2 mr-2 animate-pulse"></div>
                                    ) : (
                                        <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                                            <div 
                                                className={`h-2 rounded-full ${evalRun.score > 80 ? 'bg-green-500' : evalRun.score > 50 ? 'bg-yellow-500' : 'bg-red-500'}`} 
                                                style={{ width: `${evalRun.score}%` }}
                                            ></div>
                                        </div>
                                    )}
                                    <span className="text-sm font-medium text-gray-900">{evalRun.score}%</span>
                                </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex items-center text-sm font-medium ${evalRun.status === 'passed' ? 'text-green-600' : evalRun.status === 'running' ? 'text-blue-600' : 'text-red-600'}`}>
                                    {evalRun.status === 'passed' && <CheckCircle size={16} className="mr-1.5"/>}
                                    {evalRun.status === 'failed' && <XCircle size={16} className="mr-1.5"/>}
                                    <span className="capitalize">{evalRun.status}</span>
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
  );
};
