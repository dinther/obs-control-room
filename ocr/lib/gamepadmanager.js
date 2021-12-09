class GamepadManager{
    constructor(options){
        this.gamepads = [];
        this.changedGamepads = [];
        this.customIndexes = [];
        this.changed = [];
        this.options = Object.assign({
            rangeMin: -1,  //  Defines value output range minimum
            rangeMax: 1,  //  Defines value output range maximum
            scanning: true,
            axisTreshold: 0.004
        }, options);
        this._mapFactorAxis = (this.options.rangeMax - this.options.rangeMin) / 2;
        this._mapFactorButton = this.options.rangeMax - this.options.rangeMin;
        this.pads = {};
        this.onGamepadConnected = null;
        this.onGamepadDisconnected = null;
        this.onGamepadValueChanged = null;
        this.onGamepadChanged = null;
        if ('GamepadEvent' in window) {
            window.addEventListener('gamepadconnected', event=>{this.connecthandler(event.gamepad);});
            window.addEventListener('gamepaddisconnected', event=>{this.disconnecthandler(event.gamepad);});
        }
        this.update(performance.now());
    }

    connecthandler(gamepad) {
        this.createGamepadStateStructure(gamepad);
        if (typeof this.onGamepadConnected === 'function'){
            this.onGamepadConnected(gamepad);
        }
        this.scanGamepads(performance.now());
    }

    disconnecthandler(gamepad) {
        if (typeof this.onGamepadDisconnected === 'function'){
            this.onGamepadDisconnected(gamepad);
        }
    }

    update(timeStamp){
        var result = this.scanGamepads();
        if (this.options.scanning){
            window.requestAnimationFrame(timeStamp=>{this.update(timeStamp)});
        }
        return result;
    }

    createGamepadStateStructure(gamepad){
        this.customIndexes[gamepad.index] = this.getCustomIndex(gamepad);
        gamepad.customIndex = this.customIndexes[gamepad.index];
        //create gamepad data structure
        let name = 'gp' + gamepad.customIndex; 
        this.pads[name] = {};
        for (let i=0; i<gamepad.buttons.length; i++){
            this.pads[name]['b'+i] = {val: 0, lastVal: 0, map:0, lastMap: 0};
        }
        for (let i=0; i<gamepad.axes.length; i++){
            this.pads[name]['a'+i] = {val: 0, lastVal: 0, map:0, lastMap: 0};
        }
        return this.pads[name];
    }

    updateGamepadStateStructure(gamepad){
        var changed = false;
        if (gamepad != null){
            gamepad.customIndex = this.customIndexes[gamepad.index]; //every time because gamepad object is new every scan        
            var ref; 
            let name = 'gp' + gamepad.customIndex;
            if (this.pads[name] === undefined){  //  Deals with the case no connect events happen like on page refresh
                //this.createGamepadStateStructure(gamepad);
                this.connecthandler(gamepad);
                name = 'gp' + gamepad.customIndex;
            } 
            for (let i=0; i<gamepad.buttons.length; i++){
                ref = this.pads[name]['b'+i]
                if (ref.val != gamepad.buttons[i].value){
                    if (Math.abs(gamepad.buttons[i].value - ref.val) > this.options.axisTreshold){ //  ignore jitters
                        ref.lastVal = ref.val;
                        ref.lastMap = ref.map;
                        ref.val = gamepad.buttons[i].value;
                        ref.map = this.mapButtonValue(ref.val);
                        this.changed.push(ref);
                        this.handleValueChange({gamepad: gamepad, type:'button', itemIndex: i, ref: ref});
                        changed = true;
                    }
                }
            }
            for (let i=0; i<gamepad.axes.length; i++){
                ref = this.pads[name]['a'+i];
                if (ref.val != gamepad.axes[i]){
                    if (Math.abs(gamepad.axes[i] - ref.val) > this.options.axisTreshold){ //  ignore jitters
                        ref.lastVal = ref.val;
                        ref.lastMap = ref.map;
                        ref.val = gamepad.axes[i];
                        ref.map = this.mapAxisValue(ref.val);
                        this.changed.push(ref);
                        this.handleValueChange({gamepad: gamepad, type:'axis', itemIndex: i, ref: ref});
                        changed = true;
                    }
                }            
            }
        }
        return changed;
    }

    mapAxisValue(value){
        if (this._mapFactorAxis == 1){
            return value;
        } else {
            return ((value +1) * this._mapFactorAxis) + this.options.rangeMin;
        }
    }

    mapButtonValue(value){
        if (this._mapFactorButton == 1){
            return value;
        } else {
            return ((value +1) * this._mapFactorButton) + this.options.rangeMin;
        }
    }

    getCustomIndex(gamepad){
        let name = [gamepad.id, gamepad.index ,'b'+ gamepad.buttons.length, 'a'+ gamepad.axes.length].join('_');
        let customIndexes = localStorage.getItem('rocklib_gamepadManager_devices');
        if (customIndexes != null){
            try {
                customIndexes = JSON.parse(customIndexes);
            } catch (error) {
                customIndexes = {};
            }
        } else {
            customIndexes = {};
        }
        let index = customIndexes[name];
        if (index === undefined){
            index = 0;
            var values = Object.values(customIndexes);
            while (values.includes(index)){
                index++;
            }
            customIndexes[name] = index;
            localStorage.setItem('rocklib_gamepadManager_devices', JSON.stringify(customIndexes));
        }    
        return index;
    }

    handleValueChange(data){
        if (typeof this.onGamepadValueChanged === 'function'){
            this.onGamepadValueChanged(data);
        }      
    }

    scanGamepads(){
        if (this.options.enabled == false){
            return false;
        }
        this.gamepads = navigator.getGamepads ? navigator.getGamepads() : (navigator.webkitGetGamepads ? navigator.webkitGetGamepads() : []);
        this.changedGamepads = [];
        for (var i = 0; i < this.gamepads.length; i++){
            if (this.updateGamepadStateStructure(this.gamepads[i])){
                this.gamepadChanged(this.gamepads[i]);
            };
        }
        return this.changedGamepads.length > 0;
    }

    gamepadChanged(gamepad){
        this.changedGamepads.push(gamepad);
        if (typeof this.onGamepadChanged === 'function'){
            this.onGamepadChanged(gamepad);
        }
    }


}