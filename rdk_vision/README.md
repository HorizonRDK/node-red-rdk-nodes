English| [简体中文](./README_cn.md)

# node-red-node-rdk-vision (exploration version)
Nodes related to image algorithm functions used in conjunction with Horizon RDK hardware in Node-RED.

## Installation
You can install it in the node management panel in the Node-RED editor. You can also manually install it by entering the node-red installation directory:
```
    cd ~/.node-red
    npm i node-red-node-rdk-vision
```
## Usage
    It is recommended to use it with the image-tools node [link](https://flows.nodered.org/node/node-red-contrib-image-tools)
### rdk-vision yolov3 node
![yolov3 object recognition](./images/rdkvision_yolov3.gif)

### rdk-vision yolov5 node
![yolov5 object recognition](./images/rdkvision_yolov5.gif)

### rdk-vision unet node
![unet image segmentation](./images/rdkvision_unet.gif)

### rdk-vision fcos node
![fcos object recognition](./images/rdkvision_fcos.gif)

## Note
+ The nodes in rdk-vision need to be used in conjunction with Horizon RDK related hardware and systems. [link](https://developer.horizon.cc/)