import { Prompt, LogEntry, EvalRun, ModelType, Role, ABTest } from '../types';

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
  {
    id: 'p6',
    name: 'Email Subject Line Generator',
    description: 'Generates compelling email subject lines for marketing campaigns.',
    tags: ['marketing', 'email'],
    activeVersionId: 'v3',
    updatedAt: generateMockTimestamp(4, 0), // 2:00pm PT
    versions: [
      {
        id: 'v3',
        version: 3,
        template: "Create an email subject line for: {{topic}}. Make it short.",
        variables: ['topic'],
        model: ModelType.GEMINI_2_5_FLASH,
        temperature: 0.8,
        createdAt: generateMockTimestamp(4, 0), // 2:00pm PT - REGRESSED VERSION
        createdBy: 'Theo',
        commitMessage: 'Tried to make it shorter - removed context',
        status: 'production',
      },
      {
        id: 'v2',
        version: 2,
        template: "You are a marketing copywriter. Create a compelling, action-oriented email subject line for a campaign about {{topic}}. The subject should:\n1. Be 5-8 words maximum\n2. Create urgency or curiosity\n3. Include a clear value proposition\n4. Avoid spam trigger words\n\nTopic: {{topic}}",
        variables: ['topic'],
        model: ModelType.GEMINI_2_5_FLASH,
        temperature: 0.8,
        createdAt: generateMockTimestamp(3, 0), // 1:00pm PT - GOOD VERSION
        createdBy: 'Theo',
        commitMessage: 'Added detailed instructions for better results',
        status: 'archived', // Was production, archived when v3 (regressed) was deployed
      },
    ],
  },
  {
    id: 'p7',
    name: 'Code Review Assistant',
    description: 'Provides constructive code review feedback.',
    tags: ['coding', 'internal'],
    activeVersionId: 'v4',
    updatedAt: generateMockTimestamp(4, 30), // 2:30pm PT
    versions: [
      {
        id: 'v4',
        version: 4,
        template: "Review this code: {{code}}. Is it good?",
        variables: ['code'],
        model: ModelType.GEMINI_2_5_FLASH,
        temperature: 0.3,
        createdAt: generateMockTimestamp(4, 30), // 2:30pm PT - REGRESSED VERSION
        createdBy: 'Theo',
        commitMessage: 'Simplified prompt - removed structure',
        status: 'production',
      },
      {
        id: 'v3',
        version: 3,
        template: "You are a senior software engineer conducting a code review. Analyze the following code and provide constructive feedback.\n\nCode to review:\n{{code}}\n\nProvide feedback on:\n1. Code quality and best practices\n2. Potential bugs or edge cases\n3. Performance considerations\n4. Readability and maintainability\n5. Specific suggestions for improvement\n\nBe constructive and specific. Format as a numbered list.",
        variables: ['code'],
        model: ModelType.GEMINI_2_5_FLASH,
        temperature: 0.3,
        createdAt: generateMockTimestamp(3, 45), // 1:45pm PT - GOOD VERSION
        createdBy: 'Theo',
        commitMessage: 'Added structured review format',
        status: 'archived', // Was production, archived when v4 (regressed) was deployed
      },
    ],
  },
];

