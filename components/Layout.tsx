import React, { useState } from 'react';
import {
  LayoutDashboard,
  Files,
  Terminal,
  Activity,
  Settings,
  LogOut,
  Zap,
  Box,
  ChevronRight,
  GitBranch,
  AlertTriangle
} from 'lucide-react';
import { CURRENT_USER } from '../services/mockData';
import { DocsPopup } from './DocsPopup';

interface SidebarItemProps {
  icon: React.ElementType;
  label: string;
  isActive: boolean;
  onClick: () => void;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ icon: Icon, label, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
      isActive
        ? 'bg-white shadow-sm text-gray-900 ring-1 ring-gray-200'
        : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
    }`}
  >
    <Icon size={18} className={isActive ? 'text-gray-900' : 'text-gray-400'} />
    <span>{label}</span>
  </button>
);

export const Layout: React.FC<{ children: React.ReactNode; currentView: string; onViewChange: (view: string) => void }> = ({
  children,
  currentView,
  onViewChange
}) => {
  const [isDocsOpen, setIsDocsOpen] = useState(false);

  return (
    <div className="flex h-screen w-full bg-[#F8F9FA] text-gray-900 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 border-r border-gray-200 bg-[#FBFBFB] flex flex-col justify-between p-4">
        <div>
          <div className="flex items-center space-x-2 px-2 mb-8 mt-2">
            <div className="h-8 w-8 bg-gray-900 rounded-lg flex items-center justify-center text-white">
              <Zap size={18} fill="currentColor" />
            </div>
            <span className="font-bold text-lg tracking-tight">Flux</span>
          </div>

          <div className="space-y-1">
            <SidebarItem
              icon={LayoutDashboard}
              label="Dashboard"
              isActive={currentView === 'dashboard'}
              onClick={() => onViewChange('dashboard')}
            />
            <SidebarItem
              icon={Files}
              label="Prompt Registry"
              isActive={currentView === 'registry' || currentView === 'editor'}
              onClick={() => onViewChange('registry')}
            />
            <SidebarItem
              icon={Terminal}
              label="Playground"
              isActive={currentView === 'playground'}
              onClick={() => onViewChange('playground')}
            />
            <SidebarItem
              icon={Activity}
              label="Evaluations"
              isActive={currentView === 'evals'}
              onClick={() => onViewChange('evals')}
            />
            <SidebarItem
              icon={Box}
              label="Logs & Traces"
              isActive={currentView === 'logs'}
              onClick={() => onViewChange('logs')}
            />
            <SidebarItem
              icon={GitBranch}
              label="A/B Testing"
              isActive={currentView === 'abtesting'}
              onClick={() => onViewChange('abtesting')}
            />
            <SidebarItem
              icon={AlertTriangle}
              label="Regressions"
              isActive={currentView === 'regressions'}
              onClick={() => onViewChange('regressions')}
            />
          </div>
        </div>

        <div className="space-y-1 border-t border-gray-200 pt-4">
          <SidebarItem
            icon={Settings}
            label="Settings"
            isActive={currentView === 'settings'}
            onClick={() => onViewChange('settings')}
          />
          <div className="flex items-center space-x-3 px-4 py-3 mt-2 rounded-lg bg-gray-100/50 border border-gray-100">
            <img
              src={CURRENT_USER.avatarUrl}
              alt="User"
              className="w-8 h-8 rounded-full border border-gray-200"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{CURRENT_USER.name}</p>
              <p className="text-xs text-gray-500 truncate capitalize">{CURRENT_USER.role.toLowerCase()}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Top Header - Contextual */}
        <header className="h-16 flex-shrink-0 border-b border-gray-200 bg-white/50 backdrop-blur-sm flex items-center justify-between px-8 z-10">
          <div className="flex items-center text-sm text-gray-500">
            <span className="cursor-pointer hover:text-gray-900" onClick={() => onViewChange('dashboard')}>Workspace</span>
            <ChevronRight size={14} className="mx-2" />
            <span className="font-medium text-gray-900 capitalize">{currentView.replace('-', ' ')}</span>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setIsDocsOpen(true)}
              className="text-xs font-medium text-gray-500 hover:text-gray-900 bg-gray-100 px-3 py-1.5 rounded-full transition-colors"
            >
              Docs
            </button>
            <button className="text-xs font-medium text-gray-500 hover:text-gray-900 bg-gray-100 px-3 py-1.5 rounded-full">
              Support
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-8">
            <div className="max-w-7xl mx-auto h-full">
                {children}
            </div>
        </div>
      </main>
      <DocsPopup isOpen={isDocsOpen} onClose={() => setIsDocsOpen(false)} />
    </div>
  );
};
