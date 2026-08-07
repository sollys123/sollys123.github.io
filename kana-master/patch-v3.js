// Kana Master v3: listening trains sound -> kana, not sound -> romaji.
MODE_NAME.listen='听音辨假名';

function nextMode(e){
  const s=stat(e.id);
  const core=['recall','word','listen','convert','write'];
  const missing=core.filter(m=>!(s.modes[m]>0));
  if(missing.length)return pick(missing);
  const roll=Math.random();
  if(roll<.30)return 'recall';
  if(roll<.47)return 'listen';
  if(roll<.62)return 'word';
  if(roll<.78)return 'convert';
  if(roll<.91)return 'write';
  return 'confuse';
}

function listenChoices(e,field){
  const vals=[e[field]], b=bank();
  const similar=b.filter(x=>x.id!==e.id&&(x.r[0]===e.r[0]||x.r.slice(-1)===e.r.slice(-1)));
  for(const x of shuffle(similar)){if(vals.length>=4)break;if(!vals.includes(x[field]))vals.push(x[field]);}
  while(vals.length<4){const v=pick(b)[field];if(!vals.includes(v))vals.push(v);}
  return shuffle(vals);
}

renderQuestion=function(){
  answered=false;ghostOn=false;current={e:nextEntry()};current.mode=nextMode(current.e);
  $('roundCount').textContent=`${session.i+1}/${session.total}`;
  $('roundBar').style.width=`${session.i/session.total*100}%`;
  $('modeLabel').textContent=MODE_NAME[current.mode];resetAreas();
  const e=current.e;
  if(current.mode==='recall'){
    const s=Math.random()<.5?'h':'k';
    renderInput(`<div><div class="kana">${e[s]}</div><div class="hint">不看选项，直接输入读音</div></div>`,e);
  }else if(current.mode==='listen'){
    const field=Math.random()<.5?'h':'k',answer=e[field];
    $('promptBox').innerHTML=`<div><button class="listen" id="playBtn">▶</button><div class="hint">听声音，选出对应${field==='h'?'平假名':'片假名'}</div><div class="audio-status"><b>点按钮播放</b> · 可重复听</div></div>`;
    $('choices').style.display='grid';
    listenChoices(e,field).forEach(v=>{const b=document.createElement('button');b.className='choice';b.textContent=v;b.onclick=()=>gradeChoice(b,v===answer,answer);$('choices').appendChild(b)});
    setTimeout(()=>{$('playBtn')?.addEventListener('click',()=>speak(e.h));speak(e.h)},80);
  }else if(current.mode==='word'){
    const matches=WORDS.filter(w=>w.includes(e.h)||w.includes(e.k));
    if(matches.length){const w=pick(matches),c=w.includes(e.h)?e.h:e.k,i=w.indexOf(c);renderInput(`<div><div class="word">${w.slice(0,i)}<mark>${c}</mark>${w.slice(i+c.length)}</div><div class="hint">黄色部分怎么读？直接输入</div></div>`,e)}
    else renderInput(`<div><div class="kana">${e.h}</div><div class="hint">输入这个假名的读音</div></div>`,e);
  }else if(current.mode==='convert'){
    const from=Math.random()<.5?'h':'k',to=from==='h'?'k':'h';
    $('promptBox').innerHTML=`<div><div class="kana">${e[from]}</div><div class="hint">${from==='h'?'选出对应片假名':'选出对应平假名'}</div></div>`;renderChoices(e[to],to);
  }else if(current.mode==='confuse'){
    let pair=CONFUSE.find(p=>p.includes(e.h)||p.includes(e.k));if(!pair)pair=pick(CONFUSE);
    const target=pick(pair),targetE=BASE.find(x=>x.h===target||x.k===target)||e;
    $('promptBox').innerHTML=`<div><div class="romaji">${targetE.r}</div><div class="hint">易混字辨形</div></div>`;
    const other=pair.find(x=>x!==target);$('choices').style.display='grid';shuffle([target,other]).forEach(v=>{const b=document.createElement('button');b.className='choice';b.textContent=v;b.onclick=()=>gradeChoice(b,v===target,target);$('choices').appendChild(b)});current.e=targetE;
  }else if(current.mode==='write'){
    const s=Math.random()<.5?'h':'k';$('promptBox').innerHTML=`<div><div class="romaji">${e.r}</div><div class="hint">写出${s==='h'?'平假名':'片假名'}，再显示参考自检</div></div>`;current.answer=e[s];$('writeArea').style.display='block';$('toggleGhost').textContent='显示参考';setTimeout(fitCanvas,0);
  }
};
