from PIL import Image
import sys
img = Image.open(sys.argv[1])
size = int(sys.argv[2]), int(sys.argv[3])
out = img.resize(size)
out.save(sys.argv[4])
