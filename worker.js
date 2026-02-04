// Number-to-words API for money amounts (RU + EN).

// Dictionary chunks used by the legacy algorithm (units/teens/tens/hundreds + scale words).
const WORDS = [
  '', 'один', 'два', 'три', 'четыре', 'пять', 'шесть', 'семь', 'восемь', 'девять',
  '', 'одиннадцать', 'двенадцать', 'тринадцать', 'четырнадцать', 'пятнадцать', 'шестнадцать',
  'семнадцать', 'восемнадцать', 'девятнадцать',
  '', 'десять', 'двадцать', 'тридцать', 'сорок', 'пятьдесят', 'шестьдесят',
  'семьдесят', 'восемьдесят', 'девяносто',
  '', 'сто', 'двести', 'триста', 'четыреста', 'пятьсот', 'шестьсот',
  'семьсот', 'восемьсот', 'девятьсот',
  'тысяч', 'тысяча', 'тысячи', 'тысячи', 'тысячи', 'тысяч', 'тысяч', 'тысяч', 'тысяч', 'тысяч',
  'миллионов', 'миллион', 'миллиона', 'миллиона', 'миллиона', 'миллионов', 'миллионов', 'миллионов', 'миллионов', 'миллионов',
  'миллиардов', 'миллиард', 'миллиарда', 'миллиарда', 'миллиарда', 'миллиардов', 'миллиардов', 'миллиардов', 'миллиардов', 'миллиардов'
];

// Precompute a 10xN matrix for quick lookups (keeps the original algorithm intact).
const WORD_MATRIX = (() => {
  const matrix = Array.from({ length: 10 }, () => Array(WORDS.length));
  let k = 0;
  for (let i = 0; i < WORDS.length; i++) {
    for (let j = 0; j < 10; j++) {
      matrix[j][i] = WORDS[k++] || '';
    }
  }
  return matrix;
})();

// CORS for browser usage.
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'X-Robots-Tag': 'noindex, nofollow'
};

// Pick the correct Russian word ending based on the number.
function chooseEnding(number, one, few, many) {
  let n = Math.abs(number) % 100;
  if (n > 10 && n < 20) return many;
  n = n % 10;
  if (n === 1) return one;
  if (n >= 2 && n <= 4) return few;
  return many;
}

function choosePluralEn(number, singular, plural) {
  return Math.abs(number) === 1 ? singular : plural;
}

function capitalizeFirst(text) {
  if (!text) return text;
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function formatSentence(text, caps) {
  if (!text) return text;
  return caps ? text.toUpperCase() : capitalizeFirst(text);
}

function normalizeLang(value) {
  if (!value) return 'ru';
  const v = value.toString().trim().toLowerCase();
  if (v.startsWith('ru')) return 'ru';
  if (v.startsWith('en')) return 'en';
  return null;
}

function normalizeCurrency(value, lang) {
  if (!value) return lang === 'en' ? 'usd' : 'rub';
  const v = value.toString().trim().toLowerCase();
  const rubAliases = new Set(['rub', 'rur', 'ruble', 'rubles']);
  const usdAliases = new Set(['usd', 'dollar', 'dollars', 'us']);
  const eurAliases = new Set(['eur', 'euro', 'euros']);
  if (lang === 'ru' && rubAliases.has(v)) return 'rub';
  if (lang === 'en' && usdAliases.has(v)) return 'usd';
  if (lang === 'en' && eurAliases.has(v)) return 'eur';
  return null;
}

// Parse boolean-ish values from query/body (\"true\", \"1\", etc.).
function parseBool(value) {
  if (value === undefined || value === null) return undefined;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  if (typeof value === 'string') {
    const v = value.trim().toLowerCase();
    if (['1', 'true', 'yes', 'y', 'on'].includes(v)) return true;
    if (['0', 'false', 'no', 'n', 'off'].includes(v)) return false;
  }
  return undefined;
}

// Normalize incoming value to a string that can be parsed safely.
function normalizeNumber(value) {
  if (value === undefined || value === null) return null;
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value.toString() : null;
  }
  if (typeof value === 'string') return value;
  return null;
}

