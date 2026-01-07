import React, { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue, set } from "firebase/database";
import { Calendar, Package, Settings, CheckCircle, Circle, Plus, Trash2, Edit2, Save, X, Loader2 } from 'lucide-react';

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
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [showAddSupplier, setShowAddSupplier] = useState(false);
  const [loading, setLoading] = useState(true);

  // === SYNC DATA FROM FIREBASE ===
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

  const updateDatabase = (updates) => {
    const dataRef = ref(db, 'cafe_data');
    onValue(dataRef, (snapshot) => {
      const current = snapshot.val() || {};
      set(dataRef, { ...current, ...updates });
    }, { onlyOnce: true });
  };

  // === LOGIC HELPERS ===
  const getTodayKey = () => {
    const today = new Date();
    return `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
  };

  const getDayOfWeek = () => {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return days[new Date().getDay()];
  };

  const toggleOrder = (supplierId) => {
    const todayKey = getTodayKey();
    const newHistory = { ...orderHistory };
    if (!newHistory[todayKey]) newHistory[todayKey] = {};
    newHistory[todayKey][supplierId] = !newHistory[todayKey][supplierId];
    updateDatabase({ history: newHistory });
  };

  const updateQuantity = (supplierId, productId, quantity) => {
    const todayKey = getTodayKey();
    const newQuantities = { ...orderQuantities };
    if (!newQuantities[todayKey]) newQuantities[todayKey] = {};
    if (!newQuantities[todayKey][supplierId]) newQuantities[todayKey][supplierId] = {};
    newQuantities[todayKey][supplierId][productId] = quantity;
    updateDatabase({ quantities: newQuantities });
  };

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-amber-50">
      <Loader2 className="animate-spin text-amber-800" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 pb-10">
      <div className="bg-amber-900 text-white p-4 shadow-lg sticky top-0 z-50">
        <h1 className="text-2xl font-bold flex items-center gap-2"><Package /> Bobby's Order List</h1>
        <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
          <button onClick={() => setView('supervisor')} className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap ${view === 'supervisor' ? 'bg-white text-amber-900' : 'bg-amber-800'}`}>Today's Orders</button>
          <button onClick={() => setView('manager')} className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap ${view === 'manager' ? 'bg-white text-amber-900' : 'bg-amber-800'}`}>Manager View</button>
          <button onClick={() => setView('admin')} className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap ${view === 'admin' ? 'bg-white text-amber-900' : 'bg-amber-800'}`}><Settings className="w-4 h-4 inline mr-1" />Admin</button>
        </div>
      </div>

      <div className="container mx-auto p-4 max-w-4xl">
        {view === 'supervisor' && (
          <SupervisorView 
            suppliers={suppliers.filter(s => s.orderDays?.includes(getDayOfWeek()))}
            toggleOrder={toggleOrder}
            orderHistory={orderHistory}
            updateQuantity={updateQuantity}
            orderQuantities={orderQuantities}
            todayKey={getTodayKey()}
          />
        )}
        {view === 'manager' && <ManagerView suppliers={suppliers} orderHistory={orderHistory} orderQuantities={orderQuantities} />}
        {view === 'admin' && (
          <AdminView 
            suppliers={suppliers} 
            onSave={(newList) => updateDatabase({ suppliers: newList })}
            setShowAddSupplier={setShowAddSupplier}
            showAddSupplier={showAddSupplier}
            editingSupplier={editingSupplier}
            setEditingSupplier={setEditingSupplier}
          />
        )}
      </div>
    </div>
  );
};

// === SUB-COMPONENTS (SUPERVISOR, MANAGER, ADMIN) ===

const SupervisorView = ({ suppliers, toggleOrder, orderHistory, updateQuantity, orderQuantities, todayKey }) => (
  <div className="space-y-4">
    <div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-amber-500 font-bold text-stone-700">
      {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
    </div>
    {suppliers.length === 0 ? (
      <div className="text-center py-20 text-stone-400 font-bold uppercase italic">No deliveries scheduled today.</div>
    ) : (
      suppliers.map(s => {
        const completed = orderHistory[todayKey]?.[s.id];
        return (
          <div key={s.id} className={`bg-white rounded-2xl shadow-md p-6 border-l-8 ${completed ? 'border-green-500' : 'border-orange-500'}`}>
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-xl font-black text-stone-800 uppercase italic">{s.name}</h3>
              <button onClick={() => toggleOrder(s.id)} className={`px-6 py-3 rounded-xl font-black text-sm transition-all ${completed ? 'bg-green-500 text-white' : 'bg-orange-500 text-white shadow-lg'}`}>
                {completed ? 'COMPLETED' : 'MARK DONE'}
              </button>
            </div>
            <div className="space-y-4">
              {s.products?.map(p => (
                <div key={p.id} className="bg-stone-50 p-4 rounded-xl flex items-center justify-between border border-stone-100">
                  <span className="font-bold text-stone-700">{p.name} <span className="text-[10px] block text-stone-400 uppercase">Par: {p.parLevel}</span></span>
                  <input 
                    type="number" 
                    className="w-24 p-3 rounded-xl border-2 border-stone-200 text-center font-bold focus:border-amber-500 outline-none"
                    value={orderQuantities[todayKey]?.[s.id]?.[p.id] || ''}
                    onChange={(e) => updateQuantity(s.id, p.id, e.target.value)}
                    placeholder="0"
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
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden overflow
