# Travel CRM Pro - User Manual
## Part 3: Authentication & Account Management

**Version**: 2.1.0  
**Last Updated**: November 15, 2025  
**Document**: 3 of 14

---

## Table of Contents

1. [User Registration](#registration)
2. [Login Procedures](#login)
3. [Password Management](#password-management)
4. [Two-Factor Authentication](#2fa)
5. [Profile Management](#profile)
6. [Account Security](#security)
7. [Session Management](#sessions)
8. [Single Sign-On](#sso)

---

## 1. User Registration {#registration}

### 1.1 Self-Registration (Customer Portal)

Customers can self-register for access to the customer portal:

**Steps**:
1. Go to `https://yourcompany.com/customer/register`
2. Fill in the registration form:
   - **Full Name**: Your complete name
   - **Email Address**: Valid email (used for login)
   - **Password**: Minimum 8 characters
     - At least 1 uppercase letter
     - At least 1 lowercase letter
     - At least 1 number
     - At least 1 special character
   - **Phone Number**: Contact number
   - **Country**: Select from dropdown
3. Read and accept Terms & Conditions
4. Click **"Create Account"**
5. Check email for verification link
6. Click verification link (expires in 24 hours)
7. Login with your credentials

**Email Verification**:
- Required for account activation
- Check spam folder if not received
- Resend verification email option available
- Contact support if issues persist

### 1.2 Admin-Created Accounts

Super Admins and Operators can create accounts for all user types:

**Steps**:
1. Login as Super Admin or Operator
2. Navigate to **Users** → **Add User**
3. Select **User Role**:
   - Operator
   - Agent
   - Finance
   - Supplier
   - Customer
4. Fill in user details:
   - Full Name
   - Email Address
   - Phone Number
   - Role-specific fields
5. Set initial password or send invitation email
6. Assign permissions (if custom)
7. Click **"Create User"**
8. User receives welcome email with login instructions

**Invitation Email**:
- Contains temporary login link
- User sets their own password
- Link expires in 7 days
- Can be resent if expired

### 1.3 Bulk User Import

Import multiple users via CSV:

**Steps**:
1. Go to **Users** → **Import Users**
2. Download CSV template
3. Fill in user data:
   ```csv
   name,email,role,phone,country
   John Doe,john@example.com,agent,+1234567890,USA
   Jane Smith,jane@example.com,customer,+0987654321,UK
   ```
4. Upload completed CSV
5. Review import preview
6. Confirm import
7. Users receive invitation emails

**CSV Requirements**:
- UTF-8 encoding
- Required fields: name, email, role
- Maximum 1000 users per import
- Duplicate emails are skipped

---

## 2. Login Procedures {#login}

### 2.1 Standard Login

**General Login Process**:
1. Navigate to appropriate login page
2. Enter email address
3. Enter password
4. Click **"Login"** or press Enter
5. Complete 2FA if enabled
6. Redirected to dashboard

**Login URLs by User Type**:

| User Type | Login URL | Redirect After Login |
|-----------|-----------|----------------------|
| Super Admin | `/login` | Admin Dashboard |
| Operator | `/login` | Operations Dashboard |
| Finance | `/login` | Finance Dashboard |
| Agent | `/agent/login` | Agent Dashboard |
| Customer | `/customer/login` | Customer Dashboard |
| Supplier | `/supplier/login` | Supplier Dashboard |

### 2.2 Remember Me Feature

**How It Works**:
- Check "Remember Me" checkbox before login
- Session extended to 30 days
- Secure cookie stored on device
- Auto-login on next visit
- Device-specific (doesn't work on other devices)

**Security Notes**:
- ⚠️ Don't use on shared/public computers
- ⚠️ Logout manually when using shared devices
- ⚠️ Clear browser cookies to remove auto-login

### 2.3 Login Troubleshooting

**Common Issues**:

**❌ "Invalid email or password"**
- **Cause**: Incorrect credentials
- **Solution**: 
  - Check for typos
  - Verify email address
  - Try password reset
  - Check Caps Lock

**❌ "Account not verified"**
- **Cause**: Email not verified
- **Solution**: 
  - Check inbox for verification email
  - Click "Resend verification email"
  - Check spam/junk folder
  - Contact support

**❌ "Account locked"**
- **Cause**: Too many failed login attempts
- **Solution**: 
  - Wait 30 minutes for auto-unlock
  - Contact admin to unlock immediately
  - Check security alerts email

**❌ "Session expired"**
- **Cause**: Inactive for too long
- **Solution**: 
  - Simply login again
  - Enable "Remember Me" for longer sessions

### 2.4 Multi-Portal Access

Users with multiple roles can access different portals:

**Switching Portals**:
1. Click profile menu (top right)
2. Select **"Switch Portal"**
3. Choose desired portal
4. Automatically redirected
5. Permissions adjusted accordingly

**Example**: An Operator who is also an Agent can switch between:
- Operations Dashboard (full admin access)
- Agent Portal (commission tracking, own customers)

---

## 3. Password Management {#password-management}

### 3.1 Password Requirements

**Minimum Requirements**:
- ✅ At least 8 characters long
- ✅ At least 1 uppercase letter (A-Z)
- ✅ At least 1 lowercase letter (a-z)
- ✅ At least 1 number (0-9)
- ✅ At least 1 special character (!@#$%^&*)

**Recommended Requirements**:
- 12+ characters for admin roles
- Unique password (not used elsewhere)
- No personal information
- No common words or patterns
- Use password manager

**Password Strength Meter**:
- Red: Weak (not accepted)
- Yellow: Fair (accepted but not recommended)
- Green: Strong (recommended)
- Blue: Very Strong (excellent)

### 3.2 Changing Password (Logged In)

**Steps**:
1. Click profile menu (top right)
2. Select **"Profile Settings"** or **"Account"**
3. Navigate to **"Security"** tab
4. Click **"Change Password"**
5. Enter current password
6. Enter new password
7. Confirm new password
8. Click **"Update Password"**
9. Confirmation message appears
10. All other sessions logged out automatically

**Password History**:
- Cannot reuse last 5 passwords
- Enforced for security
- Admin roles: last 10 passwords

### 3.3 Forgot Password (Password Reset)

**Reset Process**:
1. Go to login page
2. Click **"Forgot Password?"**
3. Enter your registered email
4. Click **"Send Reset Link"**
5. Check email inbox
6. Click reset link (expires in 1 hour)
7. Enter new password
8. Confirm new password
9. Click **"Reset Password"**
10. Redirected to login page
11. Login with new password

**Reset Email Not Received?**:
- Wait 5 minutes (may be delayed)
- Check spam/junk folder
- Verify email address is correct
- Try "Resend reset email"
- Contact support if still not received

**Security Features**:
- Reset link expires after 1 hour
- Link can only be used once
- Old sessions invalidated after reset
- Email notification sent after successful reset

### 3.4 Admin Password Reset

Administrators can reset passwords for users:

**Steps**:
1. Login as Super Admin or Operator
2. Go to **Users** → **Manage Users**
3. Find and select user
4. Click **"Reset Password"**
5. Choose method:
   - **Send Reset Email**: User receives reset link
   - **Set Temporary Password**: Admin sets password, user must change on login
6. Confirm action
7. User notified via email

**When to Use**:
- User forgot password and can't access email
- Account locked and user needs immediate access
- Security incident requires password change
- Onboarding new employees

---

## 4. Two-Factor Authentication (2FA) {#2fa}

### 4.1 What is 2FA?

Two-Factor Authentication adds an extra layer of security by requiring two forms of verification:
1. **Something you know**: Password
2. **Something you have**: Phone/device with verification code

**Why Enable 2FA?**:
- ✅ Protects against password theft
- ✅ Prevents unauthorized access
- ✅ Required for admin roles
- ✅ Compliance requirement
- ✅ Industry best practice

### 4.2 Enabling 2FA

**Methods Available**:
1. **Email OTP**: Code sent to email (default)
2. **SMS OTP**: Code sent via text message
3. **Authenticator App**: Google Authenticator, Authy, Microsoft Authenticator

**Email OTP Setup** (Default - No setup required):
1. Login normally
2. Check email for 6-digit code
3. Enter code on verification page
4. Access granted

**SMS OTP Setup**:
1. Go to **Profile** → **Security**
2. Click **"Enable SMS 2FA"**
3. Enter mobile number
4. Click **"Send Verification Code"**
5. Enter code received via SMS
6. Confirm setup
7. SMS 2FA now active

**Authenticator App Setup** (Most Secure):
1. Download authenticator app:
   - Google Authenticator (iOS/Android)
   - Microsoft Authenticator (iOS/Android)
   - Authy (iOS/Android/Desktop)
2. Go to **Profile** → **Security**
3. Click **"Enable Authenticator 2FA"**
4. Scan QR code with app
5. Enter 6-digit code from app
6. Save backup codes (important!)
7. Confirm setup
8. App-based 2FA now active

### 4.3 Using 2FA

**Login with 2FA Enabled**:
1. Enter email and password
2. Click **"Login"**
3. Verification page appears
4. Check your verification method:
   - **Email**: Check inbox for code
   - **SMS**: Check text messages
   - **App**: Open authenticator app
5. Enter 6-digit code
6. Click **"Verify"**
7. Access granted

**Trust This Device** (Optional):
- Check "Trust this device for 30 days"
- 2FA not required on this device for 30 days
- Recommended only for personal devices
- Not recommended for shared/public computers

### 4.4 Backup Codes

**What Are Backup Codes?**:
- One-time use codes for emergency access
- Used when primary 2FA method unavailable
- 10 codes generated during 2FA setup

**Saving Backup Codes**:
1. After 2FA setup, backup codes displayed
2. **Save these codes securely**:
   - Print and store in safe place
   - Save in password manager
   - Store in secure note
3. Each code can only be used once
4. Generate new codes when running low

**Using Backup Codes**:
1. Click **"Use backup code"** on 2FA page
2. Enter one of your backup codes
3. Code is consumed (can't be reused)
4. Access granted
5. Regenerate backup codes if running low

### 4.5 Disabling 2FA

**Self-Disable** (If you can login):
1. Login with 2FA
2. Go to **Profile** → **Security**
3. Click **"Disable 2FA"**
4. Enter password for confirmation
5. Enter current 2FA code
6. Click **"Disable"**
7. 2FA now disabled

**Admin-Disable** (If locked out):
1. Contact administrator
2. Admin verifies your identity
3. Admin disables 2FA for your account
4. You receive email notification
5. Login without 2FA
6. Re-enable 2FA from settings

---

## 5. Profile Management {#profile}

### 5.1 Viewing Your Profile

**Access Your Profile**:
1. Click profile icon/name (top right)
2. Select **"Profile"** or **"My Account"**
3. Profile page displays:
   - Personal information
   - Contact details
   - Profile photo
   - Account statistics
   - Recent activity

### 5.2 Editing Profile Information

**Editable Fields**:
- Full Name
- Display Name
- Email Address (requires verification)
- Phone Number
- Country/Region
- Time Zone
- Language Preference
- Profile Photo

**Edit Process**:
1. Go to your profile page
2. Click **"Edit Profile"**
3. Modify desired fields
4. Click **"Save Changes"**
5. Changes saved instantly
6. Email notification sent for sensitive changes

**Changing Email Address**:
1. Click **"Change Email"**
2. Enter new email address
3. Enter password for confirmation
4. Click **"Update Email"**
5. Verification email sent to new address
6. Click verification link
7. Email address updated
8. Old email receives notification

### 5.3 Profile Photo

**Upload Profile Photo**:
1. Go to **Profile** → **Edit Profile**
2. Click on profile photo or camera icon
3. Choose upload method:
   - **Upload from Computer**: Select image file
   - **Take Photo**: Use webcam
   - **Choose Avatar**: Select from preset avatars
4. Crop/adjust image
5. Click **"Save"**
6. Photo updated across platform

**Photo Requirements**:
- Format: JPG, PNG, GIF
- Maximum size: 5 MB
- Recommended: Square image, 400x400px minimum
- Aspect ratio: 1:1 (square)

### 5.4 Notification Preferences

**Configure Notifications**:
1. Go to **Profile** → **Notifications**
2. Choose notification channels:
   - ✉️ Email
   - 📱 In-App
   - 📲 SMS (if enabled)
   - 🔔 Push Notifications (mobile app)
3. Select notification types:
   - Booking updates
   - Payment confirmations
   - Quote requests
   - System alerts
   - Marketing emails
4. Set frequency:
   - Instant
   - Daily digest
   - Weekly summary
5. Click **"Save Preferences"**

**Unsubscribe from Emails**:
- Click "Unsubscribe" in any email
- Or disable in notification preferences
- Or contact support

### 5.5 Language & Regional Settings

**Change Language**:
1. Go to **Profile** → **Preferences**
2. Select **Language**
3. Choose from available languages:
   - English
   - Spanish
   - French
   - German
   - (More languages available)
4. Interface updates immediately

**Regional Settings**:
- **Time Zone**: Select your time zone
- **Date Format**: DD/MM/YYYY or MM/DD/YYYY
- **Time Format**: 12-hour or 24-hour
- **Currency**: Default currency display
- **Number Format**: Comma or period separators

---

## 6. Account Security {#security}

### 6.1 Security Dashboard

Access your security dashboard:
1. Go to **Profile** → **Security**
2. View security overview:
   - Last login
   - Active sessions
   - Login history
   - Security alerts
   - 2FA status
   - Connected devices

### 6.2 Login History

**View Login Activity**:
1. Go to **Profile** → **Security** → **Login History**
2. See details:
   - Date/Time of login
   - Device type (Desktop/Mobile)
   - Browser used
   - IP Address
   - Location (city/country)
   - Status (Success/Failed)

**Suspicious Activity**:
- ⚠️ Unfamiliar location
- ⚠️ Unknown device
- ⚠️ Multiple failed attempts
- ⚠️ Unusual time of access

**If Suspicious Activity Detected**:
1. Change password immediately
2. Enable 2FA if not already enabled
3. Logout all other sessions
4. Review login history
5. Contact support if compromised

### 6.3 Active Sessions

**Manage Active Sessions**:
1. Go to **Profile** → **Security** → **Active Sessions**
2. View all logged-in devices:
   - Current session (marked)
   - Browser and OS
   - Location
   - Last activity time
3. Actions available:
   - **Logout This Session**: End specific session
   - **Logout All Others**: Keep current, end all others
   - **Logout All**: End all sessions (requires re-login)

**When to Logout Sessions**:
- After using public computer
- Lost/stolen device
- Security concern
- Before traveling
- End of workday (optional)

### 6.4 Connected Devices

**Manage Trusted Devices**:
1. Go to **Profile** → **Security** → **Connected Devices**
2. View devices where "Remember Me" is active
3. See device details:
   - Device name
   - Browser
   - Added date
   - Last used
4. Remove devices:
   - Click **"Remove"** next to device
   - Confirmation required
   - Device no longer trusted

### 6.5 Security Alerts

**Types of Security Alerts**:
- 🔔 New device login
- 🔔 Password changed
- 🔔 Email address changed
- 🔔 2FA enabled/disabled
- 🔔 Failed login attempts
- 🔔 Account locked
- 🔔 Permission changes (admin roles)

**Alert Notifications**:
- Email notification sent immediately
- In-app notification
- SMS for critical alerts (optional)

### 6.6 Account Deactivation

**Temporarily Deactivate Account**:
1. Go to **Profile** → **Security**
2. Scroll to **"Danger Zone"**
3. Click **"Deactivate Account"**
4. Enter password
5. Select reason (optional)
6. Confirm deactivation
7. Account disabled (can be reactivated)

**Reactivate Account**:
1. Go to login page
2. Enter credentials
3. Click **"Reactivate Account"**
4. Account restored instantly

**Permanently Delete Account**:
1. Go to **Profile** → **Security**
2. Click **"Delete Account Permanently"**
3. Read warnings carefully
4. Enter password
5. Type "DELETE" to confirm
6. Account scheduled for deletion (30-day grace period)
7. Data permanently deleted after 30 days

⚠️ **Warning**: Account deletion is irreversible after grace period!

---

## 7. Session Management {#sessions}

### 7.1 Session Timeout

**Automatic Logout**:
- **Idle Timeout**: 30 minutes of inactivity
- **Absolute Timeout**: 24 hours (even if active)
- **Admin Timeout**: 15 minutes (stricter for security)

**Session Expiry Warning**:
- Warning appears 5 minutes before timeout
- Option to extend session
- Auto-save of unsaved work (where possible)

**Extending Session**:
1. Click **"Stay Logged In"** on warning
2. Session extended by 30 minutes
3. Or click anywhere in the app
4. Activity resets timeout timer

### 7.2 Concurrent Sessions

**Multiple Device Login**:
- ✅ Allowed by default
- Same account on multiple devices simultaneously
- Each device has separate session
- All sessions subject to timeout

**Session Limits** (Configurable by admin):
- Default: Unlimited concurrent sessions
- Can be restricted to 1, 3, or 5 sessions
- Oldest session terminated when limit reached

### 7.3 Logout Procedures

**Standard Logout**:
1. Click profile menu (top right)
2. Select **"Logout"**
3. Logged out immediately
4. Redirected to login page
5. Session data cleared

**Logout All Devices**:
1. Go to **Profile** → **Security**
2. Click **"Logout All Devices"**
3. Confirm action
4. All sessions terminated
5. Current device also logged out
6. Must login again

**Auto-Logout Scenarios**:
- Session timeout (inactivity)
- Password changed
- Account locked/suspended
- Admin-forced logout
- Security incident

---

## 8. Single Sign-On (SSO) {#sso}

### 8.1 SSO Overview

Single Sign-On allows login using external identity providers:

**Supported Providers**:
- Google Workspace
- Microsoft Azure AD
- Okta
- Auth0
- SAML 2.0 providers

**Benefits**:
- ✅ One password to remember
- ✅ Faster login process
- ✅ Centralized user management
- ✅ Enhanced security
- ✅ Automatic account provisioning

### 8.2 Linking SSO Account

**Google SSO**:
1. Go to **Profile** → **Security** → **SSO**
2. Click **"Connect with Google"**
3. Choose Google account
4. Grant permissions
5. Accounts linked
6. Can now login with Google

**Microsoft SSO**:
1. Go to **Profile** → **Security** → **SSO**
2. Click **"Connect with Microsoft"**
3. Enter Microsoft credentials
4. Grant permissions
5. Accounts linked
6. Can now login with Microsoft

### 8.3 SSO Login Process

**Using SSO to Login**:
1. Go to login page
2. Click SSO provider button:
   - **"Sign in with Google"**
   - **"Sign in with Microsoft"**
   - **"Sign in with SSO"** (SAML)
3. Redirected to provider
4. Authenticate with provider
5. Automatically logged in
6. Redirected to dashboard

**First-Time SSO Login**:
1. Click SSO provider button
2. Authenticate with provider
3. If account exists:
   - Automatically linked
   - Logged in
4. If account doesn't exist:
   - New account created
   - Profile populated from SSO data
   - Logged in

### 8.4 Unlinking SSO

**Disconnect SSO Account**:
1. Go to **Profile** → **Security** → **SSO**
2. View linked accounts
3. Click **"Disconnect"** next to provider
4. Confirm disconnection
5. SSO login no longer available
6. Must use email/password login

⚠️ **Important**: Ensure you have a password set before unlinking SSO!

### 8.5 Enterprise SSO (SAML)

**For Organizations**:
Admin must configure SAML SSO:

1. Admin configures SAML provider details
2. Users receive SSO login option
3. Click **"Sign in with SSO"**
4. Enter company email domain
5. Redirected to company login page
6. Authenticate with company credentials
7. Logged in automatically

**Just-in-Time (JIT) Provisioning**:
- New users auto-created on first SSO login
- User attributes mapped from SSO provider
- Role assignment based on SSO groups
- No manual user creation needed

---

## 9. Account Recovery

### 9.1 Locked Account Recovery

**Account Locked (Failed Attempts)**:
- Automatic lock after 5 failed login attempts
- Lock duration: 30 minutes
- Options:
  1. Wait 30 minutes for auto-unlock
  2. Use "Forgot Password" to reset
  3. Contact admin for immediate unlock

### 9.2 Lost 2FA Device

**Can't Access 2FA**:
1. Click **"Having trouble?"** on 2FA page
2. Select **"Use backup code"**
3. Enter one of your backup codes
4. Or contact support with:
   - Account email
   - Identity verification
   - Recent activity proof

**Support Will**:
- Verify your identity
- Temporarily disable 2FA
- Send reset instructions
- Log security event

### 9.3 Compromised Account

**If Account Hacked**:
1. **Immediate Actions**:
   - Try to login and change password
   - If can't login, use "Forgot Password"
   - Contact support immediately
   - Report suspicious activity
2. **Support Actions**:
   - Temporarily lock account
   - Investigate unauthorized access
   - Reset credentials
   - Enable additional security
3. **After Recovery**:
   - Change password
   - Enable 2FA
   - Review login history
   - Remove unknown devices
   - Check for unauthorized changes

---

## 10. Best Practices

### 10.1 Password Best Practices

✅ **DO**:
- Use unique password for this account
- Use password manager
- Enable 2FA
- Change password if compromised
- Use passphrase (4+ random words)

❌ **DON'T**:
- Share password with anyone
- Use same password on multiple sites
- Write password on sticky notes
- Use personal information
- Use simple patterns (123456, password)

### 10.2 Account Security Tips

1. **Enable 2FA**: Always use two-factor authentication
2. **Regular Review**: Check login history monthly
3. **Strong Passwords**: 12+ characters with mix
4. **Logout Public Devices**: Always logout on shared computers
5. **Update Contact Info**: Keep email and phone current
6. **Monitor Alerts**: Review security notifications
7. **Limited Permissions**: Only request access needed
8. **Secure Email**: Protect email account (it's the key)

### 10.3 Privacy Tips

- Review and update privacy settings regularly
- Control who can see your information
- Limit data sharing where possible
- Understand Terms of Service
- Use privacy-focused browsers
- Clear browser data after sensitive operations

---

## 11. Quick Reference

### Common Tasks

| Task | Navigation |
|------|------------|
| Change Password | Profile → Security → Change Password |
| Enable 2FA | Profile → Security → Two-Factor Authentication |
| View Login History | Profile → Security → Login History |
| Logout All Devices | Profile → Security → Active Sessions → Logout All |
| Update Email | Profile → Edit Profile → Change Email |
| Notification Settings | Profile → Notifications |
| Deactivate Account | Profile → Security → Deactivate Account |

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Alt+P` | Open profile menu |
| `Alt+L` | Logout |
| `Ctrl+Shift+S` | Open security settings |

### Support Contacts

- **Account Issues**: accounts@yourcompany.com
- **Security Concerns**: security@yourcompany.com  
- **General Support**: support@yourcompany.com
- **Phone**: +1 (XXX) XXX-XXXX

---

**End of Part 3: Authentication & Account Management**

*← [Part 2: User Roles & Permissions](USER_MANUAL_02_USER_ROLES.md) | [Part 4: Super Admin Guide](USER_MANUAL_04_SUPER_ADMIN.md) →*
