const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const PORT = 9224;
const URL = 'http://127.0.0.1:8099/';
const PROFILE = path.join(__dirname, 'chrome-profile-2');
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function waitJson(url, tries = 60) {
  for (let i = 0; i < tries; i++) {
    try { const r = await fetch(url); if (r.ok) return await r.json(); } catch {}
    await sleep(250);
  }
  throw new Error('timeout');
}
class CDP {
  constructor(ws) {
    this.ws = ws; this.id = 0; this.pending = new Map(); this.events = new Map();
    ws.addEventListener('message', ev => {
      const msg = JSON.parse(ev.data);
      if (msg.id && this.pending.has(msg.id)) {
        const p = this.pending.get(msg.id); this.pending.delete(msg.id);
        msg.error ? p.reject(new Error(msg.error.message)) : p.resolve(msg.result);
      } else if (msg.method && this.events.has(msg.method)) {
        for (const fn of this.events.get(msg.method)) fn(msg.params);
        this.events.delete(msg.method);
      }
    });
  }
  send(method, params = {}) { const id = ++this.id; this.ws.send(JSON.stringify({ id, method, params })); return new Promise((resolve, reject) => this.pending.set(id, { resolve, reject })); }
  once(method) { return new Promise(resolve => { const a = this.events.get(method) || []; a.push(resolve); this.events.set(method, a); }); }
  async eval(expression) { const r = await this.send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true }); if (r.exceptionDetails) throw new Error(r.exceptionDetails.text); return r.result.value; }
}

(async () => {
  const chrome = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${PROFILE}`, '--no-first-run', '--disable-gpu', '--hide-scrollbars', '--mute-audio', 'about:blank'], { stdio: 'ignore' });
  try {
    await waitJson(`http://127.0.0.1:${PORT}/json/version`);
    const target = await (await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, { method: 'PUT' })).json();
    const ws = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise((res, rej) => { ws.addEventListener('open', res); ws.addEventListener('error', rej); });
    const cdp = new CDP(ws);
    await cdp.send('Page.enable'); await cdp.send('Runtime.enable');
    await cdp.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
    const loaded = cdp.once('Page.loadEventFired');
    await cdp.send('Page.navigate', { url: URL }); await loaded; await sleep(2000);
    await cdp.eval(`document.getElementById('btn-start').click()`); await sleep(1500);
    await cdp.eval(`document.querySelector('#idol-grid .idol-pick').click()`); await sleep(1500);
    const info = await cdp.eval(`(() => {
      const rect = s => { const e=document.querySelector(s); if(!e) return null; const r=e.getBoundingClientRect(); return {top:Math.round(r.top),bottom:Math.round(r.bottom),height:Math.round(r.height),left:Math.round(r.left),right:Math.round(r.right)}; };
      return {
        innerW: innerWidth, innerH: innerHeight, dpr: devicePixelRatio, scrollY,
        bodyScrollH: document.body.scrollHeight, docScrollH: document.documentElement.scrollHeight,
        hand: rect('.hand-bottom'), cards: rect('#cards'), card: rect('#cards .card'),
        mid: rect('.mid-area'), screenGame: rect('#screen-game'),
        activeScreen: document.body.dataset.screen,
        cardCount: document.querySelectorAll('#cards .card').length
      };
    })()`);
    console.log(JSON.stringify(info, null, 2));
    const errors = await cdp.eval(`[...document.querySelectorAll('script')].length`);
    console.log('scripts:', errors);
    // full-page screenshot of game screen
    const shot = await cdp.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
    fs.writeFileSync(path.join(__dirname, 'inspect-game.png'), Buffer.from(shot.data, 'base64'));
    ws.close();
  } finally { chrome.kill(); }
})().catch(e => { console.error(e); process.exit(1); });
