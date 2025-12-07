import { Prompt, LogEntry, EvalRun, ModelType, Role } from '../types';

export const CURRENT_USER = {
  id: 'u1',
  name: 'Theo',
  email: 'theo@promptworkbench.com',
  avatarUrl: 'https://picsum.photos/100/100',
  role: Role.ADMIN,
};

// Helper to generate timestamps for today between 10am-4pm PT
const generateMockTimestamp = (hourOffset: number = 0, minuteOffset: number = 0): string => {
  // Get today's date
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const day = today.getDate();

  // 10:00 AM PT = 18:00 UTC (during PST) or 17:00 UTC (during PDT)
  // For simplicity, we'll use PST offset (UTC-8) = 18:00 UTC
  // 4pm PT = 23:00 UTC (PST) or 22:00 UTC (PDT)
  // We'll use 18:00 UTC as base (10am PT in PST)
  const baseDate = new Date(Date.UTC(year, month, day, 18 + hourOffset, minuteOffset));
  return baseDate.toISOString();
};

export const MOCK_PROMPTS: Prompt[] = [
  {
    id: 'p1',
    name: 'Customer Support Reply',
    description: 'Generates empathetic responses to customer complaints regarding shipping delays.',
    tags: ['support', 'email', 'customer-facing'],
    activeVersionId: 'v2',
    updatedAt: generateMockTimestamp(2, 30), // 12:30pm PT
    versions: [
      {
        id: 'v2',
        version: 2,
        template: "You are a helpful support agent. The customer is upset about order {{order_id}}. Apologize for the delay and offer a {{discount_percent}}% discount coupon. \n\nCustomer Message: {{customer_message}}",
        variables: ['order_id', 'discount_percent', 'customer_message'],
        model: ModelType.GEMINI_2_5_FLASH,
        temperature: 0.7,
        createdAt: generateMockTimestamp(2, 30), // 12:30pm PT
        createdBy: 'Theo',
        commitMessage: 'Added discount variable for retention',
        status: 'production',
      },
      {
        id: 'v1',
        version: 1,
        template: "Write a reply to a customer complaining about their order {{order_id}}. Be polite.",
        variables: ['order_id'],
        model: ModelType.GEMINI_2_5_FLASH,
        temperature: 0.7,
        createdAt: generateMockTimestamp(0, 15), // 10:15am PT
        createdBy: 'Theo',
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
    updatedAt: generateMockTimestamp(1, 15), // 11:15am PT
    versions: [
      {
        id: 'v5',
        version: 5,
        template: "Generate a catchy, SEO-friendly product description for a {{product_name}}. \nFeatures: {{features}}. \nTarget Audience: {{audience}}.",
        variables: ['product_name', 'features', 'audience'],
        model: ModelType.GEMINI_2_5_FLASH,
        temperature: 0.9,
        createdAt: generateMockTimestamp(1, 15), // 11:15am PT
        createdBy: 'Theo',
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
    updatedAt: generateMockTimestamp(3, 0), // 1:00pm PT
    versions: [
      {
        id: 'v12',
        version: 12,
        template: "You are a SQL expert. \nSchema: {{schema_json}} \nQuestion: {{question}} \nOutput only the SQL.",
        variables: ['schema_json', 'question'],
        model: ModelType.GEMINI_2_5_FLASH,
        temperature: 0.1,
        createdAt: generateMockTimestamp(3, 0), // 1:00pm PT
        createdBy: 'Theo',
        status: 'staging',
      },
    ],
  },
  {
    id: 'p4',
    name: 'Good Support Prompt (Example)',
    description: 'Example of a well-structured support prompt with clear instructions and empathy.',
    tags: ['example', 'good', 'support'],
    activeVersionId: 'v1',
    updatedAt: generateMockTimestamp(3, 30), // 1:30pm PT
    versions: [
      {
        id: 'v1',
        version: 1,
        template: "You are a professional customer support agent. Your goal is to resolve the customer's issue while maintaining a warm, empathetic tone.\n\nCustomer's concern: {{customer_message}}\nOrder ID: {{order_id}}\n\nInstructions:\n1. Acknowledge the customer's frustration or concern\n2. Apologize sincerely if there was an error on our part\n3. Provide a clear solution or next steps\n4. Offer a {{discount_percent}}% discount as a goodwill gesture\n5. End with a commitment to follow up\n\nKeep the response concise (2-3 sentences) but complete.",
        variables: ['customer_message', 'order_id', 'discount_percent'],
        model: ModelType.GEMINI_2_5_FLASH,
        temperature: 0.7,
        createdAt: generateMockTimestamp(3, 30), // 1:30pm PT
        createdBy: 'Theo',
        commitMessage: 'Example of good prompt structure',
        status: 'production',
      },
    ],
  },
  {
    id: 'p5',
    name: 'Bad Support Prompt (Example)',
    description: 'Example of a poorly structured prompt - vague, no context, no clear instructions.',
    tags: ['example', 'bad', 'support'],
    activeVersionId: 'v1',
    updatedAt: generateMockTimestamp(3, 45), // 1:45pm PT
    versions: [
      {
        id: 'v1',
        version: 1,
        template: "Reply to customer. Order {{order_id}}. Message: {{customer_message}}",
        variables: ['order_id', 'customer_message'],
        model: ModelType.GEMINI_2_5_FLASH,
        temperature: 0.7,
        createdAt: generateMockTimestamp(3, 45), // 1:45pm PT
        createdBy: 'Theo',
        commitMessage: 'Example of bad prompt - too vague',
        status: 'draft',
      },
    ],
  },
];

export const MOCK_LOGS: LogEntry[] = Array.from({ length: 20 }).map((_, i) => {
  // Distribute logs across Dec 6, 2025 10am-4pm PT (6 hours = 360 minutes)
  const minutesOffset = Math.floor((i / 20) * 360); // Spread evenly across 6 hours
  const hourOffset = Math.floor(minutesOffset / 60);
  const minuteOffset = minutesOffset % 60;

  return {
    id: `log-${i}`,
    promptId: i % 2 === 0 ? 'p1' : 'p2',
    versionId: i % 2 === 0 ? 'v2' : 'v5',
    timestamp: generateMockTimestamp(hourOffset, minuteOffset),
    inputs: i % 2 === 0
      ? { customer_message: "Where is my stuff?", order_id: "12345", discount_percent: "10" }
      : { product_name: "Wireless Headphones", features: "Noise cancelling, 30hr battery", audience: "Tech enthusiasts" },
    output: i % 2 === 0
      ? "I sincerely apologize for the delay with your order 12345. I understand how frustrating this must be. As a gesture of goodwill, I'm applying a 10% discount coupon to your account. Your package is currently in transit and should arrive within 2-3 business days. Thank you for your patience."
      : "Introducing our premium Wireless Headphones - the perfect companion for tech enthusiasts who demand excellence. Featuring advanced noise cancellation technology, an impressive 30-hour battery life, and cutting-edge Bluetooth connectivity, these headphones deliver an unparalleled audio experience.",
    latency: 400 + Math.random() * 800,
    cost: 0.001 + Math.random() * 0.005,
    tokens: 150 + Math.floor(Math.random() * 300),
    status: Math.random() > 0.9 ? 'error' : 'success',
    model: i % 2 === 0 ? ModelType.GEMINI_2_5_FLASH : ModelType.GEMINI_2_0_FLASH,
  };
});

export const MOCK_EVALS: EvalRun[] = [
  {
    id: 'e1',
    name: 'Tone Consistency Check',
    date: generateMockTimestamp(4, 0), // 2:00pm PT
    promptVersionId: 'v2',
    score: 92,
    status: 'passed',
    sampleSize: 50
  },
  {
    id: 'e2',
    name: 'Hallucination Detector',
    date: generateMockTimestamp(2, 45), // 12:45pm PT
    promptVersionId: 'v5',
    score: 88,
    status: 'passed',
    sampleSize: 100
  },
  {
    id: 'e3',
    name: 'SQL Syntax Verify',
    date: generateMockTimestamp(1, 30), // 11:30am PT
    promptVersionId: 'v12',
    score: 45,
    status: 'failed',
    sampleSize: 20
  },
];
