# Sisimpur — Product Launch Dev Roadmap

**TL;DR:** Transform Sisimpur from a working prototype (SQLite, n8n-dependent, dual-frontend) into a production-grade, B2B-ready AI education platform. The plan spans 6 versions: v0.1 (Foundation Cleanup) → v0.5 (MVP Core) → v1.0 (MVP Launch) → v1.1 (Personalization + Bangla) → v1.2 (B2B API Platform) → v2.0 (Full Product). Architecture-first approach: PostgreSQL, own AI pipeline, React SPA, API-only Django backend. Budget: bootstrap. Team: 1-2 devs. Quality over speed.

---

## VERSION 0.1 — FOUNDATION CLEANUP (Weeks 1–3)

*Goal: Clean house. Fix broken things. Set up proper architecture so everything built on top is solid.*

### Step 1: Research & Architecture Design

- Research AI pipeline options within budget: **Gemini 2.0 Flash** (free tier: 15 RPM, 1M tokens/day) vs **OpenAI gpt-4o-mini** ($0.15/1M input tokens) vs **Groq** (free tier: Llama 3.3 70B). Decision criteria: cost, quality for Q&A generation, multilingual (Bangla) support, structured JSON output reliability
- Research document parsing libraries: **PyMuPDF** (PDF→text), **python-docx** (DOCX), **Tesseract/EasyOCR** (OCR for images/scanned PDFs), **youtube-transcript-api** (YouTube URLs)
- Research embedding models for future RAG: **sentence-transformers** (free, local) vs **OpenAI embeddings** ($0.02/1M tokens)
- Design the **Brain Service Architecture** — modular pipeline: `Ingestion → Parsing → Chunking → Generation → Validation → Storage`. Each step is a separate service class so B2B clients can call individual steps via API
- Document the architecture in `knowledge/BRAIN_DEVELOPMENT_GUIDE.md` (update existing)

### Step 2: Database Migration — SQLite → PostgreSQL

- Set up **Supabase** free tier (500MB PostgreSQL, unlimited API requests) OR local PostgreSQL via Docker
- Update `core/settings.py` — replace SQLite config with PostgreSQL using `dj-database-url`
- Update `docker-compose.yml` — add PostgreSQL service container
- Run `makemigrations` and `migrate` against PostgreSQL
- Update `requirements.txt` — add `psycopg2-binary`, `dj-database-url`
- Add Redis service to docker-compose for caching + future Celery (use **Upstash** free tier: 10K commands/day for production)

### Step 3: Kill Django Templates — API-Only Backend

- Remove all template views from `apps/dashboard/views.py`, `apps/frontend/views.py`, `apps/authentication/views.py`
- Remove all `templates/` directories under apps
- Remove all static CSS/JS files under `static/` (React handles its own styles)
- Remove `django-browser-reload` from settings and requirements
- Keep Django Admin (`/admin/`) — it's too useful to lose
- Update `core/urls.py` — only serve API routes (`/api/`, `/admin/`, `/healthz/`, `/api/docs/`)
- Configure Django to serve React build as catch-all (or use separate deployment)
- Update CORS settings in `core/settings.py` for production domains

### Step 4: Fix Known Bugs

- Fix `brain_cli.py` — references deleted `brain.brain_engine.processor.DocumentProcessor`. Rewrite to use current `APIDocumentProcessor`
- Fix `my_quizzes` API view in `apps/dashboard/api_views.py` — references non-existent `job.original_filename` (should be `job.document_name`)
- Fix `analyze_document` / `detect_question_paper` in `apps/brain/api_service.py` — reference missing endpoint keys
- Remove broken `tests/test_llm_ocr.py`
- Fix `COMING_SOON` duplicate assignment in `core/settings.py`
- Set `DEBUG = False`, configure `ALLOWED_HOSTS` properly, add `SECRET_KEY` from env var

### Step 5: Security Hardening

- `DEBUG = False` in production, `ALLOWED_HOSTS` from env var
- `SECRET_KEY` from env var (currently hardcoded in `core/settings.py`)
- Add API rate limiting: `django-ratelimit` or DRF throttling (global: 100/min anon, 1000/min authenticated)
- Add request size limits (20MB upload cap enforced at nginx/Django level)
- HTTPS enforcement, secure cookies, CSRF protection for API
- Add `django-axes` for brute-force login protection

