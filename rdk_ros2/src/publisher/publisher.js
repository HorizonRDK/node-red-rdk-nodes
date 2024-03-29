// RED argument provides the module access to Node-RED runtime api
module.exports = function(RED)
{
    var fs = require('fs');
    var is_web_api = require('is-web-api').ros2;
    /*
     * @function PublisherNode constructor
     * This node is defined by the constructor function PublisherNode,
     * which is called when a new instance of the node is created
     *
     * @param {Object} config - Contains the properties set in the flow editor
     */
    function PublisherNode(config)
    {
        // Initiliaze the features shared by all nodes
        RED.nodes.createNode(this, config);
        this.props = config.props;
        var node = this;
        node.ready = false;

        node.status({fill: "yellow", shape: "dot", text: "Wait until Visual-ROS is ready to be used."});

        if(config.domain)
        {
            // modify the global domain
            var selected_domain = RED.nodes.getNode(config.domain).domain;
            is_web_api.set_dds_domain(selected_domain);
        }

        let {color, message} = is_web_api.add_publisher(config['id'], config['topic'], config['selectedtype'], config['props']);
        if (message && color)
        {
            node.status({ fill: color, shape: "dot", text: message});
        }

        // Event emitted when the deploy is finished
        RED.events.once('flows:started', function()
        {
            let {color, message} = is_web_api.launch(config['id']);
            if (message && color)
            {
                node.status({ fill: color, shape: "dot", text: message});
            }
        });

        var event_emitter = is_web_api.get_event_emitter();
        if (event_emitter)
        {
            event_emitter.on('IS-ERROR', function(status)
            {
                node.ready = false;
                node.status(status);
            });

            event_emitter.on('ROS2_connected', function()
            {
                node.ready = true;
                node.status({ fill: null, shape: null, text: null});
            });
        }

        // Registers a listener to the input event,
        // which will be called whenever a message arrives at this node
        node.on('input', function(msg)
        {
            if (node.ready)
            {
                node.status({ fill: "green", shape: "dot", text: "Message Published"});

                // Passes the message to the next node in the flow
                node.send(msg);
                is_web_api.send_message(config['topic'], msg);
            }
            else
            {
               done("node was not ready to process flow data");
            }
        });

        // Called when there is a re-deploy or the program is closed
        node.on('close', function()
        {
            // Stops the IS execution and resets the yaml
            is_web_api.new_config();
            is_web_api.stop();
            node.status({ fill: null, shape: null, text: ""});
        });
    }

    // The node is registered in the runtime using the name Publisher
    RED.nodes.registerType("Publisher", PublisherNode);

    // Function that sends to the html file the qos descriptions read from the json file
    RED.httpAdmin.get("/pubqosdescription", RED.auth.needsPermission('Publisher.read'), function(req,res)
    {
        var description_path = __dirname + "/../qos-description.json";
        var rawdata  = fs.readFileSync(description_path);
        let json = JSON.parse(rawdata);
        res.json(json);
    });
}
