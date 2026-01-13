import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue, set } from "firebase/database";
import {
  ShoppingCart,
  History,
  Settings,
  Wine,
  Plus,
  Edit3,
  Trash2,
  X,
  Loader2,
  CheckCircle2,
  User,
  LogOut,
  RefreshCw,
  ClipboardCheck,
  ChevronUp,
  ChevronDown,
  AlertCircle,
  Info,
  Target,
  ListFilter,
  ClipboardList,
  AlertTriangle,
  Trash,
  FileText,
  BarChart3
} from 'lucide-react';

// === FIREBASE CONFIG === (Kept your original)
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
  primary: '#8E3A3A',
  secondary: '#F9F4F0',
  accent: '#D4AF37',
  background: '#F4EBE2',
  textDark: '#432C2C',
  success: '#5B8C5A',
  danger: '#C05555'
};

const ADMIN_PIN = "2323";

const CafeOrderingApp = () => {
  const [view, setView] = useState('orders');
  const [staffName, setStaffName] = useState(localStorage.getItem('staffName') || '');
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('staffName'));
  const [suppliers, setSuppliers] = useState([]);
  const [wastageItems, setWastageItems] = useState([]);
  const [orderHistory, setOrderHistory] = useState({});
  const [orderQuantities, setOrderQuantities] = useState({});
  const [wastageData, setWastageData] = useState({});
  const [incidents, setIncidents] = useState({});
  const [loading, setLoading] = useState(true);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState("");

  const today = new Date();
  const todayKey = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
  const displayDate = today.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  useEffect(() => {
    const dataRef = ref(db, 'cafe_data');
    return onValue(dataRef, (snapshot) => {
      const data = snapshot.val() || {};
      setSuppliers(data.suppliers || []);
      setWastageItems(data.wastageItems || []);
      setOrderHistory(data.history || {});
      setOrderQuantities(data.quantities || {});
      setWastageData(data.wastage || {});
      setIncidents(data.incidents || {});
      setLoading(false);
    });
  }, []);

  const saveToFirebase = (path, data) => set(ref(db, `cafe_data/${path}`), data);

  if (loading) return <div className="h-screen flex items-center justify-center" style={{ backgroundColor: colors.background }}><Loader2 className="animate-spin text-stone-400" /></div>;

  if (!isLoggedIn) {
    return (
      <div className="h-screen flex items-center justify-center p-6" style={{ backgroundColor: colors.background }}>
        <form onSubmit={(e) => { e.preventDefault(); if(staffName.trim()) { localStorage.setItem('staffName', staffName); setIsLoggedIn(true); }}} className="w-full max-w-sm bg-white rounded-[40px] p-8 shadow-2xl text-center border-t-8 border-primary" style={{ borderColor: colors.primary }}>
          <div className="bg-stone-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"><Wine className="text-stone-400" /></div>
          <h1 className="font-serif text-2xl mb-2 text-stone-800">Bobby's</h1>
          <p className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-8">Management Suite</p>
          <input autoFocus className="w-full p-4 rounded-2xl bg-stone-50 mb-4 outline-none text-center font-bold border-2 border-transparent focus:border-amber-200" placeholder="Your Name" value={staffName} onChange={(e) => setStaffName(e.target.value)} />
          <button type="submit" className="w-full py-4 bg-stone-900 text-white rounded-full font-black uppercase tracking-widest shadow-xl">Sign In</button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-28" style={{ backgroundColor: colors.background, color: colors.textDark }}>
      <header className="sticky top-0 z-50 p-4">
        <div className="max-w-4xl mx-auto rounded-3xl shadow-2xl p-5 flex items-center justify-between border-b-4" style={{ backgroundColor: colors.primary, borderColor: colors.accent }}>
          <div className="flex flex-col">
            <span className="text-3xl font-serif tracking-widest text-white uppercase leading-none">BOBBY'S</span>
            <div className="flex items-center gap-2 mt-1">
                <User className="w-3 h-3 text-white/50" />
                <span className="text-[10px] font-bold tracking-widest text-white/60 uppercase">{staffName}</span>
            </div>
          </div>
          <button onClick={() => { localStorage.removeItem('staffName'); setIsLoggedIn(false); }} className="bg-white/10 p-2 rounded-full"><LogOut size={18} className="text-white" /></button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-4">
        {view === 'orders' && <OrdersView staffName={staffName} todayKey={todayKey} suppliers={suppliers} history={orderHistory} quantities={orderQuantities} onSave={saveToFirebase} />}
        {view === 'ops' && (
          <OpsView 
            displayDate={displayDate} 
            todayKey={todayKey} 
            wastageItems={wastageItems} 
            wastageData={wastageData} 
            staffName={staffName}
            onSaveWastage={(data) => saveToFirebase('wastage', data)} 
            onSaveIncident={(inc) => {
              const newInc = {...incidents};
              if(!newInc[todayKey]) newInc[todayKey] = [];
              newInc[todayKey].push({...inc, by: staffName, time: new Date().toLocaleTimeString()});
              saveToFirebase('incidents', newInc);
            }}
          />
        )}
        {view === 'history' && <HistoryView suppliers={suppliers} history={orderHistory} quantities={orderQuantities} />}
        {view === 'admin' && (
          !isAdminAuthenticated ? (
            <PinPad pinInput={pinInput} setPinInput={setPinInput} onAuth={() => setIsAdminAuthenticated(true)} />
          ) : (
            <AdminView 
                suppliers={suppliers} 
                wastageItems={wastageItems}
                wastageData={wastageData}
                incidents={incidents}
                onSaveSuppliers={(newList) => saveToFirebase('suppliers', newList)} 
                onSaveWastageItems={(newList) => saveToFirebase('wastageItems', newList)}
                onLogout={() => setIsAdminAuthenticated(false)} 
            />
          )
        )}
      </main>

      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-md z-50">
        <div className="rounded-full shadow-2xl border-2 p-2 flex justify-around items-center backdrop-blur-md bg-white/80" style={{ borderColor: colors.accent }}>
          <NavButton icon={ShoppingCart} active={view === 'orders'} onClick={() => setView('orders')} />
          <NavButton icon={ClipboardList} active={view === 'ops'} onClick={() => setView('ops')} />
          <NavButton icon={History} active={view === 'history'} onClick={() => setView('history')} />
          <NavButton icon={Settings} active={view === 'admin'} onClick={() => setView('admin')} />
        </div>
      </nav>
    </div>
  );
};

