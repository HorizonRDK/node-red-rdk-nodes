module.exports = function(RED) {
    var openurlid;

    function RDKOpenUrlNode(config) {
        RED.nodes.createNode(this,config);
        var node = this;
        openurlid = this.id;

        this.on('input', function(msg) {
            if (typeof msg.payload === "string") {
                if(msg.payload.indexOf('://') < 0){
                    node.status({fill:"yellow",shape:"ring",text:"rdk-openurl.errors.invalidUrl"})
                }
                else{
                    node.status({fill:"green",shape:"ring",text:"rdk-openurl.hints.validUrl"})
                    RED.comms.publish("openurl", msg.payload);
                    setTimeout(function(){
                        node.status({});
                    }, 5000);
                }
            }
        });
    }

    RED.nodes.registerType("rdk-tools openurl", RDKOpenUrlNode);

}