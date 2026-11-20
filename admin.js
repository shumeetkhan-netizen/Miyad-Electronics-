

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";

import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";

import {
  getFirestore,
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  writeBatch
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

import { firebaseConfig } from "./firebase-config.js";
import { PRODUCTS } from "./products.js";

// Firebase Initialize
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const $ = id => document.getElementById(id);

let products = [];
let stopListening = null;

// Notification
function notice(message, error = false) {
  const box = $("notice");

  if (box) {
    box.textContent = message;
    box.classList.remove("hidden");
    box.style.background = error ? "#fff0f0" : "#eff7e9";
    box.style.color = error ? "#9a2525" : "#315d22";
  } else {
    alert(message);
  }
}

// নিরাপদ HTML Text
function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, c => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[c]));
}

// Form Reset
function resetForm() {
  $("productForm").reset();

  $("pStock").value = "0";
  $("pId").readOnly = false;

  $("formTitle").textContent = "নতুন পণ্য যোগ করুন";
  $("saveProduct").textContent = "পণ্য সংরক্ষণ";
}

// Product List
function renderProducts() {
  $("productList").innerHTML = products.length
    ? products.map(p => `
      <article class="admin-product">

        <div>
          <b>${esc(p.name)}</b>

          <small>
            ID: ${esc(p.id)}
            · দাম: ৳${Number(p.price || 0).toLocaleString("bn-BD")}
            · স্টক: ${Number(p.stock || 0).toLocaleString("bn-BD")}
          </small>
        </div>

        <div class="admin-actions">
          <button type="button" data-edit="${esc(p.id)}">
            Edit
          </button>

          <button type="button" class="danger" data-delete="${esc(p.id)}">
            Delete
          </button>
        </div>

      </article>
    `).join("")
    : "<p>এখনো কোনো পণ্য নেই।</p>";

  $("productList").querySelectorAll("[data-edit]").forEach(button => {
    button.addEventListener("click", () => {
      editProduct(button.dataset.edit);
    });
  });

  $("productList").querySelectorAll("[data-delete]").forEach(button => {
    button.addEventListener("click", () => {
      removeProduct(button.dataset.delete);
    });
  });
}

