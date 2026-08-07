# API Contracts

This file defines the request and response shapes, validation rules, and error codes for the API endpoints.

---

## Authentication Service (`/api/v1/auth`)

### 1. Register User
Creates a new customer account.

* **Endpoint:** `POST /api/v1/auth/register`
* **Headers:** 
  * `Content-Type: application/json`
* **Request Body:**
  ```json
  {
    "email": "customer@example.com",
    "password": "Password123!",
    "firstName": "John",
    "lastName": "Doe"
  }
  ```
* **Validation Rules:**
  * `email`: Must be a valid email string, lowercased.
  * `password`: Minimum 8 characters, at least 1 uppercase, 1 lowercase, 1 number, and 1 special character.
  * `firstName`: String, min 2, max 50 characters.
  * `lastName`: String, min 2, max 50 characters.
* **Success Response (`201 Created`):**
  ```json
  {
    "id": "60d0fe4f5311236168a109ca",
    "email": "customer@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "customer",
    "isActive": true,
    "createdAt": "2026-07-23T23:44:36Z"
  }
  ```
* **Error Responses:**
  * `400 Bad Request` (Validation errors, e.g., weak password, invalid email format).
  * `409 Conflict` (Email already registered).

---

### 2. Login User
Authenticates a user and sets a secure cookie.

* **Endpoint:** `POST /api/v1/auth/login`
* **Headers:** 
  * `Content-Type: application/json`
* **Request Body:**
  ```json
  {
    "email": "customer@example.com",
    "password": "Password123!"
  }
  ```
* **Success Response (`200 OK`):**
  * **Headers:**
    * `Set-Cookie: refreshToken=<token>; HttpOnly; Secure; SameSite=Strict; Path=/api/v1/auth/refresh; Max-Age=604800`
  * **Body:**
    ```json
    {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "user": {
        "id": "60d0fe4f5311236168a109ca",
        "email": "customer@example.com",
        "firstName": "John",
        "lastName": "Doe",
        "role": "customer"
      }
    }
    ```
* **Error Responses:**
  * `401 Unauthorized` (Invalid credentials).

---

### 3. Refresh Access Token
Issues a new short-lived access token using the httpOnly refresh token.

* **Endpoint:** `POST /api/v1/auth/refresh`
* **Headers:**
  * `Cookie: refreshToken=<token>`
* **Success Response (`200 OK`):**
  * **Headers:**
    * `Set-Cookie: refreshToken=<new-token>; HttpOnly; Secure; SameSite=Strict; Path=/api/v1/auth/refresh; Max-Age=604800`
  * **Body:**
    ```json
    {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "user": {
        "id": "60d0fe4f5311236168a109ca",
        "email": "customer@example.com",
        "firstName": "John",
        "lastName": "Doe",
        "role": "customer"
      }
    }
    ```
* **Error Responses:**
  * `401 Unauthorized` (Invalid, missing, or expired refresh token).

---

### 4. Logout User
Invalidates the current session and clears the refresh token cookie.

* **Endpoint:** `POST /api/v1/auth/logout`
* **Headers:**
  * `Cookie: refreshToken=<token>`
* **Success Response (`200 OK`):**
  * **Headers:**
    * `Set-Cookie: refreshToken=; HttpOnly; Secure; SameSite=Strict; Path=/api/v1/auth/refresh; Max-Age=0`
  * **Body:**
    ```json
    {
      "message": "Logged out successfully"
    }
    ```

---

### 5. Get Current User Profile
Retrieves details of the currently authenticated user.

* **Endpoint:** `GET /api/v1/auth/me`
* **Headers:**
  * `Authorization: Bearer <accessToken>`
* **Success Response (`200 OK`):**
  * **Body:**
    ```json
    {
      "_id": "60d0fe4f5311236168a109ca",
      "email": "customer@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "customer",
      "isActive": true,
      "createdAt": "2026-07-23T23:44:36Z"
    }
    ```
* **Error Responses:**
  * `401 Unauthorized` (Invalid, missing, or expired access token).

---

## Orders Service (`/api/v1/orders`)

