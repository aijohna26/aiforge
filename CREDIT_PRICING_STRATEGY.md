# Credit Pricing Strategy & Implementation Notes

## Current Status: MVP Testing Phase

### ⚠️ IMPORTANT - READ BEFORE PRODUCTION LAUNCH

The current credit costs are **intentionally generous** for MVP testing. They are **NOT sustainable** for a profitable business and must be adjusted before launching paid tiers or accepting real money.

---

## Current Implementation (As of Nov 26, 2025)

### Credit Costs
```typescript
// app/api/generate/route.ts
const GENERATION_COST = 5; // Full app generation

// app/api/projects/[projectId]/ai-command/route.ts
const AI_COMMAND_COST = 2; // Iterative edits
```

### User Allocation
```sql
-- supabase/migrations/004_add_wallets.sql
DEFAULT balance = 100 credits
```

### What Users Get FREE
- **100 free credits** on signup
- **20 full apps** (100 ÷ 5 = 20)
- **50 AI edits** (100 ÷ 2 = 50)
- **Or mix:** e.g., 10 apps + 25 edits

### Why This Is Too Generous
1. **Cost Analysis:**
   - Each full app generation ≈ $0.50 in Claude API costs
   - 20 free apps = $10 in costs per user
   - We'd lose money on free tier

2. **Business Impact:**
   - Users won't convert to paid
   - No urgency to upgrade
   - Can't sustain growth
   - Won't reach revenue goals

---

## Recommended Production Pricing

### Phase 1: Launch (First 1000 Users)
Keep current pricing to build user base and get feedback.

**Timing:** Months 1-2
**Goal:** Prove product-market fit, collect testimonials
**Risk:** Acceptable - we need users first

### Phase 2: Paid Tier Launch
Adjust before accepting payment.

**Timing:** Month 3 (when launching Stripe)
**Changes:**

```typescript
// New credit costs
const GENERATION_COST = 25;      // Up from 5 (5x increase)
const AI_COMMAND_COST = 10;      // Up from 2 (5x increase)

// New free allocation
DEFAULT balance = 50;            // Down from 100
```

**New User Experience:**
- **50 free credits** on signup
- **2 full apps** (50 ÷ 25 = 2)
- **5 AI edits** (50 ÷ 10 = 5)
- **Or mix:** 1 app + 2.5 edits

**Rationale:**
- 2 apps is enough to evaluate the product
- Forces upgrade for real usage
- Cost per free user: ~$1.25 (sustainable)
- Maintains good conversion funnel

### Phase 3: Optimization (After Data)
Adjust based on actual metrics.

**Timing:** Months 4-6
**Monitor:**
- Credit exhaustion rate
- Free → Paid conversion %
- Customer feedback on value
- Actual AI costs per operation

**Adjust dynamically based on:**
- If conversion < 3%: Make free tier more generous
- If conversion > 10%: Free tier might be too generous
- Target: 5-7% conversion rate

---

## Paid Tier Structure

### Starter - $15/month
```yaml
Credits: 500/month
Apps: ~20 full apps OR 50 edits
Cost to us: ~$4.50
Margin: 70%
```

### Pro - $40/month
```yaml
Credits: 1500/month
Apps: ~60 full apps OR 150 edits
Cost to us: ~$10
Margin: 75%
```

### Business - $100/month
```yaml
Credits: 4000/month
Apps: ~160 full apps OR 400 edits
Cost to us: ~$20
Margin: 80%
```

---

## Implementation Checklist

### Before Launching Paid Tiers:

- [ ] Update `GENERATION_COST` to 25
- [ ] Update `AI_COMMAND_COST` to 10
- [ ] Update default wallet balance to 50
- [ ] Run migration to adjust existing user credits (or grandfather them)
- [ ] Update error messages with new costs
- [ ] Update marketing copy with new limits
- [ ] Add pricing page with credit explanations
- [ ] Implement Stripe integration
- [ ] Add credit purchase flow
- [ ] Set up analytics to track:
  - Credit exhaustion rate
  - Time to credit exhaustion
  - Conversion rate at exhaustion
  - Upgrade triggers

