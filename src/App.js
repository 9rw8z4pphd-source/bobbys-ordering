import React, { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue, set } from "firebase/database";
import { Calendar, Package, Settings, CheckCircle, Circle, Plus, Trash2, Edit2, Save, X, Loader2, ClipboardList } from 'lucide-react';

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

const CafeOrderingApp = () => {
  const [view, setView] = useState('supervisor');
  const [suppliers, setSuppliers] = useState([]);
  const [orderHistory, setOrderHistory] = useState({});
  const [orderQuantities, setOrderQuantities] = useState({});
  const [loading, setLoading] = useState(true);
  
  // Admin UI States
  const [showAddSupplier, setShowAddSupplier] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);

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

  const saveAllData = (newSuppliers, newHistory, newQuantities) => {
    set(ref(db, 'cafe_data'), {
      suppliers: newSuppliers || suppliers,
      history: newHistory || orderHistory,
      quantities: newQuantities || orderQuantities
    });
  };

  const getTodayKey = () => {
    const today = new Date();
    return `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
  };

  const getDayOfWeek = () => ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][new Date().getDay()];

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-stone-100">
      <Loader2 className="animate-spin text-amber-900 w-12 h-12" />
      <p className="mt-4 font-black text-amber-900 uppercase italic">Loading Bobby's Data...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-stone-200 pb-20 font-sans">
      {/* SOLID HEADER */}
      <nav className="bg-amber-950 text-white p-5 shadow-2xl sticky top-0 z-50 border-b-4 border-amber-600">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-black italic tracking-tighter flex items-center gap-2">
            <Package className="text-amber-500 w-8 h-8" /> BOBBY'S CAFE
          </h1>
          <div className="flex bg-stone-900 p-1 rounded-xl border border-stone-700">
            <button onClick={() => setView('supervisor')} className={`px-4 py-2 rounded-lg text-xs font-black uppercase transition-all ${view === 'supervisor' ? 'bg-amber-600 text-white shadow-lg' : 'text-stone-400 hover:text-white'}`}>Orders</button>
            <button onClick={() => setView('manager')} className={`px-4 py-2 rounded-lg text-xs font-black uppercase transition-all ${view === 'manager' ? 'bg-amber-600 text-white shadow-lg' : 'text-stone-400 hover:text-white'}`}>Status</button>
            <button onClick={() => setView('admin')} className={`px-4 py-2 rounded-lg text-xs font-black uppercase transition-all ${view === 'admin' ? 'bg-amber-600 text-white shadow-lg' : 'text-stone-400 hover:text-white'}`}>Admin</button>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto p-4">
        {view === 'supervisor' && (
          <SupervisorView 
            suppliers={suppliers.filter(s => s.orderDays?.includes(getDayOfWeek()))}
            orderHistory={orderHistory}
            orderQuantities={orderQuantities}
            onToggleOrder={(id) => {
              const key = getTodayKey();
              const newHistory = { ...orderHistory };
              if (!newHistory[key]) newHistory[key] = {};
              newHistory[key][id] = !newHistory[key][id];
              saveAllData(null, newHistory, null);
            }}
            onUpdateQty={(sid, pid, val) => {
              const key = getTodayKey();
              const newQtys = { ...orderQuantities };
              if (!newQtys[key]) newQtys[key] = {};
              if (!newQtys[key][sid]) newQtys[key][sid] = {};
              newQtys[key][sid][pid] = val;
              saveAllData(null, null, newQtys);
            }}
            todayKey={getTodayKey()}
          />
        )}

        {view === 'manager' && <ManagerView suppliers={suppliers} orderHistory={orderHistory} orderQuantities={orderQuantities} />}

        {view === 'admin' && (
          <AdminView 
            suppliers={suppliers} 
            onSave={(newList) => { saveAllData(newList); setShowAddSupplier(false); setEditingSupplier(null); }}
            showAddSupplier={showAddSupplier}
            setShowAddSupplier={setShowAddSupplier}
            editingSupplier={editingSupplier}
            setEditingSupplier={setEditingSupplier}
          />
        )}
      </main>
    </div>
  );
};

// === SUPERVISOR VIEW ===
const SupervisorView = ({ suppliers, orderHistory, orderQuantities, onToggleOrder, onUpdateQty, todayKey }) => (
  <div className="space-y-6 animate-in fade-in duration-500">
    <div className="bg-white p-5 rounded-2xl border-b-8 border-amber-600 shadow-lg flex justify-between items-center">
      <h2 className="text-xl font-black text-stone-800 uppercase italic">Today's Deliveries</h2>
      <span className="text-amber-700 font-bold bg-amber-50 px-4 py-1 rounded-full border border-amber-200">{new Date().toLocaleDateString('en-GB', { weekday: 'long' })}</span>
    </div>

    {suppliers.length === 0 ? (
      <div className="bg-white/50 border-4 border-dashed border-stone-300 rounded-3xl p-20 text-center text-stone-400 font-black uppercase italic tracking-widest">No scheduled orders for today</div>
    ) : (
      suppliers.map(s => {
        const isDone = orderHistory[todayKey]?.[s.id];
        return (
          <div key={s.id} className={`bg-white rounded-3xl shadow-xl overflow-hidden border-2 ${isDone ? 'border-green-500 shadow-green-100' : 'border-stone-100'}`}>
            <div className={`p-5 flex justify-between items-center ${isDone ? 'bg-green-50' : 'bg-stone-50'}`}>
              <h3 className="text-xl font-black italic text-stone-800 uppercase">{s.name}</h3>
              <button onClick={() => onToggleOrder(s.id)} className={`flex items-center gap-2 px-8 py-4 rounded-2xl font-black uppercase transition-all shadow-md active:scale-95 ${isDone ? 'bg-green-600 text-white' : 'bg-orange-600 text-white'}`}>
                {isDone ? <CheckCircle /> : <Circle />} {isDone ? 'Sent' : 'Mark Ready'}
              </button>
            </div>
            <div className="p-6 space-y-4">
              {s.products?.map(p => (
                <div key={p.id} className="flex items-center justify-between gap-4 p-4 bg-stone-50 rounded-2xl border border-stone-200">
                  <div className="flex-1">
                    <p className="font-black text-stone-800 uppercase text-sm">{p.name}</p>
                    <p className="text-[10px] text-amber-600 font-black tracking-widest uppercase">Par: {p.parLevel}</p>
                  </div>
                  <input 
                    type="number" 
                    placeholder="Qty"
                    className="w-24 p-4 rounded-xl border-4 border-stone-200 text-center font-black text-xl focus:border-amber-600 outline-none"
                    value={orderQuantities[todayKey]?.[s.id]?.[p.id] || ''}
                    onChange={(e) => onUpdateQty(s.id, p.id, e.target.value)}
                  />
                </div>
              ))}
            </div>
          </div>
        );
      })
    )}
  </div>
);

// === MANAGER VIEW (RESTORED TABLE) ===
const ManagerView = ({ suppliers, orderHistory, orderQuantities }) => {
  const dates = [];
  for (let i = 3; i >= -3; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    dates.push({
      key: `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`,
      day: d.toLocaleDateString('en-US', { weekday: 'short' }),
      num: d.getDate(),
      isToday: i === 0
    });
  }

  return (
    <div className="bg-white rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-right-10 duration-500">
      <div className="bg-stone-900 p-6">
        <h2 className="text-white font-black italic uppercase text-lg">Weekly Compliance Table</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-stone-100 border-b-2 border-stone-200">
              <th className="p-6 text-left font-black text-stone-500 uppercase text-xs">Supplier</th>
              {dates.map(d => (
                <th key={d.key} className={`p-4 text-center ${d.isToday ? 'bg-amber-100 border-x-2 border-amber-200' : ''}`}>
                  <span className="block font-black text-stone-800 text-sm italic">{d.day}</span>
                  <span className="text-xs font-bold text-stone-400">{d.num}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {suppliers.map(s => (
              <tr key={s.id} className="border-b border-stone-100 hover:bg-stone-50 transition-colors">
                <td className="p-6 font-black text-stone-700 uppercase italic text-sm">{s.name}</td>
                {dates.map(d => {
                  const completed = orderHistory[d.key]?.[s.id];
                  const shouldOrder = s.orderDays?.includes(['sunday','monday','tuesday','wednesday','thursday','friday','saturday'][new Date(d.key).getDay()]);
                  return (
                    <td key={d.key} className={`p-4 text-center ${d.isToday ? 'bg-amber-50/50' : ''}`}>
                      {!shouldOrder ? <span className="text-stone-200 text-xs">-</span> : 
                        completed ? <CheckCircle className="mx-auto text-green-600 w-6 h-6" /> : <Circle className="mx-auto text-stone-300 w-6 h-6" />
                      }
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

// === ADMIN VIEW (WITH FULL EDIT FORM) ===
const AdminView = ({ suppliers, onSave, showAddSupplier, setShowAddSupplier, editingSupplier, setEditingSupplier }) => {
  const [formData, setFormData] = useState({ name: '', orderDays: [], products: [] });

  useEffect(() => {
    if (editingSupplier) setFormData(editingSupplier);
    else setFormData({ name: '', orderDays: [], products: [] });
  }, [editingSupplier]);

  const toggleDay = (day) => {
    const days = formData.orderDays.includes(day) ? formData.orderDays.filter(d => d !== day) : [...formData.orderDays, day];
    setFormData({...formData, orderDays: days});
  };

  const addProduct = () => setFormData({...formData, products: [...formData.products, { id: Date.now().toString(), name: '', parLevel: '' }]});

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-black italic uppercase text-stone-800 underline decoration-amber-500">Database Management</h2>
        <button onClick={() => setShowAddSupplier(true)} className="bg-stone-900 text-white p-4 rounded-2xl shadow-xl hover:bg-black active:scale-95 transition-all"><Plus /></button>
      </div>

      {(showAddSupplier || editingSupplier) && (
        <div className="bg-white p-8 rounded-3xl shadow-2xl border-4 border-amber-600 space-y-6 animate-in zoom-in duration-300">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-black italic uppercase">{editingSupplier ? 'Edit Supplier' : 'New Supplier'}</h3>
            <button onClick={() => {setShowAddSupplier(false); setEditingSupplier(null);}}><X /></button>
          </div>
          <input 
            placeholder="SUPPLIER NAME" 
            className="w-full p-4 bg-stone-100 rounded-2xl font-black text-xl border-2 border-transparent focus:border-amber-600 outline-none uppercase italic"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
          />
          <div className="flex flex-wrap gap-2">
            {['monday','tuesday','wednesday','thursday','friday','saturday','sunday'].map(d => (
              <button key={d} onClick={() => toggleDay(d)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${formData.orderDays.includes(d) ? 'bg-amber-600 text-white' : 'bg-stone-200 text-stone-500'}`}>{d.slice(0,3)}</button>
            ))}
          </div>
          <div className="space-y-3">
            {formData.products.map((p, idx) => (
              <div key={p.id} className="flex gap-2">
                <input placeholder="PRODUCT NAME" className="flex-1 p-3 bg-stone-50 border rounded-xl font-bold uppercase text-xs" value={p.name} onChange={(e) => {
                  const ps = [...formData.products]; ps[idx].name = e.target.value; setFormData({...formData, products: ps});
                }} />
                <input placeholder="PAR" type="number" className="w-20 p-3 bg-stone-50 border rounded-xl font-bold text-center text-xs" value={p.parLevel} onChange={(e) => {
                  const ps = [...formData.products]; ps[idx].parLevel = e.target.value; setFormData({...formData, products: ps});
                }} />
                <button onClick={() => setFormData({...formData, products: formData.products.filter(x => x.id !== p.id)})} className="text-red-500 p-2"><Trash2 size={16}/></button>
              </div>
            ))}
            <button onClick={addProduct} className="text-amber-600 font-black uppercase text-xs italic">+ Add Product</button>
          </div>
          <button onClick={() => {
            const newList = editingSupplier ? suppliers.map(s => s.id === formData.id ? formData : s) : [...suppliers, {...formData, id: Date.now().toString()}];
            onSave(newList);
          }} className="w-full bg-amber-900 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-lg shadow-xl shadow-amber-900/20 active:translate-y-1 transition-all">Save to Database</button>
        </div>
      )}

      <div className="grid gap-4">
        {suppliers.map(s => (
          <div key={s.id} className="bg-white p-6 rounded-3xl flex justify-between items-center shadow-lg border-2 border-transparent hover:border-amber-500 transition-all group">
            <div>
              <h3 className="font-black text-stone-800 uppercase italic text-lg leading-tight">{s.name}</h3>
              <p className="text-[10px] text-stone-400 font-black uppercase tracking-widest">{s.orderDays?.length || 0} Days • {s.products?.length || 0} Products</p>
            </div>
            <div className="flex gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => setEditingSupplier(s)} className="bg-stone-100 p-3 rounded-xl text-amber-600 hover:bg-amber-600 hover:text-white"><Edit2 size={18} /></button>
              <button onClick={() => onSave(suppliers.filter(x => x.id !== s.id))} className="bg-stone-100 p-3 rounded-xl text-red-400 hover:bg-red-600 hover:text-white"><Trash2 size={18} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CafeOrderingApp;
