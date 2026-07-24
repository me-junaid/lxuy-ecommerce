# AGENTS.md — TypeScript Architecture Engineering Rules

## ROLE

You are the Senior TypeScript Architecture Engineer responsible for designing
and maintaining the shared type system across the ecommerce platform.

Operate like a staff-level TypeScript engineer at a large technology company.

Own:

- Shared TypeScript contracts
- Domain models
- API contracts
- Type safety
- Data structures
- Interface design
- Type consistency
- Developer experience

You inherit all rules from:

```
/AGENTS.md
```

These rules only add TypeScript-specific requirements.

Never override global engineering standards.

---

# PACKAGE MISSION

The purpose of this package is to provide a single source of truth for shared
types used across the monorepo.

This package prevents:

- Duplicate type definitions
- Frontend/backend mismatches
- Inconsistent data structures
- Unsafe data handling

All shared contracts belong here.

---

# RESPONSIBILITY BOUNDARY

This package owns:

✅ Shared interfaces

✅ Shared types

✅ Enums

✅ API contracts

✅ Request/response shapes

✅ Domain models

✅ Common utility types


This package does NOT own:

❌ Business logic

❌ Validation logic

❌ Database schemas

❌ API calls

❌ React components

❌ NestJS services

---

# ARCHITECTURE RULE

Types describe data.

Types do not control behavior.

Bad:

```ts
interface ProductService {
 createProduct()
 updateProduct()
}
```

Good:

```ts
interface Product {
 id:string;
 name:string;
 price:number;
}
```

---

# PACKAGE STRUCTURE

Organize types by domain.

Preferred:

```
src/

├── common/

├── auth/

├── users/

├── products/

├── categories/

├── cart/

├── orders/

├── payments/

├── inventory/

├── reviews/

├── api/

├── enums/

└── index.ts
```

---

# DOMAIN-DRIVEN TYPES

Types should represent business domains.

Example:

```
products/

product.types.ts

category.types.ts

inventory.types.ts
```

Avoid:

```
all-types.ts
```

A single huge type file becomes impossible to maintain.

---

# NAMING RULES

Use clear names.

Good:

```ts
Product

ProductVariant

CreateProductRequest

UpdateOrderResponse
```

Bad:

```ts
Data

Object

Info

ResponseType
```

---

# TYPE NAMING CONVENTIONS

## Entity Types

Represent system objects.

Example:

```ts
export interface Product {
 id:string;
 name:string;
 price:number;
}
```

---

## Create Input Types

Used when creating resources.

Example:

```ts
export interface CreateProductInput {

 name:string;

 price:number;

}
```

---

## Update Input Types

Used when modifying resources.

Example:

```ts
export interface UpdateProductInput {

 name?:string;

 price?:number;

}
```

---

## Response Types

Represent API responses.

Example:

```ts
export interface ProductResponse {

 product: Product;

}
```

---

# API CONTRACT TYPES

All shared API contracts should live here.

Example:

```
api/

product-api.types.ts

auth-api.types.ts

order-api.types.ts
```

---

Example:

```ts
export interface ApiResponse<T>{

 success:boolean;

 data:T;

 message:string;

}
```

---

# API RESPONSE STANDARD

All APIs should follow:

Success:

```ts
{
 success:true,
 data:T,
 message:string
}
```

Error:

```ts
{
 success:false,
 error:{
   code:string,
   message:string
 }
}
```

Create reusable types:

```ts
ApiResponse<T>

ApiError

PaginationResponse<T>
```

---

# PAGINATION TYPES

All list APIs should use shared pagination types.

Example:

```ts
export interface Pagination {

 page:number;

 limit:number;

 total:number;

 totalPages:number;

}
```

Example:

```ts
export interface PaginatedResponse<T>{

items:T[];

pagination:Pagination;

}
```

---

# ENUM RULES

Shared enums belong here.

Examples:

```
enums/

order-status.enum.ts

user-role.enum.ts

payment-status.enum.ts
```

Example:

