import React, { useEffect, useState } from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import { ArrowUpRight, Clock, DollarSign, Zap } from 'lucide-react';
import { storage } from '../services/storage';
import { LogEntry } from '../types';

const StatCard = ({ title, value, change, icon: Icon, subtext }: any) => (
  <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between h-40">
    <div className="flex justify-between items-start">
      <div className="p-2 bg-gray-50 rounded-lg border border-gray-100">
        <Icon size={20} className="text-gray-700" />
      </div>
      <span className={`text-xs font-medium px-2 py-1 rounded-full ${change >= 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
        {change >= 0 ? '+' : ''}{change}%
      </span>
    </div>
    <div>
      <h3 className="text-2xl font-bold text-gray-900 tracking-tight">{value}</h3>
      <p className="text-sm text-gray-500 font-medium mt-1">{title}</p>
      {subtext && <p className="text-xs text-gray-400 mt-2">{subtext}</p>}
    </div>
  </div>
);

export const Dashboard: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    storage.getLogs().then(data => {
      setLogs(data);
      setLoading(false);
    });
  }, []);

  // Compute stats
  const totalRequests = logs.length;
  const avgLatency = logs.length > 0 ? Math.round(logs.reduce((acc, l) => acc + l.latency, 0) / logs.length) : 0;
  const totalCost = logs.reduce((acc, l) => acc + l.cost, 0);
  const successCount = logs.filter(l => l.status === 'success').length;
  const successRate = logs.length > 0 ? ((successCount / logs.length) * 100).toFixed(1) : "100";

  // Prepare chart data (last 7 days logic simplified to last 7 entries for demo)
  const chartData = logs.slice(0, 10).reverse().map((log, i) => ({
    name: new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    requests: 1, // simplified
    latency: log.latency
  }));

  if (loading) return <div className="p-8">Loading dashboard...</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
           <h1 className="text-2xl font-bold text-gray-900">Overview</h1>
           <p className="text-gray-500 text-sm mt-1">Activity summary for your workspace</p>
        </div>
        <div className="flex space-x-3">
             <select className="bg-white border border-gray-200 text-sm rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-200">
                 <option>Last 7 days</option>
                 <option>Last 30 days</option>
                 <option>All time</option>
             </select>
             <button className="bg-gray-900 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors">
                 Export Report
             </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Requests" value={totalRequests.toLocaleString()} change={12.5} icon={Zap} subtext="Volume is trending up" />
        <StatCard title="Avg Latency" value={`${avgLatency}ms`} change={-5.2} icon={Clock} subtext="Performance improved" />
        <StatCard title="Est. Cost" value={`$${totalCost.toFixed(4)}`} change={2.1} icon={DollarSign} subtext="Within budget" />
        <StatCard title="Success Rate" value={`${successRate}%`} change={0.1} icon={ArrowUpRight} subtext="System stable" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="text-base font-semibold text-gray-900 mb-6">Recent Latency</h3>
            <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                        <defs>
                            <linearGradient id="colorLatency" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#111827" stopOpacity={0.1}/>
                                <stop offset="95%" stopColor="#111827" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#6B7280'}} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#6B7280'}} />
                        <Tooltip 
                            contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #E5E7EB', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            itemStyle={{ color: '#111827', fontSize: '13px', fontWeight: 600 }}
                        />
                        <Area type="monotone" dataKey="latency" stroke="#111827" strokeWidth={2} fillOpacity={1} fill="url(#colorLatency)" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="text-base font-semibold text-gray-900 mb-6">Latency Distribution</h3>
             <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#6B7280'}} dy={10} />
                        <Tooltip 
                            cursor={{fill: '#F9FAFB'}}
                            contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #E5E7EB', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Bar dataKey="latency" fill="#E5E7EB" radius={[4, 4, 0, 0]} activeBar={{fill: '#111827'}} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
      </div>
    </div>
  );
};
