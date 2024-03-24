English| [简体中文](./README_cn.md)

# node-red-node-rdk-camera
Nodes related to Camera functionalities in Node-RED for use with Horizon RDK hardware.
RDK X3 is commonly used with two types of camera interfaces. The first type is the most commonly used USB camera, and the second type is the MIPI camera. The RDK Camera library also supports these two types of camera interfaces.

## Installation
You can install it via the node management panel in the Node-RED editor. Alternatively, you can manually install it by entering the node-red installation directory:
```
cd ~/.node-red
npm i node-red-node-rdk-camera
```

## Usage
It is recommended to use it with the image-tools node [link](https://flows.nodered.org/node/node-red-contrib-image-tools)

![usage of rdkcamera](./images/rdkcamera_imagestream.gif)

### Take Photo Node (rdk-camera takephoto)
![usage of takephoto](./images/rdkcamera_takephoto.gif)

For more usage details, please refer to the documentation: To be released

### Image Stream Node (rdk-camera imagestream)
![usage of imagestream](./images/rdkcamera_imagestream.gif)

For more usage details, please refer to the documentation: To be released

## Note
+ Nodes in rdk-camera need to be used in conjunction with related Horizon RDK hardware and systems. [link](https://developer.horizon.cc/)
+ Currently, nodes in rdk-camera cannot be used simultaneously in each flow. When starting a camera node, make sure that other camera nodes are in the closed state. (You can input start/stop to the camera node to start/close the node)