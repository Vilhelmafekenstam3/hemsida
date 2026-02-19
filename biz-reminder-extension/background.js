// Listen for messages from popup
chrome.runtime.onMessage.addListener((request) => {
  if (request.action === "notify") {
    showNotification('Test Alert', 'BizReminder fungerar! Dina deadlines bevakas.');
  }
  if (request.action === "startAlarm") {
    // Fire alarm every 60 seconds (demo). In production: use 10080 min = 7 days
    chrome.alarms.create('bizReminder', { periodInMinutes: 1 });
    chrome.storage.local.set({ autoRemind: true });
  }
  if (request.action === "stopAlarm") {
    chrome.alarms.clear('bizReminder');
    chrome.storage.local.set({ autoRemind: false });
  }
});

// Alarm fires → show notification
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'bizReminder') {
    showNotification(
      'Deadline-påminnelse!',
      'Du har en skatte- eller bolagsdeadline inom 7 dagar. Öppna BizReminder för detaljer.'
    );
  }
});

function showNotification(title, message) {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icon.png',
    title,
    message,
    priority: 2
  });
}

// Click notification → open IRS
chrome.notifications.onClicked.addListener(() => {
  chrome.tabs.create({ url: 'https://www.irs.gov/payments' });
});

// On install: start alarm if autoRemind was on
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get('autoRemind', (data) => {
    if (data.autoRemind) {
      chrome.alarms.create('bizReminder', { periodInMinutes: 1 });
    }
  });
});
