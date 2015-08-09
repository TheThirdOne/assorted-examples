var rules = {
  "F":"F+F-F-F+F"
}
var iter = function(str,rules){
  var out = "";
  for(var i = 0; i < str.length; i++){
    out += rules[str[i]] || str[i];
  }
  return out;
}

var drawL = function(str,length){
  console.log(str);
  for(var i = 0; i < str.length; i++){
    switch(str[i]){
      case "F":
        forward(length);
        break;
      case "-":
        right(90);
        break;
      case "+":
        left(90);
        break;
      default:
        break;
    }
  }
}

var gen = function(n){
  var state = "F";
  for(var i = 0; i < n; i++){
    state = iter(state,rules);
  }
  drawL(state,40/Math.pow(2,n))
}
