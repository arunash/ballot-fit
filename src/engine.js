// Generic scoring engine. Takes a household, the election's measures and RULES,
// and returns a recommendation + reasons per measure. No network, no storage.
function recommend(m,h,c,R){
  if(R.VALUES.has(m.id)) return {rec:"Your call",why:[["",0,"Mostly a question of values; it doesn't change your household's interests."]],score:0};
  const {E,why}=R.effects(m.id,h,c);
  const tw=h.w.transit*[0.5,1,1.5][h.transit], sw=h.w.services*((h.disab||h.medical||h.school)?1.5:0.75);
  const W={budget:h.w.budget,services:sw,transit:tw,housing:h.w.housing,fiscal:h.w.fiscal};
  const score=Object.keys(E).reduce((a,k)=>a+E[k]*W[k],0);
  const rec=score>=3?"Yes":score>=0.9?"Lean Yes":score<=-3?"No":score<=-0.9?"Lean No":"Your call";
  why.sort((a,b)=>Math.abs(b[1]*(W[b[0]]||0))-Math.abs(a[1]*(W[a[0]]||0)));
  return {rec,why,score};
}
function ballot(h,MEASURES,R){
  if(!/^9[0-6]\d{3}$/.test(h.zip)) return null;
  const J=R.jurisdictions(h), c=R.costs(h);
  const list=MEASURES.filter(m=>J.has(m.jurisdiction));
  return {c,results:list.map(m=>({m,...recommend(m,h,c,R)}))};
}
if(typeof module!=="undefined") module.exports={recommend,ballot};
