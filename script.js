/* ==========================================================================
   Medi Reminder AI - application logic (vanilla JS, no build step)
   STORAGE: everything lives in browser localStorage (mrai.* keys).
   FUTURE BACKEND INTEGRATION POINTS are marked with "FUTURE:" comments -
   a server, cloud database, push notifications, SMS/WhatsApp APIs (e.g.
   Twilio) or a verified medication database can replace the marked pieces
   without redesigning the app. Per product decision, current storage stays
   local (localStorage / optional file export), NOT Supabase.
   ========================================================================== */
'use strict';

/* ------------------------------ tiny helpers --------------------------- */
const $ = id => document.getElementById(id);
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const todayStr = () => {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
};
const nowHM = () => {
  const d = new Date();
  return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
};
function fmtTime(hm) {
  const [h, m] = hm.split(':').map(Number);
  const am = h < 12;
  const hh = h % 12 === 0 ? 12 : h % 12;
  return hh + ':' + String(m).padStart(2, '0') + ' ' + (am ? 'AM' : 'PM');
}
const digitsOnly = s => String(s || '').replace(/\D/g, '');
function esc(s) { const d = document.createElement('div'); d.textContent = s == null ? '' : s; return d.innerHTML; }

/* ------------------------------ Store (localStorage) ------------------- */
/* FUTURE: replace Store.get/set with REST API calls or file-system storage;
   the rest of the app only talks to this object. */
const Store = {
  get(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw == null ? fallback : JSON.parse(raw);
    } catch (e) { console.warn('Store.get failed', key, e); return fallback; }
  },
  set(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); return true; }
    catch (e) { console.warn('Store.set failed', key, e); toast('Storage error - data may not persist.'); return false; }
  },
  remove(key) { try { localStorage.removeItem(key); } catch (e) { /* ignore */ } }
};

/* ------------------------------ state ---------------------------------- */
const DEFAULT_SETTINGS = {
  lang: 'en', theme: 'light', largeText: false, highContrast: false,
  voiceGuidance: true, notifications: false,
  escalationMinutes: 15, notifyCaregiver: true, emergencyNumber: '112'
};
const asArray = v => Array.isArray(v) ? v.filter(x => x && typeof x === 'object') : [];
const asObject = v => (v && typeof v === 'object' && !Array.isArray(v)) ? v : {};
let settings = Object.assign({}, DEFAULT_SETTINGS, asObject(Store.get('mrai.settings', {})));
let medicines = asArray(Store.get('mrai.medicines', [])).filter(m => typeof m.name === 'string' && m.name);
let history = asArray(Store.get('mrai.history', []));
let symptoms = asArray(Store.get('mrai.symptoms', []));
let caregivers = asArray(Store.get('mrai.caregivers', []));
let emergencyContact = asObject(Store.get('mrai.emergencyContact', null));
if (!emergencyContact.name) emergencyContact = null;
medicines.forEach(m => {
  if (!Array.isArray(m.times)) m.times = [];
  m.times = m.times.filter(x => typeof x === 'string' && /^\d{1,2}:\d{2}$/.test(x));
  if (!Array.isArray(m.days)) m.days = [];
});

const save = {
  settings: () => Store.set('mrai.settings', settings),
  medicines: () => Store.set('mrai.medicines', medicines),
  history: () => Store.set('mrai.history', history),
  symptoms: () => Store.set('mrai.symptoms', symptoms),
  caregivers: () => Store.set('mrai.caregivers', caregivers),
  contact: () => Store.set('mrai.emergencyContact', emergencyContact)
};
const t = (k, v) => I18N.t(k, v);

/* ------------------------------ toast ---------------------------------- */
let toastTimer = null;
function toast(msg) {
  const el = $('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 3200);
}

/* ------------------------------ theme / language / a11y ---------------- */
function applyPrefs() {
  const html = document.documentElement;
  html.dataset.theme = settings.theme;
  html.classList.toggle('large-text', !!settings.largeText);
  html.classList.toggle('high-contrast', !!settings.highContrast);
  $('btnTheme').textContent = settings.theme === 'dark' ? '🌙' : '☀️';
  $('btnLang').textContent = settings.lang === 'ur' ? 'اردو' : 'EN';
  $('tglLarge').checked = !!settings.largeText;
  $('tglContrast').checked = !!settings.highContrast;
  $('tglVoice').checked = !!settings.voiceGuidance;
  $('tglNotif').checked = !!settings.notifications;
  $('langEn').classList.toggle('active', settings.lang === 'en');
  $('langUr').classList.toggle('active', settings.lang === 'ur');
  $('themeLight').classList.toggle('active', settings.theme === 'light');
  $('themeDark').classList.toggle('active', settings.theme === 'dark');
}
function setLang(lang) {
  settings.lang = lang;
  save.settings();
  I18N.set(lang);
  buildDayRow();
  applyPrefs();
  const editing = editingMedId ? medicines.find(m => m.id === editingMedId) : null;
  $('manualTitle').textContent = editing ? t('btn_edit') + ': ' + editing.name : t('add_medicine');
  renderAll();
}
function setTheme(theme) {
  settings.theme = theme;
  save.settings();
  applyPrefs();
}

/* ------------------------------ voice (TTS) ---------------------------- */
function pickVoice(langPrefix) {
  if (!('speechSynthesis' in window)) return null;
  const voices = window.speechSynthesis.getVoices();
  return voices.find(v => v.lang && v.lang.toLowerCase().startsWith(langPrefix)) || null;
}
function setMicState(state) {
  setOrb(state);
  const ms = $('micState');
  if (ms) ms.textContent = t(state);
  const b = $('btnMicAssistant');
  if (b) b.classList.toggle('listening', state === 'listening');
}
function speak(text, force) {
  if (!('speechSynthesis' in window)) { if (force) toast(t('tts_unavailable')); return; }
  if (!force && !settings.voiceGuidance) return;
  if (!String(text || '').trim()) return;
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = settings.lang === 'ur' ? 'ur-PK' : 'en-US';
    u.rate = 0.95;
    const v = pickVoice(settings.lang === 'ur' ? 'ur' : 'en');
    if (v) u.voice = v;
    setMicState('speaking');
    const done = () => { const o = $('mediOrb'); if (!o || o.dataset.state === 'speaking') setMicState('ready'); };
    u.onend = done;
    u.onerror = done;
    window.speechSynthesis.speak(u);
  } catch (e) { console.warn('TTS failed', e); setMicState('ready'); }
}
function stopSpeech() { if ('speechSynthesis' in window) window.speechSynthesis.cancel(); }

/* ------------------------------ speech recognition --------------------- */
let recognition = null;
function recognitionSupported() {
  return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
}
/* FUTURE: swap for a server-side speech-to-text endpoint; callers only use listenOnce(). */
function cancelRecognition() {
  const rec = recognition;
  recognition = null;
  if (!rec) return;
  try {
    rec.onresult = null; rec.onerror = null; rec.onend = null;
    rec.abort();
  } catch (e) { /* ignore */ }
}
function stopRecognition() { cancelRecognition(); }
function asrErrorMessage(code) {
  switch (code) {
    case 'not-allowed':
    case 'service-not-allowed': return t('asr_denied');
    case 'audio-capture': return t('asr_audio');
    case 'network': return t('asr_network');
    case 'language-not-supported': return t('asr_unsupported');
    default: return t('asr_nothing');
  }
}
function listenOnce(onResult, onEnd) {
  if (!recognitionSupported()) { toast(t('asr_unsupported')); onEnd && onEnd(); return false; }
  cancelRecognition();
  let rec;
  try {
    rec = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  } catch (e) { toast(t('asr_unsupported')); onEnd && onEnd(); return false; }
  recognition = rec;
  let ended = false;
  const finish = () => {
    if (ended) return;
    ended = true;
    if (recognition === rec) recognition = null;
    onEnd && onEnd();
  };
  rec.lang = settings.lang === 'ur' ? 'ur-PK' : 'en-US';
  rec.interimResults = false;
  rec.maxAlternatives = 5;
  rec.onresult = e => {
    const alts = [];
    for (let i = 0; i < e.results[0].length; i++) alts.push(e.results[0][i].transcript);
    if (alts.length) onResult(alts);
  };
  rec.onerror = ev => {
    if (ev.error !== 'aborted') toast(asrErrorMessage(ev.error));
    finish();
  };
  rec.onend = finish;
  try { rec.start(); } catch (e) { toast(t('asr_unsupported')); finish(); return false; }
  return true;
}

