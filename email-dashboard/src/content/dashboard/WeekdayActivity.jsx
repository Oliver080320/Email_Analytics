import {displayDate} from './date-format.mjs';
import React from 'react';
import {Section,EvidenceChart,DataComponent,DataTable} from '../../data-app-public.jsx';
import {weekdayActivity,dateWithWeekday} from './metrics.mjs';
const number=n=>n===null?'N/A':new Intl.NumberFormat('en',{maximumFractionDigits:2}).format(n);
export function WeekdayActivity({rows,days,weekScope}){
 const summary=weekdayActivity(rows,days).map((r,i)=>({...r,dates:days.filter(d=>(new Date(d+'T00:00:00Z').getUTCDay()+6)%7===i).join(', ')}));
 const cells=summary.flatMap(r=>r.hours.map((emails,hour)=>({weekday:r.weekday,hour:String(hour).padStart(2,'0')+':00',emails,days:r.days,average:r.days?emails/r.days:null})));
 const max=Math.max(0,...cells.map(c=>c.average||0));
 const highest=Math.max(0,...summary.map(r=>r.average||0));
 const leaders=summary.filter(r=>r.average===highest).map(r=>r.weekday).join(', ');
 return <Section id="weekday-activity" title="Busy weekdays and hours">
  <p className="intro">{weekScope?'This section shows the Monday-Sunday weeks containing your selected dates. Other dashboard sections keep your exact date selection.':'This section follows the selected month or all dates.'} Location and message filters still apply. Averages include covered days with zero emails.</p>
  {weekScope&&<p className="scope" aria-live="polite">Week coverage: {weekScope.ranges.map(r=>dateWithWeekday(r.start)+' to '+dateWithWeekday(r.end)).join('; ')}{weekScope.missing?` | ${weekScope.missing} dates outside export coverage are excluded; unavailable weekdays show N/A.`:''}</p>}
  {highest>0&&<p className="hint">Busiest by daily average: {leaders} ({number(highest)} emails per day). This export is a sample of the mailbox; patterns may not represent overall workload.</p>}
  <EvidenceChart id="weekday-average" queryId="emails" title="Average emails by day of week" variant="card" rows={summary.filter(r=>r.days>0).map(({hours,...r})=>r)} sourceRows={rows} height={250} description="Total emails for each weekday divided by the number of covered dates on that weekday. Missing weekday coverage is excluded, not shown as zero." spec={{type:'bar',x:'weekday',y:'average',startAtZero:true,showLegend:false,valueDecimals:2}}/>
  <DataComponent id="weekday-hour-heatmap" queryId="emails" title="Hour of day by weekday" kind="chart" variant="card" displayRows={cells} sourceRows={rows} description="Each cell is emails in that weekday and fixed clock hour divided by covered dates on that weekday. Calendar time, recorded timezone unspecified. Darker cells indicate busier hours; N/A means no covered dates.">
   <p className="hint">Average emails per one-hour window. Darker = busier; hover or focus a cell for counts. Scroll sideways for all 24 hours. Recorded timezone is unspecified.</p>
   <div className="weekday-heatmap" tabIndex={0} aria-label="Weekday and hour averages, scroll horizontally"><table data-reviewed-rows><caption>Average emails per hour for each weekday</caption><thead><tr><th scope="col">Weekday</th>{Array.from({length:24},(_,h)=><th scope="col" key={h}>{String(h).padStart(2,'0')}</th>)}</tr></thead><tbody>{summary.map((r,i)=><tr key={r.weekday}><th scope="row">{r.weekday}</th>{cells.slice(i*24,i*24+24).map(c=>{const strength=max?(c.average||0)/max:0;const label=`${c.weekday} ${c.hour}: ${number(c.average)} average emails; ${c.emails} emails across ${c.days} covered days`;return <td key={c.hour} tabIndex={0} aria-label={label} title={label} style={{background:c.average===null?'transparent':`rgba(0,112,185,${.06+strength*.84})`,color:strength>.5?'white':'var(--text-primary,#202830)'}}>{number(c.average)}</td>;})}</tr>)}</tbody></table></div>
  </DataComponent>
  <DataComponent id="weekday-peak-summary" queryId="emails" title="Peak one-hour windows by weekday" kind="table" variant="card" displayRows={summary.map(({hours,...r})=>r)} sourceRows={rows}>
   <DataTable rows={summary.map(({hours,...r})=>r)} pageSize={7} rowKey="weekday" label="Weekday totals and peak hours" columns={[{key:'weekday',label:'Weekday'},{key:'dates',label:'Dates',renderCell:displayDate},{key:'days',label:'Covered days'},{key:'emails',label:'Total emails'},{key:'average',label:'Avg / day',renderCell:number},{key:'peakWindows',label:'Peak hour(s)'},{key:'peakAverage',label:'Avg / peak hour',renderCell:number}]}/>
   <p className="hint">All tied peak hours are listed. 23:00-00:00 ends the next day. Averages use only covered occurrences of each weekday.</p>
  </DataComponent>
 </Section>;
}
