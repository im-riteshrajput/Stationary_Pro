const eplogin = document.getElementById("submit");
eplogin.addEventListener("click" , function(){
    console.log(username.value);
    console.log(password.value);
    
})

function displayValue() {
            // Get the value from the text field
            const inputValue = document.getElementById('myTextField').value;
            
            // Display it in the console
            console.log('Entered value:', inputValue);
            
            // Optional: Also display it on the page for visibility
            document.getElementById('output').innerHTML = 'Console output: ' + inputValue;
        }


        import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';  // For CDN; use npm imports if applicable
import { getDatabase, ref, get } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js';

const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  databaseURL: "https://your-project-default-rtdb.firebaseio.com/",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Fetch and map items from Firebase
async function fetchInventoryFromFirebase() {
  try {
    const snapshot = await get(ref(db, 'items'));  // Adjust path if needed (e.g., 'inventory')
    
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
        quantity: rawItem.ItemQuantity || 0,
        minStock: rawItem.ItemMinStock || 0,
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

// Display fetched items in table format (dynamic rows based on record count)
async function displayItemsInTable() {
  const items = await fetchInventoryFromFirebase();
  const tbody = document.getElementById('itemsTableBody');  // Your <tbody id="itemsTableBody">

  if (!tbody) {
    console.error("Table body not found! Add <tbody id='itemsTableBody'></tbody> to your HTML.");
    return;
  }

  if (items.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" style="text-align: center; padding: 2rem;">
          No items found in database
        </td>
      </tr>
    `;
    return;
  }

  // Generate table rows (one per record)
  const tableRows = items.map(item => {
    const statusClass = item.quantity <= item.minStock ? 'low' : 'ok';
    const statusText = item.quantity <= item.minStock ? 'Low Stock' : 'In Stock';
    
    return `
      <tr>
        <td>${item.id}</td>
        <td>${item.name}</td>
        <td>${item.category}</td>
        <td>${item.quantity}</td>
        <td>${item.minStock}</td>
        <td>Row ${item.row}, Col ${item.column}</td>
        <td>
          <span class="status-badge status-${statusClass}">
            ${statusText}
          </span>
        </td>
        <td>
          <div class="actions">
            <button class="btn-icon btn-edit" onclick="editItem('${item.id}')" title="Edit">
              <i class="fas fa-edit"></i>
            </button>
            <button class="btn-icon btn-delete" onclick="deleteItem('${item.id}')" title="Delete">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  tbody.innerHTML = tableRows;
}

// Placeholder functions for actions (implement as needed)
function editItem(id) {
  alert(`Edit item ${id}`);  // Replace with your edit logic
}

function deleteItem(id) {
  if (confirm(`Delete item ${id}?`)) {
    // Add Firebase delete: import { remove } from 'firebase/database'; remove(ref(db, 'items/' + id));
    alert(`Deleted item ${id}`);
    displayItemsInTable();  // Refresh table
  }
}
