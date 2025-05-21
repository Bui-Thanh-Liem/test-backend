# Backend Project

## Overview

This is a backend application built with **NestJS**, using **TypeORM** for database interaction, **Redis** for caching, and **JWT** for authentication. The project supports product management, user management, catalogs, and authentication with internationalization support for Vietnamese (`vi`) and English (`en`). It includes features like product liking, caching for performance optimization, and modular architecture.

## Setup & Installation Instructions

### Prerequisites

- **Node.js**: Version 18.x or higher
- **MySQL**: Version 8.x or higher
- **Redis**: Version 6.x or higher
- **npm**: Version 8.x or higher

### Installation

1. **Clone the Repository**:

   ```bash
   git clone <repository-url>
   cd backend
   ```

2. **Install Dependencies**:

   ```bash
   npm install
   ```

3. **Configure Environment Variables**:

   - Create a `.env` file for production or `.env.dev` for development in the project root.
   - Example `.env.dev` configuration:
     ```env
     NODE_ENV=development
     DB_HOST=localhost
     DB_PORT=3306
     DB_USERNAME=root
     DB_PASSWORD=your_password
     DB_NAME=your_database
     REDIS_HOST=localhost
     REDIS_PORT=6379
     APP_PORT=9000
     SECRET_ACCESS_KEY=your_jwt_secret
     SECRET_REFRESH_KEY=your_jwt_secret
     ROOT_FULLNAME=your_name
     ROOT_EMAIL=your_name@gmail.com
     ROOT_PASSWORD=your_password
     ```

4. **Set Up the Database and redis**:

   - Ensure MySQL is running.
   - Create a database in MySQL: `CREATE DATABASE your_database;`
   - TypeORM will automatically synchronize the schema based on the entities defined (e.g., `ProductEntity`).
   - Ensure Redis is running.

5. **Build and Run**:

   - Development mode (with watch):
     ```bash
     npm run start:dev
     ```
   - Production mode:
     ```bash
     npm run build
     npm run start:prod
     ```
   - Debug mode:
     ```bash
     npm run start:debug
     ```

6. **Run Tests**:

   - Unit tests:
     ```bash
     npm run test
     ```
   - End-to-end tests:
     ```bash
     npm run test:e2e
     ```
   - Test with coverage:
     ```bash
     npm run test:cov
     ```

7. **Lint and Format**:
   - Format code with Prettier:
     ```bash
     npm run format
     ```
   - Run ESLint to fix linting issues:
     ```bash
     npm run lint
     ```

## API Documentation

The API is documented using **Swagger** and can be accessed at `http://localhost:9000/api` when the application is running. Below is a summary of the key endpoints:

### Authentication

- **POST /auth/login**: Authenticate a user and return a JWT token.
  - Body:
    ```json
    {
      "email": "buithanhliem5073@gmail.com",
      "password": "Admin123@"
    }
    ```
  - Validation:
    - `email`: Required, must be a valid email format.
    - `password`: Required, non-empty string.
  - Response: `{ "user": Omit<UserEntity, 'password'>, "tokens": {"accessToken": string, "refreshToken": string} }`
- **POST /auth/register**: Register a new user.
  - Body:
    ```json
    {
      "fullName": "user1",
      "email": "user1@gmail.com",
      "password": "user1@",
      "passwordConfirm": "user1@"
    }
    ```
  - Validation:
    - `fullName`: Required, must be a string, minimum 2 characters, maximum 50 characters.
    - `email`: Required, must be a valid email format.
    - `password`: Required, non-empty string.
    - `passwordConfirm`: Must match `password`.
  - Response: `UserEntity`
- **POST /auth/logout**: Logout (requires authentication).
  - Headers: `{ "token": string, "refreshToken": string }`
  - Response: `boolean`

### Products

- **GET /products**: Retrieve a paginated list of products.
  - Query Params: `page` (number), `limit` (number), `q` (string),
  - Headers: `{ "accept-language": "vi" | "en" }`
  - Response: `{ "items": ProductEntity[], "totalItems": number }`
