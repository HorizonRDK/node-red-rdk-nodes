# node-red-node-rdk-camera
    This module is exclusive for the RDK hardware.
    RDK X3 supports mipi camera and usb camera. This rdk-camera module also supports the two types of camera.

## Install
There are two ways to install this module. The first one is using palette to manage module. The second one is installing manually using npm.
```
    cd ~/.node-red
    npm i node-red-node-rdk-camera
```

## Usage
To display image in Node-RED, image-tools module is highly recomanded. [link](https://flows.nodered.org/node/node-red-contrib-image-tools)

![usage of rdkcamera](./images/rdkcamera_imagestream.gif)

### rdk-camera takephoto
![usage of takephoto](./images/rdkcamera_takephoto.gif)


### rdk-camera imagestream
![usage of imagestream](./images/rdkcamera_imagestream.gif)


## Notice
+ rdk-camera module is exclusive for the RDK hardware. [link](https://developer.horizon.cc/)
+ Multiple rdk-camera nodes in one flow are not available. You can only use one activated node in a flow. (input start/stop to activate/deactivate a rdk-camera module)