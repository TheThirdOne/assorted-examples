var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");
var width = canvas.width;
var height = canvas.height;
function generateGlyph(arr){
  //fill in empty arrays
  var paths = [];
  for(var i = 0; i < arr.length;i++){
    paths[i] = [];
  }
  //minimizing distances
  for(var i = 0; i < arr.length;i++){
    var min = -1,val = Infinity;
    for(var j = 0; j < arr.length;j++){
      var tmp = (arr[j].x-arr[i].x)*(arr[j].x-arr[i].x) + (arr[j].y-arr[i].y)*(arr[j].y-arr[i].y);
      if(tmp < val && paths[i].indexOf(j) === -1 && i !== j){
        val = tmp;
        min = j;
      }
    }
    if(min != -1){
      paths[i].push(min);
      paths[min].push(i);
    }
  }
  //list out drawn paths
  var list = [];
  while(true){
    var out = [];
    var min = -1, val = Infinity;
    for(var i = 0; i < paths.length;i++){
      if(paths[i].length === 1){
        min = i;
        break;
      }
      if(paths[i].length < val && paths[i].length > 0){
        min = i;
        val = paths[i].length;
      }
    }
    if(min === -1){
      break;
    }
    var current = min;
    while(paths[current].length){
      out.push(current);
      var tmp = paths[current].shift();
      paths[tmp].splice(paths[tmp].indexOf(current),1);
      current = tmp;
    }
    out.push(current);
    list.push(out);
  }
  return {points:arr,order:list}
}
function drawGlyph(glyph,offsetX,offsetY){
  offsetX = offsetX || 0;
  offsetY = offsetY || 0;
  ctx.beginPath();
  for(var i = 0; i < glyph.order.length;i++){
    ctx.moveTo(glyph.points[glyph.order[i][0]].x+offsetX,glyph.points[glyph.order[i][0]].y+offsetY);
    for(var j = 1; j < glyph.order[i].length;j++){
      ctx.lineTo(glyph.points[glyph.order[i][j]].x+offsetX,glyph.points[glyph.order[i][j]].y+offsetY);
    }
  }
  ctx.stroke();
}
function generatePoints(length){
  var arr = [];
  for(var i = 0; i < length;i++){
    arr.push({x:Math.random()*30|0,y:Math.random()*30|0});
  }
  return arr
}
function expandPoints(arr,width,height){
  var minX = Infinity, maxX = -Infinity,
      minY = Infinity, maxY = -Infinity;
  for(var i = 0; i < arr.length;i++){
    if(arr[i].x < minX){
      minX = arr[i].x
    }
    if(arr[i].x > maxX){
      maxX = arr[i].x
    }
    if(arr[i].y < minY){
      minY = arr[i].y
    }
    if(arr[i].y > maxY){
      maxY = arr[i].y
    }
  }
  for(var i = 0; i < arr.length;i++){
    arr[i].x = (arr[i].x - minX)/(maxX-minX)*width|0;
    arr[i].y = (arr[i].y - minY)/(maxY-minY)*height|0;
  }
}
function drawAlphabet(num,w,h){
  for(var i = 0; i < num; i++){
    var glyph = generateGlyph(generatePoints(7));
    expandPoints(glyph.points,width/(w+2),height/(h+2));
    drawGlyph(glyph,((i%w)*width/w|0)+10,(Math.floor(i/h)*height/h|0)+10);
  }
  ctx.beginPath();
  for(var i = 0; i < w+1; i++){
    ctx.moveTo(i*width/w|0,0)
    ctx.lineTo(i*width/w|0,Math.ceil(num/w)*height/h|0)
  }
  for(var i = 0; i < Math.ceil(num/w)+1; i++){
    ctx.moveTo(0,    i*height/h|0)
    ctx.lineTo(width,i*height/h|0)
  }
  ctx.stroke();
}
drawAlphabet(30,7,7);
