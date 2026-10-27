const $ = id => document.getElementById(id);
let supabaseClient = null, currentProducts = [], previewUrl = null;
const requiredConfig = () => window.STILE_SUPABASE_URL && !window.STILE_SUPABASE_URL.includes("PEGA_AQUI") && window.STILE_SUPABASE_ANON_KEY && !window.STILE_SUPABASE_ANON_KEY.includes("PEGA_AQUI");
if (!requiredConfig()) {
  $("setupNotice").classList.remove("hidden");
  $("setupNotice").innerHTML = "<strong>Falta configurar la conexión.</strong><br>Abre el archivo <code>supabase-config.js</code> y agrega la URL y la clave publicable de tu proyecto Supabase. Sigue las instrucciones de LEEME-APP.txt.";
} else {
  supabaseClient = window.supabase.createClient(window.STILE_SUPABASE_URL, window.STILE_SUPABASE_ANON_KEY);
  init();
}
async function init(){
  const {data:{session}} = await supabaseClient.auth.getSession();
  if(session) await showApp();
  supabaseClient.auth.onAuthStateChange((_event, session)=>{ if(session) showApp(); else showAuth(); });
}
function showAuth(){ $("authPanel").classList.remove("hidden"); $("appPanel").classList.add("hidden"); }
async function showApp(){ $("authPanel").classList.add("hidden"); $("appPanel").classList.remove("hidden"); await loadProducts(); }
$("loginForm").addEventListener("submit", async e=>{
  e.preventDefault(); $("authMessage").textContent="Verificando acceso…";
  const {error}=await supabaseClient.auth.signInWithPassword({email:$("email").value.trim(),password:$("password").value});
  $("authMessage").textContent=error ? "No se pudo iniciar sesión. Verifica el correo, la contraseña y que el usuario esté creado en Supabase." : "";
});
$("logoutBtn").onclick=async()=>{await supabaseClient.auth.signOut();resetForm();showAuth();};
$("photo").addEventListener("change",()=>{
  const f=$("photo").files[0]; if(!f)return;
  if(previewUrl) URL.revokeObjectURL(previewUrl); previewUrl=URL.createObjectURL(f);
  $("preview").src=previewUrl; $("preview").classList.remove("hidden"); $("noPreview").classList.add("hidden");
});
async function loadProducts(){
  $("productList").innerHTML='<div class="empty">Cargando productos…</div>';
  const {data,error}=await supabaseClient.from("products").select("*").order("created_at",{ascending:false});
  if(error){$("productList").innerHTML='<div class="empty">No se pudo leer el catálogo. Revisa las tablas y las políticas de acceso del archivo SQL.</div>';return;}
  currentProducts=data||[]; renderList();
}
function renderList(){
  const q=$("search").value.trim().toLowerCase();
  const list=currentProducts.filter(p=>(p.name||"").toLowerCase().includes(q));
  if(!list.length){$("productList").innerHTML='<div class="empty">Todavía no hay productos que mostrar.</div>';return;}
  $("productList").innerHTML=list.map(p=>`<article class="product-row">
    <img src="${safe(p.image_url||"")}" alt="" onerror="this.style.visibility='hidden'">
    <div class="product-info"><strong>${safe(p.name)}</strong><small>${money(p.price)} · Stock: ${Number(p.stock)||0}</small><small>Tallas: ${safe(p.sizes||"—")} · Colores: ${safe(p.colors||"—")}</small></div>
    <div class="row-actions"><button class="secondary" data-edit="${p.id}">Editar</button><button class="danger" data-delete="${p.id}">Eliminar</button></div>
  </article>`).join("");
  document.querySelectorAll("[data-edit]").forEach(b=>b.onclick=()=>editProduct(b.dataset.edit));
  document.querySelectorAll("[data-delete]").forEach(b=>b.onclick=()=>deleteProduct(b.dataset.delete));
}
$("search").addEventListener("input",renderList);
function editProduct(id){
  const p=currentProducts.find(x=>String(x.id)===String(id)); if(!p)return;
  $("productId").value=p.id;$("name").value=p.name||"";$("price").value=p.price??"";$("category").value=p.category||"uniformes";$("stock").value=p.stock??0;$("sizes").value=p.sizes||"";$("colors").value=p.colors||"";$("description").value=p.description||"";
  $("photo").value="";$("formTitle").textContent="Editar producto";$("saveBtn").textContent="Guardar cambios";$("cancelEdit").classList.remove("hidden");
  if(p.image_url){$("preview").src=p.image_url;$("preview").classList.remove("hidden");$("noPreview").classList.add("hidden");}else{$("preview").classList.add("hidden");$("noPreview").classList.remove("hidden");}
  window.scrollTo({top:0,behavior:"smooth"});
}
function resetForm(){
  $("productForm").reset();$("productId").value="";$("stock").value=0;$("formTitle").textContent="Agregar producto";$("saveBtn").textContent="Guardar producto";$("cancelEdit").classList.add("hidden");$("preview").classList.add("hidden");$("noPreview").classList.remove("hidden");$("formMessage").textContent="";
}
$("cancelEdit").onclick=resetForm;
async function uploadPhoto(file){
  if(!file)return null;
  if(!file.type.startsWith("image/"))throw new Error("El archivo debe ser una imagen.");
  if(file.size>8*1024*1024)throw new Error("La imagen debe pesar menos de 8 MB.");
  const ext=(file.name.split(".").pop()||"jpg").toLowerCase().replace(/[^a-z0-9]/g,"")||"jpg";
  const path=`${crypto.randomUUID()}.${ext}`;
  const {error}=await supabaseClient.storage.from("product-images").upload(path,file,{upsert:false,contentType:file.type});
  if(error)throw error;
  const {data}=supabaseClient.storage.from("product-images").getPublicUrl(path);
  return data.publicUrl;
}
$("productForm").addEventListener("submit",async e=>{
  e.preventDefault();$("saveBtn").disabled=true;$("formMessage").textContent="Guardando…";
  try{
    const id=$("productId").value;
    const old=currentProducts.find(p=>String(p.id)===String(id));
    let image_url=old?.image_url||null;
    const file=$("photo").files[0];if(file)image_url=await uploadPhoto(file);
    const payload={name:$("name").value.trim(),price:Number($("price").value),category:$("category").value,stock:Number($("stock").value),sizes:$("sizes").value.trim(),colors:$("colors").value.trim(),description:$("description").value.trim(),image_url,updated_at:new Date().toISOString()};
    if(id){const {error}=await supabaseClient.from("products").update(payload).eq("id",id);if(error)throw error;}
    else{const {error}=await supabaseClient.from("products").insert(payload);if(error)throw error;}
    $("formMessage").textContent="Producto guardado. Actualizando catálogo…";resetForm();await loadProducts();
  }catch(err){$("formMessage").textContent="No se pudo guardar: "+(err.message||"revisa la configuración y los permisos.");}
  finally{$("saveBtn").disabled=false;}
});
async function deleteProduct(id){
  const p=currentProducts.find(x=>String(x.id)===String(id));if(!p||!confirm(`¿Eliminar "${p.name}" del catálogo? Esta acción no se puede deshacer.`))return;
  const {error}=await supabaseClient.from("products").delete().eq("id",id);
  if(error){alert("No se pudo eliminar el producto. Revisa los permisos.");return;}
  await loadProducts();
}
function money(v){return v==null||v===""?"Consultar precio":new Intl.NumberFormat("es-CO",{style:"currency",currency:"COP",maximumFractionDigits:0}).format(Number(v)||0);}
function safe(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
