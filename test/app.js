/*!
 * NEXTxMOCK · app.js
 * © EduStream. All rights reserved.
 * Unauthorized copying, reverse-engineering or redistribution
 * of this file is strictly prohibited.
 */
;(function(_w,_d,_n){
'use strict';

/* ── ANTI-DEVTOOLS ──────────────────────────────────────────── */
(function(){
  // Block right-click context menu
  _d.addEventListener('contextmenu', function(e){ e.preventDefault(); return false; });
  // Block common devtools shortcuts
  _d.addEventListener('keydown', function(e){
    // F12
    if(e.keyCode===123){ e.preventDefault(); return false; }
    // Ctrl+Shift+I / Ctrl+Shift+J / Ctrl+Shift+C / Ctrl+U
    if(e.ctrlKey && e.shiftKey && [73,74,67].indexOf(e.keyCode)>-1){ e.preventDefault(); return false; }
    if(e.ctrlKey && e.keyCode===85){ e.preventDefault(); return false; }
    // Cmd variants on Mac
    if(e.metaKey && e.altKey && [73,67,74].indexOf(e.keyCode)>-1){ e.preventDefault(); return false; }
  });
  // DevTools size detection
  var _dt = false;
  var _dtCheck = function(){
    var w = _w.outerWidth - _w.innerWidth > 160;
    var h = _w.outerHeight - _w.innerHeight > 160;
    if((w||h) && !_dt){
      _dt = true;
      _d.body.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;min-height:100vh;font-family:sans-serif;background:#07112A;color:#fff;text-align:center;padding:40px;"><div><div style="font-size:64px;margin-bottom:20px;">🔒</div><h2 style="font-size:22px;margin-bottom:10px;">Access Restricted</h2><p style="color:#64748B;font-size:14px;">Developer tools detected. Please close DevTools and refresh the page.</p></div></div>';
    }
    if(!w && !h && _dt){ _dt=false; _w.location.reload(); }
  };
  setInterval(_dtCheck, 1000);
  // Disable text selection on most elements
  _d.addEventListener('selectstart', function(e){
    if(e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA'){
      e.preventDefault();
    }
  });
  // Disable drag
  _d.addEventListener('dragstart', function(e){ e.preventDefault(); });
  // Console warning
  var _warnStyle = 'color:#DC2626;font-size:20px;font-weight:bold;';
  var _warnStyle2 = 'color:#374151;font-size:13px;';
  setTimeout(function(){
    console.log('%c⛔ STOP!', _warnStyle);
    console.log('%cThis is a browser feature intended for developers. If someone told you to copy-paste something here, it is a scam and will give them access to your account.', _warnStyle2);
    console.log('%c© NEXTxMOCK by EduStream. Unauthorized access is prohibited.', _warnStyle2);
  }, 500);
})();

var _cfg = (function(){
  function _xd(s){ return atob(s).split('').map(function(c){ return String.fromCharCode(c.charCodeAt(0)^42); }).join(''); }
  return {
    W:  _xd('Ql5eWlkQBQVeT1leB09OX1leWE9LRwRMT0ZLXEMZHBgYBF1FWEFPWFkETk9c'),   // WORKER_URL
    K:  _xd('XkJDWQdDWQdHUwdBT1MHS0ZGRV1PTg=='),   // SECRET_KEY
    EW: _xd('Ql5eWlkQBQVeT1leB09cS0ZfXkVYBExPRktcQxkcGBgEXUVYQU9YWQROT1wFT1xLRl9LXk8HSEteSUI=')   // EVAL_WORKER
  };
})();

/* ── STATE ── */
var SAPP = 'NEXTTOPPER';
var S = {
  testId:null, testName:'', questions:[], answers:[], visited:[],
  bookmarked:[], current:0, totalTime:1800, remaining:1800,
  started:false, finished:false, timerH:null,
  qStartTime:null, timePerQ:[], paused:false
};
var _charts = {};
var _view = '';
var _palOpen = false;
var _dbPage = 1;
var _rvAtt = null, _rvPage = 0, _rvCharts = false;

/* ── UTILS ── */
var _app  = _d.getElementById('app');
var _tR   = _d.getElementById('toastRoot');
var _$    = function(id){ return _d.getElementById(id); };
var _esc  = function(s){ return s ? String(s).replace(/[&<>]/g, function(c){ return({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]); }) : ''; };
var _strip= function(h){ var t=_d.createElement('div'); t.innerHTML=h||''; return t.textContent||''; };
var _fmt  = function(s){ return String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0'); };
var _clamp= function(v,l,h){ return Math.max(l,Math.min(h,v)); };
var _sleep= function(ms){ return new Promise(function(r){ setTimeout(r,ms); }); };

/* ── STORAGE ── */
var _LS1 = 'nxm_v5_attempts';
var _LS2 = 'nxm_v5_resume';
var _getAtts = function(){ try{ return JSON.parse(localStorage.getItem(_LS1)||'[]'); }catch(e){ return []; } };
var _saveAtt  = function(a){ var arr=_getAtts(); var i=arr.findIndex(function(x){ return x.id===a.id; }); if(i>=0) arr[i]=a; else arr.unshift(a); localStorage.setItem(_LS1,JSON.stringify(arr)); };
var _getAtt   = function(id){ return _getAtts().find(function(a){ return a.id===id; }); };
var _getPend  = function(){ return _getAtts().filter(function(a){ return a.status==='evaluating'; }); };
var _saveRes  = function(){
  if(!S.started||S.finished) return;
  localStorage.setItem(_LS2, JSON.stringify({
    testId:S.testId, testName:S.testName, questions:S.questions,
    answers:S.answers, visited:S.visited, bookmarked:S.bookmarked,
    current:S.current, remaining:S.remaining, totalTime:S.totalTime, timePerQ:S.timePerQ
  }));
};
var _loadRes  = function(){ try{ return JSON.parse(localStorage.getItem(_LS2)); }catch(e){ return null; } };
var _clearRes = function(){ localStorage.removeItem(_LS2); };

/* ── TOAST ── */
function _toast(type, title, msg, dur){
  dur = dur===undefined ? 5000 : dur;
  var id = 'ts_'+Date.now();
  var icons = {success:'✅',info:'ℹ️',warn:'⚠️',error:'❌'};
  var el = _d.createElement('div');
  el.className = 'toast t-'+type;
  el.id = id;
  el.innerHTML = '<span class="toast-icon">'+(icons[type]||'📌')+'</span>'
    +'<div class="toast-body"><div class="toast-title">'+_esc(title)+'</div>'
    +'<div class="toast-msg">'+_esc(msg)+'</div></div>'
    +'<button class="toast-close" onclick="_dismissToast(\''+id+'\')">✕</button>';
  el.addEventListener('click', function(e){ if(!e.target.classList.contains('toast-close')) _dismissToast(id); });
  _tR.appendChild(el);
  if(dur) setTimeout(function(){ _dismissToast(id); }, dur);
}
function _dismissToast(id){
  var el=_$(id); if(!el) return;
  el.classList.add('dismiss');
  setTimeout(function(){ if(el.parentNode) el.parentNode.removeChild(el); }, 300);
}
_w._dismissToast = _dismissToast;

/* ── TIMER ── */
function _startTimer(){
  if(S.timerH) clearInterval(S.timerH);
  S.timerH = setInterval(function(){
    if(S.paused||S.finished){ if(S.finished) clearInterval(S.timerH); return; }
    S.remaining--;
    var el=_$('timerVal');
    if(el){ el.textContent=_fmt(S.remaining); el.className='t-val'+(S.remaining<=60?' warn':''); }
    if(S.remaining<=0){ clearInterval(S.timerH); if(!S.finished){ _toast('warn','Time Up!','Submitting your test automatically…'); _doSubmit(); } }
    if(S.remaining%30===0) _saveRes();
  }, 1000);
}
function _startQT(){ S.qStartTime=Date.now(); }
function _stopQT(){
  if(S.qStartTime && S.current>=0 && S.current<S.questions.length){
    var sec=Math.floor((Date.now()-S.qStartTime)/1000);
    S.timePerQ[S.current]=(S.timePerQ[S.current]||0)+sec;
  }
  S.qStartTime=null;
}

/* ── PROXY FETCH ── */
async function _proxyFetch(ep, testId){
  var url = _cfg.W + ep + '?test_id=' + testId + '&app=' + SAPP.toLowerCase();
  var res = await fetch(url, { headers:{'X-Secret-Key':_cfg.K,'X-App-Id':SAPP} });
  if(!res.ok){ var err=await res.json().catch(function(){ return {}; }); throw new Error(err.error||'HTTP '+res.status); }
  return res.json();
}
async function _fetchInst(id){ var d=await _proxyFetch('/get-instructions',id); if(!d.success) throw new Error(d.message||'Test not available'); return d.data; }
async function _fetchQs(id){ var d=await _proxyFetch('/get-questions',id); if(!d.success) throw new Error(d.message||'Questions not available'); return d.data; }

/* ── AI EVALUATOR WITH RETRY + RATE LIMIT HANDLING ── */
async function _evalRetry(payload, maxR){
  maxR = maxR||5;
  var attempt=0;
  while(attempt<=maxR){
    try{
      var res=await fetch(_cfg.EW, {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({answers:payload})
      });
      if(res.status===429){
        var ra=parseInt(res.headers.get('Retry-After')||'60');
        var wt=Math.min(ra*(attempt+1),300);
        _toast('info','AI Queue Busy','Rate limit hit. Retrying in ~'+Math.ceil(wt/60)+' min (attempt '+(attempt+1)+'/'+maxR+')…', (wt*1000)+3000);
        await _sleep(wt*1000);
        attempt++; continue;
      }
      if(!res.ok) throw new Error('HTTP '+res.status);
      var data=await res.json();
      if(!data.results) throw new Error('Invalid evaluation response');
      return data;
    } catch(err){
      if(attempt>=maxR) throw err;
      var w2=Math.min(30*(Math.pow(2,attempt)),300)*1000;
      attempt++; await _sleep(w2);
    }
  }
  throw new Error('Evaluation failed after maximum retries');
}

/* ── BACKGROUND EVALUATION ── */
async function _bgEval(attId){
  var att=_getAtt(attId); if(!att||att.status!=='evaluating') return;
  var payload=att._rq.map(function(q,i){ return {question:_strip(q.text),options:q.options,student_answer:att._ra[i]||null}; });
  try{
    var data=await _evalRetry(payload);
    var score=0;
    var details=data.results.map(function(r,i){
      var ok=r.correct===true; if(ok) score+=5;
      return { questionText:att._rq[i].text, options:att._rq[i].options, userAnswer:att._ra[i]||null,
               correctAnswer:r.correct_option||'—', explanation:r.explanation||(ok?'Correct.':'Incorrect.'),
               correct:ok, timeSpent:att._tp?.[i]||0 };
    });
    var ms=att._rq.length*5;
    var updated=Object.assign({},att,{
      status:'done', score:score, maxScore:ms,
      percentage:((score/ms)*100).toFixed(1), details:details,
      _rq:undefined, _ra:undefined, _tp:undefined
    });
    _saveAtt(updated);
    _toast('success','Results Ready!',att.testName+' evaluated — '+updated.percentage+'% score. Click to view.',8000);
    if(_view==='dashboard') _renderDash();
    _updEvalBadge();
  } catch(err){
    _saveAtt(Object.assign({},att,{status:'eval_failed',evalError:err.message,_rq:undefined,_ra:undefined,_tp:undefined}));
    _toast('error','Evaluation Failed','Could not evaluate '+att.testName+': '+err.message);
    if(_view==='dashboard') _renderDash();
    _updEvalBadge();
  }
}

/* ── EVAL BADGE ── */
function _updEvalBadge(){
  var p=_getPend(), b=_$('evalBadge');
  if(b){ if(p.length>0){ b.style.display='inline-flex'; var n=_$('evalBadgeN'); if(n) n.textContent=p.length+' evaluating…'; } else { b.style.display='none'; } }
}

/* ── HEADER ── */
function _hdr(mode, name, totalQ){
  var isTst=mode==='test', isDB=mode==='dashboard';
  var pending=_getPend();
  var evalB='<div id="evalBadge" style="display:'+((!isTst&&pending.length>0)?'inline-flex':'none')+'" class="eval-badge" onclick="_goDash()" title="'+pending.length+' result(s) evaluating"><div class="eb-spin"></div><span id="evalBadgeN">'+pending.length+' evaluating\u2026</span></div>';
  var timer=isTst?'<div class="timer-wrap"><span class="t-lbl">Time Left</span><span class="t-val'+(S.remaining<=60?' warn':'')+'" id="timerVal">'+_fmt(S.remaining)+'</span></div>':'';
  var meta=isTst?'<div class="hdr-pill">'+totalQ+' Qs\u00a0\u00b7\u00a0+5/\u22121</div>':'';
  var mobQ=isTst?'<button class="mob-pal-btn" onclick="_togglePal()"><span class="mbdot"></span>Qs</button>':'';
  var appLbl=SAPP==='NEXTTOPPER'?'NextTopper':'Mission Jeet';
  return '<header class="hdr"><div class="hdr-brand"><div class="brand-logo">NEXT<em>x</em>MOCK</div><span class="brand-sub">'+appLbl+'</span></div>'
    +'<div class="hdr-mid"><span class="hdr-test-name">'+_esc(name)+'</span>'+meta+'</div>'
    +'<div class="hdr-right">'+evalB+timer+'<button class="hdr-btn'+(isDB?' active':'')+'" onclick="_goDash()">📊 Dashboard</button>'+mobQ+'</div>'
    +'</header>';
}

/* ── PAGE LOAD ── */
function _pgLoad(msg){
  _app.innerHTML=_hdr('inst','Loading\u2026',0)
    +'<div class="pg-load"><div class="spin-ring"></div>'
    +'<div class="spin-txt">'+_esc(msg)+'</div>'
    +'<div class="spin-dots"><span></span><span></span><span></span></div></div>';
}
function _showOvl(title,desc){
  var el=_d.createElement('div'); el.className='ovl'; el.id='_ovl';
  el.innerHTML='<div class="ovl-card"><div class="spin-ring"></div><h4>'+_esc(title)+'</h4><p>'+_esc(desc)+'</p><div class="prog-bar"><div class="prog-inner"></div></div></div>';
  _d.body.appendChild(el);
}
function _hideOvl(){ var e=_$('_ovl'); if(e) e.parentNode.removeChild(e); }

/* ── INSTRUCTIONS ── */
function _renderInst(data){
  var mins=Math.round(parseInt(data.total_time||1800)/60);
  _app.innerHTML=_hdr('inst',data.test_name||'Mock Test',0)
    +'<div class="page-wrap"><div class="page-body"><div class="inst-card">'
    +'<div class="inst-hero"><h2>'+_esc(data.test_name||'Mock Test')+'</h2><p>Read all instructions carefully before starting</p></div>'
    +'<div class="inst-chips">'
    +'<div class="ic"><em>Duration</em><strong>'+mins+' min</strong></div>'
    +'<div class="ic"><em>Questions</em><strong>'+(data.total_questions||'—')+'</strong></div>'
    +'<div class="ic"><em>Correct</em><strong style="color:var(--green)">+5</strong></div>'
    +'<div class="ic"><em>Wrong</em><strong style="color:var(--red)">−1</strong></div>'
    +'<div class="ic"><em>Skipped</em><strong style="color:var(--g5)">0</strong></div>'
    +'<div class="ic"><em>ID</em><strong>'+_esc(S.testId)+'</strong></div></div>'
    +'<div class="inst-content"><h3>Instructions</h3>'
    +'<div class="inst-html">'+(data.test_instructions||'<p>Read each question carefully. Select the best answer.</p>')+'</div>'
    +'<div class="inst-note">✨ AI evaluates answers in the background after submission. You\'ll be notified when results are ready.</div></div>'
    +'<div class="inst-foot"><span class="inst-foot-note">⚡ Stable internet required · Timer starts immediately</span>'
    +'<button class="btn-start" id="startBtn">Start Examination →</button>'
    +'</div></div></div></div>';
  _$('startBtn').addEventListener('click', _handleStart);
}

function _renderWarn(msg, testId){
  _app.innerHTML=_hdr('inst','Test Unavailable',0)
    +'<div class="page-wrap"><div class="page-body"><div class="warning-card">'
    +'<h3>⛔ Test Unavailable</h3><p>'+_esc(msg)+'</p>'
    +'<p style="font-size:13px;opacity:.8;"><strong>Test ID:</strong> '+testId+' · <strong>Platform:</strong> '+SAPP+'</p>'
    +'<button class="btn btn-blue" onclick="_goDash()">📊 Go to Dashboard</button>'
    +'</div></div></div>';
}

/* ── RENDER TEST ── */
function _renderTest(){
  _view='test';
  var qs=S.questions, ans=S.answers, vis=S.visited, bk=S.bookmarked;
  var cur=S.current, tq=qs.length;
  var nAns=ans.filter(function(a){ return a!==null; }).length;
  var nVis=vis.filter(function(v,i){ return v&&ans[i]===null; }).length;
  var nNv=vis.filter(function(v){ return !v; }).length;
  var q=qs[cur], sel=ans[cur], isBk=bk[cur];

  var palGrid=qs.map(function(_,i){
    var c='qb';
    if(i===cur) c+=' qs-cur';
    else if(ans[i]!==null) c+=' qs-ans';
    else if(vis[i]) c+=' qs-vis';
    if(bk[i]) c+=' qs-bk';
    return '<div class="'+c+'">'+( i+1)+'</div>';
  }).join('');

  var opts=['A','B','C','D'].map(function(k){
    if(!q.options[k]) return '';
    var s=sel===k;
    return '<div class="opt'+(s?' sel':'')+'" data-k="'+k+'">'
      +'<div class="radio-ring"><div class="radio-dot"></div></div>'
      +'<span class="opt-k">'+k+'.</span>'
      +'<span class="opt-t">'+q.options[k]+'</span></div>';
  }).join('');

  _app.innerHTML=_hdr('test',S.testName,tq)
    +'<div class="test-layout">'

    // Question side
    +'<div class="q-side">'
    +'<div class="section-bar"><span class="sec-name">Section A</span><div class="sec-divider"></div>'
    +'<span class="sec-progress">Q'+(cur+1)+' of '+tq+'</span>'
    +'<span class="marks-chip mk-pos">+5</span><span class="marks-chip mk-neg">−1</span></div>'
    +'<div class="q-scroll" id="qScroll">'
    +'<div class="q-block"><div class="q-num-badge'+(sel?' ans':'')+'">'+( cur+1)+'</div>'
    +'<div class="q-text">'+q.text+'</div></div>'
    +'<div class="opts">'+opts+'</div></div>'
    +'<div class="q-footer">'
    +'<div class="q-footer-l">'
    +'<button class="btn" '+(cur===0?'disabled style="opacity:.38;cursor:default;"':'')+' onclick="_goQ('+(cur-1)+')">← Prev</button>'
    +'<button class="btn btn-ghost-red" onclick="_clearAns()">Clear</button>'
    +'<button class="bk-btn'+(isBk?' active':'')+'" onclick="_toggleBk()">'+(isBk?'★':'☆')+' Bookmark</button>'
    +'</div>'
    +'<div class="q-footer-c"><button class="btn btn-navy" onclick="_confirmSub()">Submit Test</button></div>'
    +'<div class="q-footer-r"><button class="btn btn-blue" onclick="'+(cur<tq-1?'_goQ('+(cur+1)+')':'_confirmSub()')+'">'+( cur<tq-1?'Save & Next →':'Review & Submit')+'</button></div>'
    +'</div></div>'

    // Palette side
    +'<div class="pal-col" id="palCol">'
    +'<div class="pal-hd"><div class="pal-hd-row"><span class="pal-title">Navigator</span>'
    +'<span class="pal-answered">'+nAns+'/'+tq+' answered</span></div>'
    +'<div class="pal-stats">'
    +'<div class="pstat ps-g"><div class="psdot"></div><div><div class="ps-n">'+nAns+'</div><div class="ps-l">Answered</div></div></div>'
    +'<div class="pstat ps-r"><div class="psdot"></div><div><div class="ps-n">'+nVis+'</div><div class="ps-l">Not Answered</div></div></div>'
    +'<div class="pstat ps-a"><div class="psdot"></div><div><div class="ps-n">'+nNv+'</div><div class="ps-l">Not Visited</div></div></div>'
    +'<div class="pstat ps-b"><div class="psdot"></div><div><div class="ps-n">'+tq+'</div><div class="ps-l">Total</div></div></div>'
    +'</div></div>'
    +'<div class="pal-body"><div class="pal-sec-lbl">Question Palette</div>'
    +'<div class="pal-grid">'+palGrid+'</div></div>'
    +'<div class="pal-legend">'
    +'<div class="li"><span class="ld ld-nv"></span>Not Visited</div>'
    +'<div class="li"><span class="ld ld-vis"></span>Skipped</div>'
    +'<div class="li"><span class="ld ld-ans"></span>Answered</div>'
    +'<div class="li"><span class="ld ld-cur"></span>Current</div>'
    +'<div class="li"><span class="ld ld-bk"></span>Bookmarked</div></div>'
    +'<div class="pal-actions">'
    +'<button class="pal-action-btn pal-pause" onclick="_togglePause()">⏸ Pause Test</button>'
    +'<button class="pal-action-btn pal-finish" onclick="_confirmSub()">✓ Finish & Submit</button>'
    +'</div></div>'

    +'</div>';

  _d.querySelectorAll('.qb').forEach(function(b,i){ b.addEventListener('click',function(){ _goQ(i); }); });
  _d.querySelectorAll('.opt').forEach(function(o){ o.addEventListener('click',function(){ _pickOpt(o.dataset.k); }); });
}

/* ── TEST ACTIONS ── */
function _togglePal(){ var p=_$('palCol'); if(p){ _palOpen=!_palOpen; p.classList.toggle('open',_palOpen); } }
function _goQ(idx){
  if(S.finished||idx<0||idx>=S.questions.length) return;
  _stopQT(); S.current=idx; S.visited[idx]=true;
  _renderTest(); _startQT(); _saveRes();
  if(_w.innerWidth<=900){ _palOpen=false; var p=_$('palCol'); if(p) p.classList.remove('open'); }
}
function _pickOpt(k){ if(S.finished) return; S.answers[S.current]=k; S.visited[S.current]=true; _renderTest(); _saveRes(); }
function _clearAns(){ if(S.finished) return; S.answers[S.current]=null; _renderTest(); _saveRes(); }
function _toggleBk(){ if(S.finished) return; S.bookmarked[S.current]=!S.bookmarked[S.current]; _renderTest(); _saveRes(); }

function _togglePause(){
  if(S.finished) return; S.paused=true;
  var el=_d.createElement('div'); el.className='pause-ovl'; el.id='pauseOvl';
  el.innerHTML='<div class="pause-card"><div class="p-icon">⏸</div><h3>Test Paused</h3>'
    +'<p>Your progress is saved. Click Resume when ready.</p>'
    +'<button class="btn btn-blue" style="font-size:14px;padding:11px 28px;" onclick="_resumeTest()">▶ Resume Test</button></div>';
  _d.body.appendChild(el);
}
function _resumeTest(){ S.paused=false; var el=_$('pauseOvl'); if(el) el.parentNode.removeChild(el); }

/* ── CONFIRM SUBMIT ── */
function _confirmSub(){
  if(S.finished) return;
  var nA=S.answers.filter(function(a){ return a!==null; }).length;
  var listH=S.questions.map(function(q,i){
    var a=S.answers[i], p=_strip(q.text).substring(0,70);
    return '<div class="ml-row"><span class="ml-qn">Q'+(i+1)+'</span>'
      +'<span class="ml-qt">'+_esc(p)+(p.length>=70?'…':'')+'</span>'
      +'<span class="ml-a '+(a?'y':'n')+'">'+(a||'—')+'</span></div>';
  }).join('');
  var m=_d.createElement('div'); m.className='moverlay'; m.id='subMod';
  m.innerHTML='<div class="modal"><div class="modal-hd"><h3>Review & Submit</h3><p>Verify responses before submission</p></div>'
    +'<div class="modal-stats">'
    +'<div class="mst"><div class="mn mn-g">'+nA+'</div><div class="ml">Answered</div></div>'
    +'<div class="mst"><div class="mn mn-r">'+(S.questions.length-nA)+'</div><div class="ml">Unattempted</div></div>'
    +'<div class="mst"><div class="mn mn-y">'+_fmt(S.remaining)+'</div><div class="ml">Time Left</div></div>'
    +'</div><div class="modal-list">'+listH+'</div>'
    +'<div class="modal-ft"><button class="btn" onclick="_$(\'subMod\').parentNode.removeChild(_$(\'subMod\'))">← Go Back</button>'
    +'<button class="btn btn-blue" onclick="_doSubmit()">Confirm &amp; Submit</button></div></div>';
  _d.body.appendChild(m);
}

/* ── SUBMIT ── */
async function _doSubmit(){
  if(S.finished) return;
  S.finished=true;
  if(S.timerH) clearInterval(S.timerH);
  _stopQT();
  var sm=_$('subMod'); if(sm) sm.parentNode.removeChild(sm);
  var po=_$('pauseOvl'); if(po) po.parentNode.removeChild(po);
  var tT=S.totalTime-S.remaining, ts=Date.now();
  var attId=ts+'-'+S.testId;
  // Save stub immediately
  var stub={
    id:attId, testId:S.testId, testName:S.testName,
    timestamp:ts, timeTaken:tT, score:0,
    maxScore:S.questions.length*5, percentage:'—',
    status:'evaluating', details:[],
    _rq:S.questions, _ra:[].concat(S.answers), _tp:[].concat(S.timePerQ)
  };
  _saveAtt(stub);
  _clearRes();
  _toast('info','Test Submitted!','AI is evaluating your answers in the background. You\'ll be notified when done.',6000);
  _goDash();
  _bgEval(attId).catch(function(){});
}

/* ── FULL-SCREEN REVIEW ── */
function _showReview(id){
  var att=_getAtt(id); if(!att) return;
  if(att.status==='evaluating'){
    _toast('info','Still Evaluating','AI is still processing. Please wait for results.'); return;
  }
  _rvAtt=att; _rvPage=0; _rvCharts=false;
  _view='review'; _renderReview();
}

function _renderReview(){
  var att=_rvAtt, det=att.details, tq=det.length, d=det[_rvPage];
  var nC=det.filter(function(x){ return x.correct; }).length;
  var nW=det.filter(function(x){ return !x.correct&&x.userAnswer; }).length;
  var nS=det.length-nC-nW;
  var sts=d.correct?'ok':d.userAnswer?'bad':'skip';
  var stL=d.correct?'✅ Correct':d.userAnswer?'❌ Incorrect':'⬜ Skipped';
  var mE=d.correct?'+5 marks':d.userAnswer?'0 marks':'0 marks';

  var optsH=['A','B','C','D'].map(function(k){
    if(!d.options||!d.options[k]) return '';
    var isCor=k===d.correctAnswer, isWr=k===d.userAnswer&&!d.correct;
    var cls='rv-opt';
    if(isCor) cls+=' is-correct';
    if(isWr)  cls+=' is-wrong';
    if(!isCor&&!isWr) cls+=' unchosen';
    return '<div class="'+cls+'"><div class="rv-opt-indicator">'+(isCor?'✓':isWr?'✗':'')+'</div>'
      +'<span class="rv-opt-key">'+k+'.</span><span class="rv-opt-txt">'+_esc(d.options[k])+'</span></div>';
  }).join('');

  // Pagination
  var SHOW=12, half=Math.floor(SHOW/2);
  var lo=Math.max(0,_rvPage-half), hi=Math.min(tq-1,lo+SHOW-1);
  lo=Math.max(0,hi-SHOW+1);
  var pgNums='';
  if(lo>0) pgNums+='<div class="pnum" onclick="_rvGo(0)">1</div><span style="color:var(--g5);padding:0 3px;align-self:center;">…</span>';
  for(var i=lo;i<=hi;i++){
    var di=det[i];
    var pc=i===_rvPage?'on':(di.correct?'ok':di.userAnswer?'bad':'skip');
    pgNums+='<div class="pnum '+pc+'" onclick="_rvGo('+i+')">'+(i+1)+'</div>';
  }
  if(hi<tq-1) pgNums+='<span style="color:var(--g5);padding:0 3px;align-self:center;">…</span><div class="pnum" onclick="_rvGo('+(tq-1)+')">'+tq+'</div>';

  var ts=d.timeSpent?'<span class="tspent">⏱ '+d.timeSpent+'s</span>':'';

  var html='<div class="review-overlay" id="rvOverlay">'

    // Header
    +'<div class="rv-hdr"><div class="rv-hdr-l"><h2>📋 Review — '+_esc(att.testName)+'</h2>'
    +'<p>Q'+(_rvPage+1)+' of '+tq+' · '+new Date(att.timestamp).toLocaleDateString()+'</p></div>'
    +'<div class="rv-hdr-r"><button class="btn btn-sm" onclick="_closeReview()">← Back</button>'
    +'<button class="btn btn-sm btn-navy" onclick="_closeReview();_goDash()">Dashboard</button></div></div>'

    // Summary ribbon
    +'<div class="rv-summary">'
    +'<div class="rv-score-wrap"><span class="rv-score-big">'+att.percentage+'%</span>'
    +'<span class="rv-score-sub">'+att.score+'/'+att.maxScore+'</span></div>'
    +'<div class="rv-sep"></div>'
    +'<div class="rv-stat"><span class="rv-stat-dot" style="background:var(--green)"></span>'
    +'<span class="rv-stat-val" style="color:var(--green)">'+nC+'</span><span class="rv-stat-lbl">Correct</span></div>'
    +'<div class="rv-stat"><span class="rv-stat-dot" style="background:var(--red)"></span>'
    +'<span class="rv-stat-val" style="color:var(--red)">'+nW+'</span><span class="rv-stat-lbl">Wrong</span></div>'
    +'<div class="rv-stat"><span class="rv-stat-dot" style="background:var(--g4)"></span>'
    +'<span class="rv-stat-val" style="color:var(--g6)">'+nS+'</span><span class="rv-stat-lbl">Skipped</span></div>'
    +'<span style="font-size:12px;color:var(--g5);margin-left:auto;white-space:nowrap;">Time: '+_fmt(att.timeTaken)+'</span>'
    +'<button class="btn btn-xs" onclick="_toggleCharts()">'+(_rvCharts?'✕ Charts':'📊 Charts')+'</button></div>'

    // Charts (hidden by default)
    +'<div class="rv-charts'+(_rvCharts?'':' hidden')+'" id="rvCharts">'
    +'<div style="text-align:center;"><canvas id="rvPie" width="180" height="180"></canvas>'
    +'<div style="font-size:11px;color:var(--g5);margin-top:5px;">Score Breakdown</div></div>'
    +'<div><canvas id="rvBar" width="420" height="180"></canvas>'
    +'<div style="font-size:11px;color:var(--g5);margin-top:5px;">Marks per Question</div></div></div>'

    // Question card
    +'<div class="rv-body" id="rvBody"><div class="rv-q-card">'
    +'<div class="rv-q-banner '+sts+'"><span>'+stL+'</span>'
    +'<span style="opacity:.7;">Q'+(_rvPage+1)+'</span>'
    +'<span class="rv-marks-b">'+mE+'</span></div>'
    +'<div class="rv-q-text-area">'
    +'<div class="rv-q-num">Question '+(_rvPage+1)+' '+ts+'</div>'
    +'<div class="rv-q-text">'+d.questionText+'</div></div>'
    +'<div class="rv-opts">'+optsH+'</div>'
    +'<div class="rv-ans-row">'
    +'<div class="rv-ans-chip user-ans">👤 Your Answer: <strong>'+(d.userAnswer||'Not Answered')+'</strong></div>'
    +'<div class="rv-ans-chip correct-ans">✓ Correct: <strong>'+d.correctAnswer+'</strong></div></div>'
    +'<div class="rv-exp"><div class="rv-exp-label">AI Explanation</div>'
    +'<div class="rv-exp-txt">'+_esc(d.explanation)+'</div></div>'
    +'</div></div>'

    // Pagination
    +'<div class="rv-pagination">'
    +'<span class="rv-pag-info">Q'+(_rvPage+1)+' / '+tq+'</span>'
    +'<div class="rv-pag-nums">'+pgNums+'</div>'
    +'<div class="rv-pag-btns">'
    +'<button class="btn btn-sm" '+(_rvPage===0?'disabled style="opacity:.35;cursor:default;"':'')+' onclick="_rvGo('+(_rvPage-1)+')">← Prev</button>'
    +'<button class="btn btn-sm btn-blue" '+(_rvPage===tq-1?'disabled style="opacity:.35;cursor:default;"':'')+' onclick="_rvGo('+(_rvPage+1)+')">Next →</button>'
    +'</div></div>'
    +'</div>';

  var ex=_$('rvOverlay'); if(ex) ex.parentNode.removeChild(ex);
  _d.body.insertAdjacentHTML('beforeend',html);
  if(_rvCharts) setTimeout(_drawCharts,80);
}

function _rvGo(idx){
  if(!_rvAtt) return;
  _rvPage=_clamp(idx,0,_rvAtt.details.length-1);
  _renderReview();
  var rb=_$('rvBody'); if(rb) rb.scrollTop=0;
}
function _closeReview(){
  var el=_$('rvOverlay'); if(el) el.parentNode.removeChild(el);
  _rvAtt=null; _rvCharts=false; _view='dashboard';
}
function _toggleCharts(){ _rvCharts=!_rvCharts; _renderReview(); if(_rvCharts) setTimeout(_drawCharts,80); }

function _drawCharts(){
  if(!_rvAtt) return;
  var det=_rvAtt.details;
  var nC=det.filter(function(d){ return d.correct; }).length;
  var nW=det.filter(function(d){ return !d.correct&&d.userAnswer; }).length;
  var nS=det.length-nC-nW;
  try{
    if(_charts.pie) _charts.pie.destroy();
    var pie=_$('rvPie');
    if(pie) _charts.pie=new Chart(pie.getContext('2d'),{
      type:'doughnut',
      data:{labels:['Correct','Wrong','Skipped'],datasets:[{data:[nC,nW,nS],backgroundColor:['#16A34A','#DC2626','#9CA3AF'],borderWidth:0,hoverOffset:6}]},
      options:{responsive:false,plugins:{legend:{position:'bottom',labels:{font:{size:11}}}}}
    });
    if(_charts.bar) _charts.bar.destroy();
    var bar=_$('rvBar');
    if(bar) _charts.bar=new Chart(bar.getContext('2d'),{
      type:'bar',
      data:{
        labels:det.map(function(_,i){ return 'Q'+(i+1); }),
        datasets:[{label:'Marks',data:det.map(function(d){ return d.correct?5:0; }),
          backgroundColor:det.map(function(d){ return d.correct?'#16A34A':d.userAnswer?'#DC2626':'#9CA3AF'; }),
          borderRadius:4,borderSkipped:false}]
      },
      options:{responsive:false,plugins:{legend:{display:false},tooltip:{callbacks:{label:function(c){ return c.raw+'/5 marks'; }}}},
        scales:{y:{max:5,beginAtZero:true,ticks:{stepSize:5}},x:{ticks:{maxRotation:60,font:{size:9}}}}}
    });
  } catch(e){}
}

/* ── DASHBOARD ── */
function _goDash(){ _dbPage=1; _view='dashboard'; _renderDash(); }

function _renderDash(){
  var atts=_getAtts(), tot=atts.length;
  var done=atts.filter(function(a){ return a.status==='done'||!a.status; });
  var avg=done.length?(done.reduce(function(s,a){ return s+parseFloat(a.percentage); },0)/done.length).toFixed(1):0;
  var best=done.length?Math.max.apply(null,done.map(function(a){ return parseFloat(a.percentage); })).toFixed(1):0;
  var cT=done.reduce(function(s,a){ return s+a.details.filter(function(d){ return d.correct; }).length; },0);
  var wT=done.reduce(function(s,a){ return s+a.details.filter(function(d){ return !d.correct&&d.userAnswer; }).length; },0);
  var sT=done.reduce(function(s,a){ return s+a.details.filter(function(d){ return !d.userAnswer; }).length; },0);
  var qT=cT+wT+sT||1;
  var accP=((cT/qT)*100).toFixed(0);
  var tTot=atts.reduce(function(s,a){ return s+a.timeTaken; },0);
  var pend=atts.filter(function(a){ return a.status==='evaluating'; });

  var spark=done.slice(0,9).map(function(a){ return parseFloat(a.percentage); }).reverse();
  var sMax=Math.max.apply(null,spark.concat([1]));
  var sparkH=spark.map(function(v,i){
    return '<div class="mini-bar" style="height:'+( Math.round((v/sMax)*40)+4)+'px;background:'+(v>=70?'var(--green)':v>=40?'var(--orange)':'var(--red)')+';animation-delay:'+(i*.05)+'s;"></div>';
  }).join('');

  var PER=8, pages=Math.max(1,Math.ceil(tot/PER));
  _dbPage=_clamp(_dbPage,1,pages);
  var slice=atts.slice((_dbPage-1)*PER, _dbPage*PER);

  var rows=slice.map(function(a){
    var isPend=a.status==='evaluating', isFail=a.status==='eval_failed';
    var p=parseFloat(a.percentage);
    var sc=isPend?'sp-pending':isFail?'sp-o':(p>=70?'sp-g':p>=40?'sp-o':'sp-r');
    var scoreCell=isPend
      ?'<span class="sp sp-pending"><div style="width:10px;height:10px;border:2px solid rgba(37,99,235,.25);border-top-color:var(--blue);border-radius:50%;animation:spin .7s linear infinite;flex-shrink:0;"></div>Evaluating…</span>'
      :isFail?'<span class="sp sp-o">Eval Failed</span>'
      :'<span class="sp '+sc+'">'+a.score+'/'+a.maxScore+' · '+p.toFixed(1)+'%</span>';
    var actionBtn=isPend?'<span style="font-size:11.5px;color:var(--g5);">⏳ Processing</span>'
      :'<button class="btn btn-xs btn-blue" onclick="_showReview(\''+a.id+'\')">📋 Review</button>';
    return '<tr class="'+(isPend?'eval-row':'')+'"><td style="white-space:nowrap;">'
      +'<div style="font-size:13px;font-weight:600;">'+new Date(a.timestamp).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'2-digit'})+'</div>'
      +'<div style="font-size:11px;color:var(--g5);">'+new Date(a.timestamp).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})+'</div></td>'
      +'<td><div style="font-size:13.5px;font-weight:600;">'+_esc(a.testName||'Mock Test')+'</div>'
      +'<div style="font-size:11.5px;color:var(--g5);">ID: '+a.testId+' · '+SAPP+'</div></td>'
      +'<td>'+scoreCell+'</td>'
      +'<td><span style="font-family:\'JetBrains Mono\';font-size:13px;color:var(--g6);">'+_fmt(a.timeTaken)+'</span></td>'
      +'<td>'+actionBtn+'</td></tr>';
  }).join('');

  var pagH='';
  if(pages>1){
    pagH='<div class="db-pag">';
    for(var pp=1;pp<=pages;pp++) pagH+='<div class="dpb'+(pp===_dbPage?' on':'')+'" onclick="_dbGo('+pp+')">'+pp+'</div>';
    pagH+='</div>';
  }

  var pendBanner=pend.length>0
    ?'<div style="background:var(--blue-l);border:1px solid var(--blue-m);border-radius:var(--rl);padding:14px 20px;margin-bottom:18px;display:flex;align-items:center;gap:12px;animation:fadeIn .3s ease;">'
    +'<div style="width:18px;height:18px;border:2.5px solid rgba(37,99,235,.25);border-top-color:var(--blue);border-radius:50%;animation:spin .7s linear infinite;flex-shrink:0;"></div>'
    +'<div><div style="font-size:13.5px;font-weight:700;color:var(--blue);">'+pend.length+' test'+(pend.length>1?'s':'')+' being evaluated in background</div>'
    +'<div style="font-size:12px;color:var(--g5);">AI is processing your answers. Results appear automatically when ready.</div></div></div>'
    :'';

  _app.innerHTML=_hdr('dashboard','Dashboard',0)
    +'<div class="db-page"><div class="db-wrap anim-fade">'+pendBanner

    // Hero
    +'<div class="db-hero"><div class="db-hero-l"><h2>Your Performance</h2>'
    +'<p>'+(SAPP==='NEXTTOPPER'?'NextTopper':'Mission Jeet')+' · All test results</p>'
    +(tot>0?'<div class="mini-chart">'+sparkH+'</div>':'')+'</div>'
    +'<div class="db-hero-stats">'
    +'<div class="hstat"><div class="hn">'+tot+'</div><div class="hl">Tests Taken</div></div>'
    +'<div class="hstat"><div class="hn">'+avg+'%</div><div class="hl">Avg Score</div></div>'
    +'<div class="hstat"><div class="hn">'+best+'%</div><div class="hl">Best Score</div></div>'
    +'<div class="hstat"><div class="hn">'+accP+'%</div><div class="hl">Accuracy</div></div>'
    +'</div></div>'

    // Stat cards
    +'<div class="db-section-row"><h3>Overall Analysis</h3></div>'
    +'<div class="db-cards">'
    +'<div class="db-card"><div class="dc-top"><span class="dc-lbl">Correct</span><span class="dc-icon" style="background:var(--green-l);">✓</span></div><div class="dc-val" style="color:var(--green)">'+cT+'</div><div class="dc-sub">'+accP+'% accuracy</div><div class="dc-bar"><div class="dc-fill" style="width:'+accP+'%;background:var(--green);"></div></div></div>'
    +'<div class="db-card"><div class="dc-top"><span class="dc-lbl">Wrong</span><span class="dc-icon" style="background:var(--red-l);">✗</span></div><div class="dc-val" style="color:var(--red)">'+wT+'</div><div class="dc-sub">'+((wT/qT)*100).toFixed(0)+'% of questions</div><div class="dc-bar"><div class="dc-fill" style="width:'+((wT/qT)*100).toFixed(0)+'%;background:var(--red);"></div></div></div>'
    +'<div class="db-card"><div class="dc-top"><span class="dc-lbl">Skipped</span><span class="dc-icon" style="background:var(--amber-l);">○</span></div><div class="dc-val" style="color:var(--amber)">'+sT+'</div><div class="dc-sub">'+((sT/qT)*100).toFixed(0)+'% unattempted</div><div class="dc-bar"><div class="dc-fill" style="width:'+((sT/qT)*100).toFixed(0)+'%;background:var(--amber);"></div></div></div>'
    +'<div class="db-card"><div class="dc-top"><span class="dc-lbl">Time Spent</span><span class="dc-icon" style="background:var(--blue-l);">⏱</span></div><div class="dc-val" style="color:var(--blue)">'+Math.round(tTot/60)+'</div><div class="dc-sub">Total minutes</div><div class="dc-bar"><div class="dc-fill" style="width:65%;background:var(--blue);"></div></div></div>'
    +'</div>'

    // Table
    +'<div class="db-section-row"><h3>Test History'+(tot?' <span style="font-size:12px;color:var(--g5);font-weight:400;">('+tot+' attempt'+(tot>1?'s':'')+')</span>':'')+'</h3>'
    +'<button class="btn btn-blue btn-sm" onclick="_promptNew()">+ New Test</button></div>'
    +(tot===0
      ?'<div class="empty-state"><div class="es-icon">📝</div><h4>No attempts yet</h4><p>Start your first mock test to see performance data here.</p><button class="btn btn-blue" style="margin-top:18px;" onclick="_promptNew()">Start a Test</button></div>'
      :'<div class="table-card"><table class="db-table"><thead><tr><th>Date &amp; Time</th><th>Test</th><th>Score</th><th>Duration</th><th></th></tr></thead><tbody>'+rows+'</tbody></table>'+pagH+'</div>'
    )
    +'</div></div>';

  _updEvalBadge();
}

