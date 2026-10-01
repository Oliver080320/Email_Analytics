import {displayDate} from './date-format.mjs';
import {lastThreeMonths,dateWithWeekday} from './metrics.mjs';
import React,{useState,useEffect} from 'react';
import {Button} from '../../data-app-public.jsx';

export function MultiDateCalendar({availableDays,month,value,onChange,onMonthChange}) {
 const months=[...new Set(availableDays.map(d=>d.slice(0,7)))].sort();
 const [visible,setVisible]=useState(month==='all'?months.at(-1):month);
 useEffect(()=>{if(month!=='all')setVisible(month);},[month]);
 const selected=Array.isArray(value)?value:month!=='all'?availableDays.filter(d=>d.startsWith(month)):[];
 const monthLabel=m=>displayDate(m);
 const available=new Set(availableDays);
 const index=months.indexOf(visible);
 const first=new Date(visible+'-01T12:00:00Z');
 const offset=(first.getUTCDay()+6)%7;
 const count=new Date(Date.UTC(first.getUTCFullYear(),first.getUTCMonth()+1,0)).getUTCDate();
 const toggle=date=>onChange(selected.includes(date)?selected.filter(d=>d!==date):[...selected,date].sort());
 const label=first.toLocaleDateString('en',{month:'long',year:'numeric',timeZone:'UTC'});
 return <details className="multi-date-calendar">
  <summary>Date &amp; month: {month!=='all'?monthLabel(month):selected.length===1?dateWithWeekday(selected[0]):selected.length?`${selected.length} dates selected`:'All dates'}</summary>
  <div className="calendar-panel" aria-label="Select multiple dates">
   <p className="hint">Choose a whole month or click individual dates. You can select dates across months.</p>
   <div className="calendar-toolbar"><Button aria-label="Previous calendar month" disabled={index<=0} onClick={()=>setVisible(months[index-1])}>Previous</Button><select className="calendar-month" aria-label="Calendar month" value={visible} onChange={e=>setVisible(e.target.value)}>{months.map(m=><option key={m} value={m}>{monthLabel(m)}</option>)}</select><Button aria-label="Next calendar month" disabled={index>=months.length-1} onClick={()=>setVisible(months[index+1])}>Next</Button></div>
   <div className="calendar-toolbar"><Button onClick={()=>onMonthChange(visible)}>Select this month</Button><Button onClick={()=>onChange([])}>All dates</Button></div>
   <Button onClick={()=>{onChange(lastThreeMonths(availableDays));setVisible(months.at(-1));}}>Last 3 months in export</Button>
   <p className="hint">3-month window ends {displayDate(availableDays.at(-1))}; it is not relative to today.</p>
   <div className="calendar-days" role="group" aria-label={label}>
    {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d=><span className="calendar-weekday" key={d}>{d}</span>)}
    {Array.from({length:offset},(_,i)=><span key={'blank'+i}/>)}
    {Array.from({length:count},(_,i)=>{const date=visible+'-'+String(i+1).padStart(2,'0');return <button type="button" key={date} disabled={!available.has(date)} aria-label={dateWithWeekday(date)} title={dateWithWeekday(date)} aria-pressed={selected.includes(date)} onClick={()=>toggle(date)}>{i+1}</button>;})}
   </div>
   <div className="calendar-toolbar"><span className="hint" aria-live="polite">{selected.length} selected</span><Button onClick={()=>onChange([])}>Clear dates</Button></div>
   {Array.isArray(value)&&selected.length>0&&<div className="calendar-selected" aria-label="Selected dates">{selected.map(date=><button type="button" key={date} aria-label={'Remove '+dateWithWeekday(date)} onClick={()=>toggle(date)}>{dateWithWeekday(date)} &times;</button>)}</div>}
  </div>
 </details>;
}
