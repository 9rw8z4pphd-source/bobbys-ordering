import React, { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue, set } from "firebase/database";
import { Package, Plus, Trash2, CheckCircle, Loader2, ClipboardList } from 'lucide-react';

// Your specific Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDL7h0nWWE4YV_IMXO7_gupvf1QUZamHGU",
  authDomain: "bobbys-cafe.firebaseapp.com",
  databaseURL: "https://bobbys-cafe-default-rtdb.firebaseio.com",
  projectId: "bobbys-cafe",
  storageBucket: "bobbys-cafe.firebasestorage.app",
  messagingSenderId: "605393276080",
  appId: "1:605393276080:web:e62049aadf7940b5b23f75"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const App = () => {
  const [view, setView] = useState('supervisor');
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Sync data from Firebase
  useEffect(() => {
    const dataRef = ref(db, 'cafe_data');
    const unsubscribe = onValue(dataRef, (snapshot) => {
      const data = snapshot.val();
      if (data && data.suppliers) {
        setSuppliers(data.suppliers);
      } else {
        setSuppliers([]);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Update Firebase
  const updateDb = (newList) => {
    set(ref(db, 'cafe_data'), { suppliers: newList });
  };

  const addSupplier = () => {
    const name = prompt("Enter Supplier Name:");
    if (name) {
      const newList = [...suppliers, { id: Date.now(), name: name }];
      updateDb(newList);
    }
  };

  const deleteSupplier = (id) => {
    if (window.confirm("Delete this supplier?")) {
      const newList = suppliers.filter(s => s.id !== id);
      updateDb(newList);
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-stone-50 text-amber-900 font-bold">
        <Loader2 className="animate-spin mr-2" /> Connecting to Bobby's Database...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-100 font-sans">
      <nav className="bg-amber-900 text-white p-4 shadow-lg flex justify-between items-center">
        <h1 className="text-xl font-bold flex items-center gap-2 tracking-tight">
          <Package className="text-amber-400" /> Bobby's Cafe
        </h1>
        <div className="flex gap-2 bg-amber-800 p-1 rounded-lg text-xs font-bold">
          <button 
            onClick={() => setView('supervisor')} 
            className={`px-4 py-2 rounded-md transition-all ${view === 'supervisor' ? 'bg-white text-amber-900 shadow' : 'text-amber-200'}`}
          >
            ORDERS
          </button>
          <button 
            onClick={() => setView('admin')} 
            className={`px-4 py-2 rounded-md transition-all ${view === 'admin' ? 'bg-white text-amber-900 shadow' : 'text-amber-200'}`}
          >
            ADMIN
          </button>
        </div>
      </nav>

      <div className="max-w-md mx-auto p-6">
        {view === 'supervisor' ? (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-2xl font-black text-stone-800 flex items-center gap-2 underline decoration-amber-500 decoration-4 underline-offset-4">
              <ClipboardList /> Daily List
            </h2>
            {suppliers.length === 0 ? (
              <div className="bg-amber-50 border-2 border-dashed border-amber-200 rounded-2xl p-8 text-center text-amber-700">
                <p className="italic">No suppliers added yet.</p>
                <p className="text-sm">Go to Admin to add your first one!</p>
              </div>
            ) : (
              suppliers.map(s => (
                <div key={s.id} className="bg-white p-5 rounded-2xl shadow-sm border-l-8 border-amber-600 flex justify-between items-center hover:shadow-md transition-shadow">
                  <span className="font-bold text-lg text-stone-700">{s.name}</span>
                  <button className="text-stone-300 hover:text-green-500 transition-colors transform active:scale-90">
                    <CheckCircle size={32} />
                  </button>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-black text-stone-800">Settings</h2>
              <button 
                onClick={addSupplier} 
                className="bg-amber-600 text-white p-3 rounded-full shadow-lg hover:bg-amber-700 hover:scale-105 active:scale-95 transition-all"
              >
                <Plus size={24} />
              </button>
            </div>
            <div className="grid gap-3">
              {suppliers.map(s => (
                <div key={s.id} className="bg-white p-4 rounded-xl shadow-sm flex justify-between items-center border border-stone-200">
                  <span className="font-bold text-stone-700">{s.name}</span>
                  <button 
                    onClick={() => deleteSupplier(s.id)} 
                    className="bg-red-50 p-2 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-100 transition-all"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
