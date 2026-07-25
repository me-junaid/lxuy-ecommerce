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