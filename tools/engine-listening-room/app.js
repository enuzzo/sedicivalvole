import {STORAGE_KEY, RATINGS, readNotes, exportNotes} from './notes.js';

const $ = id => document.getElementById(id);
const audio = new Audio();
audio.preload = 'none';
audio.volume = 0.35;
audio.playbackRate = 1;
const rows = new Map();
let catalog = [], notes = {}, active = null, storage;
const tell = (message, error = false) => { $('status').textContent = message; $('status').className = error ? 'error' : ''; };
const clock = seconds => { const n = Math.max(0, Math.floor(seconds || 0)); return `${Math.floor(n / 60)}:${String(n % 60).padStart(2, '0')}`; };
const element = (tag, className, text) => { const el = document.createElement(tag); if (className) el.className = className; if (text !== undefined) el.textContent = text; return el; };

function save(item, rating, comment, indicator) {
  notes[item.code] = {sha256: item.sha256, rating, comment: comment.slice(0,2000), updatedAt: new Date().toISOString()};
  try {
    if (!storage) throw new Error('No persistent storage');
    storage.setItem(STORAGE_KEY, JSON.stringify(notes));
    indicator.textContent = 'Saved';
  } catch {
    indicator.textContent = 'In memory only';
    tell('Browser storage is unavailable. Export notes before closing this page.', true);
  }
}

async function play(item) {
  const previous = active;
  if (active?.code === item.code && !audio.paused) { audio.pause(); return; }
  if (active?.code !== item.code) {
    audio.pause();
    active = item;
    audio.src = item.media;
    audio.loop = rows.get(item.code).loop.checked;
    if (previous) { rows.get(previous.code).row.classList.remove('active'); rows.get(previous.code).seek.disabled = true; }
    rows.get(item.code).row.classList.add('active');
  }
  rows.get(item.code).message.textContent = 'Loading…';
  try { await audio.play(); }
  catch (error) { if (active?.code === item.code && error.name !== 'AbortError') rows.get(item.code).message.textContent = 'Unable to play. Try again or inspect the source details.'; }
}

function createRow(item) {
  const row = element('article','sound'); row.id = item.code; row.setAttribute('aria-label',`${item.code} ${item.title}`);
  const code = element('a','code',item.code); code.href = '#'+item.code;
  const source = element('div','source'); source.append(element('h2','',item.title),element('p','meta',item.creator),element('p','meta',item.kind));
  const link = element('a','', 'Source ↗'); link.href = item.sourceUrl; link.target = '_blank'; link.rel = 'noopener noreferrer'; source.append(link);
  const details = element('details'); details.append(element('summary','','Details & license'),element('p','',item.license),element('p','',item.note));
  if (item.warning) details.append(element('p','warning',item.warning)); source.append(details);
  const listen = element('div','listen'), transport = element('div','transport');
  const button = element('button','play','▶'); button.setAttribute('aria-label','Play '+item.code); button.onclick = () => play(item);
  const seekWrap = element('div','seek-wrap'), seek = element('input','seek'); seek.type = 'range'; seek.min = '0'; seek.max = String(item.duration); seek.step = '.1'; seek.value = '0'; seek.disabled = true; seek.setAttribute('aria-label','Seek '+item.code); seek.title = 'Play this sound to seek';
  seek.oninput = () => { if (active?.code === item.code && Number.isFinite(audio.duration)) audio.currentTime = Math.min(+seek.value,audio.duration); };
  const time = element('div','time'), elapsed = element('span','','0:00'), total = element('span','',clock(item.duration)); time.append(elapsed,total); seekWrap.append(seek,time); transport.append(button,seekWrap);
  const loopLabel = element('label','loop'), loop = element('input'); loop.type = 'checkbox'; loop.setAttribute('aria-label','Loop '+item.code); loopLabel.append(loop,document.createTextNode('Loop')); loop.onchange = () => { if (active?.code === item.code) audio.loop = loop.checked; };
  const message = element('div','play-status'); message.setAttribute('aria-live','polite'); listen.append(transport,loopLabel,message);
  const noteBox = element('div','notes'), rating = element('select','rating'); rating.setAttribute('aria-label','Rating '+item.code);
  for (const value of RATINGS) { const option = element('option','',value || 'Not rated'); option.value = value; rating.append(option); }
  rating.value = notes[item.code]?.rating || '';
  const comment = element('textarea'); comment.placeholder = 'What do you hear?'; comment.maxLength = 2000; comment.setAttribute('aria-label','Comment '+item.code); comment.value = notes[item.code]?.comment || '';
  const indicator = element('span','saved',notes[item.code] ? 'Saved' : 'Not saved');
  const persist = () => save(item,rating.value,comment.value,indicator); rating.onchange = persist; comment.oninput = persist;
  noteBox.append(rating,comment,indicator); row.append(code,source,listen,noteBox); rows.set(item.code,{row,button,seek,elapsed,total,loop,message}); return row;
}

