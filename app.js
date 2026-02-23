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

// ===== GA4 BUTTON TRACKING =====
function sendGA4Event(eventName, params) {
  if (typeof gtag === 'function') {
    gtag('event', eventName, params);
  }
}

function getSection(el) {
  const section = el.closest('section');
  if (section) return section.id || 'section';
  if (el.closest('nav')) return 'nav';
  if (el.closest('footer')) return 'footer';
  return 'other';
}

// Track ALL button + link clicks → GA4 + event log
document.addEventListener('click', (e) => {
  const el = e.target.closest('button, a[data-track], a.btn-download');
  if (!el) return;

  const trackId   = el.getAttribute('data-track') || el.id || 'unnamed';
  const btnText   = el.innerText.trim().substring(0, 100);
  const section   = getSection(el);
  const href      = el.getAttribute('href') || '';

  // Send to GA4
  sendGA4Event('button_click', {
    button_id:      trackId,
    button_text:    btnText,
    page_section:   section,
    link_url:       href,
    page_location:  window.location.href
  });

  // Also log to on-page event log
  if (el.hasAttribute('data-track')) {
    trackEvent('click', `[${trackId}] "${btnText}"`);
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
