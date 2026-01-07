import React, { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue, set } from "firebase/database";
import {
  Package,
  Settings,
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
  Edit3,
  Save,
  X,
  Loader2,
  ShoppingCart,
  History,
  Wine,
  Lock,
  ChevronRight
} from 'lucide-react';

// === YOUR FIREBASE CONFIG ===
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

// === THEME CONFIGURATION ===
const colors = {
  primary: '#722F37',    // Wine/Merlot
  secondary: '#F4EFE8',  // Cream/Off-White
  accent: '#D4AF37',     // Gold
  background: '#FDFBF7', // Light Cream Background
  textDark: '#2D0D15',   // Deep Wine
  textLight: '#F4EFE8',  // Cream
  success: '#3A7D44',    // Green
  danger: '#9E2A2B',     // Red
};

const ADMIN_PIN = "8923";

const CafeOrderingApp = () => {
  const [view, setView] = useState('orders');
  const [suppliers, setSuppliers] = useState([]);
  const [orderHistory, setOrderHistory] = useState({});
  const [orderQuantities, setOrderQuantities] = useState({});
  const [loading, setLoading] = useState(true);
  
  // Auth State
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [showPinError, setShowPinError] = useState(false);

  useEffect(() => {
    const dataRef = ref(db, 'cafe_data');
    return onValue(dataRef, (snapshot) => {
      const data = snapshot.val() || {};
      setSuppliers(data.suppliers || []);
      setOrderHistory(data.history || {});
      setOrderQuantities(data.quantities || {});
      setLoading(false);
    });
  }, []);

  const handlePinSubmit = (digit) => {
    const newPin = pinInput + digit;
    if (newPin.length <= 4) {
      setPinInput(newPin);
      if (newPin.length === 4) {
        if (newPin === ADMIN_PIN) {
          setIsAdminAuthenticated(true);
          setPinInput("");
        } else {
          setShowPinError(true);
          setTimeout(() => {
            setPinInput("");
            setShowPinError(false);
          }, 600);
        }
      }
    }
  };

  const saveToFirebase = (path, data) => {
    set(ref(db, `cafe_data/${path}`), data);
  };

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center" style={{ backgroundColor: colors.background }}>
      <Loader2 className="w-12 h-12 animate-spin" style={{ color: colors.primary }} />
    </div>
  );

  return (
    <div className="min-h-screen font-sans pb-24" style={{ backgroundColor: colors.background, color: colors.textDark }}>
      
      {/* HEADER */}
      <header className="sticky top-0 z-50 shadow-xl border-b-4" style={{ backgroundColor: colors.primary, borderColor: colors.accent }}>
        <div className="max-w-4xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-3xl font-serif tracking-[0.2em] uppercase" style={{ color: colors.secondary }}>BOBBY'S</span>
            <div className="h-1 w-full rounded-full" style={{ backgroundColor: colors.accent }}></div>
          </div>
          <div className="text-xs font-bold uppercase tracking-widest opacity-80" style={{ color: colors.secondary }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' })}
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="max-w-4xl mx-auto p-4">
        {view === 'orders' && (
          <OrdersView suppliers={suppliers} history={orderHistory} quantities={orderQuantities} onSave={saveToFirebase} />
        )}
        {view === 'history' && (
          <HistoryView suppliers={suppliers} history={orderHistory} />
        )}
        {view === 'admin' && (
          !isAdminAuthenticated ? (
            <div className="flex flex-col items-center justify-center py-10 animate-in fade-in zoom-in duration-300">
              <Lock className="w-10 h-10 mb-4 opacity-20" />
              <h2 className="text-sm font-bold uppercase tracking-[0.3em] mb-8">Enter Admin PIN</h2>
              <div className="flex gap-4 mb-10">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${showPinError ? 'bg-red-500 border-red-500 animate-bounce' : pinInput.length > i ? 'bg-amber-600 border-amber-600' : 'border-stone-300'}`} />
                ))}
              </div>
              <div className="grid grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, "", 0, "C"].map((btn, i) => (
                  <button
                    key={i}
                    disabled={btn === ""}
                    onClick={() => btn === "C" ? setPinInput("") : handlePinSubmit(btn)}
                    className={`w-16 h-16 rounded-full text-xl font-bold transition-all active:scale-90 ${btn === "" ? 'opacity-0' : 'bg-white shadow-sm hover:bg-stone-100 border border-stone-100'}`}
                  >
                    {btn}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <AdminView suppliers={suppliers} onSave={(newList) => saveToFirebase('suppliers', newList)} />
          )
        )}
      </main>

      {/* BOTTOM NAVIGATION */}
      <nav className="fixed bottom-0 left-0 right-0 border-t shadow-[0_-5px_15px_-5px_rgba(0,0,0,0.1)] pb-safe" style={{ backgroundColor: colors.secondary, borderColor: colors.accent }}>
        <div className="max-w-4xl mx-auto flex justify-around p-2">
          <NavButton icon={ShoppingCart} label="Orders" active={view === 'orders'} onClick={() => setView('orders')} />
          <NavButton icon={History} label="History" active={view === 'history'} onClick={() => setView('history')} />
          <NavButton icon={Settings} label="Admin" active={view === 'admin'} onClick={() => setView('admin')} />
        </div>
      </nav>
    </div>
  );
};

// Sub-components (OrdersView, HistoryView, AdminView, etc.)
const NavButton = ({ icon: Icon, label, active, onClick }) => (
  <button onClick={onClick} className="flex flex-col items-center justify-center p-2 min-w-[4rem] transition-all duration-300" style={{ color: active ? colors.primary : '#A08D93' }}>
    <div className={`p-2 rounded-xl mb-1 ${active ? 'shadow-sm bg-white' : ''}`}>
       <Icon className={`w-5 h-5 ${active ? 'fill-current' : ''}`} />
    </div>
    <span className="text-[9px] uppercase tracking-[0.2em] font-black">{label}</span>
  </button>
);

const OrdersView = ({ suppliers, history, quantities, onSave }) => {
  const todayKey = `${new Date().getFullYear()}-${new Date().getMonth() + 1}-${new Date().getDate()}`;
  const dayName = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][new Date().getDay()];
  const todaysSuppliers = suppliers.filter(s => s.days?.includes(dayName));

  if (todaysSuppliers.length === 0) return (
    <div className="flex flex-col items-center justify-center py-20 opacity-30 text-center">
      <Wine className="w-16 h-16 mb-4" />
      <h2 className="text-xl font-serif uppercase tracking-widest">No Deliveries Today</h2>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      {todaysSuppliers.map(s => {
        const isCompleted = history[todayKey]?.[s.id];
        return (
          <div key={s.id} className="rounded-2xl shadow-lg border overflow-hidden transition-all bg-white" style={{ borderColor: isCompleted ? colors.success : colors.primary + '20' }}>
            <div className="p-5 flex justify-between items-center" style={{ backgroundColor: isCompleted ? colors.success + '10' : 'transparent' }}>
              <div>
                <h3 className="font-serif text-lg tracking-wider uppercase" style={{ color: colors.primary }}>{s.name}</h3>
                <p className="text-[10px] font-bold uppercase tracking-widest opacity-50">{s.items?.length || 0} Items</p>
              </div>
              <button onClick={() => {
                const newHistory = { ...history };
                if (!newHistory[todayKey]) newHistory[todayKey] = {};
                newHistory[todayKey][s.id] = !newHistory[todayKey][s.id];
                onSave('history', newHistory);
              }} className="px-5 py-3 rounded-lg font-bold text-[10px] uppercase tracking-widest transition-all active:scale-95 shadow-md" style={{ backgroundColor: isCompleted ? colors.success : colors.primary, color: 'white' }}>
                {isCompleted ? 'Received' : 'Mark In'}
              </button>
            </div>
            <div className="divide-y divide-stone-50">
              {s.items?.map(item => (
                <div key={item.id} className="p-4 flex items-center justify-between">
                  <span className="font-bold text-xs uppercase tracking-wide opacity-80">{item.name} <span className="ml-2 text-[9px] opacity-40">Par: {item.par}</span></span>
                  <input type="number" placeholder="0" className="w-16 h-10 text-center border rounded-lg font-serif text-lg outline-none bg-stone-50 focus:bg-white focus:border-amber-500" value={quantities[todayKey]?.[s.id]?.[item.id] || ''} onChange={(e) => {
                    const newQ = { ...quantities };
                    if (!newQ[todayKey]) newQ[todayKey] = {};
                    if (!newQ[todayKey][s.id]) newQ[todayKey][s.id] = {};
                    newQ[todayKey][s.id][item.id] = e.target.value;
                    onSave('quantities', newQ);
                  }} />
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const HistoryView = ({ suppliers, history }) => {
  const days = Array.from({ length: 5 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - i);
    return { key: `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`, label: d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' }), dayName: d.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase() };
  });

  return (
    <div className="rounded-xl shadow-xl border overflow-hidden bg-white">
      <div className="p-4 border-b bg-stone-50"><h2 className="font-serif uppercase tracking-widest text-[10px] text-center">Compliance Record</h2></div>
      <div className="overflow-x-auto">
        <table className="w-full text-[10px]">
          <thead><tr className="border-b">{['Supplier', ...days.map(d => d.label)].map(h => <th key={h} className="p-4 uppercase tracking-widest opacity-50">{h}</th>)}</tr></thead>
          <tbody>
            {suppliers.map(s => (
              <tr key={s.id} className="border-b last:border-0">
                <td className="p-4 font-bold uppercase">{s.name}</td>
                {days.map(d => (
                  <td key={d.key} className="p-4 text-center">
                    {s.days?.includes(d.dayName) ? (history[d.key]?.[s.id] ? <CheckCircle2 className="w-4 h-4 mx-auto text-green-600" /> : <Circle className="w-4 h-4 mx-auto text-stone-200" />) : '-'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const AdminView = ({ suppliers, onSave }) => {
  const [mode, setMode] = useState('list');
  const [formData, setFormData] = useState(null);

  const startEdit = (supplier) => {
    setFormData(supplier ? { ...supplier } : { id: Date.now().toString(), name: '', days: [], items: [] });
    setMode('form');
  };

  if (mode === 'form') return <SupplierForm initialData={formData} onSave={(data) => {
    const newList = !suppliers.find(s => s.id === data.id) ? [...suppliers, data] : suppliers.map(s => s.id === data.id ? data : s);
    onSave(newList); setMode('list');
  }} onCancel={() => setMode('list')} />;

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-serif text-lg uppercase tracking-widest">Cellar Management</h2>
        <button onClick={() => startEdit(null)} className="p-3 bg-stone-900 text-white rounded-full shadow-lg active:scale-95"><Plus className="w-5 h-5" /></button>
      </div>
      {suppliers.map(s => (
        <div key={s.id} className="p-5 rounded-2xl bg-white border border-stone-100 flex justify-between items-center shadow-sm">
          <span className="font-bold text-xs uppercase tracking-widest">{s.name}</span>
          <div className="flex gap-2">
            <button onClick={() => startEdit(s)} className="p-2 text-stone-400 hover:text-amber-600"><Edit3 className="w-4 h-4" /></button>
            <button onClick={() => window.confirm("Delete?") && onSave(suppliers.filter(x => x.id !== s.id))} className="p-2 text-stone-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
          </div>
        </div>
      ))}
    </div>
  );
};

const SupplierForm = ({ initialData, onSave, onCancel }) => {
  const [data, setData] = useState(initialData);
  const addItem = () => setData({ ...data, items: [...(data.items || []), { id: Date.now(), name: '', par: '' }] });

  return (
    <div className="bg-white rounded-3xl shadow-2xl p-6 border border-stone-100 animate-in slide-in-from-bottom-8">
      <div className="flex justify-between items-center mb-8">
        <h3 className="font-serif uppercase tracking-widest text-sm">Supplier Profile</h3>
        <X onClick={onCancel} className="w-5 h-5 opacity-20 cursor-pointer" />
      </div>
      <input className="w-full p-4 rounded-xl border-none bg-stone-50 font-serif text-xl mb-6 outline-none focus:bg-stone-100" placeholder="Supplier Name" value={data.name} onChange={e => setData({...data, name: e.target.value})} />
      <div className="flex flex-wrap gap-2 mb-8">
        {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => (
          <button key={day} onClick={() => {
            const days = data.days?.includes(day) ? data.days.filter(d => d !== day) : [...(data.days || []), day];
            setData({...data, days});
          }} className={`px-3 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all ${data.days?.includes(day) ? 'bg-stone-900 text-white border-stone-900' : 'bg-white text-stone-300 border-stone-100'}`}>{day.slice(0,3)}</button>
        ))}
      </div>
      <div className="space-y-3 mb-8">
        {data.items?.map((item, i) => (
          <div key={i} className="flex gap-2">
            <input className="flex-1 p-3 rounded-lg bg-stone-50 text-xs font-bold uppercase tracking-wide outline-none" placeholder="Item Name" value={item.name} onChange={e => {
              const items = [...data.items]; items[i].name = e.target.value; setData({...data, items});
            }} />
            <input className="w-16 p-3 rounded-lg bg-stone-50 text-xs text-center font-bold outline-none" placeholder="Par" value={item.par} onChange={e => {
              const items = [...data.items]; items[i].par = e.target.value; setData({...data, items});
            }} />
          </div>
        ))}
        <button onClick={addItem} className="text-[10px] font-bold uppercase tracking-widest text-amber-600">+ Add Item</button>
      </div>
      <button onClick={() => onSave(data)} className="w-full py-4 bg-stone-900 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl active:scale-95">Save Supplier</button>
    </div>
  );
};

export default CafeOrderingApp;
