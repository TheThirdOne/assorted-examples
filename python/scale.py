from PIL import Image
img = Image.open(sys.argv[1])
size = sys.argv[2], sys.argv[3]
out = img.resize(size)
out.save(sys.argv[4])
