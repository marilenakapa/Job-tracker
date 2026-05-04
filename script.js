let editId = null;

/* 🔥 Firebase imports */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  query,
  where
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

/* 🔥 Firebase Config */
const firebaseConfig = {
  apiKey: "",
  authDomain: "job-tracker-13a99.firebaseapp.com",
  projectId: "job-tracker-13a99",
  storageBucket: "job-tracker-13a99.firebasestorage.app",
  messagingSenderId: "1057896392845",
  appId: "1:1057896392845:web:d941b28dc3e86f980edac4",
  measurementId: "G-S2QXQFHQ9T"
};

/* init */
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

/* 🧠 state */
let jobs = [];
let currentFilter = "All";

/* ===================== JOBS ===================== */

async function addJob() {
  const company = document.getElementById("company").value;
  const position = document.getElementById("position").value;
  const status = document.getElementById("status").value;

  if (!company || !position) return;

  if (editId) {
    await updateDoc(doc(db, "jobs", editId), {
      company,
      position,
      status
    });
    editId = null;
  } else {
    await addDoc(collection(db, "jobs"), {
     company,
     position,
     status,
     userId: auth.currentUser.uid
    });
  }

  clearForm();
  loadJobs();
}

async function deleteJob(id) {
  await deleteDoc(doc(db, "jobs", id));
  loadJobs();
}

async function loadJobs() {

  const q = query(
    collection(db, "jobs"),
    where("userId", "==", auth.currentUser.uid)
  );

  const snapshot = await getDocs(q);

  jobs = [];

  snapshot.forEach((d) => {
    jobs.push({
      id: d.id,
      ...d.data()
    });
  });

  render();
}

/* ===================== RENDER ===================== */

function render(search = "") {
  const list = document.getElementById("jobList");
  list.innerHTML = "";

  let filtered = jobs;

  if (currentFilter !== "All") {
    filtered = filtered.filter(j => j.status === currentFilter);
  }

  if (search) {
    filtered = filtered.filter(j =>
      j.company.toLowerCase().includes(search) ||
      j.position.toLowerCase().includes(search)
    );
  }

  let applied = 0, interview = 0, rejected = 0;

  filtered.forEach((job) => {
    if (job.status === "Applied") applied++;
    if (job.status === "Interview") interview++;
    if (job.status === "Rejected") rejected++;

    const div = document.createElement("div");
    div.className = "card";

    div.style.borderLeft =
      job.status === "Interview"
        ? "5px solid orange"
        : job.status === "Rejected"
        ? "5px solid red"
        : "5px solid green";

    div.innerHTML = `
      <h3>${job.company}</h3>
      <p>${job.position}</p>
      <p>Status: ${job.status}</p>

      <button onclick="startEdit('${job.id}', '${job.company}', '${job.position}', '${job.status}')">
        Edit
      </button>

      <button onclick="deleteJob('${job.id}')">
        Delete
      </button>
    `;

    list.appendChild(div);
  });

  document.getElementById("appliedCount").innerText = applied;
  document.getElementById("interviewCount").innerText = interview;
  document.getElementById("rejectedCount").innerText = rejected;
}

/* ===================== FORM ===================== */

function clearForm() {
  document.getElementById("company").value = "";
  document.getElementById("position").value = "";
}

function startEdit(id, company, position, status) {
  document.getElementById("company").value = company;
  document.getElementById("position").value = position;
  document.getElementById("status").value = status;

  editId = id;
}

/* ===================== AUTH ===================== */

async function register() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  await createUserWithEmailAndPassword(auth, email, password);
}

async function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  await signInWithEmailAndPassword(auth, email, password);
}

async function logout() {
  await signOut(auth);
  jobs = [];
  render();
}

/* ===================== AUTH STATE ===================== */

onAuthStateChanged(auth, (user) => {
  if (user) {
    document.getElementById("authSection").style.display = "none";
    document.getElementById("appSection").style.display = "block";
    loadJobs();
  } else {
    document.getElementById("authSection").style.display = "block";
    document.getElementById("appSection").style.display = "none";
    jobs = [];
    render();
  }
});

/* ===================== EVENTS ===================== */

window.addJob = addJob;
window.deleteJob = deleteJob;
window.searchJobs = (v) => render(v.toLowerCase());
window.filterJobs = (f) => {
  currentFilter = f;
  render();
};

window.startEdit = startEdit;

window.register = register;
window.login = login;
window.logout = logout;

function toggleDarkMode() {
  document.body.classList.toggle("dark");
}

window.toggleDarkMode = toggleDarkMode;
