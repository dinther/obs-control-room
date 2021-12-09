var sw = null;
var refreshing;
var app = 'dominator';
var settings = loadSettings();
var gamepadDevices = new Map();
var midiDevices = new WeakMap();
var gamepadManager = null;
var userOBS = {};
var controllerTypes = ['obs', 'gamepad', 'midi', 'script', 'console', 'unknown'];
var midiManager = null;
var obsManager = null;
var script = null;
var popup = null;

if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
      navigator.serviceWorker.register('./sw.js', {updateViaCache: 'none'}).then(function(registration) {
        if (registration.active){
        sw = registration.active;
            sw.postMessage({ action: 'getversion' });
            registration.addEventListener('updatefound', () => {
                console.log('new update available');
                sw = registration.installing;
                sw.addEventListener('statechange', () => {
                    switch (sw.state) {
                        case 'installed': 
                            if (navigator.serviceWorker.controller) {
                                askCanUpdate();
                            }
                            break;
                    }
                })
            });
        }
        // Registration was successful
        console.log('ServiceWorker registration successful with scope: ', registration.scope);
      }, function(err) {
        // registration failed :(
        console.log('ServiceWorker registration failed: ', err);
      });
    });

    navigator.serviceWorker.addEventListener('controllerchange', function () {
        if (refreshing) return;
        console.log('reloading page');
        window.location.reload();
        refreshing = true;
    });    

    navigator.serviceWorker.addEventListener('message', event => {
        if (event.data.action == 'getversion'){
            document.querySelector('#version').innerText = event.data.payload;
        }
        console.log(event.data);
    });
}

function askCanUpdate(){
    var strconfirm = confirm("Update available. Update now?");
    if (strconfirm == true) {
      updateNow();
    }  
}

function updateNow(){
    sw.postMessage({ action: 'skipWaiting' });
}

IconFactory.addIcons({
    'controller_off': {vb:'0 0 24 24', p:'M 10.5 1 C 9.12 1 8 2.12 8 3.5 L 8 5 L 7.421875 5 L 19 16.576172 L 19 16 L 20.5 16 C 21.88 16 23 14.88 23 13.5 C 23 12.12 21.88 11 20.5 11 L 19 11 L 19 7 C 19 5.9 18.1 5 17 5 L 13 5 L 13 3.5 C 13 2.12 11.88 1 10.5 1 z M 3.1386719 3.1386719 L 1.921875 4.3554688 L 2.9023438 5.3359375 C 2.364878 5.694987 2.0097656 6.3062734 2.0097656 7 L 2.0097656 10.800781 L 3.5 10.800781 C 4.99 10.800781 6.1992186 12.01 6.1992188 13.5 C 6.1992188 14.99 4.99 16.199219 3.5 16.199219 L 2 16.199219 L 2 20 C 2 21.1 2.9 22 4 22 L 7.8007812 22 L 7.8007812 20.5 C 7.8007812 19.01 9.01 17.800781 10.5 17.800781 C 11.99 17.800781 13.199219 19.01 13.199219 20.5 L 13.199219 22 L 17 22 C 17.694641 22 18.307167 21.641137 18.666016 21.099609 L 19.630859 22.064453 L 20.847656 20.847656 L 19 19 L 5 5 L 3.1386719 3.1386719 z '},
    'controller_on': {vb:'0 0 24 24', p:'M20.5 11H19V7c0-1.1-.9-2-2-2h-4V3.5C13 2.12 11.88 1 10.5 1S8 2.12 8 3.5V5H4c-1.1 0-1.99.9-1.99 2v3.8H3.5c1.49 0 2.7 1.21 2.7 2.7s-1.21 2.7-2.7 2.7H2V20c0 1.1.9 2 2 2h3.8v-1.5c0-1.49 1.21-2.7 2.7-2.7 1.49 0 2.7 1.21 2.7 2.7V22H17c1.1 0 2-.9 2-2v-4h1.5c1.38 0 2.5-1.12 2.5-2.5S21.88 11 20.5 11z'},
    'edit': {vb:'0 0 24 24', p:'M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z'},
    'visibility_off': {vb:'0 0 24 24', p:'M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z'},
    'visibility_on': {vb:'0 0 24 24', p:'M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z'},
    'moveup': {vb:'0 0 24 24', p:'M8 11h3v10h2V11h3l-4-4-4 4zM4 3v2h16V3H4z'},
    'movedown': {vb:'0 0 24 24', p:'M16 13h-3V3h-2v10H8l4 4 4-4zM4 19v2h16v-2H4z'},
    'logo': {b64: 'iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACX…zIrIiDMNjtxt+p+7Uf6L+AsmicsyNbiQTAAAAAElFTkSuQmCC'},
    'save': {vb: '0 0 24 24', p: 'm3.5,6v12c0,1 1,2 2,2H18c1,0 2,-1 2,-2V6C20,5 19,4 18,4h-5.5c-1,0 -2,1 -2,2V9.5H8L12,15 16,9.5H13.5V7H17V17H6.5V4h-1c-1,0 -2,1 -2,2z'},
    'load': {vb: '0 0 24 24', p: 'm12,4c-1,0 -2,1 -2,2v5c0,1 1,2 2,2h1V7h4V17H6.5V9.5H9L5,4 1,9.5H3.5V18c0,1 1,2 2,2H18c1,0 2,-1 2,-2V6C20,5 19,4 18,4Z'},
})

