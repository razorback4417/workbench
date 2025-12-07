import React, { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle, TrendingUp, TrendingDown, ArrowRight, Lightbulb, Rocket, ChevronDown, ChevronRight } from 'lucide-react';
import { storage } from '../services/storage';
import { Prompt, LogEntry } from '../types';
import { getRegressionAlerts, RegressionAlert, markRegressionFixed } from '../services/regressionService';

export const RegressionHistory: React.FC = () => {
  const [alerts, setAlerts] = useState<RegressionAlert[]>([]);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [expandedAlertId, setExpandedAlertId] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      const [alertsData, promptsData, logsData] = await Promise.all([
        getRegressionAlerts(),
        storage.getPrompts(),
        storage.getLogs()
      ]);
      setAlerts(alertsData);
      setPrompts(promptsData);
      setLogs(logsData);
    };
    loadData();
  }, []);

  const getPromptName = (promptId: string) => {
    return prompts.find(p => p.id === promptId)?.name || promptId;
  };

  const getVersionNumber = (promptId: string, versionId: string) => {
    const prompt = prompts.find(p => p.id === promptId);
    const version = prompt?.versions.find(v => v.id === versionId);
    return version ? `v${version.version}` : versionId;
  };

  const handleMarkFixed = async (alertId: string, fixedVersionId: string) => {
    await markRegressionFixed(alertId, fixedVersionId);
    const updatedAlerts = await getRegressionAlerts();
    setAlerts(updatedAlerts);
  };

  // Compute diff between two prompt versions
  const computeDiff = (oldText: string, newText: string) => {
    const oldLines = oldText.split('\n');
    const newLines = newText.split('\n');

    const oldDiff: Array<{ type: 'removed' | 'unchanged'; text: string; lineNumber: number }> = [];
    const newDiff: Array<{ type: 'added' | 'unchanged'; text: string; lineNumber: number }> = [];

    let oldIndex = 0;
    let newIndex = 0;
    let lineNum = 1;

    while (oldIndex < oldLines.length || newIndex < newLines.length) {
      if (oldIndex >= oldLines.length) {
        newDiff.push({ type: 'added', text: newLines[newIndex], lineNumber: lineNum });
        oldDiff.push({ type: 'unchanged', text: '', lineNumber: lineNum });
        newIndex++;
        lineNum++;
      } else if (newIndex >= newLines.length) {
        oldDiff.push({ type: 'removed', text: oldLines[oldIndex], lineNumber: lineNum });
        newDiff.push({ type: 'unchanged', text: '', lineNumber: lineNum });
        oldIndex++;
        lineNum++;
      } else if (oldLines[oldIndex] === newLines[newIndex]) {
        oldDiff.push({ type: 'unchanged', text: oldLines[oldIndex], lineNumber: lineNum });
        newDiff.push({ type: 'unchanged', text: newLines[newIndex], lineNumber: lineNum });
        oldIndex++;
        newIndex++;
        lineNum++;
      } else {
        let foundMatch = false;

        for (let i = oldIndex + 1; i < Math.min(oldIndex + 10, oldLines.length); i++) {
          if (oldLines[i] === newLines[newIndex]) {
            for (let j = oldIndex; j < i; j++) {
              oldDiff.push({ type: 'removed', text: oldLines[j], lineNumber: lineNum });
              newDiff.push({ type: 'unchanged', text: '', lineNumber: lineNum });
              lineNum++;
            }
            oldIndex = i;
            foundMatch = true;
            break;
          }
        }

        if (!foundMatch) {
          for (let i = newIndex + 1; i < Math.min(newIndex + 10, newLines.length); i++) {
            if (newLines[i] === oldLines[oldIndex]) {
              for (let j = newIndex; j < i; j++) {
                oldDiff.push({ type: 'unchanged', text: '', lineNumber: lineNum });
                newDiff.push({ type: 'added', text: newLines[j], lineNumber: lineNum });
                lineNum++;
              }
              newIndex = i;
              foundMatch = true;
              break;
            }
          }
        }

        if (!foundMatch) {
          oldDiff.push({ type: 'removed', text: oldLines[oldIndex], lineNumber: lineNum });
          newDiff.push({ type: 'added', text: newLines[newIndex], lineNumber: lineNum });
          oldIndex++;
          newIndex++;
          lineNum++;
        }
      }
    }

    return { oldDiff, newDiff };
  };

  const fixedAlerts = alerts.filter(a => a.fixed);
  const activeAlerts = alerts.filter(a => !a.fixed);
  const criticalAlerts = alerts.filter(a => !a.fixed && a.severity === 'critical');

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-500">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Regression History</h1>
        <p className="text-gray-500 text-sm mt-1">Track quality regressions and prompt improvements over time</p>
      </div>

      {/* Summary Stats */}
      {alerts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="text-xs text-gray-500 font-medium mb-1">Total Regressions</div>
            <div className="text-2xl font-bold text-gray-900">{alerts.length}</div>
          </div>
          <div className="bg-white rounded-xl border border-red-200 p-4 bg-red-50/50">
            <div className="text-xs text-red-600 font-medium mb-1">Active Issues</div>
            <div className="text-2xl font-bold text-red-700">{activeAlerts.length}</div>
          </div>
          <div className="bg-white rounded-xl border border-red-300 p-4 bg-red-100/50">
            <div className="text-xs text-red-700 font-medium mb-1">Critical</div>
            <div className="text-2xl font-bold text-red-800">{criticalAlerts.length}</div>
          </div>
          <div className="bg-white rounded-xl border border-green-200 p-4 bg-green-50/50">
            <div className="text-xs text-green-600 font-medium mb-1">Fixed</div>
            <div className="text-2xl font-bold text-green-700">{fixedAlerts.length}</div>
          </div>
        </div>
      )}

      {alerts.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <AlertTriangle size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 mb-2">No regressions detected yet</p>
          <p className="text-xs text-gray-400">The system automatically detects quality drops and error rate increases</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Show active alerts first, then fixed ones */}
          {[...activeAlerts, ...fixedAlerts].map(alert => {
            const prompt = prompts.find(p => p.id === alert.promptId);
            const currentVersion = prompt?.versions.find(v => v.id === alert.versionId);
            const previousVersion = alert.previousVersionId
              ? prompt?.versions.find(v => v.id === alert.previousVersionId)
              : null;
            const fixedVersion = alert.fixedVersionId
              ? prompt?.versions.find(v => v.id === alert.fixedVersionId)
              : null;
            const affectedLogs = logs.filter(l => alert.affectedLogs.includes(l.id));
            const isExpanded = expandedAlertId === alert.id;

            return (
              <div
                key={alert.id}
                className={`bg-white rounded-xl border-2 shadow-sm overflow-hidden ${
                  alert.fixed
                    ? 'border-green-200 bg-green-50/30'
                    : alert.severity === 'critical'
                    ? 'border-red-300 bg-red-50/30'
                    : alert.severity === 'high'
                    ? 'border-orange-300 bg-orange-50/30'
                    : 'border-yellow-200 bg-yellow-50/30'
                }`}
              >
                {/* Header */}
                <div
                  className="p-6 cursor-pointer hover:bg-white/50 transition-colors"
                  onClick={() => setExpandedAlertId(isExpanded ? null : alert.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <AlertTriangle
                          size={20}
                          className={
                            alert.fixed
                              ? 'text-green-600'
                              : alert.severity === 'critical'
                              ? 'text-red-600'
                              : alert.severity === 'high'
                              ? 'text-orange-600'
                              : 'text-yellow-600'
                          }
                        />
                        <h3 className="text-lg font-semibold text-gray-900">
                          Regression Detected: {getPromptName(alert.promptId)}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          alert.fixed
                            ? 'bg-green-100 text-green-800 border border-green-300'
                            : alert.severity === 'critical'
                            ? 'bg-red-100 text-red-800 border border-red-300'
                            : alert.severity === 'high'
                            ? 'bg-orange-100 text-orange-800 border border-orange-300'
                            : 'bg-yellow-100 text-yellow-800 border border-yellow-300'
                        }`}>
                          {alert.fixed ? 'FIXED' : alert.severity.toUpperCase()}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <div>
                          <span className="font-medium">Issue:</span> {alert.issue}
                        </div>
                        <div>
                          Detected: {new Date(alert.detectedAt).toLocaleString()}
                          {alert.fixed && alert.fixedAt && (
                            <span className="ml-4">
                              • Fixed: {new Date(alert.fixedAt).toLocaleString()}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-4 mt-2">
                          <div className="flex items-center space-x-1">
                            <TrendingDown size={14} className="text-red-500" />
                            <span className="text-sm font-semibold text-red-600">
                              Quality dropped by {alert.qualityDrop.toFixed(1)}%
                            </span>
                          </div>
                          {previousVersion && currentVersion && (
                            <div className="text-xs text-gray-500">
                              {getVersionNumber(alert.promptId, alert.previousVersionId || '')} → {getVersionNumber(alert.promptId, alert.versionId)}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronDown size={20} className="text-gray-400" />
                    ) : (
                      <ChevronRight size={20} className="text-gray-400" />
                    )}
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="border-t border-gray-200 bg-gray-50 p-6 space-y-6">
                    {/* Before/After Comparison with Diff View */}
                    {previousVersion && currentVersion && (() => {
                      const diffResult = computeDiff(previousVersion.template, currentVersion.template);
                      const previousQuality = Math.round(85 - alert.qualityDrop);
                      const currentQuality = Math.round(previousQuality - alert.qualityDrop);

                      return (
                        <div>
                          <div className="flex items-center justify-between mb-4">
                            <div className="text-sm font-bold text-gray-900">Prompt Changes (Diff View)</div>
                            <div className="flex items-center space-x-4 text-xs">
                              <div className="flex items-center space-x-2">
                                <div className="w-4 h-4 bg-green-200 border-2 border-green-500"></div>
                                <span className="text-gray-600">Good instructions (removed)</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <div className="w-4 h-4 bg-red-200 border-2 border-red-500"></div>
                                <span className="text-gray-600">Bad instructions (added)</span>
                              </div>
                            </div>
                          </div>

                          <div className="bg-white border-2 border-gray-300 rounded-lg overflow-hidden">
                            {/* Side-by-side diff view */}
                            <div className="grid grid-cols-2 divide-x divide-gray-300">
                              {/* Good Version (Previous) - Left Side */}
                              <div className="bg-green-50/30">
                                <div className="bg-green-100 border-b border-green-300 px-4 py-2 flex items-center justify-between">
                                  <div className="flex items-center space-x-2">
                                    <CheckCircle size={14} className="text-green-700" />
                                    <span className="text-xs font-bold text-green-800">
                                      Good Version ({getVersionNumber(alert.promptId, alert.previousVersionId || '')})
                                    </span>
                                  </div>
                                  <span className="text-xs font-semibold text-green-700">
                                    Quality: {previousQuality}%
                                  </span>
                                </div>
                                <div className="font-mono text-xs overflow-y-auto max-h-96">
                                  {diffResult.oldDiff.map((segment, idx) => (
                                    <div
                                      key={idx}
                                      className={`px-3 py-1 ${
                                        segment.type === 'removed'
                                          ? 'bg-green-200 text-green-900 border-l-4 border-green-600 font-semibold'
                                          : segment.text === ''
                                          ? 'bg-gray-50'
                                          : 'text-gray-800 bg-white'
                                      }`}
                                    >
                                      <span className="text-gray-400 text-xs mr-3 select-none w-8 inline-block">
                                        {segment.lineNumber}
                                      </span>
                                      <span className={segment.type === 'removed' ? 'font-bold' : ''}>
                                        {segment.text || '\u00A0'}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Bad Version (Current) - Right Side */}
                              <div className="bg-red-50/30">
                                <div className="bg-red-100 border-b border-red-300 px-4 py-2 flex items-center justify-between">
                                  <div className="flex items-center space-x-2">
                                    <AlertTriangle size={14} className="text-red-700" />
                                    <span className="text-xs font-bold text-red-800">
                                      Regressed Version ({getVersionNumber(alert.promptId, alert.versionId)})
                                    </span>
                                  </div>
                                  <span className="text-xs font-semibold text-red-700">
                                    Quality: {currentQuality}% ⬇
                                  </span>
                                </div>
                                <div className="font-mono text-xs overflow-y-auto max-h-96">
                                  {diffResult.newDiff.map((segment, idx) => (
                                    <div
                                      key={idx}
                                      className={`px-3 py-1 ${
                                        segment.type === 'added'
                                          ? 'bg-red-200 text-red-900 border-l-4 border-red-600 font-semibold'
                                          : segment.text === ''
                                          ? 'bg-gray-50'
                                          : 'text-gray-800 bg-white'
                                      }`}
                                    >
                                      <span className="text-gray-400 text-xs mr-3 select-none w-8 inline-block">
                                        {segment.lineNumber}
                                      </span>
                                      <span className={segment.type === 'added' ? 'font-bold' : ''}>
                                        {segment.text || '\u00A0'}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <div className="text-xs text-yellow-800">
                              <span className="font-semibold">How to read this diff:</span>
                              <ul className="list-disc list-inside mt-1 space-y-0.5">
                                <li><span className="bg-green-200 px-1 rounded font-mono">Green highlighted lines</span> = Good instructions that were removed (restore these!)</li>
                                <li><span className="bg-red-200 px-1 rounded font-mono">Red highlighted lines</span> = Bad/simplified instructions that were added (remove these!)</li>
                                <li>Normal text = Lines that stayed the same</li>
                              </ul>
                              <div className="mt-2 font-semibold">To fix: Restore the green-highlighted instructions and remove the red-highlighted ones.</div>
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* What Went Wrong */}
                    <div>
                      <div className="text-sm font-bold text-gray-900 mb-3 flex items-center">
                        <AlertTriangle size={16} className="mr-2 text-red-600" />
                        What Went Wrong
                      </div>
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="text-sm text-gray-800 space-y-2">
                          <div>
                            <span className="font-semibold">Quality Drop:</span> {alert.qualityDrop.toFixed(1)}% decrease in response quality
                          </div>
                          <div>
                            <span className="font-semibold">Affected Requests:</span> {affectedLogs.length} executions showed degraded performance
                          </div>
                          {affectedLogs.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-red-200">
                              <div className="text-xs font-semibold text-red-700 mb-2">Example Failed Outputs:</div>
                              {affectedLogs.slice(0, 3).map(log => (
                                <div key={log.id} className="text-xs text-gray-700 mb-2 p-2 bg-white rounded border border-red-100">
                                  <div className="font-mono text-gray-600 mb-1">Input: {JSON.stringify(log.inputs)}</div>
                                  <div className="text-red-700">{log.output.substring(0, 150)}...</div>
                                  {log.regressionReason && (
                                    <div className="text-xs text-red-600 mt-1 italic">Issue: {log.regressionReason}</div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Suggested Fix */}
                    {alert.suggestedFix && (
                      <div>
                        <div className="text-sm font-bold text-gray-900 mb-3 flex items-center">
                          <Lightbulb size={16} className="mr-2 text-yellow-600" />
                          Suggested Improvements
                        </div>
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                          <div className="text-sm text-gray-800 whitespace-pre-wrap">
                            {alert.suggestedFix}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Fixed Version (if applicable) */}
                    {alert.fixed && fixedVersion && (
                      <div>
                        <div className="text-sm font-bold text-gray-900 mb-3 flex items-center">
                          <CheckCircle size={16} className="mr-2 text-green-600" />
                          Fixed Version ({getVersionNumber(alert.promptId, alert.fixedVersionId || '')})
                        </div>
                        <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4">
                          <div className="text-xs font-mono text-gray-800 whitespace-pre-wrap bg-white p-3 rounded border border-green-200 max-h-64 overflow-y-auto">
                            {fixedVersion.template}
                          </div>
                          <div className="mt-3 flex items-center space-x-2">
                            <CheckCircle size={14} className="text-green-600" />
                            <span className="text-sm text-green-700 font-medium">
                              Regression fixed - quality restored
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    {!alert.fixed && currentVersion && (
                      <div className="pt-4 border-t border-gray-200">
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-gray-600">
                            Has this regression been fixed in a newer version?
                          </div>
                          <button
                            onClick={async () => {
                              // Find the latest version after the problematic one
                              const prompt = prompts.find(p => p.id === alert.promptId);
                              if (prompt) {
                                const newerVersions = prompt.versions
                                  .filter(v => {
                                    const vDate = new Date(v.createdAt).getTime();
                                    const alertDate = new Date(alert.detectedAt).getTime();
                                    return vDate > alertDate;
                                  })
                                  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

                                if (newerVersions.length > 0) {
                                  await handleMarkFixed(alert.id, newerVersions[0].id);
                                  alert('Regression marked as fixed!');
                                } else {
                                  alert('No newer version found. Create a new version first.');
                                }
                              }
                            }}
                            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium flex items-center"
                          >
                            <CheckCircle size={14} className="mr-2" />
                            Mark as Fixed
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

