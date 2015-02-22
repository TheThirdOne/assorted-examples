
self.addEventListener('message', function(e) {
  var data = e.data;
  self.postMessage('test');
  evaluate(data,1);
  
}, false);
send = function(){
  self.postMessage(boards);
};


var count = 0;
var evaluate = function(board,level){
  if(boards[hash(board)] !== undefined){
    return boards[hash(board)];
  }
  var tmp = win(board);
  if(tmp !== undefined){
    boards[hash(board)] = tmp;
    count++;
    send();
    return tmp;
  }
  
  var temp,canTie = false;
  for(var i = 0; i < 7;i++){
    tmp = drop(i,board.player,board);
    if(!tmp){
      continue;
    }
    temp = evaluate(tmp,level+1);
    if(temp === board.player){
       boards[hash(board)] = board.player;
       send();
       return board.player;
    }
    if(temp === 0){
      canTie = true;
    }
  }
  if(canTie){
    boards[hash(board)] = 0;
    count++;
    send();
    return 0;
  }
  boards[hash(board)] = -board.player;
  count++;
  send();
  return -board.player;
};

var drop = function(index,player,board){
  if(board[index].length > 5){
    return;
  }
  board = JSON.parse(JSON.stringify(board));
  board[index][board[index].length] = player;
  board.player = -player;
  return board;
};

var boards = {};

var hash = function(board){
  var temp = board.map(function(el){
    var out = 0;
    for(var i = 0; i < 6;i++){
      out += Math.pow(3,i)*((el[i]||0)+1);
    }
    return out;
  });
  var out = '' + board.player;
  for(var i = 0; i < 7; i++){
    out += btoa(temp[i]);
  }
  return out;
};

var win = function(board){
  var tmp,temp;
  
  //vertical
  for(var i = 0; i < 7; i++){
    tmp = board[i][0];
    for(var k = 1; k < 6;k++){
      temp = board[i][k];
      if(tmp/Math.abs(tmp) === temp){
        tmp += temp;
      }else if(temp){
        tmp = temp;
      }else{
        break;
      }
      if(tmp > 3){
        return 1;
      }else if(tmp < -3){
        return -1;
      }
    }
  }
  
  //horizontal
  for(k = 0; k < 7; k++){
    tmp = 0;
    for(i = 0; i < 6;i++){
      temp = board[k][i];
      if(!tmp){
        tmp = temp;
      }else if(tmp/Math.abs(tmp) === temp){
        tmp += temp;
      }else if(temp){
        tmp = temp;
      }
      if(tmp > 3){
        return 1;
      }else if(tmp < -3){
        return -1;
      }
    }
  }
  //top left to bottom right
  var starting = [[0,3],[0,4],[0,5],[1,5],[2,5],[3,5]],index;
  for(i = 0; i < 6; i++){
    index = starting[i];
    tmp = 0;
    for(k = 0; k < 6; k++){
      temp = board[index[0]][index[1]];
      if(!tmp){
        tmp = temp;
      }else if(tmp/Math.abs(tmp) === temp){
        tmp += temp;
      }else if(temp){
        tmp = temp;
      }
      if(tmp > 3){
        return 1;
      }else if(tmp < -3){
        return -1;
      }
      index[0]++;
      index[1]--;
      if(index[0] > 6){
        break;
      }
    }
  }
  
  //top right to bottom left
  var starting = [[6,3],[6,4],[6,5],[5,5],[4,5],[2,5]],index;
  for(i = 0; i < 6; i++){
    index = starting[i];
    tmp = 0;
    for(k = 0; k < 6; k++){
      temp = board[index[0]][index[1]];
      
      if(!tmp){
        tmp = temp;
      }else if(tmp/Math.abs(tmp) === temp){
        tmp += temp;
      }else if(temp){
        tmp = temp;
      }
      if(tmp > 3){
        return 1;
      }else if(tmp < -3){
        return -1;
      }
      index[0]--;
      index[1]--;
      if(index[0] < 1){
        break;
      }
    }
  }
  
  //tie
  for(i = 0; i < 7; i++){
    tmp += board[i].length;
  }
  if(tmp > 41){
    return 0;
  }
  
  return;
};