var changedVal = null;
var downVal = null;
var upVal = null;

var changed = function(){
    changedVal = null;
    for (let i=0; i< arguments.length; i++){
        let reference = arguments[i];
        if (midiManager.changed.includes(reference)){
            changedVal = reference;
            return reference;
        } else if (gamepadManager.changed.includes(reference)){
            changedVal = reference;
            return reference;
        }
    }
    return null;
}

var valDown = function(){
    downVal = null;
    for (let i=0; i< arguments.length; i++){
        let reference = arguments[i];
        if (changed(reference)){
            if (reference.val < reference.lastVal){
                downVal = reference;
                return reference;
            }
        }
    }
    return null;
}

var valUp = function(){
    upVal = null;
    for (let i=0; i< arguments.length; i++){
        let reference = arguments[i];
        if (changed(reference)){
            if (reference.val > reference.lastVal){
                upVal = reference;
                return reference;
            }
        }
    }
    return null;
}

//Takes axis input value -1 to 1 still outputs -1 to 1 but with a value of 0 in the deadzone
var zone = function(value, deadZone=0.05){
    if (value > 0){
        value = (value < deadZone)? 0 : value-deadZone;
    }
    if (value < 0){
        value = (value > -deadZone)? 0 : value+deadZone;
    }
    return value / (1 - deadZone);
}

function logMap(value){
    return Math.log(1 + (value * 1.72));
}

function clip(value, min, max){
    return Math.max(min, Math.min(max, value));
}

function reMap(value, mapMin, mapMax){
    return mapMin + value * (mapMax - mapMin);
}

function log(data){
    let text = '';
    let type = typeof(data);
    if (type == 'object'){
        if (data instanceof Event){ type = 'event'}
        if (data instanceof CustomEvent){ type = 'customevent'}
    }
    switch (type){
        case 'string': text = data; break;
        case 'number': text = data + ''; break;
        case 'boolean': text = data.toString(); break;
        case 'event' : text = data.type; break;
        case 'customevent' : text = JSON.stringify(data, undefined, '\t'); break;
        case 'object': text = JSON.stringify(data, undefined, '\t'); break;
        default: text = 'type unknown: ' + type;
    }
    if (text != ''){
        let d = document.createElement('div');
        d.classList.add('log'+type);
        d.innerText = text;
        while (consoleUI.contentElement.children.length > 30){
            consoleUI.contentElement.firstElementChild.remove();
        }
        consoleUI.contentElement.appendChild(d);
    } else {
        text = 'error?';
    }
}

function loop(timeStamp){
    if (gamepadManager.update(timeStamp) || midiManager.changed.length > 0){
        if (obsManager.connectionStatus == 7){
            if (typeof script === 'function'){
                try {
                    var arg = [
                        userOBS,
                        gamepadManager.pads,
                        midiManager.midi
                    ];              
                    script(...arg);
                    //script(obs, gm, );
                } catch (error) {
                    let match = midiErrorReg.exec(error.message);
                    if (Array.isArray(match)){
                        let reference = midiManager.options.midiChannelRef + match[0].split(midiManager.options.midiChannelRef)[1];
                        alert('Missing Midi Device\n\n'+
                        'A reference of ' + reference + ' to a midi device is made in your script.\n'+
                        'but no such device was found. Your options are:\n\n'+
                        '  • Plug in the missing midi device\n'+
                        '  • Remove/update the offending references to '+reference+' in your script\n'+
                        '  • Rename available device to match script (midi.'+midiManager.options.midiDeviceRef+'0 -> midi.'+midiManager.options.midiDeviceRef+'1)'
                        );
                    }
                    /*  old Dummy device code. Need to figure out a better way for this. (Part of script?)                        
                        let name = midiManager.options.midiDeviceRef + midiIndex;
                        if (confirm('Script references missing MIDI device: ' + name + '\n Click yes to create a dummy')){
                            midiManager.createMidiStateStructure(name);
                            log('Auto created midi stub for ' + name + ' so the rest of the script keeps working.')
                        } else {
                            console.log(error.message);
                        }
                    }
                    */
                    console.log(error.message);
                }
            }
        }
        changedVal = null;
        downVal = null;
        upVal = null;
        midiManager.changed = [];
        gamepadManager.changed = [];
    }
    window.requestAnimationFrame(timeStamp=>{loop(timeStamp)});
}


var appContainer = document.querySelector('.appcontainer');
appContainer.addEventListener('scroll', event=>{
    popup.close();
})
var controllerContainer = document.querySelector('#controllers');

