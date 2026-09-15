(async () => {
  const { blockedSites = [] } = await chrome.storage.local.get('blockedSites');
  const host = location.hostname.replace(/^www\./, '');
  if (blockedSites.some(site => host.includes(site))) {
    document.documentElement.innerHTML = `
      <body style="margin:0;font-family:system-ui;background:#1e1e2e;color:#fff;
                   display:flex;align-items:center;justify-content:center;
                   height:100vh;text-align:center;">
        <div>
          <h1 style="font-size:64px;margin:0;">🚫</h1>
          <h2>This site is blocked</h2>
          <p style="opacity:0.7;">Stay focused. Get back to work.</p>
        </div>
      </body>`;
    document.documentElement.style.overflow = 'hidden';
    throw new Error('Blocked');
  }
})();