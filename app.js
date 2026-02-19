// ===== EVENT TRACKING =====
const events = [];

function trackEvent(name, detail = '') {
  const ts = new Date().toLocaleTimeString('sv-SE');
  events.unshift({ time: ts, name, detail });

  const list = document.getElementById('eventList');
  const emptyItem = list.querySelector('.empty-log');
  if (emptyItem) emptyItem.remove();

  const li = document.createElement('li');
  li.innerHTML = `
    <span class="ev-time">${ts}</span>
    <span class="ev-name">${name}</span>
    <span class="ev-detail">${detail}</span>
  `;
  list.prepend(li);

  // Keep max 50 entries
  while (list.children.length > 50) list.removeChild(list.lastChild);

  // Persist to localStorage
  try {
    localStorage.setItem('vf_events', JSON.stringify(events.slice(0, 100)));
  } catch (e) {}
}

function clearEventLog() {
  events.length = 0;
  const list = document.getElementById('eventList');
  list.innerHTML = '<li class="empty-log">Inga händelser ännu — interagera med sidan!</li>';
  localStorage.removeItem('vf_events');
  trackEvent('log_cleared', 'Händelseloggen rensades');
}

// Track all [data-track] clicks
document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-track]');
  if (el) {
    const eventName = el.getAttribute('data-track');
    const label = el.innerText.trim().substring(0, 40);
    trackEvent('click', `[${eventName}] "${label}"`);
  }
});

// Track page visibility
document.addEventListener('visibilitychange', () => {
  trackEvent('visibility', document.hidden ? 'sida dold' : 'sida synlig');
});

