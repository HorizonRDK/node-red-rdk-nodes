English| [简体中文](./README_cn.md)

# Node-RED RDK Nodes
Based on the Horizon Robotics' RDK ecosystem [Official Website](https://developer.horizon.cc/)<br>
Combined with the well-established low-code programming tool [Node-RED](http://nodered.org)<br>
Providing a convenient collection of low-code tools, aiming to greatly enhance the fun of developing with RDK<br>
![RDK with Node-RED](https://nodered.org/images/node-red-screenshot.png)

## Overview
**node-red-node-rdk-gpio** - *[gpio](rdk_gpio)* - Provides various nodes for GPIO operations.<br>
**node-red-node-rdk-camera** - *[camera](rdk_camera)* - Provides various nodes for camera operations.<br>

## Installation Steps
### Step 1 Install Node-RED
Firstly, make sure whether your RDK system comes with Node-RED pre-installed. If it's pre-installed, you can skip this step. If the version of your system does not come with Node-RED pre-installed, you will need to install Node-RED and its dependencies first.
        + Install nvm
        + Install node.js using nvm
        + Install Node-RED using npm
### Step 2 Install RDK nodes for Node-RED
    + Method 1: You can search for `node-red-node-rdk-xxx` in the Node-RED editor's node management panel and click install.
    + Method 2: 
        cd ~/.node-red
        npm install node-red-node-rdk-xxx

## Copyright and Open Source License
[the Apache 2.0 license](LICENSE)