// Edit Product
function editProduct(id) {
  const p = products.find(item => item.id === id);

  if (!p) return;

  $("pId").value = p.id;
  $("pId").readOnly = true;

  $("pName").value = p.name || "";
  $("pModel").value = p.model || "";
  $("pCategory").value = p.category || "";

  $("pPrice").value = p.price ?? 0;
  $("pStock").value = p.stock ?? 0;

  $("pImage").value = p.image || "";
  $("pColors").value = (p.colors || []).join(", ");
  $("pDescription").value = p.description || "";

  $("formTitle").textContent = "পণ্য পরিবর্তন করুন";
  $("saveProduct").textContent = "পরিবর্তন সংরক্ষণ";

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

// Delete Product
async function removeProduct(id) {
  if (!confirm("এই পণ্যটি মুছে ফেলবেন?")) return;

  try {
    await deleteDoc(doc(db, "products", id));

    notice("পণ্য মুছে ফেলা হয়েছে।");

  } catch (error) {
    notice("Delete Error: " + error.message, true);
  }
}

// ADMIN LOGIN
$("loginForm").addEventListener("submit", async event => {
  event.preventDefault();

  const email = $("email").value.trim();
  const password = $("password").value;

  const button = $("loginForm").querySelector('button[type="submit"]');

  button.disabled = true;
  button.textContent = "লগইন হচ্ছে...";

  try {
    await signInWithEmailAndPassword(
      auth,
      email,
      password
    );

    alert("Login সফল হয়েছে!");

  } catch (error) {

    let message = "লগইন হয়নি: " + error.code;

    if (
      error.code === "auth/invalid-credential" ||
      error.code === "auth/wrong-password"
    ) {
      message = "ইমেইল অথবা পাসওয়ার্ড ভুল হয়েছে।";

    } else if (error.code === "auth/user-not-found") {
      message = "এই ইমেইলে Admin Account পাওয়া যায়নি।";

    } else if (error.code === "auth/invalid-email") {
      message = "সঠিক Email লিখুন।";

    } else if (error.code === "auth/network-request-failed") {
      message = "ইন্টারনেট সংযোগ পরীক্ষা করুন।";

    } else if (error.code === "auth/too-many-requests") {
      message = "অনেকবার চেষ্টা হয়েছে। কিছুক্ষণ পরে চেষ্টা করুন।";

    } else if (error.code === "auth/operation-not-allowed") {
      message = "Firebase Authentication-এ Email/Password চালু করুন।";
    }

    alert(message);

  } finally {
    button.disabled = false;
    button.textContent = "লগইন";
  }
});

// ADMIN LOGOUT
$("logout").addEventListener("click", async () => {
  try {
    await signOut(auth);
  } catch (error) {
    notice("Logout Error: " + error.message, true);
  }
});

// Reset Button
$("resetForm").addEventListener("click", resetForm);

// ADD / UPDATE PRODUCT
$("productForm").addEventListener("submit", async event => {
  event.preventDefault();

  const id = $("pId").value.trim();

  if (!/^[a-zA-Z0-9_-]+$/.test(id)) {
    return notice(
      "Product ID-তে ইংরেজি অক্ষর, সংখ্যা, - অথবা _ ব্যবহার করুন।",
      true
    );
  }

  const p = {
    id: id,

    name: $("pName").value.trim(),
    model: $("pModel").value.trim(),
    category: $("pCategory").value.trim(),

    price: Number($("pPrice").value),
    stock: Number($("pStock").value),

    image: $("pImage").value.trim(),

    colors: $("pColors").value
      .split(",")
      .map(x => x.trim())
      .filter(Boolean),

    description: $("pDescription").value.trim()
  };

  try {
    await setDoc(
      doc(db, "products", id),
      p
    );

    notice("পণ্য সফলভাবে সংরক্ষণ হয়েছে!");

    resetForm();

  } catch (error) {
    notice("Save Error: " + error.message, true);
  }
});

// IMPORT OLD PRODUCTS
$("importProducts").addEventListener("click", async () => {

  if (!Array.isArray(PRODUCTS) || !PRODUCTS.length) {
    return notice("products.js থেকে পণ্য পাওয়া যায়নি।", true);
  }

  const confirmed = confirm(
    "পুরোনো ৮টি পণ্য Firestore-এ যোগ হবে। একই ID থাকলে আগের তথ্য ও স্টক পরিবর্তিত হতে পারে। চালাবেন?"
  );

  if (!confirmed) return;

  try {
    const batch = writeBatch(db);

    PRODUCTS.forEach(p => {
      batch.set(
        doc(db, "products", p.id),
        {
          ...p,
          stock: 0
        }
      );
    });

    await batch.commit();

    notice(
      PRODUCTS.length + "টি পণ্য Firestore-এ যোগ হয়েছে!"
    );

  } catch (error) {
    notice("Import Error: " + error.message, true);
  }
});

// FIREBASE LOGIN STATUS
onAuthStateChanged(auth, user => {

  $("loginPanel").classList.toggle("hidden", !!user);

  $("dashboard").classList.toggle("hidden", !user);

  if (!user) {

    if (stopListening) {
      stopListening();
    }

    stopListening = null;
    return;
  }

  $("signedInAs").textContent =
    "লগইন: " + (user.email || "Admin");

  if (stopListening) {
    stopListening();
  }

  // LIVE FIRESTORE PRODUCTS
  stopListening = onSnapshot(
    collection(db, "products"),

    snapshot => {

      products = snapshot.docs
        .map(d => ({
          id: d.id,
          ...d.data()
        }))
        .sort((a, b) =>
          (a.name || "").localeCompare(b.name || "")
        );

      renderProducts();
    },

    error => {
      notice(
        "Firestore Error: " + error.message,
        true
      );
    }
  );

});
