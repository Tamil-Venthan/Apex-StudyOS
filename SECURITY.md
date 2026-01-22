# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in Apex StudyOS, please report it by emailing the maintainer directly or by opening a private security advisory on GitHub.

**Please do not report security vulnerabilities through public GitHub issues.**

### What to Include

When reporting a vulnerability, please include:

- A description of the vulnerability
- Steps to reproduce the issue
- Potential impact of the vulnerability
- Any suggested fixes (if available)

### Response Time

We will acknowledge receipt of your vulnerability report within 48 hours and will send you regular updates about our progress. We aim to release a fix within 30 days of the initial report.

## Supported Versions

We release patches for security vulnerabilities for the following versions:

| Version | Supported |
| ------- | --------- |
| 1.1.x   | ✅ Yes    |
| < 1.0   | ❌ No     |

## Security Best Practices

As a desktop application that stores data locally:

- All data is stored locally on your machine using SQLite
- No data is transmitted to external servers
- The application does not require internet connectivity
- Environment variables (`.env` files) should never be committed to version control
- Always download releases from the official GitHub repository

## Updates

We recommend keeping Apex StudyOS up to date to benefit from the latest security patches and features.
