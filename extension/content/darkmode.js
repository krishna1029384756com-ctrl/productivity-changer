(async () => {
  const { darkMode = false } = await chrome.storage.local.get('darkMode');
  const STYLE_ID = '__prod_dark_mode__';

  function apply(on) {
    if (on && !document.getElementById(STYLE_ID)) {
      const style = document.createElement('style');
      style.id = STYLE_ID;
      style.textContent = `
        html, body { background: #121212 !important; color: #e0e0e0 !important; }
        a { color: #8ab4f8 !important; }
        img, video { filter: brightness(0.85); }
      `;
      document.documentElement.appendChild(style);
    } else if (!on) {
      document.getElementById(STYLE_ID)?.remove();
    }
  }

  apply(darkMode);

  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === 'toggleDark') apply(msg.value);
  });
})();