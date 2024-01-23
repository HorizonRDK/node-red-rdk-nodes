
# Import library functions we need
import Hobot.GPIO as GPIO
import struct
import sys
import os
import subprocess
from time import sleep

try:
    raw_input          # Python 2
except NameError:
    raw_input = input  # Python 3

bounce = 25

if len(sys.argv) > 2:
    cmd = sys.argv[1].lower()
    pin = int(sys.argv[2])
    GPIO.setmode(GPIO.BCM)
    GPIO.setwarnings(False)
    
    if cmd == "out":
        #print("Initialised pin "+str(pin)+" to OUT")
        GPIO.setup(pin,GPIO.OUT)
        if len(sys.argv) == 4:
            GPIO.output(pin,int(sys.argv[3]))

        while True:
            try:
                data = raw_input()
                if 'close' in data:
                    sys.exit(0)
                data = int(data)
            except (EOFError, SystemExit):        # hopefully always caused by us sigint'ing the program
                GPIO.cleanup(pin)
                sys.exit(0)
            except:
                if len(sys.argv) == 4:
                   data = int(sys.argv[3])
                else:
                   data = 0
            if data != 0:
                data = 1
            GPIO.output(pin,data)
    
    
    elif cmd == "softpwm":
        try:
            freq = int(sys.argv[3])
        except:
            freq = 100

        GPIO.setup(pin,GPIO.OUT)
        GPIO.output(pin,0)
        timeinterval = 1000.0/freq
        onratio = 0
        offratio = 1
        while True:
            try:
                data = raw_input()
                if 'close' in data:
                    sys.exit(0)
                data = int(data)
            except (EOFError, SystemExit):        # hopefully always caused by us sigint'ing the program
                GPIO.cleanup(pin)
                sys.exit(0)
            except:
                print("bad data: "+data)
    
    
    elif cmd == "pwm":
        try:
            freq = int(sys.argv[3])
            if freq < 48000:
                freq = 48000
            elif freq > 192000000:
                freq = 192000000
        except:
            freq = 48000

        p = GPIO.PWM(pin, freq)
        p.ChangeDutyCycle(1)
        p.start(1)

        while True:
            try:
                data = raw_input()
                if 'close' in data:
                    sys.exit(0)
                p.ChangeDutyCycle(int(data))
            except (EOFError, SystemExit):        # hopefully always caused by us sigint'ing the program
                GPIO.cleanup(pin)
                sys.exit(0)
            except Exception as ex:
                print("bad data: "+data)


    elif cmd == "in":
        bounce = float(sys.argv[4])
        def handle_callback(chan):
            if bounce > 0:
                sleep(bounce/1000.0)
            print(GPIO.input(chan))

        if sys.argv[3].lower() == "up":
            GPIO.setup(pin,GPIO.IN,GPIO.RISING)
        elif sys.argv[3].lower() == "down":
            GPIO.setup(pin,GPIO.IN,GPIO.FALLING)
        else:
            GPIO.setup(pin,GPIO.IN)

        if bounce > 0:
            GPIO.add_event_detect(pin, GPIO.BOTH, callback=handle_callback, bouncetime=int(bounce))
        else :
            GPIO.add_event_detect(pin, GPIO.BOTH, callback=handle_callback)
        sleep(0.1)
        print(GPIO.input(pin))

        while True:
            try:
                data = raw_input()
                if 'close' in data:
                    sys.exit(0)
            except (EOFError, SystemExit):        # hopefully always caused by us sigint'ing the program
                GPIO.cleanup(pin)
                sys.exit(0)

    elif cmd == "mouse":  # catch mice button events
        f = open( "/dev/input/mice", "rb" )
        oldbutt = 0

        while True:
            try:
                buf = f.read(3)
                pin = pin & 0x07
                button = struct.unpack('3b',buf)[0] & pin # mask out just the required button(s)
                if button != oldbutt:  # only send if changed
                    oldbutt = button
                    print(button)
            except:
                f.close()
                sys.exit(0)

    elif cmd == "kbd":  # catch keyboard button events
        try:
            while not os.path.isdir("/dev/input/by-path"):
                sleep(10)
            infile = subprocess.check_output("ls /dev/input/by-path/ | grep -m 1 'kbd'", shell=True).strip()
            infile_path = "/dev/input/by-path/" + infile.decode("utf-8")
            EVENT_SIZE = struct.calcsize('llHHI')
            file = open(infile_path, "rb")
            event = file.read(EVENT_SIZE)
            while event:
                (tv_sec, tv_usec, type, code, value) = struct.unpack('llHHI', event)
                #if type != 0 or code != 0 or value != 0:
                if type == 1:
                    # type,code,value
                    print("%u,%u" % (code, value))
                event = file.read(EVENT_SIZE)
            print("0,0")
            file.close()
            sys.exit(0)
        except:
            file.close()
            sys.exit(0)


elif len(sys.argv) > 1:
    cmd = sys.argv[1].lower()
    if cmd == "rev":
        print(GPIO.VERSION)
    elif cmd == "ver":
        print(GPIO.VERSION)
    elif cmd == "info":
        print({"TYPE": GPIO.VERSION})
    else:
        print("Bad parameters - in|out|pwm|buzz|byte|borg|mouse|kbd|ver|info {pin} {value|up|down}")
        print("  only ver (gpio version) and info (board information) accept no pin parameter.")

else:
    print("Bad parameters - in|out|pwm|buzz|byte|borg|mouse|kbd|ver|info {pin} {value|up|down}")
