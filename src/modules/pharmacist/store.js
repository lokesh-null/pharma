import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const usePharmacyStore = create(
  persist(
    (set, get) => ({
      // --- INVENTORY ---
      inventory: [
        { id: 'm1', name: 'Paracetamol 500mg', stock: 120, price: 2, threshold: 50, category: 'Pain Relief' },
        { id: 'm2', name: 'Dolo 650', stock: 45, price: 3, threshold: 50, category: 'Fever' }, // Low stock
        { id: 'm3', name: 'Augmentin 625', stock: 15, price: 22, threshold: 20, category: 'Antibiotic' }, // Low stock
        { id: 'm4', name: 'Cetirizine 10mg', stock: 200, price: 5, threshold: 30, category: 'Allergy' },
        { id: 'm5', name: 'Pantop 40', stock: 80, price: 12, threshold: 40, category: 'Gastritis' },
        { id: 'm6', name: 'Azithromycin 500', stock: 12, price: 18, threshold: 15, category: 'Antibiotic' },
        { id: 'm7', name: 'Cough Syrup 100ml', stock: 5, price: 95, threshold: 10, category: 'Syrup' }, // Critical
      ],

      // --- PATIENTS & PRESCRIPTIONS ---
      // Mocking a connected database of patients
      patients: [
        {
          id: 'p1',
          name: 'Harish Kumar',
          age: 45,
          gender: 'Male',
          phone: '9876543210',
          prescriptions: [
            {
              id: 'rx_001',
              doctor: 'Dr. A. Sharma',
              date: '2025-01-29', // Today
              status: 'pending',
              medicines: [
                { medicineId: 'm3', name: 'Augmentin 625', dosage: '1-0-1', days: 5, maxQty: 10, dispensed: 0 },
                { medicineId: 'm2', name: 'Dolo 650', dosage: '1-0-1', days: 3, maxQty: 6, dispensed: 0 }
              ]
            }
          ]
        },
        {
          id: 'p2',
          name: 'Priya Singh',
          age: 28,
          gender: 'Female',
          phone: '9876541122',
          prescriptions: []
        }
      ],

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
        let updatedPatients = [...patients];
        let updatedCurrentPatient = { ...currentPatient };

        if (prescriptionId && currentPatient) {
          const pIndex = patients.findIndex(p => p.id === currentPatient.id);
          const pat = { ...patients[pIndex] };
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
                updatedPatients[pIndex] = pat;
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
          patients: updatedPatients,
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
