from hobot_vio import libsrcampy
from time import sleep
from time import perf_counter
import sys
import os
import datetime

try:
    raw_input          # Python 2
except NameError:
    raw_input = input  # Python 3

# command prameters: 0:scriptname, 1:width, 2:height, 3:imagepath, 4:imagename(optional)

imageUrl = 'image.jpg'
autoName = True
nameStr = ''
imagePath = sys.argv[3]
width = int(sys.argv[1])
height = int(sys.argv[2])
if(len(sys.argv) > 4):
    imageUrl = sys.argv[4]
    autoName = False
    
enc = libsrcampy.Encoder()
enc.encode(0, 3, width, height)

def latest_buffer(cam):
    while True:
        t1 = perf_counter()
        cam_data = cam.get_img(2, width, height)
        t2 = perf_counter()
        # print('interval: ', t2 - t1)
        if (t2 - t1) > 0.01:
            return cam_data
    
def get_datetime_str():
    now = datetime.datetime.now()
    return now.strftime('%Y%m%d-%H%M%S')	

def test_camera_bind_display_hdmi(host_idx):
    state = 'working'
     #camera start
    cam = libsrcampy.Camera()
    ret = cam.open_cam(0, host_idx, 10, width, height)
    #print("Camera open_cam return:%d" % ret)
    if(ret != 0):
        print('failed')
        state = 'stopped'

    while True:
        try:
            data = raw_input()
            if 'close' in data:
                enc.close()
                cam.close_cam()
                sys.exit(0)
            elif 'stop' in data:
                if state == 'working':
                    cam.close_cam()
                    print('stopped')
                    state = 'stopped'
                else:
                    continue
            elif 'start' in data:
                if state == 'stopped':
                    cam = libsrcampy.Camera()
                    ret = cam.open_cam(0, host_idx, 10, width, height)
                    #print("Camera open_cam return:%d" % ret)
                    if(ret != 0):
                        print('failed')
                        sys.exit(0)
                    state = 'working'
                    print('working')
                else:
                    continue
            if 'save' in data:
                if state == 'stopped':
                   continue
                if autoName:
                    nameStr = 'image-' + get_datetime_str() + '.jpg'
                else:
                    nameStr = imageUrl
                nameStr = os.path.join(imagePath, nameStr) 
                fo = open(nameStr, "wb+")
                origin_image = latest_buffer(cam)
                enc.encode_file(origin_image)
                img_data = enc.get_img()
                if img_data is not None:
                    fo.write(img_data)
                fo.close()
                print('fileready ' + nameStr)
        except (EOFError, SystemExit):
            enc.close()
            cam.close_cam()
            sys.exit(0)
        except Exception as ex:
            print("bad data: "+data)

    enc.close()
    cam.close_cam()

  
test_camera_bind_display_hdmi(0)
