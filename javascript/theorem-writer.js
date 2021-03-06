// A way to write proofs which can be reduced to just axioms and modus ponens

// Makes a substitutable proof 
function proof(identifiers, statements){
  var underscored = identifiers.map(a=>'_'+a);
  statements = substitute(identifiers, underscored, statements);
  return (...substitutions) => {
    if(identifiers.length != substitutions.length) throw "Improper substitutions";
    return substitute(underscored,substitutions,statements);
  }
}

// Represents one step
function Statement(fact, rule,previous=""){
  return {fact,rule,previous}
}

// Substitutes each identifier for the matching substitutions in stmts
function substitute(identifiers, substitutions, stmts){
  var out = [];
  for(var stmt of stmts){
     let tmp = {rule:stmt.rule, fact:stmt.fact, previous:stmt.previous};
     for(var i = 0; i < identifiers.length; i++){
       tmp.fact = tmp.fact.replace(new RegExp(identifiers[i], 'g'), substitutions[i]);
       tmp.previous = tmp.previous.replace(new RegExp(identifiers[i], 'g'),substitutions[i]);
     }
     out.push(tmp);
  }
  return out;
}

// Just a helper to make making modus ponens stataments smaller
function MP(antecedent, consequent){
  return Statement(consequent, 'Modus Ponens', antecedent);
}
function P(premise){
  return Statement(premise,'Premise');
}
function A1(B,C){
  return Statement('(' + B + '->(' + C + '->' + B + '))', 'Axiom (A1)');
}

// Simple hardcoded proof that B->B for all B
var BthenB = proof(['B'], [Statement("((B->((B->B)->B))->((B->(B->B))->(B->B)))", "Axiom (A2)"),
A1('B','(B->B)'),
MP("(B->((B->B)->B))","((B->(B->B))->(B->B))"),
A1('B','B'),
MP("(B->(B->B))","(B->B)")]);

// Just a helper for the deduction theorem (Don't use elsewhere)
var deduction_helper = proof(['A','B','C'], [Statement("((A->(B->C))->((A->B)->(A->C)))", "Axiom (A2)"),
MP("(A->(B->C))","((A->B)->(A->C))"),
MP("(A->B)","(A->C)")]);

// Converts a proof for where ident can be used as a premise to one where everything is proved within a conditional 
// eg A |- B goes to |- A -> B (A |- B means given A, B is provable)
function Deduction(ident, stmts){
  var out = [];
  stmts = reduceRepeat(stmts);

  for(var stmt of stmts){
    if(stmt.rule.startsWith('Axiom')){
      out.push(stmt)
      out.push(A1(stmt.fact,ident));
      out.push(MP(stmt.fact,'('+ident+'->'+stmt.fact+')'));
    }else if(stmt.rule == 'Premise'){
      if(stmt.fact == ident){
        out.push(...BthenB([ident]));
      }else{
        out.push(stmt)
        out.push(A1(stmt.fact,ident));
        out.push(MP(stmt.fact,'('+ident+'->'+stmt.fact+')'));
      }
   }else if(stmt.rule == 'Modus Ponens'){
        out.push(...deduction_helper(ident, stmt.previous, stmt.fact));
   }else throw "Not a known rule";
  }
  return out;
}

// Remove Premise stmts used to show dependencies in theorems
function reduceRepeat(stmts){
  var facts = stmts.map(s=>s.fact);
  var out = [];
  for(var i = 0; i < stmts.length; i++){
    if(!(facts.indexOf(stmts[i].fact) < i)){
     out.push(stmts[i]);
    }
  }
 return out;
}

