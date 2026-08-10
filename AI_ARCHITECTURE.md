# SitePulse AI Architecture

## Overview

The SitePulse AI module provides a comprehensive suite of AI-powered features integrated into the existing SitePulse SaaS platform. This document outlines the architecture, data models, API endpoints, and frontend components for the AI features.

## Table of Contents

1. [Features](#features)
2. [Architecture](#architecture)
3. [Database Schema](#database-schema)
4. [Backend Services](#backend-services)
5. [API Endpoints](#api-endpoints)
6. [Frontend Components](#frontend-components)
7. [Configuration](#configuration)
8. [Usage Tracking & Quotas](#usage-tracking--quotas)

---

## Features

### 1. AI Chat
- Conversational AI assistant for business queries
- Multi-session management with history
- Context-aware responses using chat history
- Support for multiple AI providers

### 2. AI Reports
- Generate comprehensive business reports from data
- Support for multiple report types: Project, Site, Finance, HR, Inventory, Sales, Custom
- Multiple output formats: Markdown, HTML, PDF, JSON
- Automated data aggregation and analysis

### 3. AI OCR
- Extract text and structured data from documents
- Support for images, PDFs, and other document types
- Confidence scoring for extracted data
- Automatic document type detection

### 4. AI Analytics
- Natural language querying of business data
- Intelligent data analysis and trend detection
- Raw analytics data access without AI processing
- Cross-module data aggregation

### 5. AI Insights
- Automated business insights generation
- Trend detection, anomaly detection, forecasting
- Severity classification: Info, Low, Medium, High, Critical
- Dismissible insights with read/unread tracking

### 6. AI Suggestions
- Actionable recommendations for business improvement
- Suggestion types: Action, Optimization, Automation, Warning, Recommendation
- Apply/dismiss workflow
- Suggestion effectiveness tracking

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (React)                      │
│  ┌──────────┬──────────┬──────────┬──────────┬───────────┐  │
│  │ AiChat   │AiReports │ AiOcr    │AiAnalytics│AiInsights│  │
│  └──────────┴──────────┴──────────┴──────────┴───────────┘  │
│         │           │           │           │                │
│         └───────────┴───────────┴───────────┘                │
│                        │                                     │
│                  aiService.js                                │
└─────────────────────────|--------------------------------─────┘
                          │
┌─────────────────────────|--------------------------------─────┐
│                    Backend (Express)                         │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Routes: /api/v1/ai/*                                  │ │
│  │  - ai.routes.js                                        │ │
│  │  - Mounted in v1/index.js                              │ │
│  └────────────────────────────────────────────────────────┘ │
│                          │                                   │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Controller: ai.controller.js                          │ │
│  │  - Handles HTTP requests/responses                     │ │
│  │  - Validates input                                     │ │
│  │  - Calls service layer                                 │ │
│  └────────────────────────────────────────────────────────┘ │
│                          │                                   │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Services Layer                                         │ │
│  │  ┌──────────────────────────────────────────────────┐  │ │
│  │  │ ai.provider.js        - AI Provider Abstraction   │  │ │
│  │  │ ai.usage.service.js   - Usage Tracking & Quotas   │  │ │
│  │  │ ai.chat.service.js    - Chat Sessions & Messages  │  │ │
│  │  │ ai.report.service.js  - Report Generation         │  │ │
│  │  │ ai.ocr.service.js     - Document OCR              │  │ │
│  │  │ ai.analytics.service.js - Data Analysis           │  │ │
│  │  │ ai.insight.service.js - Business Insights         │  │ │
│  │  │ ai.suggestion.service.js - Recommendations        │  │ │
│  │  └──────────────────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────────┘ │
│                          │                                   │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  AI Provider Abstraction Layer                          │ │
│  │  - OpenAI (GPT-4o, GPT-4, GPT-3.5)                     │ │
│  │  - Anthropic (Claude 3.5 Sonnet, Claude 3)             │ │
│  │  - Google (Gemini Pro)                                  │ │
│  │  - Mistral (Mistral Large)                              │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│              External AI APIs (via fetch)                    │
│  - OpenAI API                                                │
│  - Anthropic API                                             │
│  - Google Generative AI API                                  │
│  - Mistral API                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## Database Schema

### AI Enums

```prisma
enum AiModelProvider {
  OPENAI
  ANTHROPIC
  GOOGLE
  MISTRAL
  CUSTOM
}

enum AiFeatureStatus {
  ACTIVE
  DISABLED
  LIMITED
}

enum AiChatRole {
  USER
  ASSISTANT
  SYSTEM
}

enum AiReportType {
  PROJECT
  SITE
  FINANCE
  HR
  INVENTORY
  SALES
  CUSTOM
}

enum AiReportFormat {
  MARKDOWN
  HTML
  PDF
  JSON
}

enum AiOcrStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
}

enum AiInsightType {
  TREND
  ANOMALY
  FORECAST
  CORRELATION
  PERFORMANCE
  RISK
  OPPORTUNITY
}

enum AiInsightSeverity {
  INFO
  LOW
  MEDIUM
  HIGH
  CRITICAL
}

enum AiSuggestionType {
  ACTION
  OPTIMIZATION
  AUTOMATION
  WARNING
  RECOMMENDATION
}
```

### AI Models

#### AiFeature
Stores AI feature configuration per company.
```prisma
model AiFeature {
  id             String
  companyId      String
  name           String              // e.g., "chat", "reports", "ocr"
  provider       AiModelProvider     // OPENAI, ANTHROPIC, etc.
  modelName      String?             // e.g., "gpt-4o", "claude-3-5-sonnet"
  apiKey         String?             // Company-specific API key
  status         AiFeatureStatus     // ACTIVE, DISABLED, LIMITED
  monthlyLimit   Int?                // Monthly usage limit
  usedThisMonth  Int                 // Current month usage count
  settings       Json?               // Feature-specific settings
}
```

#### AiUsageLog
Tracks every AI request/response for billing and monitoring.
```prisma
model AiUsageLog {
  id        String
  companyId String
  featureId String?     // Links to AiFeature
  userId    String?     // User who made the request
  modelName String
  prompt    String?     // Input prompt (truncated)
  response  String?     // Generated response (truncated)
  tokensIn  Int         // Input tokens
  tokensOut Int         // Output tokens
  duration  Int?        // Request duration in ms
  cost      Decimal?    // Cost in USD
  success   Boolean     // Whether the call succeeded
  createdAt DateTime
}
```

#### AiChatSession
Stores chat sessions for AI Chat feature.
```prisma
model AiChatSession {
  id          String
  companyId   String
  userId      String
  title       String?
  context     Json?        // Session context (project/site info)
  isArchived  Boolean
  createdAt   DateTime
  updatedAt   DateTime
  messages    AiChatMessage[]
}
```

#### AiChatMessage
Individual messages within a chat session.
```prisma
model AiChatMessage {
  id        String
  sessionId String
  role      AiChatRole    // USER, ASSISTANT, SYSTEM
  content   String        // Message content
  metadata  Json?         // Model/provider info
  tokensIn  Int
  tokensOut Int
  createdAt DateTime
}
```

#### AiReport
Stores generated AI reports.
```prisma
model AiReport {
  id          String
  companyId   String
  userId      String?
  type        AiReportType    // PROJECT, SITE, FINANCE, etc.
  title       String
  description String?
  prompt      String?
  content     String?         // Generated report content
  format      AiReportFormat  // MARKDOWN, HTML, PDF, JSON
  data        Json?           // Source data used for generation
  status      String          // GENERATING, COMPLETED, FAILED
  error       String?
  createdAt   DateTime
  updatedAt   DateTime
}
```

#### AiOcrDocument
Stores OCR processing results.
```prisma
model AiOcrDocument {
  id             String
  companyId      String
  userId         String?
  documentId     String?      // Related document ID
  fileName       String
  mimeType       String?
  fileSize       Int?
  status         AiOcrStatus  // PENDING, PROCESSING, COMPLETED, FAILED
  extractedText  String?      // Full extracted text
  structuredData Json?        // Parsed structured data
  confidence     Float?       // OCR confidence score (0-1)
  language       String?      // Detected language
  error          String?
  processedAt    DateTime?
  createdAt      DateTime
  updatedAt      DateTime
}
```

#### AiInsight
Stores generated business insights.
```prisma
model AiInsight {
  id          String
  companyId   String
  userId      String?
  type        AiInsightType      // TREND, ANOMALY, FORECAST, etc.
  severity    AiInsightSeverity  // INFO, LOW, MEDIUM, HIGH, CRITICAL
  title       String
  description String
  data        Json?              // Additional insight data
  entityType  String?            // PROJECT, FINANCE, etc.
  entityId    String?            // Related entity ID
  isRead      Boolean
  isDismissed Boolean
  createdAt   DateTime
  updatedAt   DateTime
}
```

#### AiSuggestion
Stores generated business suggestions.
```prisma
model AiSuggestion {
  id          String
  companyId   String
  userId      String?
  type        AiSuggestionType  // ACTION, OPTIMIZATION, AUTOMATION, etc.
  title       String
  description String
  data        Json?
  entityType  String?
  entityId    String?
  isApplied   Boolean
  isDismissed Boolean
  createdAt   DateTime
  updatedAt   DateTime
}
```

---

## Backend Services

### Service Layer Structure

```
server/src/services/ai/
├── ai.provider.js          # Provider abstraction & unified interface
├── ai.usage.service.js     # Usage tracking & quota management
├── ai.chat.service.js      # Chat sessions & messages
├── ai.report.service.js    # Report generation
├── ai.ocr.service.js       # Document OCR
├── ai.analytics.service.js # Data analytics
├── ai.insight.service.js   # Business insights
└── ai.suggestion.service.js # Actionable suggestions
```

### Key Design Patterns

1. **Provider Abstraction**: All AI providers (OpenAI, Anthropic, Google, Mistral) are accessed through a unified `generateCompletion()` interface. This decouples business logic from vendor-specific SDKs.

2. **Usage Tracking**: Every AI call is logged via `recordAiUsage()`, which:
   - Creates an `AiUsageLog` entry
   - Increments the `usedThisMonth` counter on the `AiFeature`
   - Calculates cost based on token usage

3. **Quota Management**: Before each AI call, `checkAiQuota()` verifies:
   - Feature is enabled (`ACTIVE` status)
   - Monthly limit not exceeded (if set)

4. **Data Aggregation**: Services like `ai.analytics.service.js` and `ai.insight.service.js` gather company data from multiple tables, then pass it to the AI for analysis.

---

## API Endpoints

### Base URL
```
/api/v1/ai
```

### Endpoints

#### Status
- `GET /status` - Check AI system status and configured providers

#### Chat
- `POST /chat/sessions` - Create new chat session
- `GET /chat/sessions` - List chat sessions
- `GET /chat/sessions/:id` - Get session with messages
- `POST /chat/sessions/:id/messages` - Send message & get AI response
- `PATCH /chat/sessions/:id` - Rename session
- `DELETE /chat/sessions/:id` - Delete/archive session

#### Reports
- `POST /reports/generate` - Generate AI report
- `GET /reports` - List reports
- `GET /reports/:id` - Get report details
- `DELETE /reports/:id` - Delete report

#### OCR
- `POST /ocr/process` - Process document with OCR
- `GET /ocr` - List OCR documents
- `GET /ocr/:id` - Get OCR document
- `DELETE /ocr/:id` - Delete OCR document

#### Analytics
- `POST /analytics` - Analyze data with AI
- `GET /analytics/raw` - Get raw analytics data

#### Insights
- `POST /insights/generate` - Generate AI insights
- `GET /insights` - List insights
- `GET /insights/stats` - Get insight statistics
- `PATCH /insights/:id/read` - Mark as read
- `PATCH /insights/:id/dismiss` - Dismiss insight

#### Suggestions
- `POST /suggestions/generate` - Generate AI suggestions
- `GET /suggestions` - List suggestions
- `GET /suggestions/stats` - Get suggestion statistics
- `PATCH /suggestions/:id/apply` - Mark as applied
- `PATCH /suggestions/:id/dismiss` - Dismiss suggestion

#### Usage
- `GET /usage` - Get AI usage statistics
- `GET /usage/features` - Get usage by feature

---

## Frontend Components

### Route Structure

```
site-pulse/SitePulse/src/pages/AI/
├── index.jsx           # AiOverview - Feature dashboard
├── AiOverview.jsx      # AI feature cards & stats
├── AiChat.jsx          # Chat interface
├── AiReports.jsx       # Report generation & list
├── AiOcr.jsx           # OCR processing & results
├── AiAnalytics.jsx     # Analytics query & results
├── AiInsights.jsx      # Insights list & management
├── AiSuggestions.jsx   # Suggestions list & actions
└── AiUsage.jsx         # Usage statistics

site-pulse/SitePulse/src/constants/
├── routes.js           # AI route definitions
└── sidebar.js          # AI navigation items

site-pulse/SitePulse/src/services/
└── aiService.js        # Frontend API client
```

### Key Pages

1. **AiOverview** (`/ai`) - Dashboard showing AI feature cards and usage statistics
2. **AiChat** (`/ai/chat`) - Full chat interface with session management
3. **AiReports** (`/ai/reports`) - Report generation form and list
4. **AiOcr** (`/ai/ocr`) - Document upload/process and results
5. **AiAnalytics** (`/ai/analytics`) - Natural language query interface
6. **AiInsights** (`/ai/insights`) - Insight generation and management
7. **AiSuggestions** (`/ai/suggestions`) - Suggestion generation and actions
8. **AiUsage** (`/ai/usage`) - Usage monitoring and quotas

---

## Configuration

### Environment Variables

Add to `server/.env`:

```env
# AI Configuration
AI_DEFAULT_PROVIDER=openai

# OpenAI
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o

# Anthropic
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022

# Google
GOOGLE_API_KEY=...
GOOGLE_MODEL=gemini-1.5-pro

# Mistral
MISTRAL_API_KEY=...
MISTRAL_MODEL=mistral-large-latest

# AI Generation Settings
AI_MAX_TOKENS=4096
AI_TEMPERATURE=0.7
AI_TIMEOUT_MS=30000
AI_ENABLE_USAGE_TRACKING=true
```

### Provider Configuration

The system supports multiple AI providers. Configure at least one:

1. **OpenAI**: Set `OPENAI_API_KEY`
2. **Anthropic**: Set `ANTHROPIC_API_KEY`
3. **Google**: Set `GOOGLE_API_KEY`
4. **Mistral**: Set `MISTRAL_API_KEY`

Change `AI_DEFAULT_PROVIDER` to switch the default provider.

---

## Usage Tracking & Quotas

### How It Works

1. **Per-Request Tracking**: Every AI call triggers `recordAiUsage()` which:
   - Creates an `AiUsageLog` entry with tokens, cost, duration
   - Increments the `usedThisMonth` counter on the `AiFeature`

2. **Quota Checking**: Before processing, `checkAiQuota()` verifies:
   - Feature is `ACTIVE`
   - `usedThisMonth < monthlyLimit` (if limit is set)

3. **Feature Configuration**: Each company can have multiple `AiFeature` records (one per feature name like "chat", "reports", etc.) with:
   - Custom provider/model selection
   - Monthly usage limits
   - Status (ACTIVE/DISABLED/LIMITED)

### Monitoring

- **Usage Statistics**: `GET /api/v1/ai/usage` returns total calls, tokens, cost, success rate
- **Feature Breakdown**: `GET /api/v1/ai/usage/features` shows per-feature usage
- **Recent Logs**: Usage logs are retained with full request/response data (truncated to 10k chars)

---

## Security & Multi-Tenancy

1. **Authentication**: All AI routes require authentication via `protect` middleware
2. **Company Isolation**: All queries filter by `companyId` from `req.user.companyId`
3. **Resource Ownership**: Services verify resources belong to the user's company
4. **API Key Storage**: Company-specific API keys are stored in `AiFeature.apiKey`
5. **Usage Limits**: Quotas prevent abuse and control costs

---

## Extending the System

### Adding a New AI Feature

1. Add service file in `server/src/services/ai/ai.<feature>.service.js`
2. Add controller methods in `server/src/contoller/ai.controller.js`
3. Add routes in `server/src/routes/ai.routes.js`
4. Create frontend page in `site-pulse/SitePulse/src/pages/AI/`
5. Add route constants in `site-pulse/SitePulse/src/constants/routes.js`
6. Add sidebar item in `site-pulse/SitePulse/src/constants/sidebar.js`
7. Register routes in `server/src/routes/v1/index.js`

### Adding a New AI Provider

1. Add provider config in `ai.provider.js` `resolveProviderConfig()`
2. Implement API call function (e.g., `callNewProvider()`)
3. Add to `providers` dispatch map
4. Update `getConfiguredProviders()` to detect the new provider

---

## Next Steps

1. Run Prisma migrations to create new tables:
   ```bash
   cd server
   npx prisma migrate dev --name add-ai-features
   ```

2. Install additional dependencies if needed:
   ```bash
   cd server
   npm install
   ```

3. Configure AI API keys in `.env`

4. Test the AI endpoints:
   ```bash
   # Check AI status
   curl http://localhost:5000/api/v1/ai/status
   
   # Create chat session (with auth header)
   curl -X POST http://localhost:5000/api/v1/ai/chat/sessions \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"title": "Test Chat"}'
   ```

---

## Architecture Decisions

1. **No Vendor SDK Coupling**: Using native `fetch` instead of SDKs keeps dependencies minimal and allows easy provider switching.

2. **Unified Completion Interface**: All features use the same `generateCompletion()` interface, making it easy to switch providers per-request.

3. **Usage Tracking is Optional**: Controlled by `AI_ENABLE_USAGE_TRACKING` flag to disable in development if needed.

4. **Company-Level Configuration**: Each company can configure their own AI provider and model, allowing different tiers/plans.

5. **Frontend Decoupled**: Frontend service layer (`aiService.js`) provides a clean API that can be extended without changing components.