// --- OPERATIONS VIEW ---
const OpsView = ({ displayDate, todayKey, wastageItems, wastageData, onSaveWastage, onSaveIncident, staffName }) => {
    const [incidentText, setIncidentText] = useState("");
    const [incidentType, setIncidentType] = useState("Breakage");
    const [tempWastage, setTempWastage] = useState({});

    const handleWastageSave = (itemId) => {
        const val = tempWastage[itemId];
        if(!val || val === '0' || val < 0) return;
        const newData = {...wastageData};
        if(!newData[todayKey]) newData[todayKey] = {};
        newData[todayKey][itemId] = { qty: parseFloat(val), by: staffName };
        onSaveWastage(newData);
    };

    return (
        <div className="space-y-6">
            <div className="text-center py-4">
                <h2 className="text-3xl font-serif text-stone-800">{displayDate}</h2>
                <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">Daily Operations Report</p>
            </div>

            <div className="bg-white rounded-[40px] p-6 shadow-xl border-b-4 border-stone-200">
                <div className="flex items-center gap-3 mb-6">
                    <Trash className="text-primary" size={20} />
                    <h3 className="font-serif text-xl">Daily Wastage</h3>
                </div>
                <div className="space-y-3">
                    {wastageItems.map(item => {
                        const saved = wastageData[todayKey]?.[item.id];
                        return (
                            <div key={item.id} className="flex items-center justify-between p-4 rounded-3xl bg-stone-50">
                                <span className="font-bold text-xs text-stone-500 uppercase">{item.name}</span>
                                {saved ? (
                                    <div className="flex items-center gap-2 bg-stone-200 px-4 py-2 rounded-full">
                                        <span className="text-xs font-black">{saved.qty}</span>
                                        <CheckCircle2 size={14} className="text-success" />
                                    </div>
                                ) : (
                                    <div className="flex gap-2">
                                        <input type="number" className="w-16 p-2 rounded-xl text-center font-bold outline-none" placeholder="0" value={tempWastage[item.id] || ''} onChange={e => setTempWastage({...tempWastage, [item.id]: e.target.value})} />
                                        <button onClick={() => handleWastageSave(item.id)} className="bg-stone-900 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase">Save</button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="bg-white rounded-[40px] p-6 shadow-xl border-b-4 border-stone-200">
                <div className="flex items-center gap-3 mb-6">
                    <AlertTriangle className="text-amber-500" size={20} />
                    <h3 className="font-serif text-xl">Incident / Breakage Report</h3>
                </div>
                <div className="flex gap-2 mb-4">
                    {["Breakage", "Incident", "Staff"].map(t => (
                        <button key={t} onClick={() => setIncidentType(t)} className={`flex-1 py-2 rounded-full text-[9px] font-black uppercase tracking-tighter border ${incidentType === t ? 'bg-stone-800 text-white' : 'text-stone-400 border-stone-100'}`}>{t}</button>
                    ))}
                </div>
                <textarea className="w-full p-4 rounded-3xl bg-stone-50 min-h-[120px] outline-none text-sm border-2 border-transparent focus:border-amber-100 mb-4" placeholder="Describe what happened..." value={incidentText} onChange={e => setIncidentText(e.target.value)} />
                <button onClick={() => { if(!incidentText.trim()) return; onSaveIncident({ type: incidentType, note: incidentText }); setIncidentText(""); alert("Report sent to Management."); }} className="w-full py-4 bg-primary text-white rounded-full font-black uppercase tracking-widest shadow-lg flex items-center justify-center gap-2"><FileText size={18} /> Submit Report</button>
            </div>
        </div>
    );
};

// --- ADMIN VIEW (NOW WITH TOTALS REPORT) ---
const AdminView = ({ suppliers, wastageItems, wastageData, incidents, onSaveSuppliers, onSaveWastageItems, onLogout }) => {
    const [tab, setTab] = useState('suppliers');

    // Logic for Monthly Totals
    const getMonthlyTotals = () => {
        const totals = {};
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        Object.entries(wastageData).forEach(([dateStr, items]) => {
            const entryDate = new Date(dateStr);
            if (entryDate >= thirtyDaysAgo) {
                Object.entries(items).forEach(([itemId, record]) => {
                    const itemName = wastageItems.find(i => i.id.toString() === itemId)?.name || "Unknown Item";
                    totals[itemName] = (totals[itemName] || 0) + parseFloat(record.qty);
                });
            }
        });
        return Object.entries(totals).sort((a, b) => b[1] - a[1]);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="font-serif text-2xl">Management Center</h2>
                <button onClick={onLogout} className="text-primary font-black text-xs uppercase underline">Lock Access</button>
            </div>

            <div className="flex bg-white rounded-full p-1 shadow-inner overflow-x-auto no-scrollbar">
                <button onClick={() => setTab('suppliers')} className={`flex-1 min-w-[100px] py-3 rounded-full text-[9px] font-black uppercase transition-all ${tab === 'suppliers' ? 'bg-stone-900 text-white' : 'text-stone-400'}`}>Suppliers</button>
                <button onClick={() => setTab('wastage')} className={`flex-1 min-w-[100px] py-3 rounded-full text-[9px] font-black uppercase transition-all ${tab === 'wastage' ? 'bg-stone-900 text-white' : 'text-stone-400'}`}>Wastage List</button>
                <button onClick={() => setTab('reports')} className={`flex-1 min-w-[100px] py-3 rounded-full text-[9px] font-black uppercase transition-all ${tab === 'reports' ? 'bg-stone-900 text-white' : 'text-stone-400'}`}>Incidents</button>
                <button onClick={() => setTab('totals')} className={`flex-1 min-w-[100px] py-3 rounded-full text-[9px] font-black uppercase transition-all ${tab === 'totals' ? 'bg-stone-900 text-white' : 'text-stone-400'}`}>30d Stats</button>
            </div>

            {tab === 'suppliers' && (
                <div className="space-y-4">
                    {suppliers.map(s => (
                        <div key={s.id} className="p-6 rounded-[30px] bg-white flex justify-between items-center shadow-lg">
                            <span className="font-serif text-lg">{s.name}</span>
                            <button onClick={() => onSaveSuppliers(suppliers.filter(x => x.id !== s.id))} className="text-red-300"><Trash2 size={20}/></button>
                        </div>
                    ))}
                    <button onClick={() => onSaveSuppliers([...suppliers, {id: Date.now(), name: 'New Supplier', items: []}])} className="w-full p-4 border-2 border-dashed border-stone-300 rounded-3xl text-stone-400 font-bold">+ Add Supplier</button>
                </div>
            )}

            {tab === 'wastage' && (
                <div className="space-y-4">
                    <p className="text-[10px] text-stone-400 uppercase font-black px-2">Items tracked for wastage</p>
                    {wastageItems.map(item => (
                        <div key={item.id} className="p-4 rounded-2xl bg-white flex justify-between items-center">
                            <input className="font-bold text-stone-700 outline-none" value={item.name} onChange={e => onSaveWastageItems(wastageItems.map(i => i.id === item.id ? {...i, name: e.target.value} : i))} />
                            <button onClick={() => onSaveWastageItems(wastageItems.filter(i => i.id !== item.id))}><X className="text-red-200" size={18}/></button>
                        </div>
                    ))}
                    <button onClick={() => onSaveWastageItems([...wastageItems, {id: Date.now(), name: 'New Item'}])} className="w-full p-4 border-2 border-dashed border-stone-300 rounded-3xl text-stone-400 font-bold">+ Add Wastage Item</button>
                </div>
            )}

            {tab === 'reports' && (
                <div className="space-y-6">
                    {Object.entries(incidents).length === 0 && <p className="text-center text-stone-400 py-10">No incident reports yet.</p>}
                    {Object.entries(incidents).reverse().map(([date, reports]) => (
                        <div key={date} className="bg-white rounded-[30px] p-6 shadow-md border-l-8 border-amber-400">
                            <h4 className="font-black text-[10px] uppercase text-stone-400 mb-4">{date}</h4>
                            {reports.map((r, idx) => (
                                <div key={idx} className="mb-4 last:mb-0 border-b border-stone-50 pb-4">
                                    <div className="flex justify-between items-center mb-1"><span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-md text-[8px] font-black uppercase">{r.type}</span><span className="text-[8px] font-bold text-stone-300">{r.time} by {r.by}</span></div>
                                    <p className="text-sm text-stone-600 italic">"{r.note}"</p>
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            )}

            {tab === 'totals' && (
                <div className="bg-white rounded-[40px] p-8 shadow-xl">
                    <div className="flex items-center gap-3 mb-8">
                        <BarChart3 className="text-primary" size={24} />
                        <div>
                            <h3 className="font-serif text-xl">30-Day Totals</h3>
                            <p className="text-[9px] font-black uppercase text-stone-400">Rolling wastage volume</p>
                        </div>
                    </div>
                    <div className="space-y-6">
                        {getMonthlyTotals().length === 0 && <p className="text-center text-stone-300 italic text-sm py-10">No wastage recorded in the last 30 days.</p>}
                        {getMonthlyTotals().map(([name, total]) => (
                            <div key={name}>
                                <div className="flex justify-between items-end mb-2">
                                    <span className="text-xs font-black uppercase text-stone-600">{name}</span>
                                    <span className="text-lg font-serif text-primary">{total}</span>
                                </div>
                                <div className="h-2 w-full bg-stone-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-primary rounded-full transition-all duration-1000" style={{ width: `${Math.min(100, (total / 50) * 100)}%` }}></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

// ... HistoryView, PinPad, NavButton, OrdersView, InventoryRow components remain the same ...

const InventoryRow = ({ item, supplierId, todayKey, quantities, onSave, isCompleted }) => {
  const currentQty = quantities[todayKey]?.[supplierId]?.[item.id] || '';
  if (isCompleted && (!currentQty || currentQty === '0')) return null;
  return (
    <div className={`flex items-center justify-between p-4 rounded-3xl transition-all duration-300 ${isCompleted ? 'bg-white border-2 border-stone-100' : 'bg-stone-50 border border-stone-100'}`}>
      <div className="flex flex-col">
        <span className="font-bold text-xs text-stone-600 uppercase tracking-tight">{item.name}</span>
        {!isCompleted && <span className="text-[9px] font-black text-amber-600/60 uppercase mt-0.5">PAR: {item.par || '-'}</span>}
      </div>
      <div className="flex items-center gap-3">
          {isCompleted ? (
              <div className="bg-stone-900 text-white w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg">{currentQty}</div>
          ) : (
              <input type="number" placeholder="0" className="w-20 p-3 rounded-full border-none bg-white shadow-inner text-center font-bold text-lg outline-none focus:ring-2 focus:ring-amber-500" value={currentQty} onChange={(e) => {
                  const newQ = { ...quantities }; if (!newQ[todayKey]) newQ[todayKey] = {}; if (!newQ[todayKey][supplierId]) newQ[todayKey][supplierId] = {};
                  newQ[todayKey][supplierId][item.id] = e.target.value; onSave('quantities', newQ);
              }} />
          )}
      </div>
    </div>
  );
};

const OrdersView = ({ staffName, todayKey, suppliers, history, quantities, onSave }) => {
  const [showAllSuppliers, setShowAllSuppliers] = useState(false);
  const dayName = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][new Date().getDay()];
  const scheduledSuppliers = suppliers.filter(s => s.days?.includes(dayName));
  const activeSuppliers = showAllSuppliers ? suppliers : scheduledSuppliers;
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <div className="bg-white/40 p-4 rounded-3xl flex items-center justify-center gap-3 border border-stone-200"><ClipboardCheck className="text-stone-400" size={16} /><span className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-500">Inventory Mode</span></div>
        <button onClick={() => setShowAllSuppliers(!showAllSuppliers)} className={`w-full p-4 rounded-3xl border-2 border-dashed flex items-center justify-center gap-2 transition-all active:scale-95 ${showAllSuppliers ? 'bg-amber-50 border-amber-300 text-amber-700' : 'bg-stone-50 border-stone-200 text-stone-400'}`}>{showAllSuppliers ? <X size={16}/> : <AlertCircle size={16} />}<span className="text-[10px] font-black uppercase tracking-widest">{showAllSuppliers ? 'Show Scheduled Only' : 'New Non-Scheduled Order'}</span></button>
      </div>
      {activeSuppliers.map(s => {
        const isCompleted = history[todayKey]?.[s.id];
        const orderedItemsCount = s.items?.filter(item => { const qty = quantities[todayKey]?.[s.id]?.[item.id]; return qty && qty !== '0'; }).length;
        if (isCompleted && orderedItemsCount === 0) return (
            <div key={s.id} className="p-4 rounded-3xl bg-stone-100/50 flex justify-between items-center border border-dashed border-stone-200 opacity-60"><span className="font-serif text-stone-500">{s.name} (Zero Order)</span><button onClick={() => { const newHistory = { ...history }; newHistory[todayKey][s.id] = null; onSave('history', newHistory); }} className="text-[9px] font-black uppercase text-primary">Re-open</button></div>
        );
        return (
          <div key={s.id} className="rounded-[40px] shadow-xl border-t-8 bg-white p-6 transition-all relative overflow-hidden" style={{ borderColor: isCompleted ? colors.success : colors.primary }}>
            {isCompleted && <div className="absolute top-0 right-16 bg-green-500 px-4 py-1 rounded-b-xl text-[9px] font-black text-white uppercase flex items-center gap-1"><ListFilter size={10} /> Summary</div>}
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1 pr-4"><h3 className="text-2xl font-serif text-stone-800 leading-tight">{s.name}</h3></div>
              <button onClick={() => { const newHistory = { ...history }; if (!newHistory[todayKey]) newHistory[todayKey] = {}; newHistory[todayKey][s.id] = isCompleted ? null : { done: true, by: staffName }; onSave('history', newHistory); }} className="p-4 rounded-full shadow-lg shrink-0 transition-transform active:scale-90" style={{ backgroundColor: isCompleted ? colors.success : colors.background }}><CheckCircle2 className={`w-6 h-6 ${isCompleted ? 'text-white' : 'text-stone-300'}`} /></button>
            </div>
            <div className="space-y-3">{s.items?.map(item => <InventoryRow key={item.id} item={item} supplierId={s.id} todayKey={todayKey} quantities={quantities} onSave={onSave} isCompleted={isCompleted} />)}</div>
          </div>
        );
      })}
    </div>
  );
};

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
            const completedCount = Object.values(history[d.key] || {}).filter(v => v?.done).length;
            return (
              <div key={d.key} className="flex flex-col items-center gap-2">
                <div className={`w-8 h-20 rounded-full relative overflow-hidden ${d.isToday ? 'ring-2 ring-amber-400 ring-offset-2' : ''}`} style={{ backgroundColor: '#F0F0F0' }}><div className="absolute bottom-0 w-full rounded-full transition-all duration-700" style={{ height: `${completedCount * 33}%`, backgroundColor: colors.primary }}></div></div>
                <span className={`text-[9px] font-black uppercase ${d.isToday ? 'text-amber-600' : 'text-stone-400'}`}>{d.label}</span>
              </div>
            );
          })}
        </div>
      </div>
      <div className="space-y-4">
        {[...complianceDays].reverse().map(d => {
            const dayData = quantities[d.key]; const dayMeta = history[d.key]; if (!dayData) return null;
            return (
                <div key={d.key} className="p-6 rounded-[30px] bg-white/60 border border-stone-200">
                    <p className="font-black text-[10px] uppercase text-stone-400 mb-4 tracking-widest">{d.label} History</p>
                    {Object.entries(dayData).map(([sId, items]) => (
                        <div key={sId} className="mb-4 last:mb-0">
                            <div className="flex justify-between items-center mb-2"><p className="text-[10px] font-black text-amber-600 uppercase">{suppliers.find(s => s.id === sId)?.name}</p><span className="text-[9px] bg-white px-2 py-1 rounded-full border text-stone-400 font-bold uppercase tracking-tighter">BY: {dayMeta?.[sId]?.by || 'System'}</span></div>
                            <div className="flex flex-wrap gap-2">{Object.entries(items).map(([itemId, qty]) => <span key={itemId} className="px-3 py-1 bg-white rounded-full text-[10px] font-bold shadow-sm border border-stone-100">{suppliers.find(s => s.id === sId)?.items.find(i => i.id.toString() === itemId)?.name}: {qty}</span>)}</div>
                        </div>
                    ))}
                </div>
            );
        })}
      </div>
    </div>
  );
};

const PinPad = ({ pinInput, setPinInput, onAuth }) => {
    const handleDigit = (d) => {
      const next = pinInput + d; if (next.length <= 4) { setPinInput(next); if (next === ADMIN_PIN) { onAuth(); setPinInput(""); } }
    };
    return (
      <div className="flex flex-col items-center py-10">
        <div className="flex gap-4 mb-12">{[...Array(4)].map((_, i) => (<div key={i} className={`w-5 h-5 rounded-full border-2 transition-all ${pinInput.length > i ? 'bg-amber-600 border-amber-600 scale-125' : 'border-stone-300'}`} />))}</div>
        <div className="grid grid-cols-3 gap-6">{[1, 2, 3, 4, 5, 6, 7, 8, 9, "C", 0, "⌫"].map(btn => (<button key={btn} onClick={() => { if (btn === "C") setPinInput(""); else if (btn === "⌫") setPinInput(pinInput.slice(0, -1)); else handleDigit(btn); }} className="w-20 h-20 rounded-full bg-white shadow-xl text-2xl font-bold active:scale-90 transition-transform">{btn}</button>))}</div>
      </div>
    );
};

const NavButton = ({ icon: Icon, active, onClick }) => (
    <button onClick={onClick} className={`p-4 rounded-full transition-all duration-500 ${active ? 'shadow-inner' : ''}`}
            style={{ backgroundColor: active ? colors.primary : 'transparent', color: active ? '#fff' : colors.primary }}>
      <Icon className="w-6 h-6" />
    </button>
);

export default CafeOrderingApp;
