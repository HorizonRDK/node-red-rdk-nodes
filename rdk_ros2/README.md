English| [简体中文](./README_cn.md)

# node-red-node-rdk-ros2
A collection of ROS2 nodes for using with Horizon RDK hardware and TROS in Node-RED.

## Installation
You can install it in the Node-RED Editor's node management panel. You can also manually install it in the node-red installation directory:
```
    cd ~/.node-red
    npm i node-red-node-rdk-ros2
```

## Usage

### Basic Usage Example
**Step 1 Start a ros2 publisher node**
First, open a terminal
```
    source /opt/tros/setup.bash
    ros2 run demo_nodes_cpp talker
```

**Step 2 Use Node-RED rdk-ros2 nodes to get messages**
![ros2 basic usage](./images/rdkros2_basic.gif)