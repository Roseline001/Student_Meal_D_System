// Admin page: register schools, students and restaurants, verify enrollment, issue coupons.
import * as api from "./api.js";
import { DEFAULT_COUPON } from "./config.js";
import { buildTermCoupon, formatMoney } from "./coupons.js";
import {
  validateStudent, validateSchool, validateRestaurant, validateCouponSettings, hasErrors,
} from "./validation.js";
import {
  el, showToast, setLoading, showFieldErrors, clearFieldErrors, readForm, formatDate, renderRows,
} from "./ui.js";

// Latest data from the API, used to look up names and fill dropdowns.
const state = { schools: [], students: [], restaurants: [], coupons: [] };

const schoolName = (id) => state.schools.find((s) => s.id === id)?.name || "Unknown school";
const studentName = (id) => {
  const student = state.students.find((s) => s.id === id);
  return student ? `${student.firstName} ${student.lastName}` : "Removed student";
};

const actionButton = (label, action, id, extraClass = "") =>
  el("button", { className: `button button--small ${extraClass}`, type: "button", dataset: { action, id } }, label);

// ---------- Rendering ----------

export function renderSchoolOptions() {
  const options = [el("option", { value: "" }, "Choose a school"),
    ...state.schools.map((s) => el("option", { value: s.id }, s.name))];
  document.querySelector("#s-school").replaceChildren(...options);

  document.querySelector("#r-schools").replaceChildren(...state.schools.map((s) =>
    el("label", { className: "checkbox" },
      el("input", { type: "checkbox", name: "schoolIds", value: s.id }),
      s.name)));
}

export function renderStudents() {
  renderRows(document.querySelector("#students-body"), state.students, (s) =>
    el("tr", {},
      el("td", {}, s.studentCode),
      el("td", {}, `${s.firstName} ${s.lastName}`),
      el("td", {}, schoolName(s.schoolId)),
      el("td", {}, el("span", { className: s.enrolled ? "badge badge--ok" : "badge badge--warn" },
        s.enrolled ? "Verified" : "Pending")),
      el("td", { className: "actions" },
        actionButton(s.enrolled ? "Unverify" : "Verify", "toggle-enrollment", s.id),
        actionButton("Edit", "edit-student", s.id, "button--ghost"),
        actionButton("Delete", "delete-student", s.id, "button--danger"))),
  "No students registered yet.");
}

export function renderSchools() {
  renderRows(document.querySelector("#schools-body"), state.schools, (s) =>
    el("tr", {},
      el("td", {}, s.name),
      el("td", { className: "capitalize" }, s.level),
      el("td", {}, s.city),
      el("td", { className: "actions" }, actionButton("Delete", "delete-school", s.id, "button--danger"))),
  "No schools registered yet.");
}

export function renderRestaurants() {
  renderRows(document.querySelector("#restaurants-body"), state.restaurants, (r) =>
    el("tr", {},
      el("td", {}, r.partnerCode),
      el("td", {}, r.name),
      el("td", {}, r.address),
      el("td", { className: "actions" }, actionButton("Delete", "delete-restaurant", r.id, "button--danger"))),
  "No partner restaurants yet.");
}

export function renderCoupons() {
  renderRows(document.querySelector("#coupons-body"), state.coupons, (c) =>
    el("tr", {},
      el("td", {}, studentName(c.studentId)),
      el("td", {}, `${c.term} (${formatMoney(c.valuePerMeal)})`),
      el("td", {}, `${c.mealsUsed} / ${c.mealsTotal}`),
      el("td", {}, formatDate(c.expiresAt)),
      el("td", { className: "actions" },
        el("span", { className: c.status === "active" ? "badge badge--ok" : "badge badge--warn" }, c.status),
        actionButton(c.status === "active" ? "Suspend" : "Activate", "toggle-coupon", c.id, "button--ghost"))),
  "No coupons issued yet.");
}

