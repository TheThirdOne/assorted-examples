/*
* Small toy which enables checking probabilities for the game One Night Ultimate Werewolf.
* It works by generating all possible ways the game could go given what some facts asserted true.
* Not all cards have been implemented, but it is fairly easy to add most besides the doppelganger.
* 
* The UI is simply a javascript REPL. 
*  - allGames generates the possibilities from a list of cards (in order of execution) and known facts
*  - Cards are of the form {type:"id for that card", action: CardFunction} where CardFunction is something like Seer
*  - Facts generated from Started, Saw, Swapped, End or combined using And, Or, Implies, Not, Exists, Some, and Forall.
*  - Then probability(fact,possiblegames) gives a number in [0,1]
*/

// generates an array of all arrays with arrangements of an array
function allShuffles(cards){
  if(cards.length==1){
    return [cards];
  }
  var out = []
  for(var i = 0; i < cards.length;i++){
     [cards[0],cards[i]]=[cards[i],cards[0]];
     var temp = allShuffles(cards.slice(1));

     for(var shuffle of temp){
       shuffle.push(cards[0])
       out.push(shuffle);
     }
     [cards[0],cards[i]]=[cards[i],cards[0]];
  }
  return out;
}

// Converts a list of cards to a game
function cards2Game(cards){
   var [a,b,c, ...players] = cards;
   var discard = [a,b,c];
   var play = function(move,prob=1){
     let moves = this.moves.slice();
     moves.push(move)
     return {discard,players,moves,play,probability:this.probability*prob};
   };
   return {discard,players,moves:[],play,probability:1};
}



// Plays all possible games using cards that follow facts
function allGames(cards, facts){
   var games = allShuffles(cards).map(cards2Game);
   
   var starts = facts.filter(fact=>fact.type=='started');
   var nights = facts.filter(fact=>fact.type=='nighttime');

   games = games.filter(game=>starts.map(start=>start.verify(game)).reduce((a,b)=>a&&b,true));

   for(var card of cards){
       var temp= [];
       console.log(games);
       for(var game of games){
          if(game.players.indexOf(card) == -1){
            temp.push(game);
          }else{
            temp.push(...allMoves(card,game.players.indexOf(card),game));
          }
       }
       games = temp;
   }
   return games.filter(game=>nights.map(night=>night.verify(game)).reduce((a,b)=>a&&b,true));
} 


// Generate all games that come from a players decision 
function allMoves(role,position,game){
    if(role.type == "passive"){
       return [role.action(position,game)];
    } 
    
    if(role.action === Werewolf){
      return role.action(position,game);
    }
    if(role.type == "card"){
       let out = [];
       for(let i = 0; i < 3; i++){
         out.push(role.action(position,game,i))
       }
       return out;
    } 
    if(role.type == "player"){
       let out = [];
       for(let i = 0; i < game.players.length; i++){
         if(i == position) continue;
         if(role.action === Robber){
           out.push(role.action(position,game,i,game.players.length));
           continue;
         }
         for(let k = i+1; k < game.players.length; k++){
           if(k == position)continue;
           out.push(role.action(position,game,i,k, game.players.length))
         }
       }
       return out;
    }
console.error("?!");
   return [];
}

// Roles: generates a game from a specific role taking an action according to the inputs

// Slightly abnormal for a Role because werewolves can be either passive or card types depending on if they are alone
function Werewolf(position,game){
  var werewolves = game.players.filter(card=>card.action == Werewolf);
  if(werewolves.length > 1){
    var where = [];
    for(var ww of werewolves){
      if(game.players.indexOf(ww) == position)continue;
      where.push(game.players.indexOf(ww));
    }
    return [game.play({position,action:"show",players:where})];
  }
  return [1,2,3].map(i=>game.play({position,action:"show",discard:[i]},1/3));
}

// Sees two cards from the discard
function Seer(position,game,i){
  return game.play({position,action:"show",discard:[(i+1)%3,(i+2)%3]},1/3);
}

// Swaps with another player's card and looks at it
function Robber(position,game,i, people){
  return game.play({position,action:"swap",players:[i,position]},1/(people-1)).play({position,action:"show",players:[position]});
}

// Swap two other players cards
function TroubleMaker(position,game,i,k, people){
  return game.play({position,action:"swap",players:[i,k]},2/((people-1)*(people-2)));
}

// Swap its card with a card from the discard
function Drunk(position,game,i){
  return game.play({position,action:"swap",players:[position],discard:[i]},1/3)
}

// Looks at its own card
function  Insomniac(position,game){
  return game.play({position,action:"show",players:[position]});
}

// Used for the tanner
function Identity(position,game){
  return game;
}


// ---------  Facts ----------

// The player in position started with role
function Started(role,position){
  return {type:"started",verify:function(game){
    return game.players[position].action === role;
  }};
}

