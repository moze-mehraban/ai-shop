// تبدیل ارقام فارسی/عربی به انگلیسی تا ورودی‌هایی مثل «۰۹۱۲...» هم پذیرفته شوند
export function normalizeDigits(value: string) {
  return value
    .replace(/[۰-۹]/g, (digit) => String(digit.charCodeAt(0) - 0x06f0))
    .replace(/[٠-٩]/g, (digit) => String(digit.charCodeAt(0) - 0x0660));
}

export function normalizeMobile(value: string) {
  let mobile = normalizeDigits(value).replace(/[\s\-()]/g, "");

  if (mobile.startsWith("+98")) {
    mobile = `0${mobile.slice(3)}`;
  } else if (mobile.startsWith("0098")) {
    mobile = `0${mobile.slice(4)}`;
  } else if (/^9\d{9}$/.test(mobile)) {
    mobile = `0${mobile}`;
  }

  return mobile;
}

export const MOBILE_PATTERN = /^09\d{9}$/;
export const POSTAL_CODE_PATTERN = /^\d{10}$/;
