// Russian number-to-words API for amounts in rubles.

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

// Convert number to Russian words, with optional rubles/kopecks and uppercase.
function num2words(value, ruble = true, caps = false) {
  const priceStr = String(value)
    .replace(',', '.')
    .replace(/[ \f\n\r\t\v]/g, '');

  if (priceStr.length === 0 || Number.isNaN(Number(priceStr))) {
    return { error: 'Не числовое значение' };
  }

  let rubPart = priceStr;
  let kopPart = 0;

  if (priceStr.includes('.')) {
    const parts = priceStr.split('.');
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
  let result = propis(price, dummy).trim();

  // Rubles are always shown when kopecks exist.
  const showRuble = (ruble === undefined ? true : ruble) || kopPart > 0;

  if (showRuble) {
    const rubWord = chooseEnding(rubNumber, 'рубль', 'рубля', 'рублей');
    if (result === '') {
      result = `Ноль ${rubWord}`;
    } else {
      result += ` ${rubWord}`;
    }
  }

  // Append kopecks when present.
  if (kopPart > 0) {
    const kopWord = chooseEnding(kopPart, 'копейка', 'копейки', 'копеек');
    result += ` ${kopPart} ${kopWord}`;
  }

  if (result.length > 0) {
    result = result.charAt(0).toUpperCase() + result.slice(1);
  }

  if (caps === true) {
    result = result.toUpperCase();
  }

  return { result, kopPart, showRuble };
}

// Split the rendered string into amount/currency/coins parts when possible.
function parseResultParts(result) {
  const match = result.match(/^([А-Яа-яЁё\s]+)\s([А-Яа-яЁё]+)\s?(\d{1,2}\s[А-Яа-яЁё]+)?$/);
  if (!match) return null;
  return {
    amount_text: match[1].trim(),
    currency_form: match[2],
    coins_text: match[3] ? match[3].trim() : null
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
        ruble: body?.ruble,
        caps: body?.caps
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
      ruble: params.get('ruble'),
      caps: params.get('caps')
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
    let ruble = parseBool(url.searchParams.get('ruble'));
    let caps = parseBool(url.searchParams.get('caps'));

    // Read payload on POST only when query params are missing.
    if (number === null && request.method === 'POST') {
      const payload = await readPayload(request);
      const payloadNumber = normalizeNumber(payload.number);
      if (number === null && payloadNumber !== null) {
        number = payloadNumber;
      }
      if (ruble === undefined) ruble = parseBool(payload.ruble);
      if (caps === undefined) caps = parseBool(payload.caps);
    }

    const normalizedNumber = normalizeNumber(number);
    if (normalizedNumber === null) {
      return jsonResponse({ error: 'Missing required parameter: number' }, 400);
    }

    const { result, error } = num2words(normalizedNumber, ruble, caps);
    if (error) {
      return jsonResponse({ error }, 400);
    }

    const response = {
      number: normalizedNumber,
      result
    };

    const parts = parseResultParts(result);
    if (parts) {
      response.amount_text = parts.amount_text;
      response.currency_form = parts.currency_form;
      if (parts.coins_text) response.coins_text = parts.coins_text;
    }

    return jsonResponse(response);
  }
};
