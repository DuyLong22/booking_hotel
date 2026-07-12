export const formatPrice = (priceVnd: number, currency: string) => {
  if (currency === 'VND') {
    return `${priceVnd.toLocaleString('vi-VN')} đ`;
  }
  const rates: Record<string, number> = {
    USD: 25000,
    EUR: 27000,
    JPY: 160,
    KRW: 18,
    SGD: 18500
  };
  const symbols: Record<string, string> = {
    USD: '$',
    EUR: '€',
    JPY: '¥',
    KRW: '₩',
    SGD: 'S$'
  };
  const rate = rates[currency] || 1;
  const symbol = symbols[currency] || currency;
  const converted = Math.round(priceVnd / rate);
  return `${symbol} ${converted.toLocaleString('en-US')}`;
};
