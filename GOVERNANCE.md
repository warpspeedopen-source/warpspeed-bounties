# Governance

warpSpeed OPEN bounties are reviewed and managed by maintainers.

## Roles

- New Contributor: A developer exploring or claiming a bounty.
- Contributor: A developer who has submitted accepted work.
- Core Contributor: A trusted contributor with repeated successful work.
- Maintainer: A reviewer who can approve work, manage issues, and merge PRs.

## Decision process

# Governance

## Bounty Review Process

### Email Threads API Bounty Review Criteria

Bounty submissions for the Email Threads API will be evaluated against:

1. **Specification Match (minimum 90%)**
   - All required endpoints implemented
   - Thread grouping behavior matches requirements
   - Draft handling works correctly
   - Search/filter consistency maintained

2. **Code Quality**
   - Clean, maintainable TypeScript
   - Proper error handling
   - Efficient database queries

3. **Testing**
   - Comprehensive Jest test suite
   - Auth, ordering, filters, drafts, and thread detail coverage

4. **Documentation**
   - Swagger/OpenAPI specs complete
   - README updates if needed

5. **Payment Approval**
   - 100% completion required for payment
   - PR must be approved and merged
Maintainers review bounty claims, pull requests, and acceptance criteria. Final merge decisions belong to maintainers.
