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

// |- ~B->(B->C)
var lemma1_11_c = proof(['B','C'],Deduction('~B',Deduction('B',
[P('~B'),P('B'),
Statement('(B->(~C->B))', 'Axiom (A1)'),
Statement('(~B->(~C->~B))', 'Axiom (A1)'),
MP('B', '(~C->B)'),
MP('~B', '(~C->~B)'),
Statement('((~C->~B)->((~C->B)->C))', 'Axiom (A3)'),
MP('(~C->~B)','((~C->B)->C)'),
MP('(~C->B)','C')])));

// |- (~C->~B)->(B->C)
var contrapositive_d = proof(['B','C'],Deduction('(~C->~B)',
[P('(~C->~B)'),
Statement('((~C->~B)->((~C->B)->C))', 'Axiom (A3)'),
A1('B','~C'),
MP('(~C->~B)','((~C->B)->C)'),
...corrallary1_10_a('B','(~C->B)','C')]))

// |- (B->C)->(~C->~B)
var contrapositive_e = proof(['B','C'],Deduction('(B->C)',[P('(B->C)'),
...double_negation_a('B'),
...corrallary1_10_a('~~B','B','C'),
...double_negation_b('C'),
...corrallary1_10_a('~~B','C','~~C'),
...contrapositive_d('~C','~B'),
MP('(~~B->~~C)','(~C->~B)')]));