function filters() {
  const q = $('search').value.toLowerCase().trim(); let visible = 0;
  for (const item of catalog) {
    const matches = (!q || `${item.code} ${item.title} ${item.creator} ${item.family}`.toLowerCase().includes(q)) && (!$('family').value || item.family === $('family').value) && (!$('kind').value || item.kind === $('kind').value) && (!$('noted').checked || notes[item.code]?.comment || notes[item.code]?.rating);
    rows.get(item.code).row.hidden = !matches;
    if (matches) visible++;
    else if (active?.code === item.code) audio.pause();
  }
  $('count').textContent = `Showing ${visible} of ${catalog.length}`; $('empty').hidden = visible > 0;
}

audio.addEventListener('play', () => {
  for (const [code,r] of rows) { const playing = code === active?.code; r.button.textContent = playing ? 'Ⅱ' : '▶'; r.button.setAttribute('aria-label',`${playing ? 'Pause' : 'Play'} ${code}`); }
});
audio.addEventListener('playing', () => { if(active) rows.get(active.code).message.textContent = 'Playing · 1×'; });
audio.addEventListener('waiting', () => { if(active) rows.get(active.code).message.textContent = 'Loading…'; });
audio.addEventListener('pause', () => { if(active) { const r = rows.get(active.code); r.button.textContent = '▶'; r.button.setAttribute('aria-label','Play '+active.code); r.message.textContent = audio.ended ? 'Finished' : 'Paused'; } });
audio.addEventListener('loadedmetadata', () => { if(active) { const r = rows.get(active.code); r.seek.max = String(audio.duration); r.seek.disabled = !Number.isFinite(audio.duration); r.total.textContent = clock(audio.duration); } });
audio.addEventListener('timeupdate', () => { if(active) { const r = rows.get(active.code); r.seek.value = String(audio.currentTime); r.elapsed.textContent = clock(audio.currentTime); } });
audio.addEventListener('ended', () => { if(active) rows.get(active.code).message.textContent = 'Finished'; });
audio.addEventListener('error', () => { if(active) rows.get(active.code).message.textContent = 'Audio unavailable or unsupported. Try again.'; });
document.addEventListener('visibilitychange', () => { if(document.hidden) audio.pause(); });
window.addEventListener('pagehide', () => audio.pause());
$('volume').oninput = () => { audio.volume = +$('volume').value / 100; $('level').textContent = $('volume').value + '%'; };
for (const id of ['search','family','kind','noted']) $(id).addEventListener('input',filters);
$('export').onclick = () => {
  const payload = exportNotes(catalog,notes);
  const blob = new Blob([JSON.stringify(payload,null,2)+'\n'],{type:'application/json'});
  const url = URL.createObjectURL(blob), link = element('a'); link.href = url; link.download = 'engine-listening-notes.json'; link.click(); setTimeout(()=>URL.revokeObjectURL(url),30000);
  tell(`Exported ${payload.notes.length} notes. Share the file or quote a listening code in chat.`);
};
try {
  const response = await fetch('catalog.json'); if (!response.ok) throw new Error('Catalog unavailable'); catalog = await response.json();
  const order = ['V8','Other combustion','Turbine / machinery','Four cylinder','Motorcycles','Unidentified cars','Designed / unspecified','Foley','AI-generated effects'];
  catalog.sort((a,b) => order.indexOf(a.family)-order.indexOf(b.family) || Number(a.kind === 'Prepared excerpt')-Number(b.kind === 'Prepared excerpt') || a.code.localeCompare(b.code));
  try { storage = window.localStorage; notes = readNotes(storage,catalog); } catch { tell('Saved notes could not be read. New notes can be exported; existing browser data has not been changed.',true); storage = null; }
  for (const [id,key] of [['family','family'],['kind','kind']]) for (const value of [...new Set(catalog.map(x=>x[key]))]) { const option = element('option','',value); option.value = value; $(id).append(option); }
  $('catalog').append(...catalog.map(createRow)); $('summary').textContent = `${catalog.length} sounds · one at a time · original speed`; filters();
  const code = decodeURIComponent(location.hash.slice(1)); if(rows.has(code)) rows.get(code).row.scrollIntoView();
} catch { tell('The local catalog could not load. Run prepare.py and reload this page.',true); $('summary').textContent = 'Catalog unavailable'; }
