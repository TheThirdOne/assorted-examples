function sectionForm(term,subj,crse){
  return "term_in="+term+"&sel_subj=dummy&sel_subj="+subj+"&SEL_CRSE="+crse
  +"&SEL_TITLE=&BEGIN_HH=0&BEGIN_MI=0&BEGIN_AP=a&SEL_DAY=dummy&SEL_PTRM=dummy&END_HH=0&END_MI=0&END_AP=a&SEL_CAMP=dummy"
  +"&SEL_SCHD=dummy&SEL_SESS=dummy&SEL_INSTR=dummy&SEL_INSTR=%25&SEL_ATTR=dummy&SEL_ATTR=%25&SEL_LEVL=dummy&SEL_LEVL=%25"
  +"&SEL_INSM=dummy&sel_dunt_code=&sel_dunt_unit=&call_value_in=&rsts=dummy&crn=dummy&path=1&SUB_BTN=View+Sections";
}
function cleanSection(str){
  var tds = str.match(/\<TD CLASS\=\"dddefault\"\>[\s\S]*?\<\/TD\>/g)
  var crn = tds[1].slice(-14,-9);
  var clean = /\>(.*)\</;
  var subj = clean.exec(tds[2])[1];
  var crse = clean.exec(tds[3])[1];
  var sec  = clean.exec(tds[4])[1];
  var days = clean.exec(tds[8])[1];
  var time = clean.exec(tds[9])[1];
  return {crn:crn, subj:subj,crse:crse,sec:sec,days:days,time:time}
}
function getSections(term,subj,crse){
  var reqListener = function () {
    var sections =  this.responseText.match(/\<TR\>\s\<TD CLASS\=\"dddefault\"\>\s\<I[\s\S]*?\<\/TR\>/g); //matches open registerable Sections
    cleanSections = sections.map(cleanSection);
    console.log('done')
  }
  var http = new XMLHttpRequest();
  var params = sectionForm(term,subj,crse);
  http.addEventListener('load', reqListener);
  http.open("post", "https://pbanssb.ucmerced.edu/pls/PROD/bwskfcls.P_GetCrse", true);
  http.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
  http.send(params);
}
function conflict(a,b){
  var day = false;
  for(var i = 0; i < a.days.length; i++){
    day = day || b.days.indexOf(a.days[i]) !== -1;
  }
  if(!day){
    return false;
  }
  var aTime = parseTime(a.time);
  var bTime = parseTime(b.time);
  return (aTime[0] >= bTime[0] && aTime[0] <= bTime[1]) ||
         (bTime[0] >= aTime[0] && bTime[0] <= aTime[1]);
}
function parseTime(time){
  return time.split("-").map(function(a){
    return new Date("March 7, 2015 " + a);
  });
}
function testAllConflicts(arr){
  for(var i = 0; i < arr.length; i++){
    for(var j = i+1; j < arr.length; j++){
      if(conflict(arr[i],arr[j])){
        return true;
      }
    }
  }
  return false;
}
