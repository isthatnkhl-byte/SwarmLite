import './style.css';

const files = {
  'app.html': `<!doctype html>\n<html>\n  <head>\n    <title>Quiet corners</title>\n  </head>\n  <body>\n    <main class="note">\n      <p class="eyebrow">a small collection</p>\n      <h1>Places to<br><em>exhale.</em></h1>\n      <p class="copy">A field guide to the gentle, ordinary places that make a day feel more spacious.</p>\n      <button>Explore the collection <span>↗</span></button>\n    </main>\n  </body>\n</html>`,
  'styles.css': `@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500&family=Instrument+Serif:ital@0;1&display=swap');\n\n* { box-sizing: border-box; }\nbody { margin: 0; background: #e8e1d3; color: #1d2d26; font-family: 'DM Sans', sans-serif; }\n.note { min-height: 100vh; padding: 78px 8vw; background: radial-gradient(circle at 88% 18%, #f7f2e9 0 8%, transparent 8.2%), #d9dfc5; }\n.eyebrow { text-transform: uppercase; letter-spacing: .16em; font-size: 11px; }\nh1 { font-family: 'Instrument Serif', serif; font-size: clamp(64px, 10vw, 140px); line-height: .78; font-weight: 400; margin: 17vh 0 28px; }\nh1 em { color: #c75a40; }\n.copy { width: 300px; line-height: 1.6; }\nbutton { margin-top: 25px; border: 0; background: #1d2d26; color: #f8f5ee; border-radius: 100px; padding: 13px 18px; font: 500 13px 'DM Sans'; }\nbutton span { margin-left: 18px; color: #cce058; }`,
  'agent.md': `# Working notes\n\n- Keep the interface warm and editorial.\n- The first screen should work on its own.\n- Avoid generic product language.`,
  'package.json': `{\n  "scripts": { "dev": "vite" }\n}`
};

let selected = 'app.html';
let activePanel = 'agent';
const log = [
  ['system', 'Workspace ready. Agent has access to /project.'],
  ['agent', 'I inspected the project. This is a compact editorial landing page with four files.'],
  ['tool', 'read_file  app.html'],
  ['agent', 'The preview is running and will update as we work. What should I make next?']
];

const icon = (name) => ({folder:'⌄', file:'◦', code:'⌘', play:'▶', send:'↗', plus:'+', more:'•••', check:'✓', close:'×', terminal:'›_', search:'⌕', bolt:'✦', eye:'◉', trash:'⌫'})[name] || '';
function escapeHtml(v) { return v.replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }
function renderCode(text) { return escapeHtml(text).split('\n').map((line,i) => `<span class="line"><i>${String(i+1).padStart(2,'0')}</i><code>${line || ' '}</code></span>`).join(''); }
function fileType(name) { return name.endsWith('.html') ? 'html' : name.endsWith('.css') ? 'css' : name.endsWith('.md') ? 'md' : 'json'; }
function buildPreview() { return `<style>${files['styles.css'] || ''}</style>${files['app.html'] || '<main style="padding:4rem;font-family:sans-serif">Create <b>app.html</b> to see your work here.</main>'}`; }

function app() {
 document.querySelector('#app').innerHTML = `
 <aside class="rail"><div class="brand">n<span>°</span></div><button class="rail-btn active" title="Files">${icon('folder')}</button><button class="rail-btn" title="Search">${icon('search')}</button><button class="rail-btn" title="Source control">⌘</button><div class="rail-bottom"><button class="rail-btn">⚙</button><div class="avatar">JD</div></div></aside>
 <aside class="explorer"><header><span>EXPLORER</span><button id="newFile">${icon('plus')}</button></header><div class="project"><div class="project-title"><span class="chevron">⌄</span> QUIET-CORNERS <button>${icon('more')}</button></div><div class="file-list">${Object.keys(files).map(f=>`<button class="file ${f===selected?'selected':''}" data-file="${f}"><span class="type ${fileType(f)}">${fileType(f)==='html'?'◇':fileType(f)==='css'?'#':fileType(f)==='md'?'M':'{}'}</span>${f}</button>`).join('')}</div></div><div class="explorer-footer"><span class="status-dot"></span> synced just now</div></aside>
 <main class="workspace"><header class="topbar"><div class="crumb"><span>quiet-corners</span><b>/</b><span>${selected}</span></div><div class="top-actions"><button title="Save" id="save">${icon('check')} Saved</button><button title="More">${icon('more')}</button></div></header><section class="editor"><div class="tabs"><button class="tab active"><span class="dot ${fileType(selected)}"></span>${selected}<span class="tab-close">×</span></button><button class="tab-add" id="newFile2">+</button></div><div class="editor-tools"><span>${fileType(selected).toUpperCase()}</span><span>UTF-8</span><span>Spaces: 2</span></div><textarea id="source" spellcheck="false">${files[selected]}</textarea><pre id="code" aria-hidden="true">${renderCode(files[selected])}</pre></section>
 <aside class="side"><div class="side-head"><span>LIVE PREVIEW</span><div><button id="refresh">↻</button><button id="openPreview">↗</button></div></div><div class="preview-frame"><div class="browser"><span class="traffic"><i></i><i></i><i></i></span><span class="address">localhost:5173</span></div><iframe id="preview" sandbox="allow-scripts"></iframe></div><div class="preview-status"><span><i></i> live</span><span>last update just now</span></div></aside>
 <section class="agent-dock ${activePanel==='agent'?'open':''}"><div class="dock-tabs"><button class="dock-tab ${activePanel==='agent'?'active':''}" data-panel="agent">${icon('bolt')} Agent <span class="count">1</span></button><button class="dock-tab ${activePanel==='terminal'?'active':''}" data-panel="terminal">${icon('terminal')} Terminal</button><button class="dock-tab ${activePanel==='changes'?'active':''}" data-panel="changes">Changes <span class="change-count">2</span></button><button class="dock-expand">⌃</button></div><div class="dock-content" id="dockContent">${dockContent()}</div></section>
 </main>`;
 bind(); updatePreview();
}

