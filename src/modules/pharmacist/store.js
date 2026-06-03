import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const usePharmacyStore = create(
  persist(
    (set, get) => ({
      // --- INVENTORY ---
      inventory: [],
      
      fetchInventory: async () => {
        try {
          const res = await fetch('http://localhost:3000/api/medicines', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
          });
          const data = await res.json();
          if (data.medicines) {
            set({ inventory: data.medicines });
          }
        } catch (error) {
          console.error("Failed to fetch inventory", error);
        }
      },

      // --- PATIENTS & PRESCRIPTIONS ---
      // Mocking a connected database of patients
      // --- PATIENTS & PRESCRIPTIONS ---
      // We will rely on searching for users instead of a hardcoded list
      patients: [],

      // --- ACTIVE SESSION ---
      currentPatient: null,
      transactions: [],

      // --- ACTIONS ---
      setPatient: (patientData) => {
        // We now receive the patient object directly from API instead of an ID lookup
        set({ currentPatient: patientData || null });
      },

      clearSession: () => set({ currentPatient: null }),

      // Sell Item (OTC or Prescribed)
      // returns { success: boolean, message: string }
      dispenseItem: (medicineId, quantity, prescriptionId = null) => {
        const { inventory, transactions, currentPatient, patients } = get();
        const medIndex = inventory.findIndex(m => m.id === medicineId);

        if (medIndex === -1) return { success: false, message: 'Medicine not found' };
        
        const med = inventory[medIndex];
        if (med.stock < quantity) return { success: false, message: `Insufficient stock. Only ${med.stock} left.` };

        // 1. Update Inventory
        const updatedInventory = [...inventory];
        updatedInventory[medIndex] = { ...med, stock: med.stock - quantity };

        // 2. Update Prescription (if applicable)
        let updatedCurrentPatient = { ...currentPatient };

        if (prescriptionId && currentPatient && currentPatient.prescriptions) {
          const pat = { ...currentPatient };
          const rxIndex = pat.prescriptions.findIndex(rx => rx.id === prescriptionId);
          
          if (rxIndex !== -1) {
             const rx = { ...pat.prescriptions[rxIndex] };
             const medRxIndex = rx.medicines.findIndex(m => m.medicineId === medicineId);

             if (medRxIndex !== -1) {
                const medRx = { ...rx.medicines[medRxIndex] };
                
                // STRICT CHECK: Cannot exceed max
                if (medRx.dispensed + quantity > medRx.maxQty) {
                    return { success: false, message: `Cannot dispense more than prescribed limit of ${medRx.maxQty}` };
                }

                medRx.dispensed += quantity;
                rx.medicines[medRxIndex] = medRx;
                
                // Check if Prescription is fully filled
                const allFilled = rx.medicines.every(m => m.dispensed >= m.maxQty);
                if (allFilled) rx.status = 'completed';

                pat.prescriptions[rxIndex] = rx;
                updatedCurrentPatient = pat; 
             }
          }
        }

        // 3. Add to History
        const transaction = {
          id: `txn_${Date.now()}`,
          date: new Date().toLocaleDateString(),
          time: new Date().toLocaleTimeString(),
          patientName: currentPatient ? currentPatient.name : 'Walk-in',
          medicineName: med.name,
          quantity: quantity,
          totalPrice: med.price * quantity,
          type: prescriptionId ? 'Prescription' : 'OTC'
        };

        set({
          inventory: updatedInventory,
          currentPatient: updatedCurrentPatient,
          transactions: [transaction, ...transactions]
        });

        return { success: true, message: 'Dispensed successfully' };
      }
    }),
    {
      name: 'pharmacy-storage', // localstorage key
    }
  )
);