function _dbGo(p){ _dbPage=p; _renderDash(); }
function _promptNew(){
  var id=_w.prompt('Enter Test ID:','84');
  if(id) _w.location.href='/?test-id='+encodeURIComponent(id.trim())+'&app='+SAPP.toLowerCase();
}

/* ── PARSE QUESTIONS ── */
function _parseQ(data){
  var out=[];
  (data.sections||[]).forEach(function(sec){
    (sec.questions||[]).forEach(function(q){
      var l=q.languages&&q.languages.english?q.languages.english:null;
      out.push({ id:q.question_group_id, text:l&&l.question_text?l.question_text:'',
        options:{A:l&&l.option_a?l.option_a:'',B:l&&l.option_b?l.option_b:'',
                 C:l&&l.option_c?l.option_c:'',D:l&&l.option_d?l.option_d:''}, mark:5 });
    });
  });
  return out;
}

/* ── START TEST ── */
async function _handleStart(){
  if(S.started) return; S.started=true;
  _pgLoad('Fetching questions, please wait…');
  try{
    var data=await _fetchQs(S.testId);
    var qs=_parseQ(data); if(!qs.length) throw new Error('No questions found.');
    S.questions=qs; S.answers=new Array(qs.length).fill(null);
    S.visited=new Array(qs.length).fill(false); S.bookmarked=new Array(qs.length).fill(false);
    S.timePerQ=new Array(qs.length).fill(0); S.visited[0]=true;
    S.current=0; S.testName=data.test_name||'Mock Test';
    S.totalTime=parseInt(data.total_time)||1800; S.remaining=S.totalTime;
    S.finished=false; S.paused=false;
    _renderTest(); _startTimer(); _startQT(); _saveRes();
  } catch(err){
    S.started=false;
    _app.innerHTML=_hdr('inst','Error',0)
      +'<div class="page-wrap"><div class="page-body"><div class="warning-card">'
      +'<h3>Error Loading Test</h3><p>'+_esc(err.message)+'</p>'
      +'<button class="btn btn-blue" onclick="location.reload()">Retry</button>'
      +'</div></div></div>';
  }
}

