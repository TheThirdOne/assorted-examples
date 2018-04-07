// Update state by doing a replacement by rules logging whenever a change is made
function update(rules,state){
  var old = state;
  for(let rule of rules){
    state = state.replace(rule[0],rule[1]);
    if(state != old){
      console.log(state);
      old = state;
    }
  }
  return state;
}

// Rules for a particular program
// ! means an instruction is done
// | means an instruction is about to run
// ()*~`., are special instruction characters
// so in general !a -> |b (except for [])
function buildRegex(str){
  let matches = [], stack = [];
  let add = function(pattern, result){
    matches.push([pattern,result]);
  }
  let addFallthrough = i => add('!'+ itoa(i), '|' + itoa(i+1));
  let addLogic= (op,i) => add('|'+ itoa(i), op + itoa(i));
  for(let i = 0; i < str.length; i++){
    if(str[i] != ']' && str[i] != '[' ) addFallthrough(i);
    if(str[i] == '+'){
      addLogic('*~',i);
    }else if(str[i] == '-'){
      addLogic('*`',i);
    }else if(str[i] == '-'){
      addLogic('`',i);
    }else if(str[i] == '<'){
      addLogic('(',i);
    }else if(str[i] == '>'){
      addLogic(')',i);
    }else if(str[i] == ','){
      addLogic(',',i);
    }else if(str[i] == '.'){
      addLogic('.',i);
    }else if(str[i] == '[') {
      stack.push(i);
    }else if(str[i] == ']'){
      if(stack.length <= 0){
        throw "Unmatched []";
      }
      addLogic('*',i);
      let matching = stack.pop();
      add('!'+ itoa(i), '|' + itoa(i+1));
      add('?'+itoa(i), '|'+itoa(matching+1));

      add('|'+itoa(matching), '|'+itoa(i));
    }else {
      addLogic('!',i);
    }
  }
  return matches;
}
function itoa(i){
  if(i > 25) return itoa(i/25) + String.fromCharCode(97+(i%25));
  else return String.fromCharCode(i+97);
}

// General Rules
var updateRules = [];
function add(pattern,replace){
  updateRules.push([pattern,replace]);
}
// addition
add(/0\+/g,'1>');
add(/1\+/g,'2>');
add(/2\+/g,'3>');
add(/3\+/g,'4>');
add(/4\+/g,'5>');
add(/5\+/g,'6>');
add(/6\+/g,'7>'); 
add(/7\+/g,'8>');
add(/8\+/g,'9>');
add(/9\+/g,'+0');
add(/(#|\^)\+/g,'$11>');

// subtract (only done if safe)
add(/0\-/g,'-9');
add(/1\-/g,'0>');
add(/2\-/g,'1>');
add(/3\-/g,'2>');
add(/4\-/g,'3>');
add(/5\-/g,'4>');
add(/6\-/g,'5>'); 
add(/7\-/g,'6>');
add(/8\-/g,'7>');
add(/9\-/g,'8>');
add(/(#|\^)\-/g,'.'); // should never happen

// Examples of arithmetic
//#890+ -> #891>
//#899+ -> #9>00
//#999+ -> #1>000
//#^999+ -> #^1>000
//#^999- -> #^998>
//#^900- -> #^8>99
//#000- -> .999 (error)

// check = > <
add(/0\*/g,'*0');
add(/\^\*/g,'=');
add(/#\*/g,'#=');
add(/=(\d+)/g,'$1=');
add(/([^0#\^])\*/g,'_$1');
add(/(\d+)_/g,'_$1');
add(/\^_/g,'^]');
add(/#_/g,'#[');
add(/\[(\d+)/g,'$1[');
add(/\](\d+)/g,'$1]');

// turn standby ops into add or sub based on check
add(/\[~/g,'+');
add(/\[`/g,'-');
add(/\]~/g,'-');
add(/\]`/g,'+');
add(/=~/g,'+');
add(/#0+=`/g,'#^1!');

// Prepare jumps
add(/=([a-z])/g,'!$1');
add(/[\]\[]([a-z])/g,'?$1');

// reseting from addition
add(/>(.*?)([a-z])/g,'$1!$2');

// removing leading zeros
add(/#(\^?)0(\d)/g,'#$1$2');

// Moving 
add(/(\d)#(\d+)\(([a-z]+)/g,'$1!$3#$2'); //left 
add(/^#(\d+)\(([a-z]+)/g,'#0!$2#$1');    // where cell is not initialized
add(/\)([a-z]+)#(\d+)/g,'#$2!$1');       // right
add(/\)([a-z]+)$/g,'#0!$1');             // where cell is not initialized

// Accept / reject
add(/.*,.*/,';');  
add(/.*\..*/,':');
