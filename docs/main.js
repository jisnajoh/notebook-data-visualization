// ── KPI counter animation ────────────────────────────────────────────────
function animateCounter(el, target, suffix = '') {
  let start = 0;
  const duration = 1800;
  const step = (timestamp) => {
    if (!start) start = timestamp;
    const progress = Math.min((timestamp - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.floor(eased * target) + suffix;
    if (progress < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.querySelectorAll('.num[data-target]').forEach((el) => {
        const target = parseInt(el.dataset.target);
        const suffix = el.dataset.suffix ?? '';
        animateCounter(el, target, suffix);
      });
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.3 });

document.addEventListener('DOMContentLoaded', () => {
  const kpis = document.getElementById('kpis');
  if (kpis) observer.observe(kpis);

  // ── Step explorer ───────────────────────────────────────────────────────
  document.querySelectorAll('.step-item').forEach((item) => {
    item.addEventListener('click', () => {
      const wasActive = item.classList.contains('active');
      document.querySelectorAll('.step-item').forEach((s) => s.classList.remove('active'));
      if (!wasActive) item.classList.add('active');
    });
  });

  // ── Nav section highlighting ─────────────────────────────────────────
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('nav ul a[href^="#"]');

  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        navLinks.forEach((link) => {
          link.classList.toggle('active', link.getAttribute('href') === '#' + entry.target.id);
        });
      }
    });
  }, { threshold: 0.4 });

  sections.forEach((s) => sectionObserver.observe(s));

  // ── Profile switcher for eval charts ─────────────────────────────────
  const profileBtns = document.querySelectorAll('.profile-btn');
  profileBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      profileBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      updateCharts(btn.dataset.profile);
    });
  });

  // ── Evaluation charts ─────────────────────────────────────────────────
  const CHART_DATA = {
    academic: {
      usability: [9, 8, 7, 8, 9, 6],
      performance: [85, 90, 78, 88, 82, 95],
    },
    sme: {
      usability: [7, 9, 8, 7, 8, 7],
      performance: [78, 85, 90, 80, 75, 88],
    },
    enterprise: {
      usability: [8, 7, 9, 9, 8, 8],
      performance: [90, 88, 85, 92, 89, 94],
    },
  };

  const PALETTE = ['#6366f1','#06b6d4','#10b981','#f59e0b','#ef4444','#8b5cf6'];
  const LABELS = ['Upload', 'Cleaning', 'Notebook', 'Charts', 'Analysis', 'Account'];

  let usabilityChart, performanceChart;

  function initCharts() {
    const usabilityCtx = document.getElementById('usabilityChart');
    const performanceCtx = document.getElementById('performanceChart');
    if (!usabilityCtx || !performanceCtx) return;

    usabilityChart = new Chart(usabilityCtx, {
      type: 'radar',
      data: {
        labels: LABELS,
        datasets: [{
          label: 'Usability Score',
          data: CHART_DATA.academic.usability,
          backgroundColor: PALETTE[0] + '33',
          borderColor: PALETTE[0],
          pointBackgroundColor: PALETTE[0],
        }],
      },
      options: {
        responsive: true,
        plugins: { legend: { labels: { color: '#94a3b8' } } },
        scales: {
          r: {
            ticks: { color: '#94a3b8', backdropColor: 'transparent' },
            grid: { color: 'rgba(255,255,255,0.08)' },
            pointLabels: { color: '#94a3b8' },
            min: 0, max: 10,
          },
        },
      },
    });

    performanceChart = new Chart(performanceCtx, {
      type: 'bar',
      data: {
        labels: LABELS,
        datasets: [{
          label: 'Performance %',
          data: CHART_DATA.academic.performance,
          backgroundColor: PALETTE.map((c) => c + 'aa'),
          borderColor: PALETTE,
          borderWidth: 1,
        }],
      },
      options: {
        responsive: true,
        plugins: { legend: { labels: { color: '#94a3b8' } } },
        scales: {
          x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
          y: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' }, min: 0, max: 100 },
        },
      },
    });
  }

  function updateCharts(profile) {
    const d = CHART_DATA[profile] ?? CHART_DATA.academic;
    if (usabilityChart) {
      usabilityChart.data.datasets[0].data = d.usability;
      usabilityChart.update();
    }
    if (performanceChart) {
      performanceChart.data.datasets[0].data = d.performance;
      performanceChart.update();
    }
  }

  // Load Chart.js then init
  if (!window.Chart) {
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.5.1/dist/chart.umd.min.js';
    s.onload = initCharts;
    document.head.appendChild(s);
  } else {
    initCharts();
  }
});
