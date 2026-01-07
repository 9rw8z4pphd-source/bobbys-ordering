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
  Wine 
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

// === NEW "WINE BAR" THEME ===
const colors = {
  primary: '#5D0E2A',   // Deep Burgundy (Logo Background)
  secondary: '#F4EFE8', // Cream (Logo Text)
  accent: '#D4AF37',    // Gold (Accent)
  background: '#F9F6F2', // Light Cream (App Background)
  textDark: '#3E091C',  // Dark Burgundy (Text)
  success: '#2E7D32',   // Green
  danger: '#C62828',    // Red
};

const CafeOrderingApp = () => {
  const [view, setView] = useState('orders');
  const [suppliers, setSuppliers] = useState([]);
  const [orderHistory, setOrderHistory] = useState({});
  const [orderQuantities, setOrderQuantities] = useState({});
  const [loading, setLoading] = useState(true);

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

  const saveToFirebase = (path, data) => {
    set(ref(db, `cafe_data/${path}`), data);
  };

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center" style={{ backgroundColor: colors.background }}>
      <Loader2 className="w-12 h-12 animate-spin" style={{ color: colors.primary }} />
      <p className="mt-4 font-semibold" style={{ color: colors.textDark }}>Loading Bobby's Wine Bar...</p>
    </div>
  );

  return (
    <div className="min-h-screen font-sans pb-24" style={{ backgroundColor: colors.background, color: colors.textDark }}>
      
      {/* HEADER WITH WINE THEME */}
      <header className="sticky top-0 z-50 shadow-xl border-b-4" style={{ backgroundColor: colors.primary, borderColor: colors.accent }}>
        <div className="max-w-4xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Logo Replacement: Wine Icon */}
            <div className="p-2 rounded-full border-2" style={{ borderColor: colors.accent, backgroundColor: 'rgba(255,255,255,0.1)' }}>
              <Wine className="w-8 h-8" style={{ color: colors.secondary }} />
            </div>
            <div>
              <h1 className="text-2xl font-black uppercase tracking-widest leading-none" style={{ color: colors.secondary, fontFamily: 'serif' }}>BOBBY'S</h1>
              <p className="text-xs font-bold tracking-[0.3em] uppercase" style={{ color: colors.accent }}>Wine Bar</p>
            </div>
          </div>
          <div className="text-xs font-medium text-right" style={{ color: colors.secondary, opacity: 0.8 }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' })}
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="max-w-4xl mx-auto p-4">
        {view === 'orders' && (
          <OrdersView 
            suppliers={suppliers} 
            history={orderHistory} 
            quantities={orderQuantities} 
            onSave={saveToFirebase} 
          />
        )}
        {view === 'history' && <HistoryView suppliers={suppliers} history={orderHistory} />}
        {view === 'admin' && <AdminView suppliers={suppliers} onSave={(newList) => saveToFirebase('suppliers', newList)} />}
      </main>

      {/* BOTTOM NAV */}
      <nav className="fixed bottom-0 left-0 right-0 border-t shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] pb-safe" style={{ backgroundColor: colors.secondary, borderColor: colors.accent }}>
        <div className="max-w-4xl mx-auto flex justify-around p-2">
          <NavButton icon={ShoppingCart} label="Orders" active={view === 'orders'} onClick={() => setView('orders')} />
          <NavButton icon={History} label="Status" active={view === 'history'} onClick={() => setView('history')} />
          <NavButton icon={Settings} label="Admin" active={view === 'admin'} onClick={() => setView('admin')} />
        </div>
      </nav>
    </div>
  );
};

