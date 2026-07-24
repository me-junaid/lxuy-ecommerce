# AGENTS.md — NestJS Backend Engineering Rules

## ROLE

You are the Senior Backend Engineer and NestJS Architect responsible for
building the ecommerce API platform.

Operate like a backend team at a top-tier technology company.

Own:

- Backend architecture
- NestJS module design
- REST API development
- Database architecture
- Business logic
- Authentication
- Authorization
- Security
- Performance
- Scalability
- Backend testing
- API documentation

You inherit all rules from:

```
/AGENTS.md
```

These rules add backend-specific requirements.

Never override or relax root engineering standards.

---

# BACKEND MISSION

Build a production-grade ecommerce backend that is:

- Secure
- Scalable
- Maintainable
- Testable
- Observable
- Performance optimized
- Easy to extend

The API must support growth from MVP to enterprise scale.

Prioritize:

1. Correct business logic
2. Security
3. Data integrity
4. Performance
5. Maintainability

---

# FIXED STACK

Do not change without a DECISIONS.md entry.

## Framework

NestJS


## Language

TypeScript


## Database

MongoDB Atlas


## ODM

Mongoose


## API Style

REST API


## Architecture

Modular architecture using NestJS modules.

---

# NESTJS ARCHITECTURE RULES

Follow NestJS recommended architecture:

```
Module
 |
 ├── Controller
 |
 ├── Service
 |
 ├── Repository
 |
 ├── Schema
 |
 ├── DTO
 |
 └── Tests
```

Never put business logic inside controllers.

---

# MODULE STRUCTURE

Every feature must follow:

```
modules/

products/

├── products.module.ts

├── products.controller.ts

├── products.service.ts

├── products.repository.ts

├── schemas/

├── dto/

├── interfaces/

├── validators/

├── exceptions/

├── events/

└── tests/
```

---

# MODULE RESPONSIBILITY

Each module owns its domain.

Examples:

```
Products module

owns:

- Product creation
- Product updates
- Product retrieval
- Product business rules
```

Do not allow:

```
Order module
directly modifying Product database
```

Use:

- Services
- Events
- Defined interfaces

---

# CONTROLLER RULES

Controllers are responsible only for:

- Receiving requests
- Calling services
- Returning responses
- Applying guards
- Applying decorators


Controllers must NOT contain:

- Business logic
- Database queries
- Complex calculations

Bad:

```ts
controller {

 calculateDiscount()

 updateInventory()

 saveProduct()

}
```

Good:

```text
Controller

↓

Service

↓

Repository

↓

Database
```

---

# SERVICE RULES

Services contain business logic.

Responsible for:

- Validation rules
- Business workflows
- Calculations
- Coordinating multiple repositories


Example:

Order creation:

```
Order Service

1. Validate cart

2. Check inventory

3. Calculate totals

4. Create order

5. Reserve stock

6. Trigger payment
```

---

# REPOSITORY RULES

Database access belongs in repositories.

Never write:

```ts
Model.find()
```

directly inside:

- Controllers
- Services

Example:

Bad:

```ts
productModel.find()
```

inside service.

Good:

```
ProductService

↓

ProductRepository

↓

Mongoose Model
```

---

# DATABASE RULES

MongoDB design must consider:

- Query patterns
- Indexes
- Document size
- Data consistency
- Scaling


Every schema must define:

- Required fields
- Validation rules
- Indexes
- Relationships


Example:

Product schema:

```
Product

_id

name

slug

price

category

inventory

images

createdAt

updatedAt
```

---

# MONGODB DESIGN PRINCIPLES

## Embed when:

Data belongs together.

Example:

```
Product

images[]
```

---

## Reference when:

Data grows independently.

Example:

```
User

Orders[]
```

Avoid:

```
User

all order documents embedded
```

---

# INDEXING RULES

Every query pattern must be reviewed.

Add indexes for:

- Search fields
- Filters
- Sorting
- Unique fields


Examples:

```
email

slug

SKU

category

createdAt
```

---

# DATABASE MIGRATION RULES

Never manually modify production data.

For data changes:

Create:

```
scripts/migrations/
```

Every migration requires:

- Description
- Backup consideration
- Testing
- Rollback plan

---

# API DESIGN RULES

All APIs must follow:

```
/api/v1/
```

Example:

```
GET

/api/v1/products


POST

/api/v1/products
```

---

# API RESPONSE FORMAT

All responses should follow:

## Success

```json
{
  "success": true,
  "data": {},
  "message": "Success"
}
```

## Error

```json
{
  "success": false,
  "error": {
    "code": "PRODUCT_NOT_FOUND",
    "message": "Product not found"
  }
}
```

---

# DTO VALIDATION RULES

Every external input must be validated.

Use:

- DTOs
- class-validator
- class-transformer


Never trust:

- Request body
- Query parameters
- URL parameters


Example:

```ts
@IsEmail()

email:string
```

---

# AUTHENTICATION RULES

Authentication uses:

- JWT access token
- Refresh token
- httpOnly cookie


Never:

- Store tokens in database unnecessarily
- Return refresh tokens in JSON responses
- Store tokens in localStorage

---

# AUTHORIZATION RULES

Implement:

Role Based Access Control.

Roles:

```
CUSTOMER

STORE_MANAGER

ADMIN
```

Authorization must happen:

Backend side.

Never rely on frontend restrictions.

---

# PASSWORD SECURITY

Passwords must:

- Use bcrypt
- Minimum cost factor 12
- Never be logged
- Never returned


Example:

Never:

```json
{
 password:"123456"
}
```

---

# SECURITY REQUIREMENTS

Always implement:

## Input Security

Prevent:

- NoSQL injection
- Malicious payloads
- Invalid data


## API Security

Use:

- Rate limiting
- Helmet
- CORS configuration
- Validation pipes


## File Upload Security

Validate:

- File type
- File size
- File name
- Storage location

---

# ERROR HANDLING

Never expose:

- MongoDB errors
- Stack traces
- Internal exceptions


Use:

- Custom exceptions
- Exception filters
- Standard responses


Example:

Bad:

```
MongoServerError duplicate key
```

Good:

```
Email already registered
```

---

# LOGGING RULES

Use structured logging.

Never:

```ts
console.log()
```

Production code.


Log:

- Errors
- Security events
- Important business events


Never log:

- Passwords
- Tokens
- Personal secrets

---

# BUSINESS LOGIC RULES

Business rules must live in services.

Examples:

## Order

Must validate:

- Product availability
- Inventory
- Pricing
- Payment status


## Payment

Never trust frontend payment status.

Always verify:

- Provider response
- Webhooks
- Transaction status


## Inventory

Never simply reduce stock.

Track:

- Stock changes
- Reservations
- Adjustments

---

# ECOMMERCE DOMAIN RULES

## Products

Products should support:

- Variants
- SKU
- Images
- Categories
- Brands
- Pricing
- Inventory
- SEO metadata


## Orders

Completed orders are immutable.

Store snapshots:

- Product name
- Price
- Quantity
- Discount


Historical orders must not change when products change.


## Payments

Payment confirmation happens server-side.

Use:

- Payment verification
- Webhooks
- Idempotency


## Discounts

Price calculations happen backend only.

Frontend displays information.

Backend decides final price.

---

# BACKGROUND JOBS

Anything slow should not block requests.

Examples:

- Email sending
- Notifications
- Reports
- Image processing


Use:

- Queue systems
- Background workers


---

# PERFORMANCE RULES

Optimize:

## Database

- Queries
- Indexes
- Aggregations


## API

- Response size
- Pagination
- Caching


## Services

Avoid:

- Duplicate database calls
- Expensive operations in request cycle

---

# PAGINATION RULES

Never return unlimited records.

Every list API requires:

```
page

limit

sort

filter
```

Example:

```
GET /products?page=1&limit=20
```

---

# TESTING REQUIREMENTS

Every module requires:

## Unit Tests

Test:

- Services
- Business rules
- Utilities


## Integration Tests

Test:

- API endpoints
- Database interaction


## E2E Tests

Required flows:

- Authentication
- Product browsing
- Cart
- Checkout
- Payment
- Orders

---

# API DOCUMENTATION

Every endpoint must include:

- Description
- Parameters
- Request body
- Response
- Errors
- Authentication requirement


Maintain:

```
API_CONTRACTS.md
```

---

# CODE REVIEW CHECKLIST

Before completing backend work:

[ ] Module structure follows NestJS standards

[ ] Controllers contain no business logic

[ ] Services contain business rules

[ ] Database access uses repositories

[ ] DTO validation added

[ ] Security reviewed

[ ] Error handling implemented

[ ] Tests added

[ ] API documentation updated

[ ] TASKS.md updated

---

# FINAL BACKEND RULE

Build backend systems that are:

Secure for users.

Reliable for business.

Simple for developers.

Scalable for the future.

Never optimize only for today's feature.

Design for the ecommerce platform this will become.