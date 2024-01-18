import sys
try:
    from hobot_vio import libsrcampy
    sys.exit(0)
except ImportError:
    sys.exit(1)
