// import { getDatabase, ref, get } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-database.js";
// import { app , signOutfunc} from "./auth.js";
// import { UserData } from "./UserDataModule.js";


// const db = getDatabase(app, "https://stationary-management-a0d6f-default-rtdb.asia-southeast1.firebasedatabase.app/");
// const userData = new UserData();

// const eplogout = document.getElementById("logout");
// if (eplogout) {
//     eplogout.addEventListener('click', () => {
//         signOutfunc();
//     });
// }

// // Update dashboard statistics
// async function updateStats() {
//     const InvData = await userData.calculateInventoryStats();
//     const test = InvData.lsc;

//     const totalItemsEl = document.getElementById('totalItems');
//     const lowStockEl = document.getElementById('lowStockItems');
//     const outOfStockEl = document.getElementById('outOfStockItems');
//     const totalCategoriesEl = document.getElementById('totalCategories');


//     if (totalItemsEl) totalItemsEl.textContent = InvData.totalItems;
//     if (lowStockEl) lowStockEl.textContent = InvData.lsc;
//     if (outOfStockEl) outOfStockEl.textContent = InvData.oosc;
//     if (totalCategoriesEl) totalCategoriesEl.textContent = InvData.totalCategories;

// }


// // Display low stock items
// async function displayLowStockItems() {
//     const fd = await userData.fetchDatafromDB();

//     const lowStockItems = fd.filter(item => item.quantity < item.minStock).slice(0, 5);


//     if (lowStockItems.length === 0) {
//         container.innerHTML = '<p class="text-center text-gray-500">No low stock items</p>';
//         return;
//     }

//     // console.log('Low stock items in alert:', lowStockItems);  // Enhanced logging for debugging

//     // Safety check: Ensure lowStockItems is an array
//     if (!Array.isArray(lowStockItems) || lowStockItems.length === 0) {
//         console.warn('No low stock items to display');
//         const container = document.getElementById('lowStockList');
//         if (container) {
//             container.innerHTML = '<p class="text-center text-gray-500">No low stock items</p>';
//         }
//         return;
//     }

//     const container = document.getElementById('lowStockList');
//     if (!container) {
//         console.error("Container 'lowStockList' not found! Add <div id='lowStockList'></div> to your HTML.");
//         return;
//     }

//     // Inline status class logic (no external function needed)
//     // For low-stock items, it's always 'low', but you can expand this if needed
//     const getStatusClass = (item) => {
//         if (item.quantity === 0) {
//             return 'out';  // Red if zero
//         } else if (item.quantity < (item.minStock || 10)) {  // Use minStock if available, else default threshold
//             return 'low';           // Yellow warning
//         } else {
//             return 'in-stock';      // Green (unlikely for low-stock, but complete)
//         }
//     };

//     // Generate HTML with inline status
//     container.innerHTML = lowStockItems.map(item => {
//         const statusClass = getStatusClass(item);  // Inline call – no global dependency

//         return `
//             <div class="item-row">
//                 <div class="item-info">
//                     <h4>${item.name || 'Unnamed Item'}</h4>
//                     <p>${item.category || 'Uncategorized'} • Row ${item.row || 'N/A'}, Column ${item.column || 'N/A'}</p>
//                 </div>
//                 <div class="status-badge status-${statusClass}">
//                     ${item.quantity || 0} left
//                 </div>
//             </div>
//         `;
//     }).join('');
// }





// // Initialize dashboard
// document.addEventListener('DOMContentLoaded', function () {
//     updateStats();
//     displayLowStockItems();

//     // Refresh data every 30 seconds
//     setInterval(() => {
//         // displayLowStockItems();
//     }, 30000);
// });

import { getDatabase, ref, get } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-database.js";
import { app, signOutfunc } from "./auth.js";
import { UserData } from "./UserDataModule.js";

const db = getDatabase(app, "https://stationary-management-a0d6f-default-rtdb.asia-southeast1.firebasedatabase.app/");
const userData = new UserData();

