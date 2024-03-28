module.exports = function(RED) {
    "use strict";
    var settings = RED.settings;
    var execSync = require("child_process").execSync;
    var exec = require("child_process").exec;

    RED.log.info('Loading rdk-tool checkexecute...')

    var checkCommand = 'sudo apt list --installed 2>/dev/null ';
    var installCommand = 'sudo apt install -y ';
    var runCommand = 'source /opt/tros/setup.bash';
    var launchCommand = 'ros2 launch ';

    function sleep(ms) {
        return new Promise((resolve) => {
          setTimeout(resolve, ms);
        });
    }

    function getChildPids(pid, pids){
        try{
            var childPidBuffer = execSync('pgrep -P ' + pid);
            var childPid = childPidBuffer.toString().replace(/\r?\n/g, ' ');
            // console.log('childPid: ', childPid);
            pids.push(childPid);
            getChildPids(childPid, pids);
        }
        catch(e){
            return;
        }
        return;
    }

    function RDKToolsCheckUpdateNode(config){
        RED.nodes.createNode(this, config);
    
        this.name =  config.name;
        var node = this;

        node.on('input', async function(msg){
            if(Object.hasOwnProperty.call(msg, 'kill')){
                // console.log('before kill')
                if(node.running === true && node.child){
                    var pids = [node.child.pid.toString()];
                    getChildPids(node.child.pid, pids);
                    // console.log('pids: ', pids.join(' '))
                    execSync('kill -2 ' + pids.join(' '));
                    node.child = null;
                    node.running = false;
                    node.status({fill:"gray",shape:"dot",text:"rdk-checkexecute.status.finished"});
                }
                return;
            }
            var packageName = msg.payload;
            var launchName = msg.launch;
            if(typeof packageName != 'string'){
                node.status({fill:"red",shape:"dot",text:"rdk-checkexecute.errors.inputtype"});
            }

            if(node.running === true && node.child){
                if(Object.hasOwnProperty.call(msg, 'input')){
                    node.child.stdin.write(msg.input);
                }
                else{
                    RED.comms.publish("notify", RED._("rdk-checkexecute.errors.alreadyrun"));
                }
                return;
            }
            var nameList = packageName.trim().split(' ');
            node.status({fill:"yellow",shape:"ring",text:"rdk-checkexecute.status.checking"});
            await sleep(50);
            var ret = execSync(checkCommand + packageName);
            var retStr = ret.toString();
            
            var matched = true;

            nameList.forEach((name) => {
                if(retStr.indexOf(name) < 0){
                    matched = false;
                }
            })
            // console.log('matched: ', matched)
            if(!matched){
                node.status({fill:"blue",shape:"ring",text:"rdk-checkexecute.status.installing"});
                await sleep(50);
                execSync(installCommand + packageName);
            }

            if(typeof launchName != 'string'){
                node.status({fill:"red",shape:"dot",text:"rdk-checkexecute.errors.launchtype"});
                msg.payload = RED._('rdk-checkexecute.errors.launchtype');
                node.send([null, msg])
                return;
            }
            // console.log(runCommand + launchName)
            var commands = [runCommand, launchCommand];
            if(Object.hasOwnProperty.call(msg, 'insert') && typeof msg.insert == 'string'){
                commands.push(commands[1]);
                commands[1] = msg.insert;
            }
            var assembledCommand = commands.join(' && ');
            console.log(assembledCommand);
            var childProcess = exec(assembledCommand + launchName, {
                shell: '/bin/bash'
            }, function(e, out, err){
                if(err){
                    msg.payload = err;
                    node.send([null, msg]);
                }
                if(out){
                    msg.payload = RED._('rdk-checkexecute.status.finished');
                    node.send([msg, null])
                }
            });
            node.status({fill:"green",shape:"dot",text:"rdk-checkexecute.status.running"});
            node.running = true;
            node.child = childProcess;
            childProcess.on('close', function(ret){
                // console.log('close: ', ret)
                if(ret === 0){
                    node.status({fill:"gray",shape:"dot",text:"rdk-checkexecute.status.finished"});
                }
                else{
                    if(node.running !== true) return;
                    node.status({fill:"red",shape:"dot",text:"rdk-checkexecute.errors.runerror"});
                }
                node.running = false;
                node.child = null;
            })
            await sleep(20000);
            if(node.running === true && node.child){
                var pids = [node.child.pid.toString()];
                getChildPids(node.child.pid, pids);
                node.status({fill:"green",shape:"dot",text:"pid: " + pids.join(' ')});
            }
            
        })

        node.on('close', function(){
            if(node.running === true && node.child){
                var pids = [node.child.pid.toString()];
                getChildPids(node.child.pid, pids);
                execSync('kill -2 ' + pids.join(' '));
                node.running = false;
                node.child = null
            }
        })
    }

    RED.nodes.registerType('rdk-tools checkexecute', RDKToolsCheckUpdateNode);
}