var controllerMenu = [
    {
        id: 'disable',
        icon: 'controller_off',
        caption: 'Disable',
        action: function(event, menuItem){
            log(popup.popupData.businessObject.id + ' - ' + menuItem.caption);
        }
    },
    {
        id: 'hide',
        icon: 'visibility_off',
        caption: 'Hide this',
        action: function(event, menuItem){
            //do something
            log(popup.popupData.businessObject.id + ' - ' + menuItem.caption);
        }
    },
    {
        id: 'moveup',
        caption: 'Move one up',
        action: function(event, menuItem){
            //do something
            log(popup.popupData.businessObject.id + ' - ' + menuItem.caption);
        }
    },
    {
        id: 'movedown',
        caption: 'Move one down',
        action: function(event, menuItem){
            //do something
            log(popup.popupData.businessObject.id + ' - ' + menuItem.caption);
        }
    },
    {
        caption: '_'
    },
    {
        id: 'editref',
        icon: 'edit',
        caption: 'Edit controller reference',
        action: function(event, menuItem){
            //do something
            log(popup.popupData.businessObject.id + ' - ' + menuItem.caption);
        }
    },   
    {
        id: 'unhideall',
        icon: 'visibility_on',
        caption: 'Un-hide all controllers',
        action: function(event, menuItem){
            //do something
            log(popup.popupData.businessObject.id + ' - ' + menuItem.caption);
        }
    }                       
];

var popup = new PopupMenu({
    parent: appContainer,
    onGetIcon: menuItem=>{
        if (typeof menuItem.icon === 'string'){
            return IconFactory.getIcon(menuItem.icon, menuItem.caption);
        } else if (typeof menuItem.id === 'string'){
            return IconFactory.getIcon(menuItem.id, menuItem.caption);
        }
    }
});

function loadSettings(){
    var settings;
    try {
        settings = JSON.parse(localStorage.getItem(app))
    } catch (error) {
        settings = {};
    }
    if(settings === null){
        settings = {};
    }
    if (settings.controllers === undefined){
        settings.controllers = {};
    }
    if (settings.server === undefined){ settings.server = 'localhost' }; //set default localhost settings
    if (settings.port === undefined){ settings.port = 4444 };
    saveSettings();
    return settings;
}

function saveSettings(){
    if (typeof settings == 'object'){
        localStorage.setItem(app, JSON.stringify(settings));
    }
}

function createController(params){
    params = Object.assign({
        parentElement: controllerContainer,
        index: controllerContainer.children.length,
        type: 'unknown',
        title: '',
        varReference: '',
        menuData: {showCollapseIcon: true, showMenu: true},
        menuItems: [],
    }, params);

    if (params.parentElement.querySelector('#' + params.type + '_' + params.index) != null){
        return null;
    }
    
    if (settings.controllers[params.type + '_' + params.index] === undefined){
        settings.controllers[params.type + '_' + params.index] = {};
    }
    let controllerSettings = settings.controllers[params.type + '_' + params.index];
    if (controllerSettings.collapsed === undefined){
        controllerSettings.collapsed = false;
    }

    var controllerElement = document.createElement("div");
    controllerElement.id = params.type + '_' + params.index;
    controllerElement.classList.add('controller');
    if (controllerSettings.collapsed){
        controllerElement.classList.add('collapse');
    }

    var headerElement = document.createElement("div");
    headerElement.classList.add('header');

    var menuElement = document.createElement("div");
    menuElement.id = params.type + '_menu_' + params.index;
    menuElement.classList.add('menu');
    headerElement.appendChild(menuElement);

    if (params.varReference != ''){
        var referenceElement = document.createElement("div");
        referenceElement.classList.add('reference');
        referenceElement.innerText = params.varReference;
        headerElement.appendChild(referenceElement);
    }

    var titleElement = document.createElement("div");
    titleElement.classList.add('title');
    titleElement.innerText = params.title;
    headerElement.appendChild(titleElement);

    var customElement = document.createElement("div");
    headerElement.appendChild(customElement);
    controllerElement.appendChild(headerElement);

    var contentElement = document.createElement("div");
    contentElement.id = params.type + '_content_' + params.index;
    contentElement.classList.add('content');
    if (controllerSettings.collapsed){
        contentElement.classList.add('collapse');
    }
    controllerElement.appendChild(contentElement);

    if (params.menuData != null){
        if (params.menuData.showCollapseIcon){
            var collapseButton = document.createElement('div');
            collapseButton.id = menuElement.id + '_collapse';
            collapseButton.classList.add('controllericon');
            if (controllerSettings.collapsed){
                collapseButton.classList.add('rotate');
            }
            collapseButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/></svg>';
            collapseButton.addEventListener('click', event=>{
                if (collapseButton.classList.contains('rotate')){
                    collapseButton.classList.remove('rotate');
                    contentElement.classList.remove('collapse');
                    controllerElement.classList.remove('collapse');
                    controllerSettings.collapsed = false;
                } else {
                    collapseButton.classList.add('rotate');
                    contentElement.classList.add('collapse');
                    controllerElement.classList.add('collapse');
                    controllerSettings.collapsed = true;
                }
                editor.resize();
            });
            menuElement.appendChild(collapseButton);
        }
        if (params.menuData.showMenu){
            var menuButton = document.createElement('div');
            //menuButton.id = menuElement.id + '_collapse';
            menuButton.classList.add('controllericon');
            menuButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24"><circle cx="12" cy="7" r="1.3" /><circle cx="12" cy="12" r="1.3" /><circle cx="12" cy="17" r="1.3" /></svg>';
            menuElement.appendChild(menuButton);
            //menu test code
            menuButton.addEventListener('click', event=>{
                if (popup.visible && popup.ownerElement == menuButton){
                    popup.close();
                } else {
                    popup.open({businessObject: controllerElement, menuItems: params.menuItems}, menuButton);
                }
                event.stopPropagation();
            })
        }
        //use menuData here to visualise and populate menu
    }

    //ensure controllers are added in the right order
    let tabIndex = controllerTypes.indexOf(params.type) * 1000; //  Gives room for 1000 controllers per type
    tabIndex += params.index;
    
    for (let i = 0; i < params.parentElement.children.length; i++){
        if (params.parentElement.children[i].tabIndex > tabIndex){
            controllerElement.tabIndex = tabIndex;
            params.parentElement.insertBefore(controllerElement, params.parentElement.children[i]);
            break;
        }

    }
    if (controllerElement.tabIndex == -1){
        params.parentElement.appendChild(controllerElement);
        controllerElement.tabIndex = tabIndex; 
    }

    return {
        controllerElement: controllerElement,
        menuElement: menuElement,
        referenceElement: referenceElement,
        titleElement: titleElement,
        customElement: customElement,
        contentElement: contentElement,
        settings: settings.controllers[params.type + '_' + params.index]
    };
}

