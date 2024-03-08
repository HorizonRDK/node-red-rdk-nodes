module.exports = function(RED) {
    "use strict";
    var execSync = require('child_process').execSync;
    var exec = require('child_process').exec;
    var spawn = require('child_process').spawn;
    var spawnSync = require('child_process').spawnSync;

    

    var testCommand = __dirname+'/lib/sh/gpiochecker';
    var gpioCommand = __dirname+'/lib/sh/nrgpio';
    var gpioCommandSudo = __dirname+'/lib/sh/nrgpiosudo';
    var allOK = true;

    RED.log.info('Loading rdk-gpio nodes...')
    
    try {
        execSync(testCommand);
    } catch(err) {
        allOK = false;
        RED.log.warn("rdk-gpio : "+RED._("rdk-gpio.errors.ignorenode"));
    }

     // the magic to make python print stuff immediately
     process.env.PYTHONUNBUFFERED = 1;

    var pinsInUse = {};
    var pinTypes = {
        "out":RED._("rdk-gpio.types.digout"), 
        "tri":RED._("rdk-gpio.types.input"), 
        "up":RED._("rdk-gpio.types.pullup"), 
        "down":RED._("rdk-gpio.types.pulldown"), 
        "pwm":RED._("rdk-gpio.types.pwmout"),
        "softpwm":RED._("rdk-gpio.types.softpwm")
    };

    var pin2bcm = { '3':'2', '5':'3', '7':'4', '8':'14', '10':'15', '11':'17', '12':'18', '13':'27',
        '15':'22', '16':'23', '18':'24', '19':'10', '21':'9', '22':'25', '23':'11', '24':'8', '26':'7',
        '29':'5', '31':'6', '32':'12', '33':'13', '35':'19', '36':'16', '37':'26', '38':'20', '40':'21'
    }

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

    function GPIOOutNode(n) {
        RED.nodes.createNode(this,n);
        this.pin = (n.bcm === true) ? n.pin : pin2bcm[n.pin];
        this.set = n.set || false;
        this.level = n.level || 0;
        this.freq = n.freq || 48000;
        this.out = n.out || "out";
        var node = this;

        // console.log('pin&type: ', this.pin, this.out)

        if (!pinsInUse.hasOwnProperty(this.pin)) {
            pinsInUse[this.pin] = this.out;
        }
        else {
            if ((pinsInUse[this.pin] !== this.out)||(pinsInUse[this.pin] === "pwm")) {
                node.warn(RED._("rdk-gpio.errors.alreadyset",{pin:this.pin,type:pinTypes[pinsInUse[this.pin]]}));
            }
        }

        function inputlistener(msg, send, done) {
            if (msg.payload === "true") { msg.payload = true; }
            if (msg.payload === "false") { msg.payload = false; }
            var out = Number(msg.payload);
            var limit = 1;
            if (node.out === "pwm") { limit = 48000; }
            if ((out >= 0) && (out <= limit)) {
                if (RED.settings.verbose) { node.log("out: "+out); }
                if (node.child !== null) {
                    node.child.stdin.write(out+"\n", () => {
                        // console.log('write: ', out);
                        if (done) { done(); }
                    });
                    node.status({fill:"green",shape:"dot",text:msg.payload.toString()});
                }
                else {
                    node.error(RED._("rdk-gpio.errors.pythoncommandnotfound"),msg);
                    node.status({fill:"red",shape:"ring",text:"rdk-gpio.status.not-running"});
                }
            }
            else { node.warn(RED._("rdk-gpio.errors.invalidinput")+": "+out); }
        }

        if (allOK === true) {
            // console.log('pin: ', node.pin, node.set, node.out)
            if (node.pin !== undefined) {
                if (node.out === "out") {
                    node.child = spawn(gpioCommand, [node.out,node.pin,node.level]);
                    node.status({fill:"green",shape:"dot",text:node.level});
                } else {
                    node.child = spawn(gpioCommand, [node.out,node.pin,node.freq]);
                    node.status({fill:"yellow",shape:"dot",text:"rdk-gpio.status.ok"});
                }
                node.running = true;

                node.on("input", inputlistener);

                node.child.stdout.on('data', function (data) {
                    // console.log('on data: ', data.toString())
                    if (RED.settings.verbose) { node.log("out: "+data+" :"); }
                });

                node.child.stderr.on('data', function (data) {
                    if (RED.settings.verbose) { node.log("err: "+data+" :"); }
                });

                node.child.on('close', function (code) {
                    node.child = null;
                    node.running = false;
                    if (RED.settings.verbose) { node.log(RED._("rdk-gpio.status.closed")); }
                    if (node.finished) {
                        node.status({fill:"grey",shape:"ring",text:"rdk-gpio.status.closed"});
                        node.finished();
                    }
                    else { node.status({fill:"red",shape:"ring",text:"rdk-gpio.status.stopped"}); }
                });

                node.child.on('error', function (err) {
                    if (err.code === "ENOENT") { node.error(RED._("rdk-gpio.errors.commandnotfound")+err.path,err); }
                    else if (err.code === "EACCES") { node.error(RED._("rdk-gpio.errors.commandnotexecutable")+err.path,err); }
                    else { node.error(RED._("rdk-gpio.errors.error",{error:err.code}),err) }
                });

                node.child.stdin.on('error', function (err) {
                    if (!node.finished) {
                        node.error(RED._("rdk-gpio.errors.error",{error:err.code}),err);
                    }
                });
            }
            else {
                node.warn(RED._("rdk-gpio.errors.invalidpin")+": "+node.pin);
            }
        }
        else {
            node.status({fill:"grey",shape:"dot",text:"rdk-gpio.status.not-available"});
            node.on("input", function(msg) {
                node.status({fill:"grey",shape:"dot",text:RED._("rdk-gpio.status.na",{value:msg.payload.toString()})});
            });
        }

        node.on("close", function(done) {
            node.status({fill:"grey",shape:"ring",text:"rdk-gpio.status.closed"});
            delete pinsInUse[node.pin];
            if (node.child != null) {
                node.finished = done;
                node.child.stdin.write("close "+node.pin, () => {
                    node.child.kill('SIGKILL');
                    setTimeout(function() { if (done) { done(); } }, 50);
                });
            }
            else { if (done) { done(); } }
        });

    }
    RED.nodes.registerType("rdk-gpio out", GPIOOutNode);
    // RED.nodes.registerType("rdk-gpio soft pwm", GPIOOutNode);
    RED.nodes.registerType("rdk-gpio pwm", GPIOOutNode);


    function GPIOInNode(n) {
        RED.nodes.createNode(this,n);
        this.buttonState = -1;
        this.pin = (n.bcm === true) ? n.pin : pin2bcm[n.pin];
        this.intype = n.intype;
        this.read = n.read || false;
        this.debounce = Number(n.debounce || 25);
        if (this.read) { this.buttonState = -2; }
        var node = this;
        if (!pinsInUse.hasOwnProperty(this.pin)) {
            pinsInUse[this.pin] = this.intype;
        }
        else {
            if ((pinsInUse[this.pin] !== this.intype)||(pinsInUse[this.pin] === "pwm")) {
                node.warn(RED._("rdk-gpio.errors.alreadyset",{pin:this.pin,type:pinTypes[pinsInUse[this.pin]]}));
            }
        }

        var startPin = function() {
            node.child = spawn(gpioCommand, ["in",node.pin,node.intype,node.debounce]);
            node.running = true;
            node.status({fill:"yellow",shape:"dot",text:"rdk-gpio.status.ok"});

            node.child.stdout.on('data', function (data) {
                var d = data.toString().trim().split("\n");
                for (var i = 0; i < d.length; i++) {
                    if (d[i] === '') { return; }
                    if (node.running && node.buttonState !== -1 && !isNaN(Number(d[i])) && node.buttonState !== d[i]) {
                        node.send({ topic:"gpio/"+node.pin, payload:Number(d[i]) });
                    }
                    node.buttonState = d[i];
                    node.status({fill:"green",shape:"dot",text:d[i]});
                    if (RED.settings.verbose) { node.log("out: "+d[i]+" :"); }
                }
            });

            node.child.stderr.on('data', function (data) {
                if (RED.settings.verbose) { node.log("err: "+data+" :"); }
            });

            node.child.on('close', function (code) {
                node.running = false;
                node.child.removeAllListeners();
                delete node.child;
                if (RED.settings.verbose) { node.log(RED._("rdk-gpio.status.closed")); }
                if (!node.finished && code === 1) {
                    setTimeout(function() {startPin()}, 250);
                }
                else if (node.finished) {
                    node.status({fill:"grey",shape:"ring",text:"rdk-gpio.status.closed"});
                    node.finished();
                }
                else { node.status({fill:"red",shape:"ring",text:"rdk-gpio.status.stopped"}); }
            });

            node.child.on('error', function (err) {
                if (err.code === "ENOENT") { node.error(RED._("rdk-gpio.errors.commandnotfound")+err.path,err); }
                else if (err.code === "EACCES") { node.error(RED._("rdk-gpio.errors.commandnotexecutable")+err.path,err); }
                else { node.error(RED._("rdk-gpio.errors.error",{error:err.code}),err) }
            });

            node.child.stdin.on('error', function (err) {
                if (!node.finished) {
                    node.error(RED._("rdk-gpio.errors.error",{error:err.code}),err);
                }
            });
        }

        if (allOK === true) {
            if (node.pin !== undefined) {
                startPin();
            }
            else {
                node.warn(RED._("rdk-gpio.errors.invalidpin")+": "+node.pin);
            }
        }
        else {
            node.status({fill:"grey",shape:"dot",text:"rdk-gpio.status.not-available"});
            if (node.read === true) {
                var val;
                if (node.intype == "up") { val = 1; }
                if (node.intype == "down") { val = 0; }
                setTimeout(function() {
                    node.send({ topic:"gpio/"+node.pin, payload:val });
                    node.status({fill:"grey",shape:"dot",text:RED._("rdk-gpio.status.na",{value:val})});
                },250);
            }
        }

        node.on("close", function(done) {
            node.status({fill:"grey",shape:"ring",text:"rdk-gpio.status.closed"});
            delete pinsInUse[node.pin];
            if (node.child != null) {
                node.finished = done;
                node.child.stdin.write("close "+node.pin, () => {
                    if (node.child) {
                        node.child.kill('SIGKILL');
                    }
                });
            }
            else { if (done) { done(); } }
        });
    }
    RED.nodes.registerType("rdk-gpio in",GPIOInNode);


    function IOMouseNode(n) {
        RED.nodes.createNode(this,n);
        this.butt = n.butt || 7;
        var node = this;

        if (allOK === true) {
            node.child = spawn(gpioCommandSudo, ["mouse",node.butt]);
            node.status({fill:"green",shape:"dot",text:"rdk-gpio.status.ok"});

            node.child.stdout.on('data', function (data) {
                data = Number(data);
                if (data !== 0) { node.send({ topic:"io/mouse", button:data, payload:1 }); }
                else { node.send({ topic:"io/mouse", button:data, payload:0 }); }
            });

            node.child.stderr.on('data', function (data) {
                if (RED.settings.verbose) { node.log("err: "+data+" :"); }
            });

            node.child.on('close', function (code) {
                node.child = null;
                node.running = false;
                if (RED.settings.verbose) { node.log(RED._("rdk-gpio.status.closed")); }
                if (node.finished) {
                    node.status({fill:"grey",shape:"ring",text:"rdk-gpio.status.closed"});
                    node.finished();
                }
                else { node.status({fill:"red",shape:"ring",text:"rdk-gpio.status.stopped"}); }
            });

            node.child.on('error', function (err) {
                if (err.errno === "ENOENT") { node.error(RED._("rdk-gpio.errors.commandnotfound")); }
                else if (err.errno === "EACCES") { node.error(RED._("rdk-gpio.errors.commandnotexecutable")); }
                else { node.error(RED._("rdk-gpio.errors.error")+': ' + err.errno); }
            });

            node.on("close", function(done) {
                node.status({fill:"grey",shape:"ring",text:"rdk-gpio.status.closed"});
                if (node.child != null) {
                    node.finished = done;
                    var pids = [node.child.pid.toString()];
                    getChildPids(node.child.pid, pids);
                    execSync('sudo kill -9 ' + pids.join(' '));
                    // node.child.kill('SIGINT');
                    node.child = null;
                }
                else { done(); }
            });
        }
        else {
            node.status({fill:"grey",shape:"dot",text:"rdk-gpio.status.not-available"});
        }
    }
    RED.nodes.registerType("rdk-mouse",IOMouseNode);


    function IOKeyboardNode(n) {
        RED.nodes.createNode(this,n);
        var node = this;
        var sudoprocess = 0;

        var doConnect = function() {
            node.child = spawn(gpioCommandSudo, ["kbd", "0"]);
            node.status({fill:"green",shape:"dot",text:"rdk-gpio.status.ok"});

            node.child.stdout.on('data', function (data) {
                var d = data.toString().trim().split("\n");
                for (var i = 0; i < d.length; i++) {
                    if (d[i] !== '') {
                        var b = d[i].trim().split(",");
                        var act = "up";
                        if (b[1] === "1") { act = "down"; }
                        if (b[1] === "2") { act = "repeat"; }
                        node.send({ topic:"io/key", payload:Number(b[0]), action:act });
                    }
                }
            });

            node.child.stderr.on('data', function (data) {
                if (RED.settings.verbose) { node.log("err: "+data+" :"); }
            });

            node.child.on('close', function (code) {
                node.running = false;
                node.child = null;
                if (RED.settings.verbose) { node.log(RED._("rdk-gpio.status.closed")); }
                if (node.finished) {
                    node.status({fill:"grey",shape:"ring",text:"rdk-gpio.status.closed"});
                    node.finished();
                }
                else {
                    node.status({fill:"red",shape:"ring",text:"rdk-gpio.status.stopped"});
                    setTimeout(function() { doConnect(); },2000)
                }
            });

            node.child.on('error', function (err) {
                if (err.errno === "ENOENT") { node.error(RED._("rdk-gpio.errors.commandnotfound")); }
                else if (err.errno === "EACCES") { node.error(RED._("rdk-gpio.errors.commandnotexecutable")); }
                else { node.error(RED._("rdk-gpio.errors.error")+': ' + err.errno); }
            });
        }

        if (allOK === true) {
            doConnect();

            node.on("close", function(done) {
                node.status({});
                if (node.child != null) {
                    node.finished = done;
                    var pids = [node.child.pid.toString()];
                    getChildPids(node.child.pid, pids);
                    execSync('sudo kill -9 ' + pids.join(' '));
                    // node.child.kill('SIGINT');
                    node.child = null;
                }
                else { 
                    done(); }
            });
        }
        else {
            node.status({fill:"grey",shape:"dot",text:"rdk-gpio.status.not-available"});
        }
    }
    RED.nodes.registerType("rdk-keyboard",IOKeyboardNode);


    RED.httpAdmin.get('/rdk-pins/:id', RED.auth.needsPermission('rdk-gpio.read'), function(req,res) {
        res.json(pinsInUse);
    });
}