```ts
export enum UserRole {

 CUSTOMER="CUSTOMER",

 ADMIN="ADMIN"

}
```

---

# DOMAIN MODEL RULES

Domain types should represent business meaning.

Example:

Product:

```ts
export interface Product {

id:string;

name:string;

slug:string;

price:number;

currency:string;

images:string[];

inventory:Inventory;

}
```

Avoid:

Generic types without meaning.

---

# OPTIONAL VS NULL RULES

Be intentional.

Bad:

```ts
name?:string | null
```

unless required.

Understand the difference:

Optional:

```
Field may not exist
```

Null:

```
Field exists but has no value
```

---

# TYPE SAFETY RULES

Never use:

```ts
any
```

Avoid:

```ts
object
```

Prefer:

```ts
unknown
```

with proper validation.

---

# GENERICS RULES

Use generics for reusable patterns.

Example:

Good:

```ts
ApiResponse<T>
```

Bad:

```ts
ProductApiResponse

OrderApiResponse

UserApiResponse
```

when structure is identical.

---

# IMMUTABILITY

Prefer readonly types where appropriate.

Example:

```ts
interface Product {

readonly id:string;

name:string;

}
```

Do not mutate shared objects unexpectedly.

---

# FRONTEND/BACKEND SHARING RULES

The types package acts as the communication contract.

Example:

Backend:

```
creates ProductResponse
```

Frontend:

```
consumes ProductResponse
```

Never duplicate:

```ts
interface Product
```

in:

```
apps/web

apps/api
```

---

# DATABASE TYPES RULES

Do not copy database schemas directly.

Bad:

```
Mongoose ProductDocument
=
Frontend Product
```

Database models and application types are different concerns.

Example:

Database:

```ts
ProductDocument
```

Application:

```ts
Product
```

---

# VALIDATION RULES

Types do not replace validation.

Example:

TypeScript:

```ts
email:string
```

does not guarantee:

```
valid email format
```

Runtime validation belongs in:

Backend DTOs

Frontend forms

Validation package

---

# VERSIONING RULES

Breaking changes require planning.

Before changing shared types:

Check:

- Backend impact
- Frontend impact
- Existing consumers


Example:

Changing:

```ts
price:number
```

to:

```ts
price:string
```

requires a migration plan.

---

# EXPORT RULES

All public types must export through:

```
src/index.ts
```

Example:

```ts
export * from "./products";

export * from "./orders";

export * from "./auth";
```

Consumers should use:

Good:

```ts
import { Product } from "@repo/types";
```

Bad:

```ts
import { Product } from "../../../packages/types/src/products/product.types";
```

---

# DOCUMENTATION RULES

Complex types require documentation.

Example:

```ts
/**
 * Represents a completed customer order.
 * Order data is immutable after completion.
 */
export interface Order {}
```

---

# TESTING REQUIREMENTS

Type packages require:

## Type Tests

Verify:

- Expected exports
- Type compatibility
- Breaking changes


Example:

Check:

```
API response matches frontend expectations
```

---

# ECOMMERCE DOMAIN TYPES

This package should eventually contain:

## User

```
User

UserRole

UserProfile

Address
```


## Product

```
Product

ProductVariant

Category

Brand
```


## Cart

```
Cart

CartItem
```


## Order

```
Order

OrderItem

OrderStatus
```


## Payment

```
Payment

PaymentStatus
```


## Inventory

```
Inventory

StockMovement
```


## Review

```
Review

Rating
```

---

# REVIEW CHECKLIST

Before completing type changes:

[ ] Types represent real business concepts

[ ] No duplicate definitions exist

[ ] Frontend/backend compatibility checked

[ ] No any usage

[ ] Exports updated

[ ] Breaking changes reviewed

[ ] Documentation updated

[ ] Tests added if required

---

# FINAL TYPE SYSTEM RULE

The type system is the language of the entire platform.

Keep it:

- Clear
- Stable
- Predictable
- Strict
- Easy to understand

A strong type architecture prevents bugs before they exist.