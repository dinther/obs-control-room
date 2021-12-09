var p = [];
p.push(import('./lib/midiManager.js'));
p.push(import('./lib/gamepadManager.js'));
p.push(import('./lib/ace.js'));
p.push(import('./lib/ext-keybinding_menu.js'));
p.push(import('./lib/mode-javascript.js'));
p.push(import('./lib/theme-darkplus.js'));
p.push(import('./lib/worker-javascript.js'));
p.push(import('./lib/obsmanager.js'));
p.push(import('./lib/obs-websocket.min.js'));
Promise.all(p).then(()=>{
    
})