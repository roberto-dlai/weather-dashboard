# Deployment Guide

This guide covers deploying the Personal Weather Dashboard to various environments.

## Table of Contents

1. [Local Deployment with PM2](#local-deployment-with-pm2)
2. [Cloud Deployment (Render.com)](#cloud-deployment-rendercom)
3. [Cloud Deployment (Railway.app)](#cloud-deployment-railwayapp)
4. [Environment Variables](#environment-variables)
5. [Database Management](#database-management)
6. [Monitoring & Logs](#monitoring--logs)
7. [Backup Strategy](#backup-strategy)

---

## Local Deployment with PM2

PM2 is a production process manager for Node.js applications with built-in load balancer, monitoring, and auto-restart.

### 1. Install PM2 Globally

```bash
npm install -g pm2
```

### 2. Create PM2 Configuration

Create `ecosystem.config.js` in the project root:

```javascript
module.exports = {
  apps: [{
    name: 'weather-dashboard',
    script: 'backend/src/server.js',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    watch: false,
    max_memory_restart: '500M'
  }]
};
```

### 3. Start Application with PM2

```bash
# Start the application
pm2 start ecosystem.config.js --env production

# Save PM2 process list
pm2 save

# Setup PM2 to start on system boot
pm2 startup
```

### 4. PM2 Commands

```bash
# View application status
pm2 status

# View logs
pm2 logs weather-dashboard

# Restart application
pm2 restart weather-dashboard

# Stop application
pm2 stop weather-dashboard

# Delete application from PM2
pm2 delete weather-dashboard

# Monitor in real-time
pm2 monit
```

---

## Cloud Deployment (Render.com)

Render.com offers free tier for web services with automatic HTTPS and continuous deployment from GitHub.

### Prerequisites

- GitHub repository with your code
- Render.com account (free)

### 1. Create Web Service

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure the service:

**Settings:**
```
Name: weather-dashboard
Environment: Node
Region: Choose closest to your location
Branch: main
Build Command: npm install
Start Command: npm start
```

### 2. Configure Environment Variables

In Render dashboard, add the following environment variables:

```
OPENWEATHER_API_KEY=your_api_key_here
NODE_ENV=production
PORT=3000
DB_PATH=./database/weather.db
```

### 3. Configure Build Settings

Render automatically detects Node.js and runs `npm install` and `npm start`.

**Optional: Add build script in package.json:**
```json
{
  "scripts": {
    "build": "npm run init-db",
    "start": "node backend/src/server.js"
  }
}
```

### 4. Deploy

Click "Create Web Service" - Render will automatically:
- Clone your repository
- Install dependencies
- Run build command
- Start your application
- Assign a public URL (e.g., `https://weather-dashboard.onrender.com`)

### 5. Automatic Deployments

Render automatically redeploys when you push to the main branch.

### 6. View Logs

In Render dashboard → Your Service → Logs tab

### 7. Custom Domain (Optional)

Render → Your Service → Settings → Custom Domain

---

## Cloud Deployment (Railway.app)

Railway offers $5 free credit monthly and easy deployment from GitHub.

### 1. Create New Project

1. Go to [Railway.app](https://railway.app/)
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your repository

### 2. Configure Environment Variables

Railway → Your Project → Variables tab:

```
OPENWEATHER_API_KEY=your_api_key_here
NODE_ENV=production
PORT=${PORT}
DB_PATH=./database/weather.db
```

Note: Railway provides `${PORT}` automatically.

### 3. Configure Start Command

Railway → Settings → Start Command:
```
npm start
```

### 4. Deploy

Railway automatically builds and deploys. View logs in the Deployments tab.

### 5. Custom Domain

Railway → Settings → Domains → Generate Domain or add custom domain

---

## Environment Variables

### Production Environment Variables

```env
# Required
OPENWEATHER_API_KEY=your_api_key_here

# Optional (with defaults)
NODE_ENV=production
PORT=3000
DB_PATH=./database/weather.db
```

### Security Best Practices

1. **Never commit `.env` files**
   - Already in `.gitignore`
   - Use `.env.example` as template

2. **Rotate API keys regularly**
   - Every 90 days recommended
   - Immediately if leaked

3. **Use environment-specific keys**
   - Development key for local testing
   - Production key for deployed app

---

## Database Management

### SQLite in Production

**Important Considerations:**

1. **File Persistence**:
   - Ensure database file persists between deployments
   - On Render/Railway, use persistent disk or volume

2. **Backups**:
   - SQLite databases are single files
   - Easy to backup and restore

### Backup Database

```bash
# Local backup
cp database/weather.db database/weather_backup_$(date +%Y%m%d).db

# Backup with compression
tar -czf weather_backup_$(date +%Y%m%d).tar.gz database/weather.db
```

### Restore Database

```bash
# Restore from backup
cp database/weather_backup_20251204.db database/weather.db

# Or from compressed backup
tar -xzf weather_backup_20251204.tar.gz
```

### Automated Backup Script

Create `backup.sh`:

```bash
#!/bin/bash
BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DB_FILE="database/weather.db"

mkdir -p $BACKUP_DIR

# Create backup
cp $DB_FILE "$BACKUP_DIR/weather_$TIMESTAMP.db"

# Keep only last 7 backups
ls -t $BACKUP_DIR/weather_*.db | tail -n +8 | xargs rm -f

echo "Backup created: weather_$TIMESTAMP.db"
```

Run daily via cron:
```bash
0 3 * * * /path/to/backup.sh
```

### Database Migration (If Moving Providers)

```bash
# 1. Export from old server
scp user@old-server:/path/to/weather.db ./weather_export.db

# 2. Import to new server
scp ./weather_export.db user@new-server:/path/to/weather.db

# 3. Restart application
pm2 restart weather-dashboard
```

---

## Monitoring & Logs

### Local Monitoring (PM2)

```bash
# Real-time monitoring
pm2 monit

# View logs
pm2 logs weather-dashboard

# View last 100 lines
pm2 logs weather-dashboard --lines 100

# Clear logs
pm2 flush
```

### Cloud Monitoring

**Render.com:**
- Dashboard → Service → Logs
- Dashboard → Service → Metrics

**Railway.app:**
- Project → Deployments → View Logs
- Project → Metrics

### Application Health Check

The application provides a health endpoint:

```bash
curl https://your-domain.com/api/health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2025-12-04T12:00:00.000Z",
  "cities": 5
}
```

### Setup Uptime Monitoring

Use services like:
- [UptimeRobot](https://uptimerobot.com/) (free)
- [Pingdom](https://www.pingdom.com/)
- [StatusCake](https://www.statuscake.com/)

Configure to ping `/api/health` every 5 minutes.

---

## Backup Strategy

### Recommended Backup Schedule

| Type | Frequency | Retention | Method |
|------|-----------|-----------|--------|
| Database | Daily | 7 days | Automated script |
| Full backup | Weekly | 4 weeks | Manual or automated |
| Critical backup | Before updates | 1 backup | Manual |

### What to Backup

1. **Database** (`database/weather.db`)
2. **Environment variables** (`.env` - store securely)
3. **Configuration files** (`ecosystem.config.js`)

### Cloud Provider Backups

**Render.com:**
- No built-in backup for free tier
- Use external storage (S3, Dropbox, etc.)

**Railway.app:**
- Volume snapshots available
- Setup via Railway CLI

---

## Performance Optimization

### 1. Enable Gzip Compression

Already enabled via `compression` middleware in `server.js`.

### 2. Use Persistent Connections

SQLite WAL mode is already enabled in `db.js`.

### 3. Optimize Scheduler

Adjust cron schedules if needed in `weatherCollector.js`:

```javascript
// Current: Every hour
const hourlyTask = cron.schedule('0 * * * *', ...);

// If you have many cities, consider every 2 hours:
const hourlyTask = cron.schedule('0 */2 * * *', ...);
```

### 4. Monitor Memory Usage

PM2 automatically restarts if memory exceeds `max_memory_restart` setting.

---

## Troubleshooting Deployment Issues

### Issue: Application crashes on startup

**Check logs:**
```bash
# PM2
pm2 logs weather-dashboard --lines 50

# Render/Railway
Check dashboard logs
```

**Common causes:**
- Missing environment variables
- Database file not accessible
- Port already in use

### Issue: Database locked errors

**Solution:**
- Ensure only one instance is running
- WAL mode should prevent this
- Check file permissions

### Issue: API rate limit exceeded

**Solution:**
- Verify cache is working (10-minute TTL)
- Reduce collection frequency
- Check for duplicate API calls

### Issue: Out of memory

**Solution for PM2:**
```javascript
// In ecosystem.config.js
max_memory_restart: '1G'  // Increase if needed
```

**Solution for Cloud:**
- Upgrade to paid tier for more memory
- Optimize queries and data structures

---

## Security Checklist

Before deploying to production:

- [ ] API key in environment variables (not committed)
- [ ] `.env` file in `.gitignore`
- [ ] Helmet middleware enabled (already done)
- [ ] Rate limiting configured (already done)
- [ ] CORS configured appropriately
- [ ] Error messages don't expose sensitive info
- [ ] HTTPS enabled (automatic on Render/Railway)
- [ ] Database file not publicly accessible
- [ ] Regular security updates: `npm audit fix`

---

## Scaling Considerations

### Current Capacity

With OpenWeatherMap free tier:
- **60 calls/minute** = up to **50 cities** with 1-second delays
- **1M calls/month** = ~**1,388 cities** with hourly collection

### If You Need to Scale

1. **Upgrade OpenWeatherMap plan**
   - Startup plan: $40/month (600 calls/minute)
   - Developer plan: $150/month (3,000 calls/minute)

2. **Use multiple API keys**
   - Rotate keys across cities
   - Distribute load

3. **Optimize collection frequency**
   - Collect less frequently for stable climates
   - More frequently for changing weather

4. **Database optimization**
   - Consider PostgreSQL for high traffic
   - Implement connection pooling

---

## Support

For deployment issues:

1. Check logs first
2. Review this guide
3. Search GitHub issues
4. Create new issue with logs and error details

---

## Quick Reference

```bash
# PM2 Commands
pm2 start ecosystem.config.js
pm2 stop weather-dashboard
pm2 restart weather-dashboard
pm2 logs weather-dashboard

# Database Backup
cp database/weather.db database/backup.db

# Check Health
curl http://localhost:3000/api/health

# Manual Collection
npm run collect-weather

# View Database
sqlite3 database/weather.db
```

---

Built with Claude Code