// During the night, player in position saw a card with role looking in loc
function Saw(role,position,loc){
  return {type:"nighttime",verify:function(game){
    if(!game.players || !game.discard)console.error(game);
    var loc = {inPlayers:loc.inPlayers,index:loc.index}seen = false;
    for(let i = game.moves.length-1; i >= 0; i--){
      let move = game.moves[i];
      if(!move.players) move.players = [];
      if(!move.discard) move.discard = [];
      if(move.action === "swap" && seen){
        loc = swap(move.players,move.discard,loc);
      }else if(move.action === "show"){
        if(move.position == position){
          if((inPlayers && move.players.indexOf(index) != -1) || 
             (!inPlayers && move.discard.indexOf(index) != -1)){
            seen = true;
            if(role === seen.action)return true;
          }
        }
      }
    }
    if(!seen)return false;
    var card = loc.inPlayers?game.players[loc.index]:game.discard[loc.index];
    
    return role == card.action;
  }};
}

// Utility method; swaps position according to players and discard (lists of cards to swap)
function swap(players, discard, position){
  if(players.length + discard.length != 2) throw "NO! NO! NO!";
  
  var out = position;
  if(players.length == 2 && position.inPlayers){
    if(players[0] == position.index){
      out = {inPlayers:true, index:players[1]};
    }else if(players[1] == position.index){
      out = {inPlayers:true, index:players[0]};
    }
  }else if(players.length == 1 && discard.length == 1){
    if(players[0] == position.index && position.inPlayers){
      out = {inPlayers:false, index:discard[0]};
    }else if(discard[0] == position.index && !position.inPlayers){
      out = {inPlayers:true, index:players[0]};
    }
  }else if(discard.length == 2 && !position.inPlayers){
    if(discard[0] == position.index){
      out = {inPlayers:false, index:players[1]};
    }else if(discard[1] == position.index){
      out = {inPlayers:false, index:players[0]};
    }
  }
  return out;
}

// During the night, player in position swaped cards at locations swapA and swapB
function Swapped(position, swapA, swapB){ 
  return {type:"nighttime",verify:function(game){
    for(var move of game.moves){
      if(!move.players) move.players = [];
      if(!move.discard) move.discard = [];
      if(move.action === "swap" && move.position == position){
        let newA = swap(move.players,move.discard,swapA);
        return newA.inPlayers == swapB.inPlayers && newA.index == swapB.index; 
      }
    }
    return false;
  }};
}

// Player in position woke up with role
function Ended(role,position){
  return {type:"End",verify:function(game){
    if(!game.players || !game.discard)console.error(game);
    var loc = {inPlayers:true,index:position};
    for(let i = game.moves.length-1; i >= 0; i--){
      let move = game.moves[i];
      if(!move.players) move.players = [];
      if(!move.discard) move.discard = [];
      if(move.action === "swap"){
        loc = swap(move.players,move.discard,loc);
      }
    }
    
    var card = loc.inPlayers?game.players[loc.index]:game.discard[loc.index];
    return card.action === role;
  }};
}

// The probability that fact is true in a universe of games
function probability(fact,games){
    return games.filter(fact.verify).map(toProb).reduce(sum,0)/games.map(toProb).reduce(sum,0)
}

let toProb = game=>game.probability;
let sum = (a,b)=>a+b;

// Fact stating that two facts are both true
function And(factA, factB){
  return {type:"composite",verify:game=>factA.verify(game)&&factB.verify(game)}
}

// Fact stating that at least one of the two facts is true 
function Or(factA, factB){
  return {type:"composite",verify:game=>factA.verify(game)||factB.verify(game)}
}

// Logical implication
function Implies(factA, factB){
  return {type:"composite",verify:game=>!factA.verify(game)||factB.verify(game)}
}

// Logical negation of a fact
function Not(factA){
  return {type:"composite",verify:game=>!factA.verify(game)}
}

// There exists a fact defined by facts and range which is true
//   - facts: a function which maps an element in range to a fact
//   - range: possible values to put into facts
// EX: Exists(i=>Ended(Werewolf,{inPlayers:true,index:i}),[0,1,2,3])
// Tests if there is a werewolf among the players at the end
function Exists(facts, range){
  return {type:"composite",verify:function(game){
    for(var i of range){
      if(facts(i).verify(game))return true;
    }
    return false;
  }};
}

// Generalization of Exists for pairs and triples (and etc.) of ranges
// Ex: Exists(k=>i=>Saw(Werewolf,i,{inPlayers:true,index:k}),[[0,1,2],[0,1,2,3]])
// Tests if someone saw a werewolf in the discard
function Some(fn,ranges){
    if(b.constructor !== Function ) throw "NO NO NO";
    if(ranges.length == 1){
      return Exists(fn,ranges[0]);
    }
    return Exists(x=>Some(fn(x),ranges.slice(1)),ranges[0]);
}

// Tests if every fact defined by facts and range is true
// Ex:Forall(i=>Not(Ended(Werewolf,{inPlayers:true,index:i})),[0,1,2,3])
// Tests if all players are not werewolves
function Forall(facts, range){
  return {type:"composite",verify:function(game){
    for(var i of range){
      if(!facts(i).verify(game))return false;
    }
    return true;
  }};
}