// Track scroll depth
let maxScroll = 0;
const scrollMilestones = [25, 50, 75, 100];
const reached = new Set();
window.addEventListener('scroll', () => {
  const scrolled = Math.round(
    (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100
  );
  if (scrolled > maxScroll) maxScroll = scrolled;
  scrollMilestones.forEach(m => {
    if (scrolled >= m && !reached.has(m)) {
      reached.add(m);
      trackEvent('scroll_depth', `${m}% av sidan`);
    }
  });
});

// Track time on page
let startTime = Date.now();
setInterval(() => {
  const seconds = Math.round((Date.now() - startTime) / 1000);
  if (seconds === 30) trackEvent('time_on_page', '30 sekunder');
  if (seconds === 60) trackEvent('time_on_page', '1 minut');
  if (seconds === 120) trackEvent('time_on_page', '2 minuter');
}, 5000);

// Page load event
window.addEventListener('load', () => {
  trackEvent('page_view', `${document.title} — ${new Date().toLocaleDateString('sv-SE')}`);
});

// ===== SKI POPUP =====
setTimeout(() => {
  const overlay = document.getElementById('skiOverlay');
  if (overlay) {
    overlay.style.display = 'flex';
    trackEvent('ski_popup', 'LÄNGDSKIDOR-popup visades');
  }
}, 2500);

document.getElementById('skiClose').addEventListener('click', () => {
  const overlay = document.getElementById('skiOverlay');
  overlay.style.animation = 'overlayIn 0.2s ease reverse forwards';
  setTimeout(() => overlay.remove(), 200);
  trackEvent('ski_popup_closed', 'Användaren valde hemsida framför skidor');
});

// ===== QUIZ GATE =====
const questions = [
  {
    q: "Vad är syftet med en lead-magnet på en hemsida?",
    options: [
      "Att sakta ner sidan",
      "Att locka besökare att lämna sin e-post i utbyte mot något värdefullt",
      "Att blockera annonser",
      "Att spara lösenord"
    ],
    correct: 1
  },
  {
    q: "Vilket externt API används på den här hemsidan för att hämta live-data?",
    options: [
      "Spotify API",
      "Google Maps API",
      "Open-Meteo (väder-API)",
      "Twitter API"
    ],
    correct: 2
  },
  {
    q: "Vad heter Chrome-tillägget vi byggde under kursen?",
    options: [
      "TaxTracker Pro",
      "DeadlineAlert",
      "BizReminder: Tax & Law Alerts",
      "ChromeHelper"
    ],
    correct: 2
  },
  {
    q: "Vad mäter event tracking på den här sidan?",
    options: [
      "Servertemperaturen",
      "Användarinteraktioner — klick, scroll-djup, tid på sidan",
      "Antalet bilder på sidan",
      "DNS-svarstider"
    ],
    correct: 1
  }
];

let currentQ = 0;
let answered = false;
let autoAnswerTimeout = null;

function showQuestion() {
  if (autoAnswerTimeout) clearTimeout(autoAnswerTimeout);

  const q = questions[currentQ];
  document.getElementById('questionText').textContent = q.q;
  document.getElementById('quizCurrent').textContent = currentQ + 1;
  document.getElementById('quizTotal').textContent = questions.length;
  document.getElementById('quizProgressFill').style.width = ((currentQ / questions.length) * 100) + '%';
  document.getElementById('quizFeedback').textContent = '';
  document.getElementById('quizFeedback').className = 'quiz-feedback';

  const box = document.getElementById('optionsBox');
  box.innerHTML = '';
  q.options.forEach((opt, i) => {
    const btn = document.createElement('button');
    btn.className = 'opt-btn';
    btn.textContent = opt;
    btn.addEventListener('click', () => {
      if (autoAnswerTimeout) clearTimeout(autoAnswerTimeout);
      handleAnswer(i, btn);
    });
    box.appendChild(btn);
  });
  answered = false;

  // Auto-answer with animated cursor after delay
  const correctIdx = q.correct;
  autoAnswerTimeout = setTimeout(() => {
    if (!answered) {
      const btns = document.querySelectorAll('.opt-btn');
      if (btns[correctIdx]) {
        animateCursorTo(btns[correctIdx], () => handleAnswer(correctIdx, btns[correctIdx]));
      }
    }
  }, 1800);
}

function handleAnswer(idx, btn) {
  if (answered) return;
  answered = true;
  const q = questions[currentQ];
  const allBtns = document.querySelectorAll('.opt-btn');
  allBtns.forEach(b => b.disabled = true);

  const fb = document.getElementById('quizFeedback');
  if (idx === q.correct) {
    btn.classList.add('correct');
    fb.textContent = '✓ Rätt!';
    fb.className = 'quiz-feedback ok';
    trackEvent('quiz_correct', `Fråga ${currentQ + 1}`);
    setTimeout(() => {
      currentQ++;
      if (currentQ < questions.length) {
        showQuestion();
      } else {
        document.getElementById('quizProgressFill').style.width = '100%';
        setTimeout(startHouseAnimation, 400);
      }
    }, 800);
  } else {
    btn.classList.add('wrong');
    allBtns[q.correct].classList.add('correct');
    fb.textContent = '✗ Fel! Försök igen om en sekund...';
    fb.className = 'quiz-feedback err';
    trackEvent('quiz_wrong', `Fråga ${currentQ + 1}`);
    setTimeout(showQuestion, 1800);
  }
}

// ===== AUTO CURSOR =====
function initCursor() {
  const cursor = document.getElementById('autoCursor');
  const popup = document.querySelector('.quiz-popup');
  if (popup) {
    const rect = popup.getBoundingClientRect();
    cursor.style.left = (rect.left + 40) + 'px';
    cursor.style.top = (rect.top + 120) + 'px';
  }
}

function animateCursorTo(targetEl, callback) {
  const cursor = document.getElementById('autoCursor');
  const rect = targetEl.getBoundingClientRect();
  cursor.classList.add('visible');
  cursor.style.left = (rect.left + 16) + 'px';
  cursor.style.top = (rect.top + rect.height / 2 - 6) + 'px';
  setTimeout(() => {
    cursor.classList.add('clicking');
    setTimeout(() => {
      cursor.classList.remove('clicking');
      if (callback) callback();
    }, 220);
  }, 800);
}

function hideCursor() {
  document.getElementById('autoCursor').classList.remove('visible');
}

// ===== LEARNINGS DATA =====
const learningItems = [
  {
    icon: '🎯',
    title: 'Lead Magnets',
    desc: 'Att erbjuda något värdefullt (guide, checklista) i utbyte mot en e-postadress — grunden i en growth loop.'
  },
  {
    icon: '🌐',
    title: 'API Integration',
    desc: 'Hur man hämtar live-data från Open-Meteo och visar det dynamiskt på hemsidan utan en enda API-nyckel.'
  },
  {
    icon: '🔌',
    title: 'Chrome Extensions',
    desc: 'Att bygga BizReminder — ett tillägg med chrome.notifications och chrome.alarms för automatiska deadline-påminnelser.'
  },
  {
    icon: '📊',
    title: 'Event Tracking',
    desc: 'Hur man mäter klick, scroll-djup och tid på sidan för att förstå hur besökare faktiskt beter sig.'
  }
];

function showLearnings() {
  document.getElementById('houseScreen').classList.add('hidden');
  document.getElementById('welcomeScreen').classList.remove('hidden');
  hideCursor();
  trackEvent('quiz_completed', 'Alla frågor rätt — huset byggt!');

  const list = document.getElementById('learningsList');
  list.innerHTML = '';
  const enterBtn = document.getElementById('enterBtn');
  enterBtn.style.opacity = '0';
  enterBtn.style.pointerEvents = 'none';

  learningItems.forEach((item, i) => {
    const card = document.createElement('div');
    card.className = 'learning-card';
    card.innerHTML = `
      <span class="learning-icon">${item.icon}</span>
      <div>
        <div class="learning-title">${item.title}</div>
        <div class="learning-desc">${item.desc}</div>
      </div>
    `;
    list.appendChild(card);
    setTimeout(() => card.classList.add('show'), 250 + i * 600);
  });

  setTimeout(() => {
    enterBtn.style.transition = 'opacity 0.5s ease';
    enterBtn.style.opacity = '1';
    enterBtn.style.pointerEvents = 'auto';
  }, 250 + learningItems.length * 600 + 400);
}

// House building sequence
function startHouseAnimation() {
  document.getElementById('quizScreen').classList.add('hidden');
  document.getElementById('houseScreen').classList.remove('hidden');

  const steps = [
    { el: 'hGround',     label: 'Lägger grunden...',     progress: 14 },
    { el: 'hFoundation', label: 'Gjuter betong...',       progress: 28 },
    { el: 'hWall',       label: 'Bygger väggar...',       progress: 45 },
    { el: 'hRoof',       label: 'Lyfter taket...',        progress: 60 },
    { el: 'hChimney',    label: 'Murar skorstenen...',    progress: 72 },
    { el: 'hDoor',       label: 'Hänger dörren...',       progress: 82 },
    { el: 'hWinL',       label: 'Sätter in fönster...',   progress: 88 },
    { el: 'hWinR',       label: 'Sätter in fönster...',   progress: 93 },
    { el: 'hSmoke',      label: 'Tänder brasan... 🔥',    progress: 100 }
  ];

  let i = 0;
  function nextStep() {
    if (i >= steps.length) {
      setTimeout(showLearnings, 600);
      return;
    }
    const s = steps[i++];
    document.getElementById(s.el).classList.add('show');
    document.getElementById('houseProgressFill').style.width = s.progress + '%';
    document.getElementById('houseStatus').textContent = s.label;
    setTimeout(nextStep, 550);
  }
  setTimeout(nextStep, 300);
}

function showWelcome() {
  document.getElementById('houseScreen').classList.add('hidden');
  document.getElementById('welcomeScreen').classList.remove('hidden');
  trackEvent('quiz_completed', 'Alla frågor rätt — huset byggt!');
}

document.getElementById('enterBtn').addEventListener('click', () => {
  const overlay = document.getElementById('quizOverlay');
  overlay.style.animation = 'overlayIn 0.3s ease reverse forwards';
  setTimeout(() => overlay.remove(), 300);
  trackEvent('quiz_entered', 'Användaren kom in på hemsidan');
});

// Trigger quiz after ski popup closes
const origSkiClose = document.getElementById('skiClose');
origSkiClose.addEventListener('click', () => {
  setTimeout(() => {
    const quiz = document.getElementById('quizOverlay');
    quiz.classList.remove('hidden');
    initCursor();
    showQuestion();
  }, 400);
}, { once: true });

// ===== LEAD MAGNET FORM =====
document.getElementById('leadForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const email = document.getElementById('emailInput').value;
  trackEvent('lead_capture', email);

  // Store lead (in real app, POST to backend)
  const leads = JSON.parse(localStorage.getItem('vf_leads') || '[]');
  leads.push({ email, ts: new Date().toISOString() });
  localStorage.setItem('vf_leads', JSON.stringify(leads));

  document.getElementById('leadForm').classList.add('hidden');
  document.getElementById('leadSuccess').classList.remove('hidden');
});

