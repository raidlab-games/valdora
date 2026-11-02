// Áudio do Valdora: efeitos e música 100% sintetizados com WebAudio (nenhum arquivo de som,
// nenhuma licença envolvida). Volume e opções ficam em localStorage ("valdora.options").
window.ValdoraAudio = (() => {
  const OPT_KEY = "valdora.options";
  const opts = { sfx: 0.6, music: 0.35, shake: true, zoom: "auto", ui: "auto" };
  try { Object.assign(opts, JSON.parse(localStorage.getItem(OPT_KEY)) || {}); } catch (e) { /* sem opções salvas */ }
  let ac = null, sfxGain, musicGain, noiseBuf, musicTimer = null, verbIn = null;

  function init() { // precisa de um gesto do usuário (clique em Jogar/Continuar)
    if (ac) { if (ac.state === "suspended") ac.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    ac = new AC();
    sfxGain = ac.createGain(); sfxGain.connect(ac.destination);
    // rodada 67: "sala" curta para os impactos (eco de 75 ms com realimentação e filtro): o golpe ganha corpo sem embolar
    verbIn = ac.createGain(); const dl = ac.createDelay(0.5), fb = ac.createGain(), lp = ac.createBiquadFilter(), wet = ac.createGain();
    dl.delayTime.value = 0.075; fb.gain.value = 0.3; lp.type = "lowpass"; lp.frequency.value = 2200; wet.gain.value = 0.35;
    verbIn.connect(dl); dl.connect(lp); lp.connect(fb); fb.connect(dl); lp.connect(wet); wet.connect(sfxGain);
    musicGain = ac.createGain();
    const warm = ac.createBiquadFilter(); warm.type = "lowpass"; warm.frequency.value = 2600; // música mais "quente"
    musicGain.connect(warm); warm.connect(ac.destination);
    noiseBuf = ac.createBuffer(1, ac.sampleRate * 0.5, ac.sampleRate);
    const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    apply(); startMusic();
  }
  function apply() {
    if (!ac) return;
    sfxGain.gain.value = opts.sfx * 0.5; musicGain.gain.value = opts.music * 0.18;
  }
  function setOpt(k, v) { opts[k] = v; apply(); try { localStorage.setItem(OPT_KEY, JSON.stringify(opts)); } catch (e) { /* ignora */ } }

  // ---------- blocos de som ----------
  const sendTo = (g, send) => { if (send && verbIn) { const sg = ac.createGain(); sg.gain.value = send; g.connect(sg); sg.connect(verbIn); } };
  function tone(freq, dur, type = "square", vol = 0.3, slide = 0, delay = 0, out = sfxGain, send = 0) {
    if (!ac || !out) return;
    const t = ac.currentTime + delay, o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq * slide), t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(out); sendTo(g, send); o.start(t); o.stop(t + dur + 0.02);
  }
  function noise(dur, vol = 0.3, freq = 1200, q = 1, delay = 0, type = "bandpass", send = 0) {
    if (!ac) return;
    const t = ac.currentTime + delay, s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
    s.buffer = noiseBuf; f.type = type; f.frequency.value = freq; f.Q.value = q;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(sfxGain); sendTo(g, send); s.start(t); s.stop(t + dur + 0.02);
  }
  const SFX = {
    chop: () => { noise(0.08, 0.5, 900, 2); tone(180, 0.08, "triangle", 0.25, 0.6); },
    mine: () => { tone(1400, 0.12, "square", 0.12, 0.7); noise(0.06, 0.35, 3000, 3); tone(900, 0.1, "triangle", 0.15, 0.8, 0.03); },
    splash: () => { noise(0.25, 0.35, 700, 0.7, 0, "lowpass"); tone(500, 0.12, "sine", 0.12, 1.6); },
    hit: () => { noise(0.035, 0.2, 5200, 0.8, 0, "highpass"); noise(0.07, 0.5, 1800, 1.5, 0.01, "bandpass", 0.45); tone(160, 0.1, "square", 0.16, 0.5, 0.01); tone(140, 0.13, "sine", 0.34, 0.4, 0.01, sfxGain, 0.5); }, // rodada 67: em camadas
    miss: () => { noise(0.12, 0.25, 2500, 0.8, 0, "highpass"); },
    thorn: () => { for (let i = 0; i < 4; i++) noise(0.018, 0.22, 6800 + i * 900, 3, i * 0.028, "highpass"); tone(1250, 0.05, "triangle", 0.08, 0.7, 0.01); tone(180, 0.09, "sawtooth", 0.1, 0.6, 0.02); }, // rodada 110: espetadas finas e um "ai" curto
    hurt: () => { tone(220, 0.16, "sawtooth", 0.22, 0.5); noise(0.08, 0.3, 600, 1, 0, "bandpass", 0.35); tone(95, 0.15, "sine", 0.3, 0.5, 0, sfxGain, 0.4); },
    coin: () => { tone(988, 0.07, "square", 0.15); tone(1319, 0.14, "square", 0.15, 1, 0.06); },
    pickup: () => { tone(660, 0.06, "triangle", 0.25, 1.5); tone(990, 0.08, "triangle", 0.2, 1, 0.05); },
    level: () => { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.18, "square", 0.16, 1, i * 0.09)); },
    clang: () => { tone(1800, 0.25, "triangle", 0.18, 0.98); tone(2700, 0.18, "sine", 0.1, 1); noise(0.05, 0.3, 4000, 2); },
    smelt: () => { noise(0.4, 0.25, 400, 0.6, 0, "lowpass"); tone(140, 0.3, "sine", 0.12, 1.4); },
    cook: () => { noise(0.3, 0.2, 2200, 0.5, 0, "highpass"); },
    warn: () => { tone(330, 0.18, "sawtooth", 0.2, 1, 0); tone(330, 0.18, "sawtooth", 0.2, 1, 0.22); },
    slam: () => { tone(90, 0.5, "sine", 0.5, 0.4, 0, sfxGain, 0.6); noise(0.4, 0.5, 200, 0.7, 0, "lowpass", 0.5); noise(0.06, 0.35, 3000, 1, 0.01, "bandpass", 0.4); },
    quest: () => { [659, 784, 988].forEach((f, i) => tone(f, 0.16, "triangle", 0.22, 1, i * 0.08)); },
    ui: () => tone(800, 0.04, "square", 0.08),
    ready: () => { tone(1046, 0.07, "sine", 0.09); tone(1568, 0.12, "sine", 0.07, 0, 0.06); }, // rodada 66: habilidade pronta
    death: () => { tone(400, 0.6, "triangle", 0.25, 0.3); },
    drink: () => { tone(400, 0.08, "sine", 0.2, 1.8); tone(600, 0.1, "sine", 0.15, 1.6, 0.08); },
    crit: () => { noise(0.04, 0.25, 6000, 0.8, 0, "highpass"); noise(0.1, 0.6, 2400, 1.2, 0.01, "bandpass", 0.55); tone(220, 0.14, "square", 0.22, 0.4, 0.01); tone(1320, 0.12, "triangle", 0.15, 1.2, 0.03, sfxGain, 0.4);
      tone(110, 0.22, "sine", 0.45, 0.4, 0.01, sfxGain, 0.6); tone(2400, 0.22, "triangle", 0.06, 0.97, 0.03, sfxGain, 0.5); }, // rodada 67: baque e brilho metálico
    lute: () => { [392, 494, 587, 784, 587, 659].forEach((f, i) => { tone(f, 0.45, "triangle", 0.16, 1, i * 0.11); tone(f * 2, 0.12, "sine", 0.05, 1, i * 0.11); }); },
    step: () => noise(0.04, 0.08, 900, 1.5),
    whoosh: () => noise(0.12, 0.2, 1400, 0.6, 0, "bandpass"),
    echo_rise: () => { noise(0.9, 0.18, 900, 0.5, 0, "bandpass"); [294, 440, 587, 880].forEach((f, i) => tone(f, 0.7, "sine", 0.1, 1.02, i * 0.12)); tone(1760, 0.6, "triangle", 0.05, 1, 0.45); }, // rodada 26: névoa subindo; rodada 42: pico 0,75 → 0,63
    echo_fade: () => { noise(0.7, 0.18, 1200, 0.6, 0, "highpass"); [880, 659, 440, 294].forEach((f, i) => tone(f, 0.5, "sine", 0.1, 0.97, i * 0.1)); }, // névoa se desfazendo
    rare: () => { [784, 988, 1175, 1568].forEach((f, i) => tone(f, 0.3, "triangle", 0.14, 1, i * 0.07)); tone(2093, 0.5, "sine", 0.08, 1, 0.3); },
  };
  let lastPlay = {};
  function play(name) { // evita empilhar o mesmo som no mesmo instante
    if (!ac || !SFX[name] || opts.sfx <= 0) return;
    const now = ac.currentTime; if (lastPlay[name] && now - lastPlay[name] < 0.04) return; lastPlay[name] = now;
    SFX[name]();
  }

  // ---------- música procedural ----------
  // Cada região tem modo, progressão de acordes e instrumentação própria. O agendamento usa o relógio do
  // AudioContext (olhando 0,35 s à frente), então o ritmo não "tropeça" quando a aba fica lenta.
  const SCALES = { maior: [0, 2, 4, 5, 7, 9, 11], dorico: [0, 2, 3, 5, 7, 9, 10], menor: [0, 2, 3, 5, 7, 8, 10],
    frigio: [0, 1, 3, 5, 7, 8, 10], mixo: [0, 2, 4, 5, 7, 9, 10] };
  const MOODS = {
    town: { root: 262, scale: SCALES.maior, prog: [0, 5, 3, 4], bpm: 96, arp: true, pad: true, drums: 0.5, lead: "triangle", melody: 0.9 },
    fields: { root: 294, scale: SCALES.maior, prog: [0, 4, 5, 3], bpm: 104, arp: true, pad: false, drums: 0.7, lead: "square", melody: 0.85 },
    east: { root: 247, scale: SCALES.mixo, prog: [0, 6, 3, 0], bpm: 100, arp: true, pad: false, drums: 0.8, lead: "square", melody: 0.8 },
    south: { root: 220, scale: SCALES.dorico, prog: [0, 3, 0, 6], bpm: 84, arp: false, pad: true, drums: 0.35, lead: "triangle", melody: 0.6 },
    west: { root: 196, scale: SCALES.menor, prog: [0, 5, 2, 6], bpm: 88, arp: true, pad: true, drums: 0.4, lead: "triangle", melody: 0.65 },
    ruins: { root: 185, scale: SCALES.frigio, prog: [0, 1, 0, 6], bpm: 72, arp: false, pad: true, drums: 0.25, lead: "sine", melody: 0.45 },
    crypt: { root: 156, scale: SCALES.frigio, prog: [0, 1, 6, 0], bpm: 64, arp: false, pad: true, drums: 0.2, lead: "sine", melody: 0.35 },
  };
  let mood = MOODS.town, nextMood = null, nextTime = 0, eighth = 0, phrase = 0, motif = null;
  const seeded = (seed) => () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const freqOf = (m, deg, oct = 0) => { const n = m.scale.length, o = Math.floor(deg / n); return m.root * Math.pow(2, (m.scale[((deg % n) + n) % n] + 12 * (o + oct)) / 12); };
  function makeMotif(seed) { // 2 compassos de melodia em passos curtos, com pausas para respirar
    const r = seeded(seed * 7919 + 13), notes = []; let deg = 2 + Math.floor(r() * 4);
    for (let i = 0; i < 16; i++) {
      if (r() < (i % 2 ? 0.45 : 0.2)) { notes.push(null); continue; }
      deg = Math.max(0, Math.min(9, deg + [-2, -1, -1, 0, 1, 1, 2][Math.floor(r() * 7)]));
      notes.push({ deg, len: r() < 0.25 ? 2 : 1 });
    }
    return notes;
  }
  function mtone(freq, t, dur, type, vol, slow) {
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + (slow ? 0.35 : 0.012));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(musicGain); o.start(t); o.stop(t + dur + 0.05);
  }
  function drum(t, kind, amt) {
    if (kind === "kick") { const o = ac.createOscillator(), g = ac.createGain(); o.frequency.setValueAtTime(130, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.18);
      g.gain.setValueAtTime(0.55 * amt, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22); o.connect(g); g.connect(musicGain); o.start(t); o.stop(t + 0.25); return; }
    const s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain();
    s.buffer = noiseBuf; f.type = "highpass"; f.frequency.value = 6000;
    g.gain.setValueAtTime(0.12 * amt, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
    s.connect(f); f.connect(g); g.connect(musicGain); s.start(t); s.stop(t + 0.06);
  }
  function playEighth(t) {
    const pos = eighth % 32;
    if (pos === 0) { if (nextMood) { mood = nextMood; nextMood = null; } if (phrase++ % 2 === 0 || !motif) motif = makeMotif(phrase * 31 + Math.floor(mood.root)); }
    const m = mood, bar = Math.floor(pos / 8), beat = pos % 8, chord = m.prog[bar], len8 = 60 / m.bpm / 2;
    if (beat === 0 || beat === 4) mtone(freqOf(m, chord, -1), t, len8 * (beat === 0 ? 3.5 : 2.5), "triangle", 0.42);
    if (m.pad && beat === 0) for (const k of [0, 2, 4]) mtone(freqOf(m, chord + k), t, len8 * 7.8, "sine", 0.07, true);
    if (m.arp) mtone(freqOf(m, chord + [0, 2, 4, 2, 0, 2, 4, 7][beat]), t, len8 * 0.9, "square", 0.035);
    let n = motif[pos % 16];
    if (n && Math.random() < m.melody) {
      let deg = n.deg;
      if (beat % 4 === 0) { const tones = [chord, chord + 2, chord + 4, chord + 7]; deg = tones.reduce((a, b) => Math.abs(b - deg) < Math.abs(a - deg) ? b : a); } // tempos fortes caem em notas do acorde
      mtone(freqOf(m, deg + (bar === 3 && pos > 28 ? -1 : 0), 1), t, len8 * n.len * 0.92, m.lead, 0.075);
    }
    if (m.drums) { if (beat === 0 || (beat === 4 && m.drums > 0.5)) drum(t, "kick", m.drums); if (beat % 2 === 1) drum(t, "hat", m.drums); }
  }
  function startMusic() {
    if (musicTimer) return;
    nextTime = ac.currentTime + 0.1;
    musicTimer = setInterval(() => {
      if (!ac) return;
      if (nextTime < ac.currentTime - 1) nextTime = ac.currentTime + 0.05; // voltou de uma pausa longa
      while (nextTime < ac.currentTime + 0.35) { if (opts.music > 0) playEighth(nextTime); nextTime += 60 / mood.bpm / 2; eighth++; }
    }, 90);
  }
  function setMood(region) { const m = MOODS[region] || MOODS.fields; if (m !== mood) nextMood = m; } // troca no início do próximo ciclo

  return { init, play, setMood, opts, setOpt };
})();
