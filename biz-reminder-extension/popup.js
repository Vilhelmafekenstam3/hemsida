// Send test notification via background script
document.getElementById('notifyBtn').addEventListener('click', () => {
  chrome.runtime.sendMessage({ action: "notify" });
  const msg = document.getElementById('statusMsg');
  msg.textContent = 'Notification triggered!';
  setTimeout(() => { msg.textContent = ''; }, 3000);
});

// Toggle auto-alarm
document.getElementById('autoToggle').addEventListener('change', (e) => {
  if (e.target.checked) {
    chrome.runtime.sendMessage({ action: "startAlarm" });
  } else {
    chrome.runtime.sendMessage({ action: "stopAlarm" });
  }
});

// Load saved toggle state
chrome.storage && chrome.storage.local.get('autoRemind', (data) => {
  if (data.autoRemind !== undefined) {
    document.getElementById('autoToggle').checked = data.autoRemind;
  }
});
