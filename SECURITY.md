# Security Implementation

This document describes the security measures implemented in Fin Doc Assistant.

## 🔐 Overview

The application uses a **serverless architecture** with Netlify Functions to protect API keys and control costs. All sensitive operations happen server-side, never in the browser.

## Architecture Diagram

```
┌─────────────────┐
│  User Browser   │
│   (React App)   │
└────────┬────────┘
         │ HTTPS Only
         │ (No API Keys)
         ▼
┌─────────────────────────┐
│  Netlify Edge Network   │
│  (CDN + Functions)      │
└────────┬────────────────┘
         │ Server-side only
         │ API Keys stored here
         ▼
┌─────────────────┐
│  Anthropic API  │
│  (Claude)       │
└─────────────────┘
```

## 🛡️ Security Features

### 1. API Key Protection

**Problem**: Exposing API keys in browser JavaScript allows anyone to steal and abuse them.

**Solution**: 
- API keys stored as Netlify environment variables (server-side only)
- Client code makes requests to `/.netlify/functions/` endpoints
- Functions make authenticated requests to Anthropic API
- Browser never sees the API key

**Files**:
- `netlify/functions/claude-extract.js` - Extraction endpoint
- `netlify/functions/claude-score.js` - Scoring endpoint
- `src/services/claudeService.js` - Client-side fetch calls

### 2. Cost Control & Rate Limiting

**Problem**: Without limits, malicious users or bugs could rack up thousands in API costs.

**Solution**:
- **Daily Cost Limit**: $1/day maximum spend (configurable)
- **In-Memory Tracking**: Functions track costs across all requests
- **Automatic Reset**: Resets at midnight UTC each day
- **Cost Calculation**: Real-time calculation based on token usage

**Implementation**:
```javascript
// In each function
const DAILY_COST_LIMIT = 1.0;

let dailyCostTracker = {
  date: new Date().toISOString().split('T')[0],
  totalCost: 0
};

// Before each API call
if (dailyCostTracker.totalCost >= DAILY_COST_LIMIT) {
  return {
    statusCode: 429,
    body: JSON.stringify({
      error: 'Daily API cost limit reached',
      errorType: 'rate_limit_error'
    })
  };
}

// After API call
dailyCostTracker.totalCost += calculatedCost;
```

### 3. Security Headers

**Problem**: Without proper headers, apps are vulnerable to XSS, clickjacking, and other attacks.

**Solution**: Netlify.toml configures security headers:

```toml
[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"                    # Prevent clickjacking
    X-Content-Type-Options = "nosniff"          # Prevent MIME sniffing
    X-XSS-Protection = "1; mode=block"          # XSS protection
    Referrer-Policy = "strict-origin-when-cross-origin"
    Permissions-Policy = "camera=(), microphone=(), geolocation=()"
```

### 4. HTTPS Enforcement

- Netlify automatically provides SSL certificates
- All traffic encrypted in transit
- No mixed content issues

## 🚨 Threat Model

### Protected Against

✅ **API Key Theft**
- Keys never sent to client
- Not visible in network requests or source code

✅ **Cost Overruns**
- Daily spending limit enforced
- Automatic shutoff at limit

✅ **Clickjacking**
- X-Frame-Options prevents iframe embedding

✅ **CSRF Attacks**
- SameSite cookie policies
- Stateless API design

✅ **Man-in-the-Middle**
- HTTPS everywhere
- Netlify's CDN security

### Not Yet Protected Against

⚠️ **DDoS Attacks**
- **Risk**: Many simultaneous requests could exhaust function quota
- **Mitigation**: Netlify has DDoS protection at edge
- **Future**: Add IP-based rate limiting

⚠️ **Authenticated Access**
- **Risk**: Anyone with the URL can use the app
- **Mitigation**: Cost limits prevent excessive abuse
- **Future**: Add Netlify Identity or OAuth

⚠️ **Data Privacy**
- **Risk**: Uploaded documents not encrypted at rest
- **Mitigation**: No server-side storage (client-side only)
- **Future**: End-to-end encryption if adding database

## 💰 Cost Tracking Details

### How Costs Are Calculated

