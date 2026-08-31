from pathlib import Path
import re

path = Path('family-location/v18/generate.py')
src = path.read_text()

if 'REQUIRED_VALIDATION_PATCH' in src:
    print('required validation already applied')
    raise SystemExit(0)

# Every question, including formerly optional written questions, counts toward completion.
src = re.sub(r"(?m)^\s*if q\.get\(['\"]optional['\"]\): continue\s*\n", '', src)
src = src.replace('placeholder="Optional"', 'placeholder="Your answer"')
src = src.replace(
    'Complete them in order or jump around. Every answer saves automatically.',
    'Every question is required. Complete sections in order or jump around; progress saves automatically.'
)

css_anchor = '.complete-banner.show{display:block}\n@media'
css_patch = '''.complete-banner.show{display:block}\n.required-note{font-size:13px;color:var(--muted);font-weight:750;margin-top:10px}.validation-summary{display:none;margin:12px 0;padding:12px 14px;border:1px solid #e0aaa5;border-radius:13px;background:#fff0ee;color:#b3261e;font-weight:750;line-height:1.4;scroll-margin-top:90px}.validation-summary.show{display:block}.question{scroll-margin-top:90px}.question.invalid{border-color:#b3261e;background:#fff0ee;box-shadow:0 0 0 2px rgba(179,38,30,.08)}.question.invalid textarea{border-color:#b3261e}.question-error{display:none;margin:10px 0 0;color:#b3261e;font-size:13px;font-weight:750}.question.invalid .question-error{display:block}\n@media'''
if css_anchor not in src:
    raise RuntimeError('CSS insertion anchor not found')
src = src.replace(css_anchor, css_patch, 1)

js_anchor = 'function bindSection(){'
js_patch = r'''/* REQUIRED_VALIDATION_PATCH */
function questionIsComplete(card){
 const text=card.querySelector('textarea[data-qid]');
 if(text)return text.value.trim().length>0;
 const checks=[...card.querySelectorAll('input[type=checkbox][data-qid]')];
 if(checks.length){const min=Number(checks[0].dataset.min||1);return checks.filter(x=>x.checked).length>=min}
 return !!card.querySelector('input[type=radio][data-qid]:checked');
}
function requiredMessage(card){
 const text=card.querySelector('textarea[data-qid]');if(text)return 'This question requires a written answer.';
 const checks=[...card.querySelectorAll('input[type=checkbox][data-qid]')];
 if(checks.length){const min=Number(checks[0].dataset.min||1);return min>1?'Select at least '+min+' answers before continuing.':'Select at least one answer before continuing.'}
 return 'Select an answer before continuing.';
}
function ensureRequiredUI(){
 const hero=document.querySelector('.hero');
 if(hero&&!hero.querySelector('.required-note')){const note=document.createElement('p');note.className='required-note';note.textContent='All questions in this section are required.';hero.appendChild(note)}
 let summary=document.querySelector('#validationSummary');
 if(!summary){summary=document.createElement('div');summary.id='validationSummary';summary.className='validation-summary';summary.setAttribute('role','alert');summary.setAttribute('aria-live','assertive');if(hero)hero.insertAdjacentElement('afterend',summary)}
 document.querySelectorAll('.question').forEach(card=>{if(!card.querySelector('.question-error')){const err=document.createElement('p');err.className='question-error';err.setAttribute('role','alert');card.appendChild(err)}});
 return summary;
}
function clearRequiredError(el){
 const card=el.closest('.question');if(!card)return;
 if(questionIsComplete(card)){card.classList.remove('invalid');const err=card.querySelector('.question-error');if(err)err.textContent=''}
 const summary=document.querySelector('#validationSummary');if(summary&&!document.querySelector('.question.invalid'))summary.classList.remove('show');
}
function validateRequiredSection(){
 const summary=ensureRequiredUI();const missing=[];
 document.querySelectorAll('.question').forEach(card=>{const ok=questionIsComplete(card);card.classList.toggle('invalid',!ok);const err=card.querySelector('.question-error');if(err)err.textContent=ok?'':requiredMessage(card);if(!ok)missing.push(card)});
 if(!missing.length){if(summary)summary.classList.remove('show');return true}
 if(summary){summary.textContent=missing.length===1?'Please answer the highlighted required question before continuing.':'Please answer all '+missing.length+' highlighted required questions before continuing.';summary.classList.add('show')}
 missing[0].scrollIntoView({behavior:'smooth',block:'start'});
 return false;
}
function bindRequiredValidation(){
 ensureRequiredUI();
 document.querySelectorAll('.question [data-qid]').forEach(el=>{const ev=el.tagName==='TEXTAREA'?'input':'change';el.addEventListener(ev,()=>clearRequiredError(el))});
 const forward=document.querySelector('.footer-nav .btn.primary');if(forward)forward.addEventListener('click',ev=>{if(!validateRequiredSection()){ev.preventDefault();ev.stopPropagation()}});
}
function bindSection(){'''
if js_anchor not in src:
    raise RuntimeError('JS insertion anchor not found')
src = src.replace(js_anchor, js_patch, 1)

end_anchor = "if(PAGE==='section')bindSection();"
if end_anchor not in src:
    raise RuntimeError('section bind anchor not found')
src = src.replace(end_anchor, "if(PAGE==='section'){bindSection();bindRequiredValidation();}", 1)

if "if q.get('optional'): continue" in src or 'placeholder="Optional"' in src:
    raise RuntimeError('optional-question behavior still present')
if 'REQUIRED_VALIDATION_PATCH' not in src or 'bindRequiredValidation' not in src:
    raise RuntimeError('validation patch missing')

path.write_text(src)
print('applied required-answer validation')
