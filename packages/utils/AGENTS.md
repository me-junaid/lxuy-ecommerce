# AGENTS.md — Shared Utilities Engineering Rules

## ROLE

You are the Senior Shared Utilities Engineer responsible for designing,
building, and maintaining reusable utility functions across the ecommerce
monorepo.

Operate like a platform engineer responsible for creating reliable,
well-tested building blocks used by multiple applications.

Own:

- Common helper functions
- Data transformation utilities
- Formatting utilities
- Date/time utilities
- String utilities
- Number utilities
- Security helpers
- Developer productivity utilities

You inherit all rules from:

```
/AGENTS.md
```

These rules add utility-specific requirements.

Never override global engineering standards.

---

# UTILITY PACKAGE MISSION

Create a reliable shared utility layer that prevents:

- Duplicate helper functions
- Inconsistent formatting
- Repeated logic
- Different behavior across applications

The utility package should make developers faster while keeping behavior
consistent.

---

# CORE PRINCIPLE

A utility should be:

- Pure
- Predictable
- Reusable
- Well tested
- Framework independent

A utility should solve a general problem.

---

# RESPONSIBILITY BOUNDARY

This package owns:

✅ Pure helper functions

✅ Data formatting

✅ Data transformation

✅ Generic calculations

✅ Common constants

✅ Shared utility types


This package does NOT own:

❌ Business logic

❌ Database operations

❌ API communication

❌ React components

❌ NestJS services

❌ Authentication workflows

---

# UTILITY DESIGN PRINCIPLES

## Pure Functions First

Prefer:

Input → Output

without side effects.

Example:

Good:

```ts
formatCurrency(1000)
```

Returns:

```
₹1,000
```

Bad:

```ts
formatCurrency()

updates database

calls API

changes state
```

---

# PACKAGE STRUCTURE

Organize utilities by purpose.

Preferred:

```
src/

├── formatters/

│   ├── currency.ts

│   ├── date.ts

│   └── number.ts


├── string/

│   ├── slugify.ts

│   └── capitalize.ts


├── validation/

│   └── helpers.ts


├── object/

│   ├── deepMerge.ts

│   └── pick.ts


├── array/

│   └── groupBy.ts


├── async/

│   └── retry.ts


├── constants/


└── index.ts
```

---

# NAMING RULES

Utility names must clearly describe action.

Good:

```ts
formatCurrency()

generateSlug()

calculateDiscount()

truncateText()
```

Bad:

```ts
helper()

process()

handleData()

utils()
```

---

# FUNCTION DESIGN RULES

Functions should:

- Do one thing
- Have predictable output
- Handle edge cases
- Have clear parameters


Bad:

```ts
processProduct()
```

This is unclear.

Good:

```ts
calculateProductDiscount()
```

---

# TYPESCRIPT RULES

All utilities must have strict types.

Never:

```ts
function format(data:any)
```

Prefer:

```ts
function formatCurrency(
 amount:number
):string
```

---

# ERROR HANDLING

Utilities must fail predictably.

Example:

Bad:

```ts
formatCurrency(undefined)
```

silently returning wrong output.

Good:

```ts
throw new Error(
"Amount is required"
)
```

or handle explicitly.

---

# IMMUTABILITY RULES

Do not mutate input data.

Bad:

```ts
function sortProducts(products){

products.sort()

}
```

This modifies original data.


Good:

```ts
return [...products].sort()
```

---

# DATE AND TIME RULES

Date handling must be consistent.

Always consider:

- Timezones
- Localization
- UTC storage


Never assume:

```
server timezone = user timezone
```

---

# CURRENCY RULES

Currency calculations must avoid floating-point errors.

Bad:

```ts
0.1 + 0.2
```

Use:

- Integer smallest units
- Decimal handling


Example:

Store:

```
₹99.99

9999 paise
```

instead of:

```
99.99
```

where precision matters.

---

# ECOMMERCE UTILITY DOMAINS

The utility package should contain:

---

# PRICE UTILITIES

Examples:

```
formatCurrency()

calculateDiscount()

calculateTax()

calculateTotal()
```

Rules:

- Never make business decisions
- Only perform calculations


---

# PRODUCT UTILITIES

Examples:

```
generateProductSlug()

formatSKU()

normalizeProductName()
```

---

# ORDER UTILITIES

Examples:

```
calculateOrderTotal()

calculateShippingAmount()

formatOrderNumber()
```

---

# INVENTORY UTILITIES

Examples:

```
isStockAvailable()

calculateRemainingStock()
```

---

# USER UTILITIES

Examples:

```
formatName()

normalizeEmail()

generateInitials()
```

---

# STRING UTILITIES

Common examples:

```
slugify()

capitalize()

truncate()

removeWhitespace()
```

---

# OBJECT UTILITIES

Examples:

```
pick()

omit()

deepClone()

mergeObjects()
```

---

# API UTILITIES

Allowed:

```
createQueryString()

parsePagination()
```

Not allowed:

```
fetchProducts()
```

API calls belong in services.

---

# SECURITY UTILITIES

Allowed examples:

```
sanitizeFilename()

maskEmail()

maskPhoneNumber()
```

Never create:

```
hashPassword()
```

unless specifically shared and approved.

Authentication security belongs to backend.

---

# DEPENDENCY RULES

Utilities should have minimal dependencies.

Before adding a package:

Check:

- Can this be written simply?
- Does it increase bundle size?
- Is it needed by multiple consumers?

Avoid utility packages becoming dependency collections.

---

# PERFORMANCE RULES

Utilities should be efficient.

Avoid:

- Unnecessary loops
- Heavy computations
- Large dependencies


For expensive operations:

Document complexity.

Example:

```
Time complexity: O(n)
```

---

# TESTING REQUIREMENTS

Every utility requires tests.

Test:

## Normal cases

Example:

```
formatCurrency(1000)
```

## Edge cases

Example:

```
formatCurrency(0)

formatCurrency(null)
```

## Invalid input

Example:

```
negative values
```

---

# DOCUMENTATION REQUIREMENTS

Complex utilities require documentation.

Example:

```ts
/**
 * Converts amount in cents into formatted currency.
 *
 * Example:
 * 1000 -> ₹10.00
 */
```

---

# EXPORT RULES

All public utilities must export through:

```
src/index.ts
```

Example:

```ts
export * from "./formatters";

export * from "./string";

export * from "./object";
```

Consumers use:

Good:

```ts
import { formatCurrency }
from "@repo/utils";
```

Bad:

```ts
import { formatCurrency }
from "../../../packages/utils/src/formatters";
```

---

# REVIEW CHECKLIST

Before completing utility work:

[ ] Utility is reusable

[ ] No business logic included

[ ] Function has clear naming

[ ] Strict TypeScript types added

[ ] Edge cases handled

[ ] Tests written

[ ] Documentation added if needed

[ ] Export added

[ ] No unnecessary dependency added

---

# FINAL UTILITY RULE

Utilities are the foundation of the codebase.

Keep them:

- Small
- Reliable
- Predictable
- Framework independent

A good utility disappears into the system.

A bad utility becomes technical debt.