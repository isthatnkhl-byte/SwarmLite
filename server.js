import express from 'express';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import fs from 'node:fs/promises';
import path from 'node:path';

const app = express();
const run = promisify(exec);
const root = path.resolve(process.env.NOVA_WORKSPACE || '.nova-workspace');
const port = Number(process.env.NOVA_API_PORT || 3001);
const seed = {
  'index.html': '<main><p>BUILDING WITH NOVA</p><h1>Make something<br><em>memorable.</em></h1><button>Start exploring ↗</button></main>',
  'styles.css': "@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600&family=Instrument+Serif:ital@0;1&display=swap');\n*{box-sizing:border-box}body{margin:0;color:#20312a;background:#dce4c7;font-family:DM Sans,sans-serif}main{min-height:100vh;padding:10vw;background:radial-gradient(circle at 84% 18%,#faf5e9 0 8%,transparent 8.3%)}p{font-size:11px;letter-spacing:.16em}h1{font:400 clamp(60px,11vw,140px)/.8 'Instrument Serif',serif;margin:17vh 0 30px}em{color:#c7523d}button{border:0;border-radius:100px;background:#20312a;color:#fff;padding:14px 20px;font:600 13px DM Sans}",
  'README.md': '# Welcome to your Nova workspace\n\nAsk the agent to inspect, create, edit, delete, or run commands.'
};
async function ensureWorkspace() { await fs.mkdir(root, { recursive: true }); for (const [name, content] of Object.entries(seed)) { try { await fs.access(path.join(root, name)); } catch { await fs.writeFile(path.join(root, name), content); } } }
function target(relative = '') { const resolved = path.resolve(root, relative); if (resolved !== root && !resolved.startsWith(`${root}${path.sep}`)) throw new Error('Path must remain inside the workspace.'); return resolved; }
async function tree(directory = root, relative = '') { const entries = await fs.readdir(directory, { withFileTypes: true }); return Promise.all(entries.filter(e => !e.name.startsWith('.')).sort((a,b)=>a.name.localeCompare(b.name)).map(async e => { const rel = path.join(relative, e.name); return e.isDirectory() ? { name:e.name, path:rel, type:'directory', children:await tree(path.join(directory,e.name), rel) } : { name:e.name, path:rel, type:'file' }; })); }
app.use(express.json({ limit: '1mb' }));
app.get('/api/tree', async (_req,res) => { try { await ensureWorkspace(); res.json(await tree()); } catch(e) { res.status(500).json({ error:e.message }); } });
app.get('/api/file', async (req,res) => { try { res.json({ path:req.query.path, content:await fs.readFile(target(req.query.path), 'utf8') }); } catch(e) { res.status(404).json({ error:e.message }); } });
app.put('/api/file', async (req,res) => { try { const file=target(req.body.path); await fs.mkdir(path.dirname(file), {recursive:true}); await fs.writeFile(file, req.body.content ?? '', 'utf8'); res.json({ ok:true }); } catch(e) { res.status(400).json({ error:e.message }); } });
app.post('/api/file', async (req,res) => { try { const file=target(req.body.path); await fs.mkdir(path.dirname(file), {recursive:true}); await fs.writeFile(file, req.body.content ?? '', { flag:'wx' }); res.status(201).json({ ok:true }); } catch(e) { res.status(400).json({ error:e.message }); } });
app.delete('/api/file', async (req,res) => { try { await fs.rm(target(req.query.path), { recursive:true, force:false }); res.json({ ok:true }); } catch(e) { res.status(400).json({ error:e.message }); } });
app.post('/api/terminal', async (req,res) => { try { const { stdout, stderr } = await run(req.body.command, { cwd:root, timeout:15000, maxBuffer:1024*1024, shell:'/bin/bash' }); res.json({ output: stdout + stderr, code:0 }); } catch(e) { res.json({ output:(e.stdout || '') + (e.stderr || '') + (e.message || ''), code:e.code ?? 1 }); } });
app.listen(port, () => console.log(`Nova workspace API listening at http://localhost:${port}`));
