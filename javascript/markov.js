var distance = 4;
function train(chain,word){
  for(var i = 0; i < word.length;i++){
    var start = (i-distance > 0)?i-distance:0;
    var leadUp = word.slice(start,i);
    chain[leadUp] = chain[leadUp] || {};
    chain[leadUp][word[i]] = (chain[leadUp][word[i]] || 0)+1;
  }
  var start = (word.length-distance > 0)?word.length-distance:0;
  var leadUp = word.slice(start,word.length);
  chain[leadUp] = chain[leadUp] || {};
  chain[leadUp]["end"] = (chain[leadUp]["end"]||0)+1;
}
function generate(chain){
  var interim = "";
  var i = 0;
  loop:
  while(i < 20){
    var start = (i-distance > 0)?i-distance:0;
    var leadUp = interim.slice(start,i);
    var temp = chain[leadUp];
    var total = 0;
    for(var link in temp){
      total += temp[link];
    }
    var random = Math.random()*total;
    for(var link in temp){
      random -= temp[link];
      if(random <= 0){
        if(link === 'end'){
          break loop;
        }
        interim += link;
        break;
      }
    }
    console.log(interim);
    i++;
  }
  return interim;
}
