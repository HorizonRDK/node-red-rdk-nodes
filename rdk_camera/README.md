# node-red-node-rdk-camera
在Node-RED中配合地平线RDK硬件使用的Camera相关功能节点。

## 安装
可以在Node-RED编辑器中的节点管理面板中进行安装。也可以进入node-red安装目录进行手动安装：
```
    cd ~/.node-red
    npm i node-red-node-rdk-camera
```
## 使用
    建议配合image-tools节点使用 [链接](https://flows.nodered.org/node/node-red-contrib-image-tools)
### rdk-camera takephoto节点
![拍照节点示例1](https://github.com/HorizonRDK/node-red-rdk-nodes/blob/develop/rdk_camera/images/rdk-camera-takephoto1.png)


### rdk-camera imagestream节点

## 注意
+ rdk-camera中的节点需要与地平线RDK相关硬件及系统配合使用。[链接](https://developer.horizon.cc/)
+ 目前rdk-camera中的节点在每个flow中只能使用一个，不可以多个同时使用。（一个节点代表一个视频流，多个节点同时使用会造成冲突）