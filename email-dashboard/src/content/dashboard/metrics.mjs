import {displayDate} from './date-format.mjs';
export function calendarDays(start,end){const out=[];for(let d=new Date(start+'T00:00:00Z');d<=new Date(end+'T00:00:00Z');d.setUTCDate(d.getUTCDate()+1))out.push(d.toISOString().slice(0,10));return out;}
export function periodDays(rows,month='all',day='all'){
 if(!rows.length)return[];const dates=rows.map(r=>r.day).sort();let start=dates[0],end=dates.at(-1);
 if(month!=='all'){const last=new Date(Date.UTC(+month.slice(0,4),+month.slice(5,7),0)).toISOString().slice(0,10);start=start>month+'-01'?start:month+'-01';end=end<last?end:last;}
 if(Array.isArray(day))return [...new Set(day)].filter(d=>d>=start&&d<=end).sort();
 if(day!=='all')return day>=start&&day<=end?[day]:[];return calendarDays(start,end);
}
export function selectRows(rows,{month='all',day='all',country='all',region='all',city='all',direction='all',auto='all',source='all',status='all',stage='all',category='all'}={}){return rows.filter(r=>(month==='all'||r.month===month)&&(day==='all'||(Array.isArray(day)?day.includes(r.day):r.day===day))&&(country==='all'||r.country===country)&&(region==='all'||r.region===region)&&(city==='all'||r.city===city)&&(direction==='all'||r.direction===direction)&&(auto==='all'||!r.autoReply)&&(source==='all'||['Text signature','Quoted signature','Signature image (visually read)'].includes(r.locationSource))&&(status==='all'||r.status===status)&&(stage==='all'||r.enquiryStage===stage)&&(category==='all'||(r.enquiryStage==='New'&&(category==='blank'?!r.enquiryCategory:r.enquiryCategory===category))));}
export function countBuckets(rows,field,values){return values.map(label=>({label,emails:rows.filter(r=>r[field]===label).length}));}
export function hourlyAverage(rows,days){return Array.from({length:24},(_,hour)=>{const emails=rows.filter(r=>r.hour===hour).length;return{hour:String(hour).padStart(2,'0')+':00',emails,average:days?emails/days:0};});}
export function geoCounts(rows,field){const groups=new Map();for(const r of rows){if(!groups.has(r[field]))groups.set(r[field],new Set());groups.get(r[field]).add(r.conversation);}return [...groups].map(([label,ids])=>({label,conversations:ids.size})).sort((a,b)=>b.conversations-a.conversations||a.label.localeCompare(b.label));}
export function conversationRows(rows){const out=new Map();for(const r of rows){const p=out.get(r.conversation);out.set(r.conversation,p?{...(r.timestamp>p.timestamp?r:p),emails:p.emails+1}:{...r,emails:1});}return [...out.values()].sort((a,b)=>b.timestamp.localeCompare(a.timestamp));}

