import React, { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue, set } from "firebase/database";
import {
  ShoppingCart, History, Settings, Wine, Plus, Edit3, Trash2, X, Loader2, 
  CheckCircle2, User, LogOut, AlertCircle, ListFilter, ClipboardList, 
  AlertTriangle, Trash, FileText, BarChart3, Save, Calendar, ChevronUp, ChevronDown, 
  ArrowLeft, Info
} from 'lucide-react';

// === FIREBASE CONFIG ===
const firebaseConfig = {
  apiKey: "AIzaSyDL7h0nWWE4YV_IMXO7_gupvf1QUZamHGU",
  authDomain: "bobbys-cafe.firebaseapp.com",
  databaseURL: "https://bobbys-cafe-default-rtdb.firebaseio.com",
  projectId: "bobbys-cafe",
  storageBucket: "bobbys-cafe.firebasestorage.app",
  messagingSenderId: "605393276080",
  appId: "1:605393276080:web:e62049aadf7940b5b23f75"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const colors = { 
  primary: '#8E3A3A', // Terracotta
  background: '#F4EBE2', // Sand
  textDark: '#432C2C', // Coffee
  success: '#5B8C5A', // Sage
  accent: '#D4AF37' // Gold
};

const ADMIN_PIN = "8923";

const CafeOrderingApp = () => {
  // SESSION LOGIC: Clears on refresh
  const [staffName, setStaffName] = useState(sessionStorage.getItem('staffName') || '');
  const [isLoggedIn, setIsLoggedIn] = useState(!!sessionStorage.getItem('staffName'));
  
  const [view, setView] = useState('orders');
  const [suppliers, setSuppliers] = useState([]);
  const [wastageItems, setWastageItems] = useState([]);
  const [orderHistory, setOrderHistory] = useState({});
  const [orderQuantities, setOrderQuantities] = useState({});
  const [wastageData, setWastageData] = useState({});
  const [incidents, setIncidents] = useState({});
  const [loading, setLoading] = useState(true);
  
  // ADMIN STATE
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState("");

  const today = new Date();
  const todayKey = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
  const displayDate = today.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  // FORCE LOGOUT ON RELOAD & SYNC DB
  useEffect(() => {
    const handleUnload = () => sessionStorage.clear();
    window.addEventListener('beforeunload', handleUnload);
    
    const dataRef = ref(db, 'cafe_data');
    const unsubscribe = onValue(dataRef, (snapshot) => {
      const data = snapshot.val() || {};
      setSuppliers(data.suppliers || []);
      setWastageItems(data.wastageItems || []);
      setOrderHistory(data.history || {});
      setOrderQuantities(data.quantities || {});
      setWastageData(data.wastage || {});
      setIncidents(data.incidents || {});
      setLoading(false);
    });

    return () => {
      window.removeEventListener('beforeunload', handleUnload);
      unsubscribe();
    };
  }, []);

  const saveToFirebase = (path, data) => set(ref(db, `cafe_data/${path}`), data);

  if (loading) return <div className="h-screen flex items-center justify-center bg-[#F4EBE2]"><Loader2 className="animate-spin text-[#8E3A3A] w-12 h-12" /></div>;

  // LOGIN SCREEN
  if (!isLoggedIn) {
    return (
      <div className="h-screen flex items-center justify-center p-6 bg-[#F4EBE2]">
        <form onSubmit={(e) => { e.preventDefault(); if(staffName.trim()){ sessionStorage.setItem('staffName', staffName); setIsLoggedIn(true); }}} className="w-full max-w-sm bg-white rounded-[40px] p-8 shadow-2xl text-center border-t-8 border-[#8E3A3A]">
          <div className="bg-stone-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"><Wine className="text-stone-400 w-10 h-10" /></div>
          <h1 className="font-serif text-3xl mb-2 text-[#432C2C]">Bobby's</h1>
          <p className="text-[10px] font-black uppercase tracking-widest text-stone-400 mb-8">Management System</p>
          <input autoFocus className="w-full p-4 rounded-2xl bg-stone-50 mb-4 outline-none text-center font-bold border-2 border-transparent focus:border-[#D4AF37] transition-all" placeholder="Enter Your Name" value={staffName} onChange={(e) => setStaffName(e.target.value)} />
          <button type="submit" className="w-full py-4 bg-[#8E3A3A] text-white rounded-full font-black uppercase tracking-widest shadow-lg active:scale-95 transition-transform">Start Shift</button>
        </form>
      </div>
    );
  }

  // MAIN APP LAYOUT
  return (
    <div className="min-h-screen pb-32 bg-[#F4EBE2] text-[#432C2C] selection:bg-[#D4AF37] selection:text-white">
      {/* HEADER */}
      <header className="sticky top-0 z-50 p-4">
        <div className="max-w-4xl mx-auto rounded-3xl shadow-2xl p-5 flex items-center justify-between border-b-4 bg-[#8E3A3A] border-[#D4AF37]">
          <div className="flex flex-col">
            <span className="text-3xl font-serif tracking-widest text-white uppercase leading-none">BOBBY'S</span>
            <div className="flex items-center gap-2 mt-1">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-[10px] font-bold tracking-widest text-white/60 uppercase">{staffName}</span>
            </div>
          </div>
          <button onClick={() => { sessionStorage.clear(); window.location.reload(); }} className="bg-white/10 p-3 rounded-full hover:bg-white/20 transition-colors"><LogOut size={20} className="text-white" /></button>
        </div>
      </header>

      {/* VIEWS */}
      <main className="max-w-2xl mx-auto p-4">
        {view === 'orders' && <OrdersView staffName={staffName} todayKey={todayKey} suppliers={suppliers} history={orderHistory} quantities={orderQuantities} onSave={saveToFirebase} />}
        
        {view === 'ops' && <OpsView displayDate={displayDate} todayKey={todayKey} wastageItems={wastageItems} wastageData={wastageData} staffName={staffName} onSaveWastage={(data) => saveToFirebase('wastage', data)} onSaveIncident={(inc) => {
              const newInc = {...incidents}; if(!newInc[todayKey]) newInc[todayKey] = [];
              newInc[todayKey].push({...inc, by: staffName, time: new Date().toLocaleTimeString(), id: Date.now()});
              saveToFirebase('incidents', newInc);
        }} />}
        
        {view === 'history' && <HistoryView suppliers={suppliers} history={orderHistory} quantities={orderQuantities} />}
        
        {view === 'admin' && (!isAdminAuthenticated ? <PinPad pinInput={pinInput} setPinInput={setPinInput} onAuth={() => setIsAdminAuthenticated(true)} /> : 
          <AdminView suppliers={suppliers} wastageItems={wastageItems} wastageData={wastageData} incidents={incidents} 
            onSaveSuppliers={(newList) => saveToFirebase('suppliers', newList)} 
            onSaveWastageItems={(newList) => saveToFirebase('wastageItems', newList)} 
            onDeleteIncident={(date, id) => {
                const newInc = {...incidents}; newInc[date] = newInc[date].filter(r => r.id !== id);
                if(newInc[date].length === 0) delete newInc[date]; saveToFirebase('incidents', newInc);
            }} onLogout={() => setIsAdminAuthenticated(false)} />)}
      </main>

      {/* NAVIGATION BAR */}
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-md z-50">
        <div className="rounded-full shadow-2xl border-2 p-2 flex justify-around items-center backdrop-blur-md bg-white/90 border-[#D4AF37]">
          <NavButton icon={ShoppingCart} active={view === 'orders'} onClick={() => setView('orders')} />
          <NavButton icon={ClipboardList} active={view === 'ops'} onClick={() => setView('ops')} />
          <NavButton icon={History} active={view === 'history'} onClick={() => setView('history')} />
          <NavButton icon={Settings} active={view === 'admin'} onClick={() => setView('admin')} />
        </div>
      </nav>
    </div>
  );
};

// =======================
// === SUB-COMPONENTS ===
// =======================

// --- 1. ORDERS VIEW ---
const OrdersView = ({ staffName, todayKey, suppliers, history, quantities, onSave }) => {
    const [showAll, setShowAll] = useState(false);
    const dayName = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][new Date().getDay()];
    
    // Filter suppliers based on schedule
    const activeSuppliers = showAll ? suppliers : suppliers.filter(s => s.days?.includes(dayName));
    
    return (
      <div className="space-y-6">
        {/* Toggle Button */}
        <button onClick={() => setShowAll(!showAll)} className={`w-full p-4 rounded-3xl border-2 border-dashed flex items-center justify-center gap-2 transition-all active:scale-95 ${showAll ? 'bg-amber-50 border-amber-300 text-amber-700' : 'bg-white/50 border-stone-300 text-stone-400'}`}>
            {showAll ? <X size={16}/> : <AlertCircle size={16} />}
            <span className="text-[10px] font-black uppercase tracking-widest">{showAll ? 'Show Today Only' : 'New Non-Scheduled Order'}</span>
        </button>

        {activeSuppliers.length === 0 && (
            <div className="text-center py-20 opacity-30 italic font-serif text-stone-500">No scheduled counts for today.</div>
        )}

        {activeSuppliers.map(s => {
          const isCompleted = history[todayKey]?.[s.id];
          const isNotScheduled = !s.days?.includes(dayName);

          // Check if we should show the card at all (if completed and 0 items ordered, show mini summary)
          const orderedCount = s.items?.filter(item => {
             const val = quantities[todayKey]?.[s.id]?.[item.id];
             return val && val !== '0';
          }).length || 0;

          if (isCompleted && orderedCount === 0) return (
             <div key={s.id} className="p-4 rounded-3xl bg-stone-100/50 flex justify-between items-center border border-dashed border-stone-200 opacity-60">
                <span className="font-serif text-stone-500 text-sm">{s.name} (Zero Order)</span>
                <button onClick={() => { const newH = { ...history }; newH[todayKey][s.id] = null; onSave('history', newH); }} className="text-[9px] font-black uppercase text-[#8E3A3A]">Re-open</button>
             </div>
          );

          return (
            <div key={s.id} className="bg-white rounded-[40px] p-6 shadow-xl border-t-8 transition-all duration-500 relative overflow-hidden" style={{ borderColor: isCompleted ? '#5B8C5A' : (isNotScheduled ? '#D4AF37' : '#8E3A3A') }}>
              {isNotScheduled && <div className="absolute top-0 right-16 bg-[#D4AF37] px-3 py-1 rounded-b-xl text-[8px] font-black text-white uppercase">Non-Scheduled</div>}
              {isCompleted && <div className="absolute top-0 right-16 bg-[#5B8C5A] px-3 py-1 rounded-b-xl text-[8px] font-black text-white uppercase flex items-center gap-1"><ListFilter size={10}/> Summary</div>}

              <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-2xl font-serif text-stone-800 leading-tight">{s.name}</h3>
                    {s.description && !isCompleted && <div className="flex items-center gap-1 mt-1 opacity-50"><Info size={12}/><p className="text-[9px] font-bold uppercase">{s.description}</p></div>}
                </div>
                <button onClick={() => { 
                    const newH = { ...history }; if (!newH[todayKey]) newH[todayKey] = {}; 
                    newH[todayKey][s.id] = isCompleted ? null : { done: true, by: staffName }; 
                    onSave('history', newH); 
                }} className={`p-4 rounded-full shadow-md transition-all active:scale-90 ${isCompleted ? 'bg-[#5B8C5A]' : 'bg-stone-100'}`}>
                  <CheckCircle2 className={isCompleted ? 'text-white' : 'text-stone-300'} />
                </button>
              </div>

              <div className="space-y-2">
                {s.items?.map(item => {
                  const qty = quantities[todayKey]?.[s.id]?.[item.id] || '';
                  // IMPORTANT: If completed, hide items with 0 qty
                  if (isCompleted && (!qty || qty === '0')) return null;

                  return (
                    <InventoryRow 
                        key={item.id} 
                        item={item} 
                        qty={qty} 
                        isCompleted={isCompleted} 
                        onChange={(val) => {
                            const newQ = { ...quantities }; 
                            if (!newQ[todayKey]) newQ[todayKey] = {}; 
                            if (!newQ[todayKey][s.id]) newQ[todayKey][s.id] = {};
                            newQ[todayKey][s.id][item.id] = val; 
                            onSave('quantities', newQ);
                        }}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
};

const InventoryRow = ({ item, qty, isCompleted, onChange }) => {
    return (
        <div className={`flex items-center justify-between p-4 rounded-3xl transition-all ${isCompleted ? 'bg-white border-2 border-stone-100' : 'bg-stone-50'}`}>
            <div>
                <span className="font-bold text-xs text-stone-600 uppercase tracking-tight block">{item.name}</span>
                {!isCompleted && <span className="text-[9px] font-black text-[#D4AF37] uppercase tracking-widest">PAR: {item.par || '-'}</span>}
            </div>
            {isCompleted ? (
                <div className="bg-stone-900 text-white w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm">{qty}</div>
            ) : (
                <input type="number" className="w-16 p-3 rounded-xl text-center font-bold bg-white shadow-sm outline-none focus:ring-2 focus:ring-[#8E3A3A]" placeholder="0" value={qty} onChange={e => onChange(e.target.value)} />
            )}
        </div>
    );
};

// --- 2. OPS VIEW (WASTAGE & INCIDENTS) ---
const OpsView = ({ displayDate, todayKey, wastageItems, wastageData, onSaveWastage, onSaveIncident, staffName }) => {
    const [incidentText, setIncidentText] = useState("");
    const [tempWastage, setTempWastage] = useState({});
    const isWastageSaved = !!wastageData?.[todayKey];

    const handleSave = () => {
        const newData = {...wastageData};
        newData[todayKey] = { meta: { by: staffName, time: new Date().toLocaleTimeString() }, items: {} };
        wastageItems.forEach(item => { newData[todayKey].items[item.id] = tempWastage[item.id] || "0"; });
        onSaveWastage(newData);
    };

    return (
        <div className="space-y-6">
            <div className="text-center py-4"><h2 className="text-3xl font-serif">{displayDate}</h2></div>
            
            <div className="bg-white rounded-[40px] p-6 shadow-xl relative overflow-hidden">
                <div className="flex items-center gap-2 mb-6"><Trash size={20} className="text-[#8E3A3A]"/> <h3 className="font-serif text-xl">Daily Wastage</h3></div>
                <div className="space-y-2 mb-6">
                    {wastageItems?.map(item => {
                        const savedValue = wastageData?.[todayKey]?.items?.[item.id];
                        return (
                            <div key={item.id} className="flex justify-between items-center p-4 bg-stone-50 rounded-3xl">
                                <span className="text-[10px] font-black uppercase text-stone-500">{item.name}</span>
                                {isWastageSaved ? <span className="font-black text-stone-800">{savedValue || '0'}</span> : 
                                <input type="number" className="w-16 p-2 rounded-xl text-center outline-none bg-white shadow-inner" placeholder="0" value={tempWastage[item.id] || ''} onChange={(e) => setTempWastage({...tempWastage, [item.id]: e.target.value})} />}
                            </div>
                        );
                    })}
                </div>
                {isWastageSaved ? (
                    <div className="bg-stone-50 p-4 rounded-3xl flex items-center justify-center gap-2 text-[#5B8C5A] font-black uppercase text-[10px] border-2 border-[#5B8C5A]/20"><CheckCircle2 size={16}/> Report Locked</div>
                ) : (
                    <button onClick={handleSave} className="w-full py-4 bg-stone-900 text-white rounded-full font-black uppercase text-[10px] flex justify-center gap-2 items-center"><Save size={16}/> Save & Lock All</button>
                )}
            </div>

            <div className="bg-white rounded-[40px] p-6 shadow-xl">
                <div className="flex items-center gap-2 mb-4"><AlertTriangle size={20} className="text-amber-500"/> <h3 className="font-serif text-xl">Incident Report</h3></div>
                <textarea className="w-full p-4 bg-stone-50 rounded-3xl min-h-[100px] outline-none text-sm mb-4 border-2 border-transparent focus:border-amber-200" placeholder="Describe breakage or issues..." value={incidentText} onChange={e => setIncidentText(e.target.value)} />
                <button onClick={() => { if(!incidentText) return; onSaveIncident({note: incidentText}); setIncidentText(""); alert("Sent."); }} className="w-full py-4 border-2 border-stone-900 rounded-full font-black uppercase text-[10px] flex justify-center gap-2 items-center hover:bg-stone-50"><FileText size={16}/> Send Report</button>
            </div>
        </div>
    );
};

// --- 3. HISTORY VIEW ---
const HistoryView = ({ suppliers, history, quantities }) => {
    const complianceDays = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(); d.setDate(d.getDate() + (i - 3));
        return { key: `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`, label: d.toLocaleDateString('en-US', { weekday: 'short' }), isToday: i === 3 };
    });
    return (
        <div className="space-y-6">
            <div className="rounded-[30px] bg-white p-6 shadow-xl text-center">
                <h2 className="font-serif text-lg mb-4 italic text-stone-600">Compliance Tracking</h2>
                <div className="flex justify-between px-2">
                    {complianceDays.map(d => {
                        const count = Object.values(history[d.key] || {}).filter(v => v?.done).length;
                        return (
                            <div key={d.key} className="flex flex-col items-center gap-2">
                                <div className="w-8 h-16 rounded-full bg-stone-100 relative overflow-hidden">
                                    <div className="absolute bottom-0 w-full bg-[#8E3A3A] transition-all" style={{ height: `${Math.min(100, count * 33)}%` }}></div>
                                </div>
                                <span className={`text-[9px] font-black uppercase ${d.isToday ? 'text-[#D4AF37]' : 'text-stone-400'}`}>{d.label}</span>
                            </div>
                        );
                    })}
                </div>
            </div>
            {[...complianceDays].reverse().map(d => {
                const dayData = quantities[d.key]; if(!dayData) return null;
                return (
                    <div key={d.key} className="p-6 bg-white/60 rounded-[30px] border border-stone-200">
                        <p className="text-[10px] font-black uppercase text-stone-400 mb-4">{d.label} Orders</p>
                        {Object.entries(dayData).map(([sId, items]) => (
                            <div key={sId} className="mb-4 last:mb-0">
                                <p className="text-[10px] font-black text-[#8E3A3A] uppercase mb-1">{suppliers.find(s => s.id === sId)?.name}</p>
                                <div className="flex flex-wrap gap-2">{Object.entries(items).map(([id, q]) => q && q !== '0' && (
                                    <span key={id} className="text-[9px] font-bold bg-white px-2 py-1 rounded-full border shadow-sm">{suppliers.find(s => s.id === sId)?.items.find(i => i.id.toString() === id)?.name}: {q}</span>
                                ))}</div>
                            </div>
                        ))}
                    </div>
                );
            })}
        </div>
    );
};

// --- 4. ADMIN VIEW & SETUP ---
const AdminView = ({ suppliers, wastageItems, wastageData, incidents, onSaveSuppliers, onSaveWastageItems, onDeleteIncident, onLogout }) => {
    const [tab, setTab] = useState('reports');
    const [editingSupplier, setEditingSupplier] = useState(null);

    const getTotals = () => {
        const t = {};
        Object.values(wastageData || {}).forEach(day => {
            Object.entries(day?.items || {}).forEach(([id, val]) => {
                const name = wastageItems.find(i => i.id.toString() === id)?.name || "Unknown";
                t[name] = (t[name] || 0) + parseFloat(val);
            });
        });
        return Object.entries(t).sort((a,b) => b[1] - a[1]);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-6"><h2 className="font-serif text-2xl">Management</h2><button onClick={onLogout} className="text-[#8E3A3A] font-black text-xs uppercase underline">Lock</button></div>
            
            <div className="flex bg-white rounded-full p-1 shadow-inner overflow-x-auto no-scrollbar">
                {['reports', 'wastage-history', 'totals', 'setup'].map(t => (
                    <button key={t} onClick={() => { setTab(t); setEditingSupplier(null); }} className={`flex-1 min-w-[100px] py-3 rounded-full text-[9px] font-black uppercase transition-all ${tab === t ? 'bg-stone-900 text-white' : 'text-stone-400'}`}>{t.replace('-', ' ')}</button>
                ))}
            </div>

            {tab === 'reports' && (
                <div className="space-y-4">
                    {Object.entries(incidents || {}).reverse().map(([date, list]) => (
                        <div key={date} className="bg-white p-6 rounded-3xl border-l-8 border-amber-400">
                            <p className="text-[9px] font-black text-stone-400 uppercase mb-4">{date}</p>
                            {list.map(r => (
                                <div key={r.id} className="relative mb-4 border-b pb-4 last:border-0">
                                    <p className="text-sm italic">"{r.note}"</p>
                                    <div className="flex justify-between items-end mt-2"><span className="text-[8px] font-bold text-stone-300">{r.time} by {r.by}</span><button onClick={() => window.confirm('Delete?') && onDeleteIncident(date, r.id)} className="text-red-200"><Trash2 size={14}/></button></div>
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            )}

            {tab === 'wastage-history' && (
                <div className="space-y-4">
                    {Object.entries(wastageData || {}).reverse().slice(0, 60).map(([date, data]) => (
                        <div key={date} className="bg-white p-6 rounded-3xl border shadow-sm">
                            <div className="flex justify-between mb-2 border-b pb-2"><span className="font-serif">{date}</span><span className="text-[9px] font-black uppercase text-stone-300">{data.meta?.by}</span></div>
                            <div className="grid grid-cols-2 gap-2">{Object.entries(data.items || {}).map(([id, q]) => q > 0 && <div key={id} className="flex justify-between bg-stone-50 p-2 rounded-xl text-[10px]"><span className="font-bold text-stone-500 uppercase">{wastageItems.find(i => i.id.toString() === id)?.name}</span><span className="font-black">{q}</span></div>)}</div>
                        </div>
                    ))}
                </div>
            )}

            {tab === 'totals' && <div className="bg-white p-8 rounded-[40px] shadow-xl">{getTotals().map(([name, total]) => <div key={name} className="flex justify-between border-b py-3 last:border-0"><span className="text-xs font-black uppercase text-stone-500">{name}</span><span className="font-serif text-lg">{total}</span></div>)}</div>}

            {tab === 'setup' && !editingSupplier && (
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-[30px] shadow-sm">
                        <h3 className="font-serif text-lg mb-4">Supplier Management</h3>
                        {suppliers.map(s => (
                            <button key={s.id} onClick={() => setEditingSupplier(s)} className="w-full flex justify-between items-center p-4 border-b last:border-0 hover:bg-stone-50">
                                <span className="font-bold text-sm uppercase">{s.name}</span>
                                <div className="flex items-center gap-2"><span className="text-[9px] text-stone-300 font-black">{s.items?.length || 0} Items</span><Edit3 size={14} className="text-stone-300"/></div>
                            </button>
                        ))}
                        <button onClick={() => onSaveSuppliers([...suppliers, {id: Date.now().toString(), name: 'New Supplier', items: [], days: []}])} className="w-full py-4 text-stone-400 text-[10px] font-black uppercase tracking-widest">+ Add New Supplier</button>
                    </div>
                    <div className="bg-white p-6 rounded-[30px] shadow-sm">
                        <h3 className="font-serif text-lg mb-4">Wastage Item Setup</h3>
                        {wastageItems.map(i => (
                            <div key={i.id} className="flex gap-2 mb-2">
                                <input className="flex-1 bg-stone-50 p-2 rounded-xl text-sm font-bold" value={i.name} onChange={e => onSaveWastageItems(wastageItems.map(x => x.id === i.id ? {...x, name: e.target.value} : x))} />
                                <button onClick={() => onSaveWastageItems(wastageItems.filter(x => x.id !== i.id))} className="text-red-200"><X size={18}/></button>
                            </div>
                        ))}
                        <button onClick={() => onSaveWastageItems([...wastageItems, {id: Date.now(), name: 'New Item'}])} className="w-full p-4 border-2 border-dashed border-stone-300 rounded-3xl text-stone-400 font-bold">+ Add Wastage Item</button>
                    </div>
                </div>
            )}

            {tab === 'setup' && editingSupplier && (
                <SupplierEditor supplier={editingSupplier} onSave={(updated) => { onSaveSuppliers(suppliers.map(s => s.id === updated.id ? updated : s)); setEditingSupplier(null); }} onBack={() => setEditingSupplier(null)} onDelete={() => { onSaveSuppliers(suppliers.filter(s => s.id !== editingSupplier.id)); setEditingSupplier(null); }} />
            )}
        </div>
    );
};

const SupplierEditor = ({ supplier, onSave, onBack, onDelete }) => {
    const [data, setData] = useState(supplier);
    const moveItem = (idx, dir) => {
        const items = [...(data.items || [])];
        if (idx + dir < 0 || idx + dir >= items.length) return;
        const temp = items[idx]; items[idx] = items[idx + dir]; items[idx + dir] = temp;
        setData({ ...data, items });
    };

    return (
        <div className="bg-white rounded-[40px] p-6 shadow-xl animate-in slide-in-from-right-10">
            <div className="flex justify-between items-center mb-6">
                <button onClick={onBack} className="flex items-center gap-1 text-[10px] font-black uppercase text-stone-400"><ArrowLeft size={12}/> Back</button>
                <button onClick={() => window.confirm('Delete Supplier?') && onDelete()} className="text-red-300"><Trash2 size={18}/></button>
            </div>
            
            <div className="space-y-4">
                <input className="text-2xl font-serif w-full outline-none border-b-2 border-stone-100 pb-2" value={data.name} onChange={e => setData({...data, name: e.target.value})} placeholder="Supplier Name" />
                <textarea className="w-full p-4 rounded-2xl bg-stone-50 text-xs font-bold min-h-[80px]" value={data.description} onChange={e => setData({...data, description: e.target.value})} placeholder="Order info..." />
                
                <div>
                    <p className="text-[10px] font-black uppercase text-stone-400 mb-2">Delivery Schedule</p>
                    <div className="flex flex-wrap gap-2">
                        {['monday','tuesday','wednesday','thursday','friday','saturday','sunday'].map(day => (
                            <button key={day} onClick={() => {
                                const days = data.days?.includes(day) ? data.days.filter(d => d !== day) : [...(data.days || []), day];
                                setData({...data, days});
                            }} className={`px-3 py-2 rounded-full text-[9px] font-black uppercase border ${data.days?.includes(day) ? 'bg-stone-900 text-white' : 'text-stone-300 border-stone-200'}`}>{day.slice(0,3)}</button>
                        ))}
                    </div>
                </div>

                <div>
                    <p className="text-[10px] font-black uppercase text-stone-400 mb-2">Inventory Items</p>
                    <div className="space-y-2">
                        {data.items?.map((item, idx) => (
                            <div key={item.id} className="flex gap-2 items-center">
                                <div className="flex flex-col"><button onClick={() => moveItem(idx, -1)} className="text-stone-300"><ChevronUp size={12}/></button><button onClick={() => moveItem(idx, 1)} className="text-stone-300"><ChevronDown size={12}/></button></div>
                                <input className="flex-1 bg-stone-50 p-3 rounded-xl text-xs font-bold" value={item.name} onChange={e => {
                                    const items = [...data.items]; items[idx].name = e.target.value; setData({...data, items});
                                }} />
                                <input className="w-16 bg-stone-50 p-3 rounded-xl text-xs text-center font-bold" placeholder="PAR" value={item.par} onChange={e => {
                                    const items = [...data.items]; items[idx].par = e.target.value; setData({...data, items});
                                }} />
                                <button onClick={() => { const items = [...data.items]; items.splice(idx, 1); setData({...data, items}); }} className="text-red-200">×</button>
                            </div>
                        ))}
                        <button onClick={() => setData({...data, items: [...(data.items||[]), {id: Date.now(), name: '', par: ''}]})} className="text-xs font-black text-[#D4AF37] uppercase mt-2">+ Add Item</button>
                    </div>
                </div>
                <button onClick={() => onSave(data)} className="w-full py-4 bg-[#8E3A3A] text-white rounded-full font-black uppercase tracking-widest mt-4 shadow-xl">Save Changes</button>
            </div>
        </div>
    );
};

const PinPad = ({ pinInput, setPinInput, onAuth }) => {
    const handleDigit = (d) => { const next = pinInput + d; if (next.length <= 4) { setPinInput(next); if (next === ADMIN_PIN) { onAuth(); setPinInput(""); } } };
    return (
        <div className="flex flex-col items-center py-10">
            <div className="flex gap-4 mb-10">{[...Array(4)].map((_, i) => (<div key={i} className={`w-4 h-4 rounded-full border-2 ${pinInput.length > i ? 'bg-[#8E3A3A] border-[#8E3A3A]' : 'border-stone-300'}`} />))}</div>
            <div className="grid grid-cols-3 gap-6">{[1, 2, 3, 4, 5, 6, 7, 8, 9, "C", 0, "⌫"].map(btn => (
                <button key={btn} onClick={() => { if(btn === "C") setPinInput(""); else if(btn === "⌫") setPinInput(pinInput.slice(0, -1)); else handleDigit(btn); }} className="w-20 h-20 rounded-full bg-white shadow-lg text-xl font-bold">{btn}</button>
            ))}</div>
        </div>
    );
};

const NavButton = ({ icon: Icon, active, onClick }) => (
    <button onClick={onClick} className={`p-4 rounded-full transition-all duration-300 ${active ? 'shadow-inner' : ''}`}
            style={{ backgroundColor: active ? '#8E3A3A' : 'transparent', color: active ? '#fff' : '#8E3A3A' }}><Icon size={24} /></button>
);

export default CafeOrderingApp;
