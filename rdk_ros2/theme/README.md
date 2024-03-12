## How to apply the theme to the Node-RED instance
The theme included in this folder can be applied to Node-RED editor by following the next instructions:
1. Find the Node-RED user directory. By default, it is set to `/root/.node-red`, but it can be changed using the `-u` option provided by Node-RED.
2. When Node-RED is launched with a new user directory it creates all the files and directories necessaries for its execution. Find the `settings.js` location within the user directory and open it.
3. Modify it to add the following lines:
    ```
    editorTheme: {
        page: {
            css: [
                "<path-to-node-red-ros2-plugin>/theme/theme.css"
            ]
        }
    }
    ```
4. Then launch again Node-RED, and the new theme will be applied.