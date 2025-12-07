import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { PromptRegistry } from './pages/PromptRegistry';
import { PromptEditor } from './pages/PromptEditor';
import { Playground } from './pages/Playground';
import { Evaluations } from './pages/Evaluations';
import { LogsViewer } from './pages/LogsViewer';
import { Settings } from './pages/Settings';
import { ABTesting } from './pages/ABTesting';
import { RegressionHistory } from './pages/RegressionHistory';
import { storage } from './services/storage';

const App: React.FC = () => {
  // Simple state-based routing for this demo
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedPromptId, setSelectedPromptId] = useState<string | null>(null);
  const [registryRefreshKey, setRegistryRefreshKey] = useState(0);

  useEffect(() => {
    storage.init();
  }, []);

  const handleNavigate = (view: string) => {
    setCurrentView(view);
    if (view !== 'editor') {
      setSelectedPromptId(null);
    }
  };

  const handleSelectPrompt = (id: string) => {
    setSelectedPromptId(id);
    setCurrentView('editor');
  };

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard onNavigate={handleNavigate} />;
      case 'registry':
        return <PromptRegistry key={registryRefreshKey} onSelectPrompt={handleSelectPrompt} />;
      case 'editor':
        if (selectedPromptId) {
            return <PromptEditor
              promptId={selectedPromptId}
              onBack={() => handleNavigate('registry')}
              onPromptUpdated={() => setRegistryRefreshKey(prev => prev + 1)}
            />;
        }
        return <PromptRegistry key={registryRefreshKey} onSelectPrompt={handleSelectPrompt} />; // Fallback
      case 'playground':
        return <Playground />;
      case 'evals':
        return <Evaluations />;
      case 'logs':
        return <LogsViewer />;
      case 'abtesting':
        return <ABTesting />;
      case 'regressions':
        return <RegressionHistory />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <Layout currentView={currentView} onViewChange={handleNavigate}>
      {renderContent()}
    </Layout>
  );
};

export default App;