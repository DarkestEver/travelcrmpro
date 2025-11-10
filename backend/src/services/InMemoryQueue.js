/**
 * In-Memory Queue Implementation (Fallback for Development)
 * Used when Redis is not available
 * Keeps code <500 lines as per guidelines
 */

class InMemoryQueue {
  constructor(name) {
    this.name = name;
    this.jobs = new Map();
    this.waiting = [];
    this.active = new Map();
    this.completed = [];
    this.failed = [];
    this.jobIdCounter = 1;
    this.processing = false;
    this.concurrency = 3;
    this.processors = [];
    this.paused = false;
    this.eventHandlers = {
      completed: [],
      failed: [],
      progress: []
    };
  }

  /**
   * Add job to queue
   */
  async add(data, options = {}) {
    const jobId = this.jobIdCounter++;
    const job = {
      id: jobId,
      data,
      opts: options,
      timestamp: Date.now(),
      attempts: 0,
      maxAttempts: options.attempts || 3,
      priority: options.priority || 3,
      status: 'waiting',
      progress: 0,
      returnValue: null,
      error: null
    };

    this.jobs.set(jobId, job);
    this.waiting.push(job);

    // Sort by priority (lower number = higher priority)
    this.waiting.sort((a, b) => a.opts.priority - b.opts.priority);

    // Start processing if not already
    if (!this.processing) {
      this.startProcessing();
    }

    return {
      id: jobId,
      data: job.data,
      progress: (value) => {
        job.progress = value;
        this.emit('progress', job, value);
      }
    };
  }

  /**
   * Register processor function
   */
  process(concurrency, processor) {
    if (typeof concurrency === 'function') {
      processor = concurrency;
      concurrency = 1;
    }

    this.concurrency = concurrency;
    this.processors.push(processor);

    // Start processing existing jobs
    if (!this.processing) {
      this.startProcessing();
    }
  }

  /**
   * Start processing jobs
   */
  async startProcessing() {
    if (this.processing || this.paused) return;
    this.processing = true;

    while (this.waiting.length > 0 || this.active.size > 0) {
      if (this.paused) break;

      // Process up to concurrency limit
      while (this.active.size < this.concurrency && this.waiting.length > 0) {
        const job = this.waiting.shift();
        await this.processJob(job);
      }

      // Wait a bit before checking again
      await this.sleep(100);

      // Stop if no more jobs
      if (this.waiting.length === 0 && this.active.size === 0) {
        break;
      }
    }

    this.processing = false;
  }

  /**
   * Process a single job
   */
  async processJob(job) {
    if (!this.processors.length) {
      console.warn(`No processor registered for queue ${this.name}`);
      return;
    }

    job.status = 'active';
    this.active.set(job.id, job);

    try {
      const processor = this.processors[0];
      const result = await processor({
        id: job.id,
        data: job.data,
        progress: (value) => {
          job.progress = value;
          this.emit('progress', job, value);
        }
      });

      // Job completed successfully
      job.status = 'completed';
      job.returnValue = result;
      this.active.delete(job.id);
      this.completed.push(job);

      // Emit completed event
      this.emit('completed', job, result);

    } catch (error) {
      job.attempts++;
      job.error = error.message;

      if (job.attempts >= job.maxAttempts) {
        // Job failed permanently
        job.status = 'failed';
        this.active.delete(job.id);
        this.failed.push(job);

        // Emit failed event
        this.emit('failed', job, error);
      } else {
        // Retry job
        job.status = 'waiting';
        this.active.delete(job.id);
        
        // Calculate backoff delay
        const backoffDelay = job.opts.backoff 
          ? this.calculateBackoff(job.opts.backoff, job.attempts)
          : 0;

        // Wait before retrying
        await this.sleep(backoffDelay);
        this.waiting.push(job);
      }
    }
  }

  /**
   * Calculate exponential backoff
   */
  calculateBackoff(backoff, attempts) {
    if (backoff.type === 'exponential') {
      return backoff.delay * Math.pow(2, attempts - 1);
    }
    return backoff.delay || 5000;
  }

  /**
   * Sleep helper
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Register event handler
   */
  on(event, handler) {
    if (this.eventHandlers[event]) {
      this.eventHandlers[event].push(handler);
    }
  }

  /**
   * Emit event
   */
  emit(event, ...args) {
    if (this.eventHandlers[event]) {
      this.eventHandlers[event].forEach(handler => {
        try {
          handler(...args);
        } catch (error) {
          console.error(`Error in ${event} handler:`, error);
        }
      });
    }
  }

  /**
   * Get queue counts
   */
  async getWaitingCount() {
    return this.waiting.length;
  }

  async getActiveCount() {
    return this.active.size;
  }

  async getCompletedCount() {
    return this.completed.length;
  }

  async getFailedCount() {
    return this.failed.length;
  }

  async getDelayedCount() {
    return 0; // In-memory queue doesn't support delayed jobs
  }

  /**
   * Pause queue
   */
  async pause() {
    this.paused = true;
    console.log(`Queue ${this.name} paused`);
  }

  /**
   * Resume queue
   */
  async resume() {
    this.paused = false;
    console.log(`Queue ${this.name} resumed`);
    if (!this.processing) {
      this.startProcessing();
    }
  }

  /**
   * Clean old jobs
   */
  async clean(grace, status) {
    const now = Date.now();
    
    if (status === 'completed') {
      this.completed = this.completed.filter(job => 
        now - job.timestamp < grace
      );
    } else if (status === 'failed') {
      this.failed = this.failed.filter(job => 
        now - job.timestamp < grace
      );
    }
  }

  /**
   * Get job by ID
   */
  async getJob(jobId) {
    return this.jobs.get(jobId);
  }

  /**
   * Remove job
   */
  async removeJob(jobId) {
    const job = this.jobs.get(jobId);
    if (job) {
      this.jobs.delete(jobId);
      
      // Remove from appropriate queue
      const index = this.waiting.findIndex(j => j.id === jobId);
      if (index > -1) this.waiting.splice(index, 1);
      
      this.active.delete(jobId);
      
      const completedIndex = this.completed.findIndex(j => j.id === jobId);
      if (completedIndex > -1) this.completed.splice(completedIndex, 1);
      
      const failedIndex = this.failed.findIndex(j => j.id === jobId);
      if (failedIndex > -1) this.failed.splice(failedIndex, 1);
    }
  }

  /**
   * Get all jobs
   */
  async getJobs(types = ['waiting', 'active', 'completed', 'failed']) {
    const jobs = [];
    
    if (types.includes('waiting')) {
      jobs.push(...this.waiting);
    }
    if (types.includes('active')) {
      jobs.push(...Array.from(this.active.values()));
    }
    if (types.includes('completed')) {
      jobs.push(...this.completed);
    }
    if (types.includes('failed')) {
      jobs.push(...this.failed);
    }
    
    return jobs;
  }

  /**
   * Close queue
   */
  async close() {
    this.paused = true;
    this.processing = false;
    console.log(`Queue ${this.name} closed`);
  }
}

module.exports = InMemoryQueue;
