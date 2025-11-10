# 📅 Cron Job - How It Works (Automatic Setup)

**Date:** November 10, 2025  
**Question:** Does cron set automatically or do I have to schedule it?  
**Answer:** ✅ **Completely Automatic - No manual setup needed!**

---

## 🔄 **How It Works**

### **On Every Server Start:**

```
1. Server starts (npm run dev or npm start)
   ↓
2. server.js loads
   ↓
3. initCronJobs() is called (line 47 of server.js)
   ↓
4. jobs/index.js → initEmailPolling() is executed
   ↓
5. pollEmails.js → cron.schedule('*/2 * * * *', ...) creates job
   ↓
6. ✅ Job is now active and running
   ↓
7. Job runs every 2 minutes while server is alive
```

---

## ✅ **Automatic Behavior**

### **What Happens Automatically:**

| Event | Action | Result |
|-------|--------|--------|
| Server Starts | Cron job created | ✅ Job active |
| Every 2 Minutes | Job executes | ✅ Emails fetched |
| Server Stops | Job stops | ❌ No polling |
| Server Restarts | Job recreated | ✅ Job active again |

---

## 📝 **Code Flow**

### **1. Server Initialization (server.js)**

```javascript
// Line 47 of server.js
// This runs ONCE when server starts
initCronJobs();
```

### **2. Jobs Initialization (jobs/index.js)**

```javascript
const initCronJobs = () => {
  logger.info('Initializing cron jobs...');

  // Auto-archive itineraries (daily at 2 AM)
  autoArchiveItineraries();

  // Email polling (every 2 minutes) ← YOUR NEW JOB
  initEmailPolling();

  logger.info('All cron jobs initialized successfully');
};
```

### **3. Email Polling Setup (jobs/pollEmails.js)**

```javascript
const initEmailPolling = () => {
  // This defines WHEN the job runs
  const schedule = '*/2 * * * *'; // Every 2 minutes
  
  logger.info(`📧 Scheduling email polling job: ${schedule}`);
  
  // This CREATES the recurring job
  cron.schedule(schedule, async () => {
    logger.info('⏰ Email polling cron job triggered');
    
    try {
      // This is what runs every 2 minutes
      await emailPollingService.pollAllAccounts();
    } catch (error) {
      logger.error('❌ Email polling cron job error:', error);
    }
  });
  
  logger.info('✅ Email polling cron job initialized (runs every 2 minutes)');
};
```

---

## ⏰ **Cron Schedule Explained**

### **Current Schedule: `*/2 * * * *`**

```
*/2  *  *  *  *
│    │  │  │  │
│    │  │  │  └─── Day of week (0-7, Sunday=0 or 7)
│    │  │  └────── Month (1-12)
│    │  └───────── Day of month (1-31)
│    └──────────── Hour (0-23)
└───────────────── Minute (0-59)

*/2 = Every 2 minutes
```

### **Examples of Other Schedules:**

```javascript
'*/1 * * * *'    // Every 1 minute
'*/5 * * * *'    // Every 5 minutes
'0 * * * *'      // Every hour (at minute 0)
'0 */2 * * *'    // Every 2 hours
'0 9 * * *'      // Every day at 9:00 AM
'0 9,17 * * *'   // Every day at 9 AM and 5 PM
'0 9 * * 1-5'    // Every weekday at 9 AM
```

---

## 🎯 **No Manual Setup Required**

### ❌ **You DON'T Need To:**

- ❌ Manually create cron jobs
- ❌ Schedule tasks in Windows Task Scheduler
- ❌ Run separate cron service
- ❌ Configure external schedulers
- ❌ Set up system cron (crontab)

### ✅ **It Just Works:**

- ✅ Server starts → Job created automatically
- ✅ Job runs every 2 minutes → Automatic
- ✅ Server restarts → Job recreated automatically
- ✅ Multiple servers → Each has its own job

---

## 📊 **Job Lifecycle**

### **Scenario 1: Server Starts**

```bash
$ npm run dev

# Output:
2025-11-10 19:00:00 info: Initializing cron jobs...
📧 Scheduling email polling job: */2 * * * *
✅ Email polling cron job initialized (runs every 2 minutes)
2025-11-10 19:00:00 info: All cron jobs initialized successfully
```

**Result:** Job is now running in the background.

### **Scenario 2: Job Executes (Every 2 Minutes)**

