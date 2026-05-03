const Anthropic = require("@anthropic-ai/sdk");

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

async function run() {
  const msg = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 10000000,
    messages: [
      {
        role: "user",
        content: `
You are an elite senior full-stack engineer with exceptional precision, architectural discipline, and debugging ability.

Your implementation quality must be production-grade.

Carefully analyze my existing e-commerce codebase and systematically fix all issues below.

Do not leave placeholders.
Do not skip validation.
Do not partially implement anything.
Apply fixes directly and verify each one.

After every fix, test the affected functionality.

---

# BANNER MANAGEMENT FIXES

## Restrict page assignment

Currently banners can be assigned to "other page".

This must NOT exist.

Banner assignment must only allow pages that already exist in the admin backoffice.

Remove any "custom page" or "other page" option.

Allowed pages must come dynamically from the existing BO page registry/database.

---

## Banner order validation

Banner order must NEVER allow value 0.

Rules:

* minimum value: 1
* only positive integers
* backend validation required
* frontend validation required

Display validation error if invalid.

---

## Banner image validation

Images must only accept:

* .png
* .jpg
* .jpeg

Images must be uploaded as LOCAL FILES only.

Reject:

* URLs
* external links
* unsupported formats

Add backend MIME validation and frontend file validation.

---

# CMS TEXT EDITING RESTRICTIONS

Currently too many texts are editable.

Restrict editable content to ONLY:

## 1. Banner titles and subtitles

---

## 2. Page titles and subtitles

---

## 3. Footer content

Only these text areas should be editable.

Everything else must be locked/read-only.

Update both:

* admin UI
* backend permissions
* CMS API validation

---

# HOMEPAGE FEATURED PRODUCTS PAGINATION

Featured products on homepage must NOT have pagination.

Remove pagination completely from featured products section.

Display all configured featured products.

---

# CAMPAIGN PRODUCT MANAGEMENT BUG

Current issue:

Managing products by campaign does not update frontend.

Fix synchronization between:

* admin changes
* database persistence
* frontend rendering
* cache/state invalidation

Ensure all campaign product changes are immediately reflected in FO.

Investigate:

* API mutation issues
* stale cache
* state hydration
* incorrect query keys
* missing DB writes

---

# COMMENT MODERATION SYNC BUG

Current issue:

Changes made to comments in BO are not visible in FO.

Fix synchronization.

Admin actions that must instantly reflect on frontend:

* edit comment
* delete comment
* moderate comment
* reply to comment

Ensure proper revalidation.

---

# FULL BACKOFFICE TESTING

Systematically test ALL BO functionality.

Verify every module.

---

## Product management

Test:

* create
* edit
* delete
* stock update
* image upload

Fix all failures.

---

## Banner management

Test:

* create
* edit
* delete
* page assignment
* image upload
* ordering

Fix all failures.

---

## Campaign management

Test:

* add products
* remove products
* save
* frontend sync

Fix all failures.

---

## Comment moderation

Test:

* reply
* edit
* delete
* hide/show

Fix all failures.

---

## CMS text editor

Test:

* editable restrictions
* save
* persistence
* frontend reflection

Fix all failures.

---

## Order management

Test all order flows.

Fix all failures.

---

# DEBUGGING PROCESS

For every detected issue:

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

Do not stop until all listed issues are fully resolved and verified.You are an elite senior full-stack engineer, backend architect, and QA automation specialist. Your work must be production-grade, fully tested, secure, and robust.

You are responsible for auditing, fixing, and completing the entire system. Do not leave partial implementations, placeholders, or TODOs. Everything must be fully functional.

---

# CONTACT PAGE (IMPLEMENTATION REQUIRED)

Build a complete frontend contact page with a functional form.

## Fields:
- name
- email
- subject
- message

## Requirements:
- Validate all fields on frontend with inline error messages
- Validate all fields on backend (strict validation + sanitization)
- Store all submissions in the database
- Deliver messages to admin backoffice (BO)
- Admin must be able to:
  - view messages
  - reply to messages
  - archive or delete messages

---

# DATABASE REQUIREMENTS (FULL NORMALIZATION)

Design and implement a fully normalized schema.

Create or update tables:

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

## Database rules:
- proper normalization (no duplication of data)
- foreign keys correctly defined
- cascade rules properly implemented
- indexes on frequently queried fields
- timestamps (created_at, updated_at) on all tables
- enforce referential integrity

---

# VALIDATION SYSTEM (MANDATORY)

## Frontend:
- field validation for all inputs
- inline error messages
- prevent invalid submissions

## Backend:
- schema validation (strict)
- input sanitization
- rate limiting (anti-spam protection)
- authentication checks
- authorization checks

---

# SECURITY REQUIREMENTS

Implement full production-level security:

- CSRF protection
- XSS sanitization
- SQL injection protection
- role-based access control (RBAC)
- secure session handling
- admin route protection

Ensure no endpoint is publicly exploitable.

---

# ADMIN BACKOFFICE REQUIREMENTS

Ensure all admin operations are secure and functional:

- dashboard access
- CMS editing
- product management
- order management
- comment moderation
- contact message handling

All admin actions must be properly authorized.

---

# FRONTEND/BACKEND SYNCHRONIZATION

Fix any mismatch between:

- backend data
- frontend state
- database updates
- cached content

Ensure real-time consistency across the system.

---

# MULTI-LANGUAGE MENU (NEW REQUIREMENT)

Implement a language selector menu in the frontend.

## Requirements:
- Must support at least:
  - Portuguese
  - English
- All static and CMS-driven text must be translatable
- Texts must come from database (CMS structure must support multilingual fields)
- Language selection must persist (cookie or localStorage)
- All pages must dynamically update based on selected language

---

# TESTING (MANDATORY FULL COVERAGE)

After implementation, automatically test ALL system layers:

## Admin Panel:
- dashboard
- CMS editing
- product management
- banner management
- order management
- comment moderation
- contact message handling

## Frontend (Customer Side):
- authentication
- product browsing
- reviews & ratings
- checkout flow
- profile management
- language switching (NEW)

## Payments:
- Stripe integration
- PayPal integration
- success/failure handling
- webhook validation

## Messaging:
- contact form submission
- admin replies
- database persistence

## System Logic:
- pagination
- delivery threshold rules (50€ minimum for home delivery)
- role-based permissions
- CMS text rendering

---

# AUTO-FIX LOOP (CRITICAL)

If any test fails:

1. Identify root cause
2. Fix implementation
3. Re-run tests
4. Validate frontend + backend sync
5. Repeat until stable

No feature is considered complete until fully tested.

---

# FINAL OUTPUT REQUIRED

Provide a structured report:

1. System architecture summary
2. All files changed
3. Database migrations
4. Tests executed
5. Bugs fixed
6. Remaining risks (if any)

Do not stop until the entire platform is fully functional, consistent, secure, and production-ready.

`
      }
    ]
  });

  console.log(msg.content);
}

run();
