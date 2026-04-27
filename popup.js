const btn = document.getElementById('toggle-btn');
const statusText = document.getElementById('status-text');

chrome.storage.local.get({ toolEnabled: true }, (result) => {
    updateUI(result.toolEnabled);
});

btn.addEventListener('click', () => {
    chrome.storage.local.get({ toolEnabled: true }, (result) => {
        const newState = !result.toolEnabled;
        chrome.storage.local.set({ toolEnabled: newState }, () => {
            updateUI(newState);
            chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
                chrome.tabs.reload(tabs[0].id);
            });
        });
    });
});

function updateUI(isEnabled) {
    btn.innerText = isEnabled ? "ツール: ON" : "ツール: OFF";
    btn.className = isEnabled ? "on" : "off";
    statusText.innerText = isEnabled ? "現在は有効です" : "現在は無効です";
}