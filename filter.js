// 点「全部 / 半程 / 10公里」只显隐本页已经生成的卡片。
(() => {
  const bar = document.querySelector('.filters');
  if (!bar) return;
  const cards = [...document.querySelectorAll('#race-grid .card')];
  const empty = document.querySelector('.filter-empty');
  const buttons = [...bar.querySelectorAll('[data-filter]')];

  const apply = (key) => {
    let shown = 0;
    for (const card of cards) {
      const show = key === 'all' || card.dataset.km === key;
      card.hidden = !show;
      if (show) shown += 1;
    }
    if (empty) empty.hidden = shown > 0;
    for (const button of buttons) {
      const on = button.dataset.filter === key;
      button.classList.toggle('on', on);
      button.setAttribute('aria-pressed', on ? 'true' : 'false');
    }
  };

  bar.addEventListener('click', (event) => {
    const button = event.target.closest('[data-filter]');
    if (!button || !bar.contains(button)) return;
    apply(button.dataset.filter);
  });
})();