- **GET /products/search?q=**: Retrieve a paginated list of products based on search term.
  - Query Params: `page` (number), `limit` (number), `q` (string),
  - Headers: `{ "accept-language": "vi" | "en" }`
  - Response: `{ "items": ProductEntity[], "totalItems": number }`
- **GET /products/:id**: Retrieve a single product by ID.
  - Path Param: `id` (string)
  - Headers: `{ "accept-language": "vi" | "en" }`
  - Response: `ProductEntity`
- **POST /products**: Create a new product (requires authentication).
  - Body:
    ```json
    {
      "name_vi": string,
      "name_en": string,
      "price": number,
      "stock": number,
      "category": string | null,
      "subCategory": string | null
    }
    ```
  - Response: `ProductEntity`
- **PATCH /products/:id**: Update an existing product (requires authentication).
  - Path Param: `id` (string)
  - Body:
    ```json
    {
      "name_vi": string,
      "name_en": string,
      "price": number,
      "category": string | null,
      "subCategory": string | null
    }
    ```
  - Response: `ProductEntity`
- **DELETE /products/:id**: Delete a product (requires authentication).
  - Path Param: `id` (string)
  - Response: `boolean`
- **POST /products/:id/like**: Toggle like/unlike for a product (requires authentication).
  - Path Param: `id` (string)
  - Response: `{ "productId": string, "likesCount": number }`

### Users

- **POST /users**: Create a new user (requires authentication).
  - Body:
    ```json
    {
      "fullName": "user1",
      "email": "user1@gmail.com",
      "password": "user1@",
      "passwordConfirm": "user1@"
    }
    ```
  - Validation:
    - `fullName`: Required, must be a string, minimum 2 characters, maximum 50 characters.
    - `email`: Required, must be a valid email format.
    - `password`: Required, non-empty string.
    - `passwordConfirm`: Must match `password`.
  - Response: `Omit<UserEntity, 'password'>`
- **GET /users**: Retrieve a paginated list of users (requires authentication).
  - Query Params: `page` (number), `limit` (number), `q` (search term)
  - Response: `{ "items": UserEntity[], "totalItems": number }`
- **GET /users/:id**: Retrieve a user by ID (requires authentication).
  - Path Param: `id` (string)
  - Response: `Omit<UserEntity, 'password'>`
- **PATCH /users/:id**: Update an existing user (requires authentication).
  - Path Param: `id` (string)
  - Body: `{ "fullName": string, ... }` (based on `UpdateUserDto`)
  - Response: `Omit<UserEntity, 'password'>`
- **DELETE /users/:id**: Delete a user (requires authentication).
  - Path Param: `id` (string)
  - Response: `boolean`

### Categories

- **POST /categories**: Create a new category (requires authentication).
  - Body:
    ```json
    {
      "name_vi": "Đồng Hồ",
      "name_en": "Watch",
      "description_vi": string,
      "description_en": string,
      "parent": string | null
    }
    ```
  - Validation:
    - `name_vi`: Required, must be a string, minimum 2 characters, maximum 50 characters.
    - `name_en`: Required, must be a string, minimum 2 characters, maximum 50 characters.
    - `description_vi`: Optional, string, maximum 500 characters.
    - `description_en`: Optional, string, maximum 500 characters.
    - `parent`: Optional, string (category ID).
  - Response: `CategoryEntity`
- **GET /categories**: Retrieve a paginated list of categories with internationalization support (requires authentication).
  - Query Params: `page` (number), `limit` (number), `q` (search term)
  - Headers: `{ "accept-language": "vi" | "en" }`
  - Response: `{ "items": CategoryEntity[], "totalItems": number }`
- **GET /categories/:id**: Retrieve a specific category by ID.
  - Path Param: `id` (string)
  - Headers: `{ "accept-language": "vi" | "en" }`
  - Response: `CategoryEntity`
- **PATCH /categories/:id**: Update an existing category (requires authentication).
  - Path Param: `id` (string)
  - Body: `{ "name_vi": string, "name_en": string, "description_vi": string, "description_en": string, "parent": string | null }`
  - Response: `CategoryEntity`
