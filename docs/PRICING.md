# AppForge AI - Pricing & Credit System

## Pricing Tiers

### Monthly Plan
- **Price:** $25 for 100 credits
- **Cost per credit:** $0.25

### Annual Plan
- **Price:** $20 for 100 credits (billed annually)
- **Cost per credit:** $0.20

---

## Credit Costs

### Project Generation
- **Credits:** 6 credits
- **API Cost:** ~$0.50 (Claude Sonnet 4.5 with extended thinking)
- **Revenue:** $1.50 (monthly) / $1.20 (annual)
- **Profit Margin:** 2x (monthly) / 1.4x (annual)

**What it includes:**
- Full React Native + Expo project generation
- Complete TypeScript implementation
- Professional UI/UX design
- All core files (package.json, app.json, tsconfig.json, layouts, screens)
- Extended AI thinking for high-quality code

### AI Edit/Command
- **Credits:** 1 credit
- **API Cost:** ~$0.02 (Claude Sonnet 4.5 for code modifications)
- **Revenue:** $0.25 (monthly) / $0.20 (annual)
- **Profit Margin:** 11.5x (monthly) / 9x (annual)

**What it includes:**
- Iterative code modifications
- Feature additions
- Bug fixes
- Refactoring
- File updates with context awareness

---

## Cost Breakdown Example

**Scenario:** User creates 1 app and makes 10 edits

| Operation | Credits | Monthly Cost | Annual Cost |
|-----------|---------|--------------|-------------|
| 1 Project Generation | 6 | $1.50 | $1.20 |
| 10 AI Edits | 10 | $2.50 | $2.00 |
| **Total** | **16** | **$4.00** | **$3.20** |

**API Costs:** $0.50 + (10 × $0.02) = $0.70  
**Profit (Monthly):** $4.00 - $0.70 = **$3.30** (4.7x margin)  
**Profit (Annual):** $3.20 - $0.70 = **$2.50** (3.6x margin)

---

## Implementation Details

### Code Locations

**Project Generation Cost:**
- File: `app/api/generate/route.ts`
- Constant: `GENERATION_COST = 6`

**AI Edit Cost:**
- File: `app/api/projects/[projectId]/ai-command/route.ts`
- Constant: `AI_COMMAND_COST = 1`

### Wallet Management
- Credits are reserved before API calls
- Credits are settled (deducted) after successful completion
- Credits are refunded on errors
- Managed via `lib/wallet.ts`

---

## Notes

- The high profit margin on edits compensates for the lower margin on project generation
- Extended thinking mode on project generation ensures high-quality initial code
- Pricing is designed to encourage iterative development (cheaper edits)
- All costs include a buffer for API rate fluctuations and future model updates
