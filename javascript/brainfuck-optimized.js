function compile(str){
  var rules = {
    "+":"s[p]=(s[p]||0)+",
    "-":"s[p]=(s[p]||0)-",
    ">":"p+=",
    "<":"p-=",
    "[":"while(s[p]){",
    "]":"}",
    ".":"String.fromCharCode(s[p]||0);",
    ",":" "
  }, out = "var s = [], p = 0;";
  var op = {op:'',num:0};
  var con = [];
  for(var i = 0; i < str.length; i++){
    if(rules[str[i]]){
      if(op.op === str[i]){
        op.num++;
      }else{
        con.push(op);
        op = {op:str[i],num:1};
      }
    }
  }
  con.push(op);
  var saved = 0;
  for(i = 1; i < con.length; i++){
    if(con[i].op === '[' && con[i].num === 1){
      if(con[i+1].op==='-' && con[i+1].num === 1){
        if(con[i+2].op === ']'){ //if [-]
          out += 's[p] = 0;'
          saved += 3;
          con[i+2].num--;
          i++;
          continue;
        }else if((con[i+2].op === '<' || con[i+2].op === '>') && con[i+3].op === '+' && (con[i+4].op === '<' || con[i+4].op === '>') && con[i+5].op===']' &&con[i+4].op!==con[i+2] && con[i+4].num === con[i+2].num){ //[->+<] and [-<+>]
          var sign = (con[i+2].op === '>')?'+':'-';
          out += 's[p]=(s[p]||0)+s[p'+sign+con[i+2].num+'];s[p'+sign+con[i+2].num+'] = 0;';
          saved += 2+2*con[i+2].num+con[i+3].num;
          con[i+5].num--;
          i+=4;
          continue;
        }
      }
      out += rules['['];
    }else if(con[i].op === '>' || con[i].op === '<' || con[i].op === '+' || con[i].op === '-'){ //everything else can lump
      saved += con[i].num-1;
      out += rules[con[i].op] + con[i].num + ';';
    }else{ //these cant be optimized easily
      for(var k = 0; k < con[i].num;k++){
        out += rules[con[i].op]+'\n';
      }
    }
  }
  console.log(saved);
  return out;
}
