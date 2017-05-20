function Solver(game){
  this.game = game;
  this.revealed = game.getRevealed();
  this.width = this.revealed.length;
  this.height = this.revealed[0].length;
  this.bombs = createGrid(this.width,this.height,false);
  printGame(this.game);
}
Solver.prototype.update = function(){
  this.revealed = game.getRevealed();
};
Solver.prototype.solve = function(){
  var score = 1;
  while(score > 0){
    score = 0;
    for(var i = 0; i<this.width;i++){
        for (var k = 0; k < this.height; k++) {
          var tmp = this.countBombs(i,k);
          if(this.revealed[i][k] !== ' ' && (this.revealed[i][k] - tmp[0] === 0) && tmp[1] !== 0){
            this.clear(i,k);
            score++;
          }else if(this.revealed[i][k] - tmp[0]=== tmp[1] && tmp[1] !== 0){
            score++;
            console.log('bomb',i,k,tmp);
            this.mark(i,k);
          }
        }
    }
  }
  printGame(this.game);
};
Solver.prototype.mark = function(x,y){
    for (n=-1; n<2; n++) {
        for (m=-1; m<2; m++) {
          if (_between(x+n,0,this.width-1) && _between(y+m,0,this.height-1)) {
            if(this.revealed[x+n][y+m]===' '&&(n !== 0 || m !==0)){
                this.bombs[x+n][y+m] = true;
                
            }
          }
        }
    }
};
Solver.prototype.clear = function(x,y){
    for (n=-1; n<2; n++) {
        for (m=-1; m<2; m++) {
          if (_between(x+n,0,this.width-1) && _between(y+m,0,this.height-1)) {
            if(!this.bombs[x+n][y+m]&&(n !== 0 || m !==0)){
                this.game.click(x+n,y+m);
            }
          }
        }
    }
};
Solver.prototype.countBombs = function(x,y){
  var total = 0,uncounted=0;
  for (n=-1; n<2; n++) {
        for (m=-1; m<2; m++) {
          if (_between(x+n,0,this.width-1) && _between(y+m,0,this.height-1)&&(n !== 0 || m !==0)) {
            if(this.bombs[x+n][y+m]){
                total++;
            }else if(this.revealed[x+n][y+m]===' '){
                uncounted++;
            }
          }
        }
    }
    return [total,uncounted];
};
var s = new Solver(new Game(1,1,50,50,250));
s.solve();