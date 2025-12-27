# ⚖️ Right It Up

**AI-powered dispute resolution platform that solves the sycophancy problem.**

Right It Up is an impartial AI arbiter that settles arguments between two parties using blind submissions, evidence parsing, and nuanced verdict generation. Unlike competitors where AI agrees with whoever frames the dispute better, our dual-blind system ensures both sides are evaluated independently.

🌐 **Live:** [rightitup.vercel.app](https://rightitup.vercel.app)

---

## ✨ Key Features

### Core Dispute Resolution
- **Dual-Blind Submissions** — Party B responds without seeing Party A's argument, eliminating framing bias
- **Evidence Support** — Upload images and text evidence with automatic OCR parsing via Gemini Vision
- **Nuanced Verdicts** — Percentage-based scoring (not binary win/lose) with confidence levels
- **Multiple Judge Personas** — Specialized AI judges for relationships, roommates, sports, tech, and general disputes
- **Verdict Tones** — Neutral, GenZ, Professional, Savage, Wholesome

### Analysis & Detection
- **Logical Fallacy Detection** — Identifies 15+ fallacies (ad hominem, straw man, false dichotomy, etc.)
- **Gaslighting Detection** — Flags manipulation patterns including DARVO tactics, guilt-tripping, and goalpost-moving
- **Argument Strength Analysis** — Detailed breakdown of each party's strongest and weakest points

### User Profiles & Gamification
- **Win/Loss Tracking** — Comprehensive statistics per user and per category
- **Badge System** — Earn achievements (Evidence Expert, Winning Streak, Fallacy Spotter, etc.)
- **Streak Tracking** — Current and longest win/loss streaks
- **Category Stats** — Performance breakdown across dispute types

### Appeals System
- **Structured Appeals** — Parties can appeal verdicts with new evidence
- **Verdict Comparison** — See original vs. appeal verdict side-by-side
- **Appeal Limits** — One appeal per party per case

### Sharing & Virality
- **Receipt-Style Verdict Cards** — Downloadable PNG images optimized for social sharing
- **Unique Case URLs** — Shareable links for each dispute
- **Branded Watermarks** — Automatic branding on all exports

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|------------|
| **Framework** | Next.js 15 (App Router) |
| **Database** | Supabase (PostgreSQL) |
| **Authentication** | Supabase Auth (Google OAuth) |
| **Storage** | Supabase Storage |
| **AI Providers** | Gemini 2.5 Flash (primary), Claude 3.5 Haiku, Groq |
| **Rate Limiting** | Upstash Redis |
| **Styling** | Tailwind CSS v4 |
| **Deployment** | Vercel |
| **Image Generation** | html2canvas |

---

## 📁 Project Structure

```
├── app/
│   ├── api/
│   │   ├── case/              # Case CRUD operations
│   │   │   ├── [code]/
│   │   │   │   ├── appeal/    # Appeal submission & processing
│   │   │   │   └── respond/   # Party B response + verdict generation
│   │   ├── quota/             # Usage quota checking
│   │   └── user/              # User stats & badges
│   ├── case/[code]/           # Case view/response page
│   ├── verdict/[code]/        # Verdict display with appeal option
│   ├── profile/               # User profile with stats & badges
│   ├── login/                 # Authentication
│   ├── submit/                # New case submission
│   ├── privacy/               # Privacy policy
│   └── tos/                   # Terms of service
├── components/
│   ├── VerdictCard.tsx        # Shareable verdict receipt
│   ├── AppealForm.tsx         # Appeal submission form
│   ├── BadgeDisplay.tsx       # User badges showcase
│   └── ...
├── lib/
│   ├── llms/                  # AI provider integrations
│   │   ├── gemini.ts
│   │   ├── anthropic.ts
│   │   └── groq.ts
│   ├── ai.ts                  # Verdict generation orchestration
│   ├── db.ts                  # Database operations
│   ├── security.ts            # Input sanitization & validation
│   └── ratelimit.ts           # Upstash Redis rate limiting
├── types/                     # TypeScript definitions
└── utils/supabase/            # Supabase client utilities
```

---

## 🗃 Database Schema

### Tables

**`cases`** — Dispute cases with party arguments
- Stores both parties' arguments, evidence, and metadata
- Tracks appeal status per party
- Auto-expires after 2 days if incomplete

**`verdicts`** — AI-generated verdict data
- Score breakdown (party_a_score, party_b_score)
- Detailed analysis JSON per party
- Winner determination and confidence level

**`appeals`** — Appeal submissions and outcomes
- Original verdict snapshot
- New evidence and reasoning
- Appeal verdict with change summary

**`user_stats`** — Comprehensive user statistics
- Win/loss/draw counts and rates
- Category-specific performance
- Streak tracking
- Fallacy detection counts
- Evidence usage rates

**`user_badges`** — Achievement system
- Badge ID, name, description, icon
- Tier system (bronze, silver, gold)
- Earned timestamp

**`user_case_history`** — Per-case user records
- Role (Party A/B), outcome, scores
- Category, tone, evidence usage
- Fallacy counts per case

**`verdict_usage`** — Rate limiting tracking
- Per-user and per-IP verdict counts
- Timestamp for quota reset calculations

---

## 🔐 Security

- **Input Sanitization** — HTML/XSS filtering on all user inputs
- **Prompt Injection Detection** — Blocks malicious AI manipulation attempts
- **Row Level Security** — PostgreSQL RLS policies on all tables
- **Rate Limiting** — Redis-backed limits (case creation: 5/min, verdicts: 3/min)
- **CSRF Protection** — Via Supabase Auth session management
- **CSP Headers** — Comprehensive Content Security Policy

---

## ⚙️ Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# AI Providers (Gemini uses round-robin rotation)
GEMINI_API_KEY_1=
GEMINI_API_KEY_2=
GEMINI_API_KEY_3=
GEMINI_API_KEY_4=
GEMINI_API_KEY_5=
GEMINI_API_KEY_6=
ANTHROPIC_API_KEY=
NEXT_PUBLIC_API_GROQ_KEY=

# Rate Limiting
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Environment
NEXT_PUBLIC_ENVIRONMENT=development
```

---

## 🚀 Getting Started

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Run database migrations in Supabase SQL editor
# (see scripts/schema.sql)

# Create 'evidence' storage bucket in Supabase (public)

# Start development server
npm run dev

# Build for production
npm run build
```

---

## 📡 API Reference

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/case` | POST | Create new dispute case |
| `/api/case/[code]` | GET | Retrieve case details |
| `/api/case/[code]/respond` | POST | Submit Party B response, generate verdict |
| `/api/case/[code]/appeal` | POST | Submit appeal with new evidence |
| `/api/case/[code]/appeal` | GET | Get appeal status and verdict |
| `/api/quota` | GET | Check user's remaining verdict quota |
| `/api/user/stats` | GET | Get user statistics |
| `/api/user/badges` | GET | Get user badges |

---

## 💰 Freemium Model

| Tier | Verdict Quota |
|------|---------------|
| Guest (unauthenticated) | 1 per day |
| Authenticated User | 5 per day |

---

## 🎯 Roadmap

### ✅ Implemented (P0-P1)
- [x] Dual-blind input system
- [x] Shareable verdict cards
- [x] Screenshot/evidence parsing (OCR)
- [x] Graduated nuance verdicts
- [x] Win/loss tracking + badges
- [x] Logical fallacy detection
- [x] Gaslighting detection
- [x] Appeals system

### 🔜 Planned (P2-P3)
- [ ] Explainable verdicts (what-if scenarios)
- [ ] Friend jury system
- [ ] Voice input with emotion analysis
- [ ] Pass & Play mode
- [ ] Platform integrations (Slack, Discord)
- [ ] Relationship health streaks

---

## 🏆 Competitive Advantage

Right It Up addresses the **#1 user complaint** across all AI dispute platforms: *"AI agrees with whoever frames the dispute."*

| Feature | Right It Up | Competitors |
|---------|-------------|-------------|
| Dual-blind submissions | ✅ | ❌ (most) |
| Evidence OCR parsing | ✅ | ❌ |
| Percentage-based verdicts | ✅ | Binary only |
| Fallacy detection | ✅ | ❌ |
| Manipulation detection | ✅ | ❌ |
| Appeals with new evidence | ✅ | Limited/paid |
| User stats & badges | ✅ | Basic |
| Free tier | ✅ (5/day) | Paid or very limited |

---

## 📄 License

MIT

---

## 🤝 Contributing

Contributions welcome! Please read the contributing guidelines before submitting PRs.

---

<p align="center">
  <strong>⚖️ "The AI arbiter that's actually fair, with receipts."</strong>
</p>
