import cv2
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

def latest_buffer(cap):
    while True:
        t1 = perf_counter()
        _ ,frame = cap.read()
        t2 = perf_counter()
        #print('interval: ', t2 - t1)
        if (t2 - t1) > 0.01:
            return frame

def get_datetime_str():
    now = datetime.datetime.now()
    return now.strftime('%Y%m%d-%H%M%S')

def start_camera():
    cap = cv2.VideoCapture(8)
    if(not cap.isOpened()):
        return cap
    codec = cv2.VideoWriter_fourcc( 'M', 'J', 'P', 'G' )
    cap.set(cv2.CAP_PROP_FOURCC, codec)
    cap.set(cv2.CAP_PROP_FPS, 10)
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, width)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, height)
    return cap
    

def take_photo():
    state = 'working'
     #camera start
    cap = start_camera()
    if(not cap.isOpened()):
        print('failed')
        state = 'stopped'    

    while True:
        try:
            data = raw_input()
            if 'close' in data:
                cap.release()
                sys.exit(0)
            elif 'stop' in data:
                if state == 'working':
                    cap.release()
                    print('stopped')
                    state = 'stopped'
                else:
                    continue
            elif 'start' in data:
                if state == 'stopped':
                    cap = start_camera()
                    if(not cap.isOpened()):
                        print('failed')
                        state = 'stopped'
                    else:
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
                latest_buffer(cap)
                frame = latest_buffer(cap)
                if frame is not None:
                    cv2.imwrite(nameStr, frame)
                    print('fileready ' + nameStr)
        except (EOFError, SystemExit):
            sys.exit(0)
            cap.release()
        except Exception as ex:
            print("bad data: "+data)
            cap.release()
    cap.release()


take_photo()