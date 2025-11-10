# 🚀 In-Memory Queue Quick Start Guide

## What is this?

The Travel CRM backend now supports **development without Redis**! The system automatically uses an in-memory queue when Redis is unavailable in development mode.

## 🎯 Quick Start

### Development Mode (No Redis Required)

```bash
# 1. Set environment to development
NODE_ENV=development

# 2. Start the backend
cd backend
npm run dev

# 3. Look for this message:
# 📝 Development mode: Using in-memory queue (no Redis needed)
```

That's it! No Redis installation or configuration needed for development.

## 🔧 How It Works

The system uses a **three-tier fallback**:

1. **Redis (Production)** - Full Bull queue with persistence
2. **In-Memory (Development)** - Fast, zero-config queue
3. **Synchronous (Fallback)** - Always works, but blocking

### Automatic Selection

```javascript
// The system automatically chooses the best option:

if (redisAvailable) {
  useRedisQueue();  // ✅ Production mode
} else if (isDevelopment) {
  useInMemoryQueue();  // 📝 Development mode
} else {
  useSynchronous();  // ⚠️ Fallback mode
}
```

## 📊 Console Messages

### Redis Mode (Production)
```
✅ Email queue initialized with Redis
```
Your backend is using Redis for queue processing.

### Memory Mode (Development)
```
📝 Development mode: Using in-memory queue (no Redis needed)
```
Your backend is using the in-memory queue. Perfect for local development!

### Sync Mode (Fallback)
```
⚠️  No queue available, processing emails synchronously
```
Your backend is processing emails one at a time. This works but is slower.

## 🧪 Testing Email Processing

### 1. Check Queue Status

```bash
# Check what mode you're in
curl http://localhost:5000/api/emails/stats

# Response:
{
  "waiting": 3,
  "active": 1,
  "completed": 50,
  "failed": 2,
  "delayed": 0,
  "total": 56,
  "mode": "memory"  # ← Your current mode
}
```

### 2. Process Test Email

```javascript
// The queue works the same in all modes:

const emailQueue = require('./services/emailProcessingQueue');

await emailQueue.addToQueue({
  emailId: 'email-123',
  tenantId: 'tenant-456'
});

// In memory mode:
// - Processed by 3 concurrent workers
// - Automatic retry on failure
// - Real-time progress updates
```

### 3. Monitor Queue

```javascript
// Get queue statistics
const stats = await emailQueue.getStats();
console.log(`Mode: ${stats.mode}`);
console.log(`Waiting: ${stats.waiting}`);
console.log(`Active: ${stats.active}`);

// Pause processing
await emailQueue.pause();

// Resume processing
await emailQueue.resume();
```

## 📦 Environment Variables

### Development (.env.development)
```bash
NODE_ENV=development
# No Redis configuration needed!
```

### Production (.env.production)
```bash
NODE_ENV=production
REDIS_HOST=your-redis-host
REDIS_PORT=6379
REDIS_PASSWORD=your-password  # if required
```

## 🎨 Features

### In-Memory Queue Features

✅ **Concurrent Processing** (3 workers by default)  
✅ **Automatic Retry** (3 attempts with exponential backoff)  
✅ **Priority Queue** (urgent, high, normal, low)  
✅ **Event Handling** (completed, failed, progress)  
✅ **Statistics** (waiting, active, completed, failed)  
✅ **Pause/Resume** (control processing)  
✅ **Zero Dependencies** (no npm packages needed)

### Limitations

⚠️ **Not Persistent** - Jobs lost on restart (development only)  
⚠️ **Single Process** - Not distributed across servers  
⚠️ **Memory Usage** - Stores jobs in RAM

These limitations are fine for development but **use Redis in production**.

## 🔍 Troubleshooting

### Issue: Backend says "Redis" but I don't have Redis

**Check your environment:**
```bash
echo $NODE_ENV  # Should be 'development'
```

**Check Redis connection:**
```bash
# If this works, Redis is available:
redis-cli ping
# PONG

# If this fails, check your .env file
```

### Issue: Jobs not processing

