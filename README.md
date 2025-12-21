# ⚖️ Right It Up

AI-powered dispute resolution platform that settles arguments between two parties with automated verdicts.

## Overview

Right It Up follows a three-step flow:
1. **Party A** submits their case with optional evidence
2. **Party B** responds blindly (cannot see Party A's argument)
3. **AI** analyzes both sides and delivers a verdict with confidence scoring

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Database & Auth:** Supabase (PostgreSQL + Google OAuth)
- **Styling:** Tailwind CSS v4
- **AI Providers:** Gemini 2.5 Flash (primary), Claude 3.5 Haiku, Groq
- **Rate Limiting:** Upstash Redis
- **Image Generation:** html2canvas for shareable verdict receipts

## Features

- 🎭 **Multiple Judge Personas** - Specialized AI judges for relationships, roommates, sports, tech, and general disputes
- 🎨 **Verdict Tones** - Neutral, GenZ, Professional, Savage, Wholesome
- 📎 **Evidence Upload** - Support for text evidence and image uploads (Supabase Storage)
- 📊 **Confidence Scoring** - Each verdict includes score breakdown and confidence level
- 📱 **Shareable Receipts** - Download receipt-style verdict cards as PNG images
- 🔒 **Blind Submissions** - Party B cannot see Party A's argument until verdict is delivered
- ⚡ **Rate Limiting** - Redis-based rate limiting with per-IP tracking
- 🆓 **Freemium Model** - 1 free verdict for guests, 5/day for authenticated users

## Project Structure

```
├── app/
│   ├── api/
│   │   ├── case/           # Case CRUD and response endpoints
│   │   └── quota/          # Quota checking
│   ├── case/[code]/        # Case view/response page
│   ├── verdict/[code]/     # Verdict display page
│   ├── login/              # Authentication
│   └── submit/             # New case submission
├── components/             # React components
├── contexts/               # Auth context provider
├── lib/
│   ├── llms/               # AI provider integrations
│   ├── ai.ts               # Verdict generation orchestration
│   ├── db.ts               # Database operations
│   ├── security.ts         # Input sanitization
│   └── ratelimit.ts        # Rate limiting
├── types/                  # TypeScript definitions
└── utils/supabase/         # Supabase client utilities
```

## Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# AI Providers
GEMINI_API_KEY_1=
GEMINI_API_KEY_2=
GEMINI_API_KEY_3=
GEMINI_API_KEY_4=
GEMINI_API_KEY_5=
GEMINI_API_KEY_6=
ANTHROPIC_API_KEY=
NEXT_PUBLIC_API_GROQ_KEY=

# Upstash Redis (Rate Limiting)
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Environment
NEXT_PUBLIC_ENVIRONMENT=development  # or production
```

## Database Setup

Run the SQL schema in `scripts/schema.sql` in your Supabase SQL editor. This creates:

- `cases` - Dispute cases with party arguments and evidence
- `verdicts` - AI-generated verdicts with analysis
- `verdict_usage` - Usage tracking for rate limiting
- RLS policies for secure data access
- Helper functions for case code generation and quota checking

### Storage Bucket

Create an `evidence` bucket in Supabase Storage (public) for image uploads.

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/case` | POST | Create new case |
| `/api/case/[code]` | GET | Get case details |
| `/api/case/[code]/respond` | POST | Submit Party B response & generate verdict |
| `/api/quota` | GET | Check current user's quota |

## AI Provider Configuration

The platform uses round-robin key rotation across 6 Gemini API keys with automatic failover. If all keys are exhausted, the system falls back gracefully.

Verdict generation is handled by `lib/ai.ts` which supports:
- Provider selection (Gemini, Anthropic, Groq)
- Category-specific judge personas
- Tone-modified prompts

## Security Features

- HTML/XSS sanitization on all user inputs
- Prompt injection detection
- CSRF protection via Supabase auth
- Rate limiting (case creation: 5/min, verdicts: 3/min)
- Comprehensive CSP headers

## License

MIT