// Convert a proof to a human readable format
function to_string(stmts){
  stmts = reduceRepeat(stmts);
  premises = stmts.filter(stmt=>stmt.rule == 'Premise');
  if(premises.length)console.warn('There are still premises in the proof', premises)
  var facts = stmts.map(s=>s.fact);
  var maxlength =facts.map(f=>f.length).reduce((a,b)=>(a>b)?a:b, 0);
  
  var out  = '';
  for(var i = 0; i < stmts.length; i++){
    let s = stmts[i];
    out += (i+1) + '. ' + s.fact + ' '.repeat(maxlength - s.fact.length) + ' ' + s.rule;
    if(s.rule == 'Modus Ponens'){
      let k = facts.indexOf(s.previous), l = facts.indexOf('('+s.previous+'->'+s.fact+')');
      if(k == -1 || l == -1)throw "Modus ponens not valid line: " + i + ' ' +  k + ', ' + l;
      out += ': ' + (k+1) + ', ' + (l+1);
    }
    out += '\n';
  }
  return out;
}


// Proofs from Mendelson, Elliott. Introduction to Mathematical Logic, Sixth Edition

// B->C, C->D |- B->D
var corrallary1_10_a =  proof(['B','C','D'], Deduction('B',[
P('(B->C)'),P('(C->D)'),P('B'),
MP('B','C'),
MP('C','D')]));

// B->(C->D),C |- B->D
var corrallary1_10_b =  proof(['B','C','D'], Deduction('B',
[P("(B->(C->D))"),P("C"),P("B"),
MP('B','(C->D)'),
MP('C','D')]));

// |- ~~B->B
var double_negation_a = proof(['B'],
[Statement('((~B->~~B)->((~B->~B)->B))', 'Axiom (A3)'),
...BthenB(['~B']),
...corrallary1_10_b('(~B->~~B)', '(~B->~B)', 'B'),
Statement('(~~B->(~B->~~B))', 'Axiom (A1)'),
...corrallary1_10_a('~~B','(~B->~~B)','B')
]);

// |- B->~~B
var double_negation_b = proof(['B'],[Statement('((~~~B->~B)->((~~~B->B)->~~B))', 'Axiom (A3)'),
...double_negation_a('~B'),
MP('(~~~B->~B)','((~~~B->B)->~~B)'),
Statement('(B->(~~~B->B))', 'Axiom (A1)'),
...corrallary1_10_a('B','(~~~B->B)','~~B')]);

// ~B|-(B->C)
var lemma1_11_c = proof(['B','C'],Deduction('B',
[P('~B'),P('B'),
Statement('(B->(~C->B))', 'Axiom (A1)'),
Statement('(~B->(~C->~B))', 'Axiom (A1)'),
MP('B', '(~C->B)'),
MP('~B', '(~C->~B)'),
Statement('((~C->~B)->((~C->B)->C))', 'Axiom (A3)'),
MP('(~C->~B)','((~C->B)->C)'),
MP('(~C->B)','C')]));

// (~C->~B)|-(B->C)
var contrapositive_d = proof(['B','C'],
[P('(~C->~B)'),
Statement('((~C->~B)->((~C->B)->C))', 'Axiom (A3)'),
A1('B','~C'),
MP('(~C->~B)','((~C->B)->C)'),
...corrallary1_10_a('B','(~C->B)','C')]);

// (B->C)|-(~C->~B)
var contrapositive_e = proof(['B','C'],
[P('(B->C)'),
...double_negation_a('B'),
...corrallary1_10_a('~~B','B','C'),
...double_negation_b('C'),
...corrallary1_10_a('~~B','C','~~C'),
...contrapositive_d('~C','~B'),
MP('(~~B->~~C)','(~C->~B)')]);
// B |- ~C -> ~(B->C)
var lemma1_11_f = proof(['B','C'],[P('B'),
...Deduction('(B->C)',[P('B'),P('(B->C)'),MP('B','C')]),
...contrapositive_e('(B->C)','C')]);


// (B->C),(~B->C)|-C)
var separation_by_cases_g = proof(['B','C'],[
P('(B->C)'),P('(~B->C)'),
...contrapositive_e('B','C'),
MP('(B->C)','(~C->~B)'),
...contrapositive_e('~B','C'),
MP('(~B->C)','(~C->~~B)'),
Statement('((~C->~~B)->((~C->~B)->C))', 'Axiom (A3)'),
MP('(~C->~~B)','((~C->~B)->C)'),
MP('(~C->~B)','C')]);


