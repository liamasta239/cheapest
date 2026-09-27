// Demo products used when there are no API keys yet (server) or no server at all (browser fallback).
// Deterministic per query so the same search always shows the same results.
(function (root) {
  function seededRandom(seedText) {
    let h = 2166136261;
    for (let i = 0; i < seedText.length; i++) {
      h ^= seedText.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return function () {
      h += 0x6d2b79f5;
      let t = h;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  const VARIANTS = ['Pro', 'Mini', 'Max', 'Lite', '2026 New', 'Original', 'Upgraded', 'Premium', 'Plus', 'Classic'];
  const STORES = ['Global Direct Store', 'Top Tech Official', 'Lucky Home Store', 'Best Choice Mall', 'Smart Life Shop', 'Factory Outlet'];
  const COLORS = ['#e8594a', '#3c7be0', '#2fa36b', '#d99a1e', '#8b5cf6', '#e0467c', '#1aa3b8'];

  function placeholderImage(label, color) {
    const svg =
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300">` +
      `<rect width="300" height="300" fill="${color}"/>` +
      `<text x="150" y="165" font-family="Arial" font-size="34" fill="#fff" text-anchor="middle">${label}</text></svg>`;
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }

  function generateDemoProducts(query, count) {
    const rand = seededRandom(query.toLowerCase());
    const n = count || 36;
    const basePrice = 15 + rand() * 120;
    const safeLabel = query.replace(/[<>&"']/g, '').slice(0, 14) || 'Demo';
    const products = [];

    for (let i = 0; i < n; i++) {
      const price = +(basePrice * (0.35 + rand() * 1.4)).toFixed(2);
      const discount = rand() < 0.7 ? Math.round(10 + rand() * 60) : 0;
      const originalPrice = discount ? +(price / (1 - discount / 100)).toFixed(2) : price;
      const r = rand();
      const shipping = r < 0.5 ? 0 : r < 0.85 ? +(3 + rand() * 25).toFixed(2) : null;
      const orders = rand() < 0.15 ? Math.floor(rand() * 9) : Math.floor(Math.pow(10, 1 + rand() * 3.8));
      const positiveRate = rand() < 0.1 ? null : +(85 + rand() * 15).toFixed(1);
      const variant = VARIANTS[Math.floor(rand() * VARIANTS.length)];
      const color = COLORS[i % COLORS.length];

      products.push({
        id: 'demo-' + i,
        title: `${query} ${variant} – Model ${i + 1}`,
        image: placeholderImage(safeLabel, color),
        price,
        originalPrice,
        currency: 'ILS',
        discount: discount || null,
        shipping,
        totalPrice: +(price + (shipping || 0)).toFixed(2),
        positiveRate,
        orders,
        storeName: STORES[Math.floor(rand() * STORES.length)],
        url: 'https://www.aliexpress.com/wholesale?SearchText=' + encodeURIComponent(query),
      });
    }
    return products;
  }

  if (typeof module !== 'undefined' && module.exports) module.exports = { generateDemoProducts };
  else root.DemoData = { generateDemoProducts };
})(this);
