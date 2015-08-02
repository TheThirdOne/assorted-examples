var makeGame = function(w,h){
  var map = [];
  map.w = w;
  map.h = h;
  for(var x = 0; x < w; x++){
    map[x] = [];
    for(var y = 0; y < h; y++){
      map[x][y] = 0;
    }
  }
  var player = {x:w/2|0,y:h/2|0,length:4};
  return {map:map,player:player};
};
var left = function(game){
  run(game,game.player.x-1,game.player.y);
}
var right = function(game){
  run(game,game.player.x+1,game.player.y);
}
var up = function(game){
  run(game,game.player.x,game.player.y+1);
}
var down = function(game){
  run(game,game.player.x,game.player.y-1);
}
var run = function(game,x,y){
  if(check(game.map, x,y)){
    clear(game.map);
    if(game.map[x][y] === -1){
      game.player.length += 1
    }
    game.map[x][y] = game.player.length;
    game.player.x = x;
    game.player.y = y;
  }else{
    return false;
  }
}
var check = function(map,x,y){
  if(map.w <= x || map.h <= y || x < 0 || y < 0){
    return false;
  }
  return (map[x][y] || 0) <= 0;
}
var clear = function(map){
  for(var x = 0; x < map.w; x++){
    for(var y = 0; y < map.h; y++){
      map[x][y] = (map[x][y] > 0)?map[x][y]-1:map[x][y];
    }
  }
}
var vision = function(game){
  var distance = 5;
  var out = [];
  for(var x = game.player.x - distance; x < game.player.x + distance; x++){
    out[x + distance - game.player.x] = [];
    for(var y = game.player.y - distance;y < game.player.y + distance; y++){
      if(x < 0 || x >= game.map.w || y < 0 || y >= game.map.h){
        out[x + distance - game.player.x][y + distance - game.player.y] = 1;
      }else if(game.map[x][y] > 0){
        out[x + distance - game.player.x][y + distance - game.player.y] = game.map[x][y]/game.player.length;
      }else{
        out[x + distance - game.player.x][y + distance - game.player.y] = game.map[x][y];
      }
    }
  }
  return out;
}
//here down is just for humans
var draw = function(game){
  var canvas = document.getElementById("canvas");
  var ctx = canvas.getContext("2d");
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0,0,canvas.width,canvas.height);
  var width = canvas.width/game.map.w;
  var height = canvas.height/game.map.h;
  for(var x = 0; x < game.map.w; x++){
    for(var y = 0; y < game.map.h; y++){
      game.map[x][y]
      if(game.map[x][y] > 0){
        ctx.fillStyle = "#000000";
      }else if(game.map[x][y] === -1){
        ctx.fillStyle = "#FFFF00";
      }else{
        ctx.fillStyle = "#FFFFFF";
      }
      ctx.fillRect(x*width,(game.map.h-1-y)*height,width,height);
    }
  }
}
var keycodes = [];
var ondown = [];
ondown[87] = function(){up(game);draw(game);}
ondown[83] = function(){down(game);draw(game);}
ondown[65] = function(){left(game);draw(game);}
ondown[68] = function(){right(game);draw(game);}
document.onkeydown = function(e){
  if(!keycodes[e.keyCode]){
    console.log(e.keyCode)
    keycodes[e.keyCode] = true;
    if(ondown[e.keyCode]){
      ondown[e.keyCode]();
    }
  }
}
document.onkeyup = function(e){
  keycodes[e.keyCode] = false;
}
