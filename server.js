require("dotenv").config();

const express = require("express");
const session = require("express-session");
const pgSession = require("connect-pg-simple")(session);
const { Pool } = require("pg");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const path = require("path");
const { link } = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;

if (!process.env.DATABASE_URL) {
  console.error(
    "DATABASE_URL is missing. Create a .env file and add your PostgreSQL connection string.",
  );
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    String(process.env.DATABASE_SSL || "false") === "true"
      ? { rejectUnauthorized: false }
      : false,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

pool.query("SELECT current_database(), current_user")
  .then(result => {
    console.log("PostgreSQL connected:", result.rows[0]);
  })
  .catch(error => {
    console.error("PostgreSQL connection failed:", error.message);
  });

pool.on("error", (error) => {
  console.error("Unexpected PostgreSQL pool error:", error.message);
});

const courses = [
  "Data Science",
  "Graphics Design",
  "Sage 50 Accounting",
  "JavaScript",
  "STAAD Pro",
  "AutoCAD",
  "ArchiCAD",
  "Data Analysis",
  "Cyber Security",
  "SPSS",
  "Product Design (UI/UX Design)",
  "Lumion",
  "Video Editing",
  "Node JS",
  "Motion Graphics",
  "Animations",
  "Web Design",
  "PHP/MySQL",
  "Computer Basics",
  "Flutter",
  "Digital Marketing",
  "Python",
  "Android SDK & JAVA",
  "Project Management",
];

const projects = [
  {
    title: "Student Portfolio Website",
    category: "Web Design",
    description:
      "A responsive portfolio website created during practical training.",
    link:"https://aeon-web.github.io/aeon/",
    image: "assets/projects/web-project.svg",
  },
  {
    title: "Email Verifier",
    category: "UI Design",
    description:
      "Email Verifier is a web-based email validation platform designed to verify email addresses,detect invalid entries ,and help users maintain clean and reliable email databases.",
    link: "https://dev-nexus-lrmh.onrender.com",
    image: "assets/projects/email.jpg",
    
  },
  {
    title: "Color Game",
    category: "Web Devlopment",
    description:
      "An interactive web-based Color Guessing Game built using Node.js and Express.By guessing the correct visual color based on a randomly generated RGB or HEX code..",
      link:"https://charliecos250606.github.io/A-Color-Game/",
    image: "assets/projects/color.jpg",
  },
  {
    title: "Exchange Rate Site",
    category: "Web Design",
    description:
      "Dynamic Exchange Matrix: Seamlessly shifts calculations across global base currencies (USD, EUR, GBP, AUD, CAD) using an interactive HTML dropdown interface.",
      link:"https://aeondev.onrender.com/",
    image: "assets/projects/xchange.jpg",
  },
  {
    title: "Calculator Page",
    category: "App Development",
    description: "A clean, full-stack Web Calculator built using Node.js and Express. This application handles standard arithmetic operations through a backend API,.",
    link:"https://charliecos250606.github.io/calculator/",
    image: "assets/projects/app-dev.jpg",
  },
  {
    title: "Data Analysis Dashboard",
    category: "Data Anaysis",
    description: "A responsive, data-driven Web Dashboard built using Node.js and Express. This application aggregates real-time metrics, and system analytics control panel.",
    link:"https://charliecos250606.github.io/Recurhost-dashboard/",
    image: "assets/projects/data-project.svg",
  },
];

const transporter =
  process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS
    ? nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 465),
        secure: String(process.env.SMTP_SECURE || "true") === "true",
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      })
    : null;

async function sendEmail(options) {
  if (!transporter) {
    console.log(
      options.subject,
    );
    return;
  }
  try {
    await transporter.sendMail(options);
  } catch (error) {
    console.error("[Nodemailer] Email failed:", error.message);
  }
}