```javascript
function calculateCost(inputTokens, outputTokens, model) {
  // Claude Sonnet 4 pricing (Feb 2025)
  const inputCostPer1M = 3.00;   // $3 per million tokens
  const outputCostPer1M = 15.00; // $15 per million tokens
  
  const inputCost = (inputTokens / 1000000) * inputCostPer1M;
  const outputCost = (outputTokens / 1000000) * outputCostPer1M;
  
  return inputCost + outputCost;
}
```

### Typical Costs Per Document

| Document Type | Avg Tokens | Cost Range |
|---------------|------------|------------|
| Simple Receipt | 500-1000 | $0.01-0.02 |
| Basic Invoice | 1000-2000 | $0.02-0.04 |
| Complex Bill | 2000-4000 | $0.04-0.08 |

**Daily Limit**: $1.00 = ~25-50 document extractions per day

### Limitations of In-Memory Tracking

**Current Implementation**:
- Cost tracking resets when function cold-starts
- Each function instance has separate counter
- Not perfect but good enough for reasonable protection

**For Higher Security**:
Consider persistent storage:
- **Redis**: Netlify Blobs or external Redis
- **Database**: Track per user/session
- **API Gateway**: Centralized rate limiting

## 🔧 Configuration

### Environment Variables

Set in Netlify Dashboard → Site Settings → Environment Variables:

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `ANTHROPIC_API_KEY` | ✅ Yes | - | Your Claude API key |
| `DAILY_COST_LIMIT` | ❌ No | 1.0 | Daily spending limit (USD) |

### Modifying Cost Limits

Edit both function files:

```javascript
// netlify/functions/claude-extract.js
const DAILY_COST_LIMIT = 1.0; // Change to desired amount

// netlify/functions/claude-score.js
const DAILY_COST_LIMIT = 1.0; // Keep in sync
```

## 📊 Monitoring & Alerts

### Netlify Function Logs

View real-time logs:
1. Go to Netlify Dashboard
2. Navigate to **Functions** tab
3. Click on a function name
4. View execution logs with costs

### Anthropic Console

Monitor total API usage:
1. Visit [console.anthropic.com](https://console.anthropic.com/)
2. Go to **Settings** → **Usage**
3. Set up billing alerts (recommended)

### Recommended Alert Thresholds

| Alert Level | Monthly Budget | When to Alert |
|-------------|----------------|---------------|
| Warning | $30/month | 50% ($15) |
| Critical | $30/month | 80% ($24) |
| Emergency | $30/month | 95% ($28.50) |

## 🔍 Security Checklist for Deployment

Before deploying to production:

- [ ] `ANTHROPIC_API_KEY` set in Netlify environment variables
- [ ] `.env` and `.env.local` in `.gitignore`
- [ ] API key removed from any committed files
- [ ] Git history cleaned if keys were ever committed
- [ ] Cost limits configured appropriately
- [ ] Security headers verified (use securityheaders.com)
- [ ] HTTPS working (green padlock in browser)
- [ ] Function logs reviewed for errors
- [ ] Anthropic billing alerts set up

## 🚨 Incident Response

### If API Key is Compromised

1. **Immediately**: Rotate key in Anthropic Console
2. Update `ANTHROPIC_API_KEY` in Netlify
3. Redeploy site
4. Review usage logs for unauthorized access
5. Report to Anthropic if needed

### If Cost Limit Exceeded

1. Check Netlify function logs for unusual activity
2. Review Anthropic console for usage patterns
3. Temporarily disable functions if needed:
   ```bash
   # In netlify.toml, comment out functions
   # [functions]
   #   node_bundler = "esbuild"
   ```
4. Investigate and patch vulnerability
5. Re-enable once safe

## 📚 Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Netlify Security Docs](https://docs.netlify.com/security/secure-access-to-sites/)
- [Anthropic Safety Best Practices](https://docs.anthropic.com/claude/docs/safety-best-practices)

## 🤝 Reporting Security Issues

If you discover a security vulnerability:
1. **Do NOT** open a public GitHub issue
2. Email: [your-email@example.com]
3. Include detailed description and steps to reproduce
4. Allow 48 hours for initial response

We take security seriously and appreciate responsible disclosure.
