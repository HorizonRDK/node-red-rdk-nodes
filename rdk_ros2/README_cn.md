[English](./README.md) | 简体中文

# node-red-node-rdk-ros2
在Node-RED中配合地平线RDK硬件及TROS使用ROS2的节点集合。

## 安装
可以在Node-RED编辑器中的节点管理面板中进行安装。也可以进入node-red安装目录进行手动安装：
```
    cd ~/.node-red
    npm i node-red-node-rdk-ros2
```

## 使用

### 基本使用示例
**Step 1 启动一个ros2发布者节点**
先打开一个终端
```
    source /opt/tros/setup.bash
    ros2 run demo_nodes_cpp talker
```

**Step 2 使用Node-RED rdk-ros2的节点获取消息**
![ros2基本使用](./images/rdkros2_basic.gif)
