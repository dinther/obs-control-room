/*
The alignment codes of obs_websocket.
    5___________4___________6       5: Top Left, 4: Top Center, 4: Top Center
    |                       |
    |                       |
    1           0           2       1: Center Left, 1: Center Center, 2: Center Right
    |                       |
    |                       |
    9___________8___________10      9: Bottom Left, 8: Bottom Center, 10: Bottom Right
*/

class OBSManager {
    constructor(options){
        this.server = new OBSWebSocket();
        this.options = Object.assign({
            server: 'localhost',
            port: 4444,
            heartBeat: true,
            reconnect: true,
            password: 'test'
        }, options);
        if (!Array.isArray(this.options.connectionStateMessages)){
            this.options.connectionStateMessages = [];
        }
        this.options.connectionStateMessages = this.options.connectionStateMessages.slice(0, 7);
        let connectionStateMessages = [
            'Not connected', //Default state
            'Disconnected', //User disconnected
            'Connect failed', //Connection attempt failed
            'Pending retry', //Waiting 4 sec for connection retry
            'Connecting...', //Connecting in progress
            'Connection lost', //Lost connection (Only when heartbeat is true)
            'Connected', //Connected with OBS websocket server
            'Ready' //Connected and loaded scene information. Ready to run scripts
        ]
        for (var i=this.options.connectionStateMessages.length; i<8; i++){
            this.options.connectionStateMessages.push(connectionStateMessages[i]);
        }
        
        this.heartBeat = null;
        this.heartBeatTimer = null;
        this.retryConnectTimer = null;
        this.videoInfo = null;
        this.currentProfileName = '';
        this.sceneList = null;
        this.currentScene = null;
        this.connectionStates = [
            'unconnected',
            'disconnected',
            'failed',
            'pendingretry',
            'connecting',
            'lost',
            'connected',
            'ready'
        ];
        this.connection = 'unconnected';
        this.connectionStatus = 0;
        this.connectionMessage = this.options.connectionStateMessages[this.connectionStatus];
        this.onReady = null;
        this.server.on('Heartbeat', data => {
            this.heartBeat = data;
            if (this.options.heartBeat){
                clearTimeout(this.heartBeatTimer);
                this.heartBeatTimer = setTimeout(()=>{
                    this.handleConnection(5); //lost
                }, 4000);
            }
            this.dispatchEvent(new CustomEvent('Heartbeat', {detail:data}));
        }); 
        this.server.on('SwitchScenes', data => {
            this.currentScene = data;
            //https://github.com/Palakis/obs-websocket/issues/488
            //Workaround code make sure scene name is always called name
            if (this.currentScene.name === undefined && typeof this.currentScene.sceneName == 'string'){
                this.currentScene.name = this.currentScene.sceneName;
                delete(this.currentScene.sceneName);
            }
            this.dispatchEvent(new CustomEvent('SwitchScenes', {detail:data}));
        });
        this.server.on('ProfileChanged', data => {
            this.server.send('GetCurrentProfile').then(data=>{
                this.currentProfileName = data.profileName;
                this.dispatchEvent(new CustomEvent('ProfileChanged', {detail:data}));
            });
        });        
        this.server.on('ScenesChanged', data => {
            this.updateSceneList();
        });    
        this.server.on('error', error => {
            this.handleError(error);
        });
        this._listeners = [];
        this.handleConnection(0); //unconnected
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
    
    updateSceneList(){
        return this.server.send('GetSceneList').then(data =>{
            this.sceneList = data;
            this.dispatchEvent(new CustomEvent('ScenesChanged', {detail:data}));
        });
    }

    connect(server, port, autoConnect=false){
        if (server !== undefined){
            this.options.server = server;
        }
        if (port !== undefined){
            this.options.port = port;
        }
        var address = this.options.server + ':' + this.options.port;
        console.log('attempt connect to '+ address);
        this.handleConnection(4); //connecting
        return this.server.connect({address: address, password: this.options.password}).then(data=>{
            this.handleConnection(6); //connected
            clearTimeout(this.retryConnectTimer);
            var getVideoInfo = this.server.send('GetVideoInfo').then(data =>{
                this.videoInfo = data;
            });
            var getSceneList = this.server.send('GetSceneList').then(data=>{
                this.sceneList = data;
            });
            var getCurrentScene = this.server.send('GetCurrentScene').then(data=>{
                this.currentScene = data;
            });

            var getCurrentProfile = this.server.send('GetCurrentProfile').then(data=>{
                this.currentProfileName = data.profileName;
            });

            return Promise.all([getVideoInfo, getSceneList, getCurrentScene, getCurrentProfile]).then(()=>{
                this.handleConnection(7); //ready
                if (this.options.heartBeat){
                    this.server.send('SetHeartbeat', {enable: true});
                    clearTimeout(this.heartBeatTimer);
                    this.heartBeatTimer = setTimeout(()=>{
                        this.handleConnection(5); //lost
                    }, 4000);
                }
            });
        }).catch(error=>{
            if (autoConnect){
                this.handleConnection(0); //auto connect failed. Never mind. Back to default state
            } else {
                this.handleConnection(2); //User connect failed. Let them know
                throw(error);
            }
        });
    }

    clear(){
        this.videoInfo = null;
        this.currentProfileName = '';
        this.sceneList = null;
        this.currentScene = null;
    }

    disconnect(){
        this.server.disconnect();
        clearTimeout(this.heartBeatTimer);
        clearTimeout(this.retryConnectTimer);
        //this.clear();
        this.handleConnection(1); //disconnected
        return Promise.resolve();
    }

    handleConnection(statusCode){
        clearTimeout(this.retryConnectTimer);
        this.connection = this.connectionStates[statusCode];
        this.connectionStatus = statusCode;
        this.connectionMessage = this.options.connectionStateMessages[statusCode];
        this.dispatchEvent(new CustomEvent('Connection', {detail:{obs:this, status:this.connection, statusCode: statusCode, message: this.connectionMessage}}));
        if ([3, 5].includes(statusCode) && this.options.reconnect){
            this.retryConnectTimer = setTimeout(()=>{
                this.connect();
            }, 4000);
        }
    }

    handleError(error){
        this.dispatchEvent(new CustomEvent('error', {detail:error}));
    }

    getSceneByName(sceneName){
        for (let i=0; i<this.sceneList.scenes.length; i++){
            if (this.sceneList.scenes[i].name == sceneName){
                return this.sceneList.scenes[i]
            }
        }
        return null;
    }

    getSourceByName(sourceName, scene){
        if (scene === undefined){
            scene = this.currentScene;
        }
        for (let i=0; i<scene.sources.length; i++){
            if (scene.sources[i].name == sourceName){
                return scene.sources[i];
            }
        }
        return null;
    }

    setScene(name){
        return this.server.send('SetCurrentScene', {'scene-name': name}).then(data=>{
            //console.log(data);
        }).catch(error=>{
            console.log(error.error);
        })
    }

    setVolume(value, sourceName){
        //Clip value to fit between 0 and 1
        value = Math.min(Math.max(0, value),1);
        return this.server.send('SetVolume', {source: sourceName, volume: value}).then(data=>{
            //console.log(data);
        }).catch(error=>{
            console.log(error.error);
        })
    }

    setMute(value, sourceName){
        return this.server.send('SetMute', {source: sourceName, mute: value}).then(data=>{
            //console.log(data);
        }).catch(error=>{
            console.log(error.error);
        })
    }

    toggleMute(sourceName){
        return this.server.send('ToggleMute', {source: sourceName}).then(data=>{
            //console.log(data);
        }).catch(error=>{
            console.log(error.error);
        })
    }    

    moveToTop(sourceName, sceneName=null){
        let scene = this.currentScene;
        if (typeof sceneName === 'string'){
            scene = this.getSceneByName(sceneName)
        }
        let items = [];
        let scenes = [];
        let source = null;
        for (let i=0; i<scene.sources.length; i++){
            if (scene.sources[i].name != sourceName){
                items.push({id: scene.sources[i].id});
                scenes.push(scene.sources[i]);
            } else { source = scene.sources[i]}
        }
        if(source != null){
            items.unshift({id:source.id});
            scenes.unshift(source);
        }
        scene.sources = scenes;
        return this.send('ReorderSceneItems',{
            scene: scene.name,
            items: items
        });
    }

    expand(sourceName, value, alignment, xpos, ypos, baseWidth, moveToTop=true){
        if (moveToTop){
            this.moveToTop(sourceName);
        }
        value = value * this.videoInfo.baseWidth/baseWidth;
        this.send('SetSceneItemProperties', {
            item: sourceName,
            scale: {
                x: value,
                y: value
            },
            position: {
                x: xpos,
                y: ypos,
                alignment: alignment
            },
            bounds: {
                type: 'OBS_BOUNDS_NONE',
            }
        });
    }

    send(command, properties){
        this.server.send(command, properties).then(data=>{
            //console.log(data);
        }).catch(error=>{
            console.log(error.error);
        })
    }
}