// Convert number to Russian words, with rubles/kopecks and uppercase.
function num2wordsRu(value, caps = false) {
  const priceStr = String(value)
    .replace(',', '.')
    .replace(/[ \f\n\r\t\v]/g, '');

  if (priceStr.length === 0 || Number.isNaN(Number(priceStr))) {
    return { error: 'Не числовое значение' };
  }

  let isNegative = false;
  let normalized = priceStr;
  if (normalized.startsWith('-')) {
    isNegative = true;
    normalized = normalized.slice(1);
  }

  let rubPart = normalized;
  let kopPart = 0;

  if (normalized.includes('.')) {
    const parts = normalized.split('.');
    rubPart = parts[0] === '' ? '0' : parts[0];
    let fraction = parts[1] || '0';
    if (fraction.length === 1) fraction += '0';
    if (fraction.length > 2) fraction = fraction.substr(0, 2);
    kopPart = Number(fraction);
  }

  if (rubPart.length > 12) {
    return { error: 'Слишком большое число' };
  }

  const price = rubPart;
  if (Number(price) === 0 && kopPart === 0) {
    isNegative = false;
  }

  // Small helper to read digits from the right.
  function n(start, len) {
    if (start > price.length) return 0;
    return Number(price.substr(price.length - start, len));
  }

  // Core spelling routine from the original n8n script.
  function propis(localPrice, D) {
    let res = '';
    for (let i = 0; i < localPrice.length; i += 3) {
      let sotny = '';
      let desatky = '';
      let edinicy = '';
      if (n(i + 2, 2) > 10 && n(i + 2, 2) < 20) {
        edinicy = ` ${WORD_MATRIX[n(i + 1, 1)][1]} ${WORD_MATRIX[0][i / 3 + 3]}`;
        if (i === 0) edinicy += D[0];
      } else {
        edinicy = WORD_MATRIX[n(i + 1, 1)][0];
        if (edinicy === 'один' && i === 3) edinicy = 'одна';
        if (edinicy === 'два' && i === 3) edinicy = 'две';
        if (!(i === 0 && edinicy !== '')) {
          edinicy += ` ${WORD_MATRIX[n(i + 1, 1)][i / 3 + 3]}`;
        }
        if (edinicy === ' ') {
          edinicy = '';
        } else if (edinicy !== ` ${WORD_MATRIX[n(i + 1, 1)][i / 3 + 3]}`) {
          edinicy = ` ${edinicy}`;
        }
        if (i === 0) edinicy += ` ${D[n(i + 1, 1)]}`;
        desatky = WORD_MATRIX[n(i + 2, 1)][2];
        if (desatky !== '') desatky = ` ${desatky}`;
      }
      sotny = WORD_MATRIX[n(i + 3, 1)][3];
      if (sotny !== '') sotny = ` ${sotny}`;
      if (localPrice.substr(localPrice.length - i - 3, 3) === '000' && edinicy === ` ${WORD_MATRIX[0][i / 3 + 3]}`) {
        edinicy = '';
      }
      res = sotny + desatky + edinicy + res;
    }
    if (res === ` ${D[0]}`) return `ноль${res}`;
    return res.substr(1);
  }

  const rubNumber = Number(price);
  const dummy = ['', '', '', '', '', '', '', '', '', ''];
  let amountTextBase = propis(price, dummy).trim();
  if (amountTextBase === '') amountTextBase = 'ноль';
  if (isNegative) amountTextBase = `минус ${amountTextBase}`;
  let resultBase = amountTextBase;

  const currencyForm = chooseEnding(rubNumber, 'рубль', 'рубля', 'рублей');
  resultBase += ` ${currencyForm}`;

  // Append kopecks when present.
  let coinsText = null;
  if (kopPart > 0) {
    const kopWord = chooseEnding(kopPart, 'копейка', 'копейки', 'копеек');
    coinsText = `${kopPart} ${kopWord}`;
    resultBase += ` ${coinsText}`;
  }

  const result = formatSentence(resultBase, caps);
  const amountText = formatSentence(amountTextBase, caps);
  const currencyFormOut = currencyForm ? (caps ? currencyForm.toUpperCase() : currencyForm) : null;
  const coinsTextOut = coinsText ? (caps ? coinsText.toUpperCase() : coinsText) : null;

  return {
    result,
    amount_text: amountText,
    currency_form: currencyFormOut,
    coins_text: coinsTextOut
  };
}

