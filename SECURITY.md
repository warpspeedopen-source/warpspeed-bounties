# Security Policy

Please do not post security vulnerabilities publicly in GitHub issues.

If you discover a security issue, contact the warpSpeed OPEN team privately.

Security contact: Add security email here

# Security Policy

## Supported Versions

We release patches for security vulnerabilities in the following versions:

| Version | Supported          |
| ------- | ------------------ |
| latest  | :white_check_mark: |

## Reporting a Vulnerability

Please report security vulnerabilities to security@warpspeedopen.org.

## Note Locking Security Considerations

The note locking feature (active bounty) must adhere to the following security standards:

### Authentication Methods

- **Biometric**: Face ID, Touch ID, fingerprint via platform APIs
- **Device PIN**: System-level device authentication
- **User-defined PIN**: Minimum 4-digit PIN with secure storage

### Secure Storage

- iOS: Keychain Services
- Android: Android Keystore System
- Never store PINs or biometric data in plain text
- Use hardware-backed encryption when available

### Threat Model

| Threat | Mitigation |
|--------|-----------|
| Unauthorized note access | Require authentication before content display |
| PIN brute force | Implement attempt limits with exponential backoff |
| Screen capture | Obscure content in recent apps / screenshots |
| App backgrounding | Lock notes when app enters background |
| Root/jailbreak | Best-effort detection, warn users |

### Audit Requirements

- All authentication attempts logged (without storing sensitive data)
- Lock/unlock events available for security review
- No network transmission of note content or PINs

## Responsible Disclosure

We appreciate responsible disclosure of security issues. Valid reports may be eligible for recognition or bounty consideration.
Do not include API keys, private credentials, tokens, or user data in pull requests or screenshots.
