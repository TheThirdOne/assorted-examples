function getColor(ratio){
  var r = 230*Math.sqrt(ratio)|0;
  var g = 230*Math.sqrt(1-ratio)|0;
  return "rgb("+r+","+g+",0)";
}
var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");
var width = canvas.width;
var height = canvas.height;
var map = [];
for(var i = 0; i < 50;i++){
  map[i] = [];
}
map[9][9]  = -1;
map[9][10] = -1;
map[9][11] = -1;
map[9][12] = -1;
map[9][13] = -1;
map[9][14] = -1;
map[9][15] = -1;
map[9][16] = -1;
map[9][17] = -1;
map[9][18] = -1;
map[9][19] = -1;

map[9][19] = -1;
map[8][19] = -1;
map[7][19] = -1;
map[6][19] = -1;
map[5][19] = -1;
map[4][19] = -1;
map[3][19] = -1;
map[2][19] = -1;
map[1][19] = -1;
map[0][19] = -1;

map[10][9]  = -1;
map[11][9]  = -1;
map[12][9]  = -1;
map[13][9]  = -1;
map[14][9]  = -1;
map[15][9]  = -1;

map[15][10]  = -1;
map[15][11]  = -1;
map[15][12]  = -1;
map[15][13]  = -1;
map[15][14]  = -1;
map[15][15]  = -1;
var down = false;
canvas.onmousedown = function(){
  console.log('downs')
  down = true;
};
canvas.onmouseup = function(){
  down = false;
}
canvas.onmouseout = function(){
  down = false;
}
canvas.onmousemove = function(e){
  if(down){
    map[e.offsetX/width*50|0][e.offsetY/height*50|0] = -1;
    var start = new Date().getTime();
    gradient(map,{x:30,y:30});
    drawMap(map)
    console.log(new Date().getTime() - start)
  }
}
function drawMap(map){
  for(var x = 0; x < 50;x++){
    for(var y = 0; y < 50;y++){
      if(map[x][y] === -1){
        ctx.fillStyle = "#000";
      }else if(map[x][y] !== undefined){
        ctx.fillStyle = getColor(map[x][y]/map.max);
      }else{
        ctx.fillStyle = "#EED202";
      }
      ctx.fillRect(x*width/50,y*height/50,width/50,height/50);
    }
  }
}
function clearGradient(map){
  for(var x = 0; x < 50;x++){
    for(var y = 0; y < 50;y++){
      if(map[x][y] !== -1){
        map[x][y] = undefined;
      }
    }
  }
}
function drawLine(line){
  ctx.beginPath();
  ctx.moveTo((line[0].x+.5)*width/50,(line[0].y+.5)*height/50)
  for(var i = 0; i < line.length;i++){
    ctx.lineTo((line[i].x+.5)*width/50,(line[i].y+.5)*height/50)
  }
  ctx.stroke();
}
function gradient(map,from){
  clearGradient(map);
  from.from = 1;
  map.max = 0;
  var i = 0;
  var tempPoints = [from];
  var points = [ [1,1], [1,0], [1,-1],
                 [0,1],        [0,-1],
                [-1,1],[-1,0],[-1,-1]];
  map[from.x][from.y] = 1;
  var k = 0;
  while(tempPoints.length > 0){
    var temp = tempPoints.shift();
    
    if (temp.from > map.max){
      map.max = map[temp.x][temp.y];
    }
    for(var i = 0; i < points.length; i++){
      var distance = map[temp.x][temp.y]+Math.sqrt(points[i][0]*points[i][0]+points[i][1]*points[i][1])
      var testVal = testPoint(map,temp.x+points[i][0],temp.y+points[i][1])
      
      if(testVal === undefined || testVal > distance ){
        map[temp.x+points[i][0]][temp.y+points[i][1]] = distance;
      }
      if(testVal === undefined){
        tempPoints.push({x:temp.x+points[i][0],
                         y:temp.y+points[i][1],
                         from:temp.from+distance});
      }
    }
  }
}
function pathFind(map,to){
  var line = [];
  var points = [ [1,1], [1,0], [1,-1],
                 [0,1],        [0,-1],
                [-1,1],[-1,0],[-1,-1]];
  var k = 0;
  while(map[to.x][to.y] !== 0 && k < 100){
    k++;
    line.push(to);
    var vals = points.map(function(el){
      return testPoint(map,to.x+el[0],to.y+el[1])
    });
    var min = Infinity;
    var minIndex = 0;
    
    for (var i = 0; i < vals.length; i++) {
        if (vals[i] < min && vals[i] >= 0 && vals[i] !== false) {
            min = vals[i];
            minIndex = i;
        }
    }
    console.log(minIndex,to.x+points[minIndex][0],to.y+points[minIndex][1],map[to.x+points[minIndex][0]][to.y+points[minIndex][1]])
    to = {x:to.x+points[minIndex][0],y:to.y+points[minIndex][1]};
  }
  line.push(to);
  return line
}
function testPoint(map,x,y){
  return y >= 0 && x >= 0 && y < 50 && x < 50 && map[x][y];
}
gradient(map,{x:30,y:30});
drawMap(map)
