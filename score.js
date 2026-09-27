// "Best value" score (0–100), relative to the other products in the same search.
//   50% total price  – cheapest total gets full marks
//   25% positive feedback rate
//   25% orders, on a log scale so 10k vs 20k orders matters less than 10 vs 1,000
// Products with almost no orders or no rating get a small penalty so an unproven
// ultra-cheap listing doesn't top the list.
(function (root) {
  const UNKNOWN_RATING = 0.7;

  function scoreProducts(products) {
    if (!products.length) return products;
    const minTotal = Math.min(...products.map((p) => p.totalPrice));
    const maxLogOrders = Math.max(1, ...products.map((p) => Math.log1p(p.orders || 0)));

    return products.map((p) => {
      const priceScore = p.totalPrice > 0 ? minTotal / p.totalPrice : 1;
      const ratingScore = p.positiveRate != null ? p.positiveRate / 100 : UNKNOWN_RATING;
      const ordersScore = Math.log1p(p.orders || 0) / maxLogOrders;

      let penalty = 1;
      if ((p.orders || 0) < 10) penalty *= 0.85;
      if (p.positiveRate == null) penalty *= 0.9;

      const valueScore = Math.round(100 * penalty * (0.5 * priceScore + 0.25 * ratingScore + 0.25 * ordersScore));
      return { ...p, valueScore };
    });
  }

  if (typeof module !== 'undefined' && module.exports) module.exports = { scoreProducts };
  else root.Score = { scoreProducts };
})(this);
