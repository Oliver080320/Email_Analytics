import csv,json,hashlib
from pathlib import Path
from datetime import datetime,timezone
from collections import Counter

root=Path(__file__).resolve().parent
convs=json.loads((root/'groupsales_latest_100_conversations.json').read_text(encoding='utf-8-sig'))
contacts={r['Conversation ID']:r for r in csv.DictReader((root/'conversation_contacts_enriched.csv').open(encoding='utf-8-sig'))}
rows=[]
for cid,conv in convs.items():
    c=contacts[cid]
    for n,e in enumerate(conv['emails']):
        dt=datetime.strptime(e['received_datetime'],'%Y-%m-%d %H:%M:%S')
        rows.append({'id':f'{cid}:{n}','conversation':cid,'timestamp':e['received_datetime'],
                     'day':dt.strftime('%Y-%m-%d'),'month':dt.strftime('%Y-%m'),'hour':dt.hour,
                     'direction':'Sent' if e['folder']=='Sent Items' else 'Received',
                     'autoReply':e['subject'].lower().startswith(('auto reply','automatic reply')),
                     'subject':e['subject'],'city':{'Bangalore':'Bengaluru','Gurgaon':'Gurugram'}.get(c['City'],c['City']) or 'Unknown',
                     'region':c['Region'] or 'Unknown','country':c['Country'] or 'Unknown',
                     'address':c['Full Address'] or '', 'locationSource':c['Location Source'],
                     'inferred':c['Inferred Fields'],'locationNote':c['Review Notes']})
rows.sort(key=lambda r:r['timestamp'])
assert len(rows)==427 and len({r['id'] for r in rows})==427
source={'label':'Group sales email export and enriched addresses',
 'files':['groupsales_latest_100_conversations.json','conversation_contacts_enriched.csv'],
 'metricDefinitions':[
 {'label':'Email count','definition':'Count individual email records in the supplied export, including received, sent and automatic replies unless filtered.'},
 {'label':'Hourly average','definition':'For each hour 00–23, count matching emails and divide by selected calendar days within the export date bounds; include days with no matching email records. A selected single day has denominator one.'},
 {'label':'Geography','definition':'Each message inherits the external-contact/business address assigned to its conversation. This is not necessarily the physical location of its sender. Geography bars count distinct conversations with at least one matching email.'}],
 'caveats':['This is a selected export of 100 conversations, not a complete mailbox history. Zero means no matching records in this export.',
 'Timestamp timezone is unspecified; times are shown unchanged. First and last dates and months have partial coverage.',
 'Addresses may come from signatures, company-office matches, or geographic inference; some contact branches are unconfirmed.'],
 'evidenceFlow':[{'title':'Source join','detail':'Read JSON email objects and join enriched CSV on Conversation ID, retaining one row per email. No full message bodies are embedded.'},
 {'title':'Reconciliation','detail':'427 email rows across 100 conversations. Timestamp parsing and unique row identities checked.'}]}
snapshot={'surface':'dashboard','title':'Group sales email activity','buildStatus':'creating','status':'observed',
          'generatedAt':datetime.now(timezone.utc).isoformat(),'filters':[],
          'queries':{'emails':{'rows':rows,'source':source}}}
(root/'email_dashboard_snapshot.json').write_text(json.dumps(snapshot,ensure_ascii=False),encoding='utf-8')
print(json.dumps({'emails':len(rows),'months':dict(Counter(r['month'] for r in rows)),'start':rows[0]['day'],'end':rows[-1]['day']}))