- **DELETE /categories/:id**: Delete a category (requires authentication).
  - Path Param: `id` (string)
  - Response: `boolean`

**Notes**:

- All endpoints except `/auth/login` and `/auth/register` are protected by **JwtAuthGuard** and require a valid JWT stored in an HTTP-only cookie (e.g., `accessToken`),which is automatically sent by the client in the Cookie header for authenticated requests. Clients must include credentials in requests (e.g., `withCredentials`: `true` in HTTP clients).
- The `lang` query parameter or `accept-language` header defaults to `vi` (Vietnamese) if not specified.

## Caching

Caching is implemented to improve performance by reducing database queries for frequently accessed data.

- **Technology**: Uses **Redis** with `@nestjs/cache-manager` and `@keyv/redis` for distributed caching, with a fallback to in-memory caching using `CacheableMemory`.
- **Configuration**:
  - Redis configuration is loaded from environment variables (`REDIS_HOST`, `REDIS_PORT`) via `ConfigService`.
  - In-memory cache has a TTL of 60 seconds and an LRU size of 5000 entries.
- **Implementation**:
  - The `CacheModule` is registered globally in `AppModule` with both in-memory and Redis stores.
  - Cache keys are generated using `generateCacheKeyAll` to include user ID, page, limit, and search query for uniqueness.
  - Cache is used in the `ProductsService` for the `findAll` method to cache product lists.
  - Cache is invalidated (cleared) when products are updated, deleted, or liked/unliked using `deleteCacheByPattern`.
- **TTL**: Cache entries for product lists have a TTL of 180 seconds, with an additional 60 seconds for the key list to ensure cleanup.

## Optimization Strategies

- **Database Queries**:
  - **TypeORM** is used with optimized `SelectQueryBuilder` to select only necessary fields and join related entities (`category`, `subCategory`, `createdBy`, `updatedBy`, `likes`).
  - Pagination is implemented using `skip` and `take` to limit the number of records fetched.
  - Internationalization is handled efficiently by dynamically selecting fields based on the `lang` parameter (`name_vi`, `name_en`, etc.).
- **Compression**: The `compression` middleware is used to reduce the size of HTTP responses.
- **Validation**: Input validation is performed using `class-validator` and `class-transformer` to ensure data integrity.
- **Error Handling**: Custom exceptions (`ConflictException`, `NotFoundException`, `InternalServerErrorException`) provide clear error messages.
- **Logging**: The `Logger` class is used to log cache hits/misses and database queries for debugging.

## Like Feature

The like feature allows authenticated users to like or unlike products, with the following implementation details:

- **Endpoint**: `POST /products/:id/like`
- **Logic**:
  - The `toggleLike` method in `ProductsService` checks if the user has already liked the product.
  - If the user has liked it, the like is removed, and the `numberLike` counter is decremented.
  - If the user has not liked it, the user is added to the `likes` relation, and `numberLike` is incremented.
- **Database**:
  - The `ProductEntity` has a `likes` relation (Many-to-Many with `UserEntity`) and a `numberLike` field to track the total number of likes.
  - Changes are persisted using `productRepository.save`.
- **Cache Invalidation**:
  - After liking or unliking, the cache for the user’s product list is cleared using `deleteCacheByPattern` to ensure updated like counts are reflected.
- **Response**:
  - Returns an object with the `productId` and `likesCount`.

## Project Structure

- **Modules**: Organized into `AuthModule`, `ProductsModule`, `UsersModule`, `CategoriesModule`, and `TokensModule` for modularity.
- **Entities**: Defined using TypeORM (e.g., `ProductEntity` for products).
- **Services**: Business logic is encapsulated in services like `ProductsService`, `UsersService`, and `CategoriesService`.
- **DTOs**: Data Transfer Objects (`CreateProductDto`, `UpdateProductDto`, `CreateUserDto`, `CreateCategoryDto`) ensure structured input validation.
- **Guards and Strategies**: `JwtAuthGuard` and `JwtAuthStrategy` handle JWT-based authentication.

## Author

- **Name**: `Bui Thanh Liem`
- **Email**: `buithanhliem5073@gmail.com`
- **Phone**: `0375255073`
