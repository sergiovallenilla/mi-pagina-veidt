import React, { useEffect, useMemo, useState } from "react";

/**
 * Veidt Health — Landing Page de Compra Simple
 * -------------------------------------------
 * - Landing Page minimalista enfocada en la compra de membresías.
 * - Elimina secciones de contenido no esenciales y paneles de usuario.
 * - Mantiene la lógica de autenticación y registro con localStorage.
 */

/*****************************\
|* Utilidades y Almacenamiento *|
\*****************************/

const STORAGE_KEY = "veidt_db_v1";
const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);
const nowISO = () => new Date().toISOString();

const DEFAULT_DB = {
  users: [
    { id: "u_member_1", role: "member", email: "miembro@veidt.health", password: "demo123", name: "Ana Pérez", createdAt: nowISO() },
  ],
  clinics: [
    { id: "c_vida_sana", name: "Clínica Vida Sana", address: "Av. Principal 123", phone: "+49 555 0101", inNetwork: true },
  ],
  memberships: [
    { id: "m_1", userId: "u_member_1", plan: "Pleno $2", discountPercent: 30, active: true, clinicId: "c_vida_sana", beneficiaries: ["Ana Pérez"], createdAt: nowISO(), expiresAt: null },
  ],
  studies: [],
  suggestions: [],
  planProposals: [],
  sessions: [],
};

function readDB() { try { const raw = localStorage.getItem(STORAGE_KEY); if (!raw) return { ...DEFAULT_DB }; const parsed = JSON.parse(raw); return { ...DEFAULT_DB, ...parsed }; } catch { return { ...DEFAULT_DB }; } }
function writeDB(db){ localStorage.setItem(STORAGE_KEY, JSON.stringify(db)); }
const DB = {
  all: () => readDB(), save: (db) => writeDB(db),
  insert: (collection, item) => { const db = readDB(); const arr = db[collection] || []; arr.push(item); db[collection]=arr; writeDB(db); return item; },
  findOne:(collection,pred=()=>true)=>{ const db=readDB(); const arr=db[collection]||[]; return arr.find(pred)||null; },
};

/**********************\
|* Toasts y Modales UI *|
\**********************/

function useToasts(){ const [toasts,setToasts]=useState([]); const add=(title,description)=>{ const id=uid(); setToasts(t=>[...t,{id,title,description}]); setTimeout(()=>setToasts(t=>t.filter(x=>x.id!==id)),4000); }; return {toasts,add}; }
function Toasts({items}){ return (<div className="fixed bottom-4 right-4 z-50 space-y-2">{items.map(t=>(<div key={t.id} className="rounded-2xl shadow-lg border bg-white/90 backdrop-blur p-4 w-80" role="status" aria-live="polite"><div className="font-semibold">{t.title}</div>{t.description&&(<div className="text-sm text-gray-600 mt-1">{t.description}</div>)}</div>))}</div>);}
function Modal({open,onClose,title,children,actions}){ useEffect(()=>{ function onKey(e){ if(e.key==="Escape"&&open) onClose?.(); } window.addEventListener("keydown",onKey); return ()=>window.removeEventListener("keydown",onKey); },[open]); if(!open) return null; return (<div className="fixed inset-0 z-40 flex items-center justify-center p-4" aria-modal role="dialog"><div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden/>{/* overlay */}<div className="relative z-50 w-full max-w-2xl rounded-2xl bg-white shadow-xl border"><div className="p-5 border-b"><h3 className="text-lg font-semibold">{title}</h3></div><div className="p-5">{children}</div><div className="p-4 border-t flex gap-3 justify-end">{actions}</div></div></div>); }

/*******************\
|* Autenticación UI *|
\*******************/

function useSession(){ const [user,setUser]=useState(null); const register=(payload)=>{ if(DB.findOne("users",u=>u.email===payload.email)) throw new Error("El correo ya está registrado"); const newUser={id:uid(),createdAt:nowISO(),...payload}; DB.insert("users",newUser); return newUser; }; return {user,register}; }

/**************************************\
|* Componentes de Secciones de Landing *|
\**************************************/

function NavBar({ onOpenAuth }){
  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur border-b">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3"><Logo/><span className="font-extrabold text-xl">Veidt Health</span></div>
        <div className="flex items-center gap-3"><button className="px-3 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700" onClick={onOpenAuth}>Adquirir</button></div>
      </div>
    </header>
  );
}

