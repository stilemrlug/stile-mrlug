let products = [];
let cart = JSON.parse(localStorage.getItem('stileCart') || '[]');
const productsEl=document.getElementById('products'), cartEl=document.getElementById('cart'), overlay=document.getElementById('cartOverlay'), cartItems=document.getElementById('cartItems'), countEl=document.getElementById('cartCount');
const categoryKey = value => String(value || 'otros').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,'_');
function imageFor(p){ return p.image_url || (p.img ? 'productos/'+p.img : ''); }
function escapeHtml(value){return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function money(value){return value==null || value==='' || Number(value)===0 ? 'Consultar precio' : new Intl.NumberFormat('es-CO',{style:'currency',currency:'COP',maximumFractionDigits:0}).format(Number(value));}
function label(cat){return ({gorras:'Gorras',uniformes:'Uniformes',dotaciones:'Dotaciones',dotacion:'Dotaciones',confeccion:'Confección',otros:'Otros'})[categoryKey(cat)]||cat||'Otros';}
function renderProducts(filter='todos'){
  productsEl.innerHTML='';
  const filtered=products.filter(p=>filter==='todos'||categoryKey(p.cat)===categoryKey(filter));
  if(!filtered.length){productsEl.innerHTML='<p class="empty">Todavía no hay productos publicados en esta categoría.</p>';return;}
  filtered.forEach(p=>{
    const el=document.createElement('article');el.className='product';
    const stockKnown=p.stock!==undefined&&p.stock!==null&&p.stock!=='';
    const outOfStock=stockKnown&&Number(p.stock)<=0;
    const variants=[p.sizes?'Tallas: '+escapeHtml(p.sizes):'',p.colors?'Colores: '+escapeHtml(p.colors):''].filter(Boolean).join(' · ');
    const img=imageFor(p);
    el.innerHTML=`<div class="product-img">${img?`<img src="${escapeHtml(img)}" alt="${escapeHtml(p.name)}" loading="lazy">`:'<div class="empty">Sin fotografía</div>'}<span class="tag">${escapeHtml(label(p.cat))}</span></div><div class="product-body"><h3>${escapeHtml(p.name)}</h3><div class="desc">${escapeHtml(p.desc||'')}</div>${variants?`<div class="desc">${variants}</div>`:''}<div class="product-row"><span class="price">${money(p.price)}</span><button class="add" ${outOfStock?'disabled':''} onclick="addToCart('${String(p.id).replace(/'/g,"\\'")}')">${outOfStock?'Agotado':'+ Agregar'}</button></div>${stockKnown?`<small class="stock-label">${outOfStock?'Agotado':'Disponibles: '+Number(p.stock)}</small>`:''}</div>`;
    productsEl.appendChild(el);
  });
}
async function loadProductsFromCloud(){
  productsEl.innerHTML='<p class="empty">Cargando catálogo…</p>';
  if(!window.supabase || !window.STILE_SUPABASE_URL || !window.STILE_SUPABASE_ANON_KEY){
    productsEl.innerHTML='<p class="empty">No se pudo configurar el catálogo. Revisa supabase-config.js.</p>';return;
  }
  try{
    const client=window.supabase.createClient(window.STILE_SUPABASE_URL,window.STILE_SUPABASE_ANON_KEY);
    const {data,error}=await client.from('products').select('*').order('created_at',{ascending:false});
    if(error) throw error;
    products=(data||[]).map(p=>({id:String(p.id),name:p.name,cat:p.category||'otros',desc:p.description||'',img:'',image_url:p.image_url,price:p.price,sizes:p.sizes,colors:p.colors,stock:p.stock}));
    cart=cart.filter(x=>products.some(p=>String(p.id)===String(x.id)));
    localStorage.setItem('stileCart',JSON.stringify(cart));
    renderProducts(document.querySelector('[data-filter].active')?.dataset.filter||'todos');renderCart();
  }catch(err){
    products=[];renderProducts();renderCart();
    console.error('No se pudo cargar el catálogo desde Supabase.',err);
    productsEl.innerHTML='<p class="empty">No fue posible cargar los productos. Revisa la conexión y los permisos de lectura de Supabase.</p>';
  }
}
function addToCart(id){id=String(id);const found=cart.find(x=>String(x.id)===id);if(found)found.qty++;else cart.push({id,qty:1});save();openCart();}
function save(){localStorage.setItem('stileCart',JSON.stringify(cart));renderCart();}
function renderCart(){
  cart=cart.filter(x=>products.some(p=>String(p.id)===String(x.id)));
  countEl.textContent=cart.reduce((a,x)=>a+x.qty,0);
  if(!cart.length){cartItems.innerHTML='<div class="empty">Tu carrito está vacío.<br>Agrega productos del catálogo para preparar tu pedido.</div>';return;}
  cartItems.innerHTML=cart.map(x=>{const p=products.find(y=>String(y.id)===String(x.id));const id=JSON.stringify(String(p.id));return `<div class="cart-item"><img src="${escapeHtml(imageFor(p))}" alt=""><div><h4>${escapeHtml(p.name)}</h4><small>Precio: ${money(p.price)}</small><div class="qty"><button onclick="changeQty(${id},-1)">−</button><b>${x.qty}</b><button onclick="changeQty(${id},1)">+</button></div></div><button class="remove" onclick="removeItem(${id})">Eliminar</button></div>`;}).join('');
}
function changeQty(id,n){id=String(id);const item=cart.find(x=>String(x.id)===id);if(!item)return;item.qty+=n;if(item.qty<=0)cart=cart.filter(x=>String(x.id)!==id);save();}
function removeItem(id){id=String(id);cart=cart.filter(x=>String(x.id)!==id);save();}
function openCart(){cartEl.classList.add('open');overlay.classList.add('open');document.body.style.overflow='hidden';}
function closeCart(){cartEl.classList.remove('open');overlay.classList.remove('open');document.body.style.overflow='';}
document.getElementById('openCart').onclick=openCart;document.getElementById('closeCart').onclick=closeCart;overlay.onclick=closeCart;document.getElementById('clearCart').onclick=()=>{cart=[];save();};
document.querySelectorAll('[data-filter]').forEach(btn=>btn.addEventListener('click',()=>{document.querySelectorAll('[data-filter]').forEach(b=>b.classList.remove('active'));btn.classList.add('active');renderProducts(btn.dataset.filter);document.getElementById('catalogo').scrollIntoView({behavior:'smooth'});}));
document.getElementById('sendOrder').onclick=()=>{if(!cart.length){alert('Agrega al menos un producto al carrito.');return;}const lines=cart.map(x=>{const p=products.find(y=>String(y.id)===String(x.id));return `• ${x.qty} x ${p.name}`;}).join('%0A');const msg=`Hola STILE MRLUG, quiero realizar este pedido:%0A%0A${lines}%0A%0AQuedo atento(a) al precio, disponibilidad y opciones de talla/color.`;window.open(`https://wa.me/573203088653?text=${msg}`,'_blank');};
document.getElementById('year').textContent=new Date().getFullYear();
renderProducts();renderCart();loadProductsFromCloud();
