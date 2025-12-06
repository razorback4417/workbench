import { Prompt, LogEntry, EvalRun, ModelType, Role } from '../types';

export const CURRENT_USER = {
  id: 'u1',
  name: 'Theo Designer',
  email: 'theo@promptworkbench.com',
  avatarUrl: 'https://picsum.photos/100/100',
  role: Role.ADMIN,
};

export const MOCK_PROMPTS: Prompt[] = [
  {
    id: 'p1',
    name: 'Customer Support Reply',
    description: 'Generates empathetic responses to customer complaints regarding shipping delays.',
    tags: ['support', 'email', 'customer-facing'],
    activeVersionId: 'v2',
    updatedAt: '2023-10-25T14:30:00Z',
    versions: [
      {
        id: 'v2',
        version: 2,
        template: "You are a helpful support agent. The customer is upset about order {{order_id}}. Apologize for the delay and offer a {{discount_percent}}% discount coupon. \n\nCustomer Message: {{customer_message}}",
        variables: ['order_id', 'discount_percent', 'customer_message'],
        model: ModelType.GEMINI_FLASH,
        temperature: 0.7,
        createdAt: '2023-10-25T14:30:00Z',
        createdBy: 'Theo Designer',
        commitMessage: 'Added discount variable for retention',
        status: 'production',
      },
      {
        id: 'v1',
        version: 1,
        template: "Write a reply to a customer complaining about their order {{order_id}}. Be polite.",
        variables: ['order_id'],
        model: ModelType.GEMINI_FLASH,
        temperature: 0.7,
        createdAt: '2023-10-20T10:00:00Z',
        createdBy: 'Theo Designer',
        commitMessage: 'Initial draft',
        status: 'archived',
      },
    ],
  },
  {
    id: 'p2',
    name: 'Product Description Generator',
    description: 'Creates SEO-optimized product descriptions from raw feature lists.',
    tags: ['marketing', 'seo', 'product'],
    activeVersionId: 'v5',
    updatedAt: '2023-10-24T09:15:00Z',
    versions: [
      {
        id: 'v5',
        version: 5,
        template: "Generate a catchy, SEO-friendly product description for a {{product_name}}. \nFeatures: {{features}}. \nTarget Audience: {{audience}}.",
        variables: ['product_name', 'features', 'audience'],
        model: ModelType.GEMINI_PRO,
        temperature: 0.9,
        createdAt: '2023-10-24T09:15:00Z',
        createdBy: 'Sarah Content',
        commitMessage: 'Switched to Pro model for better creativity',
        status: 'production',
      },
    ],
  },
  {
    id: 'p3',
    name: 'SQL Query Builder',
    description: 'Translates natural language questions into PostgreSQL queries.',
    tags: ['internal', 'tooling', 'coding'],
    activeVersionId: 'v12',
    updatedAt: '2023-10-26T11:00:00Z',
    versions: [
      {
        id: 'v12',
        version: 12,
        template: "You are a SQL expert. \nSchema: {{schema_json}} \nQuestion: {{question}} \nOutput only the SQL.",
        variables: ['schema_json', 'question'],
        model: ModelType.GEMINI_PRO,
        temperature: 0.1,
        createdAt: '2023-10-26T11:00:00Z',
        createdBy: 'Dev Team',
        status: 'staging',
      },
    ],
  },
];

export const MOCK_LOGS: LogEntry[] = Array.from({ length: 20 }).map((_, i) => ({
  id: `log-${i}`,
  promptId: i % 2 === 0 ? 'p1' : 'p2',
  versionId: i % 2 === 0 ? 'v2' : 'v5',
  timestamp: new Date(Date.now() - i * 3600000).toISOString(),
  inputs: { customer_message: "Where is my stuff?", order_id: "12345" },
  output: "I apologize for the delay...",
  latency: 400 + Math.random() * 800,
  cost: 0.001 + Math.random() * 0.005,
  tokens: 150 + Math.floor(Math.random() * 300),
  status: Math.random() > 0.9 ? 'error' : 'success',
  model: i % 2 === 0 ? ModelType.GEMINI_FLASH : ModelType.GEMINI_PRO,
}));

export const MOCK_EVALS: EvalRun[] = [
  { id: 'e1', name: 'Tone Consistency Check', date: '2023-10-26', promptVersionId: 'v2', score: 92, status: 'passed', sampleSize: 50 },
  { id: 'e2', name: 'Hallucination Detector', date: '2023-10-25', promptVersionId: 'v5', score: 88, status: 'passed', sampleSize: 100 },
  { id: 'e3', name: 'SQL Syntax Verify', date: '2023-10-24', promptVersionId: 'v11', score: 45, status: 'failed', sampleSize: 20 },
];
