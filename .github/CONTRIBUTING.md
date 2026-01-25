# Contributing

Thanks for your interest in improving translit.api.airat.top. Contributions of all kinds are welcome, including bug reports, documentation improvements, and transliteration edge cases.

## How to Help

- **Report bugs or suggest enhancements** by opening an issue on GitHub. Please include clear reproduction steps and request/response examples.
- **Improve documentation** by fixing typos or clarifying usage details in the README.
- **Submit pull requests** for the worker logic, API behavior, or test cases.

## Before You Start

- Read the repository `README.md` to understand the API contract.
- Keep changes focused. If you have multiple unrelated ideas, open separate pull requests.
- Avoid adding heavy dependencies. This project is a single Cloudflare Worker script.

## Development Workflow

1. Fork the repository and clone your fork locally.
2. Create a feature branch that describes your work (for example, `fix/case-mapping`).
3. Make your changes in `worker.js` or the documentation.
4. If you use Wrangler or the Cloudflare dashboard for testing, make sure the behavior matches the README examples.
5. Open a pull request against the `main` branch and describe what changed and how you verified it.

## Pull Request Checklist

- [ ] The worker responds correctly for both lowercase and uppercase Cyrillic.
- [ ] Missing `text` returns a 400 error as documented.
- [ ] Documentation updated if user-facing behavior changed.

## Code Style and Standards

- Keep the code minimal and readable.
- Avoid adding dependencies or build steps.
- Prefer clear, explicit mappings over magic logic.

## Security and Responsible Disclosure

If you discover a security vulnerability, please do not open a public issue. Instead, email mail@airat.top with the details so it can be addressed promptly.

## Questions or Feedback

If you are unsure about anything before contributing, feel free to open a discussion or contact AiratTop at mail@airat.top. Thanks!
