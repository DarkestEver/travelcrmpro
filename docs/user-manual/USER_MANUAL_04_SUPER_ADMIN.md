# Travel CRM Pro - User Manual
## Part 4: Super Admin Guide

**Version**: 2.1.0  
**Last Updated**: November 15, 2025  
**Document**: 4 of 14

---

## Table of Contents

1. [Super Admin Dashboard](#dashboard)
2. [Tenant Management](#tenants)
3. [User Management](#users)
4. [System Settings](#settings)
5. [Audit Logs](#audit)
6. [System Analytics](#analytics)
7. [Backup & Restore](#backup)
8. [Security Configuration](#security)

---

## 1. Super Admin Dashboard {#dashboard}

### 1.1 Dashboard Overview

The Super Admin Dashboard provides system-wide oversight:

**Key Metrics**:
- 📊 Total Tenants: Active organizations
- 👥 Total Users: Across all tenants
- 💰 Total Revenue: Platform-wide
- 📈 Growth Rate: Month-over-month
- ⚡ System Health: Real-time status
- 🔔 Active Alerts: Issues requiring attention

**Dashboard Widgets**:
1. **Tenant Activity**: Active vs inactive tenants
2. **User Growth**: New registrations over time
3. **System Performance**: CPU, memory, database metrics
4. **Revenue Trends**: Subscription and transaction fees
5. **Support Tickets**: Open, pending, resolved
6. **API Usage**: Requests per tenant
7. **Recent Activity**: Latest system events
8. **Security Alerts**: Failed logins, suspicious activity

### 1.2 Quick Actions

Accessible from dashboard:
- ➕ Create New Tenant
- 👤 Add User
- ⚙️ System Settings
- 📊 Generate Report
- 🔍 View Audit Logs
- 🛠️ Run Maintenance
- 📧 Broadcast Message

---

## 2. Tenant Management {#tenants}

### 2.1 Creating a Tenant

**Steps**:
1. Navigate to **Tenants** → **Add Tenant**
2. Fill in tenant details:
   - **Company Name**: Official business name
   - **Domain**: Subdomain (e.g., `acmetravel`)
   - **Admin Email**: Primary contact
   - **Admin Name**: Account owner
   - **Phone**: Contact number
   - **Country**: Operating country
   - **Currency**: Default currency
   - **Time Zone**: Operating timezone
3. Configure subscription:
   - **Plan**: Starter/Professional/Enterprise
   - **Billing Cycle**: Monthly/Annual
   - **Users Limit**: Max users allowed
   - **Features**: Enable/disable features
4. Set tenant ID (auto-generated or custom)
5. Click **"Create Tenant"**
6. Confirmation email sent to admin
7. Tenant account activated

**Tenant Subdomain**:
- Format: `https://tenantname.travelcrmpro.com`
- Must be unique
- 3-30 characters
- Letters, numbers, hyphens only
- Cannot be changed after creation

### 2.2 Managing Tenants

**Tenant List View**:
- Search by name, domain, email
- Filter by:
  - Status (Active/Suspended/Trial)
  - Plan (Starter/Professional/Enterprise)
  - Created date
  - Revenue
- Sort by various metrics
- Bulk actions available

**Tenant Details Page**:
1. **Overview Tab**:
   - Company information
   - Subscription details
   - Usage statistics
   - Admin contacts

2. **Users Tab**:
   - List of all tenant users
   - Add/remove users
   - Reset passwords
   - Manage roles

3. **Billing Tab**:
   - Payment history
   - Invoices
   - Subscription management
   - Usage reports

4. **Settings Tab**:
   - Tenant configuration
   - Feature toggles
   - API keys
   - Webhooks

5. **Activity Tab**:
   - Recent actions
   - Login history
   - Audit logs (tenant-specific)

### 2.3 Tenant Actions

**Suspend Tenant**:
1. Select tenant
2. Click **"Suspend"**
3. Select reason:
   - Payment failure
   - Terms violation
   - Security concern
   - At customer request
4. Enter suspension note
5. Confirm suspension
6. Tenant users cannot login
7. Data preserved (not deleted)
8. Email notification sent

**Reactivate Tenant**:
1. Select suspended tenant
2. Click **"Reactivate"**
3. Verify reason for reactivation
4. Update subscription if needed
5. Confirm reactivation
6. Access restored
7. Notification sent

**Delete Tenant**:
1. Select tenant
2. Click **"Delete"** (in Danger Zone)
3. Type tenant name to confirm
4. Select data handling:
   - **Soft Delete**: 30-day grace period
   - **Hard Delete**: Immediate permanent deletion
5. Confirm deletion
6. Data deleted/archived
7. Domain released

⚠️ **Warning**: Tenant deletion is permanent! Always backup first.

### 2.4 Tenant Configuration

**Feature Management**:
Toggle features per tenant:
- ✅ Email Automation
- ✅ AI Processing
- ✅ Advanced Analytics
- ✅ Multi-Currency
- ✅ API Access
- ✅ Custom Branding
- ✅ White Label
- ✅ SSO Integration

**Resource Limits**:
Configure per tenant:
- **Max Users**: 5, 10, 25, 50, Unlimited
- **Max Bookings/Month**: Set limit
- **Storage Quota**: GB allocated
- **API Rate Limit**: Requests/hour
- **Email Quota**: Emails/day

**Branding Settings**:
- Custom logo
- Primary color
- Secondary color
- Favicon
- Email template customization
- White label options

---

## 3. User Management {#users}

### 3.1 Global User Management

**View All Users**:
1. Navigate to **Users** → **All Users**
2. See users across all tenants
3. Search by:
   - Name
   - Email
   - Role
   - Tenant
4. Filter by:
   - Status (Active/Inactive/Suspended)
   - Role (Super Admin/Operator/Agent/etc.)
   - Tenant
   - Created date
   - Last login

**User Actions**:
- View user details
- Edit user information
- Change role
- Reset password
- Suspend/activate account
- Force logout all sessions
- Delete user

### 3.2 Creating Super Admins

**Add Super Admin** (Use with caution):
1. Go to **Users** → **Add User**
2. Select role: **Super Admin**
3. Fill in details:
   - Full name
   - Email address
   - Phone number
4. Set initial password or send invitation
5. Assign specific permissions (if restricted)
6. Enable mandatory 2FA
7. Click **"Create Super Admin"**
8. User receives invitation email

**Super Admin Best Practices**:
- Limit to 2-3 people maximum
- Require strong passwords (12+ characters)
- Enforce 2FA mandatory
- Regular access reviews
- Use for system tasks only
- Personal accounts for regular work

### 3.3 Bulk User Operations

**Bulk Import**:
1. Go to **Users** → **Bulk Import**
2. Download CSV template
3. Fill in user data
4. Upload CSV
5. Review validation errors
6. Confirm import
7. Users created across tenants

**Bulk Actions**:
Select multiple users:
- Change role
- Suspend accounts
- Activate accounts
- Send notification
- Reset passwords
- Export user data

---

## 4. System Settings {#settings}

### 4.1 General Settings

**Platform Configuration**:
- **Platform Name**: Display name
- **Support Email**: Contact email
- **Support Phone**: Contact number
- **Default Language**: System default
- **Default Currency**: Base currency
- **Default Timezone**: System timezone
- **Date Format**: Global default
- **Time Format**: 12h/24h

**Email Settings**:
- SMTP configuration
- Email templates
- From address
- Reply-to address
- Email footer
- Unsubscribe settings

**Maintenance Mode**:
- Enable/disable maintenance
- Maintenance message
- Allowed IP addresses (admin access)
- Scheduled maintenance window

### 4.2 Security Settings

**Password Policy**:
- Minimum length: 8-20 characters
- Require uppercase: Yes/No
- Require lowercase: Yes/No
- Require numbers: Yes/No
- Require special characters: Yes/No
- Password history: 5-10 passwords
- Expiry: Never/30/60/90 days

**Session Management**:
- Session timeout: 15-60 minutes
- Absolute timeout: 1-24 hours
- Concurrent sessions: 1/3/5/Unlimited
- Remember me duration: 7-30 days

**2FA Policy**:
- Mandatory for: Super Admin/All/None
- Allowed methods: Email/SMS/App/All
- Backup codes: 5/10/20
- Grace period: 0-7 days

**IP Restrictions**:
- Enable IP whitelist
- Add allowed IP ranges
- Block specific IPs
- Geo-blocking (block by country)

**Login Protection**:
- Max failed attempts: 3-10
- Lockout duration: 15-60 minutes
- CAPTCHA after failures: 3-5 attempts
- Notification on suspicious login

### 4.3 Integration Settings

**API Configuration**:
- Enable/disable API
- API rate limiting
- API key management
- Webhook URLs
- CORS settings

**Third-Party Integrations**:
- Payment gateways (Stripe, PayPal)
- Email providers (SendGrid, Mailgun)
- SMS providers (Twilio, Nexmo)
- Storage providers (AWS S3, Azure)
- Analytics (Google Analytics, Mixpanel)

**SSO Configuration**:
- Google Workspace
- Microsoft Azure AD
- SAML 2.0 providers
- OAuth 2.0 settings
- JIT provisioning

### 4.4 Feature Flags

Toggle platform-wide features:
- ✅ Email automation
- ✅ AI processing
- ✅ Demand forecasting
- ✅ Multi-currency
- ✅ Bank reconciliation
- ✅ Inventory sync
- ✅ Performance monitoring
- ✅ Customer portal
- ✅ Agent portal
- ✅ Supplier portal

---

## 5. Audit Logs {#audit}

### 5.1 Viewing Audit Logs

**Access Audit Logs**:
1. Navigate to **System** → **Audit Logs**
2. View comprehensive activity log
3. Filter by:
   - **User**: Specific user or all
   - **Tenant**: Specific tenant or all
   - **Action**: Login, Create, Update, Delete, etc.
   - **Date Range**: Last day/week/month/custom
   - **Entity**: Users, Tenants, Bookings, etc.
   - **Status**: Success/Failed

**Log Details**:
Each log entry shows:
- Timestamp
- User (who performed action)
- Tenant
- Action type
- Entity affected
- IP address
- Browser/Device
- Changes made (before/after)
- Result (success/failure)

### 5.2 Audit Log Types

**Security Events**:
- User login/logout
- Failed login attempts
- Password changes
- 2FA enabled/disabled
- Permission changes
- Account locked/unlocked

**Administrative Actions**:
- Tenant created/updated/deleted
- User created/updated/deleted
- Settings changed
- Feature toggled
- System configuration

**Business Operations**:
- Booking created/updated/cancelled
- Payment processed
- Invoice generated
- Quote approved
- Email sent

**Data Changes**:
- Record created
- Record updated
- Record deleted
- Bulk operations
- Import/export

### 5.3 Audit Log Export

**Export Logs**:
1. Apply desired filters
2. Click **"Export"**
3. Choose format:
   - CSV
   - JSON
   - PDF
   - Excel
4. Select date range
5. Download file

**Use Cases**:
- Compliance reporting
- Security audits
- Incident investigation
- Performance analysis
- Billing verification

### 5.4 Log Retention

**Retention Policy**:
- Security logs: 2 years
- Audit logs: 1 year
- Activity logs: 90 days
- System logs: 30 days

**Archive Settings**:
- Auto-archive old logs
- Compressed storage
- Restore from archive
- Permanent deletion schedule

---

## 6. System Analytics {#analytics}

### 6.1 Platform Analytics

**Key Metrics Dashboard**:
- 📊 Total tenants (active/inactive)
- 👥 Total users (by role)
- 📈 Growth rate (MoM, YoY)
- 💰 Revenue (MRR, ARR)
- 🎯 Churn rate
- 📉 Customer acquisition cost
- ⏱️ Average session duration
- 🔄 API usage

**Tenant Analytics**:
- Active vs inactive tenants
- Tenants by plan
- Revenue by tenant
- Churn analysis
- Trial conversions
- Upgrade/downgrade trends

**User Analytics**:
- User growth over time
- Users by role
- Active users (DAU, MAU)
- User engagement
- Login frequency
- Session statistics

### 6.2 Performance Metrics

**System Performance**:
- **Response Time**: API endpoints
- **Uptime**: System availability
- **Error Rate**: Failed requests
- **Database Performance**: Query times
- **Cache Hit Rate**: Cache efficiency
- **Resource Usage**: CPU, Memory, Disk

**Application Metrics**:
- Page load times
- Feature usage
- Most used modules
- User journey analytics
- Conversion funnels

### 6.3 Business Intelligence

**Revenue Reports**:
- Monthly recurring revenue (MRR)
- Annual recurring revenue (ARR)
- Revenue by plan
- Revenue by tenant
- Payment success rate
- Refund rate

**Growth Metrics**:
- New tenant signups
- User registrations
- Trial to paid conversions
- Upgrade rate
- Churn rate
- Customer lifetime value (CLV)

**Operations Metrics**:
- Bookings per day/month
- Quote conversion rate
- Average booking value
- Invoice payment time
- Support ticket volume

---

## 7. Backup & Restore {#backup}

### 7.1 Automated Backups

**Backup Schedule**:
- **Full Backup**: Daily at 2 AM UTC
- **Incremental Backup**: Every 6 hours
- **Database Backup**: Every 4 hours
- **File Storage Backup**: Daily

**Retention Policy**:
- Daily backups: 30 days
- Weekly backups: 12 weeks
- Monthly backups: 12 months
- Yearly backups: 7 years (compliance)

### 7.2 Manual Backup

**Create Manual Backup**:
1. Go to **System** → **Backup & Restore**
2. Click **"Create Backup"**
3. Select backup type:
   - **Full**: Complete system
   - **Database Only**: Data only
   - **Files Only**: Uploaded files
   - **Configuration**: Settings only
4. Add backup description
5. Click **"Start Backup"**
6. Monitor progress
7. Download backup file (optional)

**Backup Storage**:
- Primary: AWS S3
- Secondary: Azure Blob Storage
- Offsite: Geographic redundancy
- Encryption: AES-256

### 7.3 Restore Procedures

**Restore from Backup**:
1. Go to **System** → **Backup & Restore**
2. Select backup from list
3. Review backup details:
   - Date created
   - Backup size
   - Backup type
   - Verification status
4. Click **"Restore"**
5. Select restore options:
   - **Full Restore**: Complete replacement
   - **Partial Restore**: Specific data
6. Confirm restoration (requires password)
7. System enters maintenance mode
8. Restore process runs
9. Verification performed
10. System back online

⚠️ **Warning**: Restore overwrites current data!

**Point-in-Time Recovery**:
1. Select specific date/time
2. System restores to that exact moment
3. Useful for:
   - Recovering from data corruption
   - Undoing bulk mistakes
   - Testing scenarios

---

## 8. Security Configuration {#security}

### 8.1 SSL/TLS Management

**Certificate Management**:
- **Auto-renew**: Let's Encrypt
- **Custom Certificate**: Upload own
- **Wildcard Support**: *.domain.com
- **Certificate Monitoring**: Expiry alerts
- **Force HTTPS**: Redirect HTTP

### 8.2 Firewall Configuration

**Web Application Firewall (WAF)**:
- Enable/disable WAF
- Rule sets:
  - OWASP Top 10 protection
  - DDoS protection
  - SQL injection prevention
  - XSS protection
  - Bot detection
- Custom rules
- IP allow/block lists
- Rate limiting

### 8.3 Security Monitoring

**Real-Time Alerts**:
- Failed login spikes
- Unusual traffic patterns
- Potential DDoS attacks
- Malware detection
- Suspicious API usage
- Data breach attempts

**Security Dashboard**:
- Current threat level
- Active attacks
- Blocked IPs
- Security events timeline
- Vulnerability scan results

### 8.4 Compliance

**GDPR Compliance**:
- Data processing agreements
- User consent management
- Right to erasure
- Data portability
- Privacy policy

**PCI DSS**:
- Payment card data protection
- Secure transmission
- Access control
- Regular security testing

**SOC 2**:
- Security controls
- Availability measures
- Processing integrity
- Confidentiality
- Privacy protection

---

## 9. Quick Reference

### Common Super Admin Tasks

| Task | Navigation |
|------|------------|
| Create Tenant | Tenants → Add Tenant |
| Manage Users | Users → All Users |
| View Audit Logs | System → Audit Logs |
| System Settings | System → Settings |
| Create Backup | System → Backup → Create |
| View Analytics | Analytics → Platform Overview |
| Security Settings | System → Security |

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Shift+T` | Create new tenant |
| `Ctrl+Shift+U` | Add new user |
| `Ctrl+Shift+L` | View audit logs |
| `Ctrl+Shift+A` | Platform analytics |
| `Ctrl+Shift+B` | Create backup |

---

**End of Part 4: Super Admin Guide**

*← [Part 3: Authentication](USER_MANUAL_03_AUTHENTICATION.md) | [Part 5: Operator Guide](USER_MANUAL_05_OPERATOR_GUIDE.md) →*
