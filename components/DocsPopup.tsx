import React from 'react';
import { X, Zap, Files, Terminal, Activity, Box, GitBranch, Settings, LayoutDashboard } from 'lucide-react';

interface DocsPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DocsPopup: React.FC<DocsPopupProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 bg-gray-900 rounded-lg flex items-center justify-center text-white">
              <Zap size={20} fill="currentColor" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Flux Documentation</h2>
              <p className="text-sm text-gray-500">How to use the platform</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* Overview */}
          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">What is Flux?</h3>
            <p className="text-gray-600 leading-relaxed">
              Flux is the DevOps layer for LLMs. It provides version control, testing, and observability for AI prompts,
              helping you manage prompts like code with proper workflows, testing, and monitoring.
            </p>
          </section>

          {/* Getting Started */}
          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Getting Started</h3>
            <ol className="list-decimal list-inside space-y-2 text-gray-600">
              <li>Go to <strong>Settings</strong> and enter your Gemini API key</li>
              <li>Create your first prompt in the <strong>Prompt Registry</strong></li>
              <li>Edit and test prompts in the <strong>Prompt Editor</strong></li>
              <li>Monitor performance in the <strong>Dashboard</strong></li>
            </ol>
          </section>

          {/* Features */}
          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Features</h3>
            <div className="space-y-4">
              <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg border border-gray-100">
                <LayoutDashboard size={20} className="text-gray-700 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Dashboard</h4>
                  <p className="text-sm text-gray-600">
                    View real-time metrics including total requests, average latency, total cost, and success rates.
                    Charts show latency trends and request distribution over time.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg border border-gray-100">
                <Files size={20} className="text-gray-700 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Prompt Registry</h4>
                  <p className="text-sm text-gray-600">
                    Central repository for all your prompts. Create, search, and manage prompts. Each prompt can have
                    multiple versions with full version control, including draft, staging, and production statuses.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg border border-gray-100">
                <Terminal size={20} className="text-gray-700 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Playground</h4>
                  <p className="text-sm text-gray-600">
                    Quick testing environment for prompts. Edit templates, test with different variables, and see
                    results immediately without saving. Perfect for rapid iteration.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg border border-gray-100">
                <Activity size={20} className="text-gray-700 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Evaluations</h4>
                  <p className="text-sm text-gray-600">
                    Run automated tests across datasets. Use AI-as-judge scoring to evaluate prompt quality.
                    Track evaluation results and compare performance across versions.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg border border-gray-100">
                <Box size={20} className="text-gray-700 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Logs & Traces</h4>
                  <p className="text-sm text-gray-600">
                    View all prompt execution logs with full traces. See inputs, outputs, latency, cost, and tokens
                    for every run. Filter by status and search through logs.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg border border-gray-100">
                <GitBranch size={20} className="text-gray-700 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">A/B Testing</h4>
                  <p className="text-sm text-gray-600">
                    Compare different prompt variants with weighted routing. Track metrics like success rate, latency,
                    and cost for each variant. Automatically determine winners based on performance.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Key Concepts */}
          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Key Concepts</h3>
            <div className="space-y-3 text-gray-600">
              <div>
                <h4 className="font-medium text-gray-900 mb-1">Version Control</h4>
                <p className="text-sm">
                  Each prompt can have multiple versions. Save new versions with commit messages, compare versions side-by-side,
                  and manage deployment status (draft → staging → production).
                </p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-1">Variables</h4>
                <p className="text-sm">
                  Use <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono">{{variableName}}</code> syntax
                  in your templates. Variables are auto-detected and can be filled in when running prompts.
                </p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-1">Metrics Tracking</h4>
                <p className="text-sm">
                  Every prompt execution is automatically logged with latency (measured in milliseconds), token usage,
                  estimated cost, and success/error status. This data powers all analytics and A/B testing.
                </p>
              </div>
            </div>
          </section>

          {/* SDK Section */}
          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">SDK Integration</h3>
            <p className="text-gray-600 mb-4 text-sm">
              Integrate Flux into your applications using our JavaScript/TypeScript SDK. The SDK provides a simple API for fetching prompts, running them, and accessing logs and metrics.
            </p>

            <div className="space-y-4">
              <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                <pre className="text-sm text-gray-100">
                  <code>{`// Install the SDK
npm install @flux/sdk

// Initialize the client
import { FluxClient } from '@flux/sdk';

const flux = new FluxClient({
  apiKey: 'your-api-key',
  baseUrl: 'https://api.flux.ai'
});

// Run a prompt
const response = await flux.prompts.run('prompt-id', {
  variable1: 'value1',
  variable2: 'value2'
});

console.log(response.text);`}</code>
                </pre>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h4 className="font-medium text-gray-900 mb-2 text-sm">Key SDK Methods</h4>
                <ul className="space-y-1 text-xs text-gray-600">
                  <li><code className="bg-gray-100 px-1.5 py-0.5 rounded">flux.prompts.get(id)</code> - Fetch a prompt</li>
                  <li><code className="bg-gray-100 px-1.5 py-0.5 rounded">flux.prompts.run(id, variables)</code> - Execute a prompt</li>
                  <li><code className="bg-gray-100 px-1.5 py-0.5 rounded">flux.prompts.create(data)</code> - Create new prompt</li>
                  <li><code className="bg-gray-100 px-1.5 py-0.5 rounded">flux.logs.list(options)</code> - Get execution logs</li>
                  <li><code className="bg-gray-100 px-1.5 py-0.5 rounded">flux.evaluations.run(config)</code> - Run evaluations</li>
                  <li><code className="bg-gray-100 px-1.5 py-0.5 rounded">flux.abTests.create(config)</code> - Create A/B tests</li>
                </ul>
              </div>

              <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                <p className="text-sm text-blue-900">
                  <strong>💡 Tip:</strong> The SDK automatically handles version management, logging, and metrics tracking. All prompt executions are automatically logged with latency, cost, and token usage.
                </p>
              </div>
            </div>
          </section>

          {/* Workflow */}
          <section>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Typical Workflow</h3>
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-100">
              <ol className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start">
                  <span className="font-semibold text-blue-900 mr-2">1.</span>
                  <span>Create a prompt in the Registry or use the Playground for quick testing</span>
                </li>
                <li className="flex items-start">
                  <span className="font-semibold text-blue-900 mr-2">2.</span>
                  <span>Edit the template, define variables, and select your model</span>
                </li>
                <li className="flex items-start">
                  <span className="font-semibold text-blue-900 mr-2">3.</span>
                  <span>Test the prompt by running it with sample inputs</span>
                </li>
                <li className="flex items-start">
                  <span className="font-semibold text-blue-900 mr-2">4.</span>
                  <span>Save as a new version when satisfied (draft status)</span>
                </li>
                <li className="flex items-start">
                  <span className="font-semibold text-blue-900 mr-2">5.</span>
                  <span>Run evaluations to test across datasets</span>
                </li>
                <li className="flex items-start">
                  <span className="font-semibold text-blue-900 mr-2">6.</span>
                  <span>Promote to staging, then production when ready</span>
                </li>
                <li className="flex items-start">
                  <span className="font-semibold text-blue-900 mr-2">7.</span>
                  <span>Integrate into your app using the SDK</span>
                </li>
                <li className="flex items-start">
                  <span className="font-semibold text-blue-900 mr-2">8.</span>
                  <span>Monitor performance in Dashboard and Logs</span>
                </li>
              </ol>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
          <p className="text-xs text-gray-500">
            Need more help? Check the support section or review the code documentation.
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};

