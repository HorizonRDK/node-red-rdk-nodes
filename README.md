# Node-RED RDK Nodes
    立足于地平线机器人RDK生态 [官网](https://developer.horizon.cc/)<br>
    结合比较成熟的低代码编程工具[Node-RED](http://nodered.org)<br>
    提供便捷的低代码工具集合，旨在极大提升使用RDK进行开发的乐趣<br>
![RDK with Node-RED](https://nodered.org/images/node-red-screenshot.png)

## 概览
**node-red-node-rdk-gpio** - *[gpio](rdk_gpio)* - 提供多种操作GPIO的功能节点。<br>
**node-red-node-rdk-camera** - *[camera](rdk_camera)* - 提供多种操作摄像头的功能节点。<br>

## 安装步骤
### 步骤1 安装Node-RED
    首先要确认您使用的RDK系统是否已经预装了Node-RED。如果已经预装可以跳过该步骤。如果您使用的是没有预装Node-RED的系统版本，那么您需要先安装Node-RED以及相关的依赖。
        + 安装nvm
        + 使用nvm安装node.js
        + 使用npm安装Node-RED
### 步骤2 为Node-RED安装RDK node
    + 方式1: 可以在Node-RED编辑器中的节点管理面板搜索`node-red-node-rdk-xxx`,点击安装。
    + 方式2: 
        cd ~/.node-red
        npm install node-red-node-rdk-xxx

## 版权及开源协议
[the Apache 2.0 license](LICENSE)