function* lex(str){
  if((typeof str) === 'string'){
    str = function*(str){
          yield* str.split('');
        }(str);
  }
  while(true){
    var a = str.next().value;
    switch(a){
      case 'v':
      case '^':
      case '~':
      case '(':
      case ')':
        yield {token:a};
        break;
      case '-':
        if(str.next().value === '>'){
          yield {token:'->'};
        }else{
          throw "ERROR unexpected value";
        }
        break;
      default:
        yield {token:'variable',value:a};
    }
  }
}

function parse(l){
  var n = l.next().value;
  if(n.token === 'variable'){
    return {type: 'variable', value: n.value};
  }
  if(n.token === '~'){
    return NOT(parse(l));
  }
  if(n.token !== '('){
    throw "Expected (";
  }
  
  var lhs = parse(l);
  
  n = l.next().value;
  if(n.token !== '->' && n.token !== 'v' && n.token !== '^'){
    throw "Expected a binary connective";
  }
  var c = n.token;
  var rhs = parse(l);

  n = l.next().value;
  if(n.token !== ')'){
    throw "Expected )";
  }
  return {type: 'binary', lhs:lhs, rhs:rhs, connective:c};
}

function NOT(a){
  return {type:'not',lhs:a};
}

function prove(thm, truths=[], hints=[]){
  console.log('show ', str(thm));
  var steps = [];
  var used = [];
  if(thm.type === 'binary' && thm.connective === '->'){
    return [{type:'show', exp: thm},{type: 'sub', steps:[{type:'assumption', reason:'assumption (cd)', exp: thm.lhs},...prove(thm.rhs,[thm.lhs,...truths])]}];
  }else{
    steps.push({type:'assumption', reason:'assumption (id)', exp: NOT(thm)});
    truths.push(NOT(thm));
    used.push(NOT(thm));
  }
  var newsteps, newtruths;
  do{
    [newsteps,newtruths] = deduce(truths,used);
    steps.push(...newsteps);
    truths.push(...newtruths);
    used.push(...newtruths);
  }while(newsteps.length&&!finished(truths));
  
  if(!finished(truths)){
    let negated = used.filter(exp=>negofCond(exp));
    if(negated.length===0){
      console.log(used,truths.map(str));
      throw "Missing Hint (or not true)";
    }
    negated = negated[0];
    let base = simplify(negated).base;
    console.log(str(negated),str(base));
    steps.push(...reduction(negated, NOT(base)));
    steps.push(...prove(base,[...truths]));
  }else if(!finished(used)){
    let part = used.filter(a=>truths.filter(b=>contra(a,b)).length);
    if(part.length === 0){
      part = truths.filter(a=>truths.filter(b=>contra(a,b)).length);
      steps.push({type:'repetition', reason:'repetition', exp:part[0]});
    }
    let second = truths.filter(b=>contra(part[0],b));
    if(second.length === 0){
      throw "NOOOOOOOOOOOOOOOOO";
    }
    steps.push({type:'repetition', reason:'repetition', exp:second[0]});
  }
  
  return [{type:'show', exp: thm}, {type: 'sub', steps:steps}];
}
function finished(truths){
  return !!truths.filter(a=>truths.filter(b=>contra(a,b)).length).length;
}

function deduce(truths, listed){
  var conds = truths.filter(a=>a.type === 'binary'&&a.connective==='->');
  var mp = conds.filter(cd=>truths.filter(ant=>equiv(cd.lhs,ant)).length);
  mp = mp.filter(cd=>!truths.filter(tr=>equiv(cd.rhs,tr)).length);
  var mt = conds.filter(cd=>truths.filter(con=>contra(cd.rhs,con)).length);
  mt = mt.filter(cd=>!truths.filter(tr=>equiv(NOT(cd.lhs),tr)).length);

  var steps = [];
  for(let cd of mp){
    if(!listed.filter(exp=>equal(exp,cd)).length){
      steps.push({type:'repetition', reason:'repetition', exp:cd});
    }
    let list = false;
    for(let exp of listed){
      if(equiv(exp,cd.lhs)){
        steps.push(...reduction(exp,cd.lhs));
        list = true;
        break;
      }
    }
    if(!list){
      for(let exp of truths){
        if(equiv(exp,cd.lhs)){
          steps.push({type:'repetition', reason:'repetition', exp:exp});
          steps.push(...reduction(exp,cd.lhs));
          break;
        }
      }
    }
    steps.push({type: 'derived', reason:'MP',exp:cd.rhs,from:[cd.lhs,cd]});
  }
  for(let cd of mt){
    if(!listed.filter(exp=>equal(exp,cd)).length){
      steps.push({type:'repetition', reason:'repetition', exp:cd});
    }
    let list = false;
    for(let exp of listed){
      if(contra(exp,cd.rhs)){
        steps.push(...reduction(exp,NOT(cd.rhs)));
        list = true;
        break;
      }
    }
    if(!list){
      for(let exp of truths){
        if(contra(exp,cd.rhs)){
          steps.push({type:'repetition', reason:'repetition', exp:exp});
          steps.push(...reduction(exp,NOT(cd.rhs)));
          break;
        }
      }
    }
    steps.push({type: 'derived', reason:'MT',exp:NOT(cd.lhs),from:[NOT(cd.rhs),cd]});
  }
  return [steps,steps.map(a=>a.exp)];
}

