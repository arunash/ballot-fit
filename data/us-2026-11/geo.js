// ZIP (first 3 digits) -> state. USPS prefix ranges; a handful of prefixes are split
// across states, so the ZIP's main state is used. Military/territory prefixes return null.
const ZIP3_RANGES=[["010","027","MA"],["028","029","RI"],["030","038","NH"],["039","049","ME"],["050","059","VT"],["055","055","MA"],
 ["060","069","CT"],["070","089","NJ"],["100","149","NY"],["005","005","NY"],["150","196","PA"],["197","199","DE"],["200","205","DC"],["201","201","VA"],
 ["206","219","MD"],["220","246","VA"],["247","268","WV"],["270","289","NC"],["290","299","SC"],["300","319","GA"],["398","399","GA"],
 ["320","339","FL"],["341","349","FL"],["350","369","AL"],["370","385","TN"],["386","397","MS"],["400","427","KY"],["430","459","OH"],
 ["460","479","IN"],["480","499","MI"],["500","528","IA"],["530","549","WI"],["550","567","MN"],["569","569","DC"],["570","577","SD"],
 ["580","588","ND"],["590","599","MT"],["600","629","IL"],["630","658","MO"],["660","679","KS"],["680","693","NE"],["700","714","LA"],
 ["716","729","AR"],["730","749","OK"],["733","733","TX"],["750","799","TX"],["885","885","TX"],["800","816","CO"],["820","831","WY"],
 ["832","838","ID"],["840","847","UT"],["850","865","AZ"],["870","884","NM"],["889","898","NV"],["900","961","CA"],["967","968","HI"],
 ["970","979","OR"],["980","994","WA"],["995","999","AK"]];
function stateFromZip(zip){
  if(!/^\d{5}$/.test(zip)) return null;
  const p=zip.slice(0,3); let st=null;
  for(const [a,b,s] of ZIP3_RANGES) if(p>=a&&p<=b) st=s;   // later, narrower ranges override
  return st;
}
// Approximate effective property-tax rate on owner-occupied homes (Tax Foundation / Census ACS),
// used only to estimate a household's current bill for percentage-change and exemption measures.
const PROP_TAX_RATE={AL:.0038,AK:.0100,AZ:.0052,AR:.0057,CA:.0071,CO:.0049,CT:.0179,DE:.0053,DC:.0057,FL:.0082,GA:.0083,HI:.0027,ID:.0057,
 IL:.0207,IN:.0081,IA:.0143,KS:.0134,KY:.0079,LA:.0051,ME:.0109,MD:.0102,MA:.0104,MI:.0128,MN:.0102,MS:.0067,MO:.0088,MT:.0068,NE:.0154,
 NV:.0048,NH:.0177,NJ:.0223,NM:.0067,NY:.0140,NC:.0070,ND:.0092,OH:.0136,OK:.0082,OR:.0086,PA:.0135,RI:.0132,SC:.0051,SD:.0107,TN:.0056,
 TX:.0158,UT:.0052,VT:.0171,VA:.0080,WA:.0084,WV:.0055,WI:.0151,WY:.0056};
const STATE_NAMES={AL:"Alabama",AK:"Alaska",AZ:"Arizona",AR:"Arkansas",CA:"California",CO:"Colorado",CT:"Connecticut",DE:"Delaware",DC:"District of Columbia",FL:"Florida",GA:"Georgia",HI:"Hawaii",ID:"Idaho",IL:"Illinois",IN:"Indiana",IA:"Iowa",KS:"Kansas",KY:"Kentucky",LA:"Louisiana",ME:"Maine",MD:"Maryland",MA:"Massachusetts",MI:"Michigan",MN:"Minnesota",MS:"Mississippi",MO:"Missouri",MT:"Montana",NE:"Nebraska",NV:"Nevada",NH:"New Hampshire",NJ:"New Jersey",NM:"New Mexico",NY:"New York",NC:"North Carolina",ND:"North Dakota",OH:"Ohio",OK:"Oklahoma",OR:"Oregon",PA:"Pennsylvania",RI:"Rhode Island",SC:"South Carolina",SD:"South Dakota",TN:"Tennessee",TX:"Texas",UT:"Utah",VT:"Vermont",VA:"Virginia",WA:"Washington",WV:"West Virginia",WI:"Wisconsin",WY:"Wyoming"};
const GEO={stateFromZip,PROP_TAX_RATE,STATE_NAMES};
if(typeof module!=="undefined") module.exports=GEO;
