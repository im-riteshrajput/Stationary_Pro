import { getDatabase, ref, set, get, onValue, remove } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-database.js";  // Added 'remove'
import { app } from "./auth.js";
import { UserData } from "./UserDataModule.js";

const userDataobj = new UserData();

const db = getDatabase(app, "https://stationary-management-a0d6f-default-rtdb.asia-southeast1.firebasedatabase.app/");

const ItemSaveBtn = document.getElementById("itemForm");

// Global variables (add these at top)
let currentInventoryData = [];
let currentEditingName = null;

// Simple toast implementation (replace with your library if available, e.g., Toastify)
function showToast(message, type = 'info') {
  // Fallback to alert if no toast library
  const color = type === 'success' ? 'green' : type === 'error' ? 'red' : 'blue';
  alert(`${type.toUpperCase()}: ${message}`);  // Simple alert – replace with real toast

  // Example with real toast (uncomment if you have a library)
  // if (window.Toastify) {
  //     Toastify({
  //         text: message,
  //         duration: 3000,
  //         gravity: "top",
  //         position: "right",
  //         backgroundColor: type === 'success' ? "#4CAF50" : type === 'error' ? "#f44336" : "#2196F3"
  //     }).showToast();
  // }
}

// WHEN SUBMIT OF ADD ITEM BUTTON IS PRESSED
ItemSaveBtn.addEventListener("submit", function (event) {
  event.preventDefault();
  const dbname = document.getElementById("itemName").value;
  const dbcategory = document.getElementById("itemCategory").value;
  const dbquantity = document.getElementById("itemQuantity").value;
  const dbminstock = document.getElementById("itemMinStock").value;
  const dbrow = document.getElementById("itemRow").value;
  const dbcol = document.getElementById("itemColumn").value;

  // Fix: Use global userDataobj, pass params to constructor if needed
  // Assuming UserData constructor takes params – adjust if not
  const tempUserData = new UserData(dbname, dbcategory, dbquantity, dbminstock, dbrow, dbcol);
  tempUserData.sendDatatoDB();
  closeItemModal();  // Assume this function exists
});

