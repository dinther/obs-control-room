if (window.chrome.webview !== undefined){
    function sendHotKey(application, hotkey){
        window.chrome.webview.postMessage({command:'sendHotkey', application: 'application', hotkey: hotkey});
    }
    window.chrome.webview
}