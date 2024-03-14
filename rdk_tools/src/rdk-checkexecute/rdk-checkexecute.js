module.exports = function(RED) {
    "use strict";
    var settings = RED.settings;
    var execSync = require("child_process").execSync;
    var exec = require("child_process").exec;

    RED.log.info('Loading rdk-tool checkexecute...')

    var checkCommand = 'sudo apt list --installed 2>/dev/null ';
    var installCommand = 'sudo apt install -y ';
    var runCommand = 'source /opt/tros/setup.bash && ros2 launch ';

    function sleep(ms) {
        return new Promise((resolve) => {
          setTimeout(resolve, ms);
        });
    }

    function RDKToolsCheckUpdateNode(config){
        RED.nodes.createNode(this, config);
    
        this.name =  config.name;
        var node = this;

        node.on('input', async function(msg){
            var packageName = msg.payload;
            if(!(packageName instanceof String)){
                node.status({fill:"red",shape:"dot",text:"rdk-checkexecute.errors.inputType"});
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
            console.log('matched: ', matched)
            if(!matched){
                node.status({fill:"blue",shape:"ring",text:"rdk-checkexecute.status.installing"});
                await sleep(50);
                execSync(installCommand + packageName);
            }

            var childProcess = exec(runCommand + packageName);
            node.status({fill:"green",shape:"dot",text:"rdk-checkexecute.status.installing"});
            childProcess.on('close', function(ret){
                if(ret === 0){
                    node.status({fill:"yellow",shape:"dot",text:"rdk-checkexecute.status.finished"});
                    node.send([msg, null])
                }
                else{
                    node.status({fill:"red",shape:"dot",text:"rdk-checkexecute.errors.runError"});
                    msg.payload = RED._('rdk-checkexecute.errors.runError');
                    node.send([null, msg])
                }
            })
        })
    }

    RED.nodes.registerType('rdk-tools checkexecute', RDKToolsCheckUpdateNode);
}