// Rules for the California general election of 3 Nov 2026.
// Everything election-specific lives here: which ZIPs see which measures, the
// personal-cost formulas, and how a YES vote moves each interest.
// Interests: budget, services, transit, housing, fiscal. Effects are -2.5..+2.5.
const SF=new Set("94102 94103 94104 94105 94107 94108 94109 94110 94111 94112 94114 94115 94116 94117 94118 94121 94122 94123 94124 94127 94129 94130 94131 94132 94133 94134 94158".split(" "));
const RTM_PREFIX=["940","944","945","946","948","950","951"];   // San Mateo, Santa Clara, Alameda, Contra Costa (approximate)

const money=v=>"$"+Math.round(v).toLocaleString("en-US");
// ---- personal costs -------------------------------------------------------
function prop3Cost(h){  // extra over 9.3% from the 10.3/11.3/12.3% brackets (2025 thresholds)
  const t=h.filing==="mfj"?[721318,865574,1442628]:[360659,432787,721314];
  let c=0;
  if(h.income>t[0]) c+=(Math.min(h.income,t[1])-t[0])*0.01;
  if(h.income>t[1]) c+=(Math.min(h.income,t[2])-t[1])*0.02;
  if(h.income>t[2]) c+=(h.income-t[2])*0.03;
  return c;
}
function propHCost(h){
  if(!h.sf) return 0;
  const sq={s:0,m:600,l:3500}[h.sqft];   // rough extra $ above the $129 base for bigger homes
  let c=0;
  if(h.home==="own" && !h.senior) c+=129+sq;
  c+=h.rentals*129;
  if(h.home==="rent" && h.rentctl) c+=65;
  return c;
}
function rtmCost(h){ return h.spend*(h.sf?0.01:h.rtm?0.005:0); }

// ---- effects of a YES vote on each interest (-2..+2), plus plain-English reasons
function effects(id,h,c){
  const fam=h.disab||h.medical, kids=h.school;
  const E={budget:0,services:0,transit:0,housing:0,fiscal:0}, why=[];
  const add=(k,v,txt)=>{E[k]+=v; if(txt) why.push([k,v,txt]);};
  const costEff=d=>-Math.min(2.5,d/Math.max(h.income*0.004,500));
  switch(id){
    case "1": add("housing",2,"Funds affordable and supportive housing"); add("fiscal",-1,"Adds about $550M a year of state debt payments"); if(h.disab) add("services",1,"Supportive housing is scarce for adults with disabilities"); break;
    case "2": add("fiscal",2,"Builds state reserves"); add("services",fam||kids?2:1,"Cushions schools, Medi-Cal, IHSS and Regional Centers in a recession"); break;
    case "3": if(c.p3>0) add("budget",costEff(c.p3),`Costs you about ${money(c.p3)} a year from 2031`); else why.push(["budget",0,"Doesn't change your taxes (income below the top brackets)"]); add("services",kids||fam?2:1,"Keeps $5–15B a year for schools and the state general fund"); break;
    case "37": add("housing",0.5,"Helps some middle-income buyers of new homes (economists differ on the effect)"); break;
    case "38": add("fiscal",-2,"About $550M a year of debt payments for 20 years"); add("services",0.5,"Funds immunology research"); break;
    case "40": add("services",fam?2.5:1.5,"90% to health care as federal Medi-Cal cuts arrive"); add("fiscal",-0.5,"Risk that billionaires leave, shrinking future income tax"); break;
    case "41": add("services",-1.5,"Cancels Prop 40 and adds hurdles to future health and service taxes"); add("fiscal",1,"Adds audits of special-tax programs"); break;
    case "42": add("services",-1,"Cancels Prop 40 and permanently rules out state wealth taxes"); if(h.stocks) add("budget",1,"Permanently protects your investments from a future state wealth tax"); break;
    case "43": if(h.home==="own"||h.rentals) add("budget",1,"Makes future local parcel taxes harder to pass"); add("services",-1,"Makes future local service taxes harder to pass"); add("transit",-1,"Makes future transit taxes harder to pass"); break;
    case "44": add("services",h.clinic?-2.5:-1.5,"Opposed by clinics and pediatricians; risks community-clinic care"); break;
    case "45": add("housing",1.5,"Speeds housing approvals"); add("transit",1,"Speeds transit projects"); break;
    case "A": add("fiscal",1,"Saves about $400K a year"); break;
    case "B": add("fiscal",-1.5,"Possible $310–460M city exposure, high uncertainty"); break;
    case "C": add("housing",1.5,"Grows the affordable-housing fund to $125M a year"); add("fiscal",-1,"Moves general-fund money into a set-aside"); break;
    case "D": add("fiscal",0.5,"Fewer costly ballot measures"); if(h.home==="own"||h.rentals) add("budget",0.5,"Citizen tax and landlord initiatives become harder to qualify"); break;
    case "E": add("fiscal",0.5,"Streamlines city contracting"); break;
    case "F": add("fiscal",0.5,"Lets the Mayor merge and restructure departments"); break;
    case "G": if(h.westside) add("budget",1.5,"Eases your weekday drive on the west side"); add("fiscal",-0.5,"About $9.8M to reopen plus upkeep"); break;
    case "H": if(c.ph>0) add("budget",costEff(c.ph),`Costs you about ${money(c.ph)} a year`); add("transit",2,"About $177M a year for Muni"); if(h.disab) add("services",1,"Muni cuts would also shrink paratransit coverage"); break;
    case "I": add("housing",1,"Locks $120M a year into housing"); add("fiscal",-1,"Takes $120M a year out of the general fund"); break;
    case "J": add("fiscal",1,"New revenue from large-property foreclosures only"); break;
    case "RTM": if(c.rtm>0) add("budget",costEff(c.rtm),`Costs you about ${money(c.rtm)} a year in sales tax`); add("transit",2.5,"Prevents deep BART and Muni cuts"); if(h.disab) add("services",0.5,"Protects paratransit tied to regular service"); break;
  }
  return {E,why};
}
const VALUES=new Set(["4","5","39"]);


function jurisdictions(h){
  h.sf=SF.has(h.zip); h.rtm=h.sf||RTM_PREFIX.includes(h.zip.slice(0,3));
  return new Set(["ca",...(h.sf?["sf"]:[]),...(h.rtm?["bay-area-rtm"]:[])]);
}
function costs(h){
  const c={p3:prop3Cost(h),ph:propHCost(h),rtm:rtmCost(h)};
  c.cards=[{amount:c.p3,label:"Prop 3 per year, from 2031, if it passes",show:true},
           {amount:c.rtm,label:"Regional transit sales tax per year",show:h.rtm},
           {amount:c.ph,label:"Prop H Muni parcel tax per year",show:h.sf}];
  return c;
}
const RULES={jurisdictions,costs,effects,VALUES,money};
if(typeof module!=="undefined") module.exports=RULES;
