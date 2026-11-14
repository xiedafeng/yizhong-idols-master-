const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const PORT = 9223;
const URL = 'http://127.0.0.1:8099/';
const OUT = path.join(__dirname, '..', 'store-assets', 'screenshots');
const PROFILE = path.join(__dirname, 'chrome-profile');

fs.mkdirSync(OUT, { recursive: true });

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function waitJson(url, tries = 60) {
  for (let i = 0; i < tries; i++) {
    try {
      const r = await fetch(url);
      if (r.ok) return await r.json();
    } catch {}
    await sleep(250);
  }
  throw new Error('timeout waiting for ' + url);
}

class CDP {
  constructor(ws) {
    this.ws = ws;
    this.id = 0;
    this.pending = new Map();
    this.events = new Map();
    ws.addEventListener('message', ev => {
      const msg = JSON.parse(ev.data);
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        msg.error ? reject(new Error(msg.error.message)) : resolve(msg.result);
      } else if (msg.method && this.events.has(msg.method)) {
        for (const fn of this.events.get(msg.method)) fn(msg.params);
        this.events.delete(msg.method);
      }
    });
  }
  send(method, params = {}) {
    const id = ++this.id;
    this.ws.send(JSON.stringify({ id, method, params }));
    return new Promise((resolve, reject) => this.pending.set(id, { resolve, reject }));
  }
  once(method) {
    return new Promise(resolve => {
      const arr = this.events.get(method) || [];
      arr.push(resolve);
      this.events.set(method, arr);
    });
  }
  async eval(expression) {
    const r = await this.send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.text);
    return r.result.value;
  }
  async shot(name) {
    const r = await this.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
    const file = path.join(OUT, name + '.png');
    fs.writeFileSync(file, Buffer.from(r.data, 'base64'));
    console.log('saved', file);
  }
}

(async () => {
  const chrome = spawn(CHROME, [
    '--headless=new',
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${PROFILE}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-gpu',
    '--hide-scrollbars',
    '--mute-audio',
    'about:blank',
  ], { stdio: 'ignore' });

  try {
    await waitJson(`http://127.0.0.1:${PORT}/json/version`);
    const target = await (await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, { method: 'PUT' })).json();
    const ws = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise((res, rej) => { ws.addEventListener('open', res); ws.addEventListener('error', rej); });
    const cdp = new CDP(ws);

    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 390, height: 844, deviceScaleFactor: 2, mobile: true,
    });
    await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });

    const loaded = cdp.once('Page.loadEventFired');
    await cdp.send('Page.navigate', { url: URL });
    await loaded;
    await sleep(2500);

    const startOk = await cdp.eval(`!!document.getElementById('btn-start') && document.body.dataset.screen === 'screen-start'`);
    console.log('start screen ok:', startOk);
    await cdp.shot('01-start');

    await cdp.eval(`document.getElementById('btn-start').click()`);
    await sleep(1200);
    for (let i = 0; i < 20; i++) {
      const n = await cdp.eval(`document.querySelectorAll('#idol-grid .idol-pick').length`);
      if (n > 0) break;
      await sleep(300);
    }
    const idolCount = await cdp.eval(`document.querySelectorAll('#idol-grid .idol-pick').length`);
    console.log('idol cards:', idolCount);
    await sleep(800);
    await cdp.shot('02-select');

    await cdp.eval(`document.querySelector('#idol-grid .idol-pick').click()`);
    await sleep(1500);
    const screen = await cdp.eval(`document.body.dataset.screen`);
    const hand = await cdp.eval(`document.querySelectorAll('#cards .card').length`);
    console.log('screen:', screen, 'hand cards:', hand);
    await sleep(800);
    await cdp.shot('03-game');

    if (hand > 0) {
      await cdp.eval(`document.querySelector('#cards .card').click()`);
      await sleep(1600);
      await cdp.shot('04-play');
    }

    const errors = await cdp.eval(`window.__captureErrors || []`);
    console.log('done', errors);
    ws.close();
  } finally {
    chrome.kill();
  }
})().catch(e => { console.error('FAILED', e); process.exit(1); });
