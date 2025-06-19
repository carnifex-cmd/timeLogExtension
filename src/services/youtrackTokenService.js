export class YouTrackTokenService {
  constructor() {
    this.detectedTokens = null;
  }

  /**
   * Simple YouTrack token extraction using the specific localStorage pattern
   */
  async extractYouTrackTokenDirect(tabId) {
    try {
      const results = await new Promise((resolve, reject) => {
        chrome.scripting.executeScript({
          target: { tabId: tabId },
          func: () => {
            try {
              const storage = window.localStorage;
              const serviceId = storage.getItem('com.jetbrains.youtrack.youtrackConfig') ?
                JSON.parse(storage.getItem('com.jetbrains.youtrack.youtrackConfig')).ring.serviceId : false;
              
              if (serviceId) {
                const tokenData = JSON.parse(storage.getItem(`${serviceId}-token`));
                const accessToken = tokenData.accessToken;
                
                if (accessToken) {
                  return {
                    success: true,
                    data: {
                      baseUrl: `${window.location.protocol}//${window.location.host}`,
                      accessToken: accessToken,
                      tokenData: tokenData,
                      serviceId: serviceId
                    },
                    isYouTrackPage: window.location.hostname.includes('youtrack'),
                    method: 'direct-youtrack-pattern'
                  };
                }
              }
              
              return {
                success: false,
                error: 'No YouTrack token found using standard pattern',
                isYouTrackPage: window.location.hostname.includes('youtrack')
              };
            } catch (error) {
              return {
                success: false,
                error: error.message,
                isYouTrackPage: window.location.hostname.includes('youtrack')
              };
            }
          }
        }, (results) => {
          if (chrome.runtime.lastError) {
            resolve(null); // Return null on any Chrome API errors
          } else {
            resolve(results);
          }
        });
      });

      return results;
    } catch (error) {
      console.log('Direct extraction error:', error);
      return null;
    }
  }

  /**
   * Scan active YouTrack tabs for authentication tokens
   * Now uses simple, direct token extraction
   */
  async scanForTokens() {
    try {
      console.log('Starting simple token scan for production YouTrack');
      
      // Get all tabs
      const tabs = await new Promise((resolve, reject) => {
        try {
          chrome.tabs.query({}, (tabs) => {
            if (chrome.runtime.lastError) {
              reject(new Error(chrome.runtime.lastError.message));
            } else {
              resolve(tabs);
            }
          });
        } catch (error) {
          reject(new Error('Failed to query tabs: ' + error.message));
        }
      });

      console.log('Found tabs:', tabs.map(t => ({ id: t.id, url: t.url })));

      // Filter for production YouTrack tabs only
      const youtrackTabs = tabs.filter(tab => 
        tab.url && (
          tab.url.includes('youtrack.internetbrands.com') && !tab.url.includes('stg-youtrack')
        )
      );

      console.log('Production YouTrack tabs found:', youtrackTabs.map(t => ({ id: t.id, url: t.url })));

      if (youtrackTabs.length === 0) {
        throw new Error('No production YouTrack tabs found. Please open production YouTrack (youtrack.internetbrands.com) in a browser tab first.');
      }

      // Try to get auth data from each YouTrack tab using simple extraction
      for (const tab of youtrackTabs) {
        console.log(`Extracting token from tab ${tab.id}: ${tab.url}`);
        
        try {
          const results = await this.extractYouTrackTokenDirect(tab.id);
          
          if (results && results[0] && results[0].result) {
            const response = results[0].result;
            console.log(`Token extraction response from tab ${tab.id}:`, response);

            if (response.success && response.data && response.isYouTrackPage) {
              this.detectedTokens = {
                baseUrl: response.data.baseUrl,
                accessToken: response.data.accessToken,
                tokenData: response.data.tokenData,
                serviceId: response.data.serviceId,
                timestamp: Date.now(),
                tabId: tab.id,
                tabUrl: tab.url
              };
              console.log('Successfully detected YouTrack token:', this.detectedTokens);
              return this.detectedTokens;
            } else {
              console.log(`Tab ${tab.id}: ${response.error || 'No token found'}`);
            }
          } else {
            console.log(`Tab ${tab.id}: No results returned`);
          }
        } catch (error) {
          console.log(`Failed to extract token from tab ${tab.id}:`, error.message);
        }
      }

      // If we get here, no tokens were found
      throw new Error('No authentication tokens found in YouTrack tabs. Please ensure you are logged into YouTrack.');
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

    // For the new direct method, the token is already extracted
    if (detectedData.accessToken) {
      return {
        token: detectedData.accessToken,
        type: 'youtrack-access-token',
        baseUrl: detectedData.baseUrl,
        serviceId: detectedData.serviceId
      };
    }

    throw new Error('No valid token found in detected data');
  }

  /**
   * Extract user info from detected data
   */
  extractUserInfo(detectedData) {
    if (!detectedData) {
      return null;
    }

    // Try to extract user info from token data
    if (detectedData.tokenData && detectedData.tokenData.user) {
      return detectedData.tokenData.user;
    }

    return null;
  }

  /**
   * Validate a token
   */
  validateToken(token) {
    if (!token || typeof token !== 'string') {
      return false;
    }
    
    // Basic validation - token should be non-empty and reasonably long
    return token.length > 10;
  }

  /**
   * Get detected tokens
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
   * Check if tokens are fresh (within last 5 minutes)
   */
  areTokensFresh(detectedData = this.detectedTokens) {
    if (!detectedData || !detectedData.timestamp) {
      return false;
    }
    
    const fiveMinutes = 5 * 60 * 1000;
    return (Date.now() - detectedData.timestamp) < fiveMinutes;
  }
} 