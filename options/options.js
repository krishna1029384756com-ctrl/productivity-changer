const $ = (id) => document.getElementById(id);

async function render() {
  const { blockedSites = [] } = await chrome.storage.local.get('blockedSites');
  const list = $('siteList');
  list.innerHTML = '';
  blockedSites.forEach((site, i) => {
    const li = document.createElement('li');
    li.innerHTML = `<span>${site}</span><button data-i="${i}">Remove</button>`;
    list.appendChild(li);
  });
}

$('addSite').onclick = async () => {
  const input = $('siteInput');
  const site = input.value.trim().replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
  if (!site) return;
  const { blockedSites = [] } = await chrome.storage.local.get('blockedSites');
  if (!blockedSites.includes(site)) blockedSites.push(site);
  await chrome.storage.local.set({ blockedSites });
  input.value = '';
  render();
};

$('siteList').addEventListener('click', async (e) => {
  if (e.target.dataset.i !== undefined) {
    const { blockedSites = [] } = await chrome.storage.local.get('blockedSites');
    blockedSites.splice(e.target.dataset.i, 1);
    await chrome.storage.local.set({ blockedSites });
    render();
  }
});

render();