// Application of those base theorems into the completeness theorem follows

// Parses a string starting at index i into an AST
function parse(str,i=0){
  if(i >= str.length)throw "Didn't finish parsing before string over";
  if(str[i] == '('){
    let [lhs,k] = parse(str,i+1);
    if(str[k] != '-' && str[k+1] != '>' )throw "Expected -> got "+str[i];
    let [rhs,j] = parse(str,k+2);
    if(str[j] != ')') throw "Expected ) got " + str[j]; 
    return [{type:'->',lhs,rhs},j+1];
  }else if(str[i] == '~'){
    let [rhs,k] = parse(str,i+1);
    return [{type:'~',rhs},k];
  }else {
    let out = '';
    while(i < str.length && str[i] != ')' && str[i] != '-'){
         out+=str[i];
         i++;
    }
    return [{type:'V', id:out},i];
  }
}

// Evaluates an expression as always true (1), always false (-1), or conditionally true (0)
function E(exp,truths=new Map()){
  if(exp.type === 'V'){
    if(!truths.has(exp.id))return 0;
    return truths.get(exp.id);
  }else if(exp.type === '~'){
    return -E(exp.rhs,truths);
  }else{
        return Math.max(-E(exp.lhs,truths),E(exp.rhs,truths));
    }
    console.error('You shouldn\'t be here');
}

// Convert the ast to a string
function exp2str(exp){
  if(exp.type == 'V')return exp.id;
  if(exp.type == '~')return '~' + exp2str(exp.rhs);
  if(exp.type == '->')return '('+exp2str(exp.lhs) + '->' + exp2str(exp.rhs)+')';
  throw "Should not get here, no more connectives";
}

// Prove a theorem (exp) using some variables given some prior truths (must be sentence letters 1 for true, -1 for false)
function completeProve(exp,variables,truths = new Map()){
  if(exp.type == '->'){
    if(E(exp.rhs,truths) == 1){
      let stmts = completeProve(exp.rhs,[],truths);
      stmts.push(A1(exp2str(exp.rhs),exp2str(exp.lhs)));
      stmts.push(MP(exp2str(exp.rhs),exp2str(exp)));
      return stmts;
    }else if(E(exp.lhs,truths) == -1){
      let stmts = completeProve({type:'~',rhs:exp.lhs},[],truths);
      stmts.push(...lemma1_11_c(exp2str(exp.lhs),exp2str(exp.rhs)));
      return stmts;
    }
    let v = variables.pop();
    truths.set(v,1);
    let stmts = Deduction(v,completeProve(exp,variables,truths));
    truths.set(v,-1);
    stmts.push(...Deduction('~'+v,completeProve(exp,variables,truths)));
    truths.delete(v);
    variables.push(v);
    stmts.push(...separation_by_cases_g(v,exp2str(exp)));
    return stmts;
  }
  if(exp.type == '~'){
    if(exp.rhs.type == '~'){
      let stmts = completeProve(exp.rhs.rhs,variables,truths);
      stmts.push(...double_negation_b(exp2str(exp.rhs.rhs)));
      stmts.push(MP(exp2str(exp.rhs.rhs),exp2str(exp)));
      return stmts;
    }else if(exp.rhs.type == '->'){
       let stmts = completeProve(exp.rhs.lhs,variables,truths);
       stmts.push(...completeProve({type:'~',rhs:exp.rhs.rhs},variables,truths));
       stmts.push(...lemma1_11_f(exp2str(exp.rhs.lhs),exp2str(exp.rhs.rhs)));
       stmts.push(MP(exp2str({type:'~',rhs:exp.rhs.rhs}),exp2str(exp)));
       return stmts;
    }else{
      if(E(exp,truths)!= 1)throw "Wat1";
      return [P(exp2str(exp))];
    }
  }

 if(exp.type == 'V'){
   if(E(exp,truths)!= 1)throw "Wat2";
   return [P(exp2str(exp))];
 }
 
 throw "shouldn't get here";
}
