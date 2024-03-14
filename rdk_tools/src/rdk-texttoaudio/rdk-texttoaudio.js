module.exports = function(RED) {
    var playaudionodeid;

    function RDKPlayAudioNode(config) {
        RED.nodes.createNode(this,config);
        this.voice = 0;
        var node = this;

        playaudionodeid = this.id;

        this.on('input', function(msg) {
            if (typeof msg.payload === "string") {
                RED.comms.publish("playtts", node.voice+"#"+msg.payload);
                node.status({fill:"blue",shape:"dot",text:"rdk-texttoaudio.status.speaking"});
            }
        });
    }

    RED.nodes.registerType("rdk-tools texttoaudio", RDKPlayAudioNode);

}