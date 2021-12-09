
//  Dialog library code
//  version: 1.0
//  https://codepen.io/dinther/pen/QWjrWQo?editors=0011 as unit test


const Dialog = (function (){
    let _options = {
        styleNames: {
            dialog: 'dia_dialog',
            message: 'dia_message',
            input: 'dia_input',
            buttons: 'dia_buttons',
            button: 'dia_button'
        },
        loadBuildInStylesFirst: true,
        cancelOnEmptyInputValue: true,
        rejectOnCancel: false,
        escapeToCancel: false,
        title: '',
        okText: '+OK',
        cancelText: '-Cancel', 
        yesText: '+Yes',
        noText: '-No'
    }
    let _parentElement = document.body;
    let _dialogData = null;

    function _getElement(element){
        if (typeof element === 'string'){
            element = _parentElement.querySelector(element);
            return (element == null)? _parentElement : element;
        } else {
            return (element instanceof Element)? element : _parentElement;
        }
    }

    let _init = function(options){
        options = (typeof options === 'object')? options : {};
        options.styleNames = (typeof options.styleNames === 'object')? options.styleNames : {};
        let oldStyleNames = _options.styleNames;
        let newStyleNames = options.styleNames;
        delete _options.styleNames;
        delete options.styleNames;
        Object.assign(_options, options);
        _options.styleNames = oldStyleNames;
        Object.assign(_options.styleNames, newStyleNames);
        if (_options.loadBuildInStylesFirst == true){
            let selectors = [];
            for(var i = 0; i < document.styleSheets.length; i++) {
                var rules = document.styleSheets[i].rules || document.styleSheets[i].cssRules;
                for(var x in rules) {
                    if(typeof rules[x].selectorText == 'string') selectors.push(rules[x].selectorText);
                }
            }
            let requiredstyles = [
                {
                    name:'dialog',
                    css: 'box-shadow: 0px 2px 15px 2px #0000007a; background-color: #ffffff; border-radius: 5px; user-select: none; overflow: hidden; z-index: 1000; border: none; align-self: center; color: #282a36; padding: 20px; min-width: 200px; max-width: 80%;'
                },
                {
                    name:'message',
                    css: 'text-align: center;'
                },
                {
                    name: 'input',
                    css: 'margin-left:10px;'
                },
                {
                    name:'buttons',
                    css: 'display: flex; justify-content: space-evenly; margin-top: 10px;'
                },
                {
                    name:'button',
                    css: 'flex-grow: 1; margin: 0px 5px; min-width: 60px;'
                }
            ];
            let cssData = '';
            requiredstyles.forEach(style=>{
                let selector = '.' + _options.styleNames[style.name];
                if (selectors.indexOf(selector) == -1){
                    cssData += selector + ' {' + style.css + '} ';
                }
            });
            if (cssData != ''){
                let styleElement = document.createElement('style');
                styleElement.type = 'text/css';
                styleElement.innerHTML = cssData;
                document.getElementsByTagName('head')[0].appendChild(styleElement);
            }
        }        
        _parentElement = _getElement(_options.parent);
        return _options;
    }

    function init(options){
        return _init(options);
    }

    let _showModal = function(focusElement){
        if (_dialogData.dialogElement && typeof _dialogData.dialogElement.showModal === "function") {
            _dialogData.dialogElement.showModal();
            if (focusElement) focusElement.focus();
        }
    }

    let _close = function(){
        if (_dialogData){
            if (_dialogData.dialogElement && typeof _dialogData.dialogElement.close === "function"){
                _dialogData.dialogElement.close();
                _dialogData.dialogElement.remove();
            }
        }
    }

    function close(){
        _close();
    }

    let _runDialog = function (dialogData){
        return new Promise((resolve, reject) => {   
            try{
                if (typeof dialogData === 'object'){
                    _dialogData = dialogData;
                    let focusElement = null;
                    dialogData.parentElement = _getElement(dialogData.parent);
                    dialogData.styleNames = dialogData.styleNames || {};
                    dialogData.dialogElement = document.createElement('dialog');
                    dialogData.dialogElement.classList.add(dialogData.styleNames.dialog || _options.styleNames.dialog);
                    let message = document.createElement((dialogData.type=='message')? 'p' : 'label');
                    message.classList.add(dialogData.styleNames.message || _options.styleNames.message);
                    message.innerHTML = dialogData.text || '';
                    let input = null;
                    let defaultButton = null;
                    let cancelButton = null;
                    dialogData.dialogElement.addEventListener('keydown', event=>{
                        if (dialogData.dialogElement.open && (event.which==27)){ //ESCAPE key
                            if (_options.escapeToCancel || dialogData.escapeToCancel){
                                _close();
                                reject({caption: 'escape', index: -1, value: dialogData.value || ''});
                            }
                            event.preventDefault();
                        }
                    });
                    if (dialogData.type != 'message'){
                        input = document.createElement('input');
                        input.classList.add(dialogData.styleNames.input || _options.styleNames.input);
                        input.type = dialogData.type;
                        input.placeholder = dialogData.placeHolder || '';
                        input.value = dialogData.value || '';
                        input.addEventListener('keydown', event=>{
                            if (event.which==13 && defaultButton){ //Enter key
                                defaultButton.click();
                                event.preventDefault();
                            }
                        });
                        message.appendChild(input);
                    }
                    let buttons = document.createElement('div');
                    buttons.classList.add(dialogData.styleNames.buttons || _options.styleNames.buttons)
                    
                    dialogData.buttons.forEach((caption, index) =>{
                        let button = document.createElement('button'); 
                        button.classList.add(dialogData.styleNames.button || _options.styleNames.button);
                        for (let i=0; i<2; i++){
                            if (caption.length > 0 && ['+','-'].includes(caption[0])){
                                if (!defaultButton && caption[0] === '+') {defaultButton = button;}
                                if (!cancelButton && caption[0] === '-') {cancelButton = button;}
                                caption = caption.slice(1);
                            }               
                        }
                        button.innerText = caption;
                        button.addEventListener('click',()=>{
                            let resolution = {caption: caption, index: index};
                            let cancel = cancelButton == button;
                            if (dialogData.type != 'message'){
                                resolution.value = input.value;
                                if ((dialogData.cancelOnEmptyInputValue || _options.cancelOnEmptyInputValue) && !resolution.value){
                                    cancel = true;
                                }
                            }
                            resolution.index = (cancel)? -1 : resolution.index;
                            if ((dialogData.rejectOnCancel || _options.rejectOnCancel) && cancel){
                                _close();
                                resolution.value = dialogData.value || '';
                                reject(resolution);
                            } else {
                                _close();
                                resolve(resolution);
                            }
                        });    
                        buttons.appendChild(button);
                    })
                    dialogData.dialogElement.appendChild(buttons);
                    dialogData.dialogElement.insertBefore(message, buttons);
                    dialogData.parentElement.appendChild(dialogData.dialogElement);
                    focusElement = (!input ||dialogData.value)? defaultButton : input;
                    if(focusElement) focusElement.tabIndex = 1;
                    if (focusElement == input){
                        if (defaultButton) defaultButton.tabIndex = 2;
                    } else {
                        if(input) input.tabIndex = 2;
                    }
                    _showModal(focusElement);
                } else {
                    throw new TypeError('Argument must be a javascript object not a ' + (typeof dialogData));
                }
            } catch (error) {
                reject(error);
            }
        });
    }

    let _message = function( dialogData){
        dialogData.type = 'message';
        return _runDialog(dialogData);
    }

    function message(dialogData){
        if (!Array.isArray(dialogData.buttons)){
            dialogData.buttons = [dialogData.okText || _options.okText];
        }
        return _message(dialogData);
    }

    function okCancel(dialogData){   
        if (!Array.isArray(dialogData.buttons)){
            dialogData.buttons = [dialogData.okText || _options.okText, dialogData.cancelText || _options.cancelText];
        }
        return _message(dialogData);
    }

    function yesNo(dialogData){
        if (!Array.isArray(dialogData.buttons)){
            dialogData.buttons = [dialogData.yesText || _options.yesText, dialogData.noText || _options.noText];
        }
        return _message(dialogData);
    }
    
    let _entry = function(dialogData){
        dialogData.type = (dialogData.type === undefined)? 'text' : dialogData.type;
        if (!Array.isArray(dialogData.buttons)){
            dialogData.buttons = [dialogData.okText || _options.okText, dialogData.cancelText || _options.cancelText];
        }         
        return _runDialog(dialogData);
    }

    function entry(dialogData){
        return _entry(dialogData);
    }

    if (_options.loadBuildInStylesFirst){
        _init({});
    }

    return {close, entry, init, message, okCancel, yesNo }
}
());
