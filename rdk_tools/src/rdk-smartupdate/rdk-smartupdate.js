module.exports = function(RED) {
    "use strict";
    var settings = RED.settings;
    var execSync = require("child_process").execSync;
    var exec = require("child_process").exec;

    RED.log.info('Loading rdk-tool smartupdate...')
    // console.log(settings)

    function generateDateString(){
        var date = new Date();
        var day = date.toJSON().split('T').join(' ').substr(0, 10);
        return day;
    }

    function RDKToolsSmartUpdateNode(config){
        RED.nodes.createNode(this, config);
    
        this.name =  config.name;
        var node = this;

        var command1 = {
            command: 'sudo apt update',
            status: 'rdk-smartupdate.status.updating',
            error: 'rdk-smartupdate.errors.updating'
        };
        var command2 = {
            command: 'sudo apt upgrade -y',
            status: 'rdk-smartupdate.status.upgrading',
            error: 'rdk-smartupdate.errors.upgrading'
        };
        var command3 = {
            command: 'sudo apt autoremove -y',
            status: 'rdk-smartupdate.status.autoremoving',
            error: 'rdk-smartupdate.status.autoremoving'
        };
        var status = settings.get('smartUpdate');    //updated, notupdated
        var updateDate = settings.get('updateDate');
        var today = generateDateString();
        

        function processExecQueue(tasks, msg){
            if(tasks.length === 0){
                node.send([msg, null]);
                node.status({fill:"green",shape:"dot",text: "rdk-smartupdate.status.updated"});
                status = 'updated'
                settings.set('smartUpdate', status);
                settings.set('updateDate', today);
                return;
            } 

            var task = tasks.shift();
            node.status({fill:"yellow",shape:"ring",text: task.status});
            var childProcess = exec(task.command);
            childProcess.on('close', function(ret){
                if(ret === 0){
                    processExecQueue(tasks, msg);
                }
                else{
                    node.status({fill:"red",shape:"ring",text: task.error});
                    node.send([null, {payload: task.error}])
                }
            })
        }
        
        node.on('input', function(msg){
            if(status == 'updating') return;
            
            status = settings.get('smartUpdate');    //updated, notupdated, updating
            updateDate = settings.get('updateDate');
            today = generateDateString();
            if(updateDate != today){
                status = 'notupdated';
                settings.set('smartUpdate', status);
            }
            if(status != 'updated' && status !== 'notupdated'){
                status = 'notupdated';
                settings.set('smartUpdate', status);
            }
            // console.log('input: ', status)
            if(status == 'updated'){
                node.status({fill:"green",shape:"dot",text:"rdk-smartupdate.status.updated"});
                // settings.set('updateDate', '')
                node.send([msg, null]);
            }
            else if(status == 'notupdated'){
                status = 'updating';
                var tasks = [command1, command2, command3];
                processExecQueue(tasks, msg);
            }
        })
    }

    RED.nodes.registerType('rdk-tools smartupdate', RDKToolsSmartUpdateNode);

}