function play(){
    if (midiManager.midiOutputs.length > 0){
        midiManager.midiOutputs[0].send([144,72,73]);
        setTimeout(()=>{
            midiManager.midiOutputs[0].send([128,72,0]);
        }, 1000);
    }
}

var obsUI = createController({
    parentElement: controllerContainer,
    index: 0,
    varReference: '',
    type: controllerTypes[0],
    title: 'OBS Control Room',
    menuItems: [],
});

obsUI.titleElement.classList.add('apptitle');

obsUI.status = document.createElement('label');
obsUI.status.id = 'obsserverstatus';
obsUI.status.innerText = 'Not Connected';
obsUI.customElement.appendChild(obsUI.status);

obsUI.logo = document.createElement('div');
obsUI.logo.classList.add('logo');
obsUI.logo.innerHTML = '<img src="./icons/icon_48.png" alt="OBS Control Room app icon">';
obsUI.customElement.appendChild(obsUI.logo);

var serverElement = document.createElement('div');
serverElement.classList.add('obsserver');
serverElement.id = 'obsserver';

let element = document.createElement('label');
element.innerText = 'Server';
serverElement.appendChild(element);

obsUI.serverName = document.createElement('input');
obsUI.serverName.id = 'obsservername';
obsUI.serverName.type = 'text';
obsUI.serverName.placeholder = 'enter IP or host (localhost)';
obsUI.serverName.value = settings.server;
element.appendChild(obsUI.serverName);

element = document.createElement('label');
element.innerText = 'Port';
serverElement.appendChild(element);

obsUI.serverPort = document.createElement('input');
obsUI.serverPort.id = 'obsserverport';
obsUI.serverPort.type = 'text';
obsUI.serverPort.placeholder = 'enter port number. (4444)';
obsUI.serverPort.value = settings.port;
element.appendChild(obsUI.serverPort);

obsUI.connectBtn = document.createElement('button');
obsUI.connectBtn.id = 'obsserverconnectbtn';
obsUI.connectBtn.innerText = 'Connect';
obsUI.connectBtn.addEventListener('click',()=>{
    if (obsManager.connectionStatus < 3){
        settings.server = obsUI.serverName.value;
        settings.port = obsUI.serverPort.value;
        saveSettings();
        //obsUI.serverName.port = obsUI.serverPort.value;
        obsManager.connect(obsUI.serverName.value, obsUI.serverPort.value).catch(error=>{
            console.log(error);
        });
    } else {
        obsManager.disconnect();
    }
})
serverElement.appendChild(obsUI.connectBtn);

obsUI.contentElement.appendChild(serverElement);