### Step 6: CI/CD Setup

- GitHub Actions workflow: lint (ruff/flake8), test (pytest), type check (mypy optional)
- Auto-deploy to Render on `main` branch push
- Add pre-commit hooks: black, isort, ruff

---

## VERSION 0.5 — MVP CORE (Weeks 4–8)

*Goal: Build the own AI pipeline. Get the core loop working: Upload → Parse → Generate Questions → Take Exam → See Results. No n8n dependency.*

### Step 7: Build AI Pipeline — Document Ingestion

- Create new module structure: `apps/brain/pipeline/` with `__init__.py`, `ingestion.py`, `parser.py`, `chunker.py`, `generator.py`, `validator.py`
- `ingestion.py` — Accept file upload, detect type (PDF, DOCX, TXT, IMG, YouTube URL), validate size/format, store to disk/S3
- `parser.py` — Extract text from each format:
  - PDF (text-based): **PyMuPDF** (`fitz`)
  - PDF (scanned/image): **PyMuPDF** + **pytesseract** or **EasyOCR** for OCR
  - DOCX: **python-docx**
  - TXT: Direct read
  - Images (JPG/PNG): **EasyOCR** or **pytesseract** (research which works better for Bangla)
  - YouTube: **youtube-transcript-api** to extract captions → text
- `chunker.py` — Split extracted text into chunks (1000–2000 tokens) with overlap. Use **LangChain's RecursiveCharacterTextSplitter** or build custom. Preserve section headers/context
- Update `requirements.txt`: add `PyMuPDF`, `python-docx`, `pytesseract`, `easyocr`, `youtube-transcript-api`

### Step 8: Build AI Pipeline — Question Generation

- `generator.py` — Core LLM integration:
  - Use **LiteLLM** as unified LLM interface (supports OpenAI, Gemini, Groq, Anthropic — easy to switch providers)
  - Implement structured output: LLM returns JSON matching `QuestionAnswer` schema
  - Prompt engineering for each question type: MCQ (4 options, 1 correct, explanation), Short Answer (question + ideal answer), Flashcard (front/back), One-word (question + single word answer)
  - Difficulty calibration prompts: Beginner (recall/recognition), Intermediate (application/analysis), Advanced (evaluation/synthesis)
  - Implement **question paper detection**: if uploaded content is already a question paper, extract questions and generate answers instead
- `validator.py` — Post-processing:
  - Validate JSON structure from LLM
  - Deduplicate similar questions
  - Verify MCQ options are distinct and correct answer is among options
  - Score confidence per question
- Add provider config in `apps/brain/api_config.py`: `LLM_PROVIDER`, `LLM_MODEL`, `LLM_API_KEY` from env vars
- Update `requirements.txt`: add `litellm`, `langchain-text-splitters`

### Step 9: Build AI Pipeline — Short Answer Evaluation

- `evaluator.py` — Replace n8n-based evaluation:
  - Send user answer + ideal answer + question to LLM
  - Structured output: accuracy_score, completeness_score, clarity_score, structure_score (0–10 each), feedback text, ideal_answer
  - Use same LiteLLM interface
- Update `apps/brain/api_views.py` `EvaluateShortAnswer` to use new evaluator instead of n8n webhook
- Remove n8n webhook dependency entirely from `apps/brain/api_service.py`

### Step 10: Background Processing — Replace Threading with Celery

- Add **Celery** with **Redis** broker (Upstash free tier for production, local Redis for dev)
- Create `apps/brain/tasks.py` — Celery tasks for: document processing pipeline, short answer evaluation, batch question generation
- Update `apps/brain/services.py` — replace `BackgroundProcessor` threading with Celery task dispatch
- Add Celery worker to `docker-compose.yml`
- Add Celery beat for scheduled tasks (future: cleanup old files, send reminders)
- Update `requirements.txt`: add `celery`, `redis`

### Step 11: React Frontend — Core Pages Polish

