import sys
try:
    import Hobot.GPIO as GPIO
    sys.exit(0)
except ImportError:
    sys.exit(1)