async function initDatabase() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      phone TEXT DEFAULT '',
      course TEXT DEFAULT '',
      password_hash TEXT NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
      text TEXT NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);
  console.log("PostgreSQL database ready.");
}

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    store: new pgSession({
      pool,
      tableName: "user_sessions",
      createTableIfMissing: true,
    }),
    secret: process.env.SESSION_SECRET || "development-only-change-me",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      maxAge: 1000 * 60 * 60 * 24 * 7,
    },
  }),
);
app.use(express.static(path.join(__dirname, "public")));

function requireAuth(req, res, next) {
  if (!req.session.user)
    return res.status(401).json({ message: "Please log in first." });
  next();
}

function publicUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    course: user.course,
    created_at: user.created_at,
  };
}

app.get("/api/courses", (req, res) => res.json(courses));
app.get("/api/projects", (req, res) => res.json(projects));

app.get("/api/me", async (req, res) => {
  if (!req.session.user) return res.json({ loggedIn: false });
  try {
    const result = await pool.query(
      "SELECT id, name, email, phone, course, created_at FROM users WHERE id = $1",
      [req.session.user.id],
    );
    if (!result.rows[0]) {
      return req.session.destroy(() => res.json({ loggedIn: false }));
    }
    res.json({ loggedIn: true, user: publicUser(result.rows[0]) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Database error." });
  }
});

app.post("/api/register", async (req, res) => {
  const { name, email, phone, course, password } = req.body;
  if (!name || !email || !password) {
    return res
      .status(400)
      .json({ message: "Name, email and password are required." });
  }
  if (String(password).length < 6) {
    return res
      .status(400)
      .json({ message: "Password must be at least 6 characters." });
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  try {
    const existing = await pool.query("SELECT id FROM users WHERE email = $1", [
      normalizedEmail,
    ]);
    if (existing.rows[0])
      return res
        .status(409)
        .json({ message: "An account with this email already exists." });

    const hash = await bcrypt.hash(String(password), 12);
    const result = await pool.query(
      `INSERT INTO users (name, email, phone, course, password_hash)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, email, phone, course, created_at`,
      [
        String(name).trim(),
        normalizedEmail,
        String(phone || "").trim(),
        String(course || "").trim(),
        hash,
      ],
    );
    const user = result.rows[0];
    req.session.user = { id: user.id };

    await sendEmail({
      from: process.env.SMTP_USER || "no-reply@digitaldreams.local",
      to: process.env.ACADEMY_EMAIL || process.env.SMTP_USER,
      subject: `New registration — ${user.name}`,
      text: `New Digital Dreams ICT Academy registration.\n\nName: ${user.name}\nEmail: ${normalizedEmail}\nPhone: ${user.phone || "Not supplied"}\nCourse: ${user.course || "Not selected"}`,
    });

    await sendEmail({
      from: process.env.SMTP_USER || "no-reply@digitaldreams.local",
      to: normalizedEmail,
      subject: "Welcome to Digital Dreams ICT Academy",
      text: `Hello ${user.name},\n\nYour Digital Dreams ICT Academy account has been created successfully.\n\nCourse: ${user.course || "Not selected"}\n\nWe look forward to supporting your ICT journey.`,
    });

    res
      .status(201)
      .json({
        message:
          "Registration successful! Welcome to Digital Dreams ICT Academy.",
      });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Registration failed. Please try again." });
  }
});

app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res
      .status(400)
      .json({ message: "Email and password are required." });

  try {
    const normalizedEmail = String(email).trim().toLowerCase();
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [
      normalizedEmail,
    ]);
    const user = result.rows[0];
    if (
      !user ||
      !(await bcrypt.compare(String(password), user.password_hash))
    ) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    req.session.user = { id: user.id };
    res.json({ message: `Welcome back, ${user.name}!` });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Login failed. Please try again." });
  }
});

app.post("/api/logout", (req, res) => {
  req.session.destroy(() => res.json({ message: "Logged out successfully." }));
});

