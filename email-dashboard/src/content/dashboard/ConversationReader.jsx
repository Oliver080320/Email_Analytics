import React,{useMemo,useState,useEffect} from 'react';
import {Button,DataComponent} from '../../data-app-public.jsx';
import './conversation-reader.css';

const textOf=nodes=>nodes.map(n=>typeof n==='string'?n:textOf(n[1])).join(' ');
const titleOf=s=>s.replace(/^(?:(?:re|fw|fwd)\s*:\s*)+/ig,'').trim();
function Body({nodes}){
 return nodes.map((n,i)=>{
  if(typeof n==='string')return n;
  const [tag,children,attrs]=n;
  const props={key:i};
  if(tag==='a'&&attrs.href){props.href=attrs.href;props.target='_blank';props.rel='noopener noreferrer';}
  if(tag==='td'||tag==='th'){props.colSpan=attrs.colSpan;props.rowSpan=attrs.rowSpan;}
  if(attrs.imagePlaceholder)props.className='reader-image-note';
  if(tag==='br'||tag==='hr')return React.createElement(tag,props);
  // Tags and attributes come from a checked allowlist, not executable source HTML.
  return React.createElement(tag,props,<Body nodes={children}/>);
 });
}
function Message({message,annotation,open,onToggle,inScope,focused}){
 const [quoted,setQuoted]=useState(false);
 const hasMain=textOf(message.main).trim().length>0;
 return <article className="reader-message" id={focused?'reader-selected-message':undefined} data-message-id={message.id}>
 <button className="reader-message-toggle" aria-expanded={open} aria-label={`${open?'Collapse':'Read'} email from ${message.sender} at ${message.timestamp}`} onClick={onToggle}>
 <span className="reader-avatar" aria-hidden="true">{message.sender.slice(0,1).toUpperCase()}</span>
 <span className="reader-message-heading"><strong>{message.sender}</strong><span>{message.timestamp} · {message.folder}{!inScope?' · Outside dashboard filters':''}</span>{!open&&<span className="reader-preview">{message.preview||'Forwarded or quoted message'}</span>}</span>
 <span className="reader-badge">{annotation?.status||'Email'}</span><span aria-hidden="true">{open?'−':'+'}</span></button>
 {open&&<div className="reader-message-content">
 <dl className="reader-envelope"><dt>From</dt><dd>{message.sender}</dd><dt>To</dt><dd>{message.recipient||'Not provided'}</dd><dt>Sent / received</dt><dd>{message.timestamp} (recorded timezone unspecified)</dd><dt>Subject</dt><dd>{message.subject}</dd></dl>
 {annotation&&<details className="reader-evidence"><summary>Classification and supporting evidence</summary><p><strong>{annotation.status}</strong>{annotation.enquiryStage?' · '+annotation.enquiryStage+' enquiry':''}{annotation.enquiryCategory?' · '+annotation.enquiryCategory:''} · {annotation.classificationConfidence} confidence</p><p>{annotation.classificationEvidence}</p>{annotation.classificationNote&&<p>{annotation.classificationNote}</p>}</details>}
 <div className="reader-body" data-reviewed-rows>{hasMain?<Body nodes={message.main}/>:<p>This email contains forwarded or quoted content. Open the history below to read it.</p>}</div>
 {message.quoted.length>0&&<div className="reader-quote"><Button onClick={()=>setQuoted(!quoted)} aria-expanded={quoted}>{quoted?'Hide quoted history':'Show quoted history (full email)'}</Button><p className="reader-muted">Earlier replies are separated to avoid repetition. Nothing in this section is truncated.</p>{quoted&&<div className="reader-body reader-quoted-body" data-reviewed-rows><Body nodes={message.quoted}/></div>}</div>}
 {message.imageCount>0&&<p className="reader-muted">Image references are indicated in the message. Original image and attachment files are not included in this export.</p>}
 </div>}</article>;
}

