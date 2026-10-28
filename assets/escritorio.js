// camilovegga.com · the desktop. Everything comes from data/escritorio.json:
//   fondo / fondos  → wallpaper (the visitor can switch it from the "Fondo" menu)
//   proyectos       → one small square per creative project, scattered on the desktop
//   dock            → the programs at the bottom; each opens a window or a link ("|" draws a separator)
(function(){
const $=s=>document.querySelector(s);
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const store={get(k){try{return JSON.parse(localStorage.getItem("cv-"+k))}catch(e){return null}},set(k,v){try{localStorage.setItem("cv-"+k,JSON.stringify(v))}catch(e){}}};
const phone=()=>matchMedia("(max-width:640px)").matches;

// ---------- program icons (drawn here, so any of them can later be swapped for an image: "icono": "assets/iconos/x.png")
const ADOBE=(bg,fg,t)=>`<svg viewBox="0 0 100 100"><rect width="100" height="100" rx="22" fill="${bg}"/><rect x="5" y="5" width="90" height="90" rx="18" fill="none" stroke="${fg}" stroke-width="2.4" opacity=".9"/><text x="50" y="64" text-anchor="middle" font-family="Geist,Helvetica,Arial,sans-serif" font-weight="600" font-size="42" fill="${fg}">${t}</text></svg>`;
const ICONS={
  ae:ADOBE("#00005b","#9999ff","Ae"),
  ps:ADOBE("#001e36","#31a8ff","Ps"),
  ai:ADOBE("#330000","#ff9a00","Ai"),
  notas:`<svg viewBox="0 0 100 100"><rect width="100" height="100" rx="22" fill="#fff"/><path d="M0 22A22 22 0 0 1 22 0h56a22 22 0 0 1 22 22v8H0z" fill="#ffd52e"/><g stroke="#d9d9de" stroke-width="2.5"><path d="M14 48h72M14 62h72M14 76h72"/></g></svg>`,
  fotos:`<svg viewBox="0 0 100 100"><rect width="100" height="100" rx="22" fill="#fff"/><g transform="translate(50 50)" opacity=".92">${["#f9a12e","#fbd331","#a8d84e","#4fc0a5","#4a9ff5","#8e6ff2","#e45bb8","#f2575a"].map((c,i)=>`<ellipse rx="11" ry="20" cy="-14" fill="${c}" transform="rotate(${i*45})" style="mix-blend-mode:multiply"/>`).join("")}</g></svg>`,
  instagram:`<svg viewBox="0 0 100 100"><defs><radialGradient id="ig" cx=".3" cy="1.05" r="1.2"><stop offset="0" stop-color="#fdd56b"/><stop offset=".25" stop-color="#fa7e1e"/><stop offset=".5" stop-color="#d62976"/><stop offset=".75" stop-color="#962fbf"/><stop offset="1" stop-color="#4f5bd5"/></radialGradient></defs><rect width="100" height="100" rx="22" fill="url(#ig)"/><rect x="24" y="24" width="52" height="52" rx="15" fill="none" stroke="#fff" stroke-width="6"/><circle cx="50" cy="50" r="12" fill="none" stroke="#fff" stroke-width="6"/><circle cx="66.5" cy="33.5" r="3.6" fill="#fff"/></svg>`,
  correo:`<svg viewBox="0 0 100 100"><defs><linearGradient id="ml" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1fb4ff"/><stop offset="1" stop-color="#1a6dff"/></linearGradient></defs><rect width="100" height="100" rx="22" fill="url(#ml)"/><rect x="20" y="30" width="60" height="42" rx="6" fill="#fff"/><path d="M22 33l28 21 28-21" fill="none" stroke="#1a7cff" stroke-width="4" stroke-linejoin="round"/></svg>`,
  papelera:`<svg viewBox="0 0 100 100"><defs><linearGradient id="tr" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#e9edf2"/><stop offset=".5" stop-color="#ffffff"/><stop offset="1" stop-color="#d8dee6"/></linearGradient></defs><path d="M24 22h52l-5 66a6 6 0 0 1-6 5H35a6 6 0 0 1-6-5z" fill="url(#tr)" stroke="#b9c2ce" stroke-width="1.5"/><ellipse cx="50" cy="22" rx="27" ry="5" fill="#f4f6f9" stroke="#b9c2ce" stroke-width="1.5"/><g stroke="#c4ccd7" stroke-width="2.4" stroke-linecap="round"><path d="M37 34l2 50M50 34v50M63 34l-2 50"/></g></svg>`,
  carpeta:`<svg viewBox="0 0 100 100"><path d="M8 26a6 6 0 0 1 6-6h24l8 8h40a6 6 0 0 1 6 6v44a6 6 0 0 1-6 6H14a6 6 0 0 1-6-6z" fill="#5ab3f5"/><path d="M8 36h84v42a6 6 0 0 1-6 6H14a6 6 0 0 1-6-6z" fill="#7cc6fa"/></svg>`
};
const iconHTML=k=>ICONS[k]||(k?`<img src="${esc(k)}" alt="">`:ICONS.carpeta);

let D={fondo:"nubes",fondos:[],proyectos:[],dock:[]};

// ---------- wallpaper
function setWall(id){
  const f=D.fondos.find(x=>x.id===id)||D.fondos[0];if(!f)return;
  $("#wall").style.backgroundImage=`url("${f.imagen}")`;
  document.documentElement.style.setProperty("--blur",(f.blur??14)+"px");
  store.set("fondo",f.id);renderFondoMenu();
}
function renderFondoMenu(){
  const cur=store.get("fondo")||D.fondo;
  $("#fondoMenu").innerHTML=D.fondos.map(f=>`<button role="menuitemradio" aria-checked="${f.id===cur}" data-fondo="${esc(f.id)}"><span class="ck">${f.id===cur?"✓":""}</span>${esc(f.nombre)}</button>`).join("");
}

// ---------- scattered positions: a stable "random" spot per project (seeded by its id), unless it has x/y or the visitor moved it
function rng(seed){let h=1779033703^seed.length;for(let i=0;i<seed.length;i++){h=Math.imul(h^seed.charCodeAt(i),3432918353);h=h<<13|h>>>19;}return()=>{h=Math.imul(h^h>>>16,2246822507);h=Math.imul(h^h>>>13,3266489909);return((h^=h>>>16)>>>0)/4294967296;};}
function layout(){
  const W=innerWidth,H=innerHeight-parseInt(getComputedStyle(document.documentElement).getPropertyValue("--mb"));
  const pad=phone()?46:70,top=pad,bottom=H-(phone()?110:130);
  const placed=[],moved=store.get("pos")||{};
  return D.proyectos.map(p=>{
    if(moved[p.id])return {p,x:moved[p.id][0]*W,y:moved[p.id][1]*H};
    if(p.x!=null&&p.y!=null)return {p,x:p.x/100*W,y:p.y/100*H};
    const r=rng(p.id||p.titulo||"x");let best=null,bestD=-1;
    for(let k=0;k<40;k++){
      const x=pad+r()*(W-2*pad),y=top+r()*Math.max(40,bottom-top);
      const d=Math.min(...placed.map(q=>Math.hypot(q[0]-x,q[1]-y)),1e9);
      if(d>bestD){best=[x,y];bestD=d;}if(d>(phone()?96:120))break;
    }
    placed.push(best);return {p,x:best[0],y:best[1]};
  });
}
function renderDesk(){
  const items=layout();
  $("#desk").innerHTML=items.map(({p,x,y})=>`<button class="ico" data-p="${esc(p.id)}" style="left:${x}px;top:${y}px"><span class="th">${p.portada?`<img src="${esc(p.portada)}" alt="" draggable="false" loading="lazy">`:""}</span><span class="lb">${esc(p.titulo)}</span></button>`).join("");
  $("#empty").hidden=D.proyectos.length>0;
}

// ---------- dock (magnifies under the pointer like a real dock)
function renderDock(){
  $("#dock").innerHTML=D.dock.map(a=>a==="|"?`<span class="sep"></span>`:`<button class="app" data-app="${esc(a.id)}" aria-label="${esc(a.nombre)}">${iconHTML(a.icono)}<span class="tip">${esc(a.nombre)}</span></button>`).join("");
}
const dock=$("#dock");
dock.addEventListener("pointermove",e=>{if(e.pointerType!=="mouse"||phone())return;
  dock.querySelectorAll(".app").forEach(el=>{const r=el.getBoundingClientRect(),d=Math.abs(e.clientX-(r.left+r.width/2));const s=1+Math.max(0,1-d/150)*.55;el.style.transform=`scale(${s.toFixed(3)})`;});});
dock.addEventListener("pointerleave",()=>dock.querySelectorAll(".app").forEach(el=>el.style.transform=""));

// ---------- windows
let zTop=25,openCount=0;
function openWin(key,title,html){
  let w=document.querySelector(`.win[data-k="${CSS.escape(key)}"]`);
  if(!w){
    w=document.createElement("section");w.className="win";w.dataset.k=key;w.setAttribute("role","dialog");w.setAttribute("aria-label",title);
    const off=(openCount++%6)*26;
    w.style.left=Math.max(16,(innerWidth-Math.min(640,innerWidth-32))/2+off-60)+"px";w.style.top=(innerHeight*.12+off)+"px";
    $("#wins").appendChild(w);
  }
  w.innerHTML=`<div class="bar"><span class="tl"><i class="x" data-close title="Cerrar"></i><i class="m"></i><i class="z"></i></span><b>${esc(title)}</b></div><div class="body">${html}</div>`;
  w.style.zIndex=++zTop;markDock();
  if(!phone())requestAnimationFrame(()=>{const r=w.getBoundingClientRect(),floor=innerHeight-96,mb=parseInt(getComputedStyle(document.documentElement).getPropertyValue("--mb"));
    if(r.bottom>floor)w.style.top=Math.max(mb+10,floor-r.height)+"px";});
  w.querySelectorAll("img").forEach(im=>im.addEventListener("load",()=>{if(phone())return;const r=w.getBoundingClientRect(),floor=innerHeight-96;if(r.bottom>floor)w.style.top=Math.max(40,floor-r.height)+"px";},{once:true}));
  return w;
}
function closeWin(w){w.remove();markDock();}
function markDock(){const open=[...document.querySelectorAll(".win")].map(w=>w.dataset.k);dock.querySelectorAll(".app").forEach(b=>b.classList.toggle("on",open.includes("app:"+b.dataset.app)));}

function projectWin(p){
  const imgs=(p.imagenes||[]).map(s=>`<img src="${esc(s)}" alt="" loading="lazy">`).join("");
  openWin("p:"+p.id,p.titulo,`${p.portada?`<img class="cover" src="${esc(p.portada)}" alt="">`:""}<h2>${esc(p.titulo)}</h2>
    <div class="meta">${esc([p.tipo,p.año].filter(Boolean).join(" · "))}</div>${p.texto?`<p>${esc(p.texto).replace(/\n/g,"<br>")}</p>`:""}
    ${imgs?`<div class="gal">${imgs}</div>`:""}${p.enlace?`<a class="btn" href="${esc(p.enlace)}" target="_blank" rel="noopener">Ver proyecto ↗</a>`:""}`);
}
function appWin(a){
  if(a.enlace){window.open(a.enlace,"_blank","noopener");return;}
  if(a.id==="papelera"){
    const ideas=a.ideas||[];
    openWin("app:"+a.id,a.nombre,ideas.length?`<ul class="list">${ideas.map(i=>`<li><p style="margin:0 0 10px"><b>${esc(i.titulo||"")}</b><br>${esc(i.texto||i)}</p></li>`).join("")}</ul>`
      :`<div class="soon">${ICONS.papelera}<b>La papelera está vacía</b><span>Aquí van a caer las ideas sueltas.</span></div>`);return;
  }
  openWin("app:"+a.id,a.nombre,`<div class="soon">${iconHTML(a.icono)}<b>${esc(a.nombre)}</b><span>${esc(a.texto||"Muy pronto.")}</span></div>`);
}
function listWin(){
  openWin("proyectos","Proyectos",D.proyectos.length?`<ul class="list">${D.proyectos.map(p=>`<li><button data-open-p="${esc(p.id)}">${p.portada?`<img src="${esc(p.portada)}" alt="">`:`<span style="width:40px;height:40px">${ICONS.carpeta}</span>`}<span><b>${esc(p.titulo)}</b><br><small>${esc([p.tipo,p.año].filter(Boolean).join(" · "))}</small></span></button></li>`).join("")}</ul>`
    :`<div class="soon">${ICONS.carpeta}<b>Todavía no hay proyectos</b><span>Cada proyecto creativo va a aparecer como un cuadrito en el escritorio.</span></div>`);
}
function aboutWin(){
  openWin("sobre","Camilo Vegga",`<div class="soon"><img src="assets/por-amor-al-arte.png" alt="Por Amor al Arte" style="width:min(360px,100%);filter:invert(1)"><span>El escritorio de Camilo Vegga.<br>Proyectos creativos, ideas y procesos. Por amor al arte.</span></div>`);
}

// ---------- interactions: drag icons and windows, tap/double-click to open
let drag=null;
document.addEventListener("pointerdown",e=>{
  const ico=e.target.closest(".ico"),bar=e.target.closest(".win .bar");
  document.querySelectorAll(".ico.sel").forEach(x=>x!==ico&&x.classList.remove("sel"));
  const w=e.target.closest(".win");if(w)w.style.zIndex=++zTop;
  if(e.target.closest("[data-close]"))return;
  if(ico){ico.classList.add("sel");drag={el:ico,kind:"ico",sx:e.clientX,sy:e.clientY,ox:parseFloat(ico.style.left),oy:parseFloat(ico.style.top),moved:false};ico.setPointerCapture(e.pointerId);}
  else if(bar&&!phone()){const r=w.getBoundingClientRect();drag={el:w,kind:"win",sx:e.clientX,sy:e.clientY,ox:r.left,oy:r.top,moved:false};bar.setPointerCapture(e.pointerId);}
});
document.addEventListener("pointermove",e=>{if(!drag)return;const dx=e.clientX-drag.sx,dy=e.clientY-drag.sy;if(!drag.moved&&Math.hypot(dx,dy)<5)return;drag.moved=true;
  if(drag.kind==="ico"){drag.el.classList.add("drag");drag.el.style.left=drag.ox+dx+"px";drag.el.style.top=drag.oy+dy+"px";}
  else{drag.el.style.left=Math.max(-200,drag.ox+dx)+"px";drag.el.style.top=Math.max(4,drag.oy+dy)+"px";}});
document.addEventListener("pointerup",e=>{if(!drag)return;const d=drag;drag=null;
  if(d.kind==="ico"){d.el.classList.remove("drag");
    if(d.moved){const pos=store.get("pos")||{},H=innerHeight-parseInt(getComputedStyle(document.documentElement).getPropertyValue("--mb"));pos[d.el.dataset.p]=[parseFloat(d.el.style.left)/innerWidth,parseFloat(d.el.style.top)/H];store.set("pos",pos);}
    else if(phone()||e.pointerType!=="mouse"){const p=D.proyectos.find(x=>x.id===d.el.dataset.p);p&&projectWin(p);}}});
document.addEventListener("dblclick",e=>{const ico=e.target.closest(".ico");if(ico){const p=D.proyectos.find(x=>x.id===ico.dataset.p);p&&projectWin(p);}});
document.addEventListener("click",e=>{
  const c=e.target.closest("[data-close]");if(c){closeWin(c.closest(".win"));return;}
  const a=e.target.closest("[data-app]");if(a){const app=D.dock.find(x=>x&&x.id===a.dataset.app);app&&appWin(app);return;}
  const op=e.target.closest("[data-open-p]");if(op){const p=D.proyectos.find(x=>x.id===op.dataset.openP);p&&projectWin(p);return;}
  const fm=e.target.closest("[data-fondo]");if(fm){setWall(fm.dataset.fondo);toggleFondo(false);return;}
  if(e.target.closest("#mbFondo")){toggleFondo();return;}
  const wb=e.target.closest("[data-win]");if(wb){toggleFondo(false);wb.dataset.win==="sobre"?aboutWin():listWin();return;}
  if(!e.target.closest("#fondoMenu"))toggleFondo(false);
});
document.addEventListener("keydown",e=>{if(e.key==="Escape"){toggleFondo(false);const ws=[...document.querySelectorAll(".win")].sort((a,b)=>b.style.zIndex-a.style.zIndex);ws[0]&&closeWin(ws[0]);}});
function toggleFondo(force){const m=$("#fondoMenu"),b=$("#mbFondo"),show=force??m.hidden;m.hidden=!show;b.setAttribute("aria-expanded",String(show));if(show){const r=b.getBoundingClientRect();m.style.left=r.left+"px";}}

// ---------- clock (menu bar)
function tick(){const d=new Date();const day=d.toLocaleDateString("es",{weekday:"short",day:"numeric",month:"short"}).replace(/\./g,"");const t=d.toLocaleTimeString("es",{hour:"2-digit",minute:"2-digit"});$("#clock").textContent=phone()?t:`${day}  ${t}`;}
tick();setInterval(tick,15000);

let rt;addEventListener("resize",()=>{clearTimeout(rt);rt=setTimeout(()=>{renderDesk();tick();},120);});

// ---------- boot
fetch("data/escritorio.json",{cache:"no-cache"}).then(r=>r.json()).then(d=>{D=Object.assign(D,d);
  setWall(store.get("fondo")&&D.fondos.some(f=>f.id===store.get("fondo"))?store.get("fondo"):D.fondo);
  renderDock();renderDesk();
}).catch(()=>{$("#empty").hidden=false;$("#empty").textContent="No se pudo cargar el escritorio.";});
})();