- Audit all 13 React pages in `frontend-react/src/pages/` — identify which are functional vs skeleton
- **SignInPage**: Complete OTP flow (send → verify → JWT), Google OAuth redirect, clean error handling
- **DashboardPage**: File upload with drag-and-drop (react-dropzone already installed), real-time job status polling, recent activity feed
- **MyQuizzesPage**: List all processing jobs with status badges, delete capability, pagination
- **QuizResultsPage**: Display generated Q&A pairs, "Start Exam" / "Start Flashcard" buttons
- **ExamPage**: Full MCQ exam interface — timer, question navigation, answer selection, submit
- **ExamResultPage**: Score breakdown, correct/incorrect review, retry button
- **FlashcardPage**: Card flip animation, progress bar, skip/next controls
- **LeaderboardPage**: Rankings table, badge icons, time filter tabs
- Add **toast notifications** (success/error) across all pages using existing `ToastProvider`
- Add **loading states** and **error boundaries** for every page
- Mobile-responsive design (Tailwind breakpoints)

### Step 12: API Client Hardening

- Audit `frontend-react/src/lib/api.ts` — ensure all endpoints match backend
- Add request interceptors: attach JWT, handle 401 → redirect to login
- Add response interceptors: parse errors consistently, show toast on failure
- Add retry logic for network failures (axios-retry)
- Add request cancellation for unmounted components

---

## VERSION 1.0 — MVP LAUNCH (Weeks 9–14)

*Goal: Production-ready product. Real users can sign up, upload documents, generate questions, take exams, track progress. Deploy and start getting feedback.*

### Step 13: Pretrained Datasets

- Research and curate question banks for: **BCS Preparation** (Bangladesh Civil Service), **IELTS**, **GRE**
- Design `PretrainedDataset` model: `name`, `category`, `description`, `total_questions`, `difficulty_distribution`, `is_active`, `icon`
- Design `PretrainedQuestion` model: FK → `PretrainedDataset`, same fields as `QuestionAnswer` + `topic_tag`, `subtopic`
- Build management command: `python manage.py load_dataset <json_file>` to bulk import
- API endpoints: `GET /api/brain/datasets/` (list available), `GET /api/brain/datasets/<id>/` (detail), `POST /api/brain/datasets/<id>/start-exam/` (create exam from dataset)
- React page: **DatasetBrowserPage** — browse categories, preview sample questions, start exam/flashcard
- **Data sourcing strategy**: Use LLM to generate high-quality question banks from publicly available syllabus content. Human review before publishing. Start with 500 questions per dataset.

### Step 14: Progress Dashboard & Analytics

- Design `UserProgress` model (or computed views): total exams taken, average score, score trend over time, strongest/weakest topics, total study time, streak (consecutive days active)
- API endpoint: `GET /api/dashboard/progress/` — returns comprehensive progress object
- React **DashboardPage** enhancement: score trend chart (use **recharts** — lightweight, React-native), topic heatmap, recent activity timeline, study streak counter, "suggested next action" card
- Add per-topic tracking: tag questions by topic during generation, aggregate scores by topic

### Step 15: 10-Minute Memory Boost Mode

- Design as a special flashcard session type: auto-advance every 10 seconds, curated from user's weakest topics (questions they got wrong)
- API: `POST /api/dashboard/memory-boost/start/` — auto-selects 20–30 cards from past incorrect answers
- React **MemoryBoostPage**: fullscreen mode, large text, countdown timer per card, auto-advance with manual override, completion summary with improvement metric
- If user has no history, fall back to random cards from their most recent quiz

### Step 16: User Profile & Settings

- **Profile**: Edit name, bio, location, avatar upload, view public stats
- **Settings**: Change email (with OTP verification), change password, notification preferences, delete account (GDPR), export data
- API endpoints: `PATCH /api/auth/profile/`, `POST /api/auth/change-email/`, `POST /api/auth/change-password/`, `DELETE /api/auth/account/`
- React pages: flesh out existing skeleton ProfilePage and SettingsPage

### Step 17: Scoring, Feedback & Leaderboard Polish

- Refine scoring algorithm: base points + time bonus + streak bonus + difficulty multiplier
- Instant feedback after each question: correct/incorrect, show correct answer, brief AI-generated explanation (cache explanations to save API costs)
- Leaderboard: weekly/monthly/all-time tabs, user's rank highlighted, top 3 special styling, pagination for full list
- Achievement badges: "First Quiz", "10 Quiz Streak", "Perfect Score", "Speed Demon" (>90% in <50% time), "Night Owl" (study after midnight). Store in `UserBadge` model, display on profile

