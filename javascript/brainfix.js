var fcns = {};
var vars = {};
var code = "";
var stack = 0;

var createMacro = function(name,stackDiff,str){
  fcns[name] = function(){
    emit(str,stackDiff);
  }
}

createMacro("dup",     1, "[->+>+<<]>>[-<<+>>]<")
createMacro("not",     0, "-[+>+<]>[-<+>]<")
createMacro("xor",    -1, "<[->+<]+>-[<->+[-]]<")
createMacro("xnor",   -1, "<[->+<]>-[<+>+[-]]<")
createMacro("and",    -1, "<[->+<]+>--[<->[+]]<")
createMacro("add",    -1, "[-<+>]<")
createMacro("mul",    -1, "<[->[->+>+<<]>>[-<<+>>]<<<]>[-]>[-<<+>>]<<")
createMacro("eq",     -1, "<[->-<]+>[<->[-]]<")
createMacro("neq",    -1, "<[->-<]>[<+>[-]]<")
createMacro("nand",   -1, "<[->+<]>--[<+>[+]]<")
createMacro("or",     -1, "<[->+<]>[<+>[-]]<")
createMacro("nor",    -1, "<[->+<]+>[<->[-]]<")
createMacro("swap",    0, "<[->>+<<]>[-<+>]>[-<+>]<")
createMacro("pop",    -1, "[-]<")
createMacro("scand",   1, ">,>++++[-<------------>]<")
createMacro("printd",  1, ">++++[-<++++++++++++>]<.[-]<")

fcns.loadc = function(c){
  var out = ">";
  for(var i = 0; i < c;i++){
    out+="+";
  }
  emit(out,1);
}
fcns.loadv = function(label){
  var l="",r="",out;
  if(!vars[label]){
    throw "Unknown variable";
  }
  emit(">",1);
  var c = stack - vars[label];
  if(c <= 0){
    return;
  }
  for(var i = 0; i < c;i++){
    l += "<";
    r += ">";
  }
  out = l+"[-"+r+"+"+l+"]"+r;
  emit(out,0);
}
fcns.storev = function(label){
  var l="",r="",out;
  if(!vars[label]){
    throw "Unknown variable";
  }
  var c = stack - vars[label];
  if(c <= 0){
    return;
  }
  for(var i = 0; i < c;i++){
    l += "<";
    r += ">";
  }
  out = "[-"+l+"+"+r+"]<";
  emit(out,-1);
}
fcns.load = function(label){
  fcns.loadv(label);
  fcns.dup();
  fcns.storev(label);
}
fcns.createVar = function(label){
  emit(">",1);
  fcns.createLabel(label)
}
fcns.createLabel = function(label){
  vars[label] = stack;
}
fcns.if = function(code){
  emit("[",0);
  code();
  emit("-]<",-1);
}
fcns.ifelse = function(a,b){
  fcns.dup();
  emit("[",0);
  a();
  emit("-]<",-1);
  emit("-[",0);
  b();
  emit("+]<",-1);
}
var emit = function(str,diff){
  code += str;
  stack += diff;
  if(stack < 0){
    throw "Stack too small";
  }
}