// ===== CONTACT FORM =====
document.getElementById('contactForm').addEventListener('submit', (e) => {
  e.preventDefault();
  trackEvent('contact_form', 'Kontaktformulär skickat');
  document.getElementById('contactForm').classList.add('hidden');
  document.getElementById('contactSuccess').classList.remove('hidden');
});

// ===== API: OPEN-METEO WEATHER =====
async function fetchWeather() {
  try {
    // Stockholm coordinates
    const url = 'https://api.open-meteo.com/v1/forecast' +
      '?latitude=59.33&longitude=18.07' +
      '&current=temperature_2m,wind_speed_10m,relative_humidity_2m,visibility' +
      '&wind_speed_unit=ms' +
      '&timezone=Europe%2FStockholm';

    const res = await fetch(url);
    if (!res.ok) throw new Error('API svarade med fel');
    const data = await res.json();

    const c = data.current;
    document.getElementById('temp').textContent = c.temperature_2m + ' °C';
    document.getElementById('wind').textContent = c.wind_speed_10m + ' m/s';
    document.getElementById('humidity').textContent = c.relative_humidity_2m + ' %';
    document.getElementById('visibility').textContent =
      c.visibility >= 1000
        ? (c.visibility / 1000).toFixed(1) + ' km'
        : c.visibility + ' m';

    document.getElementById('weather-loading').classList.add('hidden');
    document.getElementById('weather-data').classList.remove('hidden');

    trackEvent('api_success', 'Open-Meteo väderdata hämtad');
  } catch (err) {
    document.getElementById('weather-loading').textContent =
      'Kunde inte hämta data: ' + err.message;
    trackEvent('api_error', err.message);
  }
}

fetchWeather();