### 1. Place a New Order
Creates a new order from the authenticated user's current shopping cart and clears the cart on success.

* **Endpoint:** `POST /api/v1/orders`
* **Headers:**
  * `Authorization: Bearer <accessToken>`
  * `Content-Type: application/json`
* **Request Body:**
  ```json
  {
    "shippingAddress": {
      "email": "customer@example.com",
      "phone": "+919876543210",
      "firstName": "John",
      "lastName": "Doe",
      "street": "123 luxury lane",
      "apartment": "Suite 4B",
      "city": "Mumbai",
      "state": "Maharashtra",
      "zip": "400001",
      "country": "India"
    },
    "paymentMethod": "card",
    "couponCode": "LUXURY20"
  }
  ```
* **Success Response (`201 Created`):**
  ```json
  {
    "_id": "60d0fe4f5311236168a109cb",
    "user": "60d0fe4f5311236168a109ca",
    "items": [
      {
        "product": "60d0fe4f5311236168a109cc",
        "sku": "LS-COAT-WOOL-L",
        "name": "Classic Wool Trench Coat",
        "price": 890,
        "quantity": 1,
        "_id": "60d0fe4f5311236168a109cd"
      }
    ],
    "shippingAddress": {
      "email": "customer@example.com",
      "phone": "+919876543210",
      "firstName": "John",
      "lastName": "Doe",
      "street": "123 luxury lane",
      "apartment": "Suite 4B",
      "city": "Mumbai",
      "state": "Maharashtra",
      "zip": "400001",
      "country": "India"
    },
    "pricing": {
      "subtotal": 890,
      "discount": 178,
      "shippingFee": 0,
      "tax": 128.16,
      "total": 840.16
    },
    "payment": {
      "method": "card",
      "status": "paid"
    },
    "status": "pending",
    "createdAt": "2026-08-07T13:24:00Z",
    "updatedAt": "2026-08-07T13:24:00Z"
  }
  ```
* **Error Responses:**
  * `400 Bad Request` (Empty cart, invalid payload, or insufficient stock).
  * `401 Unauthorized` (Missing or invalid access token).

---

### 2. Get Current User Orders
Retrieves all historical orders placed by the currently logged-in user, sorted newest first.

* **Endpoint:** `GET /api/v1/orders`
* **Headers:**
  * `Authorization: Bearer <accessToken>`
* **Success Response (`200 OK`):**
  ```json
  [
    {
      "_id": "60d0fe4f5311236168a109cb",
      "pricing": {
        "subtotal": 890,
        "discount": 178,
        "shippingFee": 0,
        "tax": 128.16,
        "total": 840.16
      },
      "payment": {
        "method": "card",
        "status": "paid"
      },
      "status": "pending",
      "createdAt": "2026-08-07T13:24:00Z"
    }
  ]
  ```

---

### 3. Get Order Details
Retrieves full details of a specific order by ID. The user must be the owner of the order or have admin privileges.

* **Endpoint:** `GET /api/v1/orders/:id`
* **Headers:**
  * `Authorization: Bearer <accessToken>`
* **Success Response (`200 OK`):**
  ```json
  {
    "_id": "60d0fe4f5311236168a109cb",
    "user": "60d0fe4f5311236168a109ca",
    "items": [
      {
        "product": {
          "_id": "60d0fe4f5311236168a109cc",
          "name": "Classic Wool Trench Coat",
          "slug": "classic-wool-trench-coat",
          "images": ["/images/models/modules2.jpeg"]
        },
        "sku": "LS-COAT-WOOL-L",
        "name": "Classic Wool Trench Coat",
        "price": 890,
        "quantity": 1
      }
    ],
    "shippingAddress": { ... },
    "pricing": { ... },
    "payment": { ... },
    "status": "pending",
    "createdAt": "2026-08-07T13:24:00Z"
  }
  ```
* **Error Responses:**
  * `401 Unauthorized` (Missing or invalid access token).
  * `403 Forbidden` (Trying to view another user's order).
  * `404 Not Found` (Order ID not found).