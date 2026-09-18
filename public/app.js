const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];

function toast(message, type = "success") {
  const el = $("#toast");
  if (!el) return;
  el.textContent = message;
  el.style.borderLeftColor = type === "error" ? "#e33" : "#f6b900";
  el.classList.add("show");
  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(() => el.classList.remove("show"), 3800);
}

async function api(url, options = {}) {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  let data = {};
  try {
    data = await res.json();
  } catch {}
  if (!res.ok) throw new Error(data.message || "Something went wrong.");
  return data;
}

async function loadCourses() {
  const courses = await api("/api/courses");
  const grid = $("#courseGrid");
  if (grid) {
    const render = (list) =>
      (grid.innerHTML = list
        .map(
          (c, i) => `
      <article class="course-card"><span>${String(i + 1).padStart(2, "0")}</span><h3>${escapeHtml(c)}</h3></article>
    `,
        )
        .join(""));
    render(courses);
    const search = $("#courseSearch");
    search?.addEventListener("input", () =>
      render(
        courses.filter((c) =>
          c.toLowerCase().includes(search.value.toLowerCase()),
        ),
      ),
    );
  }
  const select = $("#courseSelect");
  if (select)
    courses.forEach((c) =>
      select.insertAdjacentHTML(
        "beforeend",
        `<option>${escapeHtml(c)}</option>`,
      ),
    );
  const mini = $("#dashboardCourses");
  if (mini)
    mini.innerHTML = courses
      .map((c) => `<span>${escapeHtml(c)}</span>`)
      .join("");
}

async function loadProjects() {
  const grid = $("#projectGrid");
  if (!grid) return;

  const projects = await api("/api/projects");

  grid.innerHTML = projects
    .map(
      (p) => `
      <article class="project-card">
        <img src="${escapeHtml(p.image)}" alt="${escapeHtml(p.title)}">

        <div>
          <small>${escapeHtml(p.category)}</small>
          <h3>${escapeHtml(p.title)}</h3>
          <p>${escapeHtml(p.description)}</p>
          ${
            p.link
              ? `<a  href="${escapeHtml(p.link)}" target="_blank" rel="noopener noreferrer"  class="project-link">
                  View <i class="fa-solid fa-arrow-up-right-from-square"></i></a>`: ""}
        </div>
      </article>`,
    )
    .join("");
}

async function loadReviews() {
  const grid = $("#reviewGrid");
  if (!grid) return;
  const reviews = await api("/api/reviews");
  if (!reviews.length) {
    grid.innerHTML = `<div class="empty">No student reviews have been published yet. Log in to be one of the first.</div>`;
    return;
  }
  grid.innerHTML = reviews
    .map(
      (r) => `
    <article class="review-card">
      <div class="stars">${"★".repeat(r.rating)}${"☆".repeat(5 - r.rating)}</div>
      <p>“${escapeHtml(r.text)}”</p>
      <div class="reviewer">${escapeHtml(r.name)}</div>
    </article>`,
    )
    .join("");
}

async function handleLogin(e) {
  e.preventDefault();
  const form = e.currentTarget;
  const data = Object.fromEntries(new FormData(form));
  try {
    const result = await api("/api/login", {
      method: "POST",
      body: JSON.stringify(data),
    });
    toast(result.message);
    setTimeout(() => (location.href = "/dashboard.html"), 700);
  } catch (err) {
    toast(err.message, "error");
  }
}

async function handleRegister(e) {
  e.preventDefault();
  const form = e.currentTarget;
  const data = Object.fromEntries(new FormData(form));
  if (data.password !== data.confirmPassword)
    return toast("Passwords do not match.", "error");
  delete data.confirmPassword;
  try {
    const result = await api("/api/register", {
      method: "POST",
      body: JSON.stringify(data),
    });
    toast(result.message);
    setTimeout(() => (location.href = "/dashboard.html"), 900);
  } catch (err) {
    toast(err.message, "error");
  }
}

async function handleContact(e) {
  e.preventDefault();

  const form = e.currentTarget;
  const data = Object.fromEntries(new FormData(form));

  try {
    const result = await api("/api/contact", {
      method: "POST",
      body: JSON.stringify(data),
    });

    toast(result.message);
    form.reset();
  } catch (err) {
    toast(err.message, "error");
  }
}

async function loadDashboard() {
  const page = $("#studentName");
  if (!page) return;
  try {
    const data = await api("/api/dashboard");
    $("#studentName").textContent = data.user.name;
    $("#studentEmail").textContent = data.user.email;
    $("#studentCourse").textContent = data.user.course || "Not selected";
    $("#reviewCount").textContent = data.reviewCount;
  } catch (err) {
    toast(err.message, "error");
    setTimeout(() => (location.href = "/login.html"), 800);
  }
}

async function handleReview(e) {
  e.preventDefault();

  const form = e.currentTarget; // Save the form BEFORE await
  const data = Object.fromEntries(new FormData(form));

  try {
    const result = await api("/api/reviews", {
      method: "POST",
      body: JSON.stringify(data),
    });

    toast(result.message);

  
    form.reset();

    await loadDashboard();
  } catch (err) {
    toast(err.message, "error");
  }
  
}

async function logout() {
  try {
    const result = await api("/api/logout", { method: "POST" });
    toast(result.message);
    setTimeout(() => (location.href = "/"), 500);
  } catch (err) {
    toast(err.message, "error");
  }
}

function escapeHtml(value) {
  return String(value ?? "").replace(
    /[&<>"']/g,
    (ch) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
      })[ch],
  );
}

document.addEventListener("DOMContentLoaded", () => {
  $(".menu-btn")?.addEventListener("click", () =>
    $(".nav")?.classList.toggle("open"),
  );
  $("#loginForm")?.addEventListener("submit", handleLogin);
  $("#registerForm")?.addEventListener("submit", handleRegister);
  $("#contactForm")?.addEventListener("submit", handleContact);
  $("#reviewForm")?.addEventListener("submit", handleReview);
  $("#logoutBtn")?.addEventListener("click", logout);

  loadCourses().catch(console.error);
  loadProjects().catch(console.error);
  loadReviews().catch(console.error);
  loadDashboard().catch(() => {});
});
