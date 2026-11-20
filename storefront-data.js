import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getFirestore, collection, onSnapshot } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Live public product list. If Firestore has no products, the original catalogue remains visible.
export function subscribeProducts(onProducts, onError) {
  return onSnapshot(collection(db, "products"), snapshot => {
    if (snapshot.empty) return; // keep original PRODUCTS.js catalogue until products are imported
    const products = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    onProducts(products);
  }, onError);
}
