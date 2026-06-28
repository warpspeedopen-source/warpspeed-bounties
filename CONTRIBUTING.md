# Contributing to warpSpeed Bounties

Thank you for your interest in contributing to warpSpeed OPEN.

## Before you start

Please do not begin paid bounty work until a maintainer confirms your assignment.

## Claiming a bounty

1. Open the bounty issue.
2. Sign up on the website: https://warpspeedopen.org/signup
3. Comment on the issue: `I have signed up and would like to claim this bounty.`
4. Wait for maintainer confirmation.
5. Start work only after confirmation.

## Pull request rules

- Keep the PR focused on the bounty scope.
- Include clear screenshots or videos for UI work.
- Include test notes where possible.
- Link the bounty issue in the PR description.
- Do not include secrets, API keys, or private credentials.

## Review and payment

Payment is processed only after:

- the submitted PR meets the acceptance criteria,
- maintainers approve it,
# Contributing to warpSpeed Bounties

Thank you for your interest in contributing to warpSpeed OPEN! This document outlines the process for participating in our bounty program.

## Getting Started

1. **Browse Bounties**: Visit [warpspeedopen.org/bounties](https://warpspeedopen.org/bounties) to see available tasks

## Bounty-Specific Guidelines

### Note Locking Bounty (Biometrics/PIN)

This bounty requires special attention to security and user experience:

#### Security Requirements
- All biometric data must use platform APIs (never store raw biometric data)
- PINs must be hashed using bcrypt or Argon2
- Use secure storage (Keychain/Keystore) for encryption keys
- Implement proper session management with configurable timeouts

#### Architecture Requirements
- Separate authentication layer from UI components
- Create reusable hooks for lock/unlock operations
- Implement proper TypeScript types for all lock states
- Support both biometric and PIN fallback

#### UI/UX Requirements
- Follow the [Adobe XD design reference](https://xd.adobe.com/view/b74cd4eb-ec51-400e-bdb2-5041a123510c-e21f/)
- Show clear lock indicators on note list items
- Implement smooth transitions between locked/unlocked states
- Provide accessible labels for screen readers

#### Code Quality
- 100% TypeScript coverage
- Unit tests for authentication logic
- Integration tests for lock/unlock flows
- Documentation for all public APIs

## Submission Process

1. Fork the repository
  - Reference to the bounty issue
  - Description of implementation approach
  - Screenshots/videos of UI changes
  - Test coverage report

## Review Process

- Maintainers will review within 5 business days
- Address feedback promptly
- Maximum 3 submission attempts per bounty
- Minimum 90% specification match required

## Payment


## Code of Conduct

Please read our [Code of Conduct](CODE_OF_CONDUCT.md) before participating.

## Questions?

- Discord: [Join our community](https://warpspeedopen.org/discord)
- Email: bounties@warpspeedopen.org
- and the PR is merged.