### Step 18: Error Handling, Logging & Monitoring

- Structured logging: use Python `logging` module with JSON formatter
- Add **Sentry** free tier (5K errors/month) for error tracking — both Django and React
- Health check endpoint enhancement: check DB, Redis, LLM API connectivity
- Add request ID middleware for tracing
- User-facing error pages: 404, 500, rate-limited, file too large

### Step 19: Testing Sprint

- Backend unit tests: all pipeline modules (`ingestion`, `parser`, `chunker`, `generator`, `validator`, `evaluator`) with mocked LLM responses
- Backend integration tests: full upload → process → quiz → exam → result flow
- API tests: every endpoint, auth required/not required, edge cases (empty file, oversized file, invalid format)
- Frontend: Playwright E2E tests for critical user journeys: signup → upload → quiz → exam → result → leaderboard
- Target: 70%+ backend coverage, 5+ E2E scenarios

### Step 20: Deployment & Launch Prep

- **Render** deployment: Web service (Django API) + Worker (Celery) + PostgreSQL (Render free tier or Supabase) + Redis (Upstash)
- React build → serve from Django (`whitenoise`) or separate Render static site
- Environment variables: all secrets in Render dashboard, zero hardcoded secrets
- Domain setup: custom domain + SSL (Render provides free SSL)
- Set up **Uptime Robot** (free) for monitoring
- Create landing page: hero section, feature showcase, "Get Started" CTA
- Set up **Google Analytics** or **Plausible** (privacy-friendly) for usage tracking
- Create onboarding flow: first-time user tutorial (3–4 step tooltip tour)
- Seed production DB with pretrained datasets
- Write user-facing docs: FAQ, how to use, supported file formats

---

## VERSION 1.1 — PERSONALIZATION + BANGLA (Weeks 15–22)

*Goal: The "AI Friend" layer. Make Sisimpur feel personal, not just a quiz machine. Add Bangla support.*

### Step 21: Conversational AI Assistant ("Sisimpur Buddy")

- Research: **conversation memory** patterns — sliding window, summary-based, RAG-based retrieval of past conversations
- Design `Conversation` model: `user` FK, `title`, `context` (linked to a document/exam), `created_at`
- Design `Message` model: `conversation` FK, `role` (user/assistant/system), `content`, `metadata` (token count, model used), `created_at`
- Build `apps/brain/pipeline/assistant.py`:
  - System prompt: "You are Sisimpur, a friendly study buddy. You explain concepts simply, encourage the student, and keep things fun. You have access to the student's study materials and performance."
  - Context injection: embed relevant document chunks + user's performance data into conversation
  - Conversation memory: last 10 messages + summary of older messages
- API endpoints: `POST /api/brain/chat/` (send message, get response), `GET /api/brain/conversations/` (list), `GET /api/brain/conversations/<id>/` (history)
- React **ChatPage** or **ChatSidebar** (persistent across pages): chat bubble, message list, typing indicator, context-aware (if on exam result page, buddy knows your score)
- "Explain this question" button on exam result → opens chat with question context pre-loaded
- "Help me understand" button on flashcards → chat with card content

### Step 22: Personalization Engine

- Design `UserLearningProfile` model: `preferred_difficulty`, `study_schedule`, `weak_topics` (JSON), `strong_topics` (JSON), `learning_pace` (fast/medium/slow), `preferred_question_types`, `daily_goal_minutes`
- Build recommendation engine (`apps/brain/pipeline/recommender.py`):
  - Analyze past exam results → identify weak topics
  - Suggest next study material based on knowledge gaps
  - Adaptive difficulty: if user scores >80%, suggest harder content; <50%, easier
  - "Daily study plan" generation: 3–5 recommended activities based on goals and gaps
- API: `GET /api/dashboard/recommendations/` — personalized suggestions
- Dashboard widget: "Your Study Plan Today" with actionable cards

### Step 23: Bangla Language Support

