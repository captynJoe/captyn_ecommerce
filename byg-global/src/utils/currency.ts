// Fixed exchange rate (you can replace this with live API integration later)
const USD_TO_KSH = 130.50;

export const convertToKsh = (usdAmount: number): number => {
  return usdAmount * USD_TO_KSH;
};

export const formatKshPrice = (amount: number): string => {
  return `Ksh ${Math.round(amount).toLocaleString()}`;
};
