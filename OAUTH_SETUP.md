# 🔐 OAuth Authentication Setup Guide

This guide explains how to set up OAuth 2.0 authentication for the YouTrack Time Logger extension.

## 📋 Prerequisites

Before you can use OAuth authentication, you need to register your Chrome extension as an OAuth application with your YouTrack instance.

## 🛠️ YouTrack OAuth Application Setup

### Step 1: Contact YouTrack Administrators

Reach out to your YouTrack administrators and request them to register an OAuth application with the following details:

#### **Application Registration Details:**

```json
{
  "name": "YouTrack Time Logger Extension",
  "type": "Public Client",
  "description": "Chrome extension for logging time to multiple YouTrack tickets",
  "redirect_uris": [
    "https://[EXTENSION_ID].chromiumapp.org/"
  ],
  "scopes": [
    "YouTrack"
  ],
  "grant_types": [
    "authorization_code",
    "refresh_token"
  ]
}
```

### Step 2: Information Required from YouTrack Team

Ask your YouTrack administrators to provide you with:

1. **Client ID** - Public identifier for your application
2. **Authorization Endpoint** - Usually `https://your-youtrack.com/api/rest/oauth2/auth`
3. **Token Endpoint** - Usually `https://your-youtrack.com/api/rest/oauth2/token`
4. **Supported Scopes** - List of available scopes (typically `YouTrack`)

#### **Example Response:**
```json
{
  "client_id": "youtrack-time-logger-extension",
  "authorization_endpoint": "https://your-company.youtrack.cloud/api/rest/oauth2/auth",
  "token_endpoint": "https://your-company.youtrack.cloud/api/rest/oauth2/token",
  "scopes": ["YouTrack"],
  "redirect_uri": "https://abcdefghijklmnop.chromiumapp.org/"
}
```

### Step 3: YouTrack Administrator Configuration

The YouTrack administrators need to:

1. **Access Admin Panel**: Go to YouTrack Administration
2. **Navigate to OAuth**: Settings → Security → OAuth Applications
3. **Create New Application**: Click "New Application"
4. **Configure Application**:
   - **Name**: YouTrack Time Logger Extension
   - **Application Type**: Public Client
   - **Redirect URIs**: `https://[EXTENSION_ID].chromiumapp.org/`
   - **Scopes**: YouTrack (or specific scopes like read-issue, update-issue)
   - **Grant Types**: Authorization Code, Refresh Token

## 🔧 Extension Configuration

### Step 4: Find Your Extension ID

1. **Load Extension**: Install your extension in Chrome
2. **Get Extension ID**: Go to `chrome://extensions/` and copy the extension ID
3. **Update Redirect URI**: Provide this to YouTrack admins for the redirect URI

### Step 5: Configure OAuth in Extension

Once you have the OAuth credentials:

1. **Open Extension**: Click on the extension icon
2. **Select OAuth Tab**: Choose "OAuth 2.0" authentication method
3. **Enter Details**:
   - **YouTrack Base URL**: `https://your-company.youtrack.cloud`
   - **OAuth Client ID**: The client ID provided by YouTrack admins
4. **Connect**: Click "Connect with OAuth"

## 🔒 Security Benefits of OAuth

### Why Choose OAuth over API Tokens?

| Feature | API Token | OAuth 2.0 |
|---------|-----------|-----------|
| **Security** | Permanent, high-risk if compromised | Temporary, auto-refreshing |
| **Scope Control** | Full access | Limited scopes |
| **Revocation** | Manual token deletion | Automatic expiration + revoke |
| **User Experience** | Manual token creation | One-click authentication |
| **Audit Trail** | Limited | Comprehensive logging |

### OAuth Flow Security Features

1. **Short-lived Access Tokens**: Tokens expire automatically (typically 1 hour)
2. **Refresh Token Rotation**: Refresh tokens are rotated on each use
3. **Scope Limitation**: Only requested permissions are granted
4. **Automatic Revocation**: Tokens can be revoked centrally
5. **PKCE Support**: Proof Key for Code Exchange for additional security

## 🚀 Usage Instructions

### For End Users:

1. **Choose Authentication Method**: Select OAuth 2.0 tab
2. **Enter YouTrack URL**: Your company's YouTrack instance URL
3. **Enter Client ID**: Provided by your YouTrack administrator
4. **Authenticate**: Click "Connect with OAuth"
5. **Grant Permissions**: Approve the requested permissions in YouTrack
6. **Start Using**: You're now authenticated and can log time!

### First-Time OAuth Setup:
```
1. Extension opens OAuth tab
2. User enters YouTrack URL + Client ID
3. Extension redirects to YouTrack login
4. User logs in to YouTrack
5. YouTrack shows permission grant screen
6. User approves permissions
7. YouTrack redirects back to extension
8. Extension exchanges code for tokens
9. Extension stores tokens securely
10. User can now access tickets and log time
```

## 🔧 Troubleshooting

### Common Issues:

#### **"Client ID not found"**
- Verify the Client ID with YouTrack administrators
- Ensure the OAuth application is properly registered

#### **"Invalid redirect URI"**
- Check that the extension ID matches the registered redirect URI
- Format should be: `https://[EXTENSION_ID].chromiumapp.org/`

#### **"Access denied"**
- User cancelled the OAuth flow
- Check if user has necessary permissions in YouTrack

#### **"Token expired"**
- This is normal behavior - tokens are automatically refreshed
- If refresh fails, user needs to re-authenticate

### Debug Information:

Enable Chrome DevTools for the extension:
1. Go to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Inspect views: popup.html"
4. Check Console for OAuth-related logs

## 📞 Support

### For YouTrack Administrators:
- [YouTrack OAuth Documentation](https://www.jetbrains.com/help/youtrack/oauth-2-0.html)
- JetBrains Support Portal

### For Extension Users:
- Contact your YouTrack administrators for OAuth setup
- Check this documentation for troubleshooting steps

## 🔄 Token Management

### Automatic Token Refresh:
- Access tokens are automatically refreshed before expiration
- No user intervention required for token renewal
- Tokens are stored securely in Chrome's encrypted storage

### Manual Logout:
- Click the "Logout" button to revoke tokens
- Tokens are securely deleted from local storage
- OAuth tokens are revoked on YouTrack server

---

**Note**: OAuth setup requires coordination with your YouTrack administrators. API token authentication remains available as a fallback option. 