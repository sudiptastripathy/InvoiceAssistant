# Quick Deployment Checklist

Use this checklist to deploy Fin Doc Assistant to Netlify securely.

## ✅ Pre-Deployment

- [ ] Get Anthropic API key from [console.anthropic.com](https://console.anthropic.com/)
- [ ] Create Netlify account at [app.netlify.com](https://app.netlify.com/)
- [ ] Push code to GitHub/GitLab/Bitbucket
- [ ] Verify `.gitignore` includes `.env` and `.env.local`
- [ ] Remove any API keys from code (they should never be committed)

## ✅ Netlify Setup

- [ ] Connect repository to Netlify
- [ ] Verify build settings:
  - Build command: `npm run build`
  - Publish directory: `dist`
  - Functions directory: `netlify/functions`
- [ ] Add environment variable:
  - Key: `ANTHROPIC_API_KEY`
  - Value: [Your API key]
  - Scopes: Functions (or All scopes)
- [ ] Click "Deploy site"

## ✅ Post-Deployment

- [ ] Visit your site URL (e.g., `your-site-name.netlify.app`)
- [ ] Test document upload and extraction
- [ ] Verify Network tab shows calls to `/.netlify/functions/`
- [ ] Check Netlify function logs for any errors
- [ ] Test the $1 limit (optional): upload ~50+ documents

## ✅ Monitoring Setup

- [ ] Set up Anthropic billing alerts:
  - Go to [console.anthropic.com](https://console.anthropic.com/settings/billing)
  - Enable email alerts at 50%, 80%, 95% of budget
- [ ] Bookmark Netlify function logs page
- [ ] Set calendar reminder to check costs weekly

## ✅ Security Verification

- [ ] HTTPS working (green padlock in browser)
- [ ] API key NOT visible in browser DevTools → Network tab
- [ ] Check security headers: [securityheaders.com](https://securityheaders.com/)
- [ ] Review Netlify access logs for unusual activity

## 🚀 Optional Enhancements

- [ ] Custom domain setup (if desired)
- [ ] Enable Netlify Analytics
- [ ] Add Netlify Identity for user authentication
- [ ] Set up deploy notifications (email/Slack)
- [ ] Configure branch deploys for staging

## 📝 Notes

**Daily Cost Limit**: Currently set to **$1.00/day** in the function code.

**Estimated Usage**: 
- ~$0.02 per document
- Daily limit allows ~50 documents/day
- Monthly limit (30 days) = ~$30

**Need to change the limit?**
1. Edit `netlify/functions/claude-extract.js` 
2. Change `const DAILY_COST_LIMIT = 1.0;`
3. Do the same in `claude-score.js`
4. Commit and push to redeploy

## 🆘 Having Issues?

See [DEPLOYMENT.md](DEPLOYMENT.md) for full troubleshooting guide.

Common issues:
- **"API authentication failed"** → Check `ANTHROPIC_API_KEY` in Netlify env vars
- **"Daily limit reached"** → Wait until midnight UTC or increase limit
- **Functions not working** → Check function logs in Netlify dashboard
- **Build failed** → Check build logs, ensure Node 18+ is used

## 🎉 You're Done!

Your app is now:
- ✅ Securely deployed with protected API keys
- ✅ Limited to $1/day spending
- ✅ Running on Netlify's global CDN
- ✅ HTTPS encrypted
- ✅ Production-ready

Share your site and enjoy! 🚀
