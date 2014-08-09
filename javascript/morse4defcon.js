function fromDots(str){
  return fromNum(str.split('').map(function(char){
    if(char === '-'){
      return 2;
    }
    if(char === '.'){
      return 1;
    }
    return 0;
  }));
}
function fromNum(num){
  return num.map(function(a){
    var out = '';
    while(a > 0){
      out+='1';a--;
    }
    return out;
  }).join('0').split('').map(function(a){return Number.parseInt(a)}); // cus chrome has a bug
}

function toBytes(arr){
  var size = 8, out = '';
  
  for(var i = size; i > 0;i--){arr.push(0)}

  for(i = 0; i <= arr.length; i++){
    out += '00000000'.slice(Math.min(i,size))+arr.slice(Math.max(0,i-size),i).join('')+'\n';
  }
  
  return out.split('\n').map(function(c){return 'byte %' + c + ', 150'}).slice(0,-1).join('\n');
}