**Check the queue mode:**
```bash
curl http://localhost:5000/api/emails/stats
```

**Check console for errors:**
```bash
# Look for:
# 📝 Development mode: Using in-memory queue (no Redis needed)
```

**Verify queue is not paused:**
```javascript
await emailQueue.resume();
```

### Issue: "Memory" mode but I want "Redis"

**Install and start Redis:**
```bash
# Windows (via Chocolatey)
choco install redis-64

# Start Redis
redis-server

# Or use Docker
docker run -d -p 6379:6379 redis
```

**Update .env:**
```bash
REDIS_HOST=localhost
REDIS_PORT=6379
```

**Restart backend:**
```bash
npm run dev
# Should now show: ✅ Email queue initialized with Redis
```

## 📚 Advanced Usage

### Custom Concurrency

```javascript
// Change worker count (default: 3)
const queue = new InMemoryQueue('email-processing', {
  concurrency: 5  // 5 concurrent workers
});
```

### Job Priority

```javascript
// Add high-priority job
await emailQueue.addToQueue(emailData, {
  priority: 1  // 1 = urgent, 4 = low
});
```

### Event Handlers

```javascript
// Listen to job events
emailQueue.on('completed', (job, result) => {
  console.log(`Job ${job.id} completed:`, result);
});

emailQueue.on('failed', (job, error) => {
  console.log(`Job ${job.id} failed:`, error.message);
});

emailQueue.on('progress', (job, progress) => {
  console.log(`Job ${job.id} progress: ${progress}%`);
});
```

### Retry Configuration

```javascript
// Add job with custom retry
await emailQueue.addToQueue(emailData, {
  attempts: 5,  // Retry 5 times
  backoff: {
    type: 'exponential',
    delay: 2000  // Start with 2s delay
  }
});
```

## 🧪 Running Tests

### Unit Tests

```bash
cd backend
npm test -- queue-fallback.test.js

# Expected output:
# ✓ should use Redis queue when available
# ✓ should use in-memory queue in development
# ✓ should use synchronous mode in production
# ... (14 tests total)
```

### Validation Script

```bash
cd backend
node scripts/validate-queue-fallback.js

# Expected output:
# ✅ Test Passed: Redis Mode (Production)
# ✅ Test Passed: Memory Mode (Development)
# ✅ Test Passed: Sync Mode (Production)
# 🎉 All validation tests passed!
```

## 🎯 Best Practices

### Development
- ✅ Use in-memory queue (automatic)
- ✅ Don't install Redis locally (unless needed)
- ✅ Check console for queue mode on startup
- ✅ Use `getStats()` to monitor queue

### Production
- ✅ Always use Redis (configure in .env)
- ✅ Monitor queue metrics
- ✅ Set up alerts for failures
- ✅ Configure retry limits per job type

### Testing
- ✅ Mock the queue in unit tests
- ✅ Use in-memory queue for integration tests
- ✅ Test all three modes
- ✅ Verify error handling

## 📖 Related Documentation

- [In-Memory Queue Implementation](../IN_MEMORY_QUEUE_IMPLEMENTATION.md) - Full technical details
- [AI Email Automation](../AI_EMAIL_AUTOMATION_README.md) - Email processing features
- [Backend Configuration](../BACKEND_CONFIGURATION_GUIDE.md) - Environment setup

## 🆘 Need Help?

1. **Check console messages** - They tell you the queue mode
2. **Run validation script** - `node scripts/validate-queue-fallback.js`
3. **Check queue stats** - `curl http://localhost:5000/api/emails/stats`
4. **Review test file** - `backend/test/queue-fallback.test.js` has examples
5. **Read full docs** - `IN_MEMORY_QUEUE_IMPLEMENTATION.md`

## ✅ Verification Checklist

After setting up, verify:

- [ ] Backend starts without errors
- [ ] Console shows queue mode (redis/memory/sync)
- [ ] `getStats()` returns correct mode
- [ ] Test email processes successfully
- [ ] Queue pause/resume works
- [ ] No Redis errors in development

---

**Happy Developing!** 🎉

Now you can develop locally without Redis setup. The system just works!