- Research: Bangla OCR accuracy — **EasyOCR** has Bangla support, test quality on real documents
- Research: LLM Bangla capability — test Gemini 2.0 Flash and GPT-4o-mini on Bangla text comprehension and question generation. Measure quality vs English
- Update `generator.py`: add Bangla prompt templates, ensure JSON output still works with Bangla text
- Update `parser.py`: Bangla document detection (Unicode range check), Bangla-specific OCR model loading
- UI: language selector in settings, bilingual UI strings (use **react-i18next**)
- Bangla pretrained datasets: BCS (Bengali literature, history), SSC/HSC exam prep
- Testing: Bangla-specific test cases for parsing, generation, evaluation

### Step 24: Study Reminders & Notifications

- Design `StudyReminder` model: `user` FK, `schedule` (cron expression or simple time), `days` (which days of week), `is_active`, `notification_type` (email/push)
- Celery beat tasks for scheduled reminders
- Email notifications: daily study reminder, weekly progress summary, streak at risk
- React settings: reminder configuration UI
- Future-ready: design notification system to support push notifications (web push API) in later version

### Step 25: Social Features — Study Groups (Light)

- `StudyGroup` model: `name`, `description`, `created_by`, `invite_code`, `is_public`
- `GroupMember` model: FK → `StudyGroup`, FK → `User`, `role` (admin/member), `joined_at`
- `SharedQuiz` model: FK → `StudyGroup`, FK → `ProcessingJob`, `shared_by`
- API: create group, join via invite code, share quiz with group, group leaderboard
- React **GroupsPage**: create/join groups, shared quiz feed, group leaderboard
- Keep it light — this is not a social network, just collaborative study

---

## VERSION 1.2 — B2B API PLATFORM (Weeks 23–30)

*Goal: Package the AI pipeline as a standalone API service. Other SaaS products can integrate Sisimpur's question generation, evaluation, and study tools via API keys.*

### Step 26: API Platform Architecture

- Research: API gateway patterns, API key management, usage metering, rate limiting per tenant
- Design `APITenant` model: `name`, `email`, `api_key` (hashed), `tier` (free/basic/pro), `rate_limit`, `monthly_quota`, `is_active`, `created_at`
- Design `APIUsageLog` model: `tenant` FK, `endpoint`, `method`, `request_size`, `response_size`, `latency_ms`, `status_code`, `created_at`
- Design `APIQuota` model: `tenant` FK, `month`, `requests_used`, `tokens_used`, `documents_processed`
- Build `apps/api_platform/` — new Django app for B2B API

### Step 27: B2B API Endpoints

- All endpoints under `/api/v1/` prefix with API key auth (separate from user JWT):
  - `POST /api/v1/documents/parse` — Upload document → return extracted text
  - `POST /api/v1/documents/analyze` — Upload document → return metadata (page count, language, has images, estimated reading time)
  - `POST /api/v1/questions/generate` — Text or document → questions (configurable type, count, difficulty)
  - `POST /api/v1/questions/generate-from-topic` — Topic string → questions (no document needed)
  - `POST /api/v1/answers/evaluate` — Question + correct answer + user answer → evaluation with scores
  - `POST /api/v1/flashcards/generate` — Text or document → flashcard pairs
  - `POST /api/v1/chat/completions` — Conversational study assistant (context-aware)
  - `GET /api/v1/usage/` — Current usage stats for the tenant
- Build versioned URL routing: `/api/v1/`, future `/api/v2/`
- Rate limiting per tier: Free (100 requests/day), Basic (5K/day), Pro (50K/day)
- Response format: consistent JSON envelope `{ "status": "success", "data": {...}, "usage": {"tokens": N} }`

### Step 28: API Documentation & Developer Experience

- Auto-generated OpenAPI spec with **drf-spectacular** (replace current drf-yasg — more maintained)
- Developer portal page: API docs, getting started guide, code examples (Python, JavaScript, cURL)
- API playground: interactive endpoint tester (can use Swagger UI or build custom)
- SDKs (future): Python package `pip install sisimpur`, npm package `npm install sisimpur-js`

### Step 29: Usage Metering & Billing Foundation

