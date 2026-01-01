import { getDatabase, ref, set, get, onValue } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-database.js";
import { app } from "./auth.js";

const db = getDatabase(app, "https://stationary-management-a0d6f-default-rtdb.asia-southeast1.firebasedatabase.app/");


class UserData {

    constructor(name, category, quantity, minStock, row, column) {
        this.name = name;
        this.category = category;
        this.quantity = quantity;
        this.minstock = minStock;
        this.row = row;
        this.col = column;
    }

    // DATABASE QUERY FOR INSERTING ITEMS DETAILS
    sendDatatoDB() {
        set(ref(db, 'Inventory_Items/' + this.name), {
            ItemName: this.name,
            ItemCategory: this.category,
            ItemQuantity: this.quantity,
            ItemMinStock: this.minstock,
            ItemRow: this.row,
            ItemCol: this.col,
        }).then(() => {
            alert("DATA SAVED SUCCESSFULLY");
        })
    }

     // DATABASE QUERY FOR FETCH ITEMS DETAILS WITH ERROR HANDLING
    async fetchDatafromDB() {
        const snapshot = await get(ref(db, 'Inventory_Items'));
        try {
            if (!snapshot.exists()) {
                return [];
            }


            const allItems = snapshot.val();
            const mappedItems = [];

            Object.keys(allItems).forEach((itemId) => {
                const rawItem = allItems[itemId];
                mappedItems.push({
                    id: itemId,
                    name: rawItem.ItemName || 'N/A',
                    category: rawItem.ItemCategory || 'N/A',
                    quantity: Number(rawItem.ItemQuantity) || 0,
                    minStock: Number(rawItem.ItemMinStock) || 0,
                    row: rawItem.ItemRow || 0,
                    column: rawItem.ItemCol || 0
                });
            });

            return mappedItems;
        } catch (error) {
            console.error("Error fetching from Firebase: ", error);
            return [];
        }

    }



    // Function to calculate inventory stats
    async calculateInventoryStats() {
        const snapshot = await get(ref(db, 'Inventory_Items'));
        if (snapshot.exists()) {
            const allItems = snapshot.val();

            let totalItems = 1;
            let outOfStockCount = 0;
            let lowStockCount = 0;
            const categories = new Set();  // For unique categories

            if (allItems && typeof allItems === 'object') {
                const items = Object.values(allItems);
                totalItems = items.length;

                items.forEach(item => {
                    const quantity = item.ItemQuantity || 0;
                    const minStock1 = item.ItemMinStock || 0;
                    const category = item.ItemCategory || 'Uncategorized';


                    if (quantity == 0) {
                        outOfStockCount++;
                    } else if (quantity <= minStock1) {
                        lowStockCount++;
                    }

                    categories.add(category);
                });
            }

            const totalCategories = categories.size;
            // console.log('Calculated stats:', { totalItems, lowStockCount, outOfStockCount, totalCategories });  // Debug log

            const lsc = lowStockCount.toString();
            const oosc = outOfStockCount.toString();

            return {
                totalItems,
                lsc,
                oosc,
                totalCategories
            };
        }
    };


// async displayLowStockItems() {
//     const fd = await userData.fetchDatafromDB();

//      const lowStockItems = fd.filter(item => item.quantity < item.minStock).slice(0, 5);
//      console.log(lowStockItems);
     
//     const container = document.getElementById('lowStockList');

//     if (lowStockItems.length === 0) {
//         container.innerHTML = '<p class="text-center text-gray-500">No low stock items</p>';
//         return;
//     }

//     container.innerHTML = lowStockItems.map(item => `
//         <div class="item-row">
//             <div class="item-info">
//                 <h4>${item.name}</h4>
//                 <p>${item.category} • Row ${item.row}, Column ${item.column}</p>
//             </div>
//             <div class="status-badge status-${getStockStatus(item)}">
//                 ${item.quantity} left
//             </div>
//         </div>
//     `).join('');
// }


}

export { UserData }

// const snapshot = await get(ref(db, 'Inventory_Items'));
//     const allItems = snapshot.val();
//     const cou = Object.keys(allItems).length;
//     console.log(cou);