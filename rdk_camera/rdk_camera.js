module.exports = function(RED) {
	"use strict";

	var settings = RED.settings;
    var os = require('os');
    var fs = require('fs');
	var execSync = require("child_process").execSync;
	var spawn = require('child_process').spawn;
    var WebSocket = require('ws');

    const mipiCameraChecker = __dirname + '/lib/sh/mipicamerachecker';
    const usbCameraChecker = __dirname + '';
	const mipiCameraCommandSudo = __dirname + '/lib/sh/nrmipitakephotosudo';
    const usbCameraCommand = __dirname + '';
    const mipiStreamCommandSudo = __dirname + '/lib/sh/nrmipistreamsudo';
    const usbStreamCommandSudo = __dirname + '';

    RED.log.info('Loading rdk-camera nodes...')

    function getChildPids(pid, pids){
        try{
            var childPidBuffer = execSync('pgrep -P ' + pid);
            var childPid = childPidBuffer.toString().replace(/\r?\n/g, '');
            pids.push(childPid);
            getChildPids(childPid, pids);
        }
        catch(e){
            return;
        }
        return;
    }

    function RDKCameraTakePhotoNode(config) {
        // Create this node
        RED.nodes.createNode(this,config);

        // set parameters and save locally
        this.cameratype = config.cameratype;
        this.filemode = config.filemode;
        this.filename =  config.filename;
        this.filedefpath = config.filedefpath;
        this.filepath = config.filepath;
        this.fileformat = config.fileformat;
        this.resolution =  config.resolution;
        this.rotation = config.rotation;
        this.fliph = config.fliph;
        this.flipv = config.flipv;
        this.sharpness = config.sharpness;
        this.brightness = config.brightness;
        this.contrast = config.contrast;
        this.imageeffect = config.imageeffect;
        this.exposuremode = config.exposuremode;
        this.iso = config.iso;
        this.agcwait = config.agcwait;
        this.quality = config.quality;
        this.led = config.led;
        this.awb = config.awb;
        this.name =  config.name;
        this.activeProcesses = {};

        var node = this;
        var readyForAll = true;

        function startMipiCamera(params){
            //spawn
            node.child = spawn(mipiCameraCommandSudo, params);
            node.running = true;

            //child stdout on
            node.child.stdout.on('data', function(data){
                var dataStr = data.toString();
                if(dataStr.indexOf('failed') >= 0){
                    node.status({fill:"red",shape:"ring",text:"rdk-camera.errors.badCamera"});
                }
                else if(dataStr.indexOf('ready') >= 0){
                    var url = dataStr.split(' ')[1];
                    url = url.replace(/\r?\n/g, '');
                    node.send({
                        payload: url
                    })
                }
            })

            //hint
            node.status({fill:"green",shape:"dot",text:"working"});
        }

        function startUsbCamera(params){

        }

        // step 1: pick necessary variables
        var width = 640;
        var height = 480;
        var imagePath = os.homedir() + '/Pictures/';
        var imageName = 'image.jpg';

        switch (this.resolution) {
            case '1':
                width = 320
                height = 240
                break;
            case '2':
                width = 640
                height = 480
                break;
            case '3':
                width = 800
                height = 600
                break;
            case '4':
                width = 1024
                height = 768
                break;
            case '5':
                width = 1280
                height = 720
                break;
            case '6':
                width = 1640
                height = 922
                break;
            case '7':
                width = 1640
                height = 1232
                break;
            case '8':
                width = 1920
                height = 1280
                break;
            default:
                width = 640
                height = 480
                break;
        }

        if(this.filedefpath === '0'){
            if(fs.existsSync(this.filepath)){
                imagePath = this.filepath;
            }
            else{
                RED.log.warn(RED._("rdk-camera.errors.invalidPath"));
                node.status({fill:"grey",shape:"ring",text:"rdk-camera.errors.invalidPath"});
                readyForAll = false;
            }
        }
        else{
            if(!fs.existsSync(imagePath)){
                fs.mkdirSync(imagePath, { recursive: true});
                if(!fs.existsSync(imagePath)){
                    RED.log.warn(RED._("rdk-camera.errors.invalidPath"));
                    node.status({fill:"grey",shape:"ring",text:"rdk-camera.errors.invalidPath"});
                    readyForAll = false;
                }
            }
        }

        if(this.filemode === '1'){
            if(this.filename && this.filename.trim() !== '' && this.filename.lastIndexOf('.jpg') === (this.filename.length - 4)){
                imageName = this.filename;
            }
            else{
                RED.log.warn(RED._("rdk-camera.errors.invalidFileName"));
                node.status({fill:"grey",shape:"ring",text:"rdk-camera.errors.invalidFileName"});
                readyForAll = false;
            }
        }
        else if(this.filemode === '2'){
            imageName = '';
        }

        var params = [width, height, imagePath, imageName]
        // console.log('params: ', params.join(' '))

        // step 2: start camera (mipi or usb)
        var cameraChecker = mipiCameraChecker;
        if(this.cameratype === '1'){
            cameraChecker = usbCameraChecker;
        }

        try{
            execSync(mipiCameraChecker)
        }
        catch(e){
            RED.log.warn(RED._("rdk-camera.errors.badEnv"));
            node.status({fill:"red",shape:"ring",text:"rdk-camera.errors.badEnv"});
            readyForAll = false;
        }

        // the magic to make python print stuff immediately
        process.env.PYTHONUNBUFFERED = 1;

        if(readyForAll){
            if(this.cameratype === '1'){
                startUsbCamera(params)
            }
            else{
                startMipiCamera(params)
            }
            
            node.on('input', function(msg){
                if(node.child && node.running){
                    node.child.stdin.write('save\n');
                }
            })

            node.on('close', function(done){
                node.status({});
                
                if(node.child){
                    // node.child.stdin.write('close\n', () => {
                    //     node.child.kill('SIGKILL');
                    //     node.child = null;
                    //     node.running = false;
                    //     setTimeout(function() { if (done) { done(); } }, 50);
                    // });

                    node.finished = done;
                    node.child.stdin.write('close\n');
                    var pids = [node.child.pid.toString()];
                    getChildPids(node.child.pid, pids);
                    execSync('sudo kill -9 ' + pids.join(' '));
                    node.child = null;
                    if(done) done();
                }
                else{
                    if(done) done();
                }
            })
        }
        
    }

    function RDKCameraImageStreamNode(config) {
        // Create this node
        RED.nodes.createNode(this,config);

        // set parameters and save locally
        this.cameratype = config.cameratype;
        this.fps = config.fps;
        this.resolution =  config.resolution;
        this.defport = config.defport;
        this.port = config.port;
        this.name =  config.name;

        var readyForAll = true;
        var node = this;

        // step 1: pick necessary variables
        var width = 640;
        var height = 480;
        var fps = 20;
        var port = 10888;

        function startMipiImageStream(params){
            node.child = spawn(mipiStreamCommandSudo, params);
            node.running = true;

            node.child.stdout.on('data', function(data){
                var dataStr = data.toString();
                if(dataStr.indexOf('failed') >= 0){
                    node.status({fill:"red",shape:"ring",text:"rdk-camera.errors.badCamera"});
                }
            })

            setTimeout(function(){
                var wsClient = new WebSocket('ws://localhost:'+port);
                wsClient.on('error', function(error){
                    RED.log.warn(error);
                    node.status({fill:"red",shape:"ring",text:"rdk-camera.errors.badConnection"});
                })
                wsClient.on('open', function(){
                    node.wsConnection = wsClient;
                    node.status({fill:"green",shape:"dot",text:"working"});
                })
                wsClient.on('close', function(){
                    node.wsConnection = null;
                    RED.log.warn('connection closed');
                    node.status({fill:"grey",shape:"ring",text:"rdk-camera.errors.badConnection"});
                })
                wsClient.on('message', function message(data){
                    node.send({
                        payload: data.toString('base64')
                    })
                })
            }, 1000)
            
        }

        function startUsbImageStream(params){

        }

        switch (this.resolution) {
            // case '1':
            //     width = 320
            //     height = 240
            //     break;
            case '2':
                width = 640
                height = 480
                break;
            case '3':
                width = 800
                height = 600
                break;
            case '4':
                width = 1024
                height = 768
                break;
            case '5':
                width = 1280
                height = 720
                break;
            case '6':
                width = 1640
                height = 922
                break;
            case '7':
                width = 1640
                height = 1232
                break;
            case '8':
                width = 1920
                height = 1280
                break;
            default:
                width = 640
                height = 480
                break;
        }

        switch (this.fps) {
            case '1':
                fps = 30;
                break;
            case '2':
                fps = 15;
                break;
            case '3':
                fps = 10;
                break;
            case '4':
                fps = 5;
                break;
            case '5':
                fps = 2;
                break;
            case '6':
                fps = 1;
                break;
            default:
                fps = 20;
                break;
        }

        try{
            var intPort = parseInt(this.port);
            if(intPort < 3000 || intPort > 65535){
                RED.log.warn(RED._("rdk-camera.errors.invalidPort"));
                node.status({fill:"grey",shape:"ring",text:"rdk-camera.errors.invalidPort"});
                readyForAll = false;
            }
            else{
                port = intPort;
            }
        }
        catch(e){
            RED.log.warn(RED._("rdk-camera.errors.invalidPort"));
            node.status({fill:"grey",shape:"ring",text:"rdk-camera.errors.invalidPort"});
            readyForAll = false;
        }

        // step 2: start camera (mipi or usb)
        var cameraChecker = mipiCameraChecker;
        if(this.cameratype === '1'){
            cameraChecker = usbCameraChecker;
        }

        try{
            execSync(mipiCameraChecker)
        }
        catch(e){
            RED.log.warn(RED._("rdk-camera.errors.badEnv"));
            node.status({fill:"red",shape:"ring",text:"rdk-camera.errors.badEnv"});
            readyForAll = false;
        }

        // the magic to make python print stuff immediately
        process.env.PYTHONUNBUFFERED = 1;

        if(readyForAll){
            var params = [width, height, fps, port]
            // console.log('params: ', params)
            if(this.cameratype === '1'){
                startUsbImageStream(params)
            }
            else{
                startMipiImageStream(params);
            }

            node.on('close', function(done){
                if(node.wsConnection){
                    node.wsConnection.terminate();
                    node.wsConnection = null;
                }

                node.status({});
                
                if(node.child){
                    node.finished = done;
                    var pids = [node.child.pid.toString()];
                    getChildPids(node.child.pid, pids);
                    execSync('sudo kill -9 ' + pids.join(' '));
                    node.child = null;
                    if(done) done();
                }
                else{
                    if(done) done();
                }
            })
        }
    }

    RED.nodes.registerType('rdk-camera takephoto', RDKCameraTakePhotoNode);
    RED.nodes.registerType('rdk-camera imagestream', RDKCameraImageStreamNode);
}