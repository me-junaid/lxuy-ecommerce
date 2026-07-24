# AGENTS.md — Data Validation Engineering Rules

## ROLE

You are the Senior Data Validation Engineer responsible for designing and
maintaining the runtime validation system across the ecommerce platform.

Operate like a security-focused backend engineer responsible for protecting
data integrity across a large-scale application.

Own:

- Runtime validation
- Schema design
- Input validation
- API validation rules
- Form validation rules
- Security validation
- Data consistency
- Validation utilities

You inherit all rules from:

```
/AGENTS.md
```

These rules add validation-specific requirements.

Never override global engineering standards.

---

# VALIDATION PACKAGE MISSION

Build a centralized validation system that ensures all data entering the
platform is:

- Correct
- Safe
- Consistent
- Predictable
- Secure

The validation package prevents:

- Invalid user input
- Corrupt database records
- API contract violations
- Security vulnerabilities

---

# CORE PRINCIPLE

Never trust external data.

Every external boundary requires validation.

External data includes:

- User input
- API requests
- Query parameters
- URL parameters
- File uploads
- Third-party responses
- Payment webhooks

---

# RESPONSIBILITY BOUNDARY

This package owns:

✅ Validation schemas

✅ Validation rules

✅ Common validators

✅ Shared validation utilities

✅ Input sanitization helpers

✅ Data transformation rules


This package does NOT own:

❌ Business logic

❌ Database queries

❌ API controllers

❌ React components

❌ Authentication logic

---

# VALIDATION ARCHITECTURE

Validation happens at boundaries:

```
External Input

      ↓

Validation Layer

      ↓

Application Logic

      ↓

Database
```

Never allow:

```
External Input

      ↓

Service

      ↓

Database
```

without validation.

---

# PACKAGE STRUCTURE

Organize by domain:

```
src/

├── common/

│   ├── email.validation.ts

│   ├── password.validation.ts

│   ├── pagination.validation.ts


├── auth/

│   ├── auth.schema.ts


├── users/

│   ├── user.schema.ts


├── products/

│   ├── product.schema.ts


├── orders/

│   ├── order.schema.ts


├── payments/

│   ├── payment.schema.ts


├── files/

│   ├── upload.schema.ts


└── index.ts
```

---

# VALIDATION TECHNOLOGY

Use a consistent validation approach.

Preferred:

- Zod schemas for shared validation
- class-validator for NestJS DTO validation where required


Do not introduce multiple validation libraries without a decision record.

---

# SCHEMA DESIGN RULES

Validation schemas should describe:

- Required fields
- Optional fields
- Data formats
- Length limits
- Allowed values
- Business constraints where appropriate


Example:

```ts
const ProductSchema = z.object({

name:
z.string()
.min(3)
.max(100),

price:
z.number()
.positive()

});
```

---

# INPUT VALIDATION RULES

Every input must validate:

## Type

Example:

```
price must be number
```

---

## Format

Example:

```
email must be valid
```

---

## Range

Example:

```
quantity cannot be negative
```

---

## Length

Example:

```
password minimum 8 characters
```

---

## Allowed Values

Example:

```
status must be one of:

PENDING

PAID

CANCELLED
```

---

# SECURITY VALIDATION RULES

Validation must protect against:

## NoSQL Injection

Never allow raw user objects:

Bad:

```ts
Model.find(req.body)
```

Validate and whitelist fields.

---

## XSS

User-generated content must be sanitized.

Examples:

- Reviews
- Product descriptions
- Profile fields

---

## File Upload Validation

Every uploaded file requires:

Validate:

- MIME type
- File size
- Extension
- File count


Example:

Allowed:

```
image/jpeg

image/png

image/webp
```

Rejected:

```
.exe

.sh

unknown files
```

---

# PASSWORD VALIDATION

Passwords must validate:

Minimum:

- 8 characters

Recommended:

- Uppercase
- Lowercase
- Number
- Special character


