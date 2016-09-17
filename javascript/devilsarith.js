var primes = []
function primeFactor(n){
  var out = [];
  if(Math.sqrt(n) > (primes[primes.length-1]||0)){
    console.info('generating primes to ',30*Math.ceil(Math.sqrt(n)));
    primes = generatePrimes(5*Math.ceil(Math.sqrt(n)))[1];
  }
  for (let prime of primes) {
    let i = 0;
    while(n % prime === 0){
      n /= prime;
      i++;
    }
    if(i > 0){
      out.push({p:prime,n:i});
    }
    if(prime > n){
      break;
    }
  }
  if(n != 1){
    
    console.warn("missed prime ",n);
    primes = generatePrimes(n)[1];
    out.push(...primeFactor(n));
  }
  return out;
}


function generatePrimes(n){
  var arr = [];
  var primes = [];
  for(var i = 2; i < n; i++){
    if(!arr[i]){
      primes.push(i);
      for(var k = i*i; k < n; k += i){
        arr[k] = true;
      }
    }
  }
  return [arr,primes]
}

function genNum(n){
  var factors = primeFactor(n);
  var out = [];
  for(let factor of factors){
    let arms = 1, prime = [];
    if(factor.p == 1){ // n branches
      arms = 0;
    }else if(factor.p == 2){
      arms = 1;
    }else if(factor.p == 3){
      arms = 2;
    }else if(factor.p == 5){
      arms = 3;
    }else{
      prime = genNum(primes.indexOf(factor.p)+1);
    }
    out.push({arms: arms, exp:genNum(factor.n), prime:prime});
  }
  return out;
}
//a and b are matrices like
// a b c
// d e f
// 0 0 1
function remap(a,b){
  var out = {};

  //output = first column of a + second column of a
  out.a = a.a*b.a+a.b*b.d; //first column of b
  out.d = a.d*b.a+a.e*b.d;

  out.b = a.a*b.b+a.b*b.e;  //second colum of b
  out.e = a.d*b.b+a.e*b.e;

  out.c = a.a*b.c + a.b*b.f + a.c; //last column of b
  out.f = a.d*b.c + a.e*b.f + a.f;

  return out;
}

//maps a point to a new point
// m is a matrice like
// a b c
// d e f
// 0 0 1
// p is a vector like
// x
// y
// 1
function map(m,p){
  return {x:m.a*p.x+m.b*p.y+m.c,y:m.d*p.x+m.e*p.y+m.f};
}
//transforms map for top rendering (prime)
function divmaptop(m,n){
  var tmp = {a:0,b:-.8,c:0,d:1/(n+1),e:0,f:1-1/(n+1)}; //.8 is for making the sides not touch
  return remap(m,tmp);
}
//transforms map for bottom rendering (exp)
function divmapbot(m,n){
  //console.log(m,n);
  var tmp = {a:0,b:-.8,c:0,d:-1/(n+1),e:0,f:1/(n+1)-1}; //.8 is for making the sides not touch
  return remap(m,tmp);
}
//transforms sideways for factors
function divmaplat(m,n,i){
  var tmp = {a:1/n,b:0,c:(2*i+1)/n-1,d:0,e:1,f:0};
  return remap(m,tmp);
}
//n is a parsed number, m is a map
function render(m,n){
  draw(m,{x:-1,y: 1},{x:-1,y:-1});
  if(n.length == 1){
    let a = n[0].arms;
    for(let i = 0; i < a; i++){
      let y = 1-2*(i+1)/(a+1);
      draw(m,{x:-1,y:y},{x:1,y:y});
    }
    if(n[0].prime.length > 0){
      render(divmaptop(m,a),n[0].prime);
    }
    if(n[0].exp.length > 0){
      render(divmapbot(m,a),n[0].exp);
    }
  }else{
    for(let i = 0; i < n.length; i++){
      render(divmaplat(m,n.length,i),[n[i]]);
    }
  }
}

var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");
ctx.lineWidth = 3;
function draw(m,p,q){
  p = map(m,p);
  q = map(m,q);
  ctx.strokeStyle = "#000000";
  ctx.beginPath();
  ctx.moveTo(p.x,p.y);
  ctx.lineTo(q.x,q.y);
  ctx.stroke();
}

var m = {a:canvas.width/3, b: 0, c:canvas.width/2, d: 0, e: -canvas.height/3, f: canvas.height/2};



var field =  document.getElementById("number");
var button = document.getElementById("button");
button.onclick = function(){
  ctx.clearRect(0,0,300,300);
  render(m,genNum(+(field.value.split('.')[0])));
};