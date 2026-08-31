import json, html, pathlib, re
from textwrap import dedent

ROOT = pathlib.Path(__file__).parent
def load_data():
    datafile=ROOT/'data.json'
    if datafile.exists():
        return json.loads(datafile.read_text())
    src=ROOT/'source'
    parts=[]
    for name in ['adult0.js','adult1.js','adult2.js','adult3.js']:
        t=(src/name).read_text()
        m=re.search(r'push\((\"(?:\\.|[^\"\\])*\")\);',t,re.S)
        if not m: raise RuntimeError('cannot parse '+name)
        parts.append(json.loads(m.group(1)))
    adult=json.loads(''.join(parts))
    teen_text=(src/'teen.js').read_text()
    m=re.search(r'const TEEN_SECTIONS=(.*);\s*$',teen_text,re.S)
    if not m: raise RuntimeError('cannot parse teen.js')
    teen=json.loads(m.group(1))
    return {'adult':adult,'teen':teen}
DATA = load_data()
OUT = ROOT/'site'
OUT.mkdir(exist_ok=True)

CSS = r'''
:root{--bg:#f6f3ed;--card:#fff;--text:#20231f;--muted:#6c706a;--line:#deddd7;--accent:#315e50;--soft:#e7f0ec;--good:#2f6b4f;--warn:#9a6a22}
*{box-sizing:border-box}html{background:var(--bg)}body{margin:0;background:var(--bg);color:var(--text);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif}main{max-width:760px;margin:auto;padding:18px 14px 56px}a{color:inherit;text-decoration:none}button,input,textarea{font:inherit}.hero{padding:10px 2px 14px}.eyebrow{font-size:12px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:var(--accent)}h1{font-size:30px;line-height:1.08;margin:7px 0 8px}h2{font-size:23px;line-height:1.2;margin:0 0 8px}h3{margin:0;font-size:17px}p{line-height:1.5}.muted{color:var(--muted)}.card{background:var(--card);border:1px solid var(--line);border-radius:18px;padding:18px;box-shadow:0 8px 28px rgba(20,25,22,.06)}.people,.section-list{display:grid;gap:10px;margin-top:16px}.person,.section-card{display:block;width:100%;border:1px solid var(--line);border-radius:14px;background:#fff;padding:15px;text-align:left}.person strong{display:block;font-size:18px}.person span{display:block;margin-top:3px;color:var(--muted);font-size:14px}.section-card{display:grid;grid-template-columns:36px 1fr auto;align-items:center;gap:11px}.section-card:active,.person:active{background:var(--soft)}.statusdot{width:32px;height:32px;border-radius:50%;display:grid;place-items:center;background:#efede7;color:var(--muted);font-weight:900}.section-card.complete .statusdot{background:var(--soft);color:var(--good)}.section-card.inprogress .statusdot{background:#f6ead9;color:var(--warn)}.section-card small{display:block;color:var(--muted);margin-top:4px;line-height:1.3}.section-meta{text-align:right;color:var(--muted);font-size:12px;font-weight:700}.section-meta strong{display:block;color:var(--text);font-size:13px}.topline{position:sticky;top:0;z-index:20;background:rgba(246,243,237,.96);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);padding:8px 0 10px}.topinner{display:flex;align-items:center;justify-content:space-between;gap:10px}.badge{display:inline-flex;border:1px solid var(--line);background:#fff;border-radius:999px;padding:8px 11px;color:var(--accent);font-size:13px;font-weight:800}.back{border:1px solid var(--line);background:#fff;border-radius:999px;padding:8px 11px;font-size:13px;font-weight:750}.overall{font-size:12px;color:var(--muted);font-weight:700;margin:9px 0 5px}.bar{height:7px;background:#e8e6df;border-radius:999px;overflow:hidden}.bar>div{height:100%;background:var(--accent);width:0}.question{margin-top:12px}.question h3{line-height:1.35;margin-bottom:5px}.answers{display:grid;gap:8px;margin-top:12px}.answer{display:flex;align-items:flex-start;gap:10px;border:1px solid var(--line);border-radius:13px;padding:12px;background:#fff;line-height:1.35}.answer:has(input:checked){background:var(--soft);border-color:var(--accent)}input[type=radio],input[type=checkbox]{width:20px;height:20px;margin:0;flex:0 0 auto;accent-color:var(--accent)}textarea{width:100%;min-height:120px;border:1px solid var(--line);border-radius:13px;padding:12px;font-size:16px;margin-top:10px}.help{font-size:13px;color:var(--muted)}.save{position:sticky;bottom:10px;margin:14px auto 0;width:max-content;max-width:100%;padding:8px 12px;border-radius:999px;background:#20231f;color:#fff;font-size:12px;font-weight:750;opacity:.92}.footer-nav{display:flex;gap:10px;justify-content:space-between;margin-top:18px}.btn{display:inline-block;border-radius:13px;padding:12px 15px;background:#eceae4;font-weight:750}.btn.primary{background:var(--accent);color:#fff}.complete-banner{display:none;margin:14px 0 0;padding:12px 14px;background:var(--soft);border-radius:13px;font-weight:750;color:var(--good)}.complete-banner.show{display:block}
@media(min-width:620px){.people{grid-template-columns:repeat(3,1fr)}.answers.two{grid-template-columns:1fr 1fr}}
'''