// Display Inventory with Search Integrated
async function displayInventory(items) {
  console.log('displayInventory called with:', items ? `${items.length} filtered items` : 'full DB fetch');

  let dataToDisplay = items;

  if (!dataToDisplay || !Array.isArray(dataToDisplay)) {
    try {
      dataToDisplay = await userDataobj.fetchDatafromDB();
      console.log('Fetched full data from DB:', dataToDisplay.length, 'items');
    } catch (error) {
      console.error('DB fetch failed:', error);
      dataToDisplay = [];
    }
  }

  const tbody = document.getElementById('inventoryTableBody');

  if (!tbody) {
    console.error("Table body 'inventoryTableBody' not found! Add <tbody id='inventoryTableBody'></tbody> to your HTML.");
    return;
  }

  console.log('Found tbody – preparing to update with', dataToDisplay.length, 'items');

  if (dataToDisplay.length === 0) {
    const isSearch = items && items.length === 0;
    const message = isSearch
      ? 'No items found matching your search'
      : 'No items found in database';

    tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 2rem;">
                    ${message}
                </td>
            </tr>
        `;
    console.log('Showing empty message:', message);
    return;
  }

  try {
    const tableRows = dataToDisplay.map(item => {
      const statusClass = (typeof getStockStatus === 'function') ? getStockStatus(item) : 'unknown';
      const statusText = (typeof getStatusText === 'function') ? getStatusText(item) : 'Unknown Status';

      if (dataToDisplay.indexOf(item) < 3) {
        console.log(`Row for: ${item.name || 'Unnamed'} (status: ${statusClass})`);
      }

      return `
                <tr>
                    <td>${item.name || 'N/A'}</td>
                    <td>${item.category || 'N/A'}</td>
                    <td>${item.quantity || 0}</td>
                    <td>Row ${item.row || 'N/A'}, Col ${item.column || 'N/A'}</td>
                    <td>
                        <span class="status-badge status-${statusClass}">
                            ${statusText}
                        </span>
                    </td>
                    <td>
                        <div class="actions">
                            <!-- Fix: Remove onclick, add data-name for event delegation -->
                            <button class="btn-icon btn-edit" data-name="${item.name || ''}" title="Edit">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn-icon btn-delete" data-name="${item.name || ''}" title="Delete">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
    }).join('');

    console.log('Generated', dataToDisplay.length, 'rows – updating DOM');
    tbody.innerHTML = tableRows;
    console.log('UI updated successfully!');

  } catch (error) {
    console.error('Error generating table rows:', error);
    tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; color: red; padding: 2rem;">
                    Error loading items: ${error.message}. Please refresh the page.
                </td>
            </tr>
        `;
  }
}

// Function to get CSS class for status badge (e.g., 'out', 'low', 'ok')
function getStockStatus(item) {
  if (item.quantity == 0) {
    return 'out';  // Out of stock
  } else if (item.quantity <= (item.minStock || 0)) {  // Handle minStock
    return 'low';  // Low stock
  } else {
    return 'good';   // In stock
  }
}

// Function to get display text for status badge
function getStatusText(item) {
  if (item.quantity == 0) {
    return 'Out of Stock';  // Out of stock
  } else if (item.quantity <= item.minStock) {
    return 'Low Stock';     // Low stock
  } else {
    return 'In Stock';      // In stock
  }
}

// Global: editItem – uses name as ID/key (module-scoped, but called via delegation)
async function editItem(name) {
  console.log('editItem called for name:', name);

  if (!name) {
    console.error('No name provided to editItem');
    return;
  }

  let data = currentInventoryData;

  if (!data || !Array.isArray(data) || data.length === 0) {
    console.log('Cache empty – fetching for edit...');
    if (typeof userDataobj === 'undefined' || typeof userDataobj.fetchDatafromDB !== 'function') {
      console.error('userDataobj not defined');
      alert('Database not available. Please refresh.');
      return;
    }
    try {
      data = await userDataobj.fetchDatafromDB();
      currentInventoryData = data;
      console.log('Fetched data for edit:', data.length, 'items');
    } catch (error) {
      console.error('Fetch failed for edit:', error);
      alert('Unable to load item data. Please refresh.');
      return;
    }
  }

  const item = data.find(i => i.name === name);

  if (!item) {
    console.error(`Item with name "${name}" not found`);
    const sampleNames = data.map(i => i.name).slice(0, 5);
    console.log('Sample names in data:', sampleNames);
    alert(`Item "${name}" not found. Sample names: ${sampleNames.join(', ')}`);
    return;
  }

  console.log('Item found by name:', item);

  try {
    currentEditingName = name;
    document.getElementById('modalTitle').textContent = 'Edit Item';
    document.getElementById('itemId').value = name;
    document.getElementById('itemName').value = item.name || '';
    document.getElementById('itemName').disabled = true;
    document.getElementById('itemCategory').value = item.category || '';
    document.getElementById('itemQuantity').value = item.quantity || 0;
    document.getElementById('itemMinStock').value = item.minStock || 10;
    document.getElementById('itemRow').value = item.row || '';
    document.getElementById('itemColumn').value = item.column || '';

    const modal = document.getElementById('itemModal');
    if (modal) {
      modal.classList.add('show');
      console.log('Modal shown for item:', item.name);
    } else {
      console.error('#itemModal not found');
      alert('Edit modal not found – check HTML.');
    }
  } catch (error) {
    console.error('Modal population error:', error);
    alert('Error loading item details.');
  }
}

// Updated: saveItem – updates by name
async function saveItem() {
  if (!currentEditingName) {
    alert('No item selected for editing');
    return;
  }

  const formData = {
    name: currentEditingName,
    category: document.getElementById('itemCategory').value || '',
    quantity: Number(document.getElementById('itemQuantity').value) || 0,
    minStock: Number(document.getElementById('itemMinStock').value) || 10,
    row: document.getElementById('itemRow').value || '',
    column: document.getElementById('itemColumn').value || ''
  };

  if (!formData.category) {
    alert('Category is required');
    return;
  }

  try {
    // Update DB (add userDataobj.updateItemByName if not exists)
    if (typeof userDataobj.updateItemByName !== 'function') {
      console.error('updateItemByName not defined – implement it');
      alert('Save function not ready. Check console.');
      return;
    }
    await userDataobj.updateItemByName(currentEditingName, formData);

    // Refresh
    currentInventoryData = await userDataobj.fetchDatafromDB();
    await displayInventory();
    // await displayAlerts();  // If you have it

    document.getElementById('itemModal').classList.remove('show');
    currentEditingName = null;

    alert('Item updated successfully!');
  } catch (error) {
    console.error('Save error:', error);
    alert('Failed to save changes.');
  }
}

// Global: Close modal
function closeItemModal() {  // Renamed from closeModal for consistency
  document.getElementById('itemModal').classList.remove('show');
  currentEditingName = null;
  if (document.getElementById('itemName')) {
    document.getElementById('itemName').disabled = false;
  }
}

// Fix: Event delegation for Edit/Delete buttons (replaces onclick – works with ES modules)
document.addEventListener('click', async (e) => {
  const editButton = e.target.closest('.btn-edit');
  if (editButton) {
    const name = editButton.getAttribute('data-name');
    if (name) {
      e.preventDefault();
      await editItem(name);
    } else {
      console.error('No data-name on edit button');
    }
    return;
  }

  const deleteButton = e.target.closest('.btn-delete');
  if (deleteButton) {
    const name = deleteButton.getAttribute('data-name');
    if (name) {
      e.preventDefault();
      await deleteItem(name);  // Fixed: Uncommented and made async
    } else {
      console.error('No data-name on delete button');
    }
    return;
  }
});

// Search functionality integrated with real-time DB
async function setupSearch() {
  const searchInput = document.getElementById('searchInput');
  const categoryFilter = document.getElementById('categoryFilter');
  const statusFilter = document.getElementById('statusFilter');

  if (!searchInput || !categoryFilter || !statusFilter) {
    console.error('Search elements not found! Check HTML IDs: searchInput, categoryFilter, statusFilter.');
    return;
  }

  // Initial fetch from real-time DB and update global cache
  try {
    currentInventoryData = await userDataobj.fetchDatafromDB();
    console.log('Initial DB fetch successful:', currentInventoryData.length, 'items');

    // Initial display of full data
    displayInventory(currentInventoryData);
  } catch (error) {
    console.error('Failed to fetch initial data from DB:', error);
    currentInventoryData = [];
    displayInventory([]);
  }

  // Debounced search function – now safely uses global currentInventoryData
  function performSearch() {
    if (!currentInventoryData || currentInventoryData.length === undefined) {
      console.warn('Inventory data not loaded yet. Skipping search.');
      return;
    }

    const searchTerm = (searchInput.value || '').toLowerCase().trim();
    const selectedCategory = categoryFilter.value;
    const selectedStatus = statusFilter.value;

    let filteredData = [...currentInventoryData];

    if (searchTerm) {
      filteredData = filteredData.filter(item => {
        const nameMatch = item.name && item.name.toLowerCase().includes(searchTerm);
        const categoryMatch = item.category && item.category.toLowerCase().includes(searchTerm);
        return nameMatch || categoryMatch;
      });
    }

    if (selectedCategory && selectedCategory !== '') {
      filteredData = filteredData.filter(item => item.category === selectedCategory);
    }

    if (selectedStatus && selectedStatus !== '') {
      filteredData = filteredData.filter(item => {
        if (typeof getStockStatus !== 'function') {
          console.error('getStockStatus function not defined! Skipping status filter.');
          return true;
        }
        return getStockStatus(item) === selectedStatus;
      });
    }

    displayInventory(filteredData);
    console.log(`Search filtered to ${filteredData.length} items (term: "${searchTerm}", category: "${selectedCategory}", status: "${selectedStatus}")`);
  }

  // Debounce wrapper for performSearch
  const debouncedSearch = debounce(performSearch, 300);

  // Event listeners
  searchInput.addEventListener('input', debouncedSearch);
  categoryFilter.addEventListener('change', debouncedSearch);
  statusFilter.addEventListener('change', debouncedSearch);
}

// Utility: Debounce
function debounce(func, delay) {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
}

// Implemented: Fixed deleteItem – with verification to confirm actual delete
async function deleteItem(name) {
  console.log('deleteItem called for name:', name);

  if (!name) {
    console.error('No name provided to deleteItem');
    showToast('Invalid item name', 'error');
    return;
  }

  if (!confirm('Are you sure you want to delete this item?')) {
    console.log('Delete cancelled by user');
    return;
  }

  // Configurable DB path root (adjust if your items are under 'items', 'stationary', etc.)
  const DB_PATH = 'Inventory_Items';  // Change to your actual root (e.g., 'items' or 'stationary/items')

  try {
    // Build and log the exact ref path
    const deleteRef = ref(db, `${DB_PATH}/${name}`);  // e.g., 'inventory/Widget A'
    console.log('Attempting delete from path:', deleteRef.toString());  // Full URL for debugging

    // Perform delete
    await remove(deleteRef);
    console.log('Remove operation completed without error for:', name);

    // Verification: Re-fetch and check if item is gone (key step!)
    console.log('Verifying delete...');
    const updatedData = await userDataobj.fetchDatafromDB();
    const itemStillExists = updatedData.find(i => i.name === name);
    if (itemStillExists) {
      console.error('DELETE FAILED: Item still exists after remove!');
      console.log('Still exists item:', itemStillExists);
      throw new Error(`Item "${name}" not deleted – check path "${DB_PATH}/${name}", rules, or auth. Still in data: ${JSON.stringify(itemStillExists)}`);
    }
    console.log('Verification success: Item confirmed removed from DB');

    // Update cache and UI
    currentInventoryData = updatedData;
    console.log('Cache updated after delete:', currentInventoryData.length, 'items');

    await displayInventory();  // Re-render table
    // await displayAlerts();  // If you have alerts

    showToast('Item deleted successfully', 'success');
    console.log('Full delete process complete for:', name);

  } catch (error) {
    console.error('Delete failed – full details:');
    console.error('Error object:', error);
    console.error('Error code:', error.code || 'N/A');  // e.g., 'PERMISSION_DENIED'
    console.error('Error message:', error.message);
    showToast('Failed to delete: ' + (error.message || 'Unknown error'), 'error');
  }
}

// Initialize inventory page
document.addEventListener('DOMContentLoaded', async function () {
  // if (!checkAuth()) return;
  
  // Show the loader at the start (assuming your loader has id='loader' and is initially hidden)
  const loader = document.getElementById('loader');
  if (loader) loader.style.display = 'flex';
  
  displayInventory();
  await setupSearch();
  
  // Hide the loader after data loading is complete (success or error)
  if (loader) loader.style.display = 'none';

  // Handle URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('action') === 'add') {
    showAddItemModal();  // Assume this
  }
});


// Initialize inventory page
// document.addEventListener('DOMContentLoaded', async function () {
//   // if (!checkAuth()) return;
//   displayInventory();
//   await setupSearch();

//   // Handle URL parameters
//   const urlParams = new URLSearchParams(window.location.search);
//   if (urlParams.get('action') === 'add') {
//     showAddItemModal();  // Assume this
//   }
// }
// );


// Global cache for inventory data (updated from real-time DB)
// let currentInventoryData = [];

// // Optional: Real-time listener setup (uncomment/adapt for Firebase Realtime DB)
// function setupRealTimeListener() {
//     // Assuming Firebase Realtime Database – replace with your DB path and userData method
//     // if (userData && userData.dbRef) {  // e.g., userData.dbRef = firebase.database().ref('inventory');
//     //     userData.dbRef.on('value', (snapshot) => {
//     //         const data = snapshot.val() ? Object.values(snapshot.val()) : [];  // Convert snapshot to array
//     //         currentInventoryData = data;  // Update cache
//     //         console.log('Real-time data updated:', data.length, 'items');
//     //
//     //         // Re-display or re-filter if search is active
//     //         const searchInput = document.getElementById('searchInput');
//     //         if (searchInput.value || /* other filters */) {
//     //             performSearch();  // Re-run search with new data
//     //         } else {
//     //             displayInventory(currentInventoryData);  // Full refresh
//     //         }
//     //     }, (error) => {
//     //         console.error('Real-time listener error:', error);
//     //     });
//     // }
//     // To stop listener (e.g., on logout): userData.dbRef.off();
// }




// Display inventory items
// function displayInventory(items = null) {
//     const data = items || JSON.parse(localStorage.getItem('inventoryData')) || [];
//     const tbody = document.getElementById('inventoryTableBody');

//     if (data.length === 0) {
//         tbody.innerHTML = `
//             <tr>
//                 <td colspan="6" style="text-align: center; padding: 2rem;">
//                     No items found
//                 </td>
//             </tr>
//         `;
//         return;
//     }

//     tbody.innerHTML = data.map(item => `
//         <tr>
//             <td>${item.name}</td>
//             <td>${item.category}</td>
//             <td>${item.quantity}</td>
//             <td>Row ${item.row}, Column ${item.column}</td>
//             <td>
//                 <span class="status-badge status-${getStockStatus(item)}">
//                     ${getStatusText(item)}
//                 </span>
//             </td>
//             <td>
//                 <div class="actions">
//                     <button class="btn-icon btn-edit" onclick="editItem(${item.id})" title="Edit">
//                         <i class="fas fa-edit"></i>
//                     </button>
//                     <button class="btn-icon btn-delete" onclick="deleteItem(${item.id})" title="Delete">
//                         <i class="fas fa-trash"></i>
//                     </button>
//                 </div>
//             </td>
//         </tr>
//     `).join('');
// }



// Updated: Async editItem with DB integration (cache-first)
// Global variables (at top of file)


// Global: Close modal
// function closeModal() {
//     document.getElementById('itemModal').classList.remove('show');
//     currentEditingName = null;
//     document.getElementById('itemName').disabled = false;  // Re-enable if needed
// }



// Edit item
// function editItem(id) {
//     const data = JSON.parse(localStorage.getItem('inventoryData')) || [];
//     const item = data.find(i => i.id === id);

//     if (!item) return;

//     currentEditingId = id;
//     document.getElementById('modalTitle').textContent = 'Edit Item';
//     document.getElementById('itemId').value = item.id;
//     document.getElementById('itemName').value = item.name;
//     document.getElementById('itemCategory').value = item.category;
//     document.getElementById('itemQuantity').value = item.quantity;
//     document.getElementById('itemMinStock').value = item.minStock;
//     document.getElementById('itemRow').value = item.row;
//     document.getElementById('itemColumn').value = item.column;

//     document.getElementById('itemModal').classList.add('show');
// }




// Handle form submission
// document.getElementById('itemForm').addEventListener('submit', function (e) {
//     e.preventDefault();

//     const formData = new FormData(this);
//     const itemData = {
//         id: currentEditingId || Date.now(),
//         name: formData.get('name'),
//         category: formData.get('category'),
//         quantity: parseInt(formData.get('quantity')),
//         minStock: parseInt(formData.get('minStock')),
//         row: formData.get('row').toUpperCase(),
//         column: formData.get('column').toUpperCase(),
//         price: Math.random() * 10 + 1 // Random price for demo
//     };

//     let data = JSON.parse(localStorage.getItem('inventoryData')) || [];

//     // if (currentEditingId) {
//     //     // Update existing item
//     //     const index = data.findIndex(item => item.id === currentEditingId);
//     //     if (index !== -1) {
//     //         data[index] = { ...data[index], ...itemData };
//     //         showToast('Item updated successfully', 'success');
//     //     }
//     // } else {
//     //     // Add new item
//     //     data.push(itemData);
//     //     showToast('Item added successfully', 'success');
//     // }

//     localStorage.setItem('inventoryData', JSON.stringify(data));
//     displayInventory();
//     closeItemModal();
// });






