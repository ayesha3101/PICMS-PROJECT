// ── Navbar scroll effect
window.addEventListener('scroll', () => {
    document.getElementById('nav').classList.toggle('scrolled', window.scrollY > 40);
  });
  
  // ── Counter animation
  function animateCount(el) {
    const target = +el.dataset.target;
    const dur = 2200;
    const fps = 60;
    const increment = target / (dur / (1000 / fps));
    let cur = 0;
    const tick = () => {
      cur += increment;
      if (cur >= target) { el.textContent = target.toLocaleString(); return; }
      el.textContent = Math.floor(cur).toLocaleString();
      requestAnimationFrame(tick);
    };
    tick();
  }
  
  // ── Scroll reveal observer
  const revealObs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        revealObs.unobserve(e.target);
      }
    });
  }, { threshold: 0.12 });
  
  document.querySelectorAll('.reveal').forEach(el => revealObs.observe(el));
  
  // ── Counter observer
  const countObs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        animateCount(e.target);
        countObs.unobserve(e.target);
      }
    });
  }, { threshold: 0.5 });
  
  document.querySelectorAll('.stat-num[data-target]').forEach(el => countObs.observe(el));