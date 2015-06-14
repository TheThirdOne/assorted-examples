function generateEquator(width,a,b){
  var east = a || seedRandom(),west = b || seedRandom();
  var map = [];
  map[0] = east;
  map[width] = west;
  map[2*width] = east;
  var steps = Math.floor(Math.log2(width));
  for(var i = steps; i > 0; i--){
    var stepSize = Math.pow(2,i);
    for(var k = stepSize/2;k < width*2; k += stepSize){
      if(!map[k]){
        map[k] = (map[k-stepSize/2]+map[k+stepSize/2])/2 + (Math.random()-.5)*400*stepSize/width
      }
    }
  }
  return map;
}

var maxDiff = 50, min = 100;
function seedRandom(){
  return Math.random()*maxDiff+min;
}

var canvas = document.getElementById("cancan");
var ctx = canvas.getContext("2d");
function drawE(map){
  ctx.beginPath();
  ctx.clearRect(0,0,canvas.width,canvas.height)
  ctx.moveTo(0, map[0]*100);
  for(var i = 1; i < map.length; i++){
    ctx.lineTo(canvas.width/map.length*i, map[i%map.length]);
    console.log(canvas.width/map.length*i, map[i%map.length]);
  }
  ctx.stroke();
  return map;
}

function generateMap(width){
  var polar = generateEquator(width)
  var map = [];
  for(var i = 0; i <= width*2;i++){
    map[i]=[]
  }
  for(var i = 0; i < polar.length;i++){
    map[0][i] = polar[i]; //polar
    //map[width][i] = equator[i]; //equator
    map[width*2][i] = polar[i]; //polar
    map[i][0] = polar[0]; //west pole
    map[i][2*width] = polar[2*width-1] //east pole
  }
  
  var steps = Math.floor(Math.log2(width));
  for(var stepSize = width*2, i = 0; stepSize > 1; stepSize /= 2, i++){
    for(var k = stepSize/2; k < width*2; k += stepSize){
      for(var j = stepSize/2; j < width*2; j += stepSize){
        
        if(!map[k][j]){
          map[k][j] = getDiamond(map,k,j,stepSize/2);
        }
      }
    }
    for(var k = 0; k <= width*2; k += stepSize/2){
      for(var j = stepSize/2; j <= width*2-stepSize/2; j += stepSize){
        if(!map[k][j]){
          map[k][j] = getSquare(map,k,j,stepSize/2) + (Math.random()-.5)*400*stepSize/width;
        }
      }
      k += stepSize/2
      if(k <= width*2){
        for(var j = 0; j <= width*2; j += stepSize){
          if(!map[k][j]){
            map[k][j] = getSquare(map,k,j,stepSize/2) + (Math.random()-.5)*400*stepSize/width;
          }
        }
      }
      
      
    }
  }
  return map;
  
}
function getDiamond(map,x,y,stepSize){
  return (map[x-stepSize][y-stepSize]+map[x-stepSize][y+stepSize]+map[x+stepSize][y-stepSize]+map[x+stepSize][y+stepSize])/4
}
function getSquare(map,x,y,stepSize){
  return (map[x-stepSize][y]+map[x+stepSize][y]+map[x][y-stepSize]+map[x][y+stepSize])/4
}
function drawMap(map,normal){
  var size = canvas.height/map.length;
  var last = ctx.fillStyle;
  for(var k = 0; k < map.length;k++){

    for(var i = 0; i < map[0].length;i++){
      val = map[i|0][k]|0;
      var r,g,b;
      if(val < 90){
        r = 30;g = 30;b = 200;
      }else if(val < 100){
        r = 239;g = 210;b = 121;
      }else if(val < 120){
        r = 30;g = 200;b = 30;
      }else if(val < 180){
        r = 10;g = 180;b = 10;
      }else if(val < 200){
        r = g = b = val;
      }else if(val < 250){
        r = g = b = val;
      }else {
        r = g = b = val;
      }
      ctx.fillStyle = 'rgba(' + r + ',' + g + ',' + b + ',1)';
      ctx.fillRect(size*i, size*k, size+1, size+1);
      //ctx.fillRect(size*(i-1)+size*map.length, size*k, size+1, size+1);
    }
  }
}

function smooth(map){
  var out = []
  out[0] = [];
  out[map.length-1] = [];
  for(var i = 0; i < map.length-1;i++){
    out[i]=[];
    out[0][i] = map[0][i];
    out[i][0] = map[i][0];
    out[i][map.length-1] = map[i][map.length-1];
    out[map.length-1][i] = map[map.length-1][i];
  }
  out[map.length-1][map.length-1] = map[map.length-1][map.length-1];
  console.log(map[map.length-1][7])
  for(var i = 1; i < map.length-1;i++){
    for(var j = 1; j < map.length-1;j++){
      out[i][j]=map[i-1][j-1]+map[i][j-1]+map[i+1][j-1]+
                map[i-1][j]  +8*map[i][j]+map[i+1][j]+
                map[i-1][j+1]+map[i][j+1]+map[i+1][j+1];
      out[i][j]/=16;
    }
  }
  return out;
}