function dockContent(){
 if(activePanel === 'terminal') return `<div class="terminal"><p><span>nova@workspace</span>:<b>~/quiet-corners</b>$ npm run dev</p><p class="muted">➜  Local: http://localhost:5173/</p><p><span>nova@workspace</span>:<b>~/quiet-corners</b>$ <em class="cursor"></em></p></div>`;
 if(activePanel === 'changes') return `<div class="changes"><div><b>M</b><span>app.html</span><small>today</small></div><div><b>M</b><span>styles.css</span><small>today</small></div><p>2 modified files · autosaved</p></div>`;
 return `<div class="conversation">${log.map(([type,text])=> type==='tool' ? `<div class="tool-call"><span>${icon('code')}</span><b>${text.split(/\s{2,}/)[0]}</b><small>${text.split(/\s{2,}/)[1]||''}</small><i>${icon('check')}</i></div>` : `<div class="message ${type}"><span>${type==='agent'?'N':'•'}</span><p>${text}</p></div>`).join('')}</div><form class="prompt" id="prompt"><div class="prompt-box"><textarea id="instruction" rows="1" placeholder="Ask the agent to make a change..."></textarea><button type="button" class="attach">+</button><button class="send">${icon('send')}</button></div><p><kbd>⌘</kbd><kbd>↵</kbd> to send <span>Agent can read, write, run, and preview</span></p></form>`;
}

function bind(){
 document.querySelectorAll('[data-file]').forEach(el=>el.onclick=()=>{selected=el.dataset.file; app();});
 const source=document.querySelector('#source');
 source?.addEventListener('input',()=>{files[selected]=source.value; document.querySelector('#code').innerHTML=renderCode(source.value); updatePreview();});
 document.querySelector('#save')?.addEventListener('click', e=>{e.currentTarget.innerHTML=`${icon('check')} Saved`;});
 document.querySelectorAll('[data-panel]').forEach(el=>el.onclick=()=>{activePanel=el.dataset.panel; app();});
 document.querySelector('#refresh')?.addEventListener('click', updatePreview);
 document.querySelector('#openPreview')?.addEventListener('click',()=>window.open().document.write(buildPreview()));
 document.querySelectorAll('#newFile,#newFile2').forEach(el=>el.onclick=newFile);
 document.querySelector('#prompt')?.addEventListener('submit',runAgent);
 document.querySelector('#instruction')?.addEventListener('keydown',e=>{if((e.metaKey||e.ctrlKey)&&e.key==='Enter') document.querySelector('#prompt').requestSubmit();});
}
function updatePreview(){const frame=document.querySelector('#preview'); if(frame) frame.srcdoc=buildPreview();}
function newFile(){ const name=prompt('File name (for example, notes.md)'); if(name){files[name]=''; selected=name; log.push(['tool',`create_file  ${name}`],['agent',`Created ${name}. It is ready to edit.`]); app();}}
function runAgent(e){e.preventDefault(); const input=document.querySelector('#instruction'); const q=input.value.trim(); if(!q)return; log.push(['system',q]); const lower=q.toLowerCase(); if(lower.includes('delete')){ const match=Object.keys(files).find(f=>lower.includes(f.toLowerCase())); if(match){delete files[match]; selected=Object.keys(files)[0]; log.push(['tool',`delete_file  ${match}`],['agent',`Deleted ${match} from the workspace.`]);} else log.push(['agent','Tell me which file to delete, and I will remove it.']); }
 else if(lower.includes('create') || lower.includes('add file')){ const name=(q.match(/[\w-]+\.(?:html|css|js|md|json)/i)||[])[0]||'new-note.md'; files[name]=`# ${name.replace(/\..*/,'')}\n\nCreated by Nova agent.`; selected=name; log.push(['tool',`create_file  ${name}`],['agent',`Created ${name} and opened it in the editor.`]); }
 else if(lower.includes('run') || lower.includes('terminal') || lower.includes('npm')) { activePanel='terminal'; log.push(['tool','run_command  npm run dev'],['agent','Development server is running. The preview is live.']); }
 else if(lower.includes('inspect') || lower.includes('read')) { const match=Object.keys(files).find(f=>lower.includes(f.toLowerCase()))||selected; log.push(['tool',`read_file  ${match}`],['agent',`I inspected ${match}. It has ${files[match].split('\n').length} lines and is ready for changes.`]); }
 else { if(files['app.html']) files['app.html']=files['app.html'].replace('Explore the collection','Discover the collection'); log.push(['tool','edit_file  app.html'],['agent','Done — I refined the primary action and refreshed the live preview.']); }
 app(); }
app();