var scriptsUI = createController({
    parentElement: controllerContainer,
    index: 1,
    type: controllerTypes[3],
    title: 'Control script',
    menuItems: [
        {
            id: 'save',
            caption: 'Save script',
            action: function(event, menuItem){
                //do something
                log(popup.popupData.businessObject.id + ' - ' + menuItem.caption);
            }
        },
        {
            id: 'saveas',
            caption: 'Save As',
            action: function(event, menuItem){
                //do something
                Pop.entry('Enter script name').then(name=>{
                    if (name != ''){
                        if (!saveScript(name, false)){
                            Pop.yesNo(name + ' already exists. Overwrite?').then(answer=>{
                                if (answer == 0){
                                    saveScript(name, true);
                                }
                            })
                        };
                    }
                })
                log(popup.popupData.businessObject.id + ' - ' + menuItem.caption);
            }
        },  
        {
            id: 'load',
            caption: 'Load script',
            action: function(event, menuItem){
                //do something
                log(popup.popupData.businessObject.id + ' - ' + menuItem.caption);
            }
        },        
        {
            caption: '_'
        },
    ].concat(controllerMenu)
});
scriptsUI.controllerElement.classList.add('script');

scriptsUI.cancelButton = document.createElement('button');
scriptsUI.cancelButton.innerText = 'Cancel';
scriptsUI.cancelButton.classList.add('custombutton');
scriptsUI.cancelButton.addEventListener('click', ()=>{
    if (typeof setting.script === 'string'){
        editor.setValue(setting.script);
    }
});
scriptsUI.customElement.appendChild(scriptsUI.cancelButton);

scriptsUI.saveButton = document.createElement('button');
scriptsUI.saveButton.innerText = 'Save';
scriptsUI.saveButton.classList.add('custombutton');
scriptsUI.saveButton.addEventListener('click', ()=>{
    saveScript(obsManager.currentProfileName, true);
});
scriptsUI.customElement.appendChild(scriptsUI.saveButton);

element = document.createElement('label');
element.innerText = 'Listen for input';

scriptsUI.listenElement = document.createElement('input');
scriptsUI.listenElement.classList.add('listen');
scriptsUI.listenElement.type = 'checkbox';
scriptsUI.listenElement.checked = false;
element.appendChild(scriptsUI.listenElement);
scriptsUI.customElement.appendChild(element);

var editor = ace.edit(scriptsUI.contentElement);
editor.setTheme("ace/theme/darkplus");
editor.session.setMode("ace/mode/javascript");

editor.commands.addCommand({
    name: 'saveFile',
    bindKey: { win: 'Ctrl-S', max: 'Command-S', sender: 'editor|cli' },
    exec: function(env, args, request){
        //console.log(env, args, request);
        saveScript(obsManager.currentProfileName, true);
    }
});

editor.setFontSize(14);

function loadScript(name){
    var s = localStorage.getItem(app+'_' + name);
    if (s == null){
        let m = midiManager.options.midiDeviceRef;
        s =  "//  scene switcher\r\nif (valDown(midi."+m+"0.ch0.noteOn.key54) || valDown(pads.gp0.b6)){\r\n    obs.setScene('Mix Scene');\r\n}\r\nif (valDown(midi."+m+"0.ch0.noteOn.key55) || valDown(pads.gp0.b7)){\r\n    obs.setScene('Web Cam Scene');\r\n}\r\nif (valDown(midi."+m+"0.ch0.noteOn.key56) || valDown(pads.gp0.b8)){\r\n    obs.setScene('Silly Clip Scene');\r\n}\r\nif (valDown(midi."+m+"0.ch0.noteOn.key57) || valDown(pads.gp0.b9)){\r\n    obs.setScene('Photo Scene');\r\n}\r\n\r\n//  source slider\r\nlet val = changed(midi."+m+"0.ch0.pitchBend, pads.gp0.a3, pads.gp0.b0);\r\nif (val){\r\n    expand('Web cam', val.map, 5, 0, 0, 1280);\r\n}\r\n\r\nif (val = changed(midi."+m+"0.ch1.pitchBend, pads.gp0.a5, pads.gp0.b1)){\r\n    expand('Silly Clip', val.map, 6, 1280, 0, 1920);\r\n}\r\n\r\nif (changed(midi."+m+"0.ch2.pitchBend, pads.gp0.b2)){\r\n    expand('Lockdown', changedVal.map, 10, 1280, 720, 4032);\r\n}\r\n\r\nif (changed(midi."+m+"0.ch5.pitchBend)){\r\n    obs.setVolume(midi."+m+"0.ch5.pitchBend.map, 'Silly Clip Scene');\r\n}\r\n\r\n//  You can extend the system by building your own effect functions\r\nfunction expand(sourceName, value, alignment, xpos, ypos, baseWidth){\r\n    obs.moveToTop(sourceName, 'Mix Scene');\r\n    value = ((value / 2) + 0.5) * obs.videoInfo.baseWidth/baseWidth;\r\n    obs.send('SetSceneItemProperties', {\r\n        item: sourceName,\r\n        rotation: 0,\r\n        scale: {\r\n            x: value,\r\n            y: value\r\n        },\r\n        position: {\r\n            x: xpos,\r\n            y: ypos,\r\n            alignment: alignment\r\n        },\r\n        bounds: {\r\n            type: 'OBS_BOUNDS_NONE',\r\n        }\r\n    });\r\n}";
    }
    editor.setValue(s);
    script = makeScript(s);
}

