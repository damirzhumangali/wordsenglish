# VocabFlow 🌊

**VocabFlow** is a modern, gamified web application for mastering English vocabulary. Built to bridge the gap between **passive recognition** and **active recall**, VocabFlow trains users to spontaneously remember words, formulate sentences, and use them confidently in spoken conversation.

---

## ✨ Key Features

1. **Personalized Onboarding**:
   - Calibrated English level assessment (A1 to C1).
   - Targeted learning tracks (Daily English, IELTS, TOEFL, University, Work, IT & Programming, Travel, Business).
   - Daily word targets (5 to 30 words/day) & study duration.
   - Automated learning plan generation.

2. **Spaced Repetition System (SRS)**:
   - Scientifically scheduled retrieval intervals: `10m` → `1d` → `3d` → `7d` → `14d` → `30d` → `60d` → `MASTERED`.
   - Adaptive priority decay calculation based on overdue scores, error frequency, and memory strength.
   - Ease factor calibration and user self-ratings (`Again`, `Hard`, `Good`, `Easy`).

3. **8 Interactive Quiz & Training Modes**:
   - **Flashcard Stage**: Pre-quiz contextual exposure with IPA pronunciation, audio, definition, and example sentences.
   - **English → Russian / Kazakh Quiz**: Rapid multiple-choice recognition with instant explanatory feedback.
   - **Russian → English Quiz**: Inverted recall with weighted learning scores.
   - **Fill the Gap**: Cloze sentences with choice chips or typed inputs.
   - **Active Recall**: Pure Russian prompt requiring typed English with Levenshtein-distance typo tolerance and letter highlighting.
   - **Word Match**: Fast-paced 5-pair connecting game with stopwatch timer and combo bonuses.
   - **Sentence Builder**: Interactive scrambled word chips assembly.
   - **Listening Quiz**: Real Web Speech API text-to-speech audio identification.
   - **Speaking & AI Analysis**: Speech-to-text recognition with pronunciation and grammar feedback scoring.

4. **Gamification & Habit Building**:
   - **Streak System**: Daily streaks with contribution calendar heatmap.
   - **Learner Rank Ladder**: Level 1 Beginner → Level 5 Explorer → Level 10 Learner → Level 20 Speaker → Level 30 Advanced → Level 50 Vocabulary Master.
   - **Arcade Hub**: Speed Quiz (60s rapid sprint), Memory Cards (flip-to-match), and Vocabulary Battle (1v1 duel against AI with 3 hearts).
   - **Badges & Achievements**: 8+ unlockable badges for milestones and streaks.

5. **Curated & Custom Lexicon**:
   - 110+ comprehensive seed words spanning A1 to C1 across 7 professional categories.
   - Russian and Kazakh translation support.
   - Custom word creation with automatic enrollment into the SRS cycle.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router, Turbopack)
- **UI & Styling**: React 19, Tailwind CSS v4, Lucide Icons, Framer Motion, Canvas Confetti
- **Audio & Speech**: Browser Web Audio API synthesizer chimes & Web Speech API (TTS & STT)
- **Database & Auth**: Supabase PostgreSQL with Row Level Security (RLS) + offline-first LocalStorage synchronization fallback

---

## 🚀 Getting Started Locally

### 1. Install dependencies
```bash
npm install
```

### 2. Run the development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. (Optional) Connect Supabase
To connect a live Supabase project:
1. Create a project at [supabase.com](https://supabase.com).
2. Execute the queries inside [supabase_schema.sql](file:///Users/damirfile/Desktop/wordskil/supabase_schema.sql) in the Supabase SQL Editor.
3. Add your environment variables in `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

*Note: VocabFlow works out of the box in Demo Mode without requiring any external keys.*

---

## ⌨️ Desktop Keyboard Shortcuts

- `1` / `2` / `3` / `4`: Select quiz option
- `Enter`: Submit answer / Proceed to next question
- `Space`: Replay audio pronunciation
# wordsenglish