async function loadAll() {
  try {
    const [schools, students, restaurants, coupons] = await Promise.all([
      api.getSchools(), api.getStudents(), api.getRestaurants(), api.getCoupons(),
    ]);
    Object.assign(state, { schools, students, restaurants, coupons });
    renderSchoolOptions();
    renderStudents();
    renderSchools();
    renderRestaurants();
    renderCoupons();
  } catch (error) {
    showToast(error.message, "error");
  }
}

// ---------- Students: POST (new), PUT (edit), PATCH (verify), DELETE ----------

function resetStudentForm() {
  const form = document.querySelector("#student-form");
  form.reset();
  form.elements.id.value = "";
  clearFieldErrors(form);
  document.querySelector("#student-form-title").textContent = "Register a student";
  document.querySelector("#cancel-edit").hidden = true;
}

function startEditStudent(id) {
  const student = state.students.find((s) => s.id === id);
  const form = document.querySelector("#student-form");
  ["id", "studentCode", "firstName", "lastName", "dateOfBirth", "schoolId", "grade"].forEach((field) => {
    form.elements[field].value = student[field];
  });
  document.querySelector("#student-form-title").textContent = `Edit ${student.firstName}`;
  document.querySelector("#cancel-edit").hidden = false;
  form.scrollIntoView({ behavior: "smooth" });
}

async function handleStudentSubmit(event) {
  event.preventDefault();
  const form = event.target;
  const data = readForm(form);
  const id = Number(data.id) || null;
  const student = {
    studentCode: data.studentCode.toUpperCase(),
    firstName: data.firstName,
    lastName: data.lastName,
    dateOfBirth: data.dateOfBirth,
    schoolId: Number(data.schoolId) || null,
    grade: data.grade,
  };

  const errors = validateStudent(student);
  const duplicate = state.students.some((s) => s.studentCode === student.studentCode && s.id !== id);
  if (duplicate) errors.studentCode = "Another student already has this ID.";
  if (hasErrors(errors)) return showFieldErrors(form, errors);

  const button = form.querySelector("button[type=submit]");
  setLoading(button, true, "Saving...");
  try {
    if (id) {
      // PUT replaces the whole record, so keep the enrollment fields from the current one.
      const current = state.students.find((s) => s.id === id);
      await api.replaceStudent(id, { ...student, enrolled: current.enrolled, verifiedAt: current.verifiedAt });
      showToast("Student updated.", "success");
    } else {
      await api.createStudent({ ...student, enrolled: false, verifiedAt: null });
      showToast("Student registered. Verify their enrollment next.", "success");
    }
    resetStudentForm();
    await loadAll();
  } catch (error) {
    showToast(error.message, "error");
  } finally {
    setLoading(button, false);
  }
}

// ---------- Schools and restaurants: POST and DELETE ----------

async function handleSchoolSubmit(event) {
  event.preventDefault();
  const form = event.target;
  const school = readForm(form);
  const errors = validateSchool(school);
  if (hasErrors(errors)) return showFieldErrors(form, errors);
  clearFieldErrors(form);

  try {
    await api.createSchool(school);
    form.reset();
    showToast("School registered.", "success");
    await loadAll();
  } catch (error) {
    showToast(error.message, "error");
  }
}

async function handleRestaurantSubmit(event) {
  event.preventDefault();
  const form = event.target;
  const restaurant = {
    ...readForm(form),
    // A form can have many checked "schoolIds" boxes, so read them all.
    schoolIds: new FormData(form).getAll("schoolIds").map(Number),
    active: true,
  };
  restaurant.partnerCode = restaurant.partnerCode.toUpperCase();

  const errors = validateRestaurant(restaurant);
  if (state.restaurants.some((r) => r.partnerCode === restaurant.partnerCode)) {
    errors.partnerCode = "This partner code is already used.";
  }
  if (hasErrors(errors)) return showFieldErrors(form, errors);
  clearFieldErrors(form);

  try {
    await api.createRestaurant(restaurant);
    form.reset();
    showToast("Partner restaurant registered.", "success");
    await loadAll();
  } catch (error) {
    showToast(error.message, "error");
  }
}

