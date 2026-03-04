# Notes

---

## 🚧 Technical Debt / Issues

### Knowledge Ingestion Flow

- Auto-embed business description when business is created
- Add admin UI to manually trigger web scraping / document upload
- Better error handling when Ollama/OpenAI is unavailable
- Add document upload support (PDF, DOCX)
- Add status tracking for ingestion jobs (pending, processing, completed, failed)
- Consider batch embedding for better performance
- Add ability to re-scrape/re-index existing sources

### ⚠️ Dynamic Embedding Dimensions (Future)

**Problem**: pgvector requires fixed dimensions. Current schema uses 768 (nomic-embed-text), but switching to OpenAI would need 1536, other models have different dimensions.

**Goal**: Support multiple embedding models without schema changes or data migration.

**Proposed Solutions** (need to evaluate cost/efficiency):

1. **JSONB storage**: Store embeddings as JSONB - flexible but loses HNSW index (slow at scale)
2. **Max dimension padding**: Use 4096 dims, pad shorter vectors - wastes storage
3. **Multiple columns**: Separate columns per model dimension - complex queries
4. **Model tracking + re-embed**: Track model in metadata, require re-scraping when switching models (simplest, most cost-effective)

**Recommendation**: Option 4 - track embedding model per business, require re-scraping only when changing models. This keeps queries fast and storage efficient.

### ⚠️ Upgrade: Improve Web Scraping (Priority)

Current Cheerio-based scraper has limitations:

- Can't handle JavaScript-rendered sites (React, Next.js, Vue)
- No retry logic or rate limiting
- No proxy rotation
- Gets blocked by anti-bot protection (Cloudflare, Akamai)

**Proposed Solution: Migrate to Crawlee**

- Unified API: handles both static (Cheerio) and dynamic (Playwright) sites
- Smart fallback: try static first, auto-fallback to browser if needed
- Built-in: retries, rate limiting, queue management, proxy rotation
- Production-ready: handles millions of pages

Timeline: After testing basic flow, implement Crawlee with smart fallback

### Token Usage & Billing

- Track token usage per business (input/output tokens)
- Track embedding generation usage
- Implement flat-rate pricing model (fixed model for all businesses)
- Add rate limiting per business to prevent abuse (requests per minute/hour)
- Add size limits per request (max tokens per message) to prevent abuse
- Add usage caps with alerts
- Add usage caps with alerts
- Calculate costs based on provider pricing (Deepseek, OpenAI)
- Store usage logs for analytics/billing

### Chat History

- Define strategy: no history, summary-based, or full history
- Consider costs: longer context = more tokens = higher costs
- For WhatsApp integration: Meta stores history, need to strip/limit context
- Consider sliding window approach (keep last N messages)
- Add option for users to enable/disable history
- Implement message summarization if using long history

### Chat formatting

---

## 🔮 Future Features

### Conversational E-commerce

- Product catalog integration
- Shopping cart management via chat
- Checkout flow through conversation
- Order tracking and updates
- Payment processing integration

### Multi-channel Support

- WhatsApp integration
- Facebook Messenger
- Telegram
- SMS (Twilio)

### CRM Integration

- HubSpot connector
- Salesforce integration
- Zoho CRM support
- Lead capture forms
- Customer interaction tracking
- Email/SMS follow-up automation

### Advanced Features

- Multi-language support (i18n)
- Voice input/output
- Image/media support in chat
- Analytics dashboard
- A/B testing for conversation flows
- Custom action handlers (bookings, appointments)

---

## 🏗️ Architecture

### Package Extraction

- `@chatcommerce/core` - shared types and utilities
- `@chatcommerce/ui` - React component library
- `@chatcommerce/api` - NestJS modules
- `@chatcommerce/llm` - LLM provider abstraction
- `@chatcommerce/ingestion` - Web scraping & document processing
- `@chatcommerce/storage` - Vector DB abstraction

### LLM Providers

- OpenAI integration ✅ (working)
- Anthropic Claude support
- Local model support (Ollama, LM Studio) ✅ (Ollama working)
- Multi-provider failover

### CMS Integration

- Strapi connector
- Directus integration
- Sanity CMS support
- Custom CMS module

### Infrastructure

- Self-hosted deployment option
- Docker Compose for full stack
- Kubernetes manifests
- CDN for widget distribution

---

## 📋 Current Status

- Phase: 1.1 - Chat Landing Page/FAQ Agent
- Last updated: 2026-02-22