export function ConversationReader({messages,allRows,scopeRows,initialEmail,onBack}){
 const [search,setSearch]=useState(''),[active,setActive]=useState(initialEmail?.conversation||''),[opened,setOpened]=useState(new Set(initialEmail?[initialEmail.id]:[])),[newest,setNewest]=useState(true);
 useEffect(()=>{if(initialEmail)document.getElementById('reader-selected-message')?.scrollIntoView({block:'start'});},[initialEmail]);
 const meta=useMemo(()=>new Map(allRows.map(r=>[r.id,r])),[allRows]);
 const scopeIds=useMemo(()=>new Set(scopeRows.map(r=>r.id)),[scopeRows]);
 const scopeConversations=useMemo(()=>new Set(scopeRows.map(r=>r.conversation)),[scopeRows]);
 const groups=useMemo(()=>{
  const out=new Map();for(const m of messages){if(!out.has(m.conversation))out.set(m.conversation,[]);out.get(m.conversation).push(m);}
  return [...out].map(([id,items])=>{items.sort((a,b)=>a.timestamp.localeCompare(b.timestamp));return{id,items,last:items.at(-1),title:titleOf(items.at(-1).subject),searchText:items.map(m=>[m.sender,m.recipient,m.subject,textOf(m.main),textOf(m.quoted)].join(' ')).join(' ').toLowerCase()};}).sort((a,b)=>b.last.timestamp.localeCompare(a.last.timestamp));
 },[messages]);
 const terms=search.toLowerCase().trim().split(/\s+/).filter(Boolean);
 const visible=groups.filter(g=>scopeConversations.has(g.id)&&terms.every(t=>g.searchText.includes(t)));
 const selected=visible.find(g=>g.id===active)||visible[0];
 const ordered=selected?(newest?[...selected.items].reverse():selected.items):[];
 const select=g=>{setActive(g.id);setOpened(new Set([g.last.id]));};
 const isOpen=m=>opened.has(m.id)||(opened.size===0&&!active&&selected?.last.id===m.id);
 const toggle=m=>{setActive(selected.id);setOpened(prev=>{const next=new Set(prev);if(isOpen(m))next.delete(m.id);else next.add(m.id);return next;});};
 return <section className="email-reader" aria-label="Conversation reader">
 <div className="reader-intro"><div><h2>Conversation reader</h2><p>Choose a conversation, then open its messages. Full threads include emails outside the dashboard’s selected dates so you can follow the context.</p></div><Button onClick={onBack}>Back to analytics</Button></div>
 <div className="reader-layout">
 <aside className="reader-sidebar" aria-label="Conversation list"><label htmlFor="reader-search">Search subject, sender or message content</label><input id="reader-search" type="search" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search conversations…"/><p className="reader-muted" aria-live="polite">{visible.length} conversations within dashboard filters</p><div className="reader-conversation-list">
 {visible.map(g=><button key={g.id} className="reader-conversation" aria-pressed={selected?.id===g.id} onClick={()=>select(g)}><strong>{g.title}</strong><span>{g.last.sender}</span><span>{g.items.length} emails · {g.last.timestamp.slice(0,10)}</span><span className="reader-preview">{g.last.preview||'Forwarded or quoted content'}</span></button>)}
 {!visible.length&&<p>No conversations match. Clear the search or adjust the dashboard filters above.</p>}</div></aside>
 <div className="reader-thread">{selected?<DataComponent id="reader-thread-evidence" queryId="messages" title={selected.title} kind="table" variant="card" sourceRows={selected.items} displayRows={selected.items.map(m=>({timestamp:m.timestamp,sender:m.sender,recipient:m.recipient,subject:m.subject}))}>
 <p className="reader-muted">{selected.items.length} emails · {selected.items.filter(m=>scopeIds.has(m.id)).length} match dashboard filters · {selected.items[0].timestamp.slice(0,10)} to {selected.last.timestamp.slice(0,10)}</p>
 <div className="reader-thread-tools"><Button onClick={()=>setNewest(!newest)}>{newest?'Newest first ↓':'Oldest first ↑'}</Button><Button onClick={()=>{setActive(selected.id);setOpened(new Set(selected.items.map(m=>m.id)));}}>Open all messages</Button><Button onClick={()=>{setActive(selected.id);setOpened(new Set());}}>Collapse all</Button></div>
 <details className="reader-thread-id"><summary>Conversation ID</summary><code>{selected.id}</code></details>
 <div className="reader-timeline">{ordered.map(m=><Message key={m.id} message={m} annotation={meta.get(m.id)} open={isOpen(m)} onToggle={()=>toggle(m)} inScope={scopeIds.has(m.id)} focused={m.id===initialEmail?.id}/>)}</div>
 </DataComponent>:<div className="reader-empty">Select a conversation to read its emails.</div>}</div>
 </div></section>;
}
