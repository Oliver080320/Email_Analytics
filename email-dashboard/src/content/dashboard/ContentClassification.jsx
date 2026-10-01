import {displayDate} from './date-format.mjs';
import React,{useState} from 'react';
import {Section,MetricCard,EvidenceChart,DataComponent,DataTable} from '../../data-app-public.jsx';
import {countBuckets} from './metrics.mjs';

export function ContentClassification({rows,onOpenEmail}){
 const [showEvidence,setShowEvidence]=useState(false);
 const newRows=rows.filter(r=>r.enquiryStage==='New');
 const existing=rows.filter(r=>r.enquiryStage==='Existing');
 const confirmed=rows.filter(r=>r.status==='Confirmed');
 const review=rows.filter(r=>r.classificationConfidence!=='High'||r.enquiryStage==='Needs review'||r.status==='Needs review');
 const categories=['FIT','Mix','Private','Not stated'].map(label=>({label,emails:newRows.filter(r=>(r.enquiryCategory||'Not stated')===label).length}));
 const metric=(id,title,subset,description)=><MetricCard id={id} queryId="emails" title={title} value={subset.length} sourceRows={subset} displayRows={[{label:title,emails:subset.length}]} description={description}><span className="hint">{description}</span></MetricCard>;
 const columns=[['timestamp','Timestamp'],['sender_email','Sender email'],['subject','Subject'],['senderNameAssumed','Sender name (assumed)'],['senderCompanyAssumed','Sender company (assumed)'],['status','Status'],['enquiryStage','Enquiry type'],['enquiryCategory','New enquiry category'],['classificationConfidence','Confidence'],['classificationEvidence','Content evidence'],['categoryEvidence','Category evidence'],['classificationNote','Review note'],['classificationSourceTime','Evidence timestamp'],['conversation','Conversation ID'],['relatedConversations','Related conversation IDs']].map(([key,label])=>({key,label,renderCell:key==='senderCompanyAssumed'?value=><span>{value||''}</span>:['timestamp','classificationSourceTime'].includes(key)?displayDate:undefined}));
 return <Section id="content-classification" title="Enquiries and confirmed bookings">
 <p className="intro">Classified per email, using content and preceding history. New means the first request in a conversation; replies and amendments are existing enquiries. A confirmed status means customer commitment or an evidenced existing booking, with any pending services noted below.</p>
 <div className="email-kpis">
 {metric('new-enquiries','New enquiry emails',newRows,'First request observed, directly or forwarded; at most one per conversation.')}
 {metric('existing-enquiries','Existing enquiry emails',existing,'Follow-ups, quotations and amendments before evidenced confirmation.')}
 {metric('confirmed-emails','Confirmed-booking emails',confirmed,'Emails about accepted/existing bookings, not the number of new bookings.')}
 {metric('classification-review','Emails to review',review,'Uncertain classifications, partial confirmations or operational inference. Overlaps other cards.')}
 </div>
 <div className="time-grid"><EvidenceChart id="classification-status" queryId="emails" title="Email content status" rows={countBuckets(rows,'status',['Enquiry','Confirmed','Automatic reply','Other','Needs review'])} sourceRows={rows} variant="card" height={260} spec={{type:'bar',x:'label',y:'emails',startAtZero:true,valueDecimals:0,showLegend:false}}/>
 <EvidenceChart id="classification-category" queryId="emails" title="Categories of new enquiries" rows={categories} sourceRows={newRows} variant="card" height={260} spec={{type:'bar',x:'label',y:'emails',startAtZero:true,valueDecimals:0,showLegend:false}}/></div>
 <p className="hint">Categories stay blank unless explicit in the request. Mix = private + shared services. “Not stated” represents blank categories. Automatic replies and other messages are separate from enquiries. Related threads may describe the same booking; these are email counts, not unique leads. Status is provisional where confidence is Medium or Low.</p>
 <label className="evidence-toggle"><input type="checkbox" checked={showEvidence} onChange={e=>setShowEvidence(e.target.checked)}/> Show supporting evidence columns</label>
 <DataComponent id="content-email-details" queryId="emails" title={`${rows.length} classified emails in selection`} kind="table" variant="card" displayRows={rows} sourceRows={rows}><DataTable rows={[...rows].sort((a,b)=>b.timestamp.localeCompare(a.timestamp))} columns={showEvidence?columns:columns.slice(0,9)} rowKey="id" onRowSelect={onOpenEmail} rowActionLabel={r=>`Read email: ${r.subject}`} label="Classified emails - select a row to read the message" pageSize={8}/></DataComponent>
 </Section>;
}