// Convert number to English words, with dollars/cents and uppercase.
function num2wordsEn(value, currency = 'usd', caps = false) {
  const priceStr = String(value)
    .replace(',', '.')
    .replace(/[ \f\n\r\t\v]/g, '');

  if (priceStr.length === 0 || Number.isNaN(Number(priceStr))) {
    return { error: 'Not a number' };
  }

  let isNegative = false;
  let normalized = priceStr;
  if (normalized.startsWith('-')) {
    isNegative = true;
    normalized = normalized.slice(1);
  }

  let intPart = normalized;
  let centsPart = 0;

  if (normalized.includes('.')) {
    const parts = normalized.split('.');
    intPart = parts[0] === '' ? '0' : parts[0];
    let fraction = parts[1] || '0';
    if (fraction.length === 1) fraction += '0';
    if (fraction.length > 2) fraction = fraction.substr(0, 2);
    centsPart = Number(fraction);
  }

  if (intPart.length > 12) {
    return { error: 'Number is too large' };
  }

  if (Number(intPart) === 0 && centsPart === 0) {
    isNegative = false;
  }

  const ONES = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
  const TEENS = ['ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
  const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
  const SCALES = ['', 'thousand', 'million', 'billion'];

  function chunkToWords(number) {
    const words = [];
    const hundreds = Math.floor(number / 100);
    const rest = number % 100;

    if (hundreds > 0) {
      words.push(ONES[hundreds], 'hundred');
    }

    if (rest > 0) {
      if (rest < 10) {
        words.push(ONES[rest]);
      } else if (rest < 20) {
        words.push(TEENS[rest - 10]);
      } else {
        const tens = Math.floor(rest / 10);
        const ones = rest % 10;
        words.push(TENS[tens]);
        if (ones > 0) words.push(ONES[ones]);
      }
    }

    return words.join(' ');
  }

  function integerToWords(numStr) {
    if (Number(numStr) === 0) return 'zero';
    const parts = [];
    let groupIndex = 0;
    for (let i = numStr.length; i > 0; i -= 3) {
      const start = Math.max(0, i - 3);
      const chunk = Number(numStr.slice(start, i));
      if (chunk > 0) {
        const chunkWords = chunkToWords(chunk);
        const scale = SCALES[groupIndex];
        parts.unshift(scale ? `${chunkWords} ${scale}` : chunkWords);
      }
      groupIndex += 1;
    }
    return parts.join(' ');
  }

  const currencyForms = {
    usd: { major: ['dollar', 'dollars'], minor: ['cent', 'cents'] },
    eur: { major: ['euro', 'euros'], minor: ['cent', 'cents'] }
  };
  const forms = currencyForms[currency] || currencyForms.usd;

  let amountTextBase = integerToWords(intPart);
  if (amountTextBase === '') amountTextBase = 'zero';
  if (isNegative) amountTextBase = `minus ${amountTextBase}`;

  let resultBase = amountTextBase;
  const currencyForm = choosePluralEn(Number(intPart), forms.major[0], forms.major[1]);
  resultBase += ` ${currencyForm}`;

  let coinsText = null;
  if (centsPart > 0) {
    const centWord = choosePluralEn(centsPart, forms.minor[0], forms.minor[1]);
    coinsText = `${centsPart} ${centWord}`;
    resultBase += ` ${coinsText}`;
  }

  const result = formatSentence(resultBase, caps);
  const amountText = formatSentence(amountTextBase, caps);
  const currencyFormOut = currencyForm ? (caps ? currencyForm.toUpperCase() : currencyForm) : null;
  const coinsTextOut = coinsText ? (caps ? coinsText.toUpperCase() : coinsText) : null;

  return {
    result,
    amount_text: amountText,
    currency_form: currencyFormOut,
    coins_text: coinsTextOut
  };
}

// Read JSON/form/text payloads for POST requests.
async function readPayload(request) {
  const contentType = request.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    try {
      const body = await request.json();
      return {
        number: body?.number ?? body?.value ?? null,
        caps: body?.caps,
        lang: body?.lang,
        currency: body?.currency
      };
    } catch {
      return {};
    }
  }

  if (contentType.includes('application/x-www-form-urlencoded')) {
    const body = await request.text();
    const params = new URLSearchParams(body);
    return {
      number: params.get('number') ?? params.get('value'),
      caps: params.get('caps'),
      lang: params.get('lang'),
      currency: params.get('currency')
    };
  }

  if (contentType.includes('text/plain')) {
    const body = await request.text();
    return { number: body };
  }

  return {};
}