/* ------------------------------ voice answer matching ------------------ */
function normalizeVoice(s) {
  return String(s || '').toLowerCase()
    .replace(/[.,!?;:"'`()\-–—۔؟،]/g, ' ')
    .replace(/\s+/g, ' ').trim();
}
const VOICE_YES = ['yes', 'yeah', 'yep', 'ok', 'okay', 'took it', 'i took', 'taken', 'i have taken',
  'medicine taken', 'done', 'confirmed', 'ہاں', 'جی', 'لے لی', 'لی ہے', 'لیا', 'تصدیق'];
const VOICE_NO = ['no', 'not yet', 'not taken', 'did not take', 'later', 'remind me later', 'wait', 'snooze',
  'نہیں', 'ابھی نہیں', 'بعد میں', 'بعد', 'مؤخر'];
function matchVoice(text, phrases) {
  const n = normalizeVoice(text);
  if (!n) return false;
  return phrases.some(p => (/^[a-z0-9]+$/.test(p) && p.length <= 3)
    ? new RegExp('(^| )' + p + '( |$)').test(n)
    : n.indexOf(p) >= 0);
}

/* ------------------------------ alarm (Web Audio) ---------------------- */
let audioCtx = null, alarmTimer = null;
function beep() {
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const seq = [[880, 0], [660, 0.18]];
    seq.forEach(([f, at]) => {
      const o = audioCtx.createOscillator(), g = audioCtx.createGain();
      o.type = 'sine'; o.frequency.value = f;
      o.connect(g); g.connect(audioCtx.destination);
      const t0 = audioCtx.currentTime + at;
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(0.4, t0 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.16);
      o.start(t0); o.stop(t0 + 0.2);
    });
  } catch (e) { console.warn('alarm failed', e); }
}
function startAlarm() { if (alarmTimer) return; beep(); alarmTimer = setInterval(beep, 1400); }
function stopAlarm() { clearInterval(alarmTimer); alarmTimer = null; }

/* ------------------------------ notifications -------------------------- */
function maybeNotify(title, body) {
  if (!settings.notifications || !('Notification' in window)) return;
  if (Notification.permission === 'granted') {
    try { new Notification(title, { body }); } catch (e) { /* ignore */ }
  }
}

/* ------------------------------ doses / schedule ----------------------- */
function medAppliesToday(med) {
  if (!med.days || med.days.length === 0) return true;
  return med.days.includes(new Date().getDay());
}
function doseRecord(med, time, status) {
  return history.find(h => h.medicineId === med.id && h.date === todayStr() &&
    h.scheduledTime === time && h.status === status);
}
function doseStatus(med, time) {
  if (doseRecord(med, time, 'confirmed')) return 'confirmed';
  if (doseRecord(med, time, 'not_confirmed')) return 'not_confirmed';
  if (med.snoozedUntil && med.snoozedUntil > Date.now() && (med.snoozedTime || time) === time) return 'snoozed';
  if (time < nowHM()) return 'not_confirmed';
  return 'upcoming';
}
function todayDoses() {
  const list = [];
  medicines.filter(medAppliesToday).forEach(med => {
    (med.times || []).forEach(time => list.push({ med, time }));
  });
  list.sort((a, b) => a.time.localeCompare(b.time));
  return list;
}
function nextDose() {
  const now = Date.now();
  let upcoming = null, snoozed = null, missed = null;
  medicines.filter(medAppliesToday).forEach(med => {
    if (med.snoozedUntil && med.snoozedUntil > now) {
      const d = new Date(med.snoozedUntil);
      const hm = String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
      if (!snoozed || med.snoozedUntil < snoozed.at) snoozed = { med, time: hm, at: med.snoozedUntil, status: 'snoozed' };
    }
    (med.times || []).forEach(time => {
      const st = doseStatus(med, time);
      if (st === 'confirmed' || st === 'snoozed') return;
      const [h, m] = time.split(':').map(Number);
      const d = new Date(); d.setHours(h, m, 0, 0);
      const at = d.getTime();
      const cand = { med, time, at, status: st };
      if (at >= now) { if (!upcoming || at < upcoming.at) upcoming = cand; }
      else if (!missed || at > missed.at) missed = cand;
    });
  });
  const soonest = [upcoming, snoozed].filter(Boolean).sort((a, b) => a.at - b.at)[0];
  return soonest || missed;
}
function countdownText(at) {
  const diff = Math.round((at - Date.now()) / 60000);
  if (diff <= 0) return t('due_now');
  const h = Math.floor(diff / 60), m = diff % 60;
  const s = h > 0 ? t('dur_hm', { h, m }) : t('dur_m', { m });
  return t('remaining', { t: s });
}

/* ------------------------------ reminder engine ------------------------ */
let activeReminder = null;      // {med, time, isTest}
let escalationTimer = null;

function setOrb(state) { const o = $('mediOrb'); if (o) o.dataset.state = state; }

function startReminder(med, doseTime, isTest) {
  if (activeReminder && activeReminder.med.id === med.id && activeReminder.time === doseTime && $('reminderModal').open) return;
  stopAlarm();
  cancelRecognition();
  activeReminder = { med, time: doseTime, isTest };
  $('reminderImage').src = med.image || placeholderImg(med.name);
  $('reminderImage').alt = med.name;
  $('reminderMedName').textContent = med.name;
  $('reminderDose').textContent = med.dose || '';
  $('reminderTime').textContent = t('scheduled_at') + ': ' + fmtTime(doseTime);
  $('voiceStatus').textContent = '';
  $('snoozePanel').hidden = true;
  $('reminderModal').showModal();
  startAlarm();
  speak(t('rem_speech') + ' ' + med.name + '. ' + (med.dose || ''), true);
  maybeNotify('Medi Reminder AI', t('rem_title') + ' - ' + med.name);
  if (!isTest && settings.notifyCaregiver) scheduleEscalation(med, doseTime);
}
function closeReminder() {
  stopAlarm(); stopSpeech(); stopRecognition();
  try { if ($('reminderModal').open) $('reminderModal').close(); } catch (e) { /* ignore */ }
  activeReminder = null;
}
function confirmTaken() {
  if (!activeReminder) return;
  const { med, time, isTest } = activeReminder;
  clearTimeout(escalationTimer);
  history.unshift({
    id: uid(), medicineId: med.id, medicineName: med.name, demo: !!med.demo, test: !!isTest,
    date: todayStr(), scheduledTime: time, confirmedAt: nowHM(),
    status: 'confirmed', recordedAt: Date.now()
  });
  med.snoozedUntil = null;
  med.snoozedTime = null;
  save.history(); save.medicines();
  closeReminder();
  $('successModal').showModal();
  speak(t('voice_yes'), true);
  pendingCheckinMed = med;
  renderAll();
}
let pendingCheckinMed = null;

function applySnooze(minutes) {
  if (!activeReminder) return;
  const { med, time, isTest } = activeReminder;
  history.unshift({
    id: uid(), medicineId: med.id, medicineName: med.name, demo: !!med.demo, test: !!isTest,
    date: todayStr(), scheduledTime: time, status: 'snoozed', recordedAt: Date.now()
  });
  med.snoozedUntil = Date.now() + minutes * 60000;
  med.snoozedTime = time;
  save.history(); save.medicines();
  closeReminder();
  toast(t('snoozed_for', { m: minutes }));
  renderAll();
}
function dismissWithoutConfirming() {
  if (!activeReminder) return;
  const { med, time, isTest } = activeReminder;
  history.unshift({
    id: uid(), medicineId: med.id, medicineName: med.name, demo: !!med.demo, test: !!isTest,
    date: todayStr(), scheduledTime: time, status: 'not_confirmed', recordedAt: Date.now()
  });
  save.history();
  closeReminder();
  renderAll();
  if (!isTest && settings.notifyCaregiver && !escalationTimer) scheduleEscalation(med, time);
}
function scheduleEscalation(med, doseTime) {
  clearTimeout(escalationTimer);
  escalationTimer = setTimeout(() => {
    escalationTimer = null;
    if (doseRecord(med, doseTime, 'confirmed')) return;
    runEscalation(med);
  }, Math.max(1, Number(settings.escalationMinutes)) * 60000);
}
function runEscalation(med) {
  const box = $('escalationActions');
  box.textContent = '';
  if (caregivers.length === 0) {
    const p = document.createElement('p');
    p.className = 'hint'; p.textContent = t('no_cg');
    box.appendChild(p);
  }
  caregivers.forEach(cg => {
    const call = document.createElement('a');
    call.className = 'btn btn-primary btn-xl';
    call.href = 'tel:' + digitsOnly(cg.phone);
    call.textContent = '📞 ' + t('call') + ' ' + cg.name;
    box.appendChild(call);
    const num = digitsOnly(cg.whatsapp || cg.phone);
    if (num) {
      const wa = document.createElement('a');
      wa.className = 'btn btn-secondary btn-xl';
      wa.target = '_blank'; wa.rel = 'noopener';
      wa.href = 'https://wa.me/' + num + '?text=' + encodeURIComponent(t('esc_wa_msg'));
      wa.textContent = '💬 ' + t('whatsapp') + ' ' + cg.name;
      box.appendChild(wa);
    }
  });
  $('escalationModal').showModal();
  speak(t('esc_title'), true);
}

/* ------------------------------ scheduler ------------------------------ */
const firedKeys = new Set();
function tick() {
  $('topbarClock').textContent = fmtTime(nowHM());
  const hm = nowHM();
  medicines.filter(medAppliesToday).forEach(med => {
    (med.times || []).forEach(time => {
      const key = med.id + '|' + todayStr() + '|' + time;
      if (time === hm && !firedKeys.has(key)) {
        firedKeys.add(key);
        startReminder(med, time, false);
      }
    });
    if (med.snoozedUntil && med.snoozedUntil <= Date.now()) {
      const key = med.id + '|snooze|' + med.snoozedUntil;
      if (!firedKeys.has(key)) {
        firedKeys.add(key);
        const d = new Date(med.snoozedUntil);
        const sh = med.snoozedTime || (String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'));
        med.snoozedUntil = null; med.snoozedTime = null; save.medicines();
        startReminder(med, sh, false);
      }
    }
  });
  updateNextMedCard();
}

/* ------------------------------ dashboard ------------------------------ */
function renderGreeting() {
  const h = new Date().getHours();
  const key = h < 12 ? 'greet_morning' : h < 17 ? 'greet_afternoon' : 'greet_evening';
  $('greeting').textContent = t(key);
}
function updateNextMedCard() {
  const nd = nextDose();
  if (!nd) {
    $('nextMedName').textContent = medicines.length ? t('no_next') : t('none_yet');
    $('nextMedTime').textContent = '';
    $('nextMedCountdown').textContent = '';
    $('nextMedImage').src = placeholderImg('Medi');
    $('nextMedStatus').hidden = true;
    return;
  }
  $('nextMedImage').src = nd.med.image || placeholderImg(nd.med.name);
  $('nextMedImage').alt = nd.med.name;
  $('nextMedName').textContent = nd.med.name;
  $('nextMedTime').textContent = '⏰ ' + fmtTime(nd.time);
  $('nextMedCountdown').textContent = countdownText(nd.at);
  const st = $('nextMedStatus');
  st.hidden = false;
  st.textContent = t('st_' + nd.status);
  st.className = 'chip ' + ({ confirmed: 'ok', upcoming: 'info', snoozed: 'warn', not_confirmed: 'danger' }[nd.status] || 'info');
}
function renderProgress() {
  const doses = todayDoses();
  const done = doses.filter(d => doseStatus(d.med, d.time) === 'confirmed').length;
  const total = doses.length;
  $('progressCenter').textContent = done + '/' + total;
  $('progressLabel').textContent = t('doses_of', { done, total });
  const C = 326.7;
  $('progressArc').style.strokeDashoffset = total ? C * (1 - done / total) : C;
}
function renderTimeline() {
  const ul = $('todayTimeline');
  ul.textContent = '';
  const doses = todayDoses();
  if (!doses.length) {
    const li = document.createElement('li');
    li.textContent = t('no_doses_today');
    ul.appendChild(li);
    return;
  }
  doses.forEach(d => {
    const st = doseStatus(d.med, d.time);
    const li = document.createElement('li');
    const time = document.createElement('span');
    time.className = 'tl-time'; time.textContent = fmtTime(d.time);
    const name = document.createElement('span');
    name.className = 'tl-name'; name.textContent = d.med.name;
    const chip = document.createElement('span');
    chip.className = 'chip ' + ({ confirmed: 'ok', upcoming: 'info', snoozed: 'warn', not_confirmed: 'danger' }[st]);
    chip.textContent = ({ confirmed: '✅', upcoming: '⏳', snoozed: '🟠', not_confirmed: '⚠️' }[st]) + ' ' + t('st_' + st);
    li.append(time, name, chip);
    ul.appendChild(li);
  });
}
function listenSummary() {
  const doses = todayDoses();
  const done = doses.filter(d => doseStatus(d.med, d.time) === 'confirmed').length;
  const miss = doses.filter(d => doseStatus(d.med, d.time) === 'not_confirmed').length;
  speak(t('summary_spoken', { total: doses.length, done, up: doses.length - done - miss, miss }), true);
}

/* ------------------------------ assistant ------------------------------ */
function assistantAnswer(text) {
  const q = normalizeVoice(text);
  const nd = nextDose();
  let reply = '';
  let open = null;

  if (/next|اگلی|کب|when/.test(q)) {
    reply = nd
      ? nd.med.name + ' — ' + fmtTime(nd.time) + '. ' + countdownText(nd.at)
      : (medicines.length ? t('no_next') : t('none_yet'));
  } else if (/history|ہسٹری|ریکارڈ|record/.test(q)) {
    open = 'history';
    reply = t('history_title');
  } else if (/emergency|urgent|ہنگامی|ایمرجنسی/.test(q)) {
    open = 'emergency';
    reply = t('em_title');
  } else if (/family|care ?giver|carer|اہل|نگہداشت|خاندان/.test(q)) {
    open = 'family';
    reply = t('family_title');
  } else if (/setting|ترتیب|theme|تھیم|language|زبان/.test(q)) {
    open = 'settings';
    reply = t('set_title');
  } else if (/morning|evening|night|took|taken|did i take|صبح|شام|رات|لی/.test(q)) {
    const period = /evening|شام/.test(q) ? 'evening' : /night|رات/.test(q) ? 'night' : 'morning';
    const rows = todayDoses().filter(d => periodOf(d.time) === period);
    if (!rows.length) reply = t('no_doses_today');
    else {
      const sts = rows.map(d => doseStatus(d.med, d.time));
      const state = sts.every(s => s === 'confirmed') ? 'st_confirmed'
        : sts.some(s => s === 'not_confirmed') ? 'st_not_confirmed'
          : sts.some(s => s === 'snoozed') ? 'st_snoozed' : 'st_upcoming';
      reply = t('period_' + period) + ': ' + t(state) + ' — ' + rows.map(d => d.med.name).join(', ');
    }
  } else if (/medicine|دوا|today|آج|schedule|شیڈول|list|dose|خوراک/.test(q)) {
    const doses = todayDoses();
    const done = doses.filter(d => doseStatus(d.med, d.time) === 'confirmed').length;
    const names = doses.map(d => d.med.name).filter((v, i, a) => a.indexOf(v) === i);
    reply = t('doses_of', { done, total: doses.length }) + (names.length ? ' — ' + names.join(', ') : '');
    if (/open|show|دکھا|کھول|جائیں/.test(q)) open = 'medicines';
  } else {
    reply = t('asr_fallback');
  }

  if (open) showView(open);
  $('assistantReply').textContent = reply;
  speak(reply, true);
}

/* ------------------------------ images --------------------------------- */
function placeholderImg(name) {
  const svg = "<svg xmlns='http://www.w3.org/2000/svg' width='320' height='320'><rect width='320' height='320' rx='32' fill='#eef2f6'/><rect x='80' y='135' width='160' height='60' rx='30' fill='#c3cfda'/><rect x='80' y='135' width='80' height='60' rx='30' fill='#ffffff' stroke='#c3cfda' stroke-width='4'/><text x='160' y='250' font-family='Arial' font-size='24' text-anchor='middle' fill='#6b7c8c'>" + esc(String(name || 'No photo').slice(0, 14)) + "</text></svg>";
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}
function pillImg(name, color) {
  const svg = "<svg xmlns='http://www.w3.org/2000/svg' width='320' height='320'><rect width='320' height='320' rx='32' fill='#f0f7fb'/><g transform='rotate(-20 160 150)'><rect x='70' y='118' width='180' height='66' rx='33' fill='" + color + "'/><rect x='70' y='118' width='90' height='66' rx='33' fill='#ffffff' stroke='" + color + "' stroke-width='5'/></g><text x='160' y='280' font-family='Arial' font-size='24' font-weight='bold' text-anchor='middle' fill='#14232f'>" + esc(name) + "</text></svg>";
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}
function fileToDataUrl(file, max) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => shrinkImage(String(reader.result), max).then(resolve).catch(() => resolve(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
function shrinkImage(dataUrl, max) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, (max || 320) / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.max(1, Math.round(img.width * scale));
      c.height = Math.max(1, Math.round(img.height * scale));
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      resolve(c.toDataURL('image/png'));
    };
    img.onerror = reject;
    img.src = dataUrl;
  });
}

