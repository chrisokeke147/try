// Pre-launch lead capture — posts to the same backend that powers the apps
// (see backend/src/modules/waitlist). No build step on this site, so this
// stays plain vanilla JS.
const API_BASE_URL = 'https://api.tryride.ng';

document.getElementById('year').textContent = new Date().getFullYear();

let selectedRole = 'rider';

function selectRole(role) {
  selectedRole = role;
  document.getElementById('role-rider').classList.toggle('active', role === 'rider');
  document.getElementById('role-driver').classList.toggle('active', role === 'driver');
  document.getElementById('waitlist').scrollIntoView({ behavior: 'smooth' });
}

// Bound here via addEventListener rather than inline onclick="" attributes —
// the site's CSP (see infra/docker/nginx.conf) sets script-src 'self' with
// no 'unsafe-inline', which silently blocks inline event-handler attributes.
// Every "I want to ride/drive" and "Join as a ..." button carries a
// data-select-role attribute instead.
document.querySelectorAll('[data-select-role]').forEach((el) => {
  el.addEventListener('click', () => selectRole(el.dataset.selectRole));
});

const form = document.getElementById('waitlist-form');
const messageEl = document.getElementById('form-message');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const phone = document.getElementById('phone').value.trim();
  const city = document.getElementById('city').value;
  const submitBtn = form.querySelector('button[type="submit"]');

  messageEl.textContent = '';
  messageEl.className = 'form-message';
  submitBtn.disabled = true;
  submitBtn.textContent = 'Joining…';

  try {
    const res = await fetch(`${API_BASE_URL}/waitlist`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phoneNumber: phone, role: selectedRole, city }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(Array.isArray(data.message) ? data.message[0] : data.message || 'Something went wrong');
    }

    messageEl.textContent = "You're on the list — we'll text you when TRY launches near you.";
    messageEl.className = 'form-message success';
    form.reset();
    selectRole('rider');
    loadWaitlistCount(); // reflect the just-added signup immediately
  } catch (err) {
    messageEl.textContent = err.message || 'Could not join the waitlist — please try again.';
    messageEl.className = 'form-message error';
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Join the waitlist';
  }
});

// Scroll-reveal: elements with .reveal fade/slide into place once they enter
// the viewport, instead of all being visible (and static) on page load.
const revealObserver = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        revealObserver.unobserve(entry.target);
      }
    }
  },
  { threshold: 0.15 },
);
document.querySelectorAll('.reveal').forEach((el) => revealObserver.observe(el));

// FAQ accordion — one open at a time.
document.querySelectorAll('.faq-question').forEach((button) => {
  button.addEventListener('click', () => {
    const item = button.closest('.faq-item');
    const wasOpen = item.classList.contains('open');
    document.querySelectorAll('.faq-item.open').forEach((open) => open.classList.remove('open'));
    if (!wasOpen) item.classList.add('open');
  });
});

// Social proof: "N people already joined" above the waitlist form, counted
// up from 0 the first time it scrolls into view rather than just appearing.
const countEl = document.getElementById('waitlist-count');

function animateCount(target) {
  const duration = 900;
  const start = performance.now();
  function tick(now) {
    const progress = Math.min((now - start) / duration, 1);
    const value = Math.round(target * (1 - Math.pow(1 - progress, 3)));
    countEl.textContent = `${value.toLocaleString()} people already joined the waitlist`;
    if (progress < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

async function loadWaitlistCount() {
  try {
    const res = await fetch(`${API_BASE_URL}/waitlist/count`);
    if (!res.ok) return;
    const { total } = await res.json();
    if (total > 0) animateCount(total);
  } catch {
    // Silently skip the counter if the API is unreachable — it's a nice-to-have,
    // not something that should block or visibly break the page.
  }
}

const countObserver = new IntersectionObserver(
  (entries) => {
    if (entries[0].isIntersecting) {
      loadWaitlistCount();
      countObserver.disconnect();
    }
  },
  { threshold: 0.5 },
);
if (countEl) countObserver.observe(countEl);
