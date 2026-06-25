# Note Locking with Biometrics/PIN - Technical Specification

## Implementation Plan
1. Use OS-level biometric APIs (Windows Hello, macOS TouchID, Android Biometric)
2. PIN fallback with secure local storage
3. AES-256 encryption for note content
4. React Native or Flutter for cross-platform

## Security Considerations
- Keys stored in OS keychain/keystore
- Rate limiting on PIN attempts
- Auto-lock after inactivity

## Estimated Effort: 2-3 weeks