export const MOCK_LOGS: LogEntry[] = [
  // Regression detection examples - showing quality degradation
  {
    id: 'log-regression-1',
    promptId: 'p1',
    versionId: 'v1', // Old version before fix
    timestamp: generateMockTimestamp(0, 30), // 10:30am PT
    inputs: { customer_message: "My order is 3 weeks late! This is unacceptable!", order_id: "12345", discount_percent: "10" },
    output: "Sorry about the delay. Your order 12345 is being processed. Here's a 10% discount.",
    latency: 450,
    cost: 0.002,
    tokens: 180,
    status: 'success',
    model: ModelType.GEMINI_2_5_FLASH,
    qualityScore: 45, // Low quality - not empathetic
    regressionDetected: true,
    regressionReason: 'Response lacks empathy and proper acknowledgment of customer frustration'
  },
  {
    id: 'log-regression-2',
    promptId: 'p1',
    versionId: 'v1',
    timestamp: generateMockTimestamp(0, 45), // 10:45am PT
    inputs: { customer_message: "When will I receive my package?", order_id: "67890", discount_percent: "15" },
    output: "Order 67890 is delayed. 15% discount applied.",
    latency: 380,
    cost: 0.0015,
    tokens: 120,
    status: 'success',
    model: ModelType.GEMINI_2_5_FLASH,
    qualityScore: 50, // Low quality - too brief, no helpful info
    regressionDetected: true,
    regressionReason: 'Response too brief, missing helpful information and professional tone'
  },
  // After fix - improved version
  {
    id: 'log-improved-1',
    promptId: 'p1',
    versionId: 'v2', // Fixed version
    timestamp: generateMockTimestamp(2, 30), // 12:30pm PT
    inputs: { customer_message: "My order is 3 weeks late! This is unacceptable!", order_id: "12345", discount_percent: "10" },
    output: "I sincerely apologize for the delay with your order 12345. I understand how frustrating this must be, especially after waiting 3 weeks. As a gesture of goodwill, I'm applying a 10% discount coupon to your account. Your package is currently in transit and should arrive within 2-3 business days. I'll personally follow up to ensure it arrives. Thank you for your patience.",
    latency: 520,
    cost: 0.003,
    tokens: 220,
    status: 'success',
    model: ModelType.GEMINI_2_5_FLASH,
    qualityScore: 92, // High quality - empathetic and complete
    previousQualityScore: 45
  },
  {
    id: 'log-improved-2',
    promptId: 'p1',
    versionId: 'v2',
    timestamp: generateMockTimestamp(2, 45), // 12:45pm PT
    inputs: { customer_message: "When will I receive my package?", order_id: "67890", discount_percent: "15" },
    output: "I understand you're eager to receive your package. Let me check the status of order 67890 for you. Your package is currently in transit and expected to arrive by December 10th. As a thank you for your patience, I've applied a 15% discount to your account. Is there anything else I can help you with?",
    latency: 480,
    cost: 0.0025,
    tokens: 195,
    status: 'success',
    model: ModelType.GEMINI_2_5_FLASH,
    qualityScore: 88, // High quality - helpful and professional
    previousQualityScore: 50
  },
  // Regression logs for Email Subject Generator (p6)
  {
    id: 'log-regression-email-1',
    promptId: 'p6',
    versionId: 'v3', // Regressed version
    timestamp: generateMockTimestamp(4, 5), // 2:05pm PT
    inputs: { topic: 'Summer Sale - 50% off all items' },
    output: 'Summer Sale',
    latency: 320,
    cost: 0.001,
    tokens: 85,
    status: 'success',
    model: ModelType.GEMINI_2_5_FLASH,
    qualityScore: 40, // Low quality - too generic
    regressionDetected: true,
    regressionReason: 'Subject line too generic, missing key details and value proposition'
  },
  {
    id: 'log-regression-email-2',
    promptId: 'p6',
    versionId: 'v3',
    timestamp: generateMockTimestamp(4, 10), // 2:10pm PT
    inputs: { topic: 'New Product Launch - Revolutionary Smart Watch' },
    output: 'New Product',
    latency: 280,
    cost: 0.0008,
    tokens: 70,
    status: 'success',
    model: ModelType.GEMINI_2_5_FLASH,
    qualityScore: 35, // Very low quality
    regressionDetected: true,
    regressionReason: 'Extremely generic output, no product details or engagement'
  },
  // Good logs for previous version (v2) of Email Subject Generator
  {
    id: 'log-good-email-1',
    promptId: 'p6',
    versionId: 'v2', // Good version
    timestamp: generateMockTimestamp(3, 5), // 1:05pm PT
    inputs: { topic: 'Summer Sale - 50% off all items' },
    output: '50% Off Summer Sale - Limited Time!',
    latency: 450,
    cost: 0.0015,
    tokens: 120,
    status: 'success',
    model: ModelType.GEMINI_2_5_FLASH,
    qualityScore: 88, // High quality
  },
  {
    id: 'log-good-email-2',
    promptId: 'p6',
    versionId: 'v2',
    timestamp: generateMockTimestamp(3, 10), // 1:10pm PT
    inputs: { topic: 'New Product Launch - Revolutionary Smart Watch' },
    output: 'Revolutionary Smart Watch: See What\'s Next',
    latency: 420,
    cost: 0.0013,
    tokens: 110,
    status: 'success',
    model: ModelType.GEMINI_2_5_FLASH,
    qualityScore: 85,
  },
  // Regression logs for Code Review Assistant (p7)
  {
    id: 'log-regression-code-1',
    promptId: 'p7',
    versionId: 'v4', // Regressed version
    timestamp: generateMockTimestamp(4, 35), // 2:35pm PT
    inputs: { code: 'function add(a, b) { return a + b; }' },
    output: 'Looks good.',
    latency: 250,
    cost: 0.0005,
    tokens: 45,
    status: 'success',
    model: ModelType.GEMINI_2_5_FLASH,
    qualityScore: 20, // Very low quality - unhelpful
    regressionDetected: true,
    regressionReason: 'Response too brief, no structured feedback, no actionable suggestions'
  },
  {
    id: 'log-regression-code-2',
    promptId: 'p7',
    versionId: 'v4',
    timestamp: generateMockTimestamp(4, 40), // 2:40pm PT
    inputs: { code: 'for (let i = 0; i < arr.length; i++) { arr[i] = arr[i] * 2; }' },
    output: 'Could use map.',
    latency: 280,
    cost: 0.0006,
    tokens: 50,
    status: 'success',
    model: ModelType.GEMINI_2_5_FLASH,
    qualityScore: 30, // Low quality - vague suggestion
    regressionDetected: true,
    regressionReason: 'Suggestion too vague, no explanation or code example'
  },
  // Good logs for previous version (v3) of Code Review Assistant
  {
    id: 'log-good-code-1',
    promptId: 'p7',
    versionId: 'v3', // Good version
    timestamp: generateMockTimestamp(3, 50), // 1:50pm PT
    inputs: { code: 'function add(a, b) { return a + b; }' },
    output: '1. Code Quality: Function is clean and simple. Consider adding type hints or JSDoc comments.\n2. Potential Bugs: No input validation - could fail with non-numeric inputs.\n3. Performance: Good - O(1) operation.\n4. Readability: Clear and concise.\n5. Suggestions: Add error handling: if (typeof a !== "number" || typeof b !== "number") throw new Error("Invalid input");',
    latency: 680,
    cost: 0.002,
    tokens: 195,
    status: 'success',
    model: ModelType.GEMINI_2_5_FLASH,
    qualityScore: 90, // High quality - comprehensive
  },
  {
    id: 'log-good-code-2',
    promptId: 'p7',
    versionId: 'v3',
    timestamp: generateMockTimestamp(3, 55), // 1:55pm PT
    inputs: { code: 'for (let i = 0; i < arr.length; i++) { arr[i] = arr[i] * 2; }' },
    output: '1. Code Quality: Works but could be more functional. Consider using Array.map() for better readability.\n2. Potential Bugs: No null/undefined check for arr.\n3. Performance: O(n) - acceptable, but map() is more idiomatic.\n4. Readability: Traditional loop is less readable than functional approach.\n5. Suggestions: Replace with: const doubled = arr?.map(x => x * 2) || []; This handles edge cases and is more readable.',
    latency: 720,
    cost: 0.0022,
    tokens: 210,
    status: 'success',
    model: ModelType.GEMINI_2_5_FLASH,
    qualityScore: 92, // High quality - detailed and actionable
  },
  // More normal logs
  ...Array.from({ length: 12 }).map((_, i): LogEntry => {
    const minutesOffset = Math.floor(((i + 4) / 20) * 360);
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
      status: (Math.random() > 0.9 ? 'error' : 'success') as 'success' | 'error',
      model: i % 2 === 0 ? ModelType.GEMINI_2_5_FLASH : ModelType.GEMINI_2_0_FLASH,
      qualityScore: i % 2 === 0 ? 85 + Math.floor(Math.random() * 10) : 80 + Math.floor(Math.random() * 15),
    };
  })
];