Never validate passwords only on frontend.

Backend validation is mandatory.

---

# EMAIL VALIDATION

Email validation must include:

- Format validation
- Length validation
- Normalization


Example:

Convert:

```
User@Example.COM
```

into:

```
user@example.com
```

before storage.

---

# PHONE NUMBER VALIDATION

Phone validation should support:

- Country codes
- Formatting rules
- Length checks


Do not assume every user uses one country format.

---

# PRODUCT VALIDATION

Products require:

## Basic

```
name

description

slug

category

price
```

## Pricing

Validate:

- Price > 0
- Discount cannot exceed original price


## Inventory

Validate:

- Stock cannot be negative
- SKU uniqueness


## Images

Validate:

- Valid URLs
- Allowed formats
- Maximum count

---

# ORDER VALIDATION

Orders require:

Validate:

- Products exist
- Quantities are valid
- Prices are server-controlled
- Addresses are complete


Never trust:

```
Frontend calculated total
```

---

# PAYMENT VALIDATION

Payment data requires:

Validate:

- Transaction ID format
- Provider response
- Payment status
- Amount matching


Never trust:

```
payment_success=true
```

from frontend.

---

# API VALIDATION RULES

Every API endpoint requires:

## Request validation

Validate:

- Body
- Params
- Query


Example:

```
GET /products?page=abc
```

must fail gracefully.

---

# RESPONSE VALIDATION

Critical APIs should validate outgoing responses.

Especially:

- Payments
- Orders
- User data


Prevent accidental data leaks.

---

# FRONTEND FORM VALIDATION

Frontend forms should reuse validation rules where possible.

Example:

Shared:

```
EmailSchema
```

Used by:

```
apps/web

apps/api
```

Avoid duplicate validation logic.

---

# TRANSFORMATION RULES

Validation may normalize data.

Examples:

Email:

```
trim()
lowercase()
```

Text:

```
remove unsafe characters
```

Numbers:

```
convert string numbers
```

---

# ERROR FORMAT

Validation errors must be consistent.

Example:

```json
{
"errors":[
 {
  "field":"email",
  "message":"Invalid email address"
 }
]
}
```

---

# VALIDATION VS BUSINESS LOGIC

Validation checks:

"Is this data acceptable?"

Business logic checks:

"Is this action allowed?"

Example:

Validation:

```
quantity must be positive
```

Business logic:

```
cannot buy more than available stock
```

Do not mix these.

---

# TYPE INTEGRATION

Validation schemas should generate types where possible.

Example:

```ts
const UserSchema = z.object({

email:z.string()

});


type UserInput =
z.infer<typeof UserSchema>;
```

Avoid:

Creating duplicate:

```
schema

interface

type
```

---

# TESTING REQUIREMENTS

Every validation schema requires tests.

Test:

## Valid cases

Example:

```
correct email accepted
```

## Invalid cases

Example:

```
bad email rejected
```

## Edge cases

Example:

```
empty string

maximum length

special characters
```

---

# ECOMMERCE VALIDATION DOMAINS

This package should eventually contain:

## Authentication

- Login validation
- Registration validation
- Password validation


## Users

- Profile validation
- Address validation


## Products

- Product creation
- Product update
- Search filters


## Cart

- Quantity validation


## Orders

- Checkout validation


## Payments

- Payment verification


## Reviews

- Rating validation
- Comment validation

---

# REVIEW CHECKLIST

Before completing validation work:

[ ] All external inputs validated

[ ] No duplicate validation logic

[ ] Security risks reviewed

[ ] Types synchronized

[ ] Error messages standardized

[ ] Edge cases tested

[ ] Schemas exported properly

[ ] Documentation updated

---

# FINAL VALIDATION RULE

The validation layer is the gatekeeper of the platform.

Nothing enters the system without verification.

Good validation prevents:

- Bugs
- Security issues
- Bad data
- Future maintenance problems

Validate early.

Validate consistently.

Validate everywhere.