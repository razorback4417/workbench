# Test Chatbot for PromptWorkbench

A simple chatbot application to test PromptWorkbench's prompt management, observability, and deployment features.

## Features

- Simple conversational interface
- Connects to PromptWorkbench API (when integrated)
- Logs all interactions for observability
- Easy to modify prompts and test different versions

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure your PromptWorkbench API endpoint in `config.js`

3. Run the chatbot:
```bash
npm start
```

## Usage

The chatbot uses prompts managed in PromptWorkbench. You can:
- Edit prompts in PromptWorkbench
- Test different versions
- View logs and metrics
- Deploy better performing prompts

## Integration with PromptWorkbench

This chatbot is designed to work with PromptWorkbench's:
- Prompt Registry: Fetch prompts by ID
- Version Management: Use specific prompt versions
- Logging: All interactions are logged
- A/B Testing: Can route to different versions