JS = r'''
(function(){
'use strict';
const PERSON=document.body.dataset.person||'';
const PAGE=document.body.dataset.page||'';
const KEY='family-location-v18:'+PERSON;
let mem={};
function read(){try{return JSON.parse(localStorage.getItem(KEY)||'{}')||{}}catch(e){return mem}}
function write(x){mem=x;try{localStorage.setItem(KEY,JSON.stringify(x))}catch(e){}}
function hasValue(v){return Array.isArray(v)?v.length>0:(v!==undefined&&v!==null&&v!=='')}
function minNeeded(el){return Number(el.dataset.min||1)}
function sectionStatus(sec){
 const req=JSON.parse(sec.dataset.required||'[]');
 const a=read(); let n=0;
 req.forEach(q=>{const v=a[q.id]; if(q.type==='multi'){if(Array.isArray(v)&&v.length>=q.min)n++}else if(hasValue(v))n++});
 return {n,total:req.length,complete:req.length>0&&n===req.length,started:req.some(q=>hasValue(a[q.id]))};
}
function updateDashboard(){
 const cards=[...document.querySelectorAll('[data-section-card]')]; let answered=0,total=0,completeSections=0;
 cards.forEach(c=>{const s=sectionStatus(c);answered+=s.n;total+=s.total;if(s.complete)completeSections++;c.classList.toggle('complete',s.complete);c.classList.toggle('inprogress',!s.complete&&s.started);c.querySelector('.statusdot').textContent=s.complete?'✓':(s.started?'•':c.dataset.order);c.querySelector('.status-label').textContent=s.complete?'Complete':(s.started?'In progress':'Not started');c.querySelector('.status-count').textContent=s.n+'/'+s.total});
 const pct=total?Math.round(answered/total*100):0;const o=document.querySelector('#overall');if(o)o.textContent=answered+' of '+total+' required answered · '+pct+'%';const b=document.querySelector('#overallbar');if(b)b.style.width=pct+'%';const cb=document.querySelector('#completeBanner');if(cb)cb.classList.toggle('show',completeSections===cards.length&&cards.length>0);
}
function restoreSection(){
 const a=read();
 document.querySelectorAll('[data-qid]').forEach(el=>{const id=el.dataset.qid,v=a[id];if(el.type==='radio'){el.checked=String(v)===el.value}else if(el.type==='checkbox'){el.checked=Array.isArray(v)&&v.includes(el.value)}else if(el.tagName==='TEXTAREA'){el.value=v||''}});
}
function saveQuestion(el){
 const a=read(),id=el.dataset.qid;if(!id)return;
 if(el.type==='radio')a[id]=el.value;
 else if(el.type==='checkbox')a[id]=[...document.querySelectorAll('input[type=checkbox][data-qid="'+CSS.escape(id)+'"]:checked')].map(x=>x.value);
 else if(el.tagName==='TEXTAREA')a[id]=el.value;
 write(a);const s=document.querySelector('#saveState');if(s){s.textContent='Saved';clearTimeout(window.__saveTimer);window.__saveTimer=setTimeout(()=>s.textContent='Progress saves automatically',900)}
}
function bindSection(){
 restoreSection();
 document.querySelectorAll('[data-qid]').forEach(el=>{
   const ev=el.tagName==='TEXTAREA'?'input':'change';el.addEventListener(ev,()=>{
     if(el.type==='checkbox'&&el.checked){const group=[...document.querySelectorAll('input[type=checkbox][data-qid="'+CSS.escape(el.dataset.qid)+'"]')];const max=Number(el.dataset.max||999);const checked=group.filter(x=>x.checked);if(checked.length>max){el.checked=false;return}}
     saveQuestion(el);
   });
 });
}
if(PAGE==='dashboard'){updateDashboard();window.addEventListener('pageshow',updateDashboard);document.addEventListener('visibilitychange',()=>{if(!document.hidden)updateDashboard()})}
if(PAGE==='section')bindSection();
})();
'''

def e(x): return html.escape(str(x), quote=True)
def slug(x): return re.sub(r'[^a-z0-9]+','-',x.lower()).strip('-')

def shell(title, body, *, person='', page=''):
    return '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="theme-color" content="#f6f3ed"><title>'+e(title)+'</title><style>'+CSS+'</style></head><body data-person="'+e(person)+'" data-page="'+e(page)+'"><main>'+body+'</main><script>'+JS+'</script></body></html>'

