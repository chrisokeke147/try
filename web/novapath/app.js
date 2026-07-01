// External file rather than an inline <script> block — the site's CSP
// (see infra/docker/nginx.conf) sets script-src 'self' with no
// 'unsafe-inline', which silently blocks inline script content the same
// way it blocks inline onclick="" attributes (see tryride.ng's app.js for
// the sibling bug this exact pattern caused there).
document.getElementById('year').textContent = new Date().getFullYear();

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