/* ------------------------------ OCR (lazy Tesseract) ------------------- */
let tesseractPromise = null;
function ensureTesseract() {
  if (window.Tesseract) return Promise.resolve(window.Tesseract);
  if (tesseractPromise) return tesseractPromise;
  tesseractPromise = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
    s.onload = () => resolve(window.Tesseract);
    s.onerror = () => { tesseractPromise = null; reject(new Error('tesseract load failed')); };
    document.head.appendChild(s);
  });
  return tesseractPromise;
}
async function runOCR(dataUrl) {
  const prev = $('scanPreview');
  if (dataUrl) { prev.src = dataUrl; prev.alt = t('scan_title'); prev.hidden = false; }
  $('ocrStatus').textContent = t('ocr_loading');
  $('reviewCard').hidden = true;
  try {
    const T = await ensureTesseract();
    const worker = await T.createWorker('eng', 1, { logger: m => { if (m.status === 'recognizing text') $('ocrStatus').textContent = t('ocr_loading') + ' ' + Math.round((m.progress || 0) * 100) + '%'; } });
    const res = await worker.recognize(dataUrl);
    await worker.terminate();
    const candidates = parsePrescriptionText(res.data.text || '');
    if (!candidates.length) {
      $('ocrStatus').textContent = t('ocr_fail');
      return;
    }
    $('ocrStatus').textContent = t('ocr_done');
    renderReview(candidates);
  } catch (e) {
    console.warn('OCR failed', e);
    $('ocrStatus').textContent = t('ocr_fail');
  }
}
function parsePrescriptionText(text) {
  const candidates = [];
  const lines = String(text).split(/\n+/).map(l => l.trim()).filter(l => l.length > 2 && l.length < 90);
  lines.forEach(line => {
    const doseMatch = line.match(/\d+\s?(?:mg|mcg|ml|iu|g)\b/i);
    const looksLikeMed = /[a-z]{3,}/i.test(line) && !/^(date|name|dr|doctor|sig|rx|take\s*$)/i.test(line);
    if (!looksLikeMed) return;
    const times = [];
    if (/morning|breakfast|صبح/i.test(line)) times.push('08:00');
    if (/noon|lunch|دوپہر/i.test(line)) times.push('13:00');
    if (/evening|dinner|شام/i.test(line)) times.push('19:00');
    if (/night|bed|رات/i.test(line)) times.push('21:00');
    if (!times.length) times.push('08:00');
    let name = line.replace(/\d+\s?(?:mg|mcg|ml|iu|g)\b.*$/i, '').replace(/[-–—]$/, '').trim();
    if (!name) name = line.slice(0, 40);
    candidates.push({
      name: name.slice(0, 60),
      dose: doseMatch ? line.slice(line.indexOf(doseMatch[0])).slice(0, 80) : '',
      times
    });
  });
  return candidates.slice(0, 8);
}
let reviewCandidates = [];
function renderReview(candidates) {
  reviewCandidates = candidates;
  const box = $('reviewList');
  box.textContent = '';
  candidates.forEach((c, i) => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML =
      '<label><span>' + esc(t('review_name')) + '</span><input data-r="name" data-i="' + i + '"></label>' +
      '<label><span>' + esc(t('review_dose')) + '</span><input data-r="dose" data-i="' + i + '"></label>' +
      '<label><span>' + esc(t('review_times')) + '</span><input data-r="times" data-i="' + i + '"></label>' +
      '<button class="btn btn-danger" data-remove="' + i + '">🗑 ' + esc(t('btn_remove')) + '</button>';
    card.querySelector('[data-r="name"]').value = c.name;
    card.querySelector('[data-r="dose"]').value = c.dose;
    card.querySelector('[data-r="times"]').value = c.times.map(fmtTime).join(', ');
    box.appendChild(card);
  });
  $('reviewCard').hidden = false;
}
function confirmReview() {
  const box = $('reviewList');
  const cards = Array.from(box.children);
  let added = 0;
  cards.forEach((card, i) => {
    const name = card.querySelector('[data-r="name"]').value.trim();
    if (!name || card.dataset.removed) return;
    const dose = card.querySelector('[data-r="dose"]').value.trim();
    const timesRaw = card.querySelector('[data-r="times"]').value;
    const times = parseTimesText(timesRaw, reviewCandidates[i] ? reviewCandidates[i].times : ['08:00']);
    const ts = Date.now();
    medicines.push({ id: uid(), name, dose, times, frequency: times.length > 1 ? 'custom' : '1', days: [], image: null, demo: false, createdAt: ts, updatedAt: ts });
    added++;
  });
  save.medicines();
  $('reviewCard').hidden = true;
  $('scanPreview').hidden = true;
  $('ocrStatus').textContent = '';
  toast(t('review_saved'));
  renderAll();
  if (added) showView('medicines');
}
function parseTimesText(raw, fallback) {
  const out = [];
  raw.split(/[,;]/).forEach(part => {
    const m = part.trim().match(/(\d{1,2}):(\d{2})/);
    if (m) {
      let h = Number(m[1]);
      if (/pm/i.test(part) && h < 12) h += 12;
      if (/am/i.test(part) && h === 12) h = 0;
      out.push(String(h).padStart(2, '0') + ':' + m[2]);
    }
  });
  return out.length ? out : fallback;
}

