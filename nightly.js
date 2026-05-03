const Anthropic = require("@anthropic-ai/sdk");

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

async function run() {
  const stream = await client.messages.stream({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: `
You are an elite senior full-stack engineer...
You are an elite senior full-stack engineer with exceptional precision, architectural discipline, and debugging ability. Your implementation quality must be production-grade.

Carefully analyze my existing e-commerce codebase and systematically fix all issues below.

Do not leave placeholders.
Do not skip validation.
Do not partially implement anything.

Apply fixes directly and verify each one.
After every fix, test the affected functionality.

---

# BANNER MANAGEMENT FIXES

## Restrict page assignment
Currently banners can be assigned to "other page". This must NOT exist.

Banner assignment must only allow pages that already exist in the admin backoffice.

Remove any "custom page" or "other page" option.

Allowed pages must come dynamically from the existing BO page registry/database.

---

## Banner order validation
Banner order must NEVER allow value 0.

Rules:
- minimum value: 1
- only positive integers
- backend validation required
- frontend validation required

Display validation error if invalid.

---

## Banner image validation
Images must only accept:
- .png
- .jpg
- .jpeg

Images must be uploaded as LOCAL FILES only.

Reject:
- URLs
- external links
- unsupported formats

Add backend MIME validation and frontend file validation.

---

# CMS TEXT EDITING RESTRICTIONS

Currently too many texts are editable.

Restrict editable content to ONLY:

## 1. Banner titles and subtitles
## 2. Page titles and subtitles
## 3. Footer content

Only these text areas should be editable.
Everything else must be locked/read-only.

Update both:
- admin UI
- backend permissions
- CMS API validation

---

# HOMEPAGE FEATURED PRODUCTS PAGINATION

Featured products on homepage must NOT have pagination.

Remove pagination completely.

Display all configured featured products.

---

# CAMPAIGN PRODUCT MANAGEMENT BUG

Current issue:
Campaign product changes do not update frontend.

Fix synchronization between:
- admin changes
- database persistence
- frontend rendering
- cache/state invalidation

Ensure immediate frontend update.

Investigate:
- API mutation issues
- stale cache
- state hydration
- incorrect query keys
- missing DB writes

---

# COMMENT MODERATION SYNC BUG

Changes in BO comments are not visible in FO.

Fix synchronization for:
- edit comment
- delete comment
- moderate comment
- reply to comment

Ensure proper revalidation.

---

# FULL BACKOFFICE TESTING

Systematically test ALL BO functionality.

## Product management
- create
- edit
- delete
- stock update
- image upload

## Banner management
- create
- edit
- delete
- page assignment
- image upload
- ordering

## Campaign management
- add products
- remove products
- save
- frontend sync

## Comment moderation
- reply
- edit
- delete
- hide/show

## CMS text editor
- editable restrictions
- save
- persistence
- frontend reflection

## Order management
- test all order flows

Fix all failures.

---

# DEBUGGING PROCESS

For every issue:
1. Identify root cause
2. Fix implementation
3. Retest
4. Confirm frontend update
5. Confirm database persistence

Repeat until stable.

---

# FINAL OUTPUT

Provide:

## Fixed files
## Root causes found
## Tests executed
## Remaining risks (if any)

Do not stop until all issues are fully resolved.

---

# CONTACT PAGE (IMPLEMENTATION REQUIRED)

Build a complete contact page.

Fields:
- name
- email
- subject
- message

Requirements:
- frontend validation with inline errors
- backend validation + sanitization
- store in database
- send to admin BO
- admin can:
  - view
  - reply
  - archive/delete

---

# DATABASE REQUIREMENTS

Design fully normalized schema.

Tables:
- reviews
- review_replies
- cms_texts
- homepage_sections
- product_highlights
- orders
- sms_logs
- contact_messages
- admin_replies
- payment_logs

Rules:
- normalization (no duplication)
- foreign keys
- cascade rules
- indexes
- timestamps (created_at, updated_at)
- referential integrity

---

# VALIDATION SYSTEM

Frontend:
- inline validation
- block invalid submissions

Backend:
- strict schema validation
- sanitization
- rate limiting
- auth checks
- authorization checks

---

# SECURITY REQUIREMENTS

- CSRF protection
- XSS sanitization
- SQL injection protection
- RBAC
- secure sessions
- admin route protection

No endpoint must be publicly exploitable.

---

# ADMIN BACKOFFICE

Must support:
- dashboard
- CMS editing
- product management
- order management
- comment moderation
- contact messages

All actions must be authorized.

---

# FRONTEND/BACKEND SYNC

Fix mismatches between:
- backend data
- frontend state
- DB updates
- cache

Ensure real-time consistency.

---

# MULTI-LANGUAGE SYSTEM

Add language selector.

Support:
- Portuguese
- English

Requirements:
- CMS-driven translations from DB
- persistent language selection (cookie/localStorage)
- dynamic UI updates

---

# TESTING (FULL COVERAGE)

Admin:
- dashboard
- CMS
- products
- banners
- orders
- comments
- contacts

Frontend:
- auth
- product browsing
- reviews
- checkout
- profile
- language switching

Payments:
- Stripe
- PayPal
- webhooks

System:
- pagination
- delivery rules (50€ minimum)
- RBAC
- CMS rendering

---

# AUTO FIX LOOP

If test fails:
1. root cause
2. fix
3. retest
4. verify sync
5. repeat

---

# FINAL REPORT

1. architecture summary
2. files changed
3. migrations
4. tests
5. bugs fixed
6. risks

        `
      }
    ]
  });

  for await (const event of stream) {
    if (event.type === "content_block_delta") {
      process.stdout.write(event.delta.text || "");
    }
  }
}

run();