- Middleware: log every B2B API request to `APIUsageLog`
- Token counting: count input/output tokens per LLM call, attribute to tenant
- Monthly usage aggregation via Celery task
- Dashboard for tenants: usage graphs, quota remaining, upgrade CTA
- **Billing integration (future-ready)**: design models for `Subscription`, `Invoice`, `Payment` but don't build Stripe integration yet. Use manual approval for early B2B customers.

### Step 30: Teacher-Specific Features

- `TeacherProfile` model: extends `UserProfile` with `institution`, `subjects`, `is_verified`
- Exam paper generation: teacher selects topic + difficulty + marks distribution → AI generates complete exam paper → PDF export
- Bulk student management: teacher creates a "class", adds students, assigns quizzes
- Result visualization: per-student and per-class performance analytics
- React pages: **TeacherDashboard**, **ClassManagement**, **ExamPaperGenerator**, **ResultsOverview**
- API endpoints under `/api/teacher/` prefix

---

## VERSION 1.5 — SCALE & POLISH (Weeks 31–38)

*Goal: Handle real load. Refine based on user feedback. Add advanced features.*

### Step 31: Performance & Scalability

- Add caching layer: Redis cache for leaderboard, user progress, pretrained datasets (they don't change often)
- Database query optimization: add indexes, use `select_related`/`prefetch_related`, `django-silk` for profiling
- File storage: migrate from local disk to **S3-compatible** storage (Cloudflare R2 — free egress, 10GB free) or Supabase Storage
- Pagination on all list endpoints (cursor-based for performance)
- CDN for React static assets (Cloudflare free tier)
- Load testing: use **locust** to simulate 100+ concurrent users, identify bottlenecks

### Step 32: AI Quality Improvements

- Build evaluation framework: human-rate 200+ generated question sets on relevance, difficulty accuracy, answer correctness
- Prompt optimization: A/B test different prompt templates, measure quality scores
- Multi-model routing: easy questions → cheaper model (Gemini Flash), hard questions → better model (GPT-4o)
- Add **RAG (Retrieval-Augmented Generation)** for pretrained datasets: embed dataset content with **sentence-transformers**, store in **pgvector** (PostgreSQL extension), retrieve relevant context before generating questions
- Question diversity: ensure generated questions don't repeat patterns, cover full document

### Step 33: Advanced Exam Features

- **Adaptive testing**: adjust question difficulty in real-time based on answers (Item Response Theory lite)
- **AI-generated mock tests**: full exam simulation matching specific exam patterns (BCS, IELTS, etc.)
- **Timed exam simulation**: mimic real exam conditions with section timing, no back-navigation
- **PDF export**: generate exam paper + answer sheet as downloadable PDF (use **reportlab** or **weasyprint**)
- **Retry incorrect questions only**: filter exam to just the questions user got wrong

### Step 34: Smart Topic Summarization

- `POST /api/brain/summarize/` — Upload document → get structured summary
- Output: key concepts, definitions, important facts, topic hierarchy
- React: **SummaryPage** — visual summary with expandable sections, "Generate Quiz from This" button
- Use this as the "learning" pathway from the architecture diagram: study first, quiz later

### Step 35: File Management & Data Policy

- Implement 24-hour auto-delete policy (GDPR compliance): Celery beat task scans `ProcessingJob`, deletes `document_file` and `extracted_text_file` older than 24h, keeps `QuestionAnswer` data
- User can manually delete any data from their account
- Storage usage tracking per user
- File type validation hardening: check magic bytes, not just extension

---

## VERSION 2.0 — FULL PRODUCT (Weeks 39+)

*Goal: Mature platform. All PRD features complete. B2B API generating revenue.*

### Step 36: Video & Multimedia Support

- YouTube URL processing: extract transcript → generate questions (already built in v0.5)
- Video explanation for MCQ solutions (inspired by TurboLearn): generate short text explanation, optionally link to relevant YouTube timestamp
- Multi-image upload: capture handwritten notes page-by-page → OCR → merge text → generate questions

### Step 37: Collaborative Features

- Real-time group study rooms (WebSocket via **Django Channels**)
- Shared exam sessions: friends take same exam simultaneously, see live scores
- Discussion threads on questions: "I think the answer should be B because..."
- Teacher-student interaction: student asks doubt → routes to teacher → teacher responds

### Step 38: Mobile Optimization / PWA

- Convert React SPA to **Progressive Web App**: service worker, offline caching of flashcards, push notifications
- Add to home screen prompt
- Mobile-optimized exam interface: swipe between questions, large touch targets
- Offline flashcard review (cached from last session)

### Step 39: Bangla Deep Integration

- Bangla voice input for answers (Web Speech API)
- Bangla handwriting OCR improvements (custom fine-tuned model if needed)
- Bangla-specific question patterns: বিসিএস, প্রাথমিক সমাপনী, SSC, HSC formats
- Bangla UI translation complete (react-i18next)

### Step 40: Analytics & Growth

- Admin analytics dashboard: total users, DAU/MAU, documents processed, questions generated, exam completion rates
- User cohort analysis: retention by signup week
- A/B testing framework: test different onboarding flows, UI variations
- Referral system: invite friends → both get premium features free for a month
- SEO: server-side rendering for landing pages (or pre-rendering), meta tags, structured data

---

## CONTINUOUS / CROSS-CUTTING TASKS (Throughout all versions)

| Area | Tasks |
|---|---|
| **Documentation** | Update README.md each version. Maintain API docs. Write CONTRIBUTING guide for new devs |
| **Testing** | Write tests alongside every feature. Maintain 70%+ coverage. E2E tests for critical paths |
| **Security** | Dependency audits (`pip-audit`), OWASP top 10 review each version, penetration testing before B2B launch |
| **Monitoring** | Sentry error tracking, Uptime Robot, Celery flower for task monitoring, custom metrics dashboard |
| **User Feedback** | In-app feedback widget (from v1.0), Discord community server, monthly user interviews |
| **Legal** | Privacy policy, Terms of Service, Cookie policy, GDPR compliance, Data Processing Agreement (for B2B) |
| **DevOps** | Docker builds optimized, staging environment, database backups (daily), rollback procedures |

---

## VERIFICATION CHECKLIST

| Version | How to Verify |
|---|---|
| v0.1 | `python manage.py migrate` succeeds on PostgreSQL. All existing tests pass. No template views remain. `DEBUG=False` works. |
| v0.5 | Upload a PDF → questions generated without n8n. Celery worker processes jobs. All question types work (MCQ, short, flashcard). React SPA covers full user journey. |
| v1.0 | New user can: sign up → upload document → get questions → take exam → see score → appear on leaderboard. Pretrained datasets browsable. Deployed on Render with custom domain. Lighthouse score >80. |
| v1.1 | Chat with Sisimpur Buddy about study material. Dashboard shows personalized recommendations. Bangla document upload → Bangla questions. Study reminders arrive via email. |
| v1.2 | External developer can: get API key → call `/api/v1/questions/generate` → receive JSON questions. Usage is metered. Rate limits work. Teacher can generate exam paper PDF. |
| v1.5 | 100 concurrent users handled. Page load <2s. AI quality score >85% on eval set. RAG-powered pretrained datasets. |
| v2.0 | PWA installable. Offline flashcards work. WebSocket group study. All success metrics from PRD being tracked. |

---

## KEY ARCHITECTURAL DECISIONS

| Decision | Rationale |
|---|---|
| **PostgreSQL over MongoDB** | Django ORM is built for relational DBs; MongoDB adapters (djongo) are buggy. PostgreSQL JSONB fields handle flexible data. pgvector extension enables future RAG. |
| **React SPA over Django templates** | Single modern frontend, better UX, faster iteration. Django becomes pure API server = cleaner architecture for B2B. |
| **Own AI pipeline over n8n** | Full control over quality, latency, cost. Required for B2B API. n8n is a black box you can't sell. |
| **LiteLLM as LLM interface** | Provider-agnostic. Switch between Gemini (free), GPT-4o-mini (cheap), Groq (fast) without code changes. Critical for budget management. |
| **Celery over threading** | Current daemon threads are fragile (die on server restart). Celery gives reliability, retries, monitoring, scheduling. |
| **Supabase/Neon + Upstash for managed services** | Free tiers sufficient for MVP. No ops overhead for 1-2 dev team. |
| **Modular pipeline architecture** | Each step (parse, chunk, generate, validate) is independent. This is what makes B2B API possible — clients can call individual steps. |