const NavButton = ({ icon: Icon, label, active, onClick }) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center justify-center p-2 min-w-[4rem] rounded-xl transition-all`}
    style={{ 
      color: active ? colors.primary : '#A08C96',
      backgroundColor: active ? 'rgba(93, 14, 42, 0.1)' : 'transparent',
      fontWeight: active ? 'bold' : 'normal'
    }}
  >
    <Icon className={`w-6 h-6 mb-1 ${active ? 'fill-current' : ''}`} />
    <span className="text-[10px] uppercase tracking-wide">{label}</span>
  </button>
);

const OrdersView = ({ suppliers, history, quantities, onSave }) => {
  const getTodayKey = () => { const d = new Date(); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; };
  const todayKey = getTodayKey();
  const dayName = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][new Date().getDay()];
  const todaysSuppliers = suppliers.filter(s => s.days && s.days.includes(dayName));

  const toggleStatus = (supplierId) => {
    const newHistory = { ...history };
    if (!newHistory[todayKey]) newHistory[todayKey] = {};
    newHistory[todayKey][supplierId] = !newHistory[todayKey][supplierId];
    onSave('history', newHistory);
  };

  const updateQty = (supplierId, prodId, val) => {
    const newQuantities = { ...quantities };
    if (!newQuantities[todayKey]) newQuantities[todayKey] = {};
    if (!newQuantities[todayKey][supplierId]) newQuantities[todayKey][supplierId] = {};
    newQuantities[todayKey][supplierId][prodId] = val;
    onSave('quantities', newQuantities);
  };

  if (todaysSuppliers.length === 0) return (
    <div className="flex flex-col items-center justify-center py-24 opacity-50">
      <Wine className="w-20 h-20 mb-4" style={{ color: colors.primary }} />
      <h2 className="text-2xl font-bold font-serif" style={{ color: colors.primary }}>No Deliveries</h2>
      <p className="text-sm">Enjoy the vintage!</p>
    </div>
  );

  return (
    <div className="space-y-6">
      {todaysSuppliers.map(s => {
        const isCompleted = history[todayKey]?.[s.id];
        return (
          <div key={s.id} className="rounded-2xl shadow-lg border-2 overflow-hidden transition-all"
            style={{ backgroundColor: '#fff', borderColor: isCompleted ? colors.success : colors.primary }}
          >
            <div className="p-4 flex justify-between items-center" 
              style={{ backgroundColor: isCompleted ? 'rgba(46, 125, 50, 0.1)' : 'rgba(93, 14, 42, 0.05)', borderBottom: `2px solid ${isCompleted ? colors.success : colors.primary}` }}>
              <div>
                <h3 className="font-black text-xl uppercase tracking-tight font-serif" style={{ color: colors.primary }}>{s.name}</h3>
                <p className="text-xs font-bold uppercase tracking-wider opacity-60">{s.items?.length || 0} Items</p>
              </div>
              <button onClick={() => toggleStatus(s.id)}
                className="flex items-center gap-2 px-4 py-3 rounded-xl font-bold text-sm uppercase transition-all shadow-md active:scale-95"
                style={{ backgroundColor: isCompleted ? colors.success : colors.primary, color: colors.secondary }}>
                {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                {isCompleted ? 'Received' : 'Mark In'}
              </button>
            </div>
            <div className="divide-y divide-stone-100">
              {s.items?.map(item => (
                <div key={item.id} className="p-4 flex items-center justify-between hover:bg-stone-50">
                  <div className="flex-1">
                    <p className="font-bold text-lg" style={{ color: colors.textDark }}>{item.name}</p>
                    <span className="text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider" style={{ backgroundColor: colors.background, color: colors.primary }}>Par: {item.par}</span>
                  </div>
                  <input 
                    type="number" placeholder="0"
                    className="w-20 h-12 text-center border-2 rounded-xl font-bold text-xl outline-none transition-all"
                    style={{ backgroundColor: colors.background, borderColor: '#E5E0D8', color: colors.textDark }}
                    onFocus={(e) => e.target.style.borderColor = colors.primary}
                    onBlur={(e) => e.target.style.borderColor = '#E5E0D8'}
                    value={quantities[todayKey]?.[s.id]?.[item.id] || ''}
                    onChange={(e) => updateQty(s.id, item.id, e.target.value)}
                  />
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
  const days = Array.from({length: 5}, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - i);
    return { key: `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`, label: d.toLocaleDateString('en-US', {weekday:'short', day:'numeric'}), dayName: d.toLocaleDateString('en-US', {weekday:'long'}).toLowerCase() };
  });

  return (
    <div className="rounded-2xl shadow-lg border overflow-hidden bg-white" style={{ borderColor: colors.primary }}>
      <div className="p-4 border-b" style={{ backgroundColor: colors.primary, color: colors.secondary }}>
        <h2 className="font-bold uppercase tracking-widest text-xs">Compliance Log</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-stone-50">
              <th className="p-4 text-left font-bold uppercase text-xs opacity-50">Supplier</th>
              {days.map(d => <th key={d.key} className="p-4 text-center font-bold min-w-[80px]">{d.label}</th>)}
            </tr>
          </thead>
          <tbody>
            {suppliers.map(s => (
              <tr key={s.id} className="border-b last:border-0 hover:bg-stone-50">
                <td className="p-4 font-bold font-serif text-lg" style={{ color: colors.primary }}>{s.name}</td>
                {days.map(d => {
                  const shouldOrder = s.days?.includes(d.dayName);
                  const isDone = history[d.key]?.[s.id];
                  if (!shouldOrder) return <td key={d.key} className="text-center opacity-20">-</td>;
                  return (
                    <td key={d.key} className="text-center">
                      {isDone ? <CheckCircle2 className="w-6 h-6 mx-auto" style={{ color: colors.success }} /> : <Circle className="w-6 h-6 mx-auto opacity-30" style={{ color: colors.danger }} />}
                    </td>
                  );
                })}
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

  const handleDelete = (id) => { if (window.confirm("Delete this supplier?")) onSave(suppliers.filter(s => s.id !== id)); };

  if (mode === 'form') return <SupplierForm initialData={formData} onSave={(data) => {
    const isNew = !suppliers.find(s => s.id === data.id);
    onSave(isNew ? [...suppliers, data] : suppliers.map(s => s.id === data.id ? data : s));
    setMode('list');
  }} onCancel={() => setMode('list')} />;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-bold font-serif text-xl" style={{ color: colors.primary }}>Manage Suppliers</h2>
        <button onClick={() => startEdit(null)} className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold shadow-lg text-sm uppercase tracking-wide active:scale-95 transition-all" 
          style={{ backgroundColor: colors.primary, color: colors.accent }}>
          <Plus className="w-4 h-4" /> Add New
        </button>
      </div>
      <div className="grid gap-3">
        {suppliers.map(s => (
          <div key={s.id} className="p-5 rounded-2xl shadow-sm border flex justify-between items-center bg-white" style={{ borderColor: '#E5E0D8' }}>
            <div>
              <h3 className="font-bold text-lg font-serif" style={{ color: colors.textDark }}>{s.name}</h3>
              <p className="text-xs font-bold uppercase tracking-wider opacity-50">{s.days?.length || 0} Days • {s.items?.length || 0} Products