/* ── RESUME PENDING EVALS ── */
function _resumePending(){
  var pend=_getPend();
  if(!pend.length) return;
  _toast('info','Resuming Evaluation',pend.length+' pending result'+(pend.length>1?'s':'')+' found. Processing in background…',5000);
  pend.forEach(function(att){
    if(att._rq&&att._rq.length){ _bgEval(att.id).catch(function(){}); }
    else { _saveAtt(Object.assign({},att,{status:'eval_failed',evalError:'Session data lost. Please retake the test.',_rq:undefined,_ra:undefined,_tp:undefined})); }
  });
}

/* ── EXPOSE GLOBALS for inline onclick handlers ── */
_w._goDash=_goDash; _w._goQ=_goQ; _w._pickOpt=_pickOpt; _w._clearAns=_clearAns;
_w._toggleBk=_toggleBk; _w._togglePause=_togglePause; _w._resumeTest=_resumeTest;
_w._confirmSub=_confirmSub; _w._doSubmit=_doSubmit; _w._togglePal=_togglePal;
_w._showReview=_showReview; _w._rvGo=_rvGo; _w._closeReview=_closeReview;
_w._toggleCharts=_toggleCharts; _w._dbGo=_dbGo; _w._promptNew=_promptNew;
_w._$=_$;

/* ── INIT ── */
(async function(){
  var params=new URLSearchParams(_w.location.search);
  var testId=params.get('test-id');
  var urlApp=(params.get('app')||'nexttopper').toUpperCase();
  SAPP=(urlApp==='NEXTTOPPER'||urlApp==='MISSIONJEET')?urlApp:'NEXTTOPPER';

  _resumePending();

  if(!testId){ _goDash(); return; }
  S.testId=testId;

  var resume=_loadRes();
  if(resume&&resume.testId===testId&&resume.questions&&resume.questions.length){
    if(_w.confirm('You have an unfinished test. Resume where you left off?')){
      Object.assign(S,resume); S.timerH=null; S.paused=false; S.started=true;
      _renderTest(); _startTimer(); _startQT(); _view='test'; return;
    }
    _clearRes();
  }

  _pgLoad('Fetching test instructions…');
  try{
    var inst=await _fetchInst(testId);
    _renderInst(inst);
  } catch(err){
    _renderWarn(err.message,testId);
  }
})();

})(window,document,null);
                                                                  