body='''<div class="hero"><div class="eyebrow">Family Location Discovery · Clean Build 18</div><h1>Build the life first. Then find the place.</h1><p class="muted">Choose your name. Each person has separate saved progress.</p></div><section class="card"><h2>Who’s answering?</h2><div class="people">'''
for person,desc in [('David','Adult assessment'),('Ema','Adult assessment'),('Trystan','Teen assessment')]:
    body+=f'<a class="person" href="{person.lower()}.html"><strong>{person}</strong><span>{desc}</span></a>'
body+='</div></section>'
(OUT/'index.html').write_text(shell('Family Location Discovery',body),encoding='utf-8')

for person in ['David','Ema','Trystan']:
    role='teen' if person=='Trystan' else 'adult'; secs=DATA[role]; p=person.lower()
    b=f'''<div class="topline"><div class="topinner"><span class="badge">{person}’s Assessment</span><a class="back" href="index.html">Switch person</a></div><div id="overall" class="overall">Loading saved progress…</div><div class="bar"><div id="overallbar"></div></div></div><div class="card"><h2>Your sections</h2><p class="muted">Complete them in order or jump around. Every answer saves automatically.</p><div id="completeBanner" class="complete-banner">✓ All sections complete</div><div class="section-list">'''
    for i,(sid,name,desc,qs) in enumerate(secs,1):
        required=[]
        for q in qs:
            if q.get('optional'): continue
            mn=q.get('min') or (int(m.group(1)) if (m:=re.search(r'(?:pick|select)\s+(?:the\s+)?(\d+)',q['q'],re.I)) else 1)
            required.append({'id':q['id'],'type':'multi' if q['t']=='multi' else 'single','min':mn})
        req=e(json.dumps(required,separators=(',',':')))
        href=f'{p}-{sid}.html'
        b+=f'''<a class="section-card" data-section-card data-order="{i}" data-required="{req}" href="{href}"><span class="statusdot">{i}</span><span><h3>{e(name)}</h3><small>{e(desc)}</small></span><span class="section-meta"><strong class="status-label">Not started</strong><span class="status-count">0/{len(required)}</span></span></a>'''
    b+='</div></div>'
    (OUT/f'{p}.html').write_text(shell(f'{person} · Family Location Discovery',b,person=p,page='dashboard'),encoding='utf-8')

    for si,(sid,name,desc,qs) in enumerate(secs):
        b=f'''<div class="topline"><div class="topinner"><span class="badge">{person} · {e(name)}</span><a class="back" href="{p}.html">All sections</a></div></div><div class="hero"><div class="eyebrow">Section {si+1} of {len(secs)}</div><h1>{e(name)}</h1><p class="muted">{e(desc)}</p></div>'''
        for qi,q in enumerate(qs,1):
            b+=f'<section class="card question"><div class="eyebrow">Question {qi} of {len(qs)}</div><h3>{e(q["q"])}</h3>'
            if q['t']=='text':
                b+=f'<textarea data-qid="{e(q["id"])}" placeholder="Optional"></textarea>'
            else:
                mn=q.get('min') or (int(m.group(1)) if (m:=re.search(r'(?:pick|select)\s+(?:the\s+)?(\d+)',q['q'],re.I)) else 1)
                if q['t']=='multi': b+=f'<p class="help">Select {mn}' + (f' to {q["max"]}' if q.get('max',mn)>mn else '') + '.</p>'
                cls='answers two' if len(q.get('o',[]))<=6 else 'answers'
                b+=f'<div class="{cls}">'
                for oi,opt in enumerate(q.get('o',[])):
                    typ='checkbox' if q['t']=='multi' else 'radio'; nameattr=f'{p}-{q["id"]}'
                    extra=f' data-max="{q.get("max",99)}" data-min="{mn}"' if typ=='checkbox' else ''
                    b+=f'<label class="answer"><input type="{typ}" name="{e(nameattr)}" value="{oi}" data-qid="{e(q["id"])}"{extra}><span>{e(opt)}</span></label>'
                b+='</div>'
            b+='</section>'
        prev=f'{p}-{secs[si-1][0]}.html' if si>0 else f'{p}.html'; nxt=f'{p}-{secs[si+1][0]}.html' if si<len(secs)-1 else f'{p}.html'
        b+=f'<div class="footer-nav"><a class="btn" href="{prev}">← Previous</a><a class="btn primary" href="{nxt}">'+('Next section →' if si<len(secs)-1 else 'Back to sections')+'</a></div><div id="saveState" class="save">Progress saves automatically</div>'
        (OUT/f'{p}-{sid}.html').write_text(shell(f'{person} · {name}',b,person=p,page='section'),encoding='utf-8')

print('generated',len(list(OUT.glob('*.html'))),'pages')
