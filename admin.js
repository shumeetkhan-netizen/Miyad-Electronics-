
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

// Firebase চালু
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const $ = id => document.getElementById(id);

let products = [];
let stopListening = null;

// Message দেখানো
function notice(message, error = false) {
  $("notice").textContent = message;
  $("notice").classList.remove("hidden");

  $("notice").style.background = error ? "#fff0f0" : "#eff7e9";
  $("notice").style.color = error ? "#9a2525" : "#315d22";
}

// HTML নিরাপদ রাখা
function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, c => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[c]));
}

// Form খালি করা
function resetForm() {
  $("productForm").reset();
  $("pStock").value = "0";
  $("pId").readOnly = false;

  $("formTitle").textContent = "নতুন পণ্য যোগ করুন";
  $("saveProduct").textContent = "পণ্য সংরক্ষণ";
}

// পণ্যের তালিকা দেখানো
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
          <button type="button" data-edit="${esc(p.id)}">Edit</button>
          <button type="button" class="danger" data-delete="${esc(p.id)}">Delete</button>
        </div>
      </article>
    `).join("")
    : "<p>এখনো কোনো পণ্য নেই। পুরোনো পণ্য Import করুন অথবা নতুন পণ্য যোগ করুন।</p>";

  $("productList").querySelectorAll("[data-edit]").forEach(button => {
    button.addEventListener("click", () => editProduct(button.dataset.edit));
  });

  $("productList").querySelectorAll("[data-delete]").forEach(button => {
    button.addEventListener("click", () => removeProduct(button.dataset.delete));
  });
}

// পণ্য Edit
function editProduct(id) {
  const p = products.find(x => x.id === id);
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

  window.scrollTo({ top: 0, behavior: "smooth" });
}

// পণ্য Delete
async function removeProduct(id) {
  if (!confirm("এই পণ্যটি মুছে ফেলবেন?")) return;

  try {
    await deleteDoc(doc(db, "products", id));
    notice("পণ্য মুছে ফেলা হয়েছে।");
  } catch (error) {
    notice("মুছতে সমস্যা: " + error.message, true);
  }
}

// Admin Login
$("loginForm").addEventListener("submit", async event => {
  event.preventDefault();

  try {
    await signInWithEmailAndPassword(
      auth,
      $("email").value.trim(),
      $("password").value
    );
  } catch (error) {
    notice(
      "লগইন হয়নি। Email/Password Authentication চালু আছে কি না দেখুন। (" +
      error.code + ")",
      true
    );
  }
});

// Logout
$("logout").addEventListener("click", () => signOut(auth));

// Form Reset
$("resetForm").addEventListener("click", resetForm);

// নতুন পণ্য যোগ এবং Update
$("productForm").addEventListener("submit", async event => {
  event.preventDefault();

  const id = $("pId").value.trim();

  if (!/^[a-zA-Z0-9_-]+$/.test(id)) {
    return notice(
      "ID-তে ইংরেজি অক্ষর, সংখ্যা, - অথবা _ ব্যবহার করুন।",
      true
    );
  }

  const p = {
    id,
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
    await setDoc(doc(db, "products", id), p);

    notice("পণ্য সংরক্ষণ হয়েছে।");
    resetForm();

  } catch (error) {
    notice("সংরক্ষণ হয়নি: " + error.message, true);
  }
});

// পুরোনো ৮টি পণ্য Import
$("importProducts").addEventListener("click", async () => {
  if (!Array.isArray(PRODUCTS) || !PRODUCTS.length) {
    return notice("products.js থেকে পণ্য পাওয়া যায়নি।", true);
  }

  if (!confirm(
    "পুরোনো পণ্যগুলো Firestore-এ যোগ হবে। একই ID থাকলে সেই পণ্যের তথ্য আপডেট হবে এবং স্টক 0 হবে। চালাবেন?"
  )) return;

  try {
    const batch = writeBatch(db);

    PRODUCTS.forEach(p => {
      batch.set(doc(db, "products", p.id), {
        ...p,
        stock: 0
      });
    });

    await batch.commit();

    notice(
      "পুরোনো " + PRODUCTS.length +
      "টি পণ্য Firestore-এ যোগ হয়েছে।"
    );

  } catch (error) {
    notice("Import হয়নি: " + error.message, true);
  }
});

// Login Status এবং Live Product Sync
onAuthStateChanged(auth, user => {
  $("loginPanel").classList.toggle("hidden", !!user);
  $("dashboard").classList.toggle("hidden", !user);

  if (!user) {
    if (stopListening) stopListening();
    stopListening = null;
    return;
  }

  $("signedInAs").textContent =
    "লগইন: " + (user.email || "Admin");

  if (stopListening) stopListening();

  stopListening = onSnapshot(
    collection(db, "products"),

    snapshot => {
      products = snapshot.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) =>
          (a.name || "").localeCompare(b.name || "")
        );

      renderProducts();
    },

    error => {
      notice("ডেটা পড়তে সমস্যা: " + error.message, true);
    }
  );
});
