import React from 'react';
import {Section,DataComponent,DataTable} from '../../data-app-public.jsx';
export function contactDetails(rows){
 const groups=new Map();
 for(const row of [...rows].sort((a,b)=>b.timestamp.localeCompare(a.timestamp))){
  if(!row.organizationContact)continue;
  const key=row.organizationContact.toLowerCase();
  if(!groups.has(key))groups.set(key,{...row,values:Object.fromEntries(['physicalAddress','phoneNumber','landline','website'].map(k=>[k,new Set()]))});
  const group=groups.get(key);
  for(const field of Object.keys(group.values))if(row[field])group.values[field].add(row[field]);
 }
 return [...groups.values()].map(({values,...row})=>({...row,...Object.fromEntries(Object.entries(values).map(([k,v])=>[k,[...v].join(' | ')]))}));
}
export function ContactDetails({rows,onOpenEmail}){
 const contacts=contactDetails(rows);
 return <Section id="contact-details" title="Contact details"><p className="intro">Physical addresses, phone numbers and websites found in email content or reviewed signatures, matched by contact email. Missing details are blank. Select a row to read its conversation.</p>
  <DataComponent id="contact-directory" title={`${contacts.length} contacts in selection`} queryId="emails" kind="table" variant="card" displayRows={contacts} sourceRows={rows}>
   <DataTable rows={contacts} rowKey="organizationContact" pageSize={8} label="Contact address phone and website" onRowSelect={onOpenEmail} rowActionLabel={r=>`Read contact: ${r.organizationContact}`} columns={[
    ['contactNameAssumed','Contact name (assumed)'],['organizationContact','Contact email'],['organization','Organization'],['physicalAddress','Physical address'],['phoneNumber','Phone'],['landline','Landline'],['website','Website / supplied link']
   ].map(([key,label])=>({key,label,renderCell:value=><span>{value||''}</span>}))}/>
  </DataComponent><p className="hint">Details can come from another exported email for the same exact mailbox. Signature addresses may describe an office, and details may have changed. No contact details are guessed from an email domain.</p>
 </Section>;
}
