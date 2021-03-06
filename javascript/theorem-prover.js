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
    
    // Shortcut: if the consequent is already there, just repeat it
    if(truths.filter(exp=>equiv(exp,thm.rhs)).length){
      if(!truths.filter(exp=>equal(exp,thm.rhs)).length){
        steps = reduction(truths.filter(exp=>equiv(exp,thm.rhs))[0],thm.rhs);
      }else{
        steps.push({type:'repetition', reason:'repetition', exp:thm.rhs});
      }
      console.log('Taking shortcut on',str(thm),'using',steps.map(s=>str(s.exp)));
      [{type:'show', exp:thm, steps:steps}];
    }
    return [{type:'show', exp: thm,steps:[{type:'assumption', reason:'assumption (cd)', exp: thm.lhs},...prove(thm.rhs,[thm.lhs,...truths],[...hints])]}];
  }else if(thm.type === 'binary' && thm.connective === '<->'){
    // Show the subparts and then use conditional biconditional to derive biconditionals
    let forward = IF(thm.lhs,thm.rhs);
    let backward = IF(thm.rhs,thm.lhs);
    let steps = [...prove(forward,[...truths],[...hints]),                    // Prove the forward case
                 ...prove(backward,[...truths],[...hints]),                   // Then prove the backward case
                {type:'derived',reason:'CB',exp:thm,from:[forward,backward]}];// Then combine them
    return [{type:'show', exp: thm,steps:steps}];
  }else if(thm.type === 'binary' && thm.connective === '^'){
    console.log('Shown by separation',str(thm))
    // Show the subparts and then use adjunction to derive conjunctions
    let steps = [...prove(thm.lhs,[...truths],[...hints]),                    // Prove the left side
                 ...prove(thm.rhs,[...truths],[...hints]),                    // Then prove the right case
                {type:'derived',reason:'ADJ',exp:thm,from:[thm.lhs,thm.rhs]}];// Then combine them
    return [{type:'show', exp: thm,steps:steps}];
  }else if(thm.type === 'binary' && thm.connective === 'v'){
    // Show ~lhs->rhs, then show lhs, then use addition
    let cdForm = IF(NOT(thm.lhs),thm.rhs);
    let steps = [{type:'assumption', reason:'assumption (id)', exp: NOT(thm)}, // Assume negation
                 ...prove(cdForm,[...truths],[...hints]),                      // Prove the conditional form
                 {type:'show', exp: thm.lhs,steps:                             // Inlined proof equivilant to (~p->q)^~(pvq)->p
                                [{type:'assumption', reason:'assumption (id)', exp: NOT(thm.lhs)},
                                 {type:'derived',    reason:'MP',              exp: thm.rhs,  from:[NOT(thm.lhs),cdForm]},
                                 {type:'derived',    reason:'ADD',             exp: thm,      from:[thm.rhs]},
                                 {type:'repetition', reason:'repetition',      exp: NOT(thm)}
                                ]},
                {type:'derived',reason:'ADD',exp:thm,from:[thm.lhs]}];         // Then form the contradiction
    return [{type:'show', exp: thm,steps:steps}];
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
                            &&!truths.filter(ant=>equiv(ant,exp.lhs)||contra(ant,exp.lhs)).length  // That does not have its antecendent or negation of its antecedent fufilled
                            &&!hints.filter(hint=>equiv(hint,exp)).length);                        // And is not in the hints
        if(unusedConds.length===0){
          let unusedOrs = truths.filter(exp=>exp.type === 'binary'&&exp.connective === 'v'         // Look for a disjunction
                            &&!truths.filter(ant=>equiv(ant,exp.lhs)||equiv(ant,exp.rhs)).length   // That does not have either side fufilled
                            &&!hints.filter(hint=>equiv(hint,exp)).length);                        // And is not in the hints
          if(unusedOrs.length===0){
            console.log(truths.map(str))
            throw "Missing Hint (or not true) (Hard)";
          }
          console.log('Hint: Negation of side of a disjunction');
          newsteps = prove(NOT(unusedOrs[0].lhs),[...truths],[unusedOrs[0],...hints]);
          console.log(str(NOT(unusedOrs[0].lhs)),[...truths].map(str),[unusedOrs[0],...hints].map(str));
          steps.push(...newsteps);
          truths.push(NOT(unusedOrs[0].lhs));
          hints.push(unusedOrs[0]);
        }else{
          console.log('Hint: Antecdent to conditional');
          newsteps = prove(unusedConds[0].lhs,[...truths],[unusedConds[0],...hints]);
          steps.push(...newsteps);
          truths.push(unusedConds[0].lhs);
          hints.push(unusedConds[0]);
        }
      }else{
        console.log('Hint: Negated connective');
        negated = negated[0];
        if(!used.filter(exp=>equal(exp,negated)).length){
          steps.push({type:'repetition', reason:'repetition', exp:negated});
        }
        let base = simplify(negated).base;
        steps.push(...reduction(negated, NOT(base)));
        steps.push(...prove(base,[...truths],[negated,...hints]));
        return [{type:'show', exp: thm, steps:steps}];
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
  
  return [{type:'show', exp: thm, steps:steps}];
}

