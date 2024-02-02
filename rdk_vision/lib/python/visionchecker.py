import sys
try:
    import numpy as np
    import cv2
    from hobot_dnn import pyeasy_dnn
    sys.exit(0)
except ImportError:
    sys.exit(1)