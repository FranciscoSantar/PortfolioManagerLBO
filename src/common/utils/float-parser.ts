export const roundToDecimals = (value: number, decimals: number = 2) => {
  return parseFloat(value.toFixed(decimals));
};