/* sample prescription (rasterized SVG so OCR can read it) */
function samplePrescriptionDataUrl() {
  const svg = "<svg xmlns='http://www.w3.org/2000/svg' width='700' height='400'><rect width='700' height='400' fill='#ffffff'/><text x='40' y='70' font-family='Arial' font-size='30' fill='#111'>City Clinic - Prescription</text><text x='40' y='140' font-family='Arial' font-size='26' fill='#111'>1. Paracetamol 500 mg - morning and night</text><text x='40' y='200' font-family='Arial' font-size='26' fill='#111'>2. Vitamin D 1000 iu - morning</text><text x='40' y='260' font-family='Arial' font-size='26' fill='#111'>3. Cough Syrup 10 ml - night</text><text x='40' y='330' font-family='Arial' font-size='22' fill='#444'>Take after food. Doctor signature.</text></svg>";
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = 700; c.height = 400;
      c.getContext('2d').drawImage(img, 0, 0);
      resolve(c.toDataURL('image/png'));
    };
    img.onerror = () => resolve(null);
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  });
}

/* ------------------------------ camera --------------------------------- */
let cameraStream = null;
async function openCamera() {
  $('camErr').hidden = true;
  try {
    cameraStream = await navigator.mediaDevices.getUserMedia({ video: true });
    $('cameraVideo').srcObject = cameraStream;
    $('cameraDialog').showModal();
  } catch (e) {
    $('camErr').hidden = false;
    $('cameraDialog').showModal();
  }
}
function closeCamera() {
  if (cameraStream) cameraStream.getTracks().forEach(tr => tr.stop());
  cameraStream = null;
  try { if ($('cameraDialog').open) $('cameraDialog').close(); } catch (e) { /* ignore */ }
}
function captureFrame() {
  const v = $('cameraVideo'), c = $('cameraCanvas');
  if (!v.videoWidth) { $('camErr').hidden = false; return; }
  c.width = v.videoWidth; c.height = v.videoHeight;
  c.getContext('2d').drawImage(v, 0, 0);
  const dataUrl = c.toDataURL('image/png');
  closeCamera();
  runOCR(dataUrl);
}

