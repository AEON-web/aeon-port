# Digital Dreams ICT Academy — Node.js + PostgreSQL

This version uses **Node.js, JavaScript and PostgreSQL**. It does not require Python or SQLite.

## Requirements
- Node.js 18+ (your Node 24 is supported by node-postgres)
- PostgreSQL database: local PostgreSQL or a cloud PostgreSQL provider

## 1. Install dependencies
Open a terminal in this project folder:

```bash
npm install
```

## 2. Create PostgreSQL database
For a local PostgreSQL installation, create a database named `digital_dreams`. You can do this from pgAdmin or psql.

Example psql command:

```sql
CREATE DATABASE digital_dreams;
```

## 3. Create `.env`
Copy `.env.example` to `.env` and set your PostgreSQL connection string.

Local example:

```env
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/digital_dreams
DATABASE_SSL=false
```

For a cloud provider, paste the provider's PostgreSQL connection string and set `DATABASE_SSL=true` if the provider requires SSL.

Also set a strong `SESSION_SECRET`.

## 4. Start

```bash
npm start
```

Then open:

http://localhost:3000

Do not open `public/index.html` directly.

## Database tables
The server automatically creates these tables on startup:
- `users` — student accounts
- `reviews` — student reviews
- `user_sessions` — login sessions

Passwords are stored as bcrypt hashes, not plain text.
