import React from 'react';
import {Section,DataComponent,DataTable} from '../../data-app-public.jsx';
import {conversationRows} from './metrics.mjs';
import {formatReplyTime} from './reply-time.mjs';
import {displayDate} from './date-format.mjs';

const percent=(n,d)=>d?`${Math.round(100*n/d)}%`:'N/A';
const known=value=>Boolean(value)&&!['Unknown','Turtle Down Under'].includes(value);
export function StrengthsIssues({rows,replyTime,onOpenEmail}){
 const conversations=conversationRows(rows);
 const external=conversations.filter(r=>r.organizationBasis!=='Internal-only thread');
 const located=external.filter(r=>['city','region','country'].every(f=>known(r[f])));
 const missing=external.filter(r=>['city','region','country'].some(f=>!known(r[f])));
 const confirmed=rows.filter(r=>r.status==='Confirmed');
 const review=rows.filter(r=>r.classificationConfidence!=='High'||r.status==='Needs review'||r.enquiryStage==='Needs review');
 const incoming=replyTime.pairs.length+replyTime.unanswered;
 const fast=replyTime.pairs.filter(p=>p.seconds<=3600);
 const slow=replyTime.pairs.filter(p=>p.seconds>86400);
 const byId=new Map(rows.map(r=>[r.id,r]));
 const fastRows=fast.map(p=>byId.get(p.incomingId)).filter(Boolean);
 const slowRows=slow.map(p=>byId.get(p.incomingId)).filter(Boolean);
 const verified=external.filter(r=>['Name in email content','Same contact mailbox; verified in another thread'].includes(r.organizationBasis));
 const unverified=external.filter(r=>!verified.includes(r));
 const queue=new Map();
 const add=(items,reason)=>items.forEach(r=>{if(!queue.has(r.id))queue.set(r.id,{...r,reasons:[]});queue.get(r.id).reasons.push(reason);});
 add(replyTime.unansweredRows,'No Turtle Down Under reply observed');
 add(slowRows,'Observed reply took over 24 hours');
 add(review,'Classification needs review');
 add(missing,'Contact location incomplete');
 add(unverified,'Company name assumed or missing');
 const reviewRows=[...queue.values()].map(r=>({...r,reason:r.reasons.join('; ')})).sort((a,b)=>b.timestamp.localeCompare(a.timestamp));
 const finding=(id,title,value,text,evidence,detail)=><DataComponent id={id} title={title} queryId="emails" kind="table" variant="card" sourceRows={evidence} displayRows={[{finding:title,value,interpretation:text}]}><div className="insight-finding" data-reviewed-rows><strong>{value}</strong><p>{text}</p>{detail&&<p className="hint">{detail}</p>}</div></DataComponent>;
 return <>
  <Section id="strengths-intro" title="Strengths & issues"><p className="intro">A review of the selected emails and conversations. Findings update with your filters. Reply matching looks across the full exported thread, including replies outside selected dates.</p><p className="hint">This is a 100-conversation export, not the full mailbox. No service-level target or prior-period benchmark has been provided, so these are observed strengths and review signals, not a performance score.</p></Section>
  {!rows.length?<p className="scope">No emails match these filters. Reset filters to view the analysis.</p>:<>
  <Section id="observed-strengths" title="Positive signals"><div className="insights-grid">
   {finding('insight-replies','Customers received replies',`${replyTime.pairs.length} / ${incoming}`,incoming?`${percent(replyTime.pairs.length,incoming)} of eligible incoming emails have an observed human reply from Turtle Down Under.`:'No eligible external incoming emails in this selection.',replyTime.sourceRows,'One reply can answer several incoming emails. This is email-level coverage, not a count of resolved enquiries.')}
   {finding('insight-fast','Replies within one hour',String(fast.length),replyTime.pairs.length?`${percent(fast.length,replyTime.pairs.length)} of matched incoming emails received a human reply within one elapsed hour.`:'No matched replies available for timing analysis.',fastRows,'One hour is a descriptive time band, not an agreed target.')}
   {finding('insight-confirmed','Confirmed-booking activity',String(confirmed.length),`${new Set(confirmed.map(r=>r.conversation)).size} conversations contain selected emails classified as confirmed-booking activity.`,confirmed,'These are messages about accepted or existing bookings, not unique bookings or a conversion rate. Classifications can require review.')}
   {finding('insight-addresses','Usable location information',`${located.length} / ${external.length}`,`${percent(located.length,external.length)} of external-contact conversations have city, region and country populated.`,located,'Some locations come from office matches or geographic inference; populated does not mean independently verified.')}
  </div></Section>
  <Section id="observed-issues" title="Issues to check"><div className="insights-grid">
   {finding('insight-unanswered','No reply visible in export',String(replyTime.unanswered),'Check these incoming emails in the full mailbox before deciding whether follow-up is overdue.',replyTime.unansweredRows,'The export can end before a reply arrives, split related threads, or omit history. This is not proof the customer was ignored.')}
   {finding('insight-slow','Replies taking over 24 hours',String(slow.length),`Average observed reply time: ${formatReplyTime(replyTime.seconds)}. Review the longer waits for possible handoff or coverage issues.`,replyTime.sourceRows,'Elapsed time includes nights and weekends. Over 24 hours is a review band, not an SLA breach; the cause is not established.')}
   {finding('insight-review','Uncertain classifications',String(review.length),'Review content evidence before using these emails to judge enquiry or booking progress.',review,'Includes non-high-confidence classifications and explicit review flags; this can overlap other findings.')}
   {finding('insight-data-gaps','Contact information gaps',`${missing.length} locations / ${unverified.length} companies`,`${missing.length} external-contact conversations have at least one unknown location field; ${unverified.length} have an assumed or missing company name.`,[...new Map([...missing,...unverified].map(r=>[r.id,r])).values()],'Confirm details from the contact or their signature. An email-domain assumption does not establish a location or company identity.')}
  </div></Section>
  <Section id="insight-next-steps" title="Suggested next steps"><ol className="insight-actions">
   <li>Check emails with no observed reply and longer waits against the complete mailbox; assign follow-up only where it is still needed.</li>
   <li>Review uncertain booking classifications and fill contact-location gaps from reliable evidence.</li>
   <li>Use Peak activity to check staffing coverage for busy weekdays and hours, then agree a business-hours reply target before assessing service performance.</li>
  </ol></Section>
  <Section id="insight-review-queue" title="Emails behind the review signals"><p className="hint">Select a row to read the full conversation. Location and company issues use the latest matching email per conversation; reply and classification issues are per email. Rows may have several reasons.</p>
   <DataComponent id="insight-review-table" queryId="emails" title={`${reviewRows.length} emails to inspect`} kind="table" variant="card" displayRows={reviewRows} sourceRows={rows}><DataTable rows={reviewRows} rowKey="id" pageSize={8} onRowSelect={onOpenEmail} rowActionLabel={r=>`Review email: ${r.subject}`} label="Emails behind review signals" columns={[{key:'timestamp',label:'Timestamp',renderCell:displayDate},{key:'sender_email',label:'Sender email'},{key:'subject',label:'Subject'},{key:'reason',label:'Reason to review'}]}/></DataComponent>
  </Section></>}
 </>;
}