app.post("/api/contact", async (req, res) => {
  const { name, email, phone, course, message } = req.body;
  if (!name || !email)
    return res.status(400).json({ message: "Name and email are required." });

  await sendEmail({
    from: process.env.SMTP_USER || "no-reply@digitaldreams.local",
    to: process.env.ACADEMY_EMAIL || process.env.SMTP_USER,
    replyTo: email,
    subject: `Website enquiry — ${name}`,
    text: `Website enquiry from Digital Dreams ICT Academy site.\n\nName: ${name}\nEmail: ${email}\nPhone: ${phone || ""}\nCourse: ${course || ""}\nMessage: ${message || ""}`,
  });

  res.json({
    message: "Message received successfully. The academy will get back to you.",
  });
});

 app.get("/api/reviews", async (req, res) => {
   try {
     const result = await pool.query(`
       SELECT r.id, r.rating, r.text, r.created_at, u.name
       FROM reviews r
       JOIN users u ON u.id = r.user_id
       ORDER BY r.id DESC
       LIMIT 12
     `);
     res.json(result.rows);
   } catch (error) {
     console.error(error);
    res.status(500).json({ message: "Could not load reviews." });
  }
 });
app.post("/api/reviews", requireAuth, async (req, res) => {
  const { rating, text } = req.body;
  const numericRating = Number(rating);

  console.log("Review received:", {
    user: req.session.user,
    rating: numericRating,
    text,
  });

  if (
    !Number.isInteger(numericRating) ||
    numericRating < 1 ||
    numericRating > 5 ||
    !text ||
    String(text).trim().length < 5
  ) {
    return res.status(400).json({
      message: "Please provide a rating from 1–5 and a useful review.",
    });
  }

  try {
    const result = await pool.query(
      `INSERT INTO reviews (user_id, rating, text)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [
        req.session.user.id,
        numericRating,
        String(text).trim(),
      ],
    );

    console.log("Review inserted:", result.rows[0]);

    res.status(201).json({
      message: "Review submitted successfully. Thank you!",
      review: result.rows[0],
    });
  } catch (error) {
    console.error("Review INSERT error:", error);

    res.status(500).json({
      message: "Could not submit review.",
    });
  }
});

app.post("/api/reviews", requireAuth, async (req, res) => {
  const { rating, text } = req.body;
  const numericRating = Number(rating);
  if (
    !Number.isInteger(numericRating) ||
    numericRating < 1 ||
    numericRating > 5 ||
    !text ||
    String(text).trim().length < 5
  ) {
    return res
      .status(400)
      .json({
        message: "Please provide a rating from 1–5 and a useful review.",
      });
  }

  try {
    await pool.query(
      "INSERT INTO reviews (user_id, rating, text) VALUES ($1, $2, $3)",
      [req.session.user.id, numericRating, String(text).trim()],
    );
    res
      .status(201)
      .json({ message: "Review submitted successfully. Thank you!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Could not submit review." });
  }
});

app.get("/api/dashboard", requireAuth, async (req, res) => {
  try {
    const userResult = await pool.query(
      "SELECT id, name, email, phone, course, created_at FROM users WHERE id = $1",
      [req.session.user.id],
    );
    const user = userResult.rows[0];
    if (!user) return res.status(401).json({ message: "Please log in again." });

    const reviewResult = await pool.query(
      "SELECT COUNT(*)::int AS count FROM reviews WHERE user_id = $1",
      [user.id],
    );

    res.json({
      user: publicUser(user),
      reviewCount: reviewResult.rows[0].count,
      courseList: courses,
      internship: {
        title: "Internship & Work Placement",
        description:
          "Students may have opportunities for practical exposure and work placement with ICT firms, subject to availability and academy arrangements.",
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Could not load dashboard." });
  }
});

app.get("/login", (req, res) => res.redirect("/login.html"));

async function start() {
  try {
    await initDatabase();
    app.listen(PORT, () => {
      console.log(
        `Digital Dreams ICT Academy Active at http://localhost:${PORT}`,
      );
    });
  } catch (error) {
    console.error("Could not start application:", error.message);
    process.exit(1);
  }
}

start();
