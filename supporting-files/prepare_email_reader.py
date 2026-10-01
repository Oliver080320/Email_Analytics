"""Prepare safe, structured email content for the local dashboard reader."""
import html
import json
import re
from pathlib import Path
from bs4 import BeautifulSoup, NavigableString, Comment

ROOT=Path(__file__).resolve().parent
raw=json.loads((ROOT/'groupsales_latest_100_conversations.json').read_text(encoding='utf-8-sig'))
path=ROOT.parent/'email-dashboard/src/data.json'
snapshot=json.loads(path.read_text(encoding='utf-8'))
allowed={'p','div','br','hr','strong','b','em','i','u','s','ul','ol','li','table','thead','tbody','tfoot','tr','th','td','h1','h2','h3','h4','h5','h6','pre','blockquote','a'}

def decode(s):
    for _ in range(20):
        t=html.unescape(s)
        if s==t:break
        s=t
    return s

def flatten(nodes):
    return ''.join(n if isinstance(n,str) else flatten(n[1]) for n in nodes)

docs=[];quotes=0
for cid,conversation in raw.items():
    for i,e in enumerate(conversation['emails']):
        soup=BeautifulSoup(e['full_body'],'html.parser')
        for n in soup.find_all(['script','style','head','meta','link','iframe','object','embed','form','input','button','svg']):n.decompose()
        body=soup.body or soup
        quote_started=[False];images=[0]
        def walk(node):
            if isinstance(node,Comment):return [],[]
            if isinstance(node,NavigableString):
                text=re.sub(r'\s+',' ',str(node))
                if re.match(r'^\s*(?:On .{0,220}wrote\s*:|From\s*:|[- ]*Original Message[- ]*)',text,re.I):quote_started[0]=True
                if not text:return [],[]
                return ([],[text]) if quote_started[0] else ([text],[])
            classes=' '.join(node.get('class',[])).lower()
            if node.name=='blockquote' or 'gmail_quote' in classes or node.get('id','').lower() in ('divrplyfwdmsg','appendonsend'):
                quote_started[0]=True
            if node.name=='img':
                images[0]+=1
                # Do not load external/tracking images or pretend missing CID attachments are present.
                label='[Image'+(': '+node.get('alt','').strip() if node.get('alt','').strip() else '')+' - not included in export]'
                token=['p',[label],{'imagePlaceholder':True}]
                return ([],[token]) if quote_started[0] else ([token],[])
            main=[];quoted=[]
            for child in node.children:
                a,b=walk(child);main.extend(a);quoted.extend(b)
            if node.name not in allowed:return main,quoted
            attrs={}
            if node.name=='a':
                href=node.get('href','').strip()
                if re.match(r'^(https?://|mailto:)',href,re.I):attrs['href']=href
            if node.name in ('td','th'):
                for old,new in [('colspan','colSpan'),('rowspan','rowSpan')]:
                    try:
                        number=int(node.get(old,1))
                        if 1<number<=100:attrs[new]=number
                    except (TypeError,ValueError):pass
            def wrap(children):return [[node.name,children,attrs]] if children or node.name in ('br','hr') else []
            if node.name in ('br','hr'):return ([],wrap([])) if quote_started[0] else (wrap([]),[])
            return wrap(main),wrap(quoted)
        main,quoted=walk(body)
        quotes+=bool(quoted)
        docs.append({'id':f'{cid}:{i}','conversation':cid,'timestamp':e['received_datetime'],
            'sender':e['sender'],'recipient':e.get('recipient',''),'subject':decode(e['subject']),
            'folder':e.get('folder',''),'main':main,'quoted':quoted,'imageCount':images[0],
            'preview':re.sub(r'\s+',' ',flatten(main)).strip()[:180]})
        # No truncation: every non-comment visible text node is retained in one of the sections.
        original=''.join(re.sub(r'\s+',' ',str(n)) for n in body.descendants if isinstance(n,NavigableString) and not isinstance(n,Comment))
        def original_text(nodes):
            return ''.join(n if isinstance(n,str) else ('' if n[2].get('imagePlaceholder') else original_text(n[1])) for n in nodes)
        assert re.sub(r'\s+','',original)==re.sub(r'\s+','',original_text(main)+original_text(quoted)), f'Text mismatch {cid}:{i}'
assert len(docs)==427
snapshot['queries']['messages']={'rows':docs,'source':{
    'label':'Complete email content from the supplied conversation JSON',
    'files':['groupsales_latest_100_conversations.json'],
    'caveats':['All readable body text is retained; scripts/styles are removed. External images are not loaded; attachment files are not included in the JSON.',
               'Quoted-history separation is heuristic. Expand quoted history to inspect the complete readable email.',
               'Conversation threads use original conversation IDs and are not merged based on inferred booking identity.'],
    'evidenceFlow':[{'title':'Structured rendering','detail':'Every visible source text node is checked against the main plus quoted sections. Paragraphs, lists, tables and safe links are preserved.'}]}}
for entry in snapshot['queries']['emails']['source'].get('evidenceFlow',[]):
    if 'No full message bodies are embedded.' in entry.get('detail',''):
        entry['detail']=entry['detail'].replace('No full message bodies are embedded.','Full readable message content is available separately in the conversation reader.')
snapshot['buildStatus']='updating'
path.write_text(json.dumps(snapshot,ensure_ascii=False,separators=(',',':')),encoding='utf-8')
print(json.dumps({'messages':len(docs),'messages_with_quoted_history':quotes,'snapshot_bytes':path.stat().st_size,'text_preservation':'427/427 passed'}))
