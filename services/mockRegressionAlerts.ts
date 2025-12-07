import { RegressionAlert } from './regressionService';

// Helper to generate timestamps for today between 10am-4pm PT
const generateMockTimestamp = (hourOffset: number = 0, minuteOffset: number = 0): string => {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const day = today.getDate();
  const baseDate = new Date(Date.UTC(year, month, day, 18 + hourOffset, minuteOffset));
  return baseDate.toISOString();
};

export const MOCK_REGRESSION_ALERTS: RegressionAlert[] = [
  {
    id: 'regression-1',
    promptId: 'p1',
    versionId: 'v1',
    detectedAt: generateMockTimestamp(1, 0), // 11:00am PT
    severity: 'high',
    issue: 'Quality dropped by 47.5% - responses lack empathy and fail to address customer concerns',
    previousVersionId: 'v0', // Hypothetical previous version
    qualityDrop: 47.5,
    affectedLogs: ['log-regression-1', 'log-regression-2'],
    suggestedFix: `HIGH SEVERITY REGRESSION: Customer support responses are too brief and lack emotional intelligence.

Root Cause Analysis:
- Removed explicit instructions for empathy and emotional acknowledgment
- Missing structure for handling frustrated customers
- Discount offer not clearly presented or contextualized

Recommended Fixes:
1. ADD explicit instruction: "Acknowledge the customer's emotional state first before offering solutions"
2. RESTORE structured response format: [Empathy Statement] → [Apology] → [Solution] → [Discount Offer] → [Next Steps]
3. INCLUDE examples of empathetic language: "I understand how frustrating this must be" vs "Sorry about the delay"
4. SPECIFY that discount must be presented as compensation, not just mentioned
5. ADD requirement to provide specific timeline or tracking information when available
6. INCLUDE instruction to offer follow-up contact method for complex issues

Business Impact: This regression directly affects customer satisfaction scores and retention rates.`,
    fixed: true,
    fixedAt: generateMockTimestamp(2, 15), // 12:15pm PT
    fixedVersionId: 'v2'
  },
  {
    id: 'regression-2',
    promptId: 'p6',
    versionId: 'v3',
    detectedAt: generateMockTimestamp(4, 15), // 2:15pm PT
    severity: 'critical',
    issue: 'Quality dropped by 48% - subject lines are generic and fail to engage',
    previousVersionId: 'v2',
    qualityDrop: 48,
    affectedLogs: ['log-regression-email-1', 'log-regression-email-2'],
    suggestedFix: `CRITICAL REGRESSION: Email subject lines are too generic, reducing open rates by an estimated 30-40%.

Root Cause: Simplified prompt removed all specificity requirements and examples.

Recommended Fixes:
1. RESTORE detailed instructions: "Subject lines must be 5-8 words, include specific numbers/percentages from the topic, and create urgency"
2. ADD requirement: "Extract and include key details from the topic (e.g., '30% off' not just 'Sale')"
3. INCLUDE examples directly in prompt:
   GOOD: "Summer Sale: 30% Off Ends July 31st"
   BAD: "Summer Sale" or "New Product"
4. SPECIFY spam trigger word avoidance: "Avoid words like 'Free', 'Act Now', 'Limited Time' unless contextually appropriate"
5. ADD instruction: "Subject line must convey value proposition clearly - what's in it for the reader?"
6. REQUIRE A/B testing guidance: "If multiple options, suggest 2-3 variations for testing"

Business Impact: Generic subject lines reduce email open rates, directly impacting marketing ROI.`,
    fixed: false
  },
  {
    id: 'regression-3',
    promptId: 'p7',
    versionId: 'v4',
    detectedAt: generateMockTimestamp(4, 45), // 2:45pm PT
    severity: 'critical',
    issue: 'Quality dropped by 70% - code reviews are unhelpful one-sentence responses',
    previousVersionId: 'v3',
    qualityDrop: 70,
    affectedLogs: ['log-regression-code-1', 'log-regression-code-2'],
    suggestedFix: `CRITICAL REGRESSION: Code review feedback is unhelpful and doesn't improve code quality.

Root Cause: Over-simplification removed structured format and detail requirements.

Recommended Fixes:
1. RESTORE mandatory structured format with sections:
   - Code Quality & Best Practices
   - Potential Bugs & Edge Cases
   - Performance Considerations
   - Readability & Maintainability
   - Actionable Improvement Suggestions

2. ADD requirement: "Each section must have at least 2-3 specific points with explanations"

3. INCLUDE code example requirement: "When suggesting improvements, provide before/after code examples"

4. SPECIFY minimum response length: "Reviews must be comprehensive (200+ words for non-trivial code)"

5. ADD few-shot examples of good reviews directly in the prompt template

6. REQUIRE that suggestions include:
   - What: The specific issue
   - Why: Why it matters (security, performance, maintainability)
   - How: Concrete fix with code example

Business Impact: Poor code reviews lead to technical debt, bugs in production, and slower development velocity.`,
    fixed: false
  },
  {
    id: 'regression-4',
    promptId: 'p3',
    versionId: 'v11',
    detectedAt: generateMockTimestamp(0, 30), // 10:30am PT
    severity: 'high',
    issue: 'SQL queries failing on edge cases - missing NULL handling and error-prone joins',
    previousVersionId: 'v10',
    qualityDrop: 35,
    affectedLogs: [],
    suggestedFix: `HIGH SEVERITY: SQL queries generated are failing in production due to missing edge case handling.

Root Cause: Removed instructions for defensive SQL practices and NULL handling.

Recommended Fixes:
1. ADD explicit instruction: "Always use LEFT JOIN or handle NULL values explicitly in WHERE clauses"
2. INCLUDE requirement: "Add NULL checks for optional fields: WHERE field IS NOT NULL OR field = 'default'"
3. RESTORE instruction: "Use parameterized queries format - never concatenate user input directly"
4. ADD examples of safe vs unsafe query patterns directly in prompt
5. SPECIFY: "Include error handling suggestions in comments (e.g., 'Consider adding try-catch for connection errors')"
6. REQUIRE: "For self-joins, always handle the case where parent/manager doesn't exist"

Business Impact: Failed queries cause application errors, user-facing issues, and require emergency fixes.`,
    fixed: false
  },
  {
    id: 'regression-5',
    promptId: 'p2',
    versionId: 'v4',
    detectedAt: generateMockTimestamp(0, 45), // 10:45am PT
    severity: 'medium',
    issue: 'Product descriptions missing SEO keywords and target audience appeal',
    previousVersionId: 'v3',
    qualityDrop: 22,
    affectedLogs: [],
    suggestedFix: `MEDIUM SEVERITY: Product descriptions are less effective for SEO and conversion.

Root Cause: Removed SEO keyword integration instructions and audience-specific language guidance.

Recommended Fixes:
1. RESTORE instruction: "Naturally integrate 3-5 SEO keywords from product name and features"
2. ADD requirement: "Use language that resonates with target audience (technical terms for tech products, benefits for consumer products)"
3. INCLUDE structure: "First paragraph: Hook + key benefit, Second: Features + specs, Third: Call to action"
4. SPECIFY: "Include emotional triggers for target audience (e.g., 'peace of mind' for security products)"
5. ADD instruction: "End with clear value proposition that addresses audience pain points"

Business Impact: Lower SEO rankings and conversion rates, but impact is gradual rather than immediate.`,
    fixed: false
  },
  {
    id: 'regression-6',
    promptId: 'p1',
    versionId: 'v1',
    detectedAt: generateMockTimestamp(1, 15), // 11:15am PT
    severity: 'high',
    issue: 'Cost per response increased 40% - using more tokens without quality improvement',
    previousVersionId: 'v0',
    qualityDrop: 0, // Quality is same, but cost is higher
    affectedLogs: [],
    suggestedFix: `HIGH SEVERITY: Cost regression - responses are 40% more expensive without quality gains.

Root Cause: Added verbose instructions and examples that increase token usage without improving output quality.

Recommended Fixes:
1. OPTIMIZE prompt length: Remove redundant instructions, consolidate similar points
2. USE more concise examples: Replace long examples with shorter, focused ones
3. MOVE detailed examples to documentation rather than prompt template
4. CONSIDER using system messages or separate context if supported by model
5. TEST if shorter prompt produces same quality - if yes, use shorter version
6. MONITOR token usage: Set target of <200 tokens per response for this use case

Business Impact: 40% cost increase at scale (10k requests/day) = significant budget impact without quality benefit.`,
    fixed: false
  },
  {
    id: 'regression-7',
    promptId: 'p2',
    versionId: 'v6',
    detectedAt: generateMockTimestamp(3, 0), // 1:00pm PT
    severity: 'high',
    issue: 'Product descriptions lack emotional appeal and conversion-focused language',
    previousVersionId: 'v5',
    qualityDrop: 38,
    affectedLogs: [],
    suggestedFix: `HIGH SEVERITY: Product descriptions are failing to convert visitors to buyers.

Root Cause: Removed conversion-focused language and emotional triggers from prompt.

Recommended Fixes:
1. ADD instruction: "Start with a hook that addresses the customer's main pain point or desire"
2. RESTORE requirement: "Include emotional benefits (e.g., 'peace of mind', 'save time', 'feel confident')"
3. INCLUDE call-to-action language: "End with compelling reason to buy now (urgency, value, exclusivity)"
4. SPECIFY: "Use power words that resonate with target audience (e.g., 'premium', 'effortless', 'proven' for tech products)"
5. ADD structure requirement: "Problem → Solution → Benefits → Social Proof → CTA"
6. INCLUDE examples of conversion-focused vs generic descriptions in prompt

Business Impact: Lower conversion rates directly reduce revenue and marketing ROI.`,
    fixed: false
  },
  {
    id: 'regression-8',
    promptId: 'p3',
    versionId: 'v13',
    detectedAt: generateMockTimestamp(3, 30), // 1:30pm PT
    severity: 'critical',
    issue: 'SQL injection vulnerabilities detected - queries concatenate user input unsafely',
    previousVersionId: 'v12',
    qualityDrop: 85,
    affectedLogs: [],
    suggestedFix: `CRITICAL SECURITY REGRESSION: SQL queries are vulnerable to injection attacks.

Root Cause: Removed parameterization instructions and safety checks.

Recommended Fixes:
1. ADD CRITICAL instruction: "NEVER concatenate user input directly into SQL. Always use parameterized queries or proper escaping"
2. RESTORE requirement: "Format queries as: SELECT * FROM table WHERE id = ? (use placeholders, not string interpolation)"
3. INCLUDE validation: "Validate all inputs before generating query - reject dangerous patterns"
4. SPECIFY: "Add comment in generated query: '-- WARNING: This query uses parameters. Replace ? with actual values safely'"
5. ADD examples of safe vs unsafe patterns directly in prompt
6. REQUIRE: "If input contains SQL keywords (SELECT, DROP, etc.), return error instead of generating query"

Business Impact: SQL injection vulnerabilities can lead to data breaches, compliance violations, and severe security incidents.`,
    fixed: true,
    fixedAt: generateMockTimestamp(3, 45), // 1:45pm PT
    fixedVersionId: 'v14'
  },
  {
    id: 'regression-9',
    promptId: 'p6',
    versionId: 'v4',
    detectedAt: generateMockTimestamp(2, 0), // 12:00pm PT
    severity: 'medium',
    issue: 'Subject lines too long - exceeding email client display limits',
    previousVersionId: 'v3',
    qualityDrop: 25,
    affectedLogs: [],
    suggestedFix: `MEDIUM SEVERITY: Subject lines exceed optimal length, reducing mobile visibility.

Root Cause: Removed character limit instruction and length optimization guidance.

Recommended Fixes:
1. ADD explicit limit: "Subject lines must be 30-50 characters (optimal for mobile and desktop preview)"
2. RESTORE instruction: "Prioritize first 30 characters - they're most visible in mobile clients"
3. INCLUDE guidance: "If topic is long, use ellipsis or focus on most compelling detail"
4. SPECIFY: "Test subject line length before finalizing - count characters including spaces"
5. ADD examples showing optimal length vs too long
6. REQUIRE: "If topic requires more detail, use preview text instead of extending subject line"

Business Impact: Long subject lines get truncated, reducing open rates especially on mobile devices.`,
    fixed: false
  },
  {
    id: 'regression-10',
    promptId: 'p7',
    versionId: 'v5',
    detectedAt: generateMockTimestamp(1, 45), // 11:45am PT
    severity: 'high',
    issue: 'Code reviews missing security vulnerability detection',
    previousVersionId: 'v4',
    qualityDrop: 45,
    affectedLogs: [],
    suggestedFix: `HIGH SEVERITY: Code reviews are not catching security vulnerabilities.

Root Cause: Removed security-focused review section and vulnerability detection instructions.

Recommended Fixes:
1. ADD mandatory security section: "Security & Vulnerabilities: Check for [list common issues]"
2. RESTORE instruction: "Always check for: SQL injection, XSS, authentication bypass, sensitive data exposure"
3. INCLUDE requirement: "Flag any user input that's not validated or sanitized"
4. SPECIFY: "For each security issue found, explain the risk and provide secure code example"
5. ADD security checklist directly in prompt template
6. REQUIRE: "If no security issues found, explicitly state 'No security concerns detected'"

Business Impact: Missing security vulnerabilities can lead to breaches, data leaks, and compliance violations.`,
    fixed: false
  }
];

