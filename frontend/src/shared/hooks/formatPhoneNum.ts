export const formatPhoneNum = (phone: string): string => {
  const cleaned = phone.replace(/[^0-9]/g, '');

  // 02 지역번호
  if (cleaned.startsWith('02')) {
    if (cleaned.length === 9)
      return `${cleaned.slice(0, 2)}-${cleaned.slice(2, 5)}-${cleaned.slice(5)}`;
    if (cleaned.length === 10)
      return `${cleaned.slice(0, 2)}-${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
  }

  // 휴대폰 번호
  if (cleaned.length === 11 && /^010/.test(cleaned)) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}-${cleaned.slice(7)}`;
  }

  // 일반 지역번호
  if (/^0(3|4|5|6|7)[0-9]/.test(cleaned)) {
    if (cleaned.length === 10) {
      return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    } else if (cleaned.length === 11) {
      return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}-${cleaned.slice(7)}`;
    }
  }

  return phone;
};
