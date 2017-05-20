# converts indented lisp to parenthesized lisp
# think python looping, but for lisp

import sys
import re

def main():
  file = open(sys.argv[1], "r" )
  out = ""
  last = sanitize(file.readline())
  last_num = findspace(last)
  for next in file:
      next = sanitize(next)
      if next == '':
        continue;
      next_num = findspace(next)
      if last_num > next_num:
        out += ' '+last[last_num:] + (last_num-next_num)/2*')'
      elif last_num < next_num:
        out += ' (' + last[last_num:]
      else:
        out += ' '+last[last_num:]
      last = next
      last_num = next_num
  out += ' '+last[last_num:] + (last_num)/2*')'
  print(out)
  file.close()

def sanitize(str):
  str = str.replace('\n','')
  if str.find(';') != -1:
        str = str[0:str.find(';')]
  return str

whitespace_matcher = re.compile(r'^\s+')
def findspace(str):
  match = whitespace_matcher.search(str)
  if(match):
    return len(match.group())
  else:
    return 0
  
main();
