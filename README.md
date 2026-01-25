# num2words.api.airat.top

Tiny Cloudflare Worker that converts numbers to Russian words with rubles/kopecks.

Live endpoint: https://num2words.api.airat.top

## API

### GET

```
GET /?number=1234.56&ruble=true&caps=false
```

Parameters:

- `number` (required) — number or decimal value.
- `ruble` (optional, default `true`) — include the ruble word. If kopecks are present, rubles are included regardless.
- `caps` (optional, default `false`) — return the result in uppercase.

Example:

```bash
curl 'https://num2words.api.airat.top/?number=1234.56'
```

Response:

```json
{
  "number":"1234.56",
  "result":"Одна тысяча двести тридцать четыре рубля 56 копеек",
  "amount_text":"Одна тысяча двести тридцать четыре",
  "currency_form":"рубля",
  "coins_text":"56 копеек"
}
```

Test in browser: [https://num2words.api.airat.top/?number=1234.56](https://num2words.api.airat.top/?number=1234.56)

### POST

Send `number` as JSON, or raw text.

```bash
curl -X POST 'https://num2words.api.airat.top/' \
  -H 'Content-Type: application/json' \
  -d '{"number":"1234.56","ruble":true,"caps":false}'
```

Response:

```json
{
  "number":"1234.56",
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

### CORS

CORS is enabled for all origins (`*`).

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