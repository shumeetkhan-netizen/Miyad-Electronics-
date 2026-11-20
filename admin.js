import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { getFirestore, collection, doc, setDoc, deleteDoc, onSnapshot, writeBatch } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const $ = id => document.getElementById(id);
let products = [];
let stopListening = null;

function notice(message, error=false) {
  $("notice").textContent = message;
  $("notice").classList.remove("hidden");
  $("notice").style.background = error ? "#fff0f0" : "#eff7e9";
  $("notice").style.color = error ? "#9a2525" : "#315d22";
}
function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}
function resetForm() {
  $("productForm").reset(); $("pStock").value="0"; $("pId").readOnly=false;
  $("formTitle").textContent="নতুন পণ্য যোগ করুন"; $("saveProduct").textContent="পণ্য সংরক্ষণ";
}
function renderProducts() {
  $("productList").innerHTML = products.length ? products.map(p => `
    <article class="admin-product">
      <div><b>${esc(p.name)}</b><small>ID: ${esc(p.id)} · দাম: ৳${Number(p.price||0).toLocaleString("bn-BD")} · স্টক: ${Number(p.stock||0).toLocaleString("bn-BD")}</small></div>
      <div class="admin-actions"><button type="button" data-edit="${esc(p.id)}">Edit</button><button type="button" class="danger" data-delete="${esc(p.id)}">Delete</button></div>
    </article>`).join("") : "<p>এখনো কোনো পণ্য নেই। পুরোনো পণ্য Import করুন অথবা নতুন পণ্য যোগ করুন।</p>";
  $("productList").querySelectorAll("[data-edit]").forEach(b=>b.addEventListener("click",()=>editProduct(b.dataset.edit)));
  $("productList").querySelectorAll("[data-delete]").forEach(b=>b.addEventListener("click",()=>removeProduct(b.dataset.delete)));
}
function editProduct(id) {
  const p=products.find(x=>x.id===id); if(!p)return;
  $("pId").value=p.id; $("pId").readOnly=true; $("pName").value=p.name||"";
  $("pModel").value=p.model||""; $("pCategory").value=p.category||"";
  $("pPrice").value=p.price??0; $("pStock").value=p.stock??0; $("pImage").value=p.image||"";
  $("pColors").value=(p.colors||[]).join(", "); $("pDescription").value=p.description||"";
  $("formTitle").textContent="পণ্য পরিবর্তন করুন"; $("saveProduct").textContent="পরিবর্তন সংরক্ষণ";
  window.scrollTo({top:0,behavior:"smooth"});
}
async function removeProduct(id) {
  if(!confirm("এই পণ্যটি মুছে ফেলবেন?"))return;
  try{await deleteDoc(doc(db,"products",id));notice("পণ্য মুছে ফেলা হয়েছে।");}
  catch(e){notice("মুছতে সমস্যা: "+e.message,true);}
}
$("loginForm").addEventListener("submit",async e=>{
  e.preventDefault();
  try{await signInWithEmailAndPassword(auth,$("email").value.trim(),$("password").value);}
  catch(err){notice("লগইন হয়নি। Authentication-এ Email/Password চালু আছে কি না এবং তথ্য ঠিক আছে কি না দেখুন। ("+err.code+")",true);}
});
$("logout").addEventListener("click",()=>signOut(auth));
$("resetForm").addEventListener("click",resetForm);
$("productForm").addEventListener("submit",async e=>{
  e.preventDefault();
  const id=$("pId").value.trim();
  if(!/^[a-zA-Z0-9_-]+$/.test(id))return notice("ID-তে ইংরেজি অক্ষর, সংখ্যা, - বা _ ব্যবহার করুন।",true);
  const p={id,name:$("pName").value.trim(),model:$("pModel").value.trim(),category:$("pCategory").value.trim(),
    price:Number($("pPrice").value),stock:Number($("pStock").value),image:$("pImage").value.trim(),
    colors:$("pColors").value.split(",").map(x=>x.trim()).filter(Boolean),description:$("pDescription").value.trim()};
  try{await setDoc(doc(db,"products",id),p);notice("পণ্য সংরক্ষণ হয়েছে। ওয়েবসাইটে আপডেট হবে।");resetForm();}
  catch(err){notice("সংরক্ষণ হয়নি: "+err.message,true);}
});
$("importProducts").addEventListener("click",async()=>{
  if(!Array.isArray(window.PRODUCTS)||!window.PRODUCTS.length)return notice("products.js থেকে পণ্য পাওয়া যায়নি।",true);
  if(!confirm("পুরোনো পণ্যগুলো Firestore-এ যোগ হবে। একই ID থাকলে সেই পণ্যের তথ্য আপডেট হবে; স্টক 0 রাখা হবে। চালাবেন?"))return;
  try{
    const batch=writeBatch(db);
    window.PRODUCTS.forEach(p=>batch.set(doc(db,"products",p.id),{...p,stock:0}));
    await batch.commit(); notice("পুরোনো "+window.PRODUCTS.length+"টি পণ্য Firestore-এ যোগ হয়েছে।");
  }catch(err){notice("Import হয়নি: "+err.message,true);}
});
onAuthStateChanged(auth,user=>{
  $("loginPanel").classList.toggle("hidden",!!user); $("dashboard").classList.toggle("hidden",!user);
  if(!user){if(stopListening)stopListening();stopListening=null;return;}
  $("signedInAs").textContent="লগইন: "+(user.email||"Admin");
  if(stopListening)stopListening();
  stopListening=onSnapshot(collection(db,"products"),snap=>{
    products=snap.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>(a.name||"").localeCompare(b.name||""));
    renderProducts();
  },err=>notice("ডেটা পড়তে সমস্যা: "+err.message,true));
});