// ---------- Coupons: POST (issue) and PATCH (suspend / activate) ----------

async function handleCouponSubmit(event) {
  event.preventDefault();
  const form = event.target;
  const settings = readForm(form);
  const errors = validateCouponSettings(settings);
  if (hasErrors(errors)) return showFieldErrors(form, errors);
  clearFieldErrors(form);

  const hasActive = (studentId) => state.coupons.some((c) => c.studentId === studentId && c.status === "active");
  const eligible = state.students.filter((s) => s.enrolled && !hasActive(s.id));
  if (eligible.length === 0) {
    showToast("Every verified student already has an active coupon.", "info");
    return;
  }

  const button = form.querySelector("button[type=submit]");
  setLoading(button, true, "Issuing...");
  try {
    await Promise.all(eligible.map((s) => api.createCoupon(buildTermCoupon(s.id, settings))));
    showToast(`Issued ${eligible.length} coupon(s).`, "success");
    await loadAll();
  } catch (error) {
    showToast(error.message, "error");
  } finally {
    setLoading(button, false);
  }
}

// ---------- Table buttons ----------

// Each table button carries data-action and data-id, so one listener handles them all.
async function handleTableClick(event) {
  const button = event.target.closest("[data-action]");
  if (!button) return;
  const id = Number(button.dataset.id);
  const { action } = button.dataset;

  if (action === "edit-student") return startEditStudent(id);

  const confirmText = {
    "delete-student": "Delete this student? Their coupons and meal history are removed too.",
    "delete-school": "Delete this school? Students linked to it are removed too.",
    "delete-restaurant": "Delete this restaurant?",
  }[action];
  if (confirmText && !window.confirm(confirmText)) return;

  setLoading(button, true, "...");
  try {
    if (action === "toggle-enrollment") {
      const student = state.students.find((s) => s.id === id);
      await api.setEnrollment(id, !student.enrolled);
      showToast(student.enrolled ? "Enrollment unverified." : "Enrollment verified.", "success");
    } else if (action === "toggle-coupon") {
      const coupon = state.coupons.find((c) => c.id === id);
      await api.updateCoupon(id, { status: coupon.status === "active" ? "suspended" : "active" });
      showToast("Coupon status updated.", "success");
    } else if (action === "delete-student") {
      await api.deleteStudent(id);
      showToast("Student deleted.", "success");
    } else if (action === "delete-school") {
      await api.deleteSchool(id);
      showToast("School deleted.", "success");
    } else if (action === "delete-restaurant") {
      await api.deleteRestaurant(id);
      showToast("Restaurant deleted.", "success");
    }
    await loadAll();
  } catch (error) {
    showToast(error.message, "error");
    setLoading(button, false);
  }
}

// ---------- Tabs ----------

export function selectTab(tab) {
  document.querySelectorAll("[role=tab]").forEach((t) => {
    const selected = t === tab;
    t.setAttribute("aria-selected", String(selected));
    document.getElementById(t.getAttribute("aria-controls")).hidden = !selected;
  });
}

export async function init() {
  document.querySelectorAll("[role=tab]").forEach((tab) =>
    tab.addEventListener("click", () => selectTab(tab)));

  document.querySelector("#student-form").addEventListener("submit", handleStudentSubmit);
  document.querySelector("#cancel-edit").addEventListener("click", resetStudentForm);
  document.querySelector("#school-form").addEventListener("submit", handleSchoolSubmit);
  document.querySelector("#restaurant-form").addEventListener("submit", handleRestaurantSubmit);
  document.querySelector("#coupon-form").addEventListener("submit", handleCouponSubmit);
  document.querySelector("#main").addEventListener("click", handleTableClick);

  const couponForm = document.querySelector("#coupon-form");
  Object.entries(DEFAULT_COUPON).forEach(([field, value]) => {
    couponForm.elements[field].value = value;
  });

  await loadAll();
}

if (document.body?.dataset.page === "admin") init();