function saveScript(name, overWrite=false){
    let itemName = app+'_' + name;
    if (localStorage.getItem(itemName) != null && overWrite == false){
        return false;
    }
    var s = editor.getValue();
    if (s == ''){
        localStorage.removeItem(itemName);
    } else {
        localStorage.setItem(itemName, s);
    }
    script = makeScript(s);
    return true;
}

function makeScript(scriptText){
    return new Function(
        'var obs = arguments[0];\n'+
        'var pads = arguments[1];\n'+
        'var midi = arguments[2];\n'+
        scriptText );
}

var consoleUI = createController({
    parentElement: controllerContainer,
    index: 2,
    type: controllerTypes[4],
    title: 'Console',
    menuItems: [
        {
            id: 'clear',
            caption: 'Clear console',
            action: function(event, menuItem){
                consoleUI.contentElement.innerHTML = '';
            }
        },        
        {
            caption: '_'
        },
    ].concat(controllerMenu)
});
consoleUI.controllerElement.classList.add('console');
consoleUI.contentElement.classList.add('console');

function log(data){
    let text = '';
    let type = typeof(data);
    if (type == 'object'){
        if (data instanceof Event){ type = 'event'}
        if (data instanceof CustomEvent){ type = 'customevent'}
    }
    switch (type){
        case 'string': text = data; break;
        case 'number': text = data + ''; break;
        case 'boolean': text = data.toString(); break;
        case 'event' : text = data.type; break;
        case 'customevent' : text = JSON.stringify(data, undefined, '\t'); break;
        case 'object': text = JSON.stringify(data, undefined, '\t'); break;
        default: text = 'type unknown: ' + type;
    }
    if (text != ''){
        let d = document.createElement('div');
        d.classList.add('log'+type);
        d.innerText = text;
        while (consoleUI.contentElement.children.length > 30){
            consoleUI.contentElement.firstElementChild.remove();
        }
        consoleUI.contentElement.appendChild(d);
        //d.scrollIntoView();
    } else {
        text = 'error?';
    }
}

consoleUI.controllerElement.addEventListener('contextmenu', event=>{
    popup.open({rect:{left: event.pageX, top: event.pageY}});
    event.preventDefault();  
})

gamepadManager = new GamepadManager({
    enabled: true,
    scanning: false,
    rangeMin: 0,
    rangeMax: 1
});
gamepadManager.onGamepadConnected = function(gamepad){
    var gamepadUI = createController({
        parentElement: controllerContainer,
        index: gamepad.customIndex,
        type: controllerTypes[1],
        title: gamepad.id,
        varReference: 'Ref: [ gp'+gamepad.customIndex + ' ]'
    });
    if (gamepadUI === null){
        return;
    }
    gamepadUI.contentElement.classList.add('gamepad');
    var buttonsElement = document.createElement("div");
    buttonsElement.className = "buttons";
    for (var i=0; i<gamepad.buttons.length; i++) {
        var buttonElement = document.createElement("div");
        buttonElement.className = "button";
        //buttonElement.id = "b" + i;
        buttonElement.innerHTML = '<label>[ b'+i+' ]</label><span class="buttonvalue">0.00</span>';
        buttonsElement.appendChild(buttonElement);
    }
    gamepadUI.contentElement.appendChild(buttonsElement);
    var axesElement = document.createElement("div");
    axesElement.className = "axes";
    for (i=0; i<gamepad.axes.length; i++) {
        var axisElement = document.createElement("div");
        axisElement.className = "axis";
        var l = document.createElement("span");
        l.innerText = '[ a' + i + ' ]: 0';
        l.className = "axisvalue";
        axisElement.appendChild(l);
        let e = document.createElement("progress");
        //e.id = "a" + i;
        e.setAttribute("max", "2");
        e.setAttribute("value", "1");
        e.innerHTML = i;
        axisElement.appendChild(e);
        axesElement.appendChild(axisElement);
    }
    gamepadUI.contentElement.appendChild(axesElement);
    gamepadUI = Object.assign({
        buttonsElement: buttonsElement,
        axesElement: axesElement
    }, gamepadUI);
    gamepadDevices.set(gamepad.customIndex, gamepadUI);   
};

gamepadManager.onGamepadDisconnected = function(gamepad){
    document.querySelector('#gamepad_' + gamepad.customIndex).remove();
};

