const { spawn, execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const PORT = 9225;
const URL = 'http://127.0.0.1:8099/';
const OUT = path.join(__dirname, '..', 'store-assets', 'video');
const FRAMES = path.join(OUT, 'frames');
const PROFILE = path.join(__dirname, 'chrome-profile-video');
const sleep = ms => new Promise(r => setTimeout(r, ms));

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(FRAMES, { recursive: true });

async function waitJson(url, tries = 80) {
  for (let i = 0; i < tries; i++) {
    try { const r = await fetch(url); if (r.ok) return await r.json(); } catch {}
    await sleep(250);
  }
  throw new Error('timeout');
}

class CDP {
  constructor(ws) {
    this.ws = ws; this.id = 0; this.pending = new Map(); this.handlers = new Map();
    ws.addEventListener('message', ev => {
      const msg = JSON.parse(ev.data);
      if (msg.id && this.pending.has(msg.id)) {
        const p = this.pending.get(msg.id); this.pending.delete(msg.id);
        msg.error ? p.reject(new Error(msg.error.message)) : p.resolve(msg.result);
      } else if (msg.method && this.handlers.has(msg.method)) {
        for (const fn of this.handlers.get(msg.method)) fn(msg.params);
      }
    });
  }
  on(method, fn) {
    if (!this.handlers.has(method)) this.handlers.set(method, []);
    this.handlers.get(method).push(fn);
  }
  send(method, params = {}) {
    const id = ++this.id;
    this.ws.send(JSON.stringify({ id, method, params }));
    return new Promise((resolve, reject) => this.pending.set(id, { resolve, reject }));
  }
  once(method) { return new Promise(resolve => { const f = p => { resolve(p); }; this.on(method, f); }); }
  async eval(expression) {
    const r = await this.send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.text);
    return r.result.value;
  }
}

(async () => {
  const chrome = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${PROFILE}`,
    '--no-first-run', '--disable-gpu', '--hide-scrollbars', '--mute-audio', 'about:blank'], { stdio: 'ignore' });
  let ws;
  try {
    await waitJson(`http://127.0.0.1:${PORT}/json/version`);
    const target = await (await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, { method: 'PUT' })).json();
    ws = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise((res, rej) => { ws.addEventListener('open', res); ws.addEventListener('error', rej); });
    const cdp = new CDP(ws);
    await cdp.send('Page.enable'); await cdp.send('Runtime.enable');
    await cdp.send('Emulation.setDeviceMetricsOverride', { width: 540, height: 1170, deviceScaleFactor: 1, mobile: true });
    await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });

    const loaded = cdp.once('Page.loadEventFired');
    await cdp.send('Page.navigate', { url: URL });
    await loaded;
    await sleep(2500);

    let n = 0, prevTs = null;
    const durations = [];
    cdp.on('Page.screencastFrame', async p => {
      const now = Date.now();
      if (prevTs !== null) durations.push((now - prevTs) / 1000);
      prevTs = now;
      fs.writeFileSync(path.join(FRAMES, String(n).padStart(5, '0') + '.png'), Buffer.from(p.data, 'base64'));
      n++;
      try { await cdp.send('Page.screencastFrameAck', { sessionId: p.sessionId }); } catch {}
    });

    await cdp.send('Page.startScreencast', { format: 'png', quality: 88, maxWidth: 780, maxHeight: 1688, everyNthFrame: 1 });
    const t0 = Date.now();
    const elapsed = () => (Date.now() - t0) / 1000;

    // 1) start screen
    await sleep(1500);
    await cdp.eval(`document.getElementById('btn-start').click()`);
    // 2) idol select
    await sleep(1300);
    await cdp.eval(`document.querySelector('#idol-grid .idol-pick').click()`);
    // 3) gameplay: prefer scoring (A) cards and skip cards whose conditions aren't met
    for (let i = 0; i < 6; i++) {
      await sleep(900);
      const played = await cdp.eval(`(() => {
        if (document.body.dataset.screen !== 'screen-game') return false;
        const cards = [...document.querySelectorAll('#cards .card')];
        const viable = cards.filter(c => {
          const t = c.textContent;
          return !t.includes('天赋之才') && !t.includes('再动') && !t.includes('需集中') && !t.includes('需好调');
        });
        const a = viable.find(c => c.classList.contains('type-a'));
        const pick = a || viable[0];
        if (pick) { pick.click(); return 'card'; }
        const rest = document.getElementById('rest-btn');
        if (rest) { rest.click(); return 'rest'; }
        return false;
      })()`);
      if (!played) break;
      await sleep(1500);
      const modal = await cdp.eval(`!!document.querySelector('.deck-overlay.show #pick-confirm')`);
      if (modal) {
        await cdp.eval(`(() => {
          const tiles = [...document.querySelectorAll('#pick-body .deck-card.pickable')];
          const need = parseInt((document.getElementById('pick-count').textContent.match(/\\/(\\d+)/)||[0,1])[1],10) || 1;
          tiles.slice(0, need).forEach(t => t.click());
          const b = document.getElementById('pick-confirm');
          if (b && !b.disabled) b.click();
        })()`);
        await sleep(900);
      }
      await sleep(2200);
    }
    await sleep(1200);
    await cdp.send('Page.stopScreencast');
    await sleep(300);
    if (prevTs !== null) durations.push((Date.now() - prevTs) / 1000 + 0.1);

    console.log('frames:', n, 'captured seconds:', elapsed().toFixed(1), 'durations:', durations.length);

    // build concat list
    const last = String(n - 1).padStart(5, '0');
    const lines = [];
    for (let i = 0; i < n; i++) {
      lines.push(`file '${String(i).padStart(5, '0')}.png'`);
      lines.push(`duration ${Math.max(0.01, durations[i] || 0.05).toFixed(4)}`);
    }
    lines.push(`file '${last}.png'`);
    lines.push('duration 0.1');
    fs.writeFileSync(path.join(FRAMES, 'concat.txt'), lines.join('\n'));

    const silent = path.join(OUT, 'gameplay-silent.mp4');
    execFileSync('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-f', 'concat', '-safe', '0',
      '-i', path.join(FRAMES, 'concat.txt'), '-vf', 'fps=30,format=yuv420p',
      '-c:v', 'libx264', '-crf', '22', '-preset', 'medium', '-movflags', '+faststart', silent],
      { stdio: 'inherit' });

    const final = path.join(OUT, 'gameplay-demo.mp4');
    execFileSync('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-i', silent,
      '-i', path.join(__dirname, '..', 'bgm', 'school-idol.mp3'),
      '-filter_complex', '[1:a]volume=0.35[a]', '-map', '0:v', '-map', '[a]',
      '-c:v', 'copy', '-c:a', 'aac', '-b:a', '128k', '-shortest', '-movflags', '+faststart', final],
      { stdio: 'inherit' });

    const stat = fs.statSync(final);
    console.log('video:', final, (stat.size / 1024 / 1024).toFixed(2), 'MB');
  } finally {
    try { ws && ws.close(); } catch {}
    chrome.kill();
  }
})().catch(e => { console.error('FAILED', e); process.exit(1); });
