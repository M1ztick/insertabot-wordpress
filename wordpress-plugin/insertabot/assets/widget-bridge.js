(function () {
  'use strict';

  var script = document.currentScript;
  var tokenEndpoint = script && script.getAttribute('data-token-endpoint');
  var apiBase = script && script.getAttribute('data-api-base');

  function loadRemote(token) {
    var s = document.createElement('script');
    s.async = true;
    s.src = (apiBase ? apiBase.replace(/\/$/, '') : '') + '/widget.js';
    if (token) {
      s.setAttribute('data-widget-token', token);
    }
    document.head.appendChild(s);
  }

  if (!tokenEndpoint) {
    // No endpoint configured: load remote script without exposing key
    loadRemote();
    return;
  }

  fetch(tokenEndpoint, { credentials: 'same-origin' }).then(function (res) {
    if (!res.ok) {
      throw new Error('token request failed');
    }
    return res.json();
  }).then(function (json) {
    if (json && json.token) {
      // Expose token to page script in case remote widget reads it
      window.__INSERTABOT_WIDGET_TOKEN = json.token;
      loadRemote(json.token);
    } else {
      loadRemote();
    }
  }).catch(function () {
    loadRemote();
  });
})();
