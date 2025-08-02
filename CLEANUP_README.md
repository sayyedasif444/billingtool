# Job Cleanup System

This system automatically cleans up old blog generation jobs from Firebase to prevent data accumulation and maintain performance.

## Overview

The cleanup system removes jobs that haven't been updated in the last 24 hours. This helps:
- Reduce Firebase storage costs
- Improve query performance
- Keep the database clean and organized

## Features

### 1. Automatic Cleanup (Cron Job)
- **Schedule**: Runs every day at midnight (00:00 UTC)
- **Trigger**: Vercel Cron Jobs via `/api/cleanup-jobs`
- **Action**: Removes jobs older than 24 hours

### 2. Manual Cleanup
- **API Endpoint**: `POST /api/cleanup-jobs`
- **Admin Page**: `/admin/cleanup` (frontend only)
- **Dry Run**: Test cleanup without actually deleting

### 3. Cleanup Types

#### All Jobs Cleanup
Removes any job that hasn't been updated in 24 hours, regardless of status.

#### Status-Based Cleanup
Removes specific job types older than 24 hours:
- **Completed jobs**: Successfully finished blog generations
- **Failed jobs**: Blog generations that encountered errors
- **Abandoned jobs**: Jobs stuck in "inprogress" for 24+ hours

## Usage

### API Endpoints

#### Trigger Cleanup
```bash
# Dry run - see what would be deleted
curl -X POST /api/cleanup-jobs \
  -H "Content-Type: application/json" \
  -d '{"dryRun": true, "type": "all"}'

# Actual cleanup - all old jobs
curl -X POST /api/cleanup-jobs \
  -H "Content-Type: application/json" \
  -d '{"dryRun": false, "type": "all"}'

# Status-based cleanup
curl -X POST /api/cleanup-jobs \
  -H "Content-Type: application/json" \
  -d '{"dryRun": false, "type": "status"}'
```

### Admin Interface (Frontend Only)

Visit `/admin/cleanup` to access the web interface with:
- Dry run functionality
- Real-time statistics
- Before/after comparison
- List of deleted jobs

## Configuration

### Vercel Cron Jobs

The system uses Vercel Cron Jobs for automatic cleanup:

```json
{
  "crons": [
    {
      "path": "/api/cleanup-jobs",
      "schedule": "0 0 * * *"
    }
  ]
}
```

**Schedule Format**: `0 0 * * *` = Every day at midnight UTC

### Environment Variables

Ensure these are set in your Vercel project:
- `FIREBASE_PROJECT_ID`
- `FIREBASE_PRIVATE_KEY`
- `FIREBASE_CLIENT_EMAIL`

## Monitoring

### Logs
The cleanup process logs detailed information:
- Number of jobs found
- Jobs being deleted
- Success/failure status
- Error details

### Statistics
The system provides cleanup statistics:
- Total jobs in database
- Number of old jobs
- Breakdown by status
- Before/after comparison

## Safety Features

### Dry Run Mode
Always test with dry run first:
```json
{
  "dryRun": true,
  "type": "all"
}
```

### Confirmation Dialogs
The admin interface requires confirmation before actual deletion.

### Error Handling
- Graceful error handling with detailed messages
- No partial deletions (all-or-nothing)
- Rollback capability through logging

## Troubleshooting

### Common Issues

1. **No jobs deleted**
   - Check if jobs are actually older than 24 hours
   - Verify `updatedAt` field format

2. **Permission errors**
   - Ensure Firebase service account has delete permissions
   - Check environment variables

3. **Cron job not running**
   - Verify Vercel Cron Jobs are enabled
   - Check deployment status
   - Review Vercel logs

### Debug Mode

Enable detailed logging by checking the console output:
```javascript
console.log('🧹 Starting cleanup of old jobs...');
console.log(`🗑️ Looking for jobs older than: ${twentyFourHoursAgo.toISOString()}`);
console.log(`📋 Found ${querySnapshot.size} old jobs to delete`);
```

## Files Structure

```
├── lib/
│   └── cleanup-old-jobs.js (or .ts)
├── pages/api/cleanup-jobs/
│   └── route.js (or .ts)
├── pages/admin/
│   └── cleanup.js
└── vercel.json
```

## Best Practices

1. **Always use dry run first** before actual cleanup
2. **Monitor logs** after deployment
3. **Test manually** before relying on cron jobs
4. **Keep backups** of important data
5. **Review statistics** regularly

## Customization

### Change Cleanup Interval

Modify the time calculation in `cleanup-old-jobs.js`:
```javascript
// For 12 hours
const twelveHoursAgo = new Date();
twelveHoursAgo.setHours(twelveHoursAgo.getHours() - 12);

// For 48 hours
const fortyEightHoursAgo = new Date();
fortyEightHoursAgo.setHours(fortyEightHoursAgo.getHours() - 48);
```

### Add Custom Cleanup Rules

Extend the cleanup functions to include custom logic:
```javascript
// Example: Only delete failed jobs older than 1 hour
const oneHourAgo = new Date();
oneHourAgo.setHours(oneHourAgo.getHours() - 1);

const quickFailedQuery = query(
  jobsRef,
  where('status', '==', 'failed'),
  where('updatedAt', '<', oneHourAgo.toISOString())
);
```

## Support

For issues or questions:
1. Check the logs for error details
2. Verify Firebase configuration
3. Test with dry run mode
4. Review this documentation 