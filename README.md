# Digital Dreams ICT Academy 

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


## 3. Start

```bash
nodemon server.js
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
