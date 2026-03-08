console.log('%c[Shorts Blocker] %cContent script started', 'color: red; font-weight: bold;', 'color: inherit;');

let settings = {
  hideSidebar: true,
  blockGrid: true,
  redirectShorts: true
};

const SELECTORS = {
  sidebar: [
    'ytd-guide-entry-renderer:has(a[href*="/shorts"])',
    'ytd-mini-guide-entry-renderer:has(a[href*="/shorts"])',
    'ytd-guide-entry-renderer:has(tp-yt-paper-item > a[href*="/shorts"])',
    'a[path="shorts"]',
    'ytd-guide-entry-renderer:has(yt-icon[type="shorts"])',
    'ytd-mini-guide-entry-renderer:has(yt-icon[type="shorts"])'
  ],
  grid: [
    'ytd-rich-section-renderer:has(ytd-rich-shelf-renderer[is-shorts])',
    'ytd-reel-shelf-renderer',
    'yt-chip-cloud-chip-renderer:has(yt-formatted-string[title="Shorts"])',
    'ytd-grid-video-renderer:has(a[href*="/shorts/"])',
    '#shorts-container'
  ]
};

// CSS Injection
const styleElement = document.createElement('style');
styleElement.id = 'shorts-blocker-v3';
(document.head || document.documentElement).appendChild(styleElement);

function updateHidingRules() {
  let css = '';
  if (settings.hideSidebar) {
    css += SELECTORS.sidebar.map(s => `${s} { display: none !important; }`).join('\n');
  }
  if (settings.blockGrid) {
    css += SELECTORS.grid.map(s => `${s} { display: none !important; }`).join('\n');
  }
  styleElement.textContent = css;
}

// Hard JS cleanup for elements that :has() might miss or that are extremely persistent
function forceCleanup() {
  document.querySelectorAll('a[href*="/shorts"]').forEach(a => {
    const parent = a.closest('ytd-guide-entry-renderer, ytd-mini-guide-entry-renderer, tp-yt-paper-item');
    const target = parent || a;
    target.style.display = settings.hideSidebar ? 'none' : '';
  });

  document.querySelectorAll('ytd-reel-shelf-renderer, ytd-rich-shelf-renderer[is-shorts]').forEach(el => {
    const parent = el.closest('ytd-rich-section-renderer') || el;
    parent.style.display = settings.blockGrid ? 'none' : '';
  });
}

function checkRedirection() {
  if (!settings.redirectShorts) return;
  if (window.location.pathname.startsWith('/shorts/')) {
    const videoId = window.location.pathname.split('/shorts/')[1]?.split('?')[0];
    if (videoId) {
      window.location.replace(`https://www.youtube.com/watch?v=${videoId}`);
    } else {
      window.location.replace('https://www.youtube.com/');
    }
  }
}

// Storage Listener
browser.storage.onChanged.addListener((changes) => {
  for (const key in changes) {
    if (key in settings) {
      settings[key] = changes[key].newValue !== undefined ? changes[key].newValue : settings[key];
    }
  }
  updateHidingRules();
  forceCleanup();
});

// Initialization using Promise for better Firefox support
async function init() {
  try {
    const data = await browser.storage.local.get(['hideSidebar', 'blockGrid', 'redirectShorts']);

    settings = {
      hideSidebar: data.hideSidebar !== false,
      blockGrid: data.blockGrid !== false,
      redirectShorts: data.redirectShorts !== false
    };

    updateHidingRules();
    forceCleanup();
    checkRedirection();

    // Observer for SPA navigation and dynamic DOM
    const observer = new MutationObserver(() => {
      forceCleanup();
      checkRedirection();
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });

    window.addEventListener('yt-navigate-start', checkRedirection);
  } catch (err) {
    // Silently fail or use basic error handling
  }
}

init();
