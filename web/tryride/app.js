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

const form = document.getElementById('waitlist-form');
const messageEl = document.getElementById('form-message');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const phone = document.getElementById('phone').value.trim();
  const submitBtn = form.querySelector('button[type="submit"]');

  messageEl.textContent = '';
  messageEl.className = 'form-message';
  submitBtn.disabled = true;
  submitBtn.textContent = 'Joining…';

  try {
    const res = await fetch(`${API_BASE_URL}/waitlist`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phoneNumber: phone, role: selectedRole }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(Array.isArray(data.message) ? data.message[0] : data.message || 'Something went wrong');
    }

    messageEl.textContent = "You're on the list — we'll text you when TRY launches near you.";
    messageEl.className = 'form-message success';
    form.reset();
    selectRole('rider');
  } catch (err) {
    messageEl.textContent = err.message || 'Could not join the waitlist — please try again.';
    messageEl.className = 'form-message error';
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Join the waitlist';
  }
});