const eplogout = document.getElementById("logout");
if (eplogout) {
    eplogout.addEventListener('click', () => {
        signOutfunc();
    });
}

// Update dashboard statistics
async function updateStats() {
    const InvData = await userData.calculateInventoryStats();
    const test = InvData.lsc;

    const totalItemsEl = document.getElementById('totalItems');
    const lowStockEl = document.getElementById('lowStockItems');
    const outOfStockEl = document.getElementById('outOfStockItems');
    const totalCategoriesEl = document.getElementById('totalCategories');

    if (totalItemsEl) totalItemsEl.textContent = InvData.totalItems;
    if (lowStockEl) lowStockEl.textContent = InvData.lsc;
    if (outOfStockEl) outOfStockEl.textContent = InvData.oosc;
    if (totalCategoriesEl) totalCategoriesEl.textContent = InvData.totalCategories;
}

// Display low stock items
async function displayLowStockItems() {
    const fd = await userData.fetchDatafromDB();

    const lowStockItems = fd.filter(item => item.quantity < item.minStock).slice(0, 5);

    if (lowStockItems.length === 0) {
        const container = document.getElementById('lowStockList');
        if (container) {
            container.innerHTML = '<p class="text-center text-gray-500">No low stock items</p>';
        }
        return;
    }

    // console.log('Low stock items in alert:', lowStockItems);  // Enhanced logging for debugging

    // Safety check: Ensure lowStockItems is an array
    if (!Array.isArray(lowStockItems) || lowStockItems.length === 0) {
        console.warn('No low stock items to display');
        const container = document.getElementById('lowStockList');
        if (container) {
            container.innerHTML = '<p class="text-center text-gray-500">No low stock items</p>';
        }
        return;
    }

    const container = document.getElementById('lowStockList');
    if (!container) {
        console.error("Container 'lowStockList' not found! Add <div id='lowStockList'></div> to your HTML.");
        return;
    }

    // Inline status class logic (no external function needed)
    // For low-stock items, it's always 'low', but you can expand this if needed
    const getStatusClass = (item) => {
        if (item.quantity === 0) {
            return 'out';  // Red if zero
        } else if (item.quantity < (item.minStock || 10)) {  // Use minStock if available, else default threshold
            return 'low';           // Yellow warning
        } else {
            return 'in-stock';      // Green (unlikely for low-stock, but complete)
        }
    };

    // Generate HTML with inline status
    container.innerHTML = lowStockItems.map(item => {
        const statusClass = getStatusClass(item);  // Inline call – no global dependency

        return `
            <div class="item-row">
                <div class="item-info">
                    <h4>${item.name || 'Unnamed Item'}</h4>
                    <p>${item.category || 'Uncategorized'} • Row ${item.row || 'N/A'}, Column ${item.column || 'N/A'}</p>
                </div>
                <div class="status-badge status-${statusClass}">
                    ${item.quantity || 0} left
                </div>
            </div>
        `;
    }).join('');
}

// Initialize dashboard
document.addEventListener('DOMContentLoaded', async function () {
    // Assuming you have a loader element in your HTML, e.g., <div id="loader" class="loader">Loading...</div>
    // You can style it with CSS to show a spinner or text.
    const loader = document.getElementById('loader');
    if (loader) {
        loader.style.display = 'block'; // Show loader
    }

    try {
        // Wait for both async functions to complete
        await Promise.all([updateStats(), displayLowStockItems()]);
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        // Optionally, show an error message in the UI
    } finally {
        // Hide loader after data is loaded (or if there's an error)
        if (loader) {
            loader.style.display = 'none';
        }
    }

    // Refresh data every 30 seconds (uncommented and moved here to run after initial load)
    setInterval(async () => {
        try {
            await Promise.all([updateStats(), displayLowStockItems()]);
        } catch (error) {
            console.error('Error refreshing dashboard data:', error);
        }
    }, 30000);
});