function reduction(from, to){
  var from_ = simplify(from);
  var to_ = simplify(to);
  var steps = [];
  if(to_.i > from_.i){
    for(let i = 0; i < (to_.i-from_.i)/2; i++){
      steps.push({type:'derived', reason:'DN',exp:NOT(NOT(from)),from:[from]});
      from = NOT(NOT(from));
    }
  }else{
    for(let i = 0; i < (from_.i-to_.i)/2; i++){
      steps.push({type:'derived', reason:'DN',exp:to,from:[NOT(NOT(to))]});
      to = NOT(NOT(to));
    }
    steps = steps.reverse();
  }
  return steps
}

function contra(a,b){
  a = simplify(a), b = simplify(b);
  return a.i%2 !== b.i%2 && equal(a.base,b.base);
}

function equiv(a,b){
  a = simplify(a), b = simplify(b);
  return a.i%2 === b.i%2 && equal(a.base,b.base);
}

function negofCond(exp){
  exp = simplify(exp);
  return exp.i%2 === 1 && exp.base.type === 'binary' && exp.base.connective === '->';
}

function simplify(a){
  if(a.type === 'not'){
    let b = simplify(a.lhs);
    b.i++;
    return b;
  }else{
    return {i:0, base:a};
  }
}

function equal(a,b){
  if(a.type !== b.type){
    return false;
  }
  if(a.type === 'variable'){
    return a.value === b.value;
  }
  if(a.type === 'not'){
    return equal(a.lhs,b.lhs);
  }
  return equal(a.lhs,b.lhs)&&equal(a.rhs,b.rhs);
}


function str(a){
  if(a.type === 'not'){
    return '~' + str(a.lhs);
  }
  if(a.type === 'variable'){
    return a.value;
  }
  if(a.type === 'binary'){
    return '('+str(a.lhs)+a.connective+str(a.rhs)+')';
  }
}

function writeProof(steps,i=1,indent=' ',map=new Map()){
  var out = [];
  var reasons = [];
  for(let step of steps){
    let s = '', r = '';
    if(step.type === 'show'){
      s += i + '.' + indent + 'Show ' + str(step.exp);
    }
    if(step.type === 'repetition'){
      s += i + '.' + indent + str(step.exp);
      if(!map.has(str(step.exp))){
        throw "NOOOOOOO";
      }
      r = step.reason + ' ' + map.get(str(step.exp));
      map.set(str(step.exp),i);
    }
    if(step.type === 'assumption'){
      map.set(str(step.exp),i);
      s += i + '.' + indent + str(step.exp);
      r = step.reason;
    }
    if(step.type === 'derived'){
      map.set(str(step.exp),i);
      s += i + '.' + indent + str(step.exp);
      r = step.reason + ' ' + (step.from.map(a=>map.get(str(a))).join(', '));
    }
    if(step.type === 'sub'){
      [s, r, i] = writeProof(step.steps,i,indent+'  ',new Map(map));
      out.push(...s);
      reasons.push(...r);
    }else{
      out.push(s);
      reasons.push(r);
    }
    i++;
  }
  return [out,reasons,i];
}

function prettify(steps,reasons){
  var max = 0, out = '';
  for(let step of steps){
    max = Math.max(step.length,max)
  }
  for(let [i,step] of steps.entries()){
    out += step + (new Array(max-step.length+3).join(' ')) + reasons[i] + '\n';
  }
  return out;
}

function toConditional(exp){
  if(exp.type === 'variable'){
    return exp;
  }
  if(exp.type === 'not'){
    return NOT(toConditional(exp.lhs));
  }
  if(exp.connective === 'v'){
    return {type:'binary',connective:'->',
            lhs:NOT(toConditional(exp.lhs)),rhs:toConditional(exp.rhs)};
  }
  if(exp.connective === '^'){
    return NOT({type:'binary',connective:'->',
            lhs:toConditional(exp.lhs),rhs:NOT(toConditional(exp.rhs))});
  }
  return {type:'binary',connective:exp.connective,
  lhs:toConditional(exp.lhs),rhs:toConditional(exp.rhs)};
}
