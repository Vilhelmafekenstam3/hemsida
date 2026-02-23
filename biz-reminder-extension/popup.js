document.getElementById('notifyBtn').addEventListener('click', () => {
  // Send a message to the background script to trigger a notification
  chrome.runtime.sendMessage({ action: "notify" });
  alert("Notification triggered! Look at your system alerts.");
});
