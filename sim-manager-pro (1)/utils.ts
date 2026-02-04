
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
};

export const formatDate = (dateString: string): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('vi-VN').format(date);
};

export const generateId = (): string => {
  return Math.random().toString(36).substr(2, 9);
};

export const generateCode = (prefix: string): string => {
  const date = new Date();
  const yymmdd = date.toISOString().slice(2, 10).replace(/-/g, '');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${prefix}-${yymmdd}-${random}`;
};

// New Helper: Generate Customer ID
export const generateCID = (name: string, phone: string, email: string): string => {
  const prefix = 'KH';
  
  let mid = '';
  if (phone && phone.length >= 4) {
    mid = phone.slice(-4);
  } else if (email && email.length >= 3) {
    mid = email.slice(0, 3).toUpperCase();
  } else {
    mid = Math.floor(Math.random() * 1000).toString();
  }

  const nameParts = name.trim().split(' ');
  let suffix = '';
  if (nameParts.length >= 2) {
      suffix = (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase();
  } else if (name.length >= 2) {
      suffix = name.slice(0, 2).toUpperCase();
  } else {
      suffix = 'XX';
  }

  return `${prefix}-${mid}-${suffix}`;
};

// New Helper: Format number with commas for inputs
export const formatNumberWithCommas = (val: number | string): string => {
  if (val === undefined || val === null || val === '') return '';
  const num = val.toString().replace(/\D/g, "");
  return num.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

// New Helper: Parse comma-formatted string back to number
export const parseFormattedNumber = (val: string): number => {
  if (!val) return 0;
  return parseInt(val.replace(/,/g, ""), 10) || 0;
};