export const MOCK_EVALS: EvalRun[] = [
  {
    id: 'e1',
    name: 'Tone Consistency Check',
    date: generateMockTimestamp(4, 0), // 2:00pm PT
    promptVersionId: 'v2',
    promptId: 'p1',
    score: 92,
    status: 'passed',
    sampleSize: 50
  },
  {
    id: 'e2',
    name: 'Hallucination Detector',
    date: generateMockTimestamp(2, 45), // 12:45pm PT
    promptVersionId: 'v5',
    promptId: 'p2',
    score: 88,
    status: 'passed',
    sampleSize: 100
  },
  {
    id: 'e3',
    name: 'SQL Syntax Verify',
    date: generateMockTimestamp(1, 30), // 11:30am PT
    promptVersionId: 'v12',
    promptId: 'p3',
    score: 45,
    status: 'failed',
    sampleSize: 20,
    results: [
      {
        input: { schema_json: '{"users": ["id", "name"]}', question: 'Get all users' },
        output: 'SELECT * FROM users;',
        score: 50,
        gradeReason: 'Query works but lacks proper error handling instructions',
        suggestions: [
          'ADD explicit validation step: "Before generating SQL, validate that schema_json is not empty and contains valid table definitions"',
          'INCLUDE error handling instruction: "If schema is invalid or empty, return error message: \'ERROR: Invalid schema provided\' instead of generating query"',
          'SPECIFY output format: "When schema validation fails, output must start with \'ERROR:\' followed by specific reason"'
        ]
      },
      {
        input: { schema_json: '{}', question: 'Find users' },
        output: 'SELECT * FROM users;',
        score: 30,
        gradeReason: 'Generated query without schema validation - will fail',
        suggestions: [
          'ADD validation check: "If schema_json is empty object {}, return error instead of attempting to generate query"',
          'INCLUDE fallback instruction: "When schema is missing required tables, suggest what schema information is needed"',
          'SPECIFY error format: "Error responses must follow format: \'ERROR: [specific reason] - [what information is needed]\'"'
        ]
      }
    ],
    improvementSuggestions: [
      'ADD explicit validation step at the beginning: "STEP 1: Validate schema_json. If empty or invalid, return \'ERROR: Invalid schema\' and stop."',
      'INCLUDE error handling pattern: "For edge cases (empty schema, invalid questions), return structured error: \'ERROR: [reason] - [required info]\'"',
      'SPECIFY: "Never guess or generate queries when input is invalid - always return clear error messages"',
      'ADD output format requirement: "Valid queries: SQL statement. Invalid inputs: \'ERROR: [specific issue]\'"',
      'INCLUDE examples in prompt: "Example valid input: {\'schema_json\': \'{\"users\": [...]}\', \'question\': \'...\'}. Example invalid: {\'schema_json\': \'{}\', \'question\': \'...\'} → Output: \'ERROR: Schema is empty\'"'
    ]
  },
  {
    id: 'e4',
    name: 'Email Subject Quality Test',
    date: generateMockTimestamp(4, 15), // 2:15pm PT
    promptVersionId: 'v3',
    promptId: 'p6',
    score: 58,
    status: 'failed',
    sampleSize: 10,
    results: [
      {
        input: { topic: 'Summer Sale - 50% off all items' },
        output: 'Summer Sale',
        score: 40,
        gradeReason: 'Too generic, lacks urgency and value proposition. Missing key details like discount percentage.',
        suggestions: [
          'ADD explicit instruction: "Extract and include specific numbers and percentages from the topic (e.g., \'50% off\' not just \'Sale\')"',
          'INCLUDE requirement: "Subject lines must create urgency by mentioning deadlines, limited quantities, or time-sensitive offers"',
          'SPECIFY: "Always include at least 2-3 key details from the topic in the subject line"'
        ]
      },
      {
        input: { topic: 'New Product Launch - Revolutionary Smart Watch' },
        output: 'New Product',
        score: 35,
        gradeReason: 'Extremely generic, no curiosity or value. Missing product name and unique selling point.',
        suggestions: [
          'ADD requirement: "Include the product name and at least one unique selling point from the topic"',
          'INCLUDE instruction: "Create curiosity by hinting at benefits without revealing everything (e.g., \'Revolutionary Smart Watch\' not just \'New Product\')"',
          'SPECIFY: "Subject lines must be informative - generic responses like \'New Product\' are unacceptable"'
        ]
      },
      {
        input: { topic: 'Account Security Alert' },
        output: 'Security',
        score: 50,
        gradeReason: 'Too brief, lacks context. Could be mistaken for spam. Missing urgency indicator.',
        suggestions: [
          'ADD instruction: "For security-related topics, include context (e.g., \'Account Security Alert: Unusual Login\' not just \'Security\')"',
          'SPECIFY minimum length: "Subject lines must be 5-8 words - single word responses are too vague"',
          'REQUIRE: "Use action-oriented language that prompts immediate attention (e.g., \'Action Required\' or \'Please Verify\')"'
        ]
      }
    ],
    improvementSuggestions: [
      'RESTORE structured format requirement: "Subject lines must be 5-8 words, include urgency indicators, and clearly state value proposition"',
      'ADD explicit extraction instruction: "Extract and include specific details from topic: discount percentages, product names, dates, key benefits"',
      'INCLUDE examples directly in prompt template: "GOOD: \'Summer Sale: 50% Off Ends July 31st\' | BAD: \'Summer Sale\' or \'New Product\'"',
      'SPECIFY rejection criteria: "Generic responses (single words, generic phrases) are unacceptable - always include specific details"',
      'ADD spam avoidance rule: "Avoid spam trigger words (\'Free\', \'Act Now\', \'Limited Time\') unless contextually appropriate and necessary"'
    ]
  },
  {
    id: 'e5',
    name: 'Code Review Quality Assessment',
    date: generateMockTimestamp(4, 45), // 2:45pm PT
    promptVersionId: 'v4',
    promptId: 'p7',
    score: 42,
    status: 'failed',
    sampleSize: 8,
    results: [
      {
        input: { code: 'function add(a, b) { return a + b; }' },
        output: 'Looks good.',
        score: 20,
        gradeReason: 'Response is too brief and unhelpful. No specific feedback, no actionable suggestions, no structured analysis.',
        suggestions: [
          'Add requirement for structured feedback format',
          'Specify minimum detail level (at least 3-5 points)',
          'Require specific, actionable suggestions'
        ]
      },
      {
        input: { code: 'for (let i = 0; i < arr.length; i++) { arr[i] = arr[i] * 2; }' },
        output: 'Could use map.',
        score: 30,
        gradeReason: 'Suggestion is too vague. No explanation of why, no code example, no consideration of edge cases.',
        suggestions: [
          'Require explanations for all suggestions',
          'Add instruction to provide code examples when suggesting improvements',
          'Specify format: numbered list with explanations'
        ]
      },
      {
        input: { code: 'const user = users.find(u => u.id === userId); user.email = newEmail;' },
        output: 'Looks fine.',
        score: 25,
        gradeReason: 'Missed critical null reference error. No defensive programming suggestions. No immutability concerns addressed.',
        suggestions: [
          'ADD requirement: "Always check for null/undefined before accessing properties"',
          'INCLUDE instruction: "Suggest defensive programming patterns (optional chaining, null checks)"',
          'SPECIFY: "Flag potential runtime errors even if code looks syntactically correct"'
        ]
      },
      {
        input: { code: 'async function fetchData(url) { const response = await fetch(url); return response.json(); }' },
        output: 'Missing error handling.',
        score: 40,
        gradeReason: 'Identified issue but no actionable solution provided. Missing code examples, security considerations, and timeout handling.',
        suggestions: [
          'REQUIRE: "For each issue identified, provide complete code example showing the fix"',
          'ADD instruction: "Include error handling patterns (try-catch, error boundaries)"',
          'SPECIFY: "Address security, performance, and reliability concerns with concrete examples"'
        ]
      }
    ],
    improvementSuggestions: [
      'RESTORE mandatory structure: "Format review as: 1. Code Quality & Best Practices, 2. Potential Bugs & Edge Cases, 3. Performance Considerations, 4. Readability & Maintainability, 5. Actionable Improvement Suggestions"',
      'ADD requirement: "Each section must have at least 2-3 specific points with explanations - single sentence responses are unacceptable"',
      'INCLUDE code example requirement: "When suggesting improvements, provide before/after code examples showing the fix"',
      'SPECIFY minimum detail: "Reviews must be comprehensive (200+ words for non-trivial code) - brief responses like \'Looks good\' are not acceptable"',
      'ADD few-shot examples: "Example good review: [structured format with sections, explanations, code examples]. Example bad review: \'Looks good.\' - too brief"'
    ]
  },
];

