const settingsList = [
  { id: 'hide-sidebar', key: 'hideSidebar' },
  { id: 'block-grid', key: 'blockGrid' },
  { id: 'redirect-shorts', key: 'redirectShorts' }
];

async function init() {
  try {
    const data = await browser.storage.local.get(['hideSidebar', 'blockGrid', 'redirectShorts']);

    settingsList.forEach(setting => {
      const el = document.getElementById(setting.id);
      if (!el) {
        return;
      }

      el.checked = data[setting.key] !== false; // domyślnie true

      el.addEventListener('change', async () => {
        await browser.storage.local.set({ [setting.key]: el.checked });
      });
    });
  } catch (err) {
    // Basic error handling
  }
}

init();