### Migration Strategy for Existing Users:

**Option A: Grandfather Clause**
- Existing users keep 100 credits
- New users get 50 credits
- Shows appreciation for early adopters

**Option B: Hard Cut**
- Everyone gets new pricing
- Clear communication about why
- Offer one-time bonus for existing users

**Recommended: Option A** (better for goodwill)

---

## Cost Calculations

### AI Cost per Operation (Estimates)

**Full App Generation:**
- Input tokens: ~5,000 (system prompt)
- Output tokens: ~15,000 (5 files with code)
- With caching: ~$0.40 per generation
- Without caching: ~$0.65 per generation
- **Average: $0.50**

**AI Edit/Command:**
- Input tokens: ~3,000 (context + prompt)
- Output tokens: ~5,000 (modified files)
- With caching: ~$0.15 per edit
- Without caching: ~$0.25 per edit
- **Average: $0.20**

### Target Margins

| Tier | Price | Credits | Max Apps | Our Cost | Margin |
|------|-------|---------|----------|----------|--------|
| Free | $0 | 50 | 2 | $1.00 | -100% |
| Starter | $15 | 500 | 20 | $4.50 | 70% |
| Pro | $40 | 1500 | 60 | $10 | 75% |
| Business | $100 | 4000 | 160 | $20 | 80% |

**Notes:**
- Free tier is a marketing cost (CAC)
- Margins improve with scale (better caching, bulk rates)
- Target blended margin across all tiers: ~75%

---

## Analytics to Track

### Key Metrics:
1. **Credit Exhaustion Rate**
   - % of users who use all credits
   - Time to exhaustion
   - What operation exhausts them (apps vs edits)

2. **Conversion Funnel**
   - Free signup → Credit exhaustion → Upgrade
   - Where users drop off
   - What triggers upgrades

3. **Usage Patterns**
   - Apps vs edits ratio
   - Peak usage times
   - Abandoned projects

4. **Revenue Metrics**
   - MRR by tier
   - Churn rate
   - LTV per tier
   - Upgrade/downgrade flows

### SQL Queries Needed:

```sql
-- Track credit usage patterns
SELECT
  user_id,
  initial_balance - balance as credits_used,
  created_at,
  updated_at,
  EXTRACT(EPOCH FROM (updated_at - created_at))/3600 as hours_to_exhaustion
FROM wallets
WHERE balance < 10;

-- Track conversion rate
SELECT
  COUNT(DISTINCT w.user_id) as total_users,
  COUNT(DISTINCT CASE WHEN w.balance < 10 THEN w.user_id END) as exhausted_users,
  COUNT(DISTINCT s.user_id) as paid_users,
  (COUNT(DISTINCT s.user_id)::float / COUNT(DISTINCT w.user_id) * 100) as conversion_rate
FROM wallets w
LEFT JOIN subscriptions s ON w.user_id = s.user_id;
```

---

## Next Steps

1. **Immediate (MVP Phase)**
   - ✅ Current generous pricing
   - ✅ Document in PRD
   - ✅ Set reminder to adjust before Stripe launch

2. **Before Paid Launch (Month 3)**
   - [ ] Review actual AI costs
   - [ ] Adjust credit costs to production values
   - [ ] Migrate existing users appropriately
   - [ ] Update all documentation

3. **Ongoing Optimization**
   - [ ] Monitor metrics weekly
   - [ ] A/B test pricing on new cohorts
   - [ ] Adjust based on conversion data
   - [ ] Survey users about perceived value

---

## Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2025-11-26 | Set MVP pricing at 5/2 credits | Generous free tier for user acquisition and testing |
| TBD | Increase to 25/10 credits | Before Stripe launch to ensure profitability |
| TBD | Optimize based on data | After collecting real usage metrics |

---

**Last Updated:** November 26, 2025
**Next Review:** Before Stripe Integration (Month 3)
**Owner:** Product/Business Team
