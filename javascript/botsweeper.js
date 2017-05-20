var debug = false;
var createGrid = function(width, height, block) {
    var grid = [];

    for (var n=0; n < width; n++) {
      grid[n] = [];
      for (var m=0; m < height; m++) {
        grid[n][m] = block;
      }
    }
    return grid;
};
var _between = function(v,a,b) { return (v>=a) && (v<=b); };
var generateMines = function(grid, x, y, mine_count) {
    var grid_x = grid.length, grid_y = grid[0].length;
    var mine_value = -(mine_count * 2), mine_x, mine_y;
    var m, n;
    for (n=-1; n<2; n++) {
        for (m=-1; m<2; m++) { //to make all things around the cursor safe
          if (_between(x+n,0,grid_x-1) && _between(y+m,0,grid_y-1)) {
            grid[x + n][y + m]=mine_value;
          }
        }
      }
    for (var k=0; k<mine_count; k++) {
      while (true) {
        mine_x = Math.floor(Math.random()*grid_x);
        mine_y = Math.floor(Math.random()*grid_y);
        
        // TODO : add more randomness and strategies here
        
        if (0 <= grid[mine_x][mine_y]) {
          break;
        }
      }
      for (n=-1; n<2; n++) {
        for (m=-1; m<2; m++) {
          if (0 == n && 0 == m) {
            grid[mine_x][mine_y] = mine_value;
          } else if (_between(mine_x+n,0,grid_x-1) && _between(mine_y+m,0,grid_y-1)) {
            grid[mine_x + n][mine_y + m]++;
          }
        }
      }
    }
    for (n=-1; n<2; n++) { //to make all things around the cursor non-mines
        for (m=-1; m<2; m++) {
          if (_between(x+n,0,grid_x-1) && _between(y+m,0,grid_y-1)) {
            grid[x + n][y + m]-=mine_value;
          }
        }
      }
    return grid;
};
function Game(x,y,width,height,mines){
    var grid = generateMines(createGrid(width,height,0),x,y,mines);
    var revealed = createGrid(width,height,' ');
    revealed[x][y]=0;
    if(debug){
      this.getGrid = function() {
          return grid;
      };
    }
    this.getRevealed = function() {
        return revealed;
    };
    this.click = function(x,y){
      if(grid[x][y] >= 0){
        revealed[x][y] =grid[x][y];
      }else{
        console.log('Failure',x,y);
      }
    };
}
function printGrid(grid,cnsl){
    if(cnsl){
        for(var i = 0; i < grid.length;i++){
            var str = '';
            for (var k = 0; k <grid[i].length; k++) {
                str+=','+grid[i][k];
            }
        console.log(str);
        }
    }else{
        var str = '<table border="1" cellspacing="1" cellpadding="5">';
        for(var i = 0; i < grid.length;i++){
            str += '<tr>';
            for (var k = 0; k <grid[i].length; k++) {
                str+='<td '+color(grid[i][k])+'">'+grid[i][k]+'</font></td>';
            }
            str += '</tr>';
        }
        str+="</table>";
        var div = document.getElementById('container');
        div.innerHTML += str;
    }

}
function printGame(game,cnsl){
    var div = document.getElementById('container');
    div.innerHTML = "";
    if(debug){
      printGrid(game.getGrid(),cnsl);
    }
    printGrid(game.getRevealed(),cnsl);
}
function bgcolor(value){
  var bg = 'bgcolor="#FFFFFF"';
  if(value < 0)
    bg = 'bgcolor="#FF0000"';
  return bg;
}
function fgcolor(value){
  switch(value){
    case 1:
      return '3366FF';
    case 2:
      return '008800';
    case 3:
      return 'DD2222';
    case 4:
      return '3366FF';
    case 5:
      return '3366FF';
    default:
      return '000000';
  }
}
function color(value){
  return bgcolor(value)+'><font color="#'+fgcolor(value)+'"';
}