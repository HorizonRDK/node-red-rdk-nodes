module.exports = function(RED) {
    "use strict";
    var settings = RED.settings;
    var os = require('os');
    var fs = require('fs');
    var execSync = require("child_process").execSync;
    var spawn = require('child_process').spawn;

    const visionChecker = __dirname + '/lib/sh/visionchecker';
    const yolov3CommandSudo = __dirname + '/lib/sh/nryolov3sudo';

    RED.log.info('Loading rdk-vision nodes...')

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

    function RDKVisionYolov3Node(config) {
        // Create this node
        RED.nodes.createNode(this,config);

        this.name =  config.name;
        var node = this;

        try{
            execSync(visionChecker)
        }
        catch(e){
            RED.log.warn(RED._("rdk-vision.errors.badEnv"));
            node.status({fill:"red",shape:"ring",text:"rdk-vision.errors.badEnv"});
            readyForAll = false;
        }

        process.env.PYTHONUNBUFFERED = 1;

        node.child = spawn(yolov3CommandSudo);
        node.running = true;
        node.child.stdout.on('data', function(data){
            var dataStr = data.toString();
            dataStr = dataStr.replace(/\r?\n/g, '');
            if(dataStr.indexOf('notavailable') >= 0){
                node.status({fill:"yellow",shape:"ring",text:"rdk-vision.errors.badOutput"});
            }
            else if(dataStr.indexOf('[') >= 0){
                //skip
            }
            else if(fs.existsSync(dataStr)){
                console.log('send: ', dataStr)
                node.send({
                    payload: dataStr
                });
            }
        })
        node.status({fill:"green",shape:"dot",text:"rdk-vision.status.working"});

        node.on('input', function(msg){
            if(node.child && node.running){
                if(fs.existsSync(msg.payload)){
                    console.log('exists: ', msg.payload)
                    node.child.stdin.write(msg.payload + '\n');
                }
                else{
                    node.status({fill:"yellow",shape:"ring",text:"rdk-vision.errors.badInput"});
                }
            }
        })

        node.on('close', function(done){
            node.status({});
            
            if(node.child){
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

    RED.nodes.registerType('rdk-vision yolov3', RDKVisionYolov3Node);
}