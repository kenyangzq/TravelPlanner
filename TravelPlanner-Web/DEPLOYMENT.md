# TravelPlanner Web - Azure Deployment Guide

Complete guide for deploying TravelPlanner Web as a PWA on Azure and installing it on your iPhone.

---

## Table of Contents
1. [Deployment Options](#deployment-options)
2. [Prerequisites](#prerequisites)
3. [Method 1: Azure Static Web Apps (Recommended)](#method-1-azure-static-web-apps)
4. [Method 2: Azure Container Apps](#method-2-azure-container-apps)
5. [Method 3: Azure Storage Static Website](#method-3-azure-storage-static-website)
6. [PWA Installation on iPhone](#pwa-installation-on-iphone)
7. [Testing Checklist](#testing-checklist)
8. [Troubleshooting](#troubleshooting)

---

## Deployment Options

### Comparison

| Method | Difficulty | Cost | SSL/HTTPS | Custom Domain | Recommended For |
|--------|-----------|------|-----------|---------------|------------------|
| **Azure Static Web Apps** | Easy | Free tier | ✅ Auto | ✅ Yes | **Production** ⭐ |
| **Azure Container Apps** | Medium | $$ | ✅ Yes | ✅ Yes | Scaling needs |
| **Azure Storage Static** | Easy | $ | ✅ Manual | ✅ Yes | Simple hosting |

**Recommendation**: Use **Azure Static Web Apps** - free tier, automatic SSL, GitHub integration, and built for PWAs.

---

## Prerequisites

### Required Accounts
- [ ] GitHub account (for deployment automation)
- [ ] Azure account (free tier available)

### Required Tools
- [ ] Git installed locally
- [ ] Node.js 18+ installed locally
- [ ] iPhone with iOS 12.2+ (for PWA)

### Before Deploying
- [ ] Test the app locally: `npm run build && npm start`
- [ ] Verify PWA manifest loads in browser DevTools
- [ ] Confirm RapidAPI key is set in production environment

---

## Method 1: Azure Static Web Apps (Recommended)

### Why This Method?
- ✅ **Free tier** includes:
  - 100 GB bandwidth/month
  - 100 build minutes/month
  - Automatic SSL/HTTPS
  - Global CDN distribution
  - Production + staging environments
- ✅ Perfect for PWAs (supports service workers)
- ✅ GitHub integration for automatic deployments

### Step-by-Step Guide

#### 1. Prepare Your Repository

```bash
# Navigate to your project
cd TravelPlanner-Web

# Initialize git repository (if not already done)
git init
git add .
git commit -m "Initial commit: TravelPlanner Web App"

# Create GitHub repository and push
# 1. Go to https://github.com/new
# 2. Create new repository (name: travel-planner-web)
# 3. Run these commands:
git remote add origin https://github.com/YOUR_USERNAME/travel-planner-web.git
git branch -M main
git push -u origin main
```

#### 2. Create Azure Static Web App

1. **Go to Azure Portal**
   - Navigate to: https://portal.azure.com
   - Sign in with your Microsoft account

2. **Create Static Web App Resource**
   - Click "Create a resource"
   - Search for "Static Web Apps"
   - Click "Create"

3. **Configure Basics Tab**
   ```
   Resource Group: Create new (e.g., "travel-planner-rg")
   Name: travel-planner-web
   Region: East US (or closest to you)
   Hosting plan: Free
   ```

4. **Deploy Source Tab**
   - **Source**: GitHub
   - **Organization**: Select your GitHub account
   - **Repository**: travel-planner-web
   - **Branch**: main
   - **Build preset**: Next.js
   - **App location**: `/`
   - **Api location**: (leave empty)
   - **Output location**: `.next`

5. **Environment Variables** (Important!)
   - Click "Add custom environment variable"
   - **Name**: `RAPIDAPI_KEY`
   - **Value**: Your RapidAPI key (`a5b030f3f7msh3801762249c3092p19b356jsn0442dc4d2023`)

6. **Review + Create**
   - Click "Review + create"
   - Click "Create"

7. **Wait for Deployment**
   - Azure will automatically build and deploy your app
   - Takes 2-5 minutes
   - Progress shown in "Deployment Center"

#### 3. Access Your Deployed App

1. **Get Your URL**
   - Go to your Static Web App in Azure Portal
   - Copy the "URL" from Overview blade
   - Format: `https://travel-planner-web.azurestaticapps.net`

2. **Test the App**
   - Open the URL in your browser
   - Verify all features work:
     - Create trip
     - Add events
     - Flight search
     - Location search
     - Navigation links

#### 4. Configure Custom Domain (Optional)

1. **Go to Custom Domains**
   - In your Static Web App
   - Go to "Custom domains" blade

2. **Add Custom Domain**
   - Click "Add"
   - Enter your domain (e.g., `app.yourdomain.com`)

3. **Configure DNS**
   - Azure will show you DNS records to add
   - Add these records to your domain registrar
   - Examples:
     ```
     CNAME app.azurestaticapps.net
     OR
     A record with Azure-provided IP
     ```

4. **Validate and Enable**
   - Wait for DNS propagation (can take 24-48 hours)
   - Click "Validate" in Azure Portal
   - Click "Enable" once validated

---

## Method 2: Azure Container Apps

### When to Use
- Need custom server configuration
- Want container-based deployment
- Need more control over build process

### High-Level Steps

```bash
# 1. Create Dockerfile
cat > Dockerfile << 'EOF'
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
COPY --from=build /app/public ./public
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"
CMD ["node", "server.js"]
EOF

# 2. Update next.config.js
# Add: output: 'standalone'

# 3. Build and push to Azure Container Registry
az acr create --resource-group travel-planner-rg --name travelplanneracr --sku Basic
az acr build --registry travelplanneracr --image travel-planner-web .

# 4. Create Container App
az containerapp create \
  --resource-group travel-planner-rg \
  --name travel-planner-web \
  --image travelplanneracr.azurecr.io/travel-planner-web:latest \
  --target-port 3000 \
  --env-vars RAPIDAPI_KEY=your_key_here
```

---

## Method 3: Azure Storage Static Website

### When to Use
- Simple static hosting
- Don't need automatic deployments
- Want minimal configuration

### High-Level Steps

```bash
# 1. Build the app
npm run build
# The built files are in .next/ and public/

# 2. Create Storage Account
az storage account create \
  --name travelplannerstorage \
  --resource-group travel-planner-rg \
  --location eastus \
  --sku Standard_LRS \
  --kind StorageV2

# 3. Enable static website
az storage blob service-property update \
  --account-name travelplannerstorage \
  --static-website true \
  --404-document index.html

# 4. Get URLs
az storage account show \
  --name travelplannerstorage \
  --query primaryEndpoints.web
```

---

## PWA Installation on iPhone

### Prerequisites
- iPhone with iOS 12.2 or later
- Safari browser
- Stable internet connection during installation

### Installation Steps

#### 1. Open the App in Safari
```
1. Open Safari on your iPhone
2. Navigate to your deployed app URL
   e.g., https://travel-planner-web.azurestaticapps.net
3. Wait for the page to fully load
4. Verify the app loads correctly
```

#### 2. Add to Home Screen
```
1. Tap the Share button (square with arrow pointing up)
   - Location: Bottom of Safari toolbar
2. Scroll down and tap "Add to Home Screen"
3. Review the app details:
   - Name: TravelPlanner (you can edit this)
   - URL: (should auto-fill)
4. Tap "Add" in top-right corner
```

#### 3. Launch the App
```
1. Look for TravelPlanner icon on your home screen
2. Tap the icon to launch
3. App should open in full-screen (like a native app)
4. No Safari toolbar should be visible
```

### What to Expect
- ✅ Full-screen app (no browser UI)
- ✅ App icon on home screen
- ✅ Works offline (after first visit)
- ✅ Fast startup (cached resources)
- ⚠️ Push notifications not supported (needs service worker updates)

---

## Environment Variables Configuration

### Production vs Development

**Development (.env.local)**:
```bash
RAPIDAPI_KEY=a5b030f3f7msh3801762249c3092p19b356jsn0442dc4d2023
```

**Production (Azure Portal)**:
1. Go to your Static Web App
2. Navigate to "Environment variables"
3. Add:
   - **Name**: `RAPIDAPI_KEY`
   - **Value**: `a5b030f3f7msh3801762249c3092p19b356jsn0442dc4d2023`
   - **Deployment environment**: All (Production, Staging, etc.)

### Security Notes
- ⚠️ **Never commit `.env.local` to git** (it's in .gitignore)
- ✅ The key is now in Azure's secure environment variables
- ✅ Not exposed in client-side code
- ⚠️ RapidAPI has rate limits (300 calls/month free tier)

---

## Testing Checklist

### After Deployment

#### Browser Testing (Desktop)
- [ ] Home page loads at deployed URL
- [ ] Create new trip works
- [ ] Navigate to trip detail page
- [ ] Add all event types (Flight, Hotel, Restaurant, Activity, Car Rental)
- [ ] Flight search returns real data
- [ ] Location search works
- [ ] Navigation links open Google Maps
- [ ] Delete events/trips works

#### PWA Testing
- [ ] PWA manifest loads (check Chrome DevTools > Application > Manifest)
- [ ] Service worker registers (check DevTools > Application > Service Workers)
- [ ] App works offline (DevTools > Network > Offline)
- [ ] App icon appears correctly

#### iPhone Testing
- [ ] Safari loads the app
- [ ] "Add to Home Screen" option appears
- [ ] App installs successfully
- [ ] App launches in full-screen from home screen
- [ ] All features work on mobile
- [ ] Touch interactions work correctly
- [ ] No horizontal scrolling issues
- [ ] Safe areas render correctly (notch, home indicator)

#### Performance
- [ ] First Contentful Paint < 3 seconds
- [ ] Time to Interactive < 5 seconds
- [ ] No console errors
- [ ] Images/icons load properly

---

## Troubleshooting

### Common Issues and Solutions

#### Issue 1: "Failed to compile" in Azure

**Error**: Build fails in Azure but works locally

**Solutions**:
```bash
# 1. Test build locally in production mode
npm run build
# If this fails, fix errors before deploying

# 2. Check Azure build logs
# Go to: Static Web App > Deployment Center > Logs
# Look for specific error messages

# 3. Common fixes:
# - Missing dependencies: Add to package.json
# - TypeScript errors: Fix strict mode issues
# - Module resolution: Check import paths (@/lib/...)
```

#### Issue 2: PWA Not Installing on iPhone

**Symptoms**: "Add to Home Screen" option doesn't appear

**Solutions**:
```bash
# 1. Check PWA manifest
# Open DevTools > Application > Manifest
# Verify:
# - display: "standalone"
# - icons array exists
# - start_url is correct

# 2. Check service worker
# DevTools > Application > Service Workers
# Verify:
# - Service worker is registered
# - No console errors

# 3. Verify manifest URL is accessible
# https://your-app.azurestaticapps.net/manifest.webmanifest
# Should return JSON, not 404

# 4. Check for HTTPS
# PWAs only work over HTTPS (or localhost)
# Azure provides this automatically
```

#### Issue 3: RapidAPI Not Working in Production

**Symptoms**: Flight search fails with "API key not configured"

**Solutions**:
```bash
# 1. Verify environment variable in Azure
# Azure Portal > Static Web App > Environment Variables
# Check RAPIDAPI_KEY is set

# 2. Check API key format
# Should be: a5b030f3f7msh3801762249c3092p19b356jsn0442dc4d2023
# No quotes, no extra spaces

# 3. Test API route directly
# https://your-app.azurestaticapps.net/api/flights?number=UA1234&date=2025-02-15
# Should return flight data or error

# 4. Check browser console for errors
# Look for CORS issues or 401 errors
```

#### Issue 4: App Shows "Old Version" After Deployment

**Symptoms**: Changes not reflected after deployment

**Solutions**:
```bash
# 1. Clear browser cache
# Safari: Settings > Safari > Clear History and Website Data

# 2. Clear PWA cache (uninstall and reinstall)
# 1. Long-press app icon
# 2. Tap "Remove App"
# 3. Reinstall from Safari

# 3. Force refresh in Safari
# Pull down to refresh on page

# 4. Check Azure deployment status
# Azure Portal > Deployment Center
# Verify latest deployment succeeded
```

#### Issue 5: Navigation Links Not Working

**Symptoms**: Google Maps links don't open

**Solutions**:
```javascript
// 1. Check Google Maps URL format in lib/services/mapsService.ts
// Should be: https://www.google.com/maps/dir/?api=1&destination=...

// 2. Test URL manually in browser
// Copy URL from console and test

// 3. Verify coordinates are being saved
// Check IndexedDB in DevTools > Application > IndexedDB > TravelPlannerDB
// Look for latitude/longitude fields

// 4. Check for popup blockers
// Safari might block new windows
// Check Safari > Settings > Safari > Pop-ups
```

---

## Monitoring and Maintenance

### Azure Static Web Apps Monitoring

#### View Metrics
1. Go to Azure Portal
2. Open your Static Web App
3. View metrics:
   - Requests (total, by response code)
   - Bandwidth
   - Response time
   - Server errors

#### Set Up Alerts
1. Go to "Alerts" blade
2. Create alert rules:
   - Failed requests > threshold
   - Response time > threshold
   - App crashed

#### Logs and Diagnostics
1. Go to "Log Stream" to see real-time logs
2. Use "Deployment Center" for build/deployment logs
3. Use "Functions" for API route logs

### Regular Maintenance Tasks

#### Monthly
- [ ] Review Azure usage (free tier limits)
- [ ] Check RapidAPI usage (300 calls/month free)
- [ ] Test app functionality
- [ ] Review error logs

#### Quarterly
- [ ] Update dependencies (`npm update`)
- [ ] Review and renew custom domain (if applicable)
- [ ] Check for security vulnerabilities
- [ ] Consider scaling if needed (upgrade tier)

---

## Cost Estimate

### Azure Static Web Apps (Free Tier)
- **Hosting**: $0/month
- **Bandwidth**: 100 GB/month (included)
- **Build minutes**: 100 minutes/month (included)
- **Storage**: 1 GB (included)
- **Total**: **$0/month** ✅

### RapidAPI (AeroDataBox)
- **Free tier**: ~300 calls/month
- **Cost**: $0/month
- **Overage**: Contact RapidAPI for pricing

### Custom Domain (Optional)
- **Domain**: ~$10-15/year (Namecheap, GoDaddy, etc.)
- **Azure SSL**: Free (automatic)

### Total Cost
**First Year**: ~$10-15 (domain only)
**Subsequent Years**: ~$10-15/year

---

## Alternative: Vercel Deployment

If Azure is too complex, consider Vercel (optimized for Next.js):

### Quick Start
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Add environment variables
vercel env add RAPIDAPI_KEY

# Deploy to production
vercel --prod
```

### Why Vercel?
- ✅ Optimized for Next.js (creators of Next.js)
- ✅ Automatic deployments from GitHub
- ✅ Free tier generous:
  - 100 GB bandwidth/month
  - Infinite builds
  - Automatic SSL
  - Global CDN
- ✅ Zero configuration needed

### Vercel Dashboard
- https://vercel.com/dashboard
- Deploy in < 2 minutes
- Better for Next.js apps than Azure

---

## Quick Reference

### Azure Portal URLs
- Azure Portal: https://portal.azure.com
- Static Web Apps: https://portal.azure.com/#blade/HubsExtension/BrowseResource/resourceType/Microsoft.StaticSites
- Your App: https://portal.azure.com/#@/resource/subscriptions/{subscription}/resourceGroups/{resourceGroup}/providers/Microsoft.StaticSites/staticSites/{appName}/overview

### Useful Commands
```bash
# Local testing
npm run dev

# Production build test
npm run build
npm start

# Deploy to Azure (automatic with GitHub push)
git add .
git commit -m "Update"
git push

# Check Azure deployment status
az staticwebapp app show \
  --name travel-planner-web \
  --resource-group travel-planner-rg
```

### Emergency Rollback
```bash
# If deployment breaks something, revert in GitHub
git revert HEAD
git push

# Azure will automatically redeploy previous version
```

---

## Next Steps After Deployment

1. **Test Thoroughly**
   - Create trips, add events
   - Test all features
   - Install on iPhone

2. **Share with Friends/Family**
   - Send them the URL
   - Ask them to test PWA installation
   - Gather feedback

3. **Monitor Usage**
   - Check Azure metrics weekly
   - Monitor RapidAPI usage
   - Review error logs

4. **Iterate**
   - Fix bugs
   - Add features
   - Improve UX

5. **Scale Up When Needed**
   - Upgrade Azure tier if limits exceeded
   - Add custom domain for branding
   - Consider adding analytics

---

## Support and Resources

### Documentation
- Azure Static Web Apps: https://learn.microsoft.com/azure/static-web-apps/
- Next.js PWA: https://nextjs.org/docs/app/building-your-application/configuring/pwa
- Progressive Web Apps: https://web.dev/progressive-web-apps/

### Community
- Next.js GitHub: https://github.com/vercel/next.js
- Azure Static Web Apps GitHub: https://github.com/Azure/static-web-apps
- Stack Overflow: Tag questions with `azure-static-web-apps` `next-pwa`

### Troubleshooting Help
1. Check Azure Portal logs
2. Review this document's troubleshooting section
3. Search Stack Overflow
4. Check GitHub issues for known problems

---

## Success Criteria

Your deployment is successful when:

- ✅ App loads at deployed URL
- ✅ All features work (trips, events, search, navigation)
- ✅ PWA installs on iPhone
- ✅ App works offline after first visit
- ✅ Performance is acceptable (< 3s load time)
- ✅ No console errors
- ✅ RapidAPI integration works
- ✅ Safe areas render correctly on mobile

**Congratulations on deploying your TravelPlanner PWA!** 🎉
