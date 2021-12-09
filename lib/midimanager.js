class MidiManager{
    constructor(options){
        this.options = Object.assign({
            midiDeviceRef: 'md',
            midiChannelRef: 'ch',
            noNoteOff: true,  //  converts noteOff to noteOn with zero velocity
            midiState: false, //  Set to true to keep a state object up to date.
            rangeMin: 0,  //  Defines value output range minimum for map value
            rangeMax: 1,  //  Defines value output range maximum for map value
            activeSensing: false, //  Some devices send messages every 300ms to let us know it's still there
            minSensingInterval: 1000  //  the spec of 300ms between messages might flood the system. Set to higher to ignore some.
        }, options);
        this._mapFactor7Bit = (this.options.rangeMax - this.options.rangeMin) / 127;
        this._mapFactor14Bit = (this.options.rangeMax - this.options.rangeMin) / 16383;
        this.messagesLost = 0;
        this.lastActiveSensing = 0;
        this.idName = ['key','key','key','ctr'];
        this.messageTypes = [
            'noteOff',
            'noteOn',
            'afterTouch',
            'controlChange',
            'programChange',
            'channelPressure',
            'pitchBend',
            'sysex',
            'tcQuarter',
            'songPos',
            'songSel',
            'undef1',
            'undef2',
            'tuneReq',
            'sysexEnd',
            'timingClock',
            'undef3',
            'StartSeq',
            'contSeq',
            'stopSeq',
            'undef4',
            'activeSensing',
            'reset'
        ];
        if (this.options.midiState){
            this.midi = {};
            this.changed=[];
        }
        this.midiAccess = null;
        this.midiInputs = [];
        this.midiOutputs = [];
        this._listeners = [];
    }

    addEventListener(type, callback){
        if (typeof callback ==='function'){
            if (this._listeners[type] === undefined){
                this._listeners[type] = [];
            }
            this._listeners[type].push(callback);
        }
    }

    removeEventListener(type, callback){
        if (this._listeners[type] !== undefined && this._listeners[type].length > 0){
            let index = this._listeners[type].indexOf(callback);
            this._listeners[type].splice(index, 1);
        }
    }

    dispatchEvent(event){
        let functions = this._listeners[event.type];
        if (functions!== undefined && functions.length > 0){
            functions.forEach(func=>{func(event)});
        }
    }

    init(){
        if ('requestMIDIAccess' in navigator){
            navigator.requestMIDIAccess({"sysex":true}).then(access=>{
                // Get lists of available MIDI controllers
                this.midiAccess = access;
                this.midiAccess.inputs.forEach(midiInput=>{
                    midiInput.onstatechange = event =>{
                        this.handleMidiInputStateChanged(midiInput);
                    }
                    midiInput.open();
                })
                this.midiAccess.outputs.forEach(midiOutput=>{
                    midiOutput.onstatechange = event =>{
                        this.handleMidiOutputStateChanged(midiOutput);
                    }
                    midiOutput.open();
                })             
                
                this.midiAccess.onstatechange = event => {
                    if (event.port.type == 'input'){
                        event.port.onstatechange = event =>{
                            this.handleMidiInputStateChanged(event.port);
                        }
                        event.port.open();
                    }
                    if (event.port.type == 'output'){
                        event.port.onstatechange = event =>{
                            this.handleMidiOutputStateChanged(event.port);
                        }
                        event.port.open();
                    }
                };
            }).catch(error=>{
                console.log(error);
            });
        }
    }

    map7Bit(value){
        if (this._mapFactor7Bit == 1){
            return value;
        } else {
            return ((value +1) * this._mapFactor7Bit) + this.options.rangeMin;
        }
    }

    map14Bit(value){
        if (this._mapFactor14Bit == 1){
            return value;
        } else {
            return ((value +1) * this._mapFactor14Bit) + this.options.rangeMin;
        }
    }

    getCustomIndex(midiDevice){
        let name = [midiDevice.manufacturer,midiDevice.name,midiDevice.type].join('_');
        let customIndexes = localStorage.getItem('rocklib_midiManager_devices');
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
            localStorage.setItem('rocklib_midiManager_devices', JSON.stringify(customIndexes));
        }    
        return index;
    }

    createMidiStateStructure(name){
        this.midi[name] = {omni: false, localControl: false};
        let mapValue7Bit = this.map7Bit(0);
        for (let ch = 0; ch < 16; ch++){
            let chanRef = this.midi[name][this.options.midiChannelRef+ch] = {};
            for (let type = 0; type < 7; type++){
                switch(type){
                    case 0: case 1: case 2: case 3:
                        let mapValue = mapValue7Bit;
                        let typeRef = chanRef[this.messageTypes[type]] = {};
                        for (let id = 0; id < 128; id++){
                            typeRef[this.idName[type] + id] = {val: 0, lastVal: 0, map: mapValue, lastMap: mapValue};
                        }
                    break;
                    case 4: case 5: chanRef[this.messageTypes[type]] = {val: 0, lastVal: 0, map: mapValue7Bit, lastMap: mapValue7Bit}
                    case 6: chanRef[this.messageTypes[type]] = {val: 0, lastVal: 0, map: this.map14Bit(0), lastMap: this.map14Bit(0)}
                }
            }
        }
        return this.midi[name];
    }

    updateMidiStateStructure(midiData){
        if (midiData.type > 6){
            return null;
        }
        var md = this.midi[this.options.midiDeviceRef + midiData.index];
        this.handleChannelMode(md, midiData);
        if (midiData.id === undefined){
            var ref = md[this.options.midiChannelRef + midiData.channel][midiData.typeText];
        } else {
            var ref = md[this.options.midiChannelRef+midiData.channel][midiData.typeText][this.idName[midiData.type] + midiData.id];
        }
        if (ref.val != midiData.value){  //is value changing ?
            ref.lastVal = ref.val;
            ref.val = midiData.value;
            ref.lastMap = ref.map;
            ref.map = midiData.map;
            this.changed.push(ref); //Put the reference in the changed values list
        }
        return ref;
    }

    // spec: https://www.midi.org/specifications-old/item/table-3-control-change-messages-data-bytes-2
    handleChannelMode(md, midiData){
        if (midiData.type == 3 && midiData.id > 119){
            let ch = md[this.options.midiChannelRef+midiData.channel];
            switch (midiData.id){
                case 120: break;//Not handled here but it is passed on in the midi event
                case 121: //Set all controllers to zero
                    for (let i=0; i<127; i++){
                        ch.controlChange[this.idName[midiData.type] + midiData.id] = 0;
                    }
                    break;
                case 122: md.localControl = midiData == 127; break;
                case 124: md.omni = false; break;
                case 125: md.omni = true; break;
                case 126: md.monoMode = true; md.polyMode = false; break;  //Something needs doing with value. not sure what
                case 127: md.monoMode = false; md.polyMode = true; break;
            }
            if (midiData.id > 122){  //All notes off for 123,124,125,126,127
                for (let i=0; i<127; i++){
                    ch.noteOn[this.idName[midiData.type] + midiData.id] = 0;
                }
            }
        }
    }

    handleMidiInputStateChanged(midiInput){
        console.log(midiInput.id + ' - state: ' + midiInput.state + ', connection: ' + midiInput.connection);
        if (midiInput.connection == 'open'){
            if (this.options.midiState){
                midiInput.customIndex = this.getCustomIndex(midiInput);
                this.createMidiStateStructure(this.options.midiDeviceRef + midiInput.customIndex);
            }
            this.midiInputs.push(midiInput);
            midiInput.onmidimessage = event =>{
                this.handleMidiMessage(midiInput, event);
            }
            this.dispatchEvent(new CustomEvent('midiInputStateOpened', {detail:{midiDevice: midiInput}}));
        } else {
            delete this.midiInputs[midiInput];
            this.dispatchEvent(new CustomEvent('midiInputStateClosed', {detail:{midiDevice: midiInput}}));
        }
    }

    handleMidiOutputStateChanged(midiOutput){
        if (midiOutput.connection == 'open'){
            this.midiOutputs.push(midiOutput);
            this.dispatchEvent(new CustomEvent('midiOutputStateOpened', {detail:{midiDevice: midiOutput}}));
        } else {
            this.dispatchEvent(new CustomEvent('midiOutputStateClosed', {detail:{midiDevice: midiOutput}}));
            delete this.midiOutputs[midiOutput];
        }
    }

    handleMidiMessage(midiInput, event){
        if (performance.now() - event.timeStamp > 1000){ //throw messages out if system is flooded and is 1 second behind
            //this.messagesLost++;
            //return;
        }
        if (event.data[0] == 254){
            if (this.options.activeSensing){
                let now = performance.now();
                if ((now - this.lastActiveSensing) > this.options.minSensingInterval){
                    this.lastActiveSensing = now;
                    this.dispatchEvent(new CustomEvent('midiSourceActive', {detail:{midiDevice: midiInput}}));
                }
            }
            return;
        } else {
            let type = (event.data[0] >> 4) - 8; //  the 4 most significant bits o the first byte is the message type
            let midiData = {
                index: midiInput.customIndex,
                timeStamp: event.timeStamp,
                raw: event.data,
                type: type,
                stateRef: null
            }
            
            if (type <7){ //  These types have the 4 least significant bits as channel
                midiData.channel = event.data[0] & 15;
            }

            if (type == 0){ //  noteOff
                if (this.options.noNoteOff){
                    midiData.type = 1;
                    midiData.id = event.data[1];
                    midiData.value = 0;
                    midiData.raw[2] = 0;
                } else {
                    midiData.id = event.data[1];
                    midiData.value = event.data[2];
                }
            }

            if (type == 1){ //  noteOn
                midiData.id = event.data[1];
                midiData.value = event.data[2];
            }

            if (type == 2){ //  afterTouch
                midiData.id = event.data[1];
                midiData.value = event.data[2];
            }

            if (type ==3){ //  We consider a controlChange the same as a Channel Mode Message (id: 120-127)
                midiData.id = event.data[1];
                midiData.value = event.data[2];
            }

            if (type == 4){ //  Program Change. There is only a value
                midiData.value = event.data[1];
            }

            if (type == 5){ //  Channel Pressure (After-touch)
                midiData.value = event.data[1];
            }

            if (type == 6){ //  Pitch Bend Change uses both bytes for a single value 0 - 16383
                midiData.value = (event.data[2]<<7) + event.data[1];
            }

            if (type > 6){
                //  From here on messageType is defined in a more arbitrary way
                if (event.data[0] == 240){ // System Exclusive.
                    midiData.type = 7;
                    midiData.manufacturerId = event.data[1];
                    midiData.data = event.data.slice(1); //  Drop the first status byte pass the rest last byte should be 247
                }

                if (event.data[0] == 241){ // MIDI Time Code Quarter Frame.  
                    midiData.type = 8;
                    midiData.messageType = event.data[1] >> 4; //  First 4 bits is Message Type
                    midiData.value = event.data[1] && 15; //  Last 4 bits is value
                }

                if (event.data[0] == 242){ // Song Position Pointer.
                    midiData.type = 9;
                    midiData.value = (event.data[2]<<7) + event.data[1];
                }

                if (event.data[0] == 243){ // Song Select.
                    midiData.type = 10;
                    midiData.value = event.data[1];
                }

                if (event.data[0] == 244){ // Undefined 1
                    midiData.type = 11;
                    midiData.data = event.data.slice(1); //  Drop the first status byte pass the rest.
                }

                if (event.data[0] == 245){ // Undefined 2
                    midiData.type = 12;
                    midiData.data = event.data.slice(1); //  Drop the first status byte pass the rest.
                }

                if (event.data[0] == 246){ // Tune Request. No data
                    midiData.type = 13;
                }

                if (event.data[0] == 247){ // End of sysex datablock. Should never appear here as the Web MIDI handles it
                    midiData.type = 14;
                }

                // System Real-Time Messages
                if (event.data[0] > 247){
                    midiData.type = event.data[0]-233; // calc to get to type number
                    if (event.data[0] == 249){ // Undefined 3
                        midiData.data = event.data.slice(1); //  Drop the first status byte pass the rest.
                    }

                    if (event.data[0] == 253){ // Undefined 4
                        midiData.data = event.data.slice(1); //  Drop the first status byte pass the rest.
                    }
                }
            }
            midiData.typeText = this.messageTypes[midiData.type];
            if (midiData.type == 6){
                midiData.map = (midiData.value == 16383)? this.options.rangeMax : this.map14Bit(midiData.value);
            } else if (midiData.type < 6){
                midiData.map = this.map7Bit(midiData.value);
            }
            if (this.options.midiState){
                midiData.stateRef = this.updateMidiStateStructure(midiData);
            }
            this.dispatchEvent(new CustomEvent('midiMessage', {detail: {midiInput: midiInput, midiData: midiData}}));
        }
    }
}