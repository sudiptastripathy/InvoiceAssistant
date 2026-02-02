# Netlify Deployment Guide

This guide explains how to securely deploy Fin Doc Assistant to Netlify with API key protection and cost limits.

## 🔐 Security Features

The app has been configured with the following security measures:

1. **API Key Protection**: Anthropic API keys are stored server-side only (never exposed to the browser)
2. **Daily Cost Limits**: Automatic $1/day spending limit to prevent runaway costs
3. **Serverless Functions**: All API calls are proxied through Netlify Functions
4. **Security Headers**: X-Frame-Options, CSP, and other security headers configured

## 📋 Prerequisites

- [Netlify Account](https://app.netlify.com/signup) (free tier is sufficient)
- [Anthropic API Key](https://console.anthropic.com/)
- Git repository (GitHub, GitLab, or Bitbucket)

## 🚀 Deployment Steps

### 1. Prepare Your Repository

Make sure your changes are committed and pushed to your Git repository:

```bash
git add .
git commit -m "Add Netlify deployment configuration"
git push origin main
```

### 2. Connect to Netlify

1. Log in to [Netlify](https://app.netlify.com/)
2. Click **"Add new site"** → **"Import an existing project"**
3. Choose your Git provider and select this repository
4. Netlify will auto-detect the build settings from `netlify.toml`

### 3. Configure Environment Variables

Before deploying, you **must** set up the API key:

1. In Netlify, go to **Site settings** → **Environment variables**
2. Click **"Add a variable"**
3. Add the following:
   - **Key**: `ANTHROPIC_API_KEY`
   - **Value**: Your Anthropic API key from [console.anthropic.com](https://console.anthropic.com/)
   - **Scopes**: Select "All scopes" or at minimum "Functions"

### 4. Deploy

Click **"Deploy site"** in Netlify. The deployment will:
- Install dependencies
- Build your React app with Vite
- Deploy serverless functions
- Make your site live at `https://[your-site-name].netlify.app`

### 5. Test Your Deployment

1. Visit your Netlify site URL
2. Upload a test invoice/receipt
3. Verify the extraction works
4. Check the Network tab to confirm API calls go to `/.netlify/functions/` (not directly to Anthropic)

## 🔧 Local Development with Netlify Functions

To test the serverless functions locally:

```bash
# Install Netlify CLI globally (one-time)
npm install -g netlify-cli

# Run the app with Netlify Dev
npm run dev:netlify
```

This starts a local server that simulates the Netlify environment, including Functions.

**Important**: Create a `.env` file for local development:

```bash
cp .env.example .env
# Edit .env and add your ANTHROPIC_API_KEY
```

## 💰 Cost Management

### Daily Limit

The app is configured with a **$1/day spending limit** by default. This is tracked in-memory within the serverless functions.

**How it works:**
- Each API call to Claude costs ~$0.01-0.05 depending on document complexity
- The function tracks total daily spend
- When limit is reached, users see: "Daily API cost limit reached. Try again tomorrow."
- Limit resets automatically at midnight UTC

### Monitoring Costs

1. Check Netlify Function logs:
   - Go to **Functions** tab in Netlify dashboard
   - View real-time logs showing cost per request

2. Monitor Anthropic usage:
   - Visit [Anthropic Console](https://console.anthropic.com/settings/usage)
   - View total API usage and costs

### Adjusting the Limit

To change the $1/day limit:

1. Edit `netlify/functions/claude-extract.js`
2. Change `const DAILY_COST_LIMIT = 1.0;` to your desired amount
3. Repeat for `netlify/functions/claude-score.js`
4. Redeploy

## 🛡️ Security Best Practices

### What's Protected

✅ **API keys never sent to browser**  
✅ **Server-side rate limiting**  
✅ **Security headers configured**  
✅ **HTTPS enforced by Netlify**  

### Additional Recommendations

1. **Enable Netlify's built-in authentication** if you want to restrict access:
   ```bash
   # In netlify.toml, add:
   [[redirects]]
     from = "/*"
     to = "/.netlify/identity/login"
     status = 302
     force = true
     conditions = {Role = []}
   ```

2. **Set up Anthropic usage alerts**:
   - Go to Anthropic Console → Billing
   - Set up email alerts at 50%, 75%, 90% of your monthly budget

3. **Use Netlify's IP restrictions** (Pro plan):
   - Restrict access by IP address range
   - Useful for internal company tools

4. **Monitor Function logs regularly**:
   - Check for unusual usage patterns
   - Look for failed authentication attempts

## 🐛 Troubleshooting

### "API authentication failed"

- **Cause**: Missing or invalid `ANTHROPIC_API_KEY` environment variable
- **Fix**: Double-check the API key in Netlify's environment variables

### "Daily API cost limit reached" 

- **Cause**: $1/day limit exceeded
- **Fix**: Wait until next day (midnight UTC) or increase limit in function code

### Functions not working locally

- **Cause**: Not using Netlify Dev
- **Fix**: Use `npm run dev:netlify` instead of `npm run dev`

### "Function invocation failed"

- **Cause**: Function timeout or error
- **Fix**: Check Netlify Function logs for detailed error messages

## 📊 Netlify Free Tier Limits

The free tier includes:
- 125,000 function requests/month
- 100 hours of function runtime/month
- 100GB bandwidth/month

With careful use, this is sufficient for personal use. If you exceed limits:
- Consider upgrading to Netlify Pro ($19/month)
- Or optimize by reducing API calls

## 🔄 Updating Your Deployment

To deploy changes:

```bash
git add .
git commit -m "Your changes"
git push origin main
```

Netlify automatically deploys when you push to your main branch.

## 📚 Additional Resources

- [Netlify Functions Documentation](https://docs.netlify.com/functions/overview/)
- [Anthropic API Documentation](https://docs.anthropic.com/)
- [Netlify Environment Variables Guide](https://docs.netlify.com/environment-variables/overview/)

## 🆘 Need Help?

- [Netlify Support](https://answers.netlify.com/)
- [Anthropic Discord](https://discord.gg/anthropic)
- Open an issue in this repository
