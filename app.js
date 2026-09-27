(function () {
  const $ = (id) => document.getElementById(id);
  const form = $('search-form');
  const qInput = $('q');
  const statusEl = $('status');
  const resultsEl = $('results');
  const controlsEl = $('controls');
  const demoBanner = $('demo-banner');
  const tpl = $('card-tpl');
  const filters = {
    sort: $('sort'),
    minPrice: $('min-price'),
    maxPrice: $('max-price'),
    minOrders: $('min-orders'),
    minRating: $('min-rating'),
  };

  const BEST_COUNT = 3;
  let products = [];
  let bestIds = new Set();

  const fmtNum = new Intl.NumberFormat('he-IL');
  const moneyFormatters = {};
  function money(value, currency) {
    const cur = currency || 'ILS';
    if (!moneyFormatters[cur]) {
      moneyFormatters[cur] = new Intl.NumberFormat('he-IL', { style: 'currency', currency: cur });
    }
    return moneyFormatters[cur].format(value);
  }

  async function fetchProducts(query) {
    // Opened straight from disk (no server): nothing to call, go to demo data.
    if (location.protocol === 'file:') {
      return { demo: true, products: DemoData.generateDemoProducts(query) };
    }
    let res;
    try {
      res = await fetch('/api/search?q=' + encodeURIComponent(query));
    } catch (e) {
      return { demo: true, products: DemoData.generateDemoProducts(query) };
    }
    // Served by a plain static host without our API: fall back to demo data too.
    if (res.status === 404) {
      return { demo: true, products: DemoData.generateDemoProducts(query) };
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'שגיאה בחיפוש');
    return data;
  }

  async function search(query) {
    statusEl.textContent = 'מחפש…';
    statusEl.classList.add('loading');
    resultsEl.innerHTML = '';
    try {
      const data = await fetchProducts(query);
      demoBanner.hidden = !data.demo;
      products = Score.scoreProducts(data.products || []);
      bestIds = new Set(
        [...products].sort((a, b) => b.valueScore - a.valueScore).slice(0, BEST_COUNT).map((p) => p.id)
      );
      controlsEl.hidden = products.length === 0;
      render();
    } catch (err) {
      products = [];
      controlsEl.hidden = true;
      statusEl.textContent = err.message;
    } finally {
      statusEl.classList.remove('loading');
    }
  }

  function currentView() {
    const minPrice = parseFloat(filters.minPrice.value);
    const maxPrice = parseFloat(filters.maxPrice.value);
    const minOrders = Number(filters.minOrders.value);
    const minRating = Number(filters.minRating.value);

    const list = products.filter(
      (p) =>
        (isNaN(minPrice) || p.totalPrice >= minPrice) &&
        (isNaN(maxPrice) || p.totalPrice <= maxPrice) &&
        (p.orders || 0) >= minOrders &&
        (minRating === 0 || (p.positiveRate != null && p.positiveRate >= minRating))
    );

    const sorters = {
      price: (a, b) => a.totalPrice - b.totalPrice,
      value: (a, b) => b.valueScore - a.valueScore,
      orders: (a, b) => (b.orders || 0) - (a.orders || 0),
    };
    return list.sort(sorters[filters.sort.value] || sorters.price);
  }

  function render() {
    const list = currentView();
    resultsEl.innerHTML = '';
    if (!products.length) {
      statusEl.textContent = 'לא נמצאו מוצרים. נסו מילות חיפוש אחרות (באנגלית עובד הכי טוב).';
      return;
    }
    if (!list.length) {
      statusEl.textContent = 'אין מוצרים שמתאימים לסינון. נסו להרחיב אותו.';
      return;
    }
    const cheapest = Math.min(...list.map((p) => p.totalPrice));
    statusEl.textContent = `${fmtNum.format(list.length)} מוצרים · הזול ביותר: ${money(cheapest, list[0].currency)}`;

    const frag = document.createDocumentFragment();
    for (const p of list) frag.appendChild(renderCard(p));
    resultsEl.appendChild(frag);
  }

  function renderCard(p) {
    const node = tpl.content.firstElementChild.cloneNode(true);
    const q = (sel) => node.querySelector(sel);

    q('.img-wrap').href = p.url;
    q('.img-wrap img').src = p.image;
    q('.img-wrap img').alt = p.title;
    q('.badge.best').hidden = !bestIds.has(p.id);
    if (bestIds.has(p.id)) node.classList.add('is-best');
    if (p.discount) {
      q('.badge.disc').hidden = false;
      q('.badge.disc').textContent = `-${Math.round(p.discount)}%`;
    }

    q('.title').textContent = p.title;
    q('.title').title = p.title;
    q('.total').textContent = money(p.totalPrice, p.currency);
    if (p.originalPrice && p.originalPrice > p.price) {
      q('.orig').textContent = money(p.originalPrice, p.currency);
    }

    const ship = q('.shipping');
    if (p.shipping == null) {
      ship.textContent = 'משלוח: לבדוק באתר';
      ship.classList.add('unknown');
    } else if (p.shipping === 0) {
      ship.textContent = 'משלוח חינם';
      ship.classList.add('free');
    } else {
      ship.textContent = `כולל משלוח ${money(p.shipping, p.currency)} (מוצר ${money(p.price, p.currency)})`;
    }

    q('.rating').textContent = p.positiveRate != null ? `👍 ${p.positiveRate}%` : '👍 אין דירוג';
    q('.orders').textContent = `🛒 ${fmtNum.format(p.orders || 0)} נמכרו`;
    q('.score').textContent = `⭐ ${p.valueScore}/100`;
    q('.store').textContent = p.storeName || '';
    q('.buy').href = p.url;
    return node;
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const query = qInput.value.trim();
    if (!query) return;
    const url = new URL(location.href);
    url.searchParams.set('q', query);
    history.replaceState(null, '', url);
    search(query);
  });

  Object.values(filters).forEach((el) => el.addEventListener('input', render));

  // Support links like /?q=earbuds
  const initial = new URLSearchParams(location.search).get('q');
  if (initial) {
    qInput.value = initial;
    search(initial);
  }

  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
})();
