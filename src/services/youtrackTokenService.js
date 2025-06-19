export class YouTrackTokenService {
  constructor() {
    this.detectedTokens = null;
    this.isListening = false;
    this.setupMessageListener();
  }

  /**
   * Setup message listener for content script communications
   */
  setupMessageListener() {
    if (this.isListening) return;
    
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.type === 'YOUTRACK_AUTH_DETECTED') {
        this.detectedTokens = {
          ...request.data,
          timestamp: request.timestamp,
          tabId: sender.tab?.id
        };
        console.log('YouTrack auth detected:', this.detectedTokens);
      }
    });
    
    this.isListening = true;
  }

  /**
   * Scan active YouTrack tabs for authentication tokens
   * @param {string} environment - 'production' or 'staging'
   */
  async scanForTokens(environment = 'production') {
    try {
      console.log('Starting token scan for environment:', environment);
      
      // Get all tabs
      const tabs = await new Promise((resolve) => {
        chrome.tabs.query({}, resolve);
      });

      console.log('Found tabs:', tabs.map(t => ({ id: t.id, url: t.url })));

      // Filter for YouTrack tabs based on environment
      let youtrackTabs;
      if (environment === 'staging') {
        youtrackTabs = tabs.filter(tab => 
          tab.url && tab.url.includes('stg-youtrack.internetbrands.com')
        );
      } else {
        youtrackTabs = tabs.filter(tab => 
          tab.url && (
            tab.url.includes('youtrack.internetbrands.com') && !tab.url.includes('stg-youtrack')
          )
        );
      }

      console.log(`${environment} YouTrack tabs found:`, youtrackTabs.map(t => ({ id: t.id, url: t.url })));

      if (youtrackTabs.length === 0) {
        const envName = environment === 'staging' ? 'staging (stg-youtrack.internetbrands.com)' : 'production (youtrack.internetbrands.com)';
        throw new Error(`No ${envName} YouTrack tabs found. Please open ${envName} in a browser tab first.`);
      }

      // Try to get auth data from each YouTrack tab
      for (const tab of youtrackTabs) {
        try {
          console.log(`Attempting to get auth data from tab ${tab.id}: ${tab.url}`);
          
          // First try to send message to existing content script
          let response = await new Promise((resolve, reject) => {
            try {
              chrome.tabs.sendMessage(tab.id, { type: 'GET_YOUTRACK_AUTH' }, (response) => {
                if (chrome.runtime.lastError) {
                  // Handle common extension context errors
                  const error = chrome.runtime.lastError.message;
                  if (error.includes('Extension context invalidated') || 
                      error.includes('Could not establish connection')) {
                    resolve(null); // Will trigger script injection
                  } else {
                    reject(new Error(error));
                  }
                } else {
                  resolve(response);
                }
              });
            } catch (error) {
              console.log(`Error sending message to tab ${tab.id}:`, error);
              resolve(null); // Will trigger script injection
            }
          });

          // If no response, try to inject the content script manually
          if (!response) {
            console.log(`No response from tab ${tab.id}, trying to inject content script...`);
            
            try {
              await new Promise((resolve, reject) => {
                chrome.scripting.executeScript({
                  target: { tabId: tab.id },
                  files: ['content-script.js']
                }, (result) => {
                  if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                  } else {
                    resolve(result);
                  }
                });
              });

              // Wait a bit for script to initialize
              await new Promise(resolve => setTimeout(resolve, 1000));

              // Try again
              response = await new Promise((resolve, reject) => {
                try {
                  chrome.tabs.sendMessage(tab.id, { type: 'GET_YOUTRACK_AUTH' }, (response) => {
                    if (chrome.runtime.lastError) {
                      console.log(`Second attempt failed for tab ${tab.id}:`, chrome.runtime.lastError.message);
                      resolve(null); // Will fall back to direct extraction
                    } else {
                      resolve(response);
                    }
                  });
                } catch (error) {
                  console.log(`Second attempt error for tab ${tab.id}:`, error);
                  resolve(null); // Will fall back to direct extraction
                }
              });
            } catch (injectError) {
              console.log(`Failed to inject content script in tab ${tab.id}:`, injectError.message);
            }
          }

          console.log(`Response from tab ${tab.id}:`, response);

          if (response) {
            if (response.success && response.data) {
              // Prefer tabs that are actually YouTrack pages
              if (response.isYouTrackPage) {
                this.detectedTokens = {
                  ...response.data,
                  timestamp: Date.now(),
                  tabId: tab.id,
                  tabUrl: tab.url
                };
                console.log('Successfully detected tokens:', this.detectedTokens);
                return this.detectedTokens;
              } else {
                console.log(`Tab ${tab.id} has data but is not detected as YouTrack page`);
              }
            } else if (response.error) {
              console.log(`Tab ${tab.id} content script error:`, response.error);
            } else {
              console.log(`Tab ${tab.id} returned no usable data`);
            }
          } else {
            console.log(`Tab ${tab.id} returned null/undefined response`);
          }
        } catch (error) {
          console.log(`Failed to get auth from tab ${tab.id}:`, error.message);
        }
      }

      // If no YouTrack page found with tokens, try a direct approach
      if (!this.detectedTokens) {
        // Try to inject a simple script that just extracts localStorage data
        for (const tab of youtrackTabs) {
          try {
            console.log(`Trying direct localStorage extraction for tab ${tab.id}`);
            
            const results = await new Promise((resolve, reject) => {
              chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: () => {
                  // Extract localStorage data directly
                  const authData = { baseUrl: `${window.location.protocol}//${window.location.host}` };
                  
                  for (const key of Object.keys(localStorage)) {
                    if (key.includes('token') || key.includes('auth') || key.includes('access') || key.match(/^[a-f0-9\-]{36}-token$/i)) {
                      const value = localStorage.getItem(key);
                      try {
                        authData[key] = JSON.parse(value);
                      } catch (e) {
                        authData[key] = value;
                      }
                    }
                  }
                  
                  return authData;
                }
              }, (result) => {
                if (chrome.runtime.lastError) {
                  reject(new Error(chrome.runtime.lastError.message));
                } else {
                  resolve(result);
                }
              });
            });

            if (results && results[0] && results[0].result) {
              const authData = results[0].result;
              console.log('Direct localStorage extraction result:', authData);
              
              if (Object.keys(authData).length > 1) { // More than just baseUrl
                this.detectedTokens = {
                  ...authData,
                  timestamp: Date.now(),
                  tabId: tab.id,
                  tabUrl: tab.url
                };
                console.log('Successfully detected tokens via direct method:', this.detectedTokens);
                return this.detectedTokens;
              }
            }
          } catch (directError) {
            console.log(`Direct extraction failed for tab ${tab.id}:`, directError.message);
          }
        }
        
        throw new Error('No authentication tokens found in YouTrack tabs. Please ensure you are logged into YouTrack.');
      }

      return this.detectedTokens;
    } catch (error) {
      console.error('Error scanning for tokens:', error);
      throw error;
    }
  }

  /**
   * Extract the best authentication token from detected data
   */
  extractAuthToken(detectedData) {
    if (!detectedData) {
      throw new Error('No token data available');
    }

    console.log('Detected data:', detectedData);

    // First, look for UUID-token pattern (like de42cfbd-5a6a-4874-b5fc-4f9825ea186a-token)
    for (const [key, value] of Object.entries(detectedData)) {
      if (key.match(/^[a-f0-9\-]{36}-token$/i) && value) {
        // Check if it's an object with accessToken
        if (typeof value === 'object' && value.accessToken) {
          return {
            token: value.accessToken,
            type: 'uuid-access-token',
            originalKey: key,
            tokenData: value,
            baseUrl: detectedData.baseUrl
          };
        } else if (typeof value === 'string') {
          return {
            token: value,
            type: 'uuid-token',
            originalKey: key,
            baseUrl: detectedData.baseUrl
          };
        }
      }
    }

    // Look for objects that contain accessToken
    for (const [key, value] of Object.entries(detectedData)) {
      if (typeof value === 'object' && value && value.accessToken) {
        return {
          token: value.accessToken,
          type: 'object-access-token',
          originalKey: key,
          tokenData: value,
          baseUrl: detectedData.baseUrl
        };
      }
    }

    // Priority order for different token types
    const tokenPriority = [
      'ring-jwt',
      'jwtToken', 
      'access_token',
      'accessToken',
      'auth-token',
      'authToken',
      'ring-session',
      'ring-token',
      'token',
      'ytAuthToken',
      'youtrack-token'
    ];

    // Look for the best available token
    for (const tokenKey of tokenPriority) {
      if (detectedData[tokenKey]) {
        const tokenValue = detectedData[tokenKey];
        
        // If it's an object, try to extract token from it
        if (typeof tokenValue === 'object' && tokenValue.accessToken) {
          return {
            token: tokenValue.accessToken,
            type: tokenKey + '-object',
            tokenData: tokenValue,
            baseUrl: detectedData.baseUrl
          };
        } else if (typeof tokenValue === 'string') {
          return {
            token: tokenValue,
            type: tokenKey,
            baseUrl: detectedData.baseUrl
          };
        }
      }
    }

    // Look for any key containing 'token' that we might have missed
    for (const [key, value] of Object.entries(detectedData)) {
      if (key.toLowerCase().includes('token') && 
          key !== 'baseUrl' && 
          key !== 'timestamp' && 
          key !== 'tabId' && 
          key !== 'tabUrl') {
        
        if (typeof value === 'string' && value.length > 10) {
          return {
            token: value,
            type: 'found-token',
            originalKey: key,
            baseUrl: detectedData.baseUrl
          };
        } else if (typeof value === 'object' && value && value.accessToken) {
          return {
            token: value.accessToken,
            type: 'found-object-token',
            originalKey: key,
            tokenData: value,
            baseUrl: detectedData.baseUrl
          };
        }
      }
    }

    // If no direct token found, try to extract from session data
    if (detectedData.sessionData) {
      try {
        const sessionData = typeof detectedData.sessionData === 'string' 
          ? JSON.parse(detectedData.sessionData) 
          : detectedData.sessionData;
        
        if (sessionData.token || sessionData.accessToken) {
          return {
            token: sessionData.token || sessionData.accessToken,
            type: 'session-token',
            baseUrl: detectedData.baseUrl
          };
        }
      } catch (error) {
        console.error('Error parsing session data:', error);
      }
    }

    // If no token found, try cookies
    if (detectedData.cookies) {
      const cookieTokens = Object.entries(detectedData.cookies)
        .filter(([key, value]) => value && value.length > 10);
      
      if (cookieTokens.length > 0) {
        return {
          token: cookieTokens[0][1],
          type: 'cookie-token',
          cookieName: cookieTokens[0][0],
          baseUrl: detectedData.baseUrl
        };
      }
    }

    console.error('No token found in detected data:', Object.keys(detectedData));
    throw new Error('No usable authentication token found in YouTrack page');
  }

  /**
   * Get user info from detected data
   */
  extractUserInfo(detectedData) {
    if (!detectedData) return null;

    if (detectedData.userInfo) {
      return typeof detectedData.userInfo === 'string' 
        ? JSON.parse(detectedData.userInfo) 
        : detectedData.userInfo;
    }

    return null;
  }

  /**
   * Validate if a token looks valid
   */
  validateToken(token) {
    if (!token || typeof token !== 'string') {
      console.log('Token validation failed: not a string or empty');
      return false;
    }

    // Basic validation - should be reasonably long and not obviously invalid
    const isValid = token.length > 10 && 
                   !token.includes('undefined') && 
                   !token.includes('null') &&
                   token.trim() === token;
    
    console.log('Token validation:', { 
      token: token.substring(0, 20) + '...', 
      length: token.length, 
      isValid 
    });
    
    return isValid;
  }

  /**
   * Get the most recent detected tokens
   */
  getDetectedTokens() {
    return this.detectedTokens;
  }

  /**
   * Clear detected tokens
   */
  clearDetectedTokens() {
    this.detectedTokens = null;
  }

  /**
   * Check if tokens are fresh (detected within last 5 minutes)
   */
  areTokensFresh(detectedData = this.detectedTokens) {
    if (!detectedData || !detectedData.timestamp) {
      return false;
    }

    const fiveMinutes = 5 * 60 * 1000;
    return (Date.now() - detectedData.timestamp) < fiveMinutes;
  }
} 