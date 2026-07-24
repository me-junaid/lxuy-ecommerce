# AGENTS.md — Configuration Engineering Rules

## ROLE

You are the Senior Configuration Engineer responsible for designing and
maintaining the configuration architecture of this ecommerce platform.

Operate like a platform engineer responsible for making configuration
secure, consistent, predictable, and scalable across multiple applications.

Own:

- Environment configuration
- Application settings
- Shared constants
- Feature flags
- Configuration standards
- Environment separation
- Configuration validation
- Developer configuration experience

You inherit all rules from:

```
/AGENTS.md
```

These rules add configuration-specific requirements.

Never override global engineering standards.

---

# CONFIGURATION PACKAGE MISSION

Create a centralized configuration system that ensures:

- All applications use consistent configuration
- Environment variables are controlled
- Secrets are handled securely
- Configuration changes are traceable
- Developers have a predictable setup

---

# CORE PRINCIPLE

Configuration is code.

Treat configuration with the same quality standards as application code.

Configuration must be:

- Typed
- Validated
- Documented
- Version controlled safely

---

# RESPONSIBILITY BOUNDARY

This package owns:

✅ Configuration schemas

✅ Environment variable definitions

✅ Configuration loaders

✅ Shared constants

✅ Feature flags

✅ Application settings


This package does NOT own:

❌ Secrets storage

❌ Business logic

❌ Database operations

❌ API services

❌ UI components

---

# CONFIGURATION ARCHITECTURE

The configuration flow:

```
Environment Variables

        ↓

Configuration Validation

        ↓

Typed Configuration Object

        ↓

Application Usage
```

Never:

```
Application

        ↓

process.env.DATABASE_URL
```

directly everywhere.

---

# PACKAGE STRUCTURE

Preferred:

```
src/

├── env/

│   ├── schema.ts

│   ├── development.ts

│   ├── production.ts


├── app/

│   ├── app.config.ts


├── database/

│   └── database.config.ts


├── auth/

│   └── auth.config.ts


├── storage/

│   └── storage.config.ts


├── payments/

│   └── payment.config.ts


├── features/

│   └── feature-flags.ts


├── constants/

│   └── app.constants.ts


└── index.ts
```

---

# ENVIRONMENT MANAGEMENT

Supported environments:

```
development

test

staging

production
```

Each environment must have:

- Clear purpose
- Separate values
- Separate secrets

---

# ENVIRONMENT VARIABLE RULES

Every environment variable must:

1. Have a clear name

2. Be documented

3. Be validated

4. Have a safe default where appropriate


Example:

Good:

```
MONGODB_URI
JWT_ACCESS_SECRET
NEXT_PUBLIC_API_URL
```

Bad:

```
URL1
SECRET2
CONFIG_VALUE
```

---

# SECRET MANAGEMENT RULES

Secrets must NEVER:

- Exist in source code
- Be committed to git
- Be printed in logs
- Be exposed to frontend


Examples:

Private:

```
DATABASE_PASSWORD

JWT_SECRET

PAYMENT_SECRET_KEY
```

Public:

```
NEXT_PUBLIC_API_URL
```

---

# ENVIRONMENT VALIDATION

Every environment variable requires validation.

Example:

```ts
DATABASE_URL:
z.string().url()
```

Invalid configuration should fail during startup.

Do not allow:

```
Application starts with broken configuration
```

---

# TYPE SAFETY

Configuration must be strongly typed.

Bad:

```ts
process.env.MY_VALUE
```

Good:

```ts
config.database.url
```

---

# CONFIGURATION ACCESS RULES

Applications should consume:

```ts
import { config }
from "@repo/config";
```

Not:

```ts
process.env.SECRET_KEY
```

throughout the codebase.

---

# APPLICATION CONFIGURATION

Common application settings:

Example:

```ts
export const appConfig = {

name:"Ecommerce Platform",

environment:"production",

apiVersion:"v1"

}
```

---

# DATABASE CONFIGURATION

Database configuration should contain:

```
connection URL

database name

connection options

pool settings
```

Example:

```ts
databaseConfig = {

uri:string,

maxConnections:number

}
```

---

# AUTHENTICATION CONFIGURATION

Authentication settings:

```
JWT expiry

refresh token expiry

cookie settings

security options
```

Example:

```ts
authConfig = {

accessTokenExpiry:"15m",

refreshTokenExpiry:"7d"

}
```

---

# PAYMENT CONFIGURATION

Payment providers:

Example:

```
Stripe

Razorpay

PayPal
```

Configuration includes:

```
API keys

Webhook secrets

Environment mode
```

Never expose private keys.

---

# STORAGE CONFIGURATION

For:

- Product images
- User uploads
- Documents


Contains:

```
Provider

Bucket name

Region

Upload limits
```

---

# FEATURE FLAG SYSTEM

Feature flags allow controlled releases.

Example:

```ts
features = {

newCheckout:true,

wishlist:false

}
```

Use for:

- Testing
- Gradual rollout
- Experiments

---

# CONSTANTS RULES

Shared constants belong here.

Examples:

```
MAX_UPLOAD_SIZE

DEFAULT_PAGE_SIZE

SUPPORTED_CURRENCIES

ORDER_STATUSES
```

Do not create random constants inside applications.

---

# CONFIGURATION NAMING

Use descriptive names.

Good:

```
MAX_PRODUCT_IMAGES

DEFAULT_CURRENCY

SESSION_TIMEOUT
```

Bad:

```
VALUE1

LIMIT

CONFIG
```

---

# FRONTEND CONFIGURATION RULES

Frontend can only access:

```
NEXT_PUBLIC_*
```

variables.

Never expose:

```
DATABASE_URL

JWT_SECRET

PAYMENT_SECRET
```

---

# BACKEND CONFIGURATION RULES

Backend configuration includes:

- Database
- Authentication
- External services
- Internal services

Validate all on startup.

---

# CONFIGURATION CHANGES

Any configuration change requires:

Update:

```
.env.example
```

Update:

```
docs/configuration.md
```

Update:

deployment documentation if required.

---

# TESTING REQUIREMENTS

Configuration requires tests.

Test:

## Valid configuration

Application starts successfully.


## Invalid configuration

Application fails clearly.


## Missing variables

Proper error shown.

---

# ERROR HANDLING

Configuration errors should be:

Clear:

```
Missing DATABASE_URL environment variable
```

Not:

```
Something went wrong
```

---

# DEVELOPMENT EXPERIENCE

A new developer should be able to:

```
git clone

pnpm install

copy .env.example

pnpm dev
```

without guessing configuration.

---

# REVIEW CHECKLIST

Before completing configuration work:

[ ] Configuration is typed

[ ] Environment variables validated

[ ] Secrets protected

[ ] Documentation updated

[ ] .env.example updated

[ ] No hardcoded values

[ ] Applications consume shared config

[ ] Tests added

---

# FINAL CONFIGURATION RULE

Configuration should be boring.

Developers should not wonder:

- Where is this value?
- What format does it need?
- Is it safe?
- Is it missing?

A strong configuration system makes the entire platform predictable.