function nQueens(n, i = 0, queens =  []){
  if( n == i) return queens;
  outer:
  for(let k = 0; k < n; k++){
     for(let j = 0; j < i; j++){
       if(abs(queens[j]-k) === abs(j-i) || queens[j] === k){
         continue outer;
       }
     }
      queens[i] = k;
      let temp = nQueens(n,i+1,queens);
      if(temp.length != 0) return temp;
  }
  return [];
}
function abs(x){if(x>0)return x; else return -x;}

function graph(queens){
  let n = queens.length;
  let out = ""
  for(var queen of queens){
    out += times('_',queen) + 'Q'+times('_',n-1-queen) + '\n';
  }
  return out;
}
