// Lexer; turns a string or iterable into a sequence of tokens
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
      case '<':
        if(str.next().value === '-' && str.next().value === '>'){
          yield {token:'<->'};
        }else{
          throw "ERROR unexpected value";
        }
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

// Constructs a parse tree from tokens
// Warning: Not very robust
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
  if(n.token !== '->' && n.token !== 'v' && n.token !== '^' && n.token !== '<->' ){
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

// Helpers to construct various connectives
function NOT(a){
  return {type:'not',lhs:a};
}
function IF(lhs,rhs){
  return {type:'binary',connective:'->',
            lhs:lhs,rhs:rhs};
}
function OR(lhs,rhs){
    return {type:'binary',connective:'v',
            lhs:lhs,rhs:rhs};
}
function AND(lhs,rhs){
    return {type:'binary',connective:'^',
            lhs:lhs,rhs:rhs};
}

// Simple prover that follows thease rules (Always use above tules first)
// 1. To derive a conditional, assume the antecedent, then derive the consequent
// 2. To derive a conjuction, derive the conjucts, then use adjunction
// 3. To derive a biconditional, derive the two corresponding conditionals, then use conditional biconditional
// 4. To derive anyting else, use indirect derivation
// 5. Whenever an expression follows from the antecedent lines (allowing DN to be inserted as needed) by MP, MT, S, or BC, enter that as a line
// 6. Use DN to reduce doubled negations of conjuctions, biconditionals, and conditionals to more useful forms
// 7. In an indirect derivation, if a negation of a conditional, conjuction or biconditional occurs, derive the base version.
// 8. When a conditional occurs without the ability to use MP or MT, derive the antecedent
function prove(thm, truths=[], hints=[]){
  console.log('show ', str(thm));
  var steps = [];
  var used = [];
  if(thm.type === 'binary' && thm.connective === '->'){
    // Use conditional derivation to derive a conditional
    return [{type:'show', exp: thm},{type: 'sub', steps:[{type:'assumption', reason:'assumption (cd)', exp: thm.lhs},...prove(thm.rhs,[thm.lhs,...truths],[...hints])]}];
  }else if(thm.type === 'binary' && thm.connective === '<->'){
    // Show the subparts and then use conditional biconditional to derive biconditionals
    let forward = IF(thm.lhs,thm.rhs);
    let backward = IF(thm.rhs,thm.lhs);
    let steps = [...prove(forward,[...truths],[...hints]),                    // Prove the forward case
                 ...prove(backward,[...truths],[...hints]),                   // Then prove the backward case
                {type:'derived',reason:'CB',exp:thm,from:[forward,backward]}];// Then combine them
    return [{type:'show', exp: thm},{type: 'sub', steps:steps}];
  }else if(thm.type === 'binary' && thm.connective === '^'){
    // Show the subparts and then use adjunction to derive conjunctions
    let steps = [...prove(thm.lhs,[...truths],[...hints]),                    // Prove the left side
                 ...prove(thm.rhs,[...truths],[...hints]),                    // Then prove the right case
                {type:'derived',reason:'ADJ',exp:thm,from:[thm.lhs,thm.rhs]}];// Then combine them
    return [{type:'show', exp: thm},{type: 'sub', steps:steps}];
  }else{
    // Otherwise use indirect derivation
    steps.push({type:'assumption', reason:'assumption (id)', exp: NOT(thm)});
    truths.push(NOT(thm));
    used.push(NOT(thm));
  }
  
  // Use Modus Ponens and Modus Tollens until they can no longer be applied or the derivation is finished
  var newsteps, newtruths;
  do{
    [newsteps,newtruths] = deduce(truths,used);
    steps.push(...newsteps);
    truths.push(...newtruths);
    used.push(...newtruths);
    
    if(!newsteps.length&&!finished(truths)){
      // If modus ponens and tollens weren't enough look for a negated connective then prove the base version
      let negated = truths.filter(exp=>negofConnective(exp)&&!hints.filter(hint=>equiv(hint,exp)).length);
      if(negated.length===0){
        // If there aren't any of those try deriving an antecendent to a conditional
        let unusedConds = truths.filter(exp=>exp.type === 'binary'&&exp.connective === '->'        // Look for a conditional
                            &&!truths.filter(ant=>equiv(ant,exp.lhs)||contra(ant,exp.lhs)).length// That does not have its antecendent or negation of its antecedent fufilled
                            &&!hints.filter(hint=>equiv(hint,exp)).length);                        // And is not in the hints
        if(unusedConds.length===0){
          throw "Missing Hint (or not true) (Hard)";
        }
        newsteps = prove(unusedConds[0].lhs,[...truths],[unusedConds[0],...hints]);
        steps.push(...newsteps);
        truths.push(unusedConds[0].lhs);
      }else{
        negated = negated[0];
        if(!used.filter(exp=>equal(exp,negated)).length){
          steps.push({type:'repetition', reason:'repetition', exp:negated});
        }
        let base = simplify(negated).base;
        steps.push(...reduction(negated, NOT(base)));
        steps.push(...prove(base,[...truths],[negated,...hints]));
        return [{type:'show', exp: thm}, {type: 'sub', steps:steps}];
      }
    }
  }while(newsteps.length&&!finished(truths));
  
  if(!finished(used)){
    // If the contradiction isn't inside the immediate derivation, repeat the necessary lines
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

// Main powerhouse of the prover, encodes Modus ponens, modus tollens, simplification, biconditional conditional
// Generates steps to produce everything that can be done with a single invokation of the above rules
function deduce(truths, listed){
  // Use MP and MT
  var conds = truths.filter(exp=>exp.type === 'binary' && exp.connective === '->');
  var mp = conds.filter(cd=>truths.filter(ant=>equiv(cd.lhs,ant)).length);
  mp = mp.filter(cd=>!truths.filter(tr=>equiv(cd.rhs,tr)).length);
  var mt = conds.filter(cd=>truths.filter(con=>contra(cd.rhs,con)).length);
  mt = mt.filter(cd=>!truths.filter(tr=>equiv(NOT(cd.lhs),tr)).length);

  var steps = [];
  for(let cd of mp){
    for(let exp of truths){
      if(equiv(exp,cd.lhs)){
        steps.push(...reduction(exp,cd.lhs));
        break;
      }
    }
    steps.push({type: 'derived', reason:'MP',exp:cd.rhs,from:[cd.lhs,cd]});
  }
  for(let cd of mt){
    for(let exp of listed){
      if(contra(exp,cd.rhs)){
        steps.push(...reduction(exp,NOT(cd.rhs)));
        break;
      }
    }
    steps.push({type: 'derived', reason:'MT',exp:NOT(cd.lhs),from:[NOT(cd.rhs),cd]});
  }
  
  // Double negate to get connectives free
  var DNConns = truths.filter(exp=>exp.type === 'not'&&connnective(exp)&&
                !truths.filter(base=>equal(base,simplify(exp).base)).length);
  for(let dncd of DNConns){
    let base = simplify(dncd).base;
    steps.push(...reduction(dncd,base));
  }
  
  // Use biconditional conditional to get conditionals free
  var biconds = truths.filter(exp=>exp.type === 'binary' && exp.connective === '<->');         // Find biconditionals
  var forward = biconds.filter(bc=>!truths.filter(exp=>equiv(IF(bc.lhs,bc.rhs),exp)).length);  // Without the forward
  var backward = biconds.filter(bc=>!truths.filter(exp=>equiv(IF(bc.rhs,bc.lhs),exp)).length); // Or backward conditionals written
  for(let bc of forward){
    steps.push({type:'derived', reason:'BC',exp:IF(bc.lhs,bc.rhs),from:[bc]});
  }
  for(let bc of backward){
    steps.push({type:'derived', reason:'BC',exp:IF(bc.rhs,bc.lhs),from:[bc]});
  }
  
  // Use simplification to add new truths to use
  var ands  = truths.filter(exp=>exp.type === 'binary' && exp.connective === '^');// Find conjuctions
  var left  = ands.filter(and=>!truths.filter(exp=>equiv(and.lhs,exp)).length);   // Without the left
  var right = ands.filter(and=>!truths.filter(exp=>equiv(and.rhs,exp)).length);   // Or right expressions written
  for(let and of left){
    steps.push({type:'derived', reason:'S',exp:and.lhs,from:[and]});
  }
  for(let and of right){
    steps.push({type:'derived', reason:'S',exp:and.rhs,from:[and]});
  }
  
  return [steps,steps.map(a=>a.exp)];
}

// Uses Double negatition to reduce expressions
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

// General helpers
function contra(a,b){
  a = simplify(a), b = simplify(b);
  return a.i%2 !== b.i%2 && equal(a.base,b.base);
}
function equiv(a,b){
  a = simplify(a), b = simplify(b);
  return a.i%2 === b.i%2 && equal(a.base,b.base);
}
function negofConnective(exp){
  exp = simplify(exp);
  return exp.i%2 === 1 && exp.base.type === 'binary';
}
function connnective(exp){
  exp = simplify(exp);
  return exp.i%2 === 0 && exp.base.type === 'binary';
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
  return a.connective===b.connective&&equal(a.lhs,b.lhs)&&equal(a.rhs,b.rhs);
}
function finished(truths){
  return !!truths.filter(a=>truths.filter(b=>contra(a,b)).length).length;
}

// For generating strings of the results
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
      s += indent + 'Show ' + str(step.exp);
      map.set(str(step.exp),i);
    }
    if(step.type === 'repetition'){
      s += indent + str(step.exp);
      if(!map.has(str(step.exp))){
        throw "NOOOOOOO";
      }
      r = step.reason + ' ' + map.get(str(step.exp));
      map.set(str(step.exp),i);
    }
    if(step.type === 'assumption'){
      map.set(str(step.exp),i);
      s += indent + str(step.exp);
      r = step.reason;
    }
    if(step.type === 'derived'){
      map.set(str(step.exp),i);
      s += indent + str(step.exp);
      r = step.reason + ' ' + (step.from.map(a=>map.get(str(a))).join(', '));
    }
    if(step.type === 'sub'){
      [s, r, i] = writeProof(step.steps,i,indent+'  ',new Map(map));
      i--;
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
  var digits = Math.ceil(Math.log10(steps.length));
  for(let [i,step] of steps.entries()){
    out += ((new Array(1+digits-Math.ceil(Math.log10(i+2))).join(' '))+(i+1)+'. ')+
            step + (new Array(max-step.length+3).join(' ')) + reasons[i] + '\n';
  }
  return out;
}

// Helpful for generating expressions
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
  if(exp.connective === '<->'){
    return toConditional(AND(IF(exp.lhs,exp.rhs),IF(exp.rhs,exp.lhs)));
  }
  return {type:'binary',connective:exp.connective,
  lhs:toConditional(exp.lhs),rhs:toConditional(exp.rhs)};
}
var pl = s=>parse(lex(s));
