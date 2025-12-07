# Example Prompts for Upload

This folder contains example prompt JSON files that you can upload to PromptWorkbench to test the bulk import functionality.

## Files

### Individual Prompts (Single JSON objects)
- **`email-summarizer.json`** - Summarizes long emails into bullet points
- **`code-review-assistant.json`** - Reviews code for bugs, security, and best practices
- **`blog-post-generator.json`** - Creates SEO-optimized blog posts

### Bulk Import
- **`bulk-import-example.json`** - Contains all 3 prompts in a single array (upload this to import all at once)

## How to Use

1. **Single Prompt Upload:**
   - Go to Prompt Registry
   - Click "Upload"
   - Select one of the individual JSON files (e.g., `email-summarizer.json`)

2. **Bulk Upload:**
   - Go to Prompt Registry
   - Click "Upload"
   - Select `bulk-import-example.json` to import all 3 prompts at once

## JSON Structure

Each prompt file follows this structure:

```json
{
  "name": "Prompt Name",
  "description": "What the prompt does",
  "tags": ["tag1", "tag2"],
  "version": {
    "template": "Your prompt template with {{variables}}",
    "variables": ["variable1", "variable2"],
    "model": "gemini-2.5-flash",
    "temperature": 0.7,
    "status": "production"
  },
  "commitMessage": "Initial version description"
}
```

## Notes

- All prompts use `gemini-2.5-flash` model
- Temperature values are set based on the use case (lower for precise tasks, higher for creative tasks)
- Variables are defined using `{{variable_name}}` syntax in the template
- Status can be: `draft`, `staging`, `production`, or `archived`