gamepadManager.onGamepadValueChanged = function(data){
    let varName = 'pads.gp'
    let gamepadUI = gamepadDevices.get(data.gamepad.customIndex);
    varName += data.gamepad.customIndex;
    if (data.type == 'button'){
        varName += '.b' + data.itemIndex;
        let buttonElement = gamepadUI.buttonsElement.children[data.itemIndex];
        buttonElement.children[1].innerText = data.ref.val.toFixed(2);
        buttonElement.style.opacity = (0.3 + (data.ref.val * 0.7));
        if (data.ref.val > data.ref.lastVal){
            buttonElement.classList.add('on');
        } else {
            buttonElement.classList.remove('on');
        }  
    }

    if (data.type == 'axis'){
        varName += '.a' + data.itemIndex;
        let axisElement = gamepadUI.axesElement.children[data.itemIndex];
        axisElement.children[0].innerHTML = "[ a" + data.itemIndex + " ]: " + data.ref.val.toFixed(4) + '  (' + data.ref.map.toFixed(4) + ')';
        axisElement.children[1].innerHTML = "A" + data.itemIndex + ": " + data.ref.val.toFixed(4);
        axisElement.children[1].setAttribute("value", data.ref.val + 1);
        axisElement.classList.add('on');
        setTimeout(()=>{axisElement.classList.remove('on');}, 2000)
    }
    if (scriptsUI.listenElement.checked){
        editor.insert(varName);
        scriptsUI.listenElement.checked = false;
        editor.focus();
    }
};

//Create and setup the MidiManager
midiManager = new MidiManager({
    midiState: true,
    normalize: true,
    rangeMin: 0,
    rangeMax: 1
});

const midiErrorReg = new RegExp('[ \'\"\.]' + midiManager.options.midiChannelRef + '[0123456789][0123456789]?');

midiManager.addEventListener('midiInputStateOpened', event =>{
    var md = event.detail.midiDevice;
    var title = [md.name, md.manufacturer].filter(Boolean).join(' - ');
    var midiUI = createController({
        parentElement: controllerContainer,
        index: md.customIndex,
        type: controllerTypes[2],
        title: title,
        varReference: 'Ref: [ '+midiManager.options.midiDeviceRef+ md.customIndex + ' ]'
    });

    midiUI.contentElement.classList.add('midi');
    var kb = document.createElement('ul');
    kb.classList.add('keys');
    let octaveIndex = 0;
    for (var j=0; j<24; j++){
        var k = document.createElement('li');
        k.setAttribute('id', 'key'+ j);
        switch (octaveIndex){
            case 0: k.classList.add('white', 'c'); break;
            case 1: k.classList.add('black', 'cs'); break;
            case 2: k.classList.add('white', 'd'); break;
            case 3: k.classList.add('black', 'ds'); break;
            case 4: k.classList.add('white', 'e'); break;
            case 5: k.classList.add('white', 'f'); break;
            case 6: k.classList.add('black', 'fs'); break;
            case 7: k.classList.add('white', 'g'); break;
            case 8: k.classList.add('black', 'gs'); break;
            case 9: k.classList.add('white', 'a'); break;
            case 10: k.classList.add('black', 'as'); break;
            case 11: k.classList.add('white', 'b'); break;
        }
        octaveIndex++;
        if (octaveIndex > 11) { octaveIndex = 0;}
        kb.appendChild(k);
    }
    midiUI.contentElement.appendChild(kb);

    var messages = document.createElement('div');
    messages.id = 'midimessages_' + md.customIndex;
    messages.classList.add('messages');   
    midiUI.contentElement.appendChild(messages);

    midiUI = Object.assign({
        keyboardElement: kb,
        messagesElement: messages
    }, midiUI);
    midiDevices.set(md, midiUI);
});

midiManager.addEventListener('midiInputStateClosed', event =>{
    controllerContainer.querySelector('#midi_' + event.detail.midiDevice.customIndex).remove();
});

midiManager.addEventListener('midiMessage', event=>{
    var midiData = event.detail.midiData;
    var midiUI =  midiDevices.get(event.detail.midiInput);
    if (midiUI.messagesElement.children.length > 60){
        for (let i=0; i<5; i++){
            midiUI.messagesElement.children[midiUI.messagesElement.children.length - 1].remove();
        }
    }    
    
    if (midiData.type < 7){
        var documentFragment = document.createDocumentFragment();        
        var element = document.createElement('span');
        element.innerText = midiData.channel;
        documentFragment.appendChild(element);

        element = document.createElement('span');
        element.classList.add('str');
        element.innerText = midiData.typeText;
        element.midiData = midiData;
        element.addEventListener('click', ()=>{
            if (scriptsUI.listenElement.checked){
                let varName = 'midi.' + midiManager.options.midiDeviceRef + event.target.midiData.customIndex + '.ch' + event.target.midiData.channel + '.' + event.target.midiData.typeText;
                if (event.target.midiData.id !== undefined){
                    varName += '.' + midiManager.idName[event.target.midiData.type] + event.target.midiData.id;
                }
                editor.insert(varName);
                scriptsUI.listenElement.checked = false;
                editor.focus();
            }
        });
        documentFragment.appendChild(element);

        element = document.createElement('span');
        element.innerText = (midiData.id) ? midiData.id : '';
        documentFragment.appendChild(element);    

        element = document.createElement('span');
        element.innerText = midiData.value;
        documentFragment.appendChild(element);

        element = document.createElement('span');
        element.innerText = '['+midiData.raw.join(', ')+']';
        documentFragment.appendChild(element);
        if (midiUI.messagesElement.children.length > 0){
            midiUI.messagesElement.insertBefore(documentFragment, midiUI.messagesElement.children[0] );
        } else {
            midiUI.messagesElement.appendChild(documentFragment);
        }
    }
    
    if (event.detail.type < 2){ //  noteOn or noteOff
        let keyIndex = event.detail.id-24; //  24 is the lowest C note played on a keyboard
        if (keyIndex > -1){ //  render if it is a keyboard note
            while (keyIndex > midiUI.keyboardElement.children.length-1){
                keyIndex -= midiUI.keyboardElement.children.length;
            }
            let keyElement = midiUI.keyboardElement.children[keyIndex];
            if (event.detail.value == 0){
                keyElement.classList.remove('down');
            } else {
                keyElement.classList.add('down');
            }
        }
    }
    if (scriptsUI.listenElement.checked){
        let varName = 'midi.'+ midiManager.options.midiDeviceRef + event.detail.midiInput.customIndex + '.ch' + midiData.channel + '.' + midiData.typeText + '.' + midiManager.idName[midiData.type] + midiData.id;
        editor.insert(varName);
        scriptsUI.listenElement.checked = false;
        editor.focus();
    }
});