export function rankedPeriods(rows,field,limit=Infinity){
 const counts=new Map();for(const r of rows)counts.set(r[field],(counts.get(r[field])||0)+1);
 const sorted=[...counts].map(([period,emails])=>({period,emails})).sort((a,b)=>b.emails-a.emails||a.period.localeCompare(b.period));
 let rank=0,previous=-1;return sorted.map((r,i)=>{if(r.emails!==previous)rank=i+1;previous=r.emails;return{rank,...r};}).filter(r=>r.rank<=limit);
}
export function dailyPeaks(rows,days){
 const bins=new Map(days.map(d=>[d,Array(24).fill(0)]));for(const r of rows){if(bins.has(r.day))bins.get(r.day)[r.hour]++;}
 return [...bins].map(([day,hours])=>{const peak=Math.max(...hours),total=hours.reduce((a,b)=>a+b,0);const winners=hours.flatMap((n,h)=>n===peak&&peak?[`${String(h).padStart(2,'0')}:00-${h===23?'00:00 (next day)':String(h+1).padStart(2,'0')+':00'}`]:[]);return{day,windows:winners.join('; ')||'No emails',peak,total,tiedWindows:winners.length};}).sort((a,b)=>b.day.localeCompare(a.day));
}
export function organizationCounts(rows){
 const groups=new Map();for(const r of rows){const name=r.organizationBasis==='Company blank: personal email provider'?'':r.organization||'Organization not identified';const key=(!name||name==='Organization not identified'||r.organizationBasis==='Assumed from contact email domain')?name+'|'+(r.organizationContact||r.conversation):name;if(!groups.has(key))groups.set(key,{organization:name,emails:0,ids:new Set(),contacts:new Set(),names:new Set(),cities:new Set(),regions:new Set(),countries:new Set(),basis:new Set()});const g=groups.get(key);g.emails++;g.ids.add(r.conversation);if(r.organizationContact)g.contacts.add(r.organizationContact);if(r.contactNameAssumed)g.names.add(r.contactNameAssumed);g.cities.add(r.city);g.regions.add(r.region);g.countries.add(r.country);g.basis.add(r.organizationBasis||'Not identified');}
 return [...groups.values()].map(g=>({organization:g.organization,emails:g.emails,conversations:g.ids.size,contacts:[...g.contacts].join('; '),names:[...g.names].join('; '),cities:[...g.cities].sort().join('; '),regions:[...g.regions].sort().join('; '),countries:[...g.countries].sort().join('; '),basis:[...g.basis].join('; ')})).sort((a,b)=>b.emails-a.emails||a.organization.localeCompare(b.organization));
}

export function lastThreeMonths(days){
 if(!days.length)return[];
 const end=[...days].sort().at(-1),d=new Date(end+'T00:00:00Z');
 const target=new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth()-3,1));
 const last=new Date(Date.UTC(target.getUTCFullYear(),target.getUTCMonth()+1,0)).getUTCDate();
 target.setUTCDate(Math.min(d.getUTCDate(),last)+1);
 const start=target.toISOString().slice(0,10);
 return days.filter(day=>day>=start&&day<=end).sort();
}
export function weekdayActivity(rows,days){
 const names=['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
 const index=day=>(new Date(day+'T00:00:00Z').getUTCDay()+6)%7;
 const result=names.map(weekday=>({weekday,days:0,emails:0,hours:Array(24).fill(0)}));
 const selected=new Set(days);
 for(const day of selected)result[index(day)].days++;
 for(const row of rows)if(selected.has(row.day)){const group=result[index(row.day)];group.emails++;group.hours[row.hour]++;}
 return result.map(r=>{const peak=Math.max(...r.hours);return {...r,average:r.days?r.emails/r.days:null,
 peakAverage:r.days?peak/r.days:null,peakWindows:peak?r.hours.flatMap((n,h)=>n===peak?[`${String(h).padStart(2,'0')}:00-${String((h+1)%24).padStart(2,'0')}:00`]:[]).join('; '):r.days?'No emails':'No selected dates'};});
}

export function dateWithWeekday(day){return day?new Date(day+'T12:00:00Z').toLocaleDateString('en-GB',{weekday:'long',timeZone:'UTC'})+', '+displayDate(day):'No dates';}

export function selectedWeeks(selectedDays,availableDays){
 const starts=new Set();
 for(const day of selectedDays){const d=new Date(day+'T00:00:00Z');d.setUTCDate(d.getUTCDate()-(d.getUTCDay()+6)%7);starts.add(d.toISOString().slice(0,10));}
 const ranges=[...starts].sort().map(start=>{const d=new Date(start+'T00:00:00Z');d.setUTCDate(d.getUTCDate()+6);return {start,end:d.toISOString().slice(0,10)};});
 const available=new Set(availableDays),requested=ranges.flatMap(r=>calendarDays(r.start,r.end));
 return {ranges,days:requested.filter(d=>available.has(d)),missing:requested.filter(d=>!available.has(d)).length};
}
