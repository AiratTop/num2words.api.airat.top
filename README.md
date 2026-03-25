# num2words.api.airat.top

![num2words](https://repository-images.githubusercontent.com/1142037179/ae20d02b-998a-4b44-9668-a6fd5e31955b)

Tiny Cloudflare Worker that converts numbers to words for Russian (RUB) and English (USD/EUR).

Live endpoint: https://num2words.api.airat.top
Status page: https://status.airat.top

## API

### GET

```
GET /?number=1234.56&lang=ru&currency=rub&caps=false
```

Parameters:

- `number` (required) — number or decimal value.
- `lang` (optional, default `ru`) — `ru` for Russian (rubles/kopecks), `en` for English (USD/EUR).
- `currency` (optional) — `rub` for Russian; `usd` or `eur` for English. Defaults to `rub` for `lang=ru` and `usd` for `lang=en`.
- `caps` (optional, default `false`) — return the result in uppercase.

Example:

```bash
curl 'https://num2words.api.airat.top/?number=1234.56'
```

Response:

```json
{
  "number":"1234.56",
  "lang":"ru",
  "currency":"rub",
  "result":"Одна тысяча двести тридцать четыре рубля 56 копеек",
  "amount_text":"Одна тысяча двести тридцать четыре",
  "currency_form":"рубля",
  "coins_text":"56 копеек"
}
```

Test in browser: [https://num2words.api.airat.top/?number=1234.56](https://num2words.api.airat.top/?number=1234.56)

English example:

```bash
curl 'https://num2words.api.airat.top/?number=1234.56&lang=en&currency=usd'
```

Response:

```json
{
  "number":"1234.56",
  "lang":"en",
  "currency":"usd",
  "result":"One thousand two hundred thirty four dollars 56 cents",
  "amount_text":"One thousand two hundred thirty four",
  "currency_form":"dollars",
  "coins_text":"56 cents"
}
```

Test in browser: [https://num2words.api.airat.top/?number=1234.56&lang=en&currency=usd](https://num2words.api.airat.top/?number=1234.56&lang=en&currency=usd)

English EUR example:

```bash
curl 'https://num2words.api.airat.top/?number=1234.56&lang=en&currency=eur'
```

Response:

```json
{
  "number":"1234.56",
  "lang":"en",
  "currency":"eur",
  "result":"One thousand two hundred thirty four euros 56 cents",
  "amount_text":"One thousand two hundred thirty four",
  "currency_form":"euros",
  "coins_text":"56 cents"
}
```

### POST

Send `number` as JSON, or raw text.

```bash
curl -X POST 'https://num2words.api.airat.top/' \
  -H 'Content-Type: application/json' \
  -d '{"number":"1234.56","lang":"ru","currency":"rub","caps":false}'
```

Response:

```json
{
  "number":"1234.56",
  "lang":"ru",
  "currency":"rub",
  "result":"Одна тысяча двести тридцать четыре рубля 56 копеек",
  "amount_text":"Одна тысяча двести тридцать четыре",
  "currency_form":"рубля",
  "coins_text":"56 копеек"
}
```

### Errors

If `number` is missing or invalid, the API returns HTTP 400:

```json
{"error":"Missing required parameter: number"}
```

Unsupported language:

```json
{"error":"Unsupported language"}
```

Unsupported currency:

```json
{"error":"Unsupported currency"}
```

## Negative numbers

Negative values are supported and prefixed with "Минус" (Russian) or "Minus" (English).

### CORS

CORS is enabled for all origins (`*`).

## Privacy

No analytics or request logs are collected by this project.

## Monitoring

Health check endpoint:

```
GET /health
```

Response:

```json
{"status":"ok"}
```

Test in browser: https://num2words.api.airat.top/health

## Project structure

- `worker.js` — Cloudflare Worker script.

## Deployment

Deploy with Wrangler (the repo already includes `wrangler.toml`):

```bash
npx wrangler deploy
```

If you use Cloudflare Workers Builds (GitHub integration), set the deploy command to `npx wrangler deploy` and keep the root path at `/`.

To serve it on a custom domain, add the domain in **Workers & Pages → Domains & Routes**. Cloudflare will create the DNS record and issue SSL automatically.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Author

**AiratTop**

- Website: [airat.top](https://airat.top)
- GitHub: [@AiratTop](https://github.com/AiratTop)
- Email: [mail@airat.top](mailto:mail@airat.top)
- Repository: [num2words.api.airat.top](https://github.com/AiratTop/num2words.api.airat.top)
