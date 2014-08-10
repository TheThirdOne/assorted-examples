def _letter2number(letter):
  if letter == '-':
    return 2
  elif letter == '.':
    return 1
  return 0
  
def _binary(num):
  return '1'*num

def _addText(c):
  return 'byte %' + c + ', 150'

def fromDots(str):
  return fromNum(map(_letter2number,str))
  
def fromNum(arr):
  print map(_binary,arr)
  return map(int,'0'.join(map(_binary,arr)))
  
def toByte(arr):
  size = 8
  out = ''
  for i in range(8):
    arr.append(0)
  arr = map(str,arr)
  for i,val in enumerate(arr):
    out += ('0'*size)[min(i,size):] + ''.join(arr[max(0,i-size):i]) + '\n'
  out += ('0'*size)
  return '\n'.join(map(_addText,out.split('\n')))