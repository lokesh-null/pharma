export const maskAadhaar = (aadhaar) => {
    if (!aadhaar) return '';
    const cleanAadhaar = aadhaar.replace(/\D/g, '');
    if (cleanAadhaar.length !== 12) return aadhaar;
    return `XXXX XXXX ${cleanAadhaar.slice(-4)}`;
};

export const maskPhoneNumber = (phone) => {
    if (!phone) return '';
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) return phone;
    return `XXXXXX${cleanPhone.slice(-4)}`;
};
