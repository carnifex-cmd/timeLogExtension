// Content script to extract YouTrack authentication tokens
(function() {
  'use strict';
  
  console.log('YouTrack token extraction content script loaded on:', window.location.href);

  // Function to extract YouTrack authentication data
  function extractYouTrackAuth() {
    const authData = {};
    
    try {
      // Get the current URL to determine the base URL
      const baseUrl = `${window.location.protocol}//${window.location.host}`;
      authData.baseUrl = baseUrl;
      
      console.log('Starting auth extraction for:', baseUrl);
      
      // Try to get JWT token from localStorage
      const jwtToken = localStorage.getItem('ring-jwt');
      if (jwtToken) {
        authData.jwtToken = jwtToken;
      }
      
      // Get all localStorage keys and look for token patterns
      const allKeys = Object.keys(localStorage);
      console.log('All localStorage keys:', allKeys);
      
      // Look for keys that contain 'token' or match YouTrack patterns
      for (const key of allKeys) {
        if (key.includes('token') || 
            key.includes('auth') || 
            key.includes('access') ||
            key.includes('ring') ||
            key.match(/^[a-f0-9\-]{36}-token$/i) || // UUID-token pattern
            key.startsWith('com.jetbrains.youtrack')) {
          
          const value = localStorage.getItem(key);
          if (value) {
            console.log(`Found potential token key: ${key}`, value.substring(0, 100));
            try {
              // Try to parse as JSON first
              const parsed = JSON.parse(value);
              authData[key] = parsed;
              console.log(`Parsed ${key} as JSON:`, parsed);
            } catch (e) {
              // If not JSON, store as string
              authData[key] = value;
              console.log(`Stored ${key} as string`);
            }
          }
        }
      }
      
      // Also check for common token keys specifically
      const possibleTokenKeys = [
        'auth-token',
        'authToken', 
        'access_token',
        'accessToken',
        'token',
        'ytAuthToken',
        'youtrack-token',
        'ring-session',
        'ring-token'
      ];
      
      for (const key of possibleTokenKeys) {
        const token = localStorage.getItem(key);
        if (token && !authData[key]) {
          authData[key] = token;
        }
      }
      
      // Try to get user info from localStorage
      const userInfo = localStorage.getItem('ring-user') || localStorage.getItem('user');
      if (userInfo) {
        try {
          authData.userInfo = JSON.parse(userInfo);
        } catch (e) {
          authData.userInfo = userInfo;
        }
      }
      
      // Try to get session data
      const sessionData = localStorage.getItem('ring-session-data');
      if (sessionData) {
        try {
          authData.sessionData = JSON.parse(sessionData);
        } catch (e) {
          authData.sessionData = sessionData;
        }
      }
      
      // Check for cookies that might contain auth info
      if (document.cookie) {
        const cookies = {};
        document.cookie.split(';').forEach(cookie => {
          const [name, value] = cookie.trim().split('=');
          if (name && value && (name.includes('auth') || name.includes('token') || name.includes('ring'))) {
            cookies[name] = value;
          }
        });
        if (Object.keys(cookies).length > 0) {
          authData.cookies = cookies;
        }
      }
      
      console.log('Final auth data to return:', authData);
      return authData;
    } catch (error) {
      console.error('Error extracting YouTrack auth:', error);
      return { 
        baseUrl: `${window.location.protocol}//${window.location.host}`,
        error: error.message 
      };
    }
  }

  // Function to check if we're on a YouTrack page
  function isYouTrackPage() {
    const hostname = window.location.hostname;
    const pathname = window.location.pathname;
    const title = document.title;
    
    const isYT = hostname.includes('youtrack') || 
                 pathname.includes('youtrack') ||
                 title.includes('YouTrack') ||
                 document.querySelector('meta[name="application-name"][content*="YouTrack"]') !== null ||
                 document.querySelector('[data-test="ring-header-logo"]') !== null ||
                 document.querySelector('.ring-header') !== null;
    
    console.log('YouTrack page check:', {
      hostname,
      pathname, 
      title,
      isYouTrack: isYT,
      url: window.location.href
    });
    
    return isYT;
  }

  // Function to send auth data to the extension
  function sendAuthDataToExtension() {
    if (!isYouTrackPage()) {
      console.log('Not a YouTrack page, skipping auth data extraction');
      return;
    }
    
    const authData = extractYouTrackAuth();
    console.log('Extracted auth data:', authData);
    
    if (Object.keys(authData).length > 1) { // More than just baseUrl
      console.log('Sending auth data to extension:', authData);
      // Send message to extension
      // Check if chrome.runtime is valid before sending message
      if (chrome.runtime && chrome.runtime.id) {
        chrome.runtime.sendMessage({
          type: 'YOUTRACK_AUTH_DETECTED',
          data: authData,
          timestamp: Date.now()
        }).catch(error => {
          console.log('Extension not ready to receive messages:', error);
        });
      } else {
        console.log('Extension context invalidated, cannot send messages');
      }
    } else {
      console.log('No auth data found to send');
    }
  }

  // Listen for requests from the extension
  if (chrome.runtime && chrome.runtime.onMessage) {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      console.log('Content script received message:', request);
      
      if (request.type === 'GET_YOUTRACK_AUTH') {
        try {
          const authData = extractYouTrackAuth();
          const isYT = isYouTrackPage();
          
          console.log('Responding with auth data:', { authData, isYT });
          
          sendResponse({
            success: true,
            data: authData,
            isYouTrackPage: isYT
          });
        } catch (error) {
          console.error('Error in content script:', error);
          sendResponse({
            success: false,
            error: error.message,
            isYouTrackPage: isYouTrackPage()
          });
        }
      }
      return true; // Keep the message channel open for async response
    });
  } else {
    console.log('Chrome runtime not available, content script cannot listen for messages');
  }

  // Send auth data when page loads
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', sendAuthDataToExtension);
  } else {
    sendAuthDataToExtension();
  }

  // Also send when localStorage changes (if user logs in/out)
  window.addEventListener('storage', sendAuthDataToExtension);
  
  // Monitor for dynamic changes that might indicate auth state changes
  let lastAuthCheck = 0;
  setInterval(() => {
    const now = Date.now();
    if (now - lastAuthCheck > 5000) { // Check every 5 seconds
      lastAuthCheck = now;
      sendAuthDataToExtension();
    }
  }, 5000);

})(); 