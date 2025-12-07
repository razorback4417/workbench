import { LogEntry, Prompt, PromptVersion } from '../types';
import { storage } from './storage';
import { evaluateResponse } from './llmService';

export interface RegressionAlert {
  id: string;
  promptId: string;
  versionId: string;
  detectedAt: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  issue: string;
  previousVersionId?: string;
  qualityDrop: number; // Percentage drop
  affectedLogs: string[]; // Log IDs
  suggestedFix?: string;
  fixed?: boolean;
  fixedAt?: string;
  fixedVersionId?: string;
}

// Detect regression by comparing current version performance with previous
export const detectRegression = async (
  promptId: string,
  versionId: string,
  newLog: LogEntry
): Promise<RegressionAlert | null> => {
  const prompt = await storage.getPromptById(promptId);
  if (!prompt) return null;

  const currentVersion = prompt.versions.find(v => v.id === versionId);
  if (!currentVersion) return null;

  // Get previous production version for comparison
  // If current version is production, compare with previous production version
  // Otherwise, compare with the most recent production version
  const previousVersion = currentVersion.status === 'production'
    ? prompt.versions
        .filter(v => v.status === 'production' && v.id !== versionId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
    : prompt.versions
        .filter(v => v.status === 'production')
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

  if (!previousVersion) return null;

  // Get recent logs for both versions
  const allLogs = await storage.getLogs();
  const currentLogs = allLogs.filter(
    l => l.promptId === promptId && l.versionId === versionId
  ).slice(0, 10);
  const previousLogs = allLogs.filter(
    l => l.promptId === promptId && l.versionId === previousVersion.id
  ).slice(0, 10);

  if (currentLogs.length < 3 || previousLogs.length < 3) return null;

  // Calculate quality metrics
  const currentQuality = currentLogs.reduce((sum, l) => sum + (l.qualityScore || 70), 0) / currentLogs.length;
  const previousQuality = previousLogs.reduce((sum, l) => sum + (l.qualityScore || 80), 0) / previousLogs.length;
  const qualityDrop = previousQuality - currentQuality;

  // Calculate error rates
  const currentErrorRate = (currentLogs.filter(l => l.status === 'error').length / currentLogs.length) * 100;
  const previousErrorRate = (previousLogs.filter(l => l.status === 'error').length / previousLogs.length) * 100;
  const errorRateIncrease = currentErrorRate - previousErrorRate;

  // Detect regression if quality dropped significantly or error rate increased
  if (qualityDrop > 10 || errorRateIncrease > 15) {
    const severity = qualityDrop > 20 || errorRateIncrease > 30 ? 'critical' :
                     qualityDrop > 15 || errorRateIncrease > 20 ? 'high' :
                     qualityDrop > 10 || errorRateIncrease > 15 ? 'medium' : 'low';

    // Generate suggested fix
    let suggestedFix = '';
    try {
      const fixPrompt = `
Analyze this prompt regression and suggest a fix.

Previous Version (v${previousVersion.version}):
"""
${previousVersion.template}
"""

Current Version (v${currentVersion.version}):
"""
${currentVersion.template}
"""

Quality dropped by ${qualityDrop.toFixed(1)} points. Error rate increased by ${errorRateIncrease.toFixed(1)}%.

Recent failed outputs:
${currentLogs.filter(l => l.status === 'error').slice(0, 3).map(l => `- ${l.output.substring(0, 100)}`).join('\n')}

Provide 2-3 specific, actionable suggestions to fix this regression. Focus on what changed that might have caused the quality drop.
`;

      const ai = await import('@google/genai').then(m => m.GoogleGenAI);
      const apiKey = await storage.getApiKey('gemini');
      if (apiKey) {
        const genai = new ai({ apiKey });
        const response = await genai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: fixPrompt,
          config: {
            responseMimeType: 'text/plain',
            temperature: 0.5
          }
        });
        suggestedFix = response.text || '';
      }
    } catch (e) {
      console.error('Failed to generate fix suggestion:', e);
    }

    const alert: RegressionAlert = {
      id: `regression-${Date.now()}`,
      promptId,
      versionId,
      detectedAt: new Date().toISOString(),
      severity,
      issue: qualityDrop > 10
        ? `Quality dropped by ${qualityDrop.toFixed(1)}% compared to previous version`
        : `Error rate increased by ${errorRateIncrease.toFixed(1)}% compared to previous version`,
      previousVersionId: previousVersion.id,
      qualityDrop,
      affectedLogs: currentLogs.map(l => l.id),
      suggestedFix: suggestedFix || undefined
    };

    return alert;
  }

  return null;
};

// Get all regression alerts
export const getRegressionAlerts = async (): Promise<RegressionAlert[]> => {
  const STORAGE_KEY = 'pw_regression_alerts';
  const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  const { MOCK_REGRESSION_ALERTS } = await import('./mockRegressionAlerts');

  // Merge new mock data with existing (add new ones that don't exist)
  const existingIds = new Set(stored.map((a: RegressionAlert) => a.id));
  const newAlerts = MOCK_REGRESSION_ALERTS.filter(a => !existingIds.has(a.id));

  if (newAlerts.length > 0 || stored.length === 0) {
    const merged = [...newAlerts, ...stored];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    return merged.sort((a: RegressionAlert, b: RegressionAlert) =>
      new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime()
    );
  }

  return stored.sort((a: RegressionAlert, b: RegressionAlert) =>
    new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime()
  );
};

// Save regression alert
export const saveRegressionAlert = async (alert: RegressionAlert): Promise<void> => {
  const STORAGE_KEY = 'pw_regression_alerts';
  const alerts = await getRegressionAlerts();
  const index = alerts.findIndex(a => a.id === alert.id);
  if (index !== -1) {
    alerts[index] = alert;
  } else {
    alerts.push(alert);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(alerts));
};

// Mark regression as fixed
export const markRegressionFixed = async (
  alertId: string,
  fixedVersionId: string
): Promise<void> => {
  const alerts = await getRegressionAlerts();
  const alert = alerts.find(a => a.id === alertId);
  if (alert) {
    alert.fixed = true;
    alert.fixedAt = new Date().toISOString();
    alert.fixedVersionId = fixedVersionId;
    await saveRegressionAlert(alert);
  }
};

