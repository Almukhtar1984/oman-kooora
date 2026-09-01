// Identity matching for the player portal, where a person signs in with their
// phone number and civil ID instead of an email + password.
//
// Both columns were typed in by hand over years, so production holds Arabic-Indic
// digits ("٩٨٦٥٦٩١"), leading spaces, "+968" prefixes and stray separators. Every
// comparison therefore happens on a normalised form rather than the raw string.

const ARABIC_INDIC = "٠١٢٣٤٥٦٧٨٩";
const EASTERN_ARABIC = "۰۱۲۳۴۵۶۷۸۹";

// "٩٨٦٥٦٩١" -> "9865691"
export const toWesternDigits = (value = "") => {
    let out = "";
    for (const char of String(value)) {
        const arabic = ARABIC_INDIC.indexOf(char);
        if (arabic !== -1) { out += arabic; continue; }
        const eastern = EASTERN_ARABIC.indexOf(char);
        if (eastern !== -1) { out += eastern; continue; }
        out += char;
    }
    return out;
};

export const digitsOnly = (value) => toWesternDigits(value).replace(/[^0-9]/g, "");

// Omani numbers are 8 digits. Accept them written with the country code, with a
// leading zero, or plain, and compare them all on the same 8 digits.
export const normalizePhone = (value) => {
    let digits = digitsOnly(value);
    if (digits.length > 8 && digits.startsWith("968")) digits = digits.slice(3);
    if (digits.length === 9 && digits.startsWith("0")) digits = digits.slice(1);
    return digits;
};

export const normalizeCardNumber = (value) => digitsOnly(value);

// "9865691" -> "٩٨٦٥٦٩١", so an indexed lookup can also hit the rows that were
// entered in Arabic-Indic digits without falling back to a full scan.
export const toArabicIndicDigits = (value = "") =>
    String(value).replace(/[0-9]/g, (d) => ARABIC_INDIC[Number(d)]);

// The exact card_number strings worth trying against the index before resorting
// to a normalised scan. Order does not matter; duplicates are dropped.
export const cardNumberLookupValues = (input) => {
    const raw = String(input ?? "");
    const trimmed = raw.trim();
    const normalized = normalizeCardNumber(raw);

    const values = [raw, trimmed, normalized, toArabicIndicDigits(normalized)];
    return [...new Set(values.filter((value) => value !== ""))];
};
