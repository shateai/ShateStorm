# Security Specification - Shate

## Data Invariants
1. A presentation must belong to a valid user.
2. Only the owner can edit or delete their presentations.
3. Public access is only allowed for reading presentations where `isPublic` is explicitly true.
4. User stats (quotas) must only be accessible and modifiable by the owner.
5. All IDs must be valid alphanumeric strings.
6. Topic and Title must be string-safe and size-limited.

## The Dirty Dozen Payloads
1. **Identity Spoofing (Create)**: User A tries to create a presentation for User B.
2. **Identity Spoofing (Update)**: User A tries to change the `userId` of a presentation to User B.
3. **Publicity Leak**: User B tries to read a private presentation of User A.
4. **ID Poisoning**: User tries to create a presentation with a document ID that is 2KB of junk.
5. **Resource Exhaustion**: User tries to submit a `topic` that is 5MB.
6. **Array Overflow**: User tries to add 1,000 slides.
7. **Type Confusion**: User sends a number for `presentationTitle`.
8. **Shadow Update**: User tries to inject an `isAdmin: true` field into a presentation document.
9. **Quota Bypass (Read)**: User A tries to read User B's daily image count.
10. **Quota Bypass (Write)**: User A tries to reset User B's daily image count.
11. **Timestamp Spoofing**: User tries to set a `createdAt` date in the past during creation.
12. **Terminal State Bypass**: (Optional in this app) User tries to edit a 'complete' presentation to change `topic` without owner permission (already covered by owner checks, but stricter field checks are better).

## The Test Runner (firestore.rules.test.ts)
I'll create this file later if needed for full verification, but first I'll draft the rules.