// Helper to generate timestamps for December 6, 2025 between 3pm-4pm PT
const generateABTestTimestamp = (minuteOffset: number = 0): string => {
  // December 6, 2025, 3:00 PM PT = 23:00 UTC (PST) or 22:00 UTC (PDT)
  // Using PST for simplicity: 3pm PT = 23:00 UTC
  const date = new Date(Date.UTC(2025, 11, 6, 23, minuteOffset)); // Month is 0-indexed, so 11 = December
  return date.toISOString();
};

// Generate logs for A/B test between 3pm-4pm PT on December 6, 2025
const generateABTestLogs = (): LogEntry[] => {
  const logs: LogEntry[] = [];

  // Variant 1: Good Support Prompt (p4, v1) - 50% traffic
  // Variant 2: Bad Support Prompt (p5, v1) - 50% traffic

  // Generate 30 requests distributed over the hour
  for (let i = 0; i < 30; i++) {
    const minuteOffset = Math.floor((i / 30) * 60); // Distribute over 60 minutes
    const isVariant1 = i % 2 === 0; // 50/50 split
    const variant = isVariant1 ? { promptId: 'p4', versionId: 'v1' } : { promptId: 'p5', versionId: 'v1' };

    // Variant 1 (good) has better success rate and quality
    // Use deterministic success based on index for consistent demo data
    // Variant 1: 93% success (14/15 succeed, 1 fail)
    // Variant 2: 73% success (11/15 succeed, 4 fail)
    const isSuccess = isVariant1
      ? i !== 8  // Variant 1: fail on index 8 (1 out of 15)
      : i !== 3 && i !== 7 && i !== 13 && i !== 19; // Variant 2: fail on indices 3, 7, 13, 19 (4 out of 15)
    const latency = isVariant1
      ? 450 + (i % 15) * 10  // Good prompt: 450-590ms (deterministic)
      : 380 + (i % 20) * 10; // Bad prompt: 380-570ms (deterministic)

    const customerMessages = [
      "My order is 3 weeks late! This is unacceptable!",
      "When will I receive my package?",
      "I haven't received my refund yet.",
      "The product I received is damaged.",
      "Can you help me track my order?"
    ];

    const orderIds = ["12345", "67890", "11111", "22222", "33333"];
    const discountPercents = ["10", "15", "20"];

    // Use deterministic selection based on index for consistent demo data
    const customerMessage = customerMessages[i % customerMessages.length];
    const orderId = orderIds[i % orderIds.length];
    const discountPercent = discountPercents[i % discountPercents.length];

    let output: string;
    if (isVariant1) {
      // Good support prompt output
      output = isSuccess
        ? `I sincerely apologize for the delay with your order ${orderId}. I understand how frustrating this must be, especially after waiting 3 weeks. As a gesture of goodwill, I'm applying a ${discountPercent}% discount coupon to your account. Your package is currently in transit and should arrive within 2-3 business days. I'll personally follow up to ensure it arrives. Thank you for your patience.`
        : `Error: Rate limit exceeded. Please try again in a moment.`;
    } else {
      // Bad support prompt output
      output = isSuccess
        ? `Sorry about order ${orderId}. Here's a ${discountPercent}% discount.`
        : `Error: Invalid request format.`;
    }

    logs.push({
      id: `ab-log-${i}`,
      promptId: variant.promptId,
      versionId: variant.versionId,
      timestamp: generateABTestTimestamp(minuteOffset),
      inputs: {
        customer_message: customerMessage,
        order_id: orderId,
        discount_percent: discountPercent
      },
      output: output,
      latency: Math.round(latency),
      cost: 0.001 + (i % 10) * 0.0003, // Deterministic cost
      tokens: isVariant1 ? 180 + (i % 50) : 80 + (i % 30), // Deterministic tokens
      status: isSuccess ? 'success' : 'error',
      model: ModelType.GEMINI_2_5_FLASH
    });
  }

  return logs;
};

