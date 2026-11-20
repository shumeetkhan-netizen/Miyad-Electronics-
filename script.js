import { PRODUCTS as FALLBACK_PRODUCTS } from "./products.js";
import { subscribeProducts } from "./storefront-data.js";
(() => {
  "use strict";
  const WHATSAPP_NUMBER = "8801957835577";
  const CART_KEY = "miyad_electronics_cart_v1";
  const categories = [
    { name: "সব পণ্য", icon: "▦", subtitle: "সম্পূর্ণ কালেকশন" },
    { name: "LED Light", icon: "💡", subtitle: "আলো ছড়ান" },
    { name: "Mobile Accessories", icon: "📱", subtitle: "মোবাইলের প্রয়োজন" },
    { name: "Charger", icon: "🔌", subtitle: "চার্জিং সমাধান" },
    { name: "Headphone", icon: "🎧", subtitle: "অডিও কালেকশন" },
    { name: "অন্যান্য ইলেকট্রনিক্স", icon: "⚙️", subtitle: "আরও পণ্য" }
  ];
  let PRODUCTS = FALLBACK_PRODUCTS;
  let activeCategory = "সব পণ্য";
  let cart = loadCart();
  let toastTimer;
  const $ = selector => document.querySelector(selector);
  const money = amount => "৳" + Number(amount).toLocaleString("bn-BD");
  function loadCart() { try { const saved=JSON.parse(localStorage.getItem(CART_KEY)||"[]"); return Array.isArray(saved)?saved:[]; } catch { return []; } }
  function saveCart() { try { localStorage.setItem(CART_KEY,JSON.stringify(cart)); } catch { showToast("কার্ট সংরক্ষণ করা যায়নি।"); } }
  function showToast(message) { const toast=$("#toast"); toast.textContent=message; toast.classList.add("show"); clearTimeout(toastTimer); toastTimer=setTimeout(()=>toast.classList.remove("show"),2200); }
  function renderCategories() {
    $("#categoryGrid").innerHTML=categories.slice(1).map(cat=>`<button class="category-card ${activeCategory===cat.name?"active":""}" data-category="${escapeHtml(cat.name)}"><span class="category-symbol">${cat.icon}</span><b>${escapeHtml(cat.name)}</b><small>${escapeHtml(cat.subtitle)}</small></button>`).join("");
    $("#categoryGrid").querySelectorAll("button").forEach(button=>button.addEventListener("click",()=>setCategory(button.dataset.category)));
    $("#filterRow").innerHTML=categories.map(cat=>`<button class="filter-chip ${activeCategory===cat.name?"active":""}" data-category="${escapeHtml(cat.name)}">${escapeHtml(cat.name)}</button>`).join("");
    $("#filterRow").querySelectorAll("button").forEach(button=>button.addEventListener("click",()=>setCategory(button.dataset.category)));
  }
  function setCategory(category) { activeCategory=category; renderCategories(); renderProducts(); $("#products").scrollIntoView({behavior:"smooth",block:"start"}); }
  function renderProducts() {
    const query=$("#searchInput").value.trim().toLocaleLowerCase("bn"), sort=$("#sortSelect").value;
    let list=PRODUCTS.filter(product=>{
      const categoryMatch=activeCategory==="সব পণ্য"||product.category===activeCategory;
      const searchText=`${product.name} ${product.model} ${product.category} ${product.description||""}`.toLocaleLowerCase("bn");
      return categoryMatch&&searchText.includes(query);
    });
    if(sort==="low")list.sort((a,b)=>a.price-b.price); if(sort==="high")list.sort((a,b)=>b.price-a.price);
    $("#emptyState").classList.toggle("hidden",list.length>0);
    $("#productGrid").innerHTML=list.map(product=>`
      <article class="product-card" data-product-id="${escapeHtml(product.id)}">
        <div class="product-image"><img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}" loading="lazy" onerror="this.src='https://placehold.co/600x450/f0f4ef/52634f?text=MIYAD+Electronics'"><span class="product-category">${escapeHtml(product.category)}</span></div>
        <div class="product-info"><h3>${escapeHtml(product.name)}</h3><div class="product-model">মডেল: ${escapeHtml(product.model)}</div><div class="product-price">${money(product.price)}</div>
          <label>কালার নির্বাচন করুন</label><select class="color-select" aria-label="${escapeHtml(product.name)} কালার">${(product.colors||["Standard"]).map(color=>`<option value="${escapeHtml(color)}">${escapeHtml(color)}</option>`).join("")}</select>
          <label>পরিমাণ</label><input class="quantity-input" type="number" min="1" max="99" value="1" aria-label="পরিমাণ">
          <div class="product-actions"><button class="add-button" data-action="add">কার্টে যোগ</button><button class="buy-button" data-action="buy">অর্ডার করুন ↗</button></div></div></article>`).join("");
    $("#productGrid").querySelectorAll(".product-card").forEach(card=>{
      card.querySelector('[data-action="add"]').addEventListener("click",()=>addToCart(card));
      card.querySelector('[data-action="buy"]').addEventListener("click",()=>buyNow(card));
    });
  }
  function selectedItem(card) { const product=PRODUCTS.find(p=>p.id===card.dataset.productId); const quantity=Math.min(99,Math.max(1,parseInt(card.querySelector(".quantity-input").value,10)||1)); return {...product,color:card.querySelector(".color-select").value,quantity}; }
  function addToCart(card) { const item=selectedItem(card),existing=cart.find(p=>p.id===item.id&&p.color===item.color); if(existing)existing.quantity=Math.min(99,existing.quantity+item.quantity); else cart.push({id:item.id,name:item.name,model:item.model,price:item.price,image:item.image,color:item.color,quantity:item.quantity}); saveCart();renderCart();showToast("পণ্যটি কার্টে যোগ হয়েছে"); }
  function buyNow(card) { const item=selectedItem(card);openWhatsApp(buildOrderMessage([item],"একটি পণ্যের অর্ডার")); }
  function renderCart() {
    const count=cart.reduce((sum,item)=>sum+item.quantity,0),total=cart.reduce((sum,item)=>sum+item.price*item.quantity,0);
    $("#cartCount").textContent=count.toLocaleString("bn-BD");$("#cartTotal").textContent=money(total);
    if(!cart.length){$("#cartItems").innerHTML='<p class="cart-empty">আপনার কার্ট এখনো খালি।</p>';return;}
    $("#cartItems").innerHTML=cart.map((item,index)=>`<div class="cart-line" data-index="${index}"><img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)}" onerror="this.src='https://placehold.co/120x120?text=Product'"><div><b>${escapeHtml(item.name)}</b><small>${escapeHtml(item.color)} · ${money(item.price)}</small><div class="qty-controls"><button data-qty="-1" aria-label="পরিমাণ কমান">−</button><span>${item.quantity.toLocaleString("bn-BD")}</span><button data-qty="1" aria-label="পরিমাণ বাড়ান">+</button></div><button class="remove-line" data-remove>মুছে ফেলুন</button></div><strong>${money(item.price*item.quantity)}</strong></div>`).join("");
    $("#cartItems").querySelectorAll(".cart-line").forEach(row=>{
      const index=Number(row.dataset.index);
      row.querySelectorAll("[data-qty]").forEach(button=>button.addEventListener("click",()=>{cart[index].quantity+=Number(button.dataset.qty);if(cart[index].quantity<=0)cart.splice(index,1);if(cart[index])cart[index].quantity=Math.min(99,cart[index].quantity);saveCart();renderCart();}));
      row.querySelector("[data-remove]").addEventListener("click",()=>{cart.splice(index,1);saveCart();renderCart();});
    });
  }
  function buildOrderMessage(items,heading) {
    const total=items.reduce((sum,item)=>sum+item.price*item.quantity,0);
    let message=`আসসালামু আলাইকুম MIYAD Electronics Shop।\n\n${heading}:\n`;
    items.forEach((item,index)=>{message+=`\n${index+1}. ${item.name}\nমডেল: ${item.model}\nকালার: ${item.color}\nপরিমাণ: ${item.quantity}\nদাম: ${money(item.price*item.quantity)}\n`;});
    message+=`\nসর্বমোট: ${money(total)}\n\nদয়া করে পণ্যের availability ও delivery charge জানাবেন.`; return message;
  }
  function openWhatsApp(message) { const url=`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;window.open(url,"_blank","noopener,noreferrer"); }
  function openCart() { $("#cartDrawer").classList.add("open");$("#drawerBackdrop").classList.add("open");$("#cartDrawer").setAttribute("aria-hidden","false");document.body.style.overflow="hidden"; }
  function closeCart() { $("#cartDrawer").classList.remove("open");$("#drawerBackdrop").classList.remove("open");$("#cartDrawer").setAttribute("aria-hidden","true");document.body.style.overflow=""; }
  function escapeHtml(value) { return String(value??"").replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char])); }
  $("#searchInput").addEventListener("input",renderProducts);$("#sortSelect").addEventListener("change",renderProducts);
  $("#cartOpen").addEventListener("click",openCart);$("#cartClose").addEventListener("click",closeCart);$("#drawerBackdrop").addEventListener("click",closeCart);
  $("#checkoutButton").addEventListener("click",()=>{if(!cart.length){showToast("আপনার কার্ট খালি");return;}openWhatsApp(buildOrderMessage(cart,"আমার অর্ডার"));});
  $("#year").textContent=new Date().getFullYear();
  renderCategories();renderProducts();renderCart();
  subscribeProducts(items=>{PRODUCTS=items;renderProducts();},error=>console.error("Firestore product listener:",error));
})();