// Consistent JSON response with CORS headers.
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...CORS_HEADERS
    }
  });
}

function textResponse(text, status = 200) {
  return new Response(text, {
    status,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      ...CORS_HEADERS
    }
  });
}

export default {
  async fetch(request) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    const url = new URL(request.url);
    if (url.pathname === '/robots.txt') {
      return textResponse('User-agent: *\nDisallow: /\n');
    }
    // Simple health check for monitoring.
    if (url.pathname === '/health') {
      return jsonResponse({ status: 'ok' });
    }

    // Accept both `number` and `value` as input keys.
    let number = url.searchParams.get('number') ?? url.searchParams.get('value');
    let caps = parseBool(url.searchParams.get('caps'));
    let lang = url.searchParams.get('lang');
    let currency = url.searchParams.get('currency');

    // Read payload on POST when query params are missing.
    if (request.method === 'POST' && (number === null || caps === undefined || lang === null || currency === null)) {
      const payload = await readPayload(request);
      const payloadNumber = normalizeNumber(payload.number);
      if (number === null && payloadNumber !== null) {
        number = payloadNumber;
      }
      if (caps === undefined) caps = parseBool(payload.caps);
      if (lang === null && payload.lang !== undefined) lang = payload.lang;
      if (currency === null && payload.currency !== undefined) currency = payload.currency;
    }

    const normalizedLang = normalizeLang(lang);
    if (!normalizedLang) {
      return jsonResponse({ error: 'Unsupported language' }, 400);
    }

    const normalizedCurrency = normalizeCurrency(currency, normalizedLang);
    if (!normalizedCurrency) {
      return jsonResponse({ error: 'Unsupported currency' }, 400);
    }

    const normalizedNumber = normalizeNumber(number);
    if (normalizedNumber === null) {
      return jsonResponse({ error: 'Missing required parameter: number' }, 400);
    }

    const renderer = normalizedLang === 'en' ? num2wordsEn : num2wordsRu;
    const { result, error, amount_text, currency_form, coins_text } = normalizedLang === 'en'
      ? renderer(normalizedNumber, normalizedCurrency, caps)
      : renderer(normalizedNumber, caps);
    if (error) {
      return jsonResponse({ error }, 400);
    }

    const response = {
      number: normalizedNumber,
      lang: normalizedLang,
      currency: normalizedCurrency,
      result
    };

    if (amount_text) response.amount_text = amount_text;
    if (currency_form) response.currency_form = currency_form;
    if (coins_text) response.coins_text = coins_text;

    return jsonResponse(response);
  }
};
