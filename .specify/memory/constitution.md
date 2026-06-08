<!--
Sync Impact Report
- Version change: 0.0.0 → 1.0.0
- List of modified principles: (New Initialization)
- Added sections: Mission Statement, Guiding Principles, Non-Negotiable Standards, Decision Framework, Engineering Principles, Product Principles, Content Principles, User Experience Principles, Data and Privacy Principles, AI Summarization Principles, Reliability and Scalability Principles, Governance Rules.
- Removed sections: N/A
- Templates requiring updates: ✅ .specify/templates/plan-template.md
- Follow-up TODOs: None
-->

# AI News Update Mobile App Constitution

## Mission Statement

Become the most trusted destination for AI professionals to discover, understand, and track important AI developments through curated, high-signal, and easy-to-consume updates.

## Guiding Principles

### 1. Signal Over Noise
Focus strictly on high-impact AI news, research announcements, model releases, product launches, and industry developments. Avoid redundant or low-value content. 

### 2. Accuracy Over Speed
Information correctness and factual reporting take precedence over breaking news first. Deliberately slow down to verify if needed.

### 3. Original Sources Over Secondary Reporting
Always link to and summarize from the official company blogs, research papers, or primary announcements rather than secondary commentary.

### 4. Simplicity Over Unnecessary Complexity
The app and its architecture must remain simple and focused on delivering news efficiently. Avoid bloated features that do not directly serve the core mission.

### 5. Transparency and Trust
Clear attribution of information sources and responsible disclosure of any AI-generated content (e.g., summaries).

### 6. User Value Over Engagement Metrics
Design features to empower the user's professional awareness, not to trap them in a feed or farm engagement clicks.

## Non-Negotiable Standards

- **Primary Sourcing:** Every news item MUST link to its original source.
- **AI Transparency:** AI-generated summaries MUST be clearly labeled as such.
- **No Dark Patterns:** The app MUST NOT employ manipulative engagement tactics or hidden data collection.

## Decision Framework

When faced with trade-offs, decisions MUST be evaluated using the following priorities (highest to lowest):
1. **Accuracy & Truthfulness:** Does this change compromise our factual integrity?
2. **User Privacy:** Are we respecting the "Privacy by default" principle?
3. **Simplicity:** Can this feature be achieved with less complexity?
4. **Speed/Engagement:** Only optimize these if 1-3 are satisfied.

## Engineering Principles

- **React Native (Expo) First:** Standardize on Expo for the React Native mobile application for speed and consistency.
- **Privacy by Default:** Do not collect analytics or user data beyond what is strictly required to function.
- **Reliable & Resilient:** Graceful error handling for network requests, especially when parsing third-party content.

## Product Principles

- The core loop is reading updates: make this frictionless.
- Provide a curated experience: users trust us to filter out the noise.

## Content Principles

- Maintain strict neutrality and objectivity in summaries.
- Examples of trusted sources: OpenAI, Anthropic, Google DeepMind, Meta AI, Microsoft AI, NVIDIA, Hugging Face, Mistral AI, xAI, Perplexity.

## User Experience Principles

- Clean, typography-first design optimized for readability.
- Fast load times for offline/online transitions.

## Data and Privacy Principles

- Zero third-party trackers unless strictly necessary and explicitly opted into.
- Local-first caching of news items where appropriate to save bandwidth and protect privacy.

## AI Summarization Principles

- AI models used for summarization must be prompted to remain objective and factual.
- Hallucinations must be mitigated by strictly grounding the summary in the source text.

## Reliability and Scalability Principles

- The backend/aggregation layer must handle source changes gracefully.
- The mobile client must be resilient to API downtime.

## Governance Rules

- All Pull Requests must verify compliance with these constitution principles.
- Modifications to this constitution require a PR with documented justification.

**Version**: 1.0.0 | **Ratified**: 2026-06-08 | **Last Amended**: 2026-06-08
