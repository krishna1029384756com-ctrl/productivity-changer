// Keep service worker alive for notifications & future features
chrome.runtime.onInstalled.addListener(() => {
  console.log('Productivity Changer installed');
});