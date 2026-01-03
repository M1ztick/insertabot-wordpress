(function () {
  'use strict';

  var script = document.currentScript;
  var tokenEndpoint = script && script.getAttribute('data-token-endpoint');
  var apiBase = script && script.getAttribute('data-api-base');

  /**
   * Sanitize token to prevent XSS
   */
  function sanitizeToken(token) {
    if (!token || typeof token !== 'string') {
      return null;
    }
    // Only allow alphanumeric, hyphens, underscores (common token format)
    if (!/^[a-zA-Z0-9_-]+$/.test(token)) {
      console.error('[Insertabot] Invalid token format detected');
      return null;
    }
    return token;
  }

  /**
   * Load remote widget script
   */
  function loadRemote(token) {
    try {
      var s = document.createElement('script');
      s.async = true;

      // Safely construct script URL with error handling
      var baseUrl = '';
      if (apiBase && typeof apiBase === 'string') {
        baseUrl = apiBase.replace(/\/$/, '');
      }
      s.src = baseUrl + '/widget.js';

      // Sanitize token before setting attribute
      if (token) {
        var sanitizedToken = sanitizeToken(token);
        if (sanitizedToken) {
          s.setAttribute('data-widget-token', encodeURIComponent(sanitizedToken));
        } else {
          console.warn('[Insertabot] Token validation failed, loading without token');
        }
      }

      // Add error handling for script loading
      s.onerror = function () {
        console.error('[Insertabot] Failed to load widget script from: ' + s.src);
      };

      s.onload = function () {
        console.log('[Insertabot] Widget script loaded successfully');
      };

      document.head.appendChild(s);
    } catch (error) {
      console.error('[Insertabot] Error loading remote widget:', error);
    }
  }

  if (!tokenEndpoint) {
    // No endpoint configured: load remote script without exposing key
    loadRemote();
    return;
  }

  // Create abort controller for fetch timeout (with browser support check)
  var controller = null;
  var timeoutId = null;
  var fetchOptions = { credentials: 'same-origin' };

  // Only use AbortController if supported
  if (typeof AbortController !== 'undefined') {
    try {
      controller = new AbortController();
      fetchOptions.signal = controller.signal;
      timeoutId = setTimeout(function () {
        controller.abort();
        console.warn('[Insertabot] Token request timed out');
        loadRemote(); // Fallback to loading without token
      }, 5000); // 5 second timeout
    } catch (error) {
      console.warn('[Insertabot] AbortController not available:', error);
    }
  }

  fetch(tokenEndpoint, fetchOptions).then(function (res) {
    clearTimeout(timeoutId);
    if (!res.ok) {
      throw new Error('Token request failed with status: ' + res.status);
    }
    return res.json();
  }).then(function (json) {
    if (json && json.token) {
      var sanitizedToken = sanitizeToken(json.token);
      if (sanitizedToken) {
        // Expose token to page script in case remote widget reads it
        window.__INSERTABOT_WIDGET_TOKEN = sanitizedToken;
        loadRemote(sanitizedToken);
      } else {
        console.error('[Insertabot] Token validation failed');
        loadRemote();
      }
    } else {
      console.warn('[Insertabot] No token in response');
      loadRemote();
    }
  }).catch(function (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      console.error('[Insertabot] Token request aborted due to timeout');
    } else {
      console.error('[Insertabot] Token request failed:', error.message);
    }
    loadRemote();
  });
})();
