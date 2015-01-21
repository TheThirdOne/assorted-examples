var solver = (function(){
  var field = [[0,0,8, 0,0,0, 0,0,6],
               [0,0,7, 9,0,6, 0,0,8],
               [0,0,0, 0,0,8, 5,9,0],
               
               [0,0,1, 6,0,0, 0,2,4],
               [0,0,9, 0,0,0, 3,0,0],
               [2,4,0, 0,0,3, 1,0,0],
               
               [0,1,2, 3,0,0, 0,0,0],
               [6,0,0, 5,0,9, 8,0,0],
               [8,0,0, 0,0,0, 2,0,0]];
  
  var hints = [[],[],[], [],[],[], [],[],[]];

  var setField = function(f){
    field = f;
  };
  var getField = function(f){
     return field;
  };
  
  var checkRow = function(y){
    var out = [1,2,3,4,5,6,7,8,9];
    for(var i = 0; i < 9; i++){
      if(out.indexOf(field[y][i])!==-1){
        out.splice(out.indexOf(field[y][i]),1);
      }
    }
    return out;
  };
  
  var checkColumn = function(x){
    var out = [1,2,3,4,5,6,7,8,9];
    for(var i = 0; i < 9; i++){
      if(out.indexOf(field[i][x])!==-1){
        out.splice(out.indexOf(field[i][x]),1);
      }
    }
    return out;
  };
  
  var checkBox = function(x,y){
    var out = [1,2,3,4,5,6,7,8,9];
    x = Math.floor(x/3); y = Math.floor(y/3);
    for(var i = 3*x; i < 3*(x+1); i++){
      for(var k = 3*y; k < 3*(y+1); k++){
        if(out.indexOf(field[k][i])!==-1){
          out.splice(out.indexOf(field[k][i]),1);
        }
      }
    }
    return out;
  };
  
  var and = function(ar1, ar2){
    var out = [];
    for(var i = 1; i < 10; i++){
      if(ar1.indexOf(i) !== -1 && ar2.indexOf(i) !== -1 ){
        out.push(i);
      }
    }
    return out;
  };
  
  var hint = function(x,y){
    return and(and(checkColumn(x),checkRow(y)),checkBox(x,y));
  };
  
    var hintRow = function(x,y){
    var out = [];
    for(var i = 0; i < 9; i++){
      if(i === x || !hints[y][i]){
        continue;
      }
      out = or(out,hints[y][i]);
    }
    return out;
  };
  
  var hintColumn = function(x,y){
    var out = [1,2,3,4,5,6,7,8,9];
    for(var i = 0; i < 9; i++){
      if(i === y || !hints[i][x]){
        continue;
      }
      out = or(out,hints[i][x]);
    }
    return out;
  };
  
  var hintBox = function(x,y){
    var out = [];
    var l = Math.floor(x/3), p = Math.floor(y/3);
    for(var i = 3*l; i < 3*(l+1); i++){
      for(var k = 3*p; k < 3*(p+1); k++){
        if((i === x && k === y ) || !hints[k][i]){
          continue;
        }
        out = or(out,hints[k][i]);
      }
    }
    return out;
  };

  
  var not = function(ar1, ar2){
    for(var i = 1; i < 10; i++){
      if(ar1.indexOf(i) !== -1 && ar2.indexOf(i) === -1 ){
        return i;
      }
    }
    return -1;
  };
  var or = function(ar1, ar2){
    var out = [];
    for(var i = 1; i < 10; i++){
      if(ar1.indexOf(i) !== -1 || ar2.indexOf(i) !== -1 ){
        out.push(i);
      }
    }
    return out;
  };
  
  var deduce = function(x,y){
    var tmp = not(hints[y][x],hintRow(x,y));
    if(tmp !== -1){
      return tmp;
    }
    tmp = not(hints[y][x],hintColumn(x,y));
    if(tmp !== -1){
      return tmp;
    }
    tmp = not(hints[y][x],hintBox(x,y));
    return tmp;
  };
  
  var solveStep = function(){
    var tmp;
    hints = [[],[],[], [],[],[], [],[],[]];
    var out = [];
    for(var i = 0; i < 9;i++){
      for(var k = 0; k < 9;k++){
        if(!field[k][i]){
          tmp = hint(i,k);
          if(tmp.length === 1){
            field[k][i] = tmp[0];
            out.push([i+1,k+1,tmp[0]]);
          }else{
            hints[k][i] = tmp;
          }
        }
      }
    }
    for(var p = 0; p < 9;p++){
      for(var l= 0; l < 9;l++){
        if(!field[l][p]){
          tmp = deduce(p,l);
          if(tmp !== -1){
            field[l][p] = tmp;
            out.push([p+1,l+1,tmp]);
          }
        }
      }
    }
    return out;
  };
  
  var solve = function(){
    var out = [];
    var last = [0];
    while (last.length){
      last = solveStep();
      out = out.concat(last);
    }
    return out;
  };
  
  var display = function(){
    var out = [];
    for(var i = 0; i < 9; i++){
      out[i] = field[i].join('');
    }
    return out.join('\n');
  };
  
  return {set:setField,get:getField,hint:hint,solve:solve,display:display};
})();