export const MOCK_AB_TESTS: ABTest[] = [
  {
    id: 'ab-test-1',
    name: 'Support Prompt: Empathy vs Efficiency',
    description: 'Testing empathetic, detailed responses (v2) vs concise, efficient responses (v1) to measure customer satisfaction, resolution time, and cost per interaction. Business goal: Find optimal balance between customer experience and operational efficiency.',
    variants: [
      {
        promptId: 'p1', // Customer Support Reply
        versionId: 'v2', // Empathetic version with detailed structure
        weight: 50
      },
      {
        promptId: 'p1',
        versionId: 'v1', // Concise version
        weight: 50
      }
    ],
    status: 'completed',
    startDate: generateABTestTimestamp(0), // 3:00 PM PT
    endDate: generateABTestTimestamp(60), // 4:00 PM PT
    metrics: {
      totalRequests: 60,
      successRate: 85,
      avgLatency: 485,
      avgCost: 0.002,
      errorRate: 15
    },
    winnerVariantId: '0' // Variant 1 (empathetic) won - higher satisfaction despite higher cost
  },
  {
    id: 'ab-test-2',
    name: 'Temperature Optimization: Creative vs Precise',
    description: 'Testing temperature 0.9 (creative) vs 0.3 (precise) for product descriptions to measure SEO quality, engagement metrics, and conversion rates. Hypothesis: Higher creativity may improve engagement but reduce SEO consistency.',
    variants: [
      {
        promptId: 'p2', // Product Description Generator
        versionId: 'v5', // Current version with temp 0.9
        weight: 50
      },
      {
        promptId: 'p2',
        versionId: 'v5', // Same prompt, but we'd test with temp 0.3
        weight: 50
      }
    ],
    status: 'running',
    startDate: generateMockTimestamp(0, 30), // 10:30am PT today
    metrics: {
      totalRequests: 42,
      successRate: 95,
      avgLatency: 520,
      avgCost: 0.003,
      errorRate: 5
    }
  },
  {
    id: 'ab-test-3',
    name: 'Email Subject Lines: Specificity Test',
    description: 'Comparing detailed instructions (v2) that require specific numbers/details vs simplified version (v3) to measure open rates and click-through rates. Business metric: Email campaign performance.',
    variants: [
      {
        promptId: 'p6', // Email Subject Line Generator
        versionId: 'v2', // Detailed instructions version
        weight: 50
      },
      {
        promptId: 'p6',
        versionId: 'v3', // Simplified version
        weight: 50
      }
    ],
    status: 'running',
    startDate: generateMockTimestamp(0, 15), // 10:15am PT today
    metrics: {
      totalRequests: 38,
      successRate: 92,
      avgLatency: 480,
      avgCost: 0.0025,
      errorRate: 8
    }
  },
  {
    id: 'ab-test-4',
    name: 'Code Review: Structured vs Conversational',
    description: 'Testing structured format (v3) with numbered sections vs conversational style (v4) to measure developer satisfaction, code quality improvements, and review completion time. Goal: Optimize for actionable feedback.',
    variants: [
      {
        promptId: 'p7', // Code Review Assistant
        versionId: 'v3', // Structured format
        weight: 60
      },
      {
        promptId: 'p7',
        versionId: 'v4', // Conversational/simplified
        weight: 40
      }
    ],
    status: 'completed',
    startDate: generateMockTimestamp(1, 0), // 11:00am PT
    endDate: generateMockTimestamp(3, 0), // 1:00pm PT
    metrics: {
      totalRequests: 45,
      successRate: 88,
      avgLatency: 650,
      avgCost: 0.0035,
      errorRate: 12
    },
    winnerVariantId: '0' // Structured format won - developers found it more actionable
  },
  {
    id: 'ab-test-5',
    name: 'SQL Query: Safety vs Flexibility',
    description: 'Testing prompt with strict safety constraints (v12) vs more flexible version (v11) to measure query correctness, security (SQL injection prevention), and developer productivity. Critical for production systems.',
    variants: [
      {
        promptId: 'p3', // SQL Query Builder
        versionId: 'v12', // Current safe version
        weight: 50
      },
      {
        promptId: 'p3',
        versionId: 'v11', // Previous more flexible version
        weight: 50
      }
    ],
    status: 'draft',
    startDate: generateMockTimestamp(2, 0), // 12:00pm PT
    metrics: {
      totalRequests: 0,
      successRate: 0,
      avgLatency: 0,
      avgCost: 0,
      errorRate: 0
    }
  },
  {
    id: 'ab-test-6',
    name: 'Multi-Variant: Prompt Length Optimization',
    description: 'Testing 3 variants: Full prompt (v5), Medium (v4), Concise (v3) for product descriptions to find optimal balance between quality, cost, and latency. Business goal: Reduce token costs by 20% without quality loss.',
    variants: [
      {
        promptId: 'p2', // Product Description Generator
        versionId: 'v5', // Full version
        weight: 33
      },
      {
        promptId: 'p2',
        versionId: 'v4', // Medium version (hypothetical)
        weight: 33
      },
      {
        promptId: 'p2',
        versionId: 'v3', // Concise version (hypothetical)
        weight: 34
      }
    ],
    status: 'running',
    startDate: generateMockTimestamp(0, 0), // 10:00am PT today
    metrics: {
      totalRequests: 78,
      successRate: 94,
      avgLatency: 450,
      avgCost: 0.0022,
      errorRate: 6
    }
  },
  {
    id: 'ab-test-7',
    name: 'Customer Support: Formal vs Friendly Tone',
    description: 'Testing formal professional tone (v3) vs friendly conversational tone (v2) for customer support to measure customer satisfaction, resolution rate, and brand perception. Hypothesis: Friendly tone may improve satisfaction but formal tone may be more trusted for serious issues.',
    variants: [
      {
        promptId: 'p1',
        versionId: 'v3', // Formal version
        weight: 50
      },
      {
        promptId: 'p1',
        versionId: 'v2', // Friendly version
        weight: 50
      }
    ],
    status: 'completed',
    startDate: generateMockTimestamp(2, 30), // 12:30pm PT
    endDate: generateMockTimestamp(4, 30), // 2:30pm PT
    metrics: {
      totalRequests: 120,
      successRate: 91,
      avgLatency: 520,
      avgCost: 0.0028,
      errorRate: 9
    },
    winnerVariantId: '1' // Friendly tone won - higher customer satisfaction scores
  },
  {
    id: 'ab-test-8',
    name: 'Product Descriptions: Feature-Focused vs Benefit-Focused',
    description: 'Testing technical feature-focused descriptions (v6) vs emotional benefit-focused descriptions (v5) to measure conversion rates, engagement time, and purchase intent. Business goal: Optimize for highest conversion.',
    variants: [
      {
        promptId: 'p2',
        versionId: 'v6', // Feature-focused
        weight: 50
      },
      {
        promptId: 'p2',
        versionId: 'v5', // Benefit-focused
        weight: 50
      }
    ],
    status: 'running',
    startDate: generateMockTimestamp(1, 15), // 11:15am PT today
    metrics: {
      totalRequests: 95,
      successRate: 96,
      avgLatency: 480,
      avgCost: 0.0031,
      errorRate: 4
    }
  },
  {
    id: 'ab-test-9',
    name: 'Code Review: Detailed vs Quick Feedback',
    description: 'Testing comprehensive detailed reviews (v3) vs quick actionable feedback (v5) to measure developer productivity, code quality improvement, and review cycle time. Goal: Find balance between thoroughness and speed.',
    variants: [
      {
        promptId: 'p7',
        versionId: 'v3', // Detailed
        weight: 40
      },
      {
        promptId: 'p7',
        versionId: 'v5', // Quick feedback
        weight: 60
      }
    ],
    status: 'running',
    startDate: generateMockTimestamp(0, 45), // 10:45am PT today
    metrics: {
      totalRequests: 67,
      successRate: 90,
      avgLatency: 720,
      avgCost: 0.0042,
      errorRate: 10
    }
  },
  {
    id: 'ab-test-10',
    name: 'Email Subject: Urgency vs Value Proposition',
    description: 'Testing urgency-focused subject lines (v4) vs value proposition-focused (v2) to measure open rates, click-through rates, and conversion. Business metric: Email marketing performance.',
    variants: [
      {
        promptId: 'p6',
        versionId: 'v4', // Urgency-focused
        weight: 50
      },
      {
        promptId: 'p6',
        versionId: 'v2', // Value-focused
        weight: 50
      }
    ],
    status: 'completed',
    startDate: generateMockTimestamp(3, 15), // 1:15pm PT
    endDate: generateMockTimestamp(5, 15), // 3:15pm PT
    metrics: {
      totalRequests: 150,
      successRate: 93,
      avgLatency: 460,
      avgCost: 0.0023,
      errorRate: 7
    },
    winnerVariantId: '1' // Value proposition won - higher long-term engagement
  },
  {
    id: 'ab-test-11',
    name: 'SQL Query: Verbose vs Concise Instructions',
    description: 'Testing detailed step-by-step instructions (v14) vs concise directive instructions (v13) to measure query accuracy, generation time, and developer preference. Critical for developer productivity.',
    variants: [
      {
        promptId: 'p3',
        versionId: 'v14', // Verbose instructions
        weight: 50
      },
      {
        promptId: 'p3',
        versionId: 'v13', // Concise instructions
        weight: 50
      }
    ],
    status: 'draft',
    startDate: generateMockTimestamp(4, 0), // 2:00pm PT
    metrics: {
      totalRequests: 0,
      successRate: 0,
      avgLatency: 0,
      avgCost: 0,
      errorRate: 0
    }
  }
];

export const MOCK_AB_TEST_LOGS = generateABTestLogs();
