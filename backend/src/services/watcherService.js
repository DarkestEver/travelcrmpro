/**
 * Watcher Service
 * Handles collection of watchers from all three levels:
 * 1. Global Tenant Watchers
 * 2. Email Account Watchers  
 * 3. Email/Entity-specific Watchers
 */

/**
 * Collect all watchers from three levels
 * @param {Object} options - Options object
 * @param {String} options.tenantId - Tenant ID
 * @param {Object} options.emailAccount - Email account object (with watchers array)
 * @param {Array} options.entityWatchers - Entity-specific watchers (email, quote, booking)
 * @param {Array} options.excludeEmails - Emails to exclude (recipient, sender, etc.)
 * @returns {Array} - Array of unique watcher email addresses
 */
async function collectAllWatchers({ tenantId, emailAccount, entityWatchers = [], excludeEmails = [] }) {
  const allWatcherEmails = new Set();
  const watcherSources = {
    global: 0,
    account: 0,
    entity: 0
  };
  
  try {
    // Level 1: Global Tenant Watchers
    if (tenantId) {
      const Tenant = require('../models/Tenant');
      const tenant = await Tenant.findById(tenantId);
      if (tenant && tenant.globalWatchers && tenant.globalWatchers.length > 0) {
        const globalWatchers = tenant.globalWatchers
          .filter(w => w.isActive)
          .map(w => w.email);
        globalWatchers.forEach(e => allWatcherEmails.add(e));
        watcherSources.global = globalWatchers.length;
        console.log(`🌍 Found ${globalWatchers.length} global tenant watchers`);
      }
    }
    
    // Level 2: Email Account Watchers
    if (emailAccount && emailAccount.watchers && emailAccount.watchers.length > 0) {
      const accountWatchers = emailAccount.watchers
        .filter(w => w.isActive)
        .map(w => w.email);
      accountWatchers.forEach(e => allWatcherEmails.add(e));
      watcherSources.account = accountWatchers.length;
      console.log(`📧 Found ${accountWatchers.length} email account watchers`);
    }
    
    // Level 3: Entity-specific Watchers (email, quote, booking)
    if (entityWatchers && entityWatchers.length > 0) {
      const specificWatchers = entityWatchers
        .filter(w => w.notifyOnReply !== false) // Respect notification preference
        .map(w => w.email);
      specificWatchers.forEach(e => allWatcherEmails.add(e));
      watcherSources.entity = specificWatchers.length;
      console.log(`📝 Found ${specificWatchers.length} entity-specific watchers`);
    }
    
    // Filter out excluded emails
    const finalWatchers = Array.from(allWatcherEmails).filter(e => 
      e && !excludeEmails.includes(e)
    );
    
    console.log(`👁️  Total unique watchers: ${finalWatchers.length} (Global: ${watcherSources.global}, Account: ${watcherSources.account}, Entity: ${watcherSources.entity})`);
    
    return finalWatchers;
  } catch (error) {
    console.error('Error collecting watchers:', error);
    return [];
  }
}

/**
 * Add watchers to BCC, avoiding duplicates with existing CC/BCC
 * @param {Array} bccEmails - Existing BCC emails
 * @param {Array} ccEmails - Existing CC emails
 * @param {Array} watchers - Watcher emails to add
 * @param {String} recipientEmail - Main recipient email to exclude
 * @returns {Array} - Updated BCC array
 */
function addWatchersToBCC(bccEmails = [], ccEmails = [], watchers = [], recipientEmail = '') {
  const existingEmails = new Set([
    ...bccEmails,
    ...ccEmails,
    recipientEmail
  ].filter(Boolean));
  
  const watchersToAdd = watchers.filter(e => e && !existingEmails.has(e));
  
  if (watchersToAdd.length > 0) {
    console.log(`➕ Adding ${watchersToAdd.length} watchers to BCC:`, watchersToAdd);
    return [...bccEmails, ...watchersToAdd];
  }
  
  return bccEmails;
}

module.exports = {
  collectAllWatchers,
  addWatchersToBCC
};