```bash
# After 2 minutes:
2025-11-10 19:02:00 info: ⏰ Email polling cron job triggered
2025-11-10 19:02:00 info: 🔄 Polling 2 email account(s)...
2025-11-10 19:02:01 info: 📬 Polling emails for: support@yourcompany.com
2025-11-10 19:02:02 info: ✅ No new emails for support@yourcompany.com
2025-11-10 19:02:02 info: ✅ Email polling cycle complete

# After another 2 minutes:
2025-11-10 19:04:00 info: ⏰ Email polling cron job triggered
# ... repeats forever while server runs
```

### **Scenario 3: Server Stops**

```bash
^C  # Press Ctrl+C

# Job stops immediately
# No more polling until server restarts
```

### **Scenario 4: Server Restarts**

```bash
$ npm run dev

# Job is recreated:
📧 Scheduling email polling job: */2 * * * *
✅ Email polling cron job initialized (runs every 2 minutes)

# Polling resumes every 2 minutes
```

---

## 🔧 **How to Change Polling Frequency**

If you want to change from every 2 minutes to a different interval:

### **Edit: `backend/src/jobs/pollEmails.js`**

```javascript
const initEmailPolling = () => {
  // Change this line:
  const schedule = '*/2 * * * *';  // Current: Every 2 minutes
  
  // To one of these:
  // const schedule = '*/1 * * * *';   // Every 1 minute
  // const schedule = '*/5 * * * *';   // Every 5 minutes
  // const schedule = '*/10 * * * *';  // Every 10 minutes
  // const schedule = '0 * * * *';     // Every hour
  
  cron.schedule(schedule, async () => {
    // ... rest of code
  });
};
```

**Then restart the server** - that's it!

---

## 🚀 **Multiple Cron Jobs**

Your server currently has **2 cron jobs** running automatically:

### **1. Auto-Archive Itineraries**
- **Schedule:** Daily at 2:00 AM (`0 2 * * *`)
- **Purpose:** Archive old itineraries
- **File:** `jobs/autoArchiveItineraries.js`

### **2. Email Polling (NEW)**
- **Schedule:** Every 2 minutes (`*/2 * * * *`)
- **Purpose:** Fetch emails from IMAP servers
- **File:** `jobs/pollEmails.js`

### **3. SLA Monitoring**
- **Schedule:** Every hour (`0 * * * *`)
- **Purpose:** Check quote SLA breaches
- **File:** Defined in `server.js` (line 174)

---

## 💡 **Key Points**

### ✅ **Automatic Job Creation:**
- Jobs are created when server starts
- No manual scheduling needed
- No external cron service required

### ✅ **Job Persistence:**
- Jobs run while server is running
- Jobs stop when server stops
- Jobs recreate on server restart

### ✅ **Multiple Servers:**
- Each server instance creates its own jobs
- Jobs run independently per server
- No conflicts between instances

### ✅ **Production Ready:**
- Use PM2 to keep server running 24/7
- PM2 auto-restarts on crashes
- Jobs automatically resume after restart

---

## 🏃 **Production Setup (Optional)**

If you want jobs to run 24/7, use PM2:

### **Install PM2:**
```bash
npm install -g pm2
```

### **Start Server with PM2:**
```bash
cd backend
pm2 start src/server.js --name "travel-crm-api"
```

### **Server Runs Forever:**
- ✅ Runs in background
- ✅ Auto-restarts on crash
- ✅ Cron jobs always active
- ✅ Survives server reboots (with pm2 startup)

### **View Logs:**
```bash
pm2 logs travel-crm-api
```

### **Status:**
```bash
pm2 status
```

---

## 📋 **Summary**

| Question | Answer |
|----------|--------|
| **Does cron set automatically?** | ✅ Yes, on every server start |
| **Do I have to schedule it?** | ❌ No, it's automatic |
| **Does it create job on each start?** | ✅ Yes, recreates every time |
| **Will it run while server is off?** | ❌ No, only while server runs |
| **Do I need external cron service?** | ❌ No, built-in with node-cron |
| **Can I change the schedule?** | ✅ Yes, edit pollEmails.js |
| **Multiple servers = multiple jobs?** | ✅ Yes, each server has its own |

---

## 🎉 **In Simple Terms**

**Think of it like this:**

```
Server ON  → Cron job ACTIVE  → Emails fetched every 2 min
Server OFF → Cron job STOPPED → No emails fetched
Server ON  → Cron job ACTIVE  → Emails fetched again
```

**It's like a light switch:**
- Server starts = Light ON = Job runs
- Server stops = Light OFF = Job stops
- Server restarts = Light turns ON again = Job runs again

**No manual work needed!** Just keep your server running and the job handles everything. 🚀

---

**Need to check if it's working?**

Just start your server and look for this in the logs:
```
✅ Email polling cron job initialized (runs every 2 minutes)
```

If you see that, the job is running! 🎉