function Hero({ onPrimaryCTA }){
  return (
    <section id="inicio" className="relative overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 py-16 grid md:grid-cols-2 gap-10 items-center">
        <div>
          <h1 className="text-4xl md:text-5xl font-extrabold leading-tight">Salud accesible para tu familia. <span className="text-blue-600">No es un seguro</span>, es una solución.</h1>
          <p className="mt-4 text-gray-700 text-lg">Membresías desde $1/mes. Sin deducible, sin trámites complicados.</p>
          <div className="mt-6 flex gap-3">
            <a href="#membresias" className="px-4 py-3 rounded-xl bg-blue-600 text-white hover:bg-blue-700" onClick={(e)=>{e.preventDefault();onPrimaryCTA?.("Esencial $1");}}>Comenzar por $1</a>
          </div>
        </div>
        <div className="relative h-72 md:h-96 rounded-3xl overflow-hidden shadow-xl border">
          <Carousel/>
        </div>
      </div>
    </section>
  );
}

function MembresiasPricing({ onBuy }){
  const cards=[
    { name:"Esencial $1", price:1, discount:15, tagline:"Para controles y consultas básicas", features:["Hasta 5 beneficiarios","≈15% de descuento en consultas y labs"], cta:"Adquirir Esencial", popular:false },
    { name:"Pleno $2", price:2, discount:30, tagline:"Más ahorro en el día a día", features:["Hasta 5 beneficiarios","≈30% de descuento en consultas y labs"], cta:"Adquirir Pleno", popular:true },
  ];
  return (
    <section id="membresias" className="py-16 bg-gradient-to-b from-white to-blue-50/40">
      <div className="max-w-6xl mx-auto px-4">
        <h2 className="text-3xl font-bold">Elige tu membresía</h2>
        <p className="text-gray-700 mt-2">Precios por mes. Cancela cuando quieras.</p>
        <div className="mt-8 grid md:grid-cols-2 gap-6">
          {cards.map(c=> (
            <div key={c.name} className={`rounded-2xl border p-6 bg-white shadow-sm relative ${c.popular?"ring-2 ring-blue-600":""}`}>
              {c.popular && (<div className="absolute -top-3 right-4 text-xs px-2 py-1 bg-blue-600 text-white rounded-full">Más popular</div>)}
              <div className="flex items-baseline justify-between">
                <div><div className="text-xl font-semibold">{c.name}</div><div className="text-sm text-gray-600">{c.tagline}</div></div>
                <div className="text-3xl font-extrabold">${c.price}<span className="text-base font-medium">/mes</span></div>
              </div>
              <ul className="mt-4 space-y-2 text-sm text-gray-700">{c.features.map(f=>(<li key={f}>• {f}</li>))}<li className="font-medium">Ahorro estimado: {c.discount}%</li></ul>
              <button className="mt-6 w-full rounded-xl bg-blue-600 text-white py-3 hover:bg-blue-700" onClick={()=>onBuy?.(c.name)}>{c.cta}</button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const carouselImages=[
  "https://images.unsplash.com/photo-1580281657527-47f249e8f3a0?q=80&w=1600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1579154204601-01588f351e67?q=80&w=1600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?q=80&w=1600&auto=format&fit=crop",
];
function Carousel(){ const [idx,setIdx]=useState(0); useEffect(()=>{ const t=setInterval(()=>setIdx(i=>(i+1)%carouselImages.length),3500); return ()=>clearInterval(t); },[]); return (<div className="h-full w-full relative">{carouselImages.map((src,i)=>(<img key={src} src={src} alt="Clínicas y médicos" className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${i===idx?"opacity-100":"opacity-0"}`} loading="lazy"/>))}<div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2">{carouselImages.map((_,i)=>(<button key={i} className={`h-2 w-2 rounded-full ${i===idx?"bg-white":"bg-white/50"}`} onClick={()=>setIdx(i)} aria-label={`Ir a imagen ${i+1}`}/>))}</div></div>); }
function Logo(){ return (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2ZM12 4.5C13.8409 4.5 15.6027 5.0506 17.062 6.07994C18.5214 7.10928 19.6053 8.57969 20.218 10.3204C20.8307 12.0611 20.9419 13.9669 20.5401 15.7661C20.1383 17.5653 19.2374 19.1834 18.0055 20.4578L12 12.75C12 11.2312 11.4554 9.77195 10.4633 8.6475C9.47113 7.52306 8.1157 6.79018 6.64536 6.54133C5.17502 6.29248 3.73714 6.53673 2.45768 7.24584C1.17821 7.95495 0.126435 9.10091 0.126435 9.10091C-0.0384784 9.53979 0.00762104 10.0366 0.198308 10.4285C0.388996 10.8203 0.697486 11.1095 1.07725 11.2065C1.45702 11.3034 1.86015 11.1963 2.19323 10.9004L6.19323 7.2004C6.52631 6.9045 6.93635 6.70014 7.37326 6.60201C7.81017 6.50388 8.2612 6.51408 8.69466 6.6346C9.12813 6.75513 9.54489 6.98394 9.90795 7.31175C10.271 7.63956 10.5694 8.05831 10.7766 8.53093L12 11.1895V4.5Z" fill="currentColor"/></svg>); }

function AuthDialog({ open, onClose, session, toast, selectedPlan }){
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [name,setName]=useState("");

  useEffect(()=>{ if(!open){ setEmail(""); setPassword(""); setName(""); } },[open]);

  function doRegister(){
    try{
      const payload={ role:"member", email:email.trim(), password, name:name.trim() };
      const u=session.register(payload);
      const plan = selectedPlan || "Esencial $1";
      const discountPercent = plan.includes("$1")?15:30;
      DB.insert("memberships",{ id:uid(), userId:u.id, plan, discountPercent, active:true, clinicId: "c_vida_sana", beneficiaries:[u.name], createdAt:nowISO(), expiresAt:null });
      toast.add("¡Membresía activada!",`Tu plan ${plan} está listo.`);
      onClose?.();
    } catch(e){
      toast.add("Error de registro", e.message||"Intenta con otro correo.");
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Adquirir membresía" actions={<><button className="px-4 py-2 rounded-xl border" onClick={onClose}>Cancelar</button><button className="px-4 py-2 rounded-xl bg-blue-600 text-white" onClick={doRegister}>Pagar y registrarme</button></>}>
      <div className="grid md:grid-cols-2 gap-4">
        <div><label className="block text-sm font-medium">Nombre</label><input value={name} onChange={e=>setName(e.target.value)} className="mt-1 w-full rounded-xl border p-3" placeholder="Tu nombre"/></div>
        <div><label className="block text-sm font-medium">Email</label><input value={email} type="email" onChange={e=>setEmail(e.target.value)} className="mt-1 w-full rounded-xl border p-3" placeholder="tucorreo@ejemplo.com"/></div>
        <div><label className="block text-sm font-medium">Contraseña</label><input value={password} type="password" onChange={e=>setPassword(e.target.value)} className="mt-1 w-full rounded-xl border p-3" placeholder="••••••••"/></div>
      </div>
      <div className="mt-4 rounded-2xl border p-4 bg-blue-50/40"><h4 className="font-semibold">Pago (demo)</h4><div className="grid md:grid-cols-3 gap-3 mt-2 text-sm"><input className="rounded-xl border p-3" placeholder="Tarjeta 4242 4242 4242 4242"/><input className="rounded-xl border p-3" placeholder="MM/AA"/><input className="rounded-xl border p-3" placeholder="CVC"/></div><p className="text-xs text-gray-600 mt-2">Al registrarte activamos tu plan {selectedPlan || "Esencial $1"} ({(selectedPlan||"Esencial $1").includes("$1")?"15":"30"}% descuento). Puedes cancelarlo cuando quieras.</p></div>
    </Modal>
  );
}

/************************\
|* Componente Principal *|
\************************/

export default function App() {
  const [authOpen, setAuthOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const { toasts, add: showToast } = useToasts();
  const session = useSession();

  function openAuth(plan = null) {
    setSelectedPlan(plan);
    setAuthOpen(true);
  }

  return (
    <div className="font-sans text-gray-900 bg-white">
      <NavBar onOpenAuth={() => openAuth("Esencial $1")} />
      <main>
        <Hero onPrimaryCTA={openAuth} />
        <MembresiasPricing onBuy={openAuth} />
      </main>
      <AuthDialog
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        session={session}
        toast={showToast}
        selectedPlan={selectedPlan}
      />
      <Toasts items={toasts} />
    </div>
  );
}
