# Runs a score function over stack overflow tags; made with the goal of doing simple analytics
# think seeing which tags have the longest titles on average
# Note: You must send a ^C to get the output from this
# To run, first install https://github.com/lucjon/Py-StackExchange

import stackexchange
import sys

def score(q):
  return len(q.title)

if __name__ == "__main__":
  so = stackexchange.StackOverflow()
  so.impose_throttling = True
  q = so.questions(pagesize=50,body=True)
  scores = dict();
  try:
    for t in q:
      temp = score(t)
      for tag in t.tags:
        if not scores.get(tag):
          scores[tag] = [0,0]
        scores[tag][0]+=temp
        scores[tag][1]+=1
  except KeyboardInterrupt:
    out = dict()
    for t in scores:
      out[t]=scores[t][0]/scores[t][1]
    for w in sorted(out, key=out.get, reverse=True):
      print w, ',', out[w]
    sys.exit()
