function compile(str){
  var rules = {
    "+":"s[p]=(s[p]||0)+1;",
    "-":"s[p]=(s[p]||0)-1;",
    ">":"p++;",
    "<":"p--;",
    "[":"while(s[p]){",
    "]":"}",
    ".":"String.fromCharCode(s[p]||0);"
  }, out = "var s = [], p = 0;"
  for(var i = 0; i < str.length; i++){
    out += rules[str[i]] || '';
  }
  return out;
}
