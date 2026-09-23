const products = [
  {id:1,name:'Uniforme antifluido',cat:'uniformes',desc:'Uniforme para trabajo y uso profesional.',img:'WhatsApp Image 2026-09-23 at 9.12.23 AM (1).jpeg'},
  {id:2,name:'Gorras negras',cat:'gorras',desc:'Gorras para personalización y bordado.',img:'WhatsApp Image 2026-09-23 at 9.12.23 AM (10).jpeg'},
  {id:3,name:'Falda de confección',cat:'confeccion',desc:'Prenda confeccionada con diseño en capas.',img:'WhatsApp Image 2026-09-23 at 9.12.23 AM (2).jpeg'},
  {id:4,name:'Gorras bordadas Roinner',cat:'gorras',desc:'Diseños bordados personalizados.',img:'WhatsApp Image 2026-09-23 at 9.12.23 AM (3).jpeg'},
  {id:5,name:'Gorra Vanesa',cat:'gorras',desc:'Diseño personalizado con bordado.',img:'WhatsApp Image 2026-09-23 at 9.12.23 AM (4).jpeg'},
  {id:6,name:'Gorra Arley',cat:'gorras',desc:'Diseño bordado de camión.',img:'WhatsApp Image 2026-09-23 at 9.12.23 AM (5).jpeg'},
  {id:7,name:'Gorra bordada',cat:'gorras',desc:'Modelo personalizado para marca o empresa.',img:'WhatsApp Image 2026-09-23 at 9.12.23 AM (6).jpeg'},
  {id:8,name:'Gorras personalizadas',cat:'gorras',desc:'Variedad de modelos para personalización.',img:'WhatsApp Image 2026-09-23 at 9.12.23 AM (7).jpeg'},
  {id:9,name:'Delantal personalizado',cat:'dotaciones',desc:'Dotación para atención y trabajo.',img:'WhatsApp Image 2026-09-23 at 9.12.23 AM (8).jpeg'},
  {id:10,name:'Gorras en denim',cat:'gorras',desc:'Gorras de tela tipo denim.',img:'WhatsApp Image 2026-09-23 at 9.12.23 AM (9).jpeg'},
  {id:11,name:'Uniforme de cocina',cat:'uniformes',desc:'Chaqueta y pantalón para cocina.',img:'WhatsApp Image 2026-09-23 at 9.12.23 AM.jpeg'},
  {id:12,name:'Dotación Delipan',cat:'dotaciones',desc:'Propuesta de dotación empresarial.',img:'WhatsApp Image 2026-09-23 at 9.12.24 AM (1).jpeg'},
  {id:13,name:'Uniforme antifluido personalizado',cat:'uniformes',desc:'Modelo de uniforme para trabajo.',img:'WhatsApp Image 2026-09-23 at 9.12.24 AM (2).jpeg'},
  {id:14,name:'Delipan — detalle',cat:'dotaciones',desc:'Detalle de diseño y personalización.',img:'WhatsApp Image 2026-09-23 at 9.12.24 AM.jpeg'}
];
let cart = JSON.parse(localStorage.getItem('stileCart') || '[]');
const productsEl=document.getElementById('products'), cartEl=document.getElementById('cart'), overlay=document.getElementById('cartOverlay'), cartItems=document.getElementById('cartItems'), countEl=document.getElementById('cartCount');
function renderProducts(filter='todos'){
  productsEl.innerHTML='';
  products.filter(p=>filter==='todos'||p.cat===filter).forEach(p=>{
    const el=document.createElement('article');el.className='product';
    el.innerHTML=`<div class="product-img"><img src="productos/${p.img}" alt="${p.name}" loading="lazy"><span class="tag">${label(p.cat)}</span></div><div class="product-body"><h3>${p.name}</h3><div class="desc">${p.desc}</div><div class="product-row"><span class="price">Consultar precio</span><button class="add" onclick="addToCart(${p.id})">+ Agregar</button></div></div>`;
    productsEl.appendChild(el);
  });
}
function label(cat){return ({gorras:'Gorras',uniformes:'Uniformes',dotaciones:'Dotación',confeccion:'Confección'})[cat]||cat}
function addToCart(id){const found=cart.find(x=>x.id===id); if(found) found.qty++; else cart.push({id,qty:1}); save(); openCart();}
function save(){localStorage.setItem('stileCart',JSON.stringify(cart));renderCart();}
function renderCart(){countEl.textContent=cart.reduce((a,x)=>a+x.qty,0); if(!cart.length){cartItems.innerHTML='<div class="empty">Tu carrito está vacío.<br>Agrega productos del catálogo para preparar tu pedido.</div>';return;} cartItems.innerHTML=cart.map(x=>{const p=products.find(y=>y.id===x.id);return `<div class="cart-item"><img src="productos/${p.img}" alt=""><div><h4>${p.name}</h4><small>Precio: por cotizar</small><div class="qty"><button onclick="changeQty(${p.id},-1)">−</button><b>${x.qty}</b><button onclick="changeQty(${p.id},1)">+</button></div></div><button class="remove" onclick="removeItem(${p.id})">Eliminar</button></div>`}).join('');}
function changeQty(id,n){const item=cart.find(x=>x.id===id);if(!item)return;item.qty+=n;if(item.qty<=0)cart=cart.filter(x=>x.id!==id);save();}
function removeItem(id){cart=cart.filter(x=>x.id!==id);save();}
function openCart(){cartEl.classList.add('open');overlay.classList.add('open');document.body.style.overflow='hidden';}
function closeCart(){cartEl.classList.remove('open');overlay.classList.remove('open');document.body.style.overflow='';}
document.getElementById('openCart').onclick=openCart;document.getElementById('closeCart').onclick=closeCart;overlay.onclick=closeCart;document.getElementById('clearCart').onclick=()=>{cart=[];save();};
document.querySelectorAll('[data-filter]').forEach(btn=>btn.addEventListener('click',()=>{document.querySelectorAll('[data-filter]').forEach(b=>b.classList.remove('active'));btn.classList.add('active');renderProducts(btn.dataset.filter);document.getElementById('catalogo').scrollIntoView({behavior:'smooth'});}));
document.getElementById('sendOrder').onclick=()=>{if(!cart.length){alert('Agrega al menos un producto al carrito.');return;} const lines=cart.map(x=>{const p=products.find(y=>y.id===x.id);return `• ${x.qty} x ${p.name}`}).join('%0A');const msg=`Hola STILE MRLUG, quiero realizar este pedido:%0A%0A${lines}%0A%0AQuedo atento(a) al precio, disponibilidad y opciones de talla/color.`;window.open(`https://wa.me/573203088653?text=${msg}`,'_blank');};
document.getElementById('year').textContent=new Date().getFullYear();
renderProducts();renderCart();