// Main powerhouse of the prover, encodes Modus ponens, modus tollens, simplification, biconditional conditional, and modus tollendo ponens
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
    for(let exp of truths){
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
  
  // Use Modus Tollendo Ponens to add new truths
  var ors  = truths.filter(exp=>exp.type === 'binary' && exp.connective === 'v');                                           // Find disjuctions
  left  = ors.filter(or=>!truths.filter(exp=>equiv(or.lhs,exp)).length && truths.filter(exp=>contra(or.rhs,exp)).length);   // Without the left and a negation of the right
  right = ors.filter(or=>!truths.filter(exp=>equiv(or.rhs,exp)).length && truths.filter(exp=>contra(or.lhs,exp)).length);   // Or without the right and a negation of the left
  for(let or of left){
    for(let exp of truths){
      if(contra(exp,or.rhs)){
        steps.push(...reduction(exp,NOT(or.rhs)));
        break;
      }
    }
    steps.push({type: 'derived', reason:'MTP',exp:or.lhs,from:[NOT(or.rhs),or]});
  }
  for(let or of right){
    for(let exp of truths){
      if(contra(exp,or.lhs)){
        steps.push(...reduction(exp,NOT(or.lhs)));
        break;
      }
    }
    steps.push({type: 'derived', reason:'MTP',exp:or.rhs,from:[NOT(or.lhs),or]});
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
      out.push(indent + 'Show ' + str(step.exp));
      reasons.push('');
      [s, r, k] = writeProof(step.steps,i+1,indent+' | ',new Map(map));
      map.set(str(step.exp),i);
      i = k;
      out.push(...s);
      reasons.push(...r);
      continue;
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
    out.push(s);
    reasons.push(r);
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

// For simplifying proofs (pruning unneeded deductions)
function treeify(steps,i=0,graph=new Map(),lookup=new Map()){
  var sub = new Set();
  for(let step of steps){
    i++;
    let line = LINE(step);
    line.i = i;
    sub.add(line);
    if(step.type === 'show'){
      line.type = 'show';
      [line.sub,_,i] = treeify(step.steps,i,graph,new Map(lookup));
      lookup.set(str(step.exp),line);
      graph.set(line,complete(line.sub,step.exp));
      continue;
    }
    line.type = 'normal';
    if(step.type === 'repetition'){
      if(!lookup.has(str(step.exp))){
        throw "NOOOOOOO";
      }
      graph.set(line,[lookup.get(str(step.exp))]);
    }
    if(step.type === 'assumption'){
      lookup.set(str(step.exp),line);
    }
    if(step.type === 'derived'){
      graph.set(line,step.from.map(a=>lookup.get(str(a))));
      lookup.set(str(step.exp),line);
    }
  }
  return [sub,graph,i-1];
}
function LINE(step){
  return {step:step};
}
function contradiction(s){
  for(let line of s.keys()){
    let contradictions = [...s.keys()].filter(l2=>equal(l2.step.exp,NOT(line.step.exp)));
    if(contradictions.length){
      return [line,contradictions[0]];
    }
  }
  throw "CONTRADICTION NOT FOUND";
}
function findExp(s,exp){
  for(let line of s){
    if(equal(line.step.exp,exp)){
      return [line];
    }
  }
  return false;
}
function complete(s,exp){
  if(exp.type === 'binary' && (exp.connective === '<->' || exp.connective === '^' ||  exp.connective === 'v')){
    return findExp(s,exp)||contradiction(s);
  }
  if(exp.type === 'binary' && exp.connective === '->'){
    return findExp(s,exp.rhs)||contradiction(s);
  }
  return contradiction(s);
}

function flood(line,graph,out = new Set()){
  out.add(line);
  if(graph.has(line)){
    for(let newline of graph.get(line)){
      flood(newline,graph,out);
    }
  }
  return out;
}

function filterProof(proof,lines){
  for(let line of proof){

    if(!lines.has(line)){
      proof.delete(line);
    }
    if(line.type === 'show'){
      filterProof(line.sub,lines);
    }
  }
}

// Not quite ready for use, needs a test to make sure cascading elimination (or multiline bottom level shows) works
function eliminateShows(proof,graph){
  outer:
  for(let line of proof){
    if(line.type === 'show'){
      eliminateShows(line.sub,graph);
      let depends = graph.get(line);
      if(depends.length > 1 && depends.filter(l=>l.step.type==='assumption').length){
        let [other,assumpt] = depends;
        for(let [key,value] of graph){
          if(value === assumpt && key !== line){
            continue outer;
          }
        }
        console.log('Only use of', assumpt, 'is the above show line:',line,'. Complementing line is',other);
        line.type = 'normal';
        line.step = other.step;
      }
    }
  }
}

function reformProof(proof){
  var out = [];
  for(let line of proof){
    if(line.type === 'show'){
      out.push({type:'show', exp: line.step.exp,steps:reformProof(line.sub)});
    }else{
      out.push(line.step);
    }
  }
  return out;
}

function pruneSteps(steps){
  var [proof, graph] = treeify(steps);
  var sub = flood([...proof.keys()][0],graph);
  filterProof(proof,sub);
  return reformProof(proof)
}
