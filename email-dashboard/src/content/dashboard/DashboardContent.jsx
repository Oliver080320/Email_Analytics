import {ContactDetails} from './ContactDetails.jsx';
import {StrengthsIssues} from './StrengthsIssues.jsx';
import {displayDate} from './date-format.mjs';
import {withAssumedIdentity} from './email-identity.mjs';
import {WeekdayActivity} from './WeekdayActivity.jsx';
import {MultiDateCalendar} from './MultiDateCalendar.jsx';
import {averageReplyTime,formatReplyTime} from './reply-time.mjs';
import {correctLocationLabels} from './location-labels.mjs';
import React,{useState,useMemo} from 'react';
import {useDataApp,Section,MetricCard,EvidenceChart,DataComponent,DataTable,Dropdown,Button} from '../../data-app-public.jsx';

import {selectedWeeks,dateWithWeekday,periodDays,selectRows,countBuckets,hourlyAverage,geoCounts,conversationRows} from './metrics.mjs';
import './email-dashboard.css';
import {ContentClassification} from './ContentClassification.jsx';
import {ConversationReader} from './ConversationReader.jsx';
import {ActivityInsights,Organizations} from './ActivityInsights.jsx';
const fmt=n=>new Intl.NumberFormat('en',{maximumFractionDigits:2}).format(n);
function Geo({field,title,rows,value,onSelect,description}){const bars=geoCounts(rows,field),max=Math.max(1,...bars.map(r=>r.conversations));return <DataComponent id={'geo-'+field} title={title} queryId="emails" kind="chart" variant="card" displayRows={bars} sourceRows={rows} description={description}><div data-reviewed-rows><p className="hint">{description}</p><div className="geo-bars">{bars.length?bars.map(r=><button key={r.label} className="geo-bar" aria-label={`${title}: ${r.label}, ${r.conversations} conversations`} aria-pressed={value===r.label} onClick={()=>onSelect(value===r.label?'all':r.label)}><span className="geo-label">{r.label}</span><span className="geo-track"><span style={{width:Math.max(2,100*r.conversations/max)+'%'}}/></span><strong>{r.conversations}</strong></button>):<p className="hint">No conversations match this selection.</p>}</div></div></DataComponent>;}
export function DashboardContent(){
 const [view,setView]=useState('overview'),[readerEmail,setReaderEmail]=useState(null),[returnView,setReturnView]=useState('overview');
 const openEmail=row=>{setReturnView(view);setReaderEmail(row);setView('reader');};
 const {snapshot}=useDataApp();const all=useMemo(()=>withAssumedIdentity(correctLocationLabels(snapshot.queries.emails.rows,snapshot.queries.messages?.rows||[])),[snapshot]);const months=[...new Set(all.map(r=>r.month))].sort();
 const [month,setMonth]=useState(months.at(-1)),[day,setDay]=useState('all'),[country,setCountry]=useState('all'),[region,setRegion]=useState('all'),[city,setCity]=useState('all'),[direction,setDirection]=useState('all'),[auto,setAuto]=useState('all'),[source,setSource]=useState('all'),[status,setStatus]=useState('all'),[stage,setStage]=useState('all');
 const f={month,day,country,region,city,direction,auto,source,status,stage},rows=selectRows(all,f),days=periodDays(all,month,day),dayOptions=periodDays(all,month),monthRows=selectRows(all,{...f,day:'all'}),contextRows=selectRows(all,{...f,month:'all',day:'all'}),geoBase=selectRows(all,{...f,country:'all',region:'all',city:'all'}),table=conversationRows(rows);
 const weekScope=Array.isArray(day)?selectedWeeks(day,periodDays(all)):null;
 const weekdayDays=weekScope?weekScope.days:days;
 const weekdayRows=weekScope?selectRows(all,{...f,month:'all',day:weekdayDays}):rows;
 const replyTime=averageReplyTime(all,snapshot.queries.messages?.rows||[],rows);
 const replyDescription=`Elapsed time from each external incoming email until the next human reply from @turtledownunder.com.au addressed to that sender in the same conversation. Filters apply to incoming emails; replies may fall outside selected dates. Includes nights/weekends. ${replyTime.unanswered} incoming emails without an observed reply are excluded. Multiple incoming emails may share one reply. Export-only estimate; timezone is unspecified.`;
 const clearGeo=()=>{setCountry('all');setRegion('all');setCity('all');};
 const metric=(id,title,value,description,data)=> <MetricCard id={id} title={title} value={value} queryId="emails" sourceRows={data} displayRows={[{metric:title,value,description}]} description={description}><span className="hint">{description}</span></MetricCard>;
 const chart=(id,title,data,raw,description,spec)=> <EvidenceChart id={id} title={title} queryId="emails" rows={data.map(r=>({...r,...(r.label?{label:displayDate(r.label)}:{})}))} sourceRows={raw} description={description} variant="card" height={260} spec={{type:'bar',x:'label',y:'emails',startAtZero:true,showLegend:false,valueDecimals:0,...spec}}/>;
 const advancedCount=[auto,source,status,stage].filter(v=>v!=='all').length;
 const activeFilters=[auto!=='all'?'Auto replies excluded':'',source!=='all'?'Signatures only':'',status!=='all'?status:'',stage!=='all'?stage+' enquiries':''].filter(Boolean);
 const reset=()=>{setMonth('all');setDay('all');setDirection('all');setAuto('all');setSource('all');setStatus('all');setStage('all');clearGeo();};
 return <div className="email-page">
 <nav className="email-navigation" aria-label="Dashboard views">{[['overview','Overview'],['insights','Strengths & issues'],['peaks','Peak activity'],['enquiries','Enquiries'],['locations','Locations & organizations'],['reader','Conversation reader']].map(([key,label])=><button key={key} type="button" aria-pressed={view===key} onClick={()=>{if(key==='reader'){setReturnView(view==='reader'?'overview':view);setReaderEmail(null);}setView(key);}}>{label}</button>)}</nav>
 <div className="filter-panel" aria-label="Dashboard filters">
 <div className="email-filters">
 <MultiDateCalendar availableDays={periodDays(all)} month={month} value={day} onMonthChange={v=>{setMonth(v);setDay('all');}} onChange={dates=>{setDay(dates.length?dates:'all');setMonth('all');}}/>
 <Dropdown label="Direction" allLabel="Received + sent" showLabel choices={['all','Received','Sent']} value={direction} onChange={setDirection} choiceLabels={{all:'Received + sent'}}/>
 <Button onClick={reset}>Reset filters</Button></div>
 <details className="secondary-filters"><summary>More filters{advancedCount?' ('+advancedCount+' active)':''}</summary><div className="email-filters">
 <Dropdown label="Auto replies" allLabel="Include" showLabel choices={['all','exclude']} value={auto} onChange={setAuto} choiceLabels={{all:'Include',exclude:'Exclude identifiable'}}/>
 <Dropdown label="Address evidence" allLabel="All sources" showLabel choices={['all','signature']} value={source} onChange={setSource} choiceLabels={{all:'All sources',signature:'Signatures only'}}/>
 <Dropdown label="Content status" allLabel="All statuses" showLabel choices={['all','Enquiry','Confirmed','Automatic reply','Other','Needs review']} value={status} onChange={setStatus}/>
 <Dropdown label="Enquiry type" allLabel="All types" showLabel choices={['all','New','Existing','Needs review']} value={stage} onChange={setStage}/>
 </div></details>
 <div className="scope" aria-live="polite"><span>{Array.isArray(day)?`${days.length} selected dates: ${days.length>7?dateWithWeekday(days[0])+' to '+dateWithWeekday(days.at(-1))+' (selected dates only)':days.map(dateWithWeekday).join('; ')}`:dateWithWeekday(days[0])+(days.length>1?' to '+dateWithWeekday(days.at(-1)):'')} | {rows.length} emails | {[country,region,city].filter(x=>x!=='all').join(' / ')||'All locations'}{activeFilters.length?' | '+activeFilters.join(' | '):''}</span>{[country,region,city].some(v=>v!=='all')&&<Button onClick={clearGeo}>Clear location</Button>}</div>
 </div>
 {view==='reader'?<ConversationReader messages={snapshot.queries.messages?.rows||[]} allRows={all} scopeRows={rows} initialEmail={readerEmail} onBack={()=>setView(returnView)}/>:null}
 {view==='overview'&&<>
 <Section id="kpis" title="Email activity"><div className="email-kpis overview-kpis">
 {metric('emails-total','Emails in selection',fmt(rows.length),'Individual received and sent messages, subject to filters.',rows)}
 {metric('conversations-total','Conversations',fmt(new Set(rows.map(r=>r.conversation)).size),'Distinct conversations with matching emails.',rows)}
 {metric('emails-day',days.length===1?'Emails this day':'Average emails / day',fmt(rows.length/Math.max(1,days.length)),days.length===1?'Total for the selected date.':`Divided by ${days.length} selected calendar days, including zero-record days.`,rows)}
 {metric('emails-hour','Average emails / hour',fmt(rows.length/Math.max(1,days.length*24)),`Total ÷ ${days.length} days ÷ 24 hours.`,rows)}
 <MetricCard id="average-reply-time" title="Average reply time" value={formatReplyTime(replyTime.seconds)} queryId="emails" sourceRows={replyTime.sourceRows} displayRows={replyTime.pairs} description={replyDescription}><span className="hint">{replyTime.pairs.length?`${replyTime.pairs.length} incoming emails answered by Turtle Down Under. Calendar time; auto replies excluded.`:'No matched Turtle Down Under replies for selected incoming emails.'}</span></MetricCard>
 </div><p className="hint">Reply time follows incoming-email filters and includes replies outside the selected dates. Unanswered emails are excluded.</p><p className="hint">Recorded timestamps; timezone is not provided. Export boundary days may be partial. A zero means no email records in this export.</p></Section>
 <Section id="time" title="Email volume over time"><p className="hint">Monthly: all exported months. Daily: selected dates, or selected month when all days are selected. Hourly: selected dates, averaged across calendar days including days with zero emails. Location and message filters apply throughout.</p><div className="time-grid">
 {chart('monthly','Monthly email count',countBuckets(contextRows,'month',months),contextRows,'All exported months; location and message filters apply. Month/day selectors do not change this overview.')}
 {chart('daily','Daily email count',countBuckets(day==='all'?monthRows:rows,'day',day==='all'?dayOptions:days),day==='all'?monthRows:rows,'Selected dates; all days shows the selected month. Hover over a bar to see its date.',{showCategoryTicks:false,showXAxisLabel:false})}
 </div>{chart('hourly','Average emails by hour of day',hourlyAverage(rows,days.length),rows,`Emails in each clock hour ÷ ${days.length} calendar days. Selecting one day shows that day’s hourly counts.`,{x:'hour',y:'average',valueDecimals:2})}</Section>
 </>}
 {view==='insights'&&<StrengthsIssues rows={rows} replyTime={replyTime} onOpenEmail={openEmail}/>}
 {view==='peaks'&&<><WeekdayActivity rows={weekdayRows} days={weekdayDays} weekScope={weekScope}/><ActivityInsights rows={rows} days={days}/></>}
 {view==='enquiries'&&<ContentClassification rows={rows} onOpenEmail={openEmail}/>}
 {view==='locations'&&<>
 <Section id="locations" title="Where contacts are based"><p className="intro">Select a country, then a region or city to see matching organizations below. Bars count conversations; selections apply to every view.</p><div className="geo-grid">
 <Geo field="country" title="Country" rows={geoBase} value={country} onSelect={v=>{setCountry(v);setRegion('all');setCity('all');}} description="All countries in the selected dates. Click a bar to filter."/>
 <Geo field="region" title="Region" rows={selectRows(geoBase,{country})} value={region} onSelect={v=>{setRegion(v);setCity('all');}} description={country==='all'?'Regions across all countries.':`Regions within ${country}.`}/>
 <Geo field="city" title="City" rows={selectRows(geoBase,{country,region})} value={city} onSelect={setCity} description={`Cities within ${[country,region].filter(x=>x!=='all').join(' / ')||'all locations'}.`}/>
 </div><p className="hint">Addresses belong to the conversation’s external contact. Missing external-contact locations remain Unknown, including when Turtle Down Under sent the latest reply. Turtle Down Under labels only internal-only threads and is not a geographic address. Office/HQ matches may not identify the sender’s branch; see evidence and review notes below.</p></Section>
 <Organizations rows={rows} country={country} region={region} city={city}/>
 <ContactDetails rows={rows} onOpenEmail={openEmail}/>
 <details className="supporting-details"><summary>Conversation and address details ({table.length})</summary><Section id="details" title="Conversation and address details"><DataComponent id="addresses" title={`${table.length} matching conversations`} queryId="emails" kind="table" variant="card" displayRows={table} sourceRows={rows}><DataTable rows={table} onRowSelect={openEmail} rowActionLabel={r=>`Read conversation: ${r.subject}`} label="Conversations - select a row to read the full thread" pageSize={8} rowKey="conversation" columns={[['conversation','Conversation ID'],['timestamp','Latest matching timestamp'],['sender_email','Sender email'],['subject','Subject'],['senderNameAssumed','Sender name (assumed)'],['senderCompanyAssumed','Sender company (assumed)'],['status','Latest matching status'],['enquiryStage','Enquiry type'],['enquiryCategory','New enquiry category'],['emails','Email count'],['city','City'],['region','Region'],['country','Country'],['organization','Organization'],['organizationBasis','Organization evidence'],['physicalAddress','Physical address'],['phoneNumber','Phone'],['landline','Landline'],['website','Website / supplied link'],['locationSource','Address evidence'],['inferred','Inferred fields'],['locationNote','Review notes'],['locationDisplayNote','Location label note']].map(([key,label])=>({key,label,renderCell:['senderCompanyAssumed','organization','physicalAddress','phoneNumber','landline','website'].includes(key)?value=><span>{value||''}</span>:['timestamp','classificationSourceTime'].includes(key)?displayDate:key==='conversation'?(value)=><span title={value}>{String(value).slice(-14)}</span>:undefined}))}/></DataComponent></Section></details></>}<p className="export-note">{all.length} emails across {new Set(all.map(r=>r.conversation)).size} exported conversations | 24-04-2026 to 12-08-2026. This export is a sample of the mailbox.</p></div>;
}