/* ------------------------------ medicines CRUD ------------------------- */
let editingMedId = null;
function freqLabel(med) {
  const map = { '1': 'freq_1', '2': 'freq_2', '3': 'freq_3', 'x': 'freq_x', 'days': 'freq_days', 'custom': 'freq_custom' };
  return t(map[med.frequency] || 'freq_custom');
}
function renderMedCards() {
  const box = $('medCards');
  box.textContent = '';
  $('noMeds').hidden = medicines.length > 0;
  $('demoBannerMed').hidden = !medicines.some(m => m.demo);
  medicines.forEach(med => {
    const card = document.createElement('div');
    card.className = 'card med-card';
    const img = document.createElement('img');
    img.src = med.image || placeholderImg(med.name);
    img.alt = med.name;
    const h = document.createElement('h3');
    h.textContent = med.name;
    card.append(img, h);
    if (med.demo) {
      const b = document.createElement('span');
      b.className = 'chip warn'; b.textContent = t('demo_banner');
      card.appendChild(b);
    }
    const doses = (med.times || []);
    const done = doses.filter(tm => doseStatus(med, tm) === 'confirmed').length;
    const meta = [
      [t('card_dose'), med.dose || '—'],
      [t('card_time'), doses.map(fmtTime).join(', ') || '—'],
      [t('card_freq'), freqLabel(med)],
      [t('card_today'), t('confirmed_today', { done, total: doses.length })]
    ];
    meta.forEach(([k, v]) => {
      const p = document.createElement('p');
      p.className = 'med-meta';
      const s = document.createElement('strong'); s.textContent = k + ': ';
      p.appendChild(s); p.appendChild(document.createTextNode(v));
      card.appendChild(p);
    });
    const nd = nextReminderFor(med);
    if (nd) {
      const p = document.createElement('p');
      p.className = 'med-meta hint';
      p.textContent = '• ' + t('card_next') + ': ' + fmtTime(nd);
      card.appendChild(p);
    }
    const actions = document.createElement('div');
    actions.className = 'med-actions';
    const bListen = document.createElement('button');
    bListen.className = 'btn btn-secondary'; bListen.textContent = '🔊 ' + t('listen');
    bListen.onclick = () => speak(med.name + '. ' + (med.dose || '') + '. ' + doses.map(fmtTime).join(', '), true);
    const bEdit = document.createElement('button');
    bEdit.className = 'btn btn-ghost'; bEdit.textContent = '✏️ ' + t('btn_edit');
    bEdit.onclick = () => startEdit(med);
    const bHist = document.createElement('button');
    bHist.className = 'btn btn-ghost'; bHist.textContent = '📊 ' + t('btn_history');
    bHist.onclick = () => { histMedFilter = med.id; showView('history'); };
    actions.append(bListen, bEdit, bHist);
    card.appendChild(actions);

    const moreWrap = document.createElement('div');
    moreWrap.className = 'more-wrap';
    const bMore = document.createElement('button');
    bMore.className = 'chip-btn'; bMore.textContent = '⋯ ' + t('btn_more');
    bMore.setAttribute('aria-haspopup', 'true');
    const menu = document.createElement('div');
    menu.className = 'more-menu'; menu.hidden = true;
    const mAbout = document.createElement('button');
    mAbout.textContent = 'ℹ️ ' + t('btn_about');
    mAbout.onclick = () => { menu.hidden = true; openAbout(med); };
    const mDel = document.createElement('button');
    mDel.className = 'danger-item'; mDel.textContent = '🗑 ' + t('btn_delete');
    mDel.onclick = () => {
      menu.hidden = true;
      if (confirm(t('delete_confirm'))) {
        medicines = medicines.filter(m => m.id !== med.id);
        save.medicines(); toast(t('med_deleted')); renderAll();
      }
    };
    menu.append(mAbout, mDel);
    bMore.onclick = e => { e.stopPropagation(); menu.hidden = !menu.hidden; };
    moreWrap.append(bMore, menu);
    card.appendChild(moreWrap);
    box.appendChild(card);
  });
}
function nextReminderFor(med) {
  const now = nowHM();
  const sorted = (med.times || []).slice().sort();
  return sorted.find(tm => tm >= now) || (med.snoozedUntil ? nowHM() : null);
}
function openAbout(med) {
  const body = $('aboutBody');
  body.textContent = '';
  const add = (key, value) => {
    const h = document.createElement('h3'); h.textContent = t(key);
    const p = document.createElement('p'); p.textContent = value;
    body.append(h, p);
  };
  if (med.demo && med.demoInfo) {
    const note = document.createElement('span');
    note.className = 'about-demo'; note.textContent = t('about_demo_note');
    body.appendChild(note);
    add('about_name', med.name);
    add('about_instructions', med.dose || '—');
    add('about_side', (med.demoInfo.sideEffects || []).join(', ') || '—');
    add('about_warn', med.demoInfo.warnings || '—');
    add('about_contact', med.demoInfo.contactIf || '—');
  } else {
    add('about_name', med.name);
    add('about_instructions', med.dose || '—');
    const p = document.createElement('p');
    p.className = 'hint'; p.textContent = t('about_no_info');
    body.appendChild(p);
  }
  $('aboutDialog').showModal();
}

