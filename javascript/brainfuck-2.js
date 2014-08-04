function compile(line){
  var codes = {
    "<":"p[0]--;\n",
    ">":"p[0]++;\n",
    "^":"p[1]++;s[p[1]] = s[p[1]] || [];\n",
    "v":"p[1]--;s[p[1]] = s[p[1]] || [];\n",
    "-":"s[p[1]][p[0]] = (s[p[1]][p[0]] || 0) - 1;\n",
    "+":"s[p[1]][p[0]] = (s[p[1]][p[0]] || 0) + 1;\n",
    "[":"while(s[p[1]][p[0]]){\n",
    "]":"}\n",
    ".":"console.log(String.fromCharCode(s[p[1]][p[0]]||0));\n",
    ",":"\n"
  },
  out = "var s = [[]],p=[0,0];";
  for(var i = 0; i < line.length;i++){
    if(codes[line[i]]){
      out+=codes[line[i]];
    }
  }
  return out;
}
function log(arr,p,clear){
  if(clear){console.clear();}
  var i,tmp,decimals = 0;
  for(var a in arr){
    for(var b in arr[a]){
      if(~~(Math.log(arr[a][b]) / Math.LN10 + 1) > decimals){
        decimals = ~~(Math.log(arr[a][b]) / Math.LN10 + 1);
      }
    }
  }
  i = arr.length - 1;
  var toString = function(el){
    var out = '';
    el = (el||0);
    for(var tmp = decimals - ~~(Math.log(el) / Math.LN10 + 1);tmp > 0; tmp--){
      out += ' ';
    }
    return out + el.toString();
  };
  while(i > -1){
    if(!arr[i][p[0]]){
      arr[i][p[0]] = 0;
    }
    tmp = arr[i].map(toString);
    if(p[1] === i){
      tmp[p[0]] = '%c'+tmp[p[0]]+'%c';
      console.log(tmp.join(','),'color: rgb(0, 200, 0);','');
    }else{
      console.log(tmp.join(','));
    }
    i--;
  }
  console.log('');
}