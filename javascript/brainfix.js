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
createMacro("dupnot",  1, "-[+>+>+<<]>>-[<<+>>+]<")
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

//format stack | cond
fcns.if = function(code){
  emit("[",0);
  var tmp = stack;
  code();
  if(tmp !== stack){
    throw "Code inside if causes net stack change"
  }
  emit("-]<",-1);
}
fcns.ifelse = function(a,b){
  fcns.dup();
  emit("[",0);
  var tmp = stack;
  a();
  if(tmp !== stack){
    throw "Code inside if causes net stack change"
  }
  emit("-]<",-1);
  emit("-[",0);
  var temp = stack;
  b();
  if(temp !== stack){
    throw "Code inside if causes net stack change"
  }
  emit("+]<",-1);
}

//format: old stack | cond | run (generated)
fcns.switch = function(cases,triggers,def){
  if(triggers.length !== cases.length){
    throw "case arrays don't match length";
  }
  emit(">+<",1);
  var previous = 0;
  var code = "";
  for(var item = 0; item < triggers.length; item++){
    var diff = previous - triggers[item]
    var sign = diff > 0?"+":"-";
    diff = diff > 0?diff:-diff;
    for(var i = 0; i < diff; i++){
      code += sign;
    }
    code += "[";
    previous = triggers[item];
  }
  emit(code,1);
  emit(">-",0);   //set run = false
  def()
  emit("<[-]",0); //set cond = 0
  for(var i = cases.length-1; i >= 0; i--){
    emit("]>[-",0); //set run = false
    cases[i]()
    emit("]<",0);
  }
  emit("]<",-2);
}
var emit = function(str,diff){
  code += str;
  stack += diff;
  if(stack < 0){
    throw "Stack too small";
  }
}