midiManager.init();

obsManager = new OBSManager({
    heartBeat: true,
    reconnect: true
});

obsManager.addEventListener('Connection', event=>{
    editor.resize();
    obsUI.status.innerText = event.detail.message;
    switch (event.detail.status){
        case 'unconnected':
            obsUI.status.innerText = 'Click connect';
            obsUI.status.style.color = '';
            obsUI.connectBtn.innerText = 'Connect';
            obsUI.serverName.disabled = false;
            obsUI.serverPort.disabled = false;
        case 'disconnected':
            obsUI.status.style.color = '';
            obsUI.connectBtn.innerText = 'Connect';
            obsUI.serverName.disabled = false;
            obsUI.serverPort.disabled = false;
            break; 
        case 'failed':
            obsUI.status.style.color = '#ff0000';
            obsUI.connectBtn.innerText = 'Connect';
            obsUI.serverName.disabled = false;
            obsUI.serverPort.disabled = false;
            break;
        case 'pendingretry':
            obsUI.status.style.color = '#ff5722';
            obsUI.connectBtn.innerText = 'Cancel';
        case 'connecting':
            obsUI.status.style.color = '#ff5722';
            obsUI.connectBtn.innerText = 'Cancel';
            break;
        case 'lost':
            obsUI.status.style.color = '#ff0000';
            obsUI.connectBtn.innerText = 'Cancel';
            break;
        case 'connected':
            obsUI.status.style.color = '##00b907';
            obsUI.connectBtn.innerText = 'Disconnect';
            obsUI.serverName.disabled = true;
            obsUI.serverPort.disabled = true;
            break;            
        case 'ready':
            obsUI.status.style.color = '#00ff00';
            obsUI.connectBtn.innerText = 'Disconnect';
            userOBS.videoInfo = obsManager.videoInfo;
            userOBS.sceneList = obsManager.sceneList;
            userOBS.currentScene = obsManager.currentScene;
            loadScript(obsManager.currentProfileName);
            editor.focus();
            break;         
    }
});

obsManager.addEventListener('ProfileChanged', data=>{
    loadScript(data.detail.currentProfileName);
    console.log('ProfileChanged: New script ' + data.detail.currentProfileName + ' loaded');
});

obsManager.addEventListener('SwitchScenes', data=>{
    userOBS.currentScene = data.detail;
    console.log('SwitchScenes', data.detail);
});

obsManager.addEventListener('ScenesChanged', data=>{
    userOBS.sceneList = data.detail;
    console.log('ScenesChanged', data.detail);
});

obsManager.addEventListener('error', error=>{
    console.log(error);
});

obsManager.addEventListener('Heartbeat', data=>{
    //console.log(data);
});

userOBS.send = (command, params)=>{obsManager.send(command, params)};
userOBS.setScene = (name)=>{obsManager.setScene(name);};
userOBS.setVolume = (value, sourceName)=>{obsManager.setVolume(value, sourceName);};
userOBS.setMute = (mute, sourceName)=>{obsManager.setMute(mute, sourceName);};
userOBS.toggleMute = (sourceName)=>{obsManager.toggleMute(sourceName);};
userOBS.moveToTop = (sourceName, sceneName)=>{obsManager.moveToTop(sourceName, sceneName);};
userOBS.expand = (sourceName, value, alignment, xpos, ypos, baseWidth, moveToTop)=>{obsManager.expand(sourceName, value, alignment, xpos, ypos, baseWidth, moveToTop);};

window.addEventListener("beforeunload", event =>{
    saveSettings();
});

obsManager.connect(settings.server, settings.port, true);

//start scanning
loop(performance.now());