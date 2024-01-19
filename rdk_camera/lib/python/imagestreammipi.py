from hobot_vio import libsrcampy
import signal
import websockets
import asyncio
import sys
import os

width = int(sys.argv[1])
height = int(sys.argv[2])
fps = int(sys.argv[3])
port = int(sys.argv[4])
enc = libsrcampy.Encoder()
enc.encode(0, 3, width, height)

def signal_handler(signal, frame):
    sys.exit(0)

async def send_image_stream(websocket, path):
    host_idx = 0
     #camera start
    cam = libsrcampy.Camera()
    ret = cam.open_cam(0, host_idx, fps, width, height)
    #print("Camera open_cam return:%d" % ret)
    if(ret != 0):
        print('failed')
        sys.exit(0)
    
    while True:
        origin_image = cam.get_img(2, width, height)
        enc.encode_file(origin_image)
        img_data = enc.get_img()

        await websocket.send(img_data)

    enc.close()
    cam.close_cam()

if __name__ == '__main__':
    signal.signal(signal.SIGINT, signal_handler)
    ws_server = websockets.serve(send_image_stream, "0.0.0.0", port)
    asyncio.get_event_loop().run_until_complete(ws_server)
    asyncio.get_event_loop().run_forever()
