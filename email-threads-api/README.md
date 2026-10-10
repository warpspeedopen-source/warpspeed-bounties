# Email Threads API

A thread-first Email Threads API built with Node.js, TypeScript, Express, and Prisma.

## Features

- **Thread-first architecture**: Work with conversations instead of isolated messages
- **List threads**: Paginated thread listing with snippets and draft indicators
- **Open thread**: View thread metadata with related messages in chronological order
- **Search & filter**: Full-text search with thread grouping and matched message highlighting
- **Draft management**: Create, update, and send drafts within the correct conversation
- **Access control**: Thread-level participant authorization and draft privacy
- **Swagger documentation**: Interactive API documentation at `/api-docs`
- **Jest tests**: Comprehensive unit tests for business logic
- **Prisma ORM**: PostgreSQL persistence with Prisma (or in-memory for development)

## Tech Stack

- **Runtime**: Node.js
- **Language**: TypeScript
- **Framework**: Express
- **ORM**: Prisma (PostgreSQL)
- **Testing**: Jest
- **Documentation**: Swagger/OpenAPI
- **Validation**: Built-in TypeScript types

## Project Structure

```
src/
├── models/              # Domain models (interfaces, types)
├── errors/              # API error classes
├── repositories/        # Data access layer
│   ├── thread.repository.ts       # In-memory implementation
│   └── prisma-thread.repository.ts # Prisma/PostgreSQL implementation
├── services/            # Business logic layer
├── controllers/         # Request handlers
├── routes/              # Route definitions
├── middleware/          # Auth, error handling
├── config/              # Swagger configuration
├── app.ts               # Express app setup
└── server.ts            # Server entry point
test/                    # Jest tests
prisma/                  # Prisma schema and seed
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+
- PostgreSQL (optional, for production persistence)

### Installation

```bash
npm install
```

### Database Setup (Optional)

The API can run with either:
1. **In-memory repository** (default, no database required) - for development and testing
2. **Prisma/PostgreSQL** - for production persistence

To use PostgreSQL:

```bash
# 1. Set DATABASE_URL in .env
cp .env.example .env
# Edit .env and set DATABASE_URL

# 2. Generate Prisma client
npm run prisma:generate

# 3. Run migrations
npm run prisma:migrate

# 4. (Optional) Seed database with test data
npm run prisma:seed
```

### Running the Server

```bash
# Development mode (with hot reload)
npm run dev

# Development mode (ts-node)
npm run start:dev

# Production mode
npm run build
npm start
```

The server will start at `http://localhost:3000`.

### API Documentation

Swagger documentation is available at `http://localhost:3000/api-docs`.

## API Endpoints

### Threads

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/threads` | List threads for the authenticated user |
| GET | `/api/v1/threads/search` | Search/filter messages grouped by thread |
| GET | `/api/v1/threads/:id` | Open a thread with related messages |
| POST | `/api/v1/threads/:id/drafts` | Create or update a draft |
| POST | `/api/v1/drafts/:id/send` | Send a previously saved draft |

### Other

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/api-docs` | Swagger documentation |

## Authentication

All API endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer <your-token>
```

For development with the in-memory repository, you can issue tokens programmatically:

```typescript
import { InMemoryThreadRepository } from "./src/repositories";
const repo = new InMemoryThreadRepository();
repo.issueToken("user-id", "your-token");
```

For PostgreSQL, tokens are stored in the `Token` table.

## Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:cov
```

## Scripts

| Script | Description |
|--------|-------------|
| `npm run build` | Compile TypeScript to JavaScript |
| `npm start` | Start production server |
| `npm run start:dev` | Start development server (ts-node) |
| `npm run dev` | Start development server (nodemon) |
| `npm test` | Run Jest tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:cov` | Run tests with coverage |
| `npm run lint` | Run ESLint |
| `npm run prisma:generate` | Generate Prisma client |
| `npm run prisma:migrate` | Run database migrations |
| `npm run prisma:deploy` | Deploy migrations to production |
| `npm run prisma:studio` | Open Prisma Studio |
| `npm run prisma:seed` | Seed database with test data |
| `npm run db:setup` | Setup database (generate + migrate) |

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `NODE_ENV` | Environment | `development` |
| `DATABASE_URL` | PostgreSQL connection string | Not set (uses in-memory) |
| `JWT_SECRET` | JWT signing secret | Not set |
| `CORS_ORIGIN` | CORS allowed origin | `*` |

## License

MIT

## Bounty

This project was developed for the [$750 Email Threads API bounty](https://github.com/warpspeedopen-source/warpspeed-bounties/issues/4).