/* ------------------------------ medicine form -------------------------- */
function addTimeRow(value) {
  const row = document.createElement('div');
  row.className = 'time-row';
  const input = document.createElement('input');
  input.type = 'time'; input.className = 'time-input';
  if (value) input.value = value;
  const rm = document.createElement('button');
  rm.type = 'button'; rm.className = 'time-remove'; rm.textContent = '✕';
  rm.onclick = () => { if ($('timeRows').children.length > 1) row.remove(); };
  row.append(input, rm);
  $('timeRows').appendChild(row);
}
function buildDayRow() {
  const box = $('dayRow');
  box.textContent = '';
  for (let i = 0; i < 7; i++) {
    const lab = document.createElement('label');
    const cb = document.createElement('input');
    cb.type = 'checkbox'; cb.value = i; cb.className = 'day-cb';
    lab.append(cb, document.createTextNode(' ' + t('day_' + i)));
    box.appendChild(lab);
  }
}
function onFreqChange() {
  const f = $('medFreq').value;
  $('hoursWrap').hidden = f !== 'x';
  $('daysWrap').hidden = f !== 'days';
}
function resetMedForm() {
  editingMedId = null;
  pendingImageData = null;
  $('medForm').reset();
  $('timeRows').textContent = '';
  addTimeRow('08:00');
  $('medFreq').value = '1';
  $('medHours').value = 8;
  document.querySelectorAll('.day-cb').forEach(cb => { cb.checked = false; });
  onFreqChange();
  $('medImagePreview').hidden = true;
  $('btnCancelEdit').hidden = true;
  $('manualTitle').textContent = t('add_medicine');
}
function startEdit(med) {
  showView('setup');
  editingMedId = med.id;
  pendingImageData = null;
  $('medName').value = med.name;
  $('medDose').value = med.dose || '';
  $('timeRows').textContent = '';
  (med.times || ['08:00']).forEach(tm => addTimeRow(tm));
  $('medFreq').value = med.frequency || '1';
  $('medHours').value = med.hours || 8;
  onFreqChange();
  document.querySelectorAll('.day-cb').forEach(cb => { cb.checked = (med.days || []).includes(Number(cb.value)); });
  $('medNote').value = med.customNote || '';
  if (med.image) { $('medImagePreview').src = med.image; $('medImagePreview').hidden = false; }
  else { $('medImagePreview').removeAttribute('src'); $('medImagePreview').hidden = true; }
  $('btnCancelEdit').hidden = false;
  $('manualTitle').textContent = t('btn_edit') + ': ' + med.name;
  $('medForm').scrollIntoView({ behavior: 'smooth' });
}
let pendingImageData = null;
async function saveMedForm(e) {
  e.preventDefault();
  const name = $('medName').value.trim();
  if (!name) { toast(t('err_name')); return; }
  const times = Array.from($('timeRows').querySelectorAll('.time-input')).map(i => i.value).filter(Boolean);
  if (!times.length) { toast(t('err_time')); return; }
  const dup = medicines.find(m => m.name.toLowerCase() === name.toLowerCase() && m.id !== editingMedId);
  if (dup) { toast(t('med_duplicate')); return; }
  const freq = $('medFreq').value;
  let finalTimes = times.slice().sort();
  let hours = null, days = [];
  if (freq === 'x') {
    hours = Math.max(1, Math.min(24, Number($('medHours').value) || 8));
    const start = finalTimes[0];
    const [sh, sm] = start.split(':').map(Number);
    finalTimes = [];
    for (let m = sh * 60 + sm; m < 24 * 60; m += hours * 60) {
      finalTimes.push(String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'));
    }
  }
  if (freq === 'days') {
    days = Array.from(document.querySelectorAll('.day-cb')).filter(c => c.checked).map(c => Number(c.value));
  }
  const base = {
    name,
    dose: $('medDose').value.trim(),
    times: finalTimes,
    frequency: freq, hours, days,
    customNote: $('medNote').value.trim(),
    image: pendingImageData || (editingMedId ? (medicines.find(m => m.id === editingMedId) || {}).image : null) || null
  };
  const ts = Date.now();
  if (editingMedId) {
    const med = medicines.find(m => m.id === editingMedId);
    if (med) {
      if (!med.createdAt) med.createdAt = ts;
      Object.assign(med, base, { updatedAt: ts });
    }
    toast(t('med_updated'));
  } else {
    medicines.push(Object.assign({ id: uid(), demo: false, createdAt: ts, updatedAt: ts }, base));
    toast(t('med_saved'));
  }
  save.medicines();
  resetMedForm();
  renderAll();
  showView('medicines');
}

/* ------------------------------ history & symptoms --------------------- */
let histRange = 'today';
let histMedFilter = null;
function inRange(dateStr) {
  if (histRange === 'all') return true;
  if (histRange === 'today') return dateStr === todayStr();
  const d = new Date(dateStr + 'T00:00:00');
  return (Date.now() - d.getTime()) < 7 * 86400000;
}
function renderHistory() {
  const ul = $('historyList');
  ul.textContent = '';
  const chip = $('histMedChip');
  if (histMedFilter) {
    const med = medicines.find(m => m.id === histMedFilter);
    chip.hidden = false;
    chip.textContent = t('filter_med', { x: med ? med.name : '?' }) + ' ✕';
    chip.onclick = () => { histMedFilter = null; renderHistory(); };
  } else chip.hidden = true;
  const rows = history.filter(h => inRange(h.date) && (!histMedFilter || h.medicineId === histMedFilter));
  $('noHistory').hidden = rows.length > 0;
  rows.slice(0, 80).forEach(h => {
    const li = document.createElement('li');
    const time = document.createElement('span');
    time.className = 'tl-time';
    time.textContent = h.date === todayStr() ? fmtTime(h.scheduledTime) : h.date.slice(5) + ' ' + fmtTime(h.scheduledTime);
    const name = document.createElement('span');
    name.className = 'tl-name';
    name.textContent = h.medicineName + (h.demo ? ' (DEMO)' : '') + (h.test ? ' (TEST)' : '');
    const sub = document.createElement('span');
    sub.className = 'tl-sub';
    sub.textContent = t('h_scheduled') + ' ' + fmtTime(h.scheduledTime) +
      (h.confirmedAt ? ' • ' + t('h_confirmed_at') + ' ' + fmtTime(h.confirmedAt) : '');
    name.appendChild(sub);
    const st = document.createElement('span');
    st.className = 'chip ' + ({ confirmed: 'ok', snoozed: 'warn', not_confirmed: 'danger' }[h.status] || 'info');
    st.textContent = ({ confirmed: '✅ ' + t('st_confirmed'), snoozed: '🔔 ' + t('st_snoozed'), not_confirmed: '⚠️ ' + t('st_not_confirmed') }[h.status] || h.status);
    li.append(time, name, st);
    ul.appendChild(li);
  });
  const sul = $('symptomList');
  sul.textContent = '';
  $('noSymptoms').hidden = symptoms.length > 0;
  symptoms.slice(0, 40).forEach(s => {
    const li = document.createElement('li');
    const time = document.createElement('span');
    time.className = 'tl-time';
    time.textContent = s.date.slice(5) + ' ' + fmtTime(s.time);
    const name = document.createElement('span');
    name.className = 'tl-name';
    name.textContent = s.medicineName + ' — ' + s.symptom;
    const sub = document.createElement('span');
    sub.className = 'tl-sub';
    sub.textContent = t('sym_sev') + ': ' + t('sev_' + s.severity) + (s.note ? ' • ' + s.note : '');
    name.appendChild(sub);
    const st = document.createElement('span');
    st.className = 'chip ' + (s.severity === 'severe' ? 'danger' : s.severity === 'moderate' ? 'warn' : 'info');
    st.textContent = t('sev_' + s.severity);
    li.append(time, name, st);
    sul.appendChild(li);
  });
}

/* ------------------------------ symptom check-in ----------------------- */
let checkinMed = null, checkinFeel = null, checkinSev = 'mild';
function openCheckin(med) {
  checkinMed = med; checkinFeel = null; checkinSev = 'mild';
  $('severityWrap').hidden = true;
  $('checkinResponse').hidden = true;
  $('symNote').value = '';
  document.querySelectorAll('[data-sev]').forEach(b => b.classList.toggle('active', b.dataset.sev === 'mild'));
  $('checkinDialog').showModal();
}
function feelLabel(key) {
  return t({ ok: 'feel_ok', nausea: 'feel_nausea', vomit: 'feel_vomit', dizzy: 'feel_dizzy', sleepy: 'feel_sleepy', urine: 'feel_urine', other: 'feel_other' }[key] || 'feel_other');
}
function saveSymptom() {
  if (!checkinMed || !checkinFeel) return;
  symptoms.unshift({
    id: uid(), medicineId: checkinMed.id, medicineName: checkinMed.name,
    date: todayStr(), time: nowHM(), symptom: feelLabel(checkinFeel),
    severity: checkinSev, note: $('symNote').value.trim()
  });
  save.symptoms();
  toast(t('symptom_saved'));
  const info = checkinMed.demoInfo;
  let msg = t('safety_1');
  if (info && (info.sideEffects || []).some(s => feelLabel(checkinFeel).toLowerCase().indexOf(s.split('/')[0].trim().toLowerCase()) >= 0 || s.toLowerCase().indexOf(checkinFeel) >= 0)) {
    msg += ' ' + t('safety_listed');
  }
  msg += ' ' + t('safety_2');
  if (checkinSev === 'severe') msg += ' ' + t('safety_severe');
  $('checkinResponseText').textContent = msg;
  $('checkinResponse').hidden = false;
  speak(msg, true);
  renderAll();
}

/* ------------------------------ family dashboard ----------------------- */
function periodOf(time) {
  const h = Number(time.slice(0, 2));
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  if (h < 21) return 'evening';
  return 'night';
}
function renderFamily() {
  $('notifyToggle').checked = !!settings.notifyCaregiver;
  $('escalationSelect').value = String(settings.escalationMinutes);
  const box = $('famStatusRows');
  box.textContent = '';
  ['morning', 'afternoon', 'evening', 'night'].forEach(p => {
    const doses = todayDoses().filter(d => periodOf(d.time) === p);
    let status = '—', cls = '';
    if (doses.length) {
      const sts = doses.map(d => doseStatus(d.med, d.time));
      if (sts.some(s => s === 'not_confirmed')) { status = '⚠️ ' + t('st_not_confirmed'); cls = 'danger'; }
      else if (sts.some(s => s === 'snoozed')) { status = '🟠 ' + t('st_snoozed'); cls = 'warn'; }
      else if (sts.every(s => s === 'confirmed')) { status = '✅ ' + t('st_confirmed'); cls = 'ok'; }
      else { status = '⏳ ' + t('st_upcoming'); cls = 'info'; }
    }
    const row = document.createElement('div');
    row.className = 'fam-row';
    const lab = document.createElement('span');
    lab.textContent = ({ morning: '🌅', afternoon: '☀️', evening: '🌆', night: '🌙' }[p]) + ' ' + t('period_' + p);
    const val = document.createElement('span');
    val.className = 'chip ' + cls; val.textContent = status;
    row.append(lab, val);
    box.appendChild(row);
  });
  const nd = nextDose();
  $('famNext').textContent = nd ? nd.med.name + ' — ' + fmtTime(nd.time) : '—';
  const last = history.find(h => h.status === 'confirmed' && h.date === todayStr());
  $('famLast').textContent = last ? last.medicineName + ' ' + fmtTime(last.confirmedAt) : t('fam_none');
  const miss = todayDoses().filter(d => doseStatus(d.med, d.time) === 'not_confirmed').length;
  $('famMiss').textContent = miss ? String(miss) : t('fam_none');
  const syms = symptoms.filter(s => s.date === todayStr());
  $('famSyms').textContent = syms.length ? syms.map(s => s.symptom).join(', ') : t('fam_none');

  const list = $('cgList');
  list.textContent = '';
  $('noCg').hidden = caregivers.length > 0;
  caregivers.forEach(cg => {
    const card = document.createElement('div');
    card.className = 'card cg-card';
    const h = document.createElement('h3');
    h.textContent = cg.name + (cg.relationship ? ' (' + cg.relationship + ')' : '');
    const p = document.createElement('p');
    p.className = 'med-meta'; p.textContent = cg.phone;
    const act = document.createElement('div');
    act.className = 'row-actions';
    const call = document.createElement('a');
    call.className = 'btn btn-primary btn-lg'; call.href = 'tel:' + digitsOnly(cg.phone);
    call.textContent = '📞 ' + t('call');
    act.appendChild(call);
    const num = digitsOnly(cg.whatsapp || cg.phone);
    if (num) {
      const wa = document.createElement('a');
      wa.className = 'btn btn-secondary btn-lg';
      wa.href = 'https://wa.me/' + num; wa.target = '_blank'; wa.rel = 'noopener';
      wa.textContent = '💬 ' + t('whatsapp');
      act.appendChild(wa);
    }
    const del = document.createElement('button');
    del.className = 'btn btn-danger btn-lg'; del.textContent = '🗑 ' + t('btn_delete');
    del.onclick = () => { caregivers = caregivers.filter(c => c.id !== cg.id); save.caregivers(); toast(t('cg_deleted')); renderAll(); };
    act.appendChild(del);
    card.append(h, p, act);
    list.appendChild(card);
  });
}

/* ------------------------------ emergency ------------------------------ */
function renderEmergency() {
  const num = digitsOnly(settings.emergencyNumber || '112') || '112';
  $('btnCallNow').href = 'tel:' + (emergencyContact ? digitsOnly(emergencyContact.phone) || num : num);
  $('btnEmMedical').href = 'tel:' + num;
  $('emgCall').href = 'tel:' + num;
  $('emNumber').value = settings.emergencyNumber || '112';
  $('emContactInfo').textContent = emergencyContact
    ? emergencyContact.name + (emergencyContact.relationship ? ' (' + emergencyContact.relationship + ')' : '') + ' — ' + emergencyContact.phone
    : t('no_contact');
  if (emergencyContact) {
    $('ecName').value = emergencyContact.name || '';
    $('ecRel').value = emergencyContact.relationship || '';
    $('ecPhone').value = emergencyContact.phone || '';
  }
}
function showEmergencyGuidance(kind) {
  const key = { chest: 'g_chest', stroke: 'g_stroke', breath: 'g_breath', faint: 'g_faint', allergy: 'g_allergy', vomit: 'g_vomit', other: 'g_other' }[kind] || 'g_other';
  let msg = t(key);
  if (kind === 'breath' || kind === 'faint' || kind === 'allergy') msg += ' ' + t('g_severe');
  $('emGuidanceText').textContent = msg;
  $('emGuidance').hidden = false;
  speak(msg, true);
  $('emGuidance').scrollIntoView({ behavior: 'smooth' });
}
function shareLocation() {
  if (!navigator.geolocation) { toast(t('loc_fail')); return; }
  navigator.geolocation.getCurrentPosition(pos => {
    const { latitude, longitude } = pos.coords;
    const txt = '📍 ' + latitude.toFixed(5) + ', ' + longitude.toFixed(5);
    $('locationResult').textContent = txt + ' — ' + t('loc_ok');
    $('locationResult').hidden = false;
    $('locMaps').href = 'https://www.google.com/maps?q=' + latitude + ',' + longitude;
    $('locMaps').hidden = false;
  }, () => { toast(t('loc_fail')); }, { timeout: 10000 });
}

/* ------------------------------ demo mode ------------------------------ */
function loadDemo() {
  const now = new Date(Date.now() + 2 * 60000);
  const soon = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
  medicines = [
    { id: 'demoA', name: 'Demo Medicine A', dose: '1 tablet (demo)', times: ['08:00', '20:00'], frequency: '2', days: [], image: pillImg('Demo Medicine A', '#2b7de9'), demo: true, demoInfo: { sideEffects: ['nausea', 'dizziness'], warnings: 'Demo warning: take with water. Not medical advice.', contactIf: 'If dizziness is severe or persistent, contact a healthcare professional.' } },
    { id: 'demoB', name: 'Demo Medicine B', dose: '500 mg after food (demo)', times: ['09:00'], frequency: '1', days: [], image: pillImg('Demo Medicine B', '#e98a2b'), demo: true, demoInfo: { sideEffects: ['nausea'], warnings: 'Demo warning only.', contactIf: 'If vomiting persists, contact a healthcare professional.' } },
    { id: 'demoC', name: 'Demo Medicine C', dose: '10 ml syrup (demo)', times: ['13:00'], frequency: '1', days: [], image: pillImg('Demo Medicine C', '#9333ea'), demo: true },
    { id: 'demoD', name: 'Demo Medicine D', dose: '1 capsule (demo)', times: ['07:00', '15:00', '23:00'], frequency: '3', days: [], image: pillImg('Demo Medicine D', '#16a34a'), demo: true },
    { id: 'demoE', name: 'Demo Medicine E', dose: '1 tablet (demo)', times: ['10:00'], frequency: 'days', days: [1, 3, 5], image: pillImg('Demo Medicine E', '#dc2626'), demo: true },
    { id: 'demoF', name: 'Demo Medicine F (rings soon)', dose: '1 tablet (demo)', times: [soon], frequency: '1', days: [], image: pillImg('Demo Medicine F', '#0F766E'), demo: true }
  ];
  caregivers = [{ id: 'demoCg', name: 'Sara Ahmed', relationship: 'Daughter', phone: '+92 300 1234567', whatsapp: '+92 300 1234567', email: '' }];
  emergencyContact = { name: 'Ahmed Khan', relationship: 'Son', phone: '+92 301 5550000' };
  const h = nowHM();
  history = [
    { id: uid(), medicineId: 'demoA', medicineName: 'Demo Medicine A', demo: true, date: todayStr(), scheduledTime: '08:00', confirmedAt: '08:05', status: 'confirmed', recordedAt: Date.now() },
    { id: uid(), medicineId: 'demoD', medicineName: 'Demo Medicine D', demo: true, date: todayStr(), scheduledTime: '07:00', confirmedAt: '07:10', status: 'confirmed', recordedAt: Date.now() },
    { id: uid(), medicineId: 'demoB', medicineName: 'Demo Medicine B', demo: true, date: todayStr(), scheduledTime: '09:00', status: 'snoozed', recordedAt: Date.now() }
  ].filter(x => x.scheduledTime < h || x.status !== 'confirmed' ? true : true);
  symptoms = [{ id: uid(), medicineId: 'demoA', medicineName: 'Demo Medicine A', date: todayStr(), time: '08:30', symptom: t('feel_dizzy'), severity: 'mild', note: 'demo' }];
  save.medicines(); save.caregivers(); save.contact(); save.history(); save.symptoms();
  toast(t('demo_loaded'));
  renderAll();
}
function runTestReminder() {
  const med = medicines.find(m => m.demo) || medicines[0] ||
    { id: 'test', name: 'Demo Medicine A (Test)', dose: '1 tablet (demo)', times: [nowHM()], image: pillImg('Demo Medicine A', '#2b7de9'), demo: true };
  startReminder(med, nowHM(), true);
}

/* ------------------------------ router / render ------------------------ */
const VIEWS = ['home', 'medicines', 'setup', 'history', 'family', 'emergency', 'settings'];
function showView(name) {
  VIEWS.forEach(v => { $('view-' + v).hidden = v !== name; });
  document.querySelectorAll('[data-view]').forEach(b => b.classList.toggle('active', b.dataset.view === name));
  window.scrollTo(0, 0);
  if (name === 'history') renderHistory();
  if (name === 'family') renderFamily();
  if (name === 'emergency') renderEmergency();
  if (name === 'medicines') renderMedCards();
  if (name === 'home') { renderGreeting(); updateNextMedCard(); renderProgress(); renderTimeline(); }
}
function renderAll() {
  renderGreeting();
  updateNextMedCard();
  renderProgress();
  renderTimeline();
  renderMedCards();
  renderHistory();
  renderFamily();
  renderEmergency();
  $('assistantReply').textContent = $('assistantReply').textContent || '';
}

/* ------------------------------ init / events -------------------------- */
function init() {
  applyPrefs();
  I18N.set(settings.lang);
  buildDayRow();
  addTimeRow('08:00');

  document.querySelectorAll('[data-view]').forEach(b =>
    b.addEventListener('click', () => showView(b.dataset.view)));
  $('btnHome').addEventListener('click', () => showView('home'));
  $('btnTopEmergency').addEventListener('click', () => showView('emergency'));
  $('btnLang').addEventListener('click', () => setLang(settings.lang === 'en' ? 'ur' : 'en'));
  $('btnTheme').addEventListener('click', () => setTheme(settings.theme === 'light' ? 'dark' : 'light'));
  $('langEn').addEventListener('click', () => setLang('en'));
  $('langUr').addEventListener('click', () => setLang('ur'));
  $('themeLight').addEventListener('click', () => setTheme('light'));
  $('themeDark').addEventListener('click', () => setTheme('dark'));

  $('tglLarge').addEventListener('change', e => { settings.largeText = e.target.checked; save.settings(); applyPrefs(); });
  $('tglContrast').addEventListener('change', e => { settings.highContrast = e.target.checked; save.settings(); applyPrefs(); });
  $('tglVoice').addEventListener('change', e => { settings.voiceGuidance = e.target.checked; save.settings(); });
  $('tglNotif').addEventListener('change', e => {
    if (!e.target.checked) { settings.notifications = false; save.settings(); return; }
    if (!('Notification' in window)) { e.target.checked = false; toast(t('notif_denied')); return; }
    if (Notification.permission === 'denied') {
      e.target.checked = false;
      settings.notifications = false; save.settings();
      toast(t('notif_denied'));
      return;
    }
    if (Notification.permission === 'granted') {
      settings.notifications = true; save.settings();
      toast(t('notif_on'));
      return;
    }
    Notification.requestPermission().then(p => {
      settings.notifications = p === 'granted';
      save.settings(); applyPrefs();
      toast(settings.notifications ? t('notif_on') : t('notif_denied'));
    }).catch(() => { e.target.checked = false; toast(t('notif_denied')); });
  });

  $('btnTestReminder').addEventListener('click', runTestReminder);
  $('btnStartDemo').addEventListener('click', loadDemo);
  $('btnListenSummary').addEventListener('click', listenSummary);
  $('btnNextListen').addEventListener('click', () => {
    const nd = nextDose();
    if (nd) speak(nd.med.name + '. ' + fmtTime(nd.time) + '. ' + (nd.med.dose || ''), true);
  });

  /* assistant */
  let micBusy = false, micHeard = false;
  $('btnMicAssistant').addEventListener('click', () => {
    if (micBusy) {
      stopRecognition();
      micBusy = false; micHeard = false;
      setMicState('ready');
      return;
    }
    micBusy = true; micHeard = false;
    stopSpeech();
    $('assistantReply').textContent = '';
    setMicState('listening');
    listenOnce(alts => {
      micHeard = true;
      setMicState('thinking');
      const text = alts[0] || '';
      $('assistantReply').textContent = '🗣 ' + text;
      setTimeout(() => assistantAnswer(text), 250);
    }, () => {
      micBusy = false;
      if (!micHeard) setMicState('ready');
    });
  });
  [['askNext', 'q_next'], ['askToday', 'q_today'], ['askMorning', 'q_morning'], ['askHistory', 'q_history']]
    .forEach(([id, key]) => {
      const b = $(id);
      if (b) b.addEventListener('click', () => { stopRecognition(); assistantAnswer(t(key)); });
    });

  /* OCR */
  $('btnUpload').addEventListener('click', () => $('fileInput').click());
  $('fileInput').addEventListener('change', e => {
    const f = e.target.files[0];
    if (f) fileToDataUrl(f, 1200).then(runOCR);
    e.target.value = '';
  });
  $('btnSample').addEventListener('click', () => samplePrescriptionDataUrl().then(url => url && runOCR(url)));
  $('btnCamera').addEventListener('click', openCamera);
  $('btnCapture').addEventListener('click', captureFrame);
  $('btnCamCancel').addEventListener('click', closeCamera);
  $('cameraDialog').addEventListener('close', () => { if (cameraStream) closeCamera(); });
  $('btnReviewConfirm').addEventListener('click', confirmReview);
  $('btnReviewAdd').addEventListener('click', () => { $('medForm').scrollIntoView({ behavior: 'smooth' }); });
  $('reviewList').addEventListener('input', e => {
    const i = Number(e.target.dataset.i);
    if (reviewCandidates[i]) reviewCandidates[i][e.target.dataset.r] = e.target.value;
  });
  $('reviewList').addEventListener('click', e => {
    const rm = e.target.closest('[data-remove]');
    if (rm) { rm.closest('.card').dataset.removed = '1'; rm.closest('.card').style.opacity = '.35'; }
  });

  /* medicine form */
  $('btnAddTime').addEventListener('click', () => addTimeRow('12:00'));
  $('medFreq').addEventListener('change', onFreqChange);
  $('medForm').addEventListener('submit', saveMedForm);
  $('btnCancelEdit').addEventListener('click', resetMedForm);
  $('btnAddMed').addEventListener('click', () => { resetMedForm(); showView('setup'); });
  $('medImage').addEventListener('change', e => {
    const f = e.target.files[0];
    if (f) fileToDataUrl(f, 320).then(d => { pendingImageData = d; $('medImagePreview').src = d; $('medImagePreview').hidden = false; });
  });

  /* history filters */
  [['flToday', 'today'], ['flWeek', 'week'], ['flAll', 'all']].forEach(([id, r]) => {
    $(id).addEventListener('click', () => {
      histRange = r;
      ['flToday', 'flWeek', 'flAll'].forEach(x => $(x).classList.toggle('active', x === id));
      renderHistory();
    });
  });
  $('btnClearHistory').addEventListener('click', () => {
    if (confirm(t('clear_history') + '?')) { history = []; save.history(); toast(t('history_cleared')); renderAll(); }
  });

  /* family */
  $('notifyToggle').addEventListener('change', e => { settings.notifyCaregiver = e.target.checked; save.settings(); });
  $('escalationSelect').addEventListener('change', e => { settings.escalationMinutes = Number(e.target.value); save.settings(); });
  $('cgForm').addEventListener('submit', e => {
    e.preventDefault();
    const name = $('cgName').value.trim(), phone = $('cgPhone').value.trim();
    if (!name || !phone) { toast(t('cg_invalid')); return; }
    caregivers.push({ id: uid(), name, relationship: $('cgRel').value.trim(), phone, whatsapp: $('cgWa').value.trim(), email: $('cgEmail').value.trim() });
    save.caregivers();
    e.target.reset();
    toast(t('cg_saved'));
    renderAll();
  });

  /* emergency */
  $('btnEditContact').addEventListener('click', () => { $('emContactForm').hidden = !$('emContactForm').hidden; });
  $('emContactForm').addEventListener('submit', e => {
    e.preventDefault();
    emergencyContact = { name: $('ecName').value.trim(), relationship: $('ecRel').value.trim(), phone: $('ecPhone').value.trim() };
    save.contact();
    $('emContactForm').hidden = true;
    toast(t('contact_saved'));
    renderEmergency();
  });
  $('emNumber').addEventListener('change', e => {
    settings.emergencyNumber = e.target.value.trim() || '112';
    save.settings();
    renderEmergency();
  });
  $('btnEmLocation').addEventListener('click', shareLocation);
  const cgCallFromEmergency = () => {
    if (!caregivers.length) { toast(t('no_cg')); showView('family'); return; }
    location.href = 'tel:' + digitsOnly(caregivers[0].phone);
  };
  $('btnEmCallCg').addEventListener('click', cgCallFromEmergency);
  $('emgCg').addEventListener('click', cgCallFromEmergency);
  document.querySelectorAll('[data-emg]').forEach(b =>
    b.addEventListener('click', () => showEmergencyGuidance(b.dataset.emg)));

  /* reminder modal */
  $('btnConfirmTaken').addEventListener('click', confirmTaken);
  $('btnRemindLater').addEventListener('click', () => { $('snoozePanel').hidden = !$('snoozePanel').hidden; });
  $('btnListenAgain').addEventListener('click', () => {
    if (activeReminder) speak(t('rem_speech') + ' ' + activeReminder.med.name + '. ' + (activeReminder.med.dose || ''), true);
  });
  document.querySelectorAll('.snooze-opt').forEach(b =>
    b.addEventListener('click', () => applySnooze(Number(b.dataset.min))));
  $('btnDismissReminder').addEventListener('click', dismissWithoutConfirming);
  $('reminderModal').addEventListener('cancel', e => { e.preventDefault(); dismissWithoutConfirming(); });
  let remMicBusy = false;
  $('btnMic').addEventListener('click', () => {
    if (!activeReminder) return;
    if (remMicBusy) {
      stopRecognition();
      remMicBusy = false;
      $('voiceStatus').textContent = t('ready');
      startAlarm();
      return;
    }
    remMicBusy = true;
    stopAlarm();
    stopSpeech();
    $('voiceStatus').textContent = t('listening');
    listenOnce(alts => {
      const all = alts.join(' | ');
      $('voiceStatus').textContent = t('voice_heard', { x: alts[0] || '' });
      if (matchVoice(all, VOICE_NO)) {
        $('snoozePanel').hidden = false;
        $('voiceStatus').textContent = t('voice_no_snooze');
        speak(t('voice_no_snooze'), true);
        return;
      }
      if (matchVoice(all, VOICE_YES)) { setTimeout(confirmTaken, 400); return; }
      $('voiceStatus').textContent = t('voice_not_understood');
      speak(t('voice_not_understood'), true);
      startAlarm();
    }, () => { remMicBusy = false; });
  });

  /* success + check-in */
  $('btnSuccessDone').addEventListener('click', () => {
    $('successModal').close();
    if (pendingCheckinMed) { const m = pendingCheckinMed; pendingCheckinMed = null; openCheckin(m); }
  });
  $('successModal').addEventListener('close', () => {
    if (pendingCheckinMed) { const m = pendingCheckinMed; pendingCheckinMed = null; openCheckin(m); }
  });
  document.querySelectorAll('.feel-btn').forEach(b =>
    b.addEventListener('click', () => {
      checkinFeel = b.dataset.feel;
      if (checkinFeel === 'ok') {
        toast('😊 ' + t('feel_ok'));
        $('checkinDialog').close();
        return;
      }
      $('severityWrap').hidden = false;
    }));
  document.querySelectorAll('[data-sev]').forEach(b =>
    b.addEventListener('click', () => {
      checkinSev = b.dataset.sev;
      document.querySelectorAll('[data-sev]').forEach(x => x.classList.toggle('active', x === b));
    }));
  $('btnSaveSymptom').addEventListener('click', saveSymptom);
  $('btnCheckinDone').addEventListener('click', () => $('checkinDialog').close());
  $('btnCheckinSkip').addEventListener('click', () => $('checkinDialog').close());

  /* escalation */
  $('btnEscContinue').addEventListener('click', () => {
    $('escalationModal').close();
    const nd = nextDose();
    if (nd) startReminder(nd.med, nd.time, false);
  });
  $('btnEscDismiss').addEventListener('click', () => $('escalationModal').close());

  /* about */
  $('btnAboutClose').addEventListener('click', () => $('aboutDialog').close());

  /* clear all */
  $('btnClearAll').addEventListener('click', () => {
    if (confirm(t('clear_all_confirm'))) {
      ['mrai.medicines', 'mrai.history', 'mrai.symptoms', 'mrai.caregivers', 'mrai.settings', 'mrai.emergencyContact'].forEach(Store.remove);
      toast(t('all_cleared'));
      setTimeout(() => location.reload(), 600);
    }
  });

  if ('speechSynthesis' in window) {
    window.speechSynthesis.getVoices();
    window.speechSynthesis.addEventListener('voiceschanged', () => window.speechSynthesis.getVoices());
  }

  renderAll();
  showView('home');
  setInterval(tick, 1000);
  tick();
}
document.addEventListener('DOMContentLoaded', init);
