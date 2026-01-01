let selectedReceiptItems = [];
let reorderItems = [];
let currentReceiptType = 'customer';


// Switch between tabs
function switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`[onclick="switchTab('${tabName}')"]`).classList.add('active');
    
    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    document.getElementById(`${tabName}Tab`).classList.add('active');
    
    if (tabName === 'history') {
        loadReceiptHistory();
    }
}

// Show customer receipt modal
function showCustomerReceiptModal() {
    currentReceiptType = 'customer';
    selectedReceiptItems = [];
    document.getElementById('customerName').value = '';
    document.getElementById('itemSearchInput').value = '';
    
    loadAvailableItems();
    updateSelectedItemsList();
    updateReceiptTotal();
    
    document.getElementById('customerReceiptModal').classList.add('show');
}

// Close customer receipt modal
function closeCustomerReceiptModal() {
    document.getElementById('customerReceiptModal').classList.remove('show');
}

// Show reorder receipt modal
function showReorderReceiptModal() {
    currentReceiptType = 'reorder';
    reorderItems = JSON.parse(localStorage.getItem('reorderList')) || [];
    
    updateReorderItemsList();
    updateReorderTotal();
    
    document.getElementById('reorderReceiptModal').classList.add('show');
}

// Close reorder receipt modal
function closeReorderReceiptModal() {
    document.getElementById('reorderReceiptModal').classList.remove('show');
}

// Load available items for customer receipt
function loadAvailableItems() {
    const data = JSON.parse(localStorage.getItem('inventoryData')) || [];
    const availableItems = data.filter(item => item.quantity > 0);
    const searchTerm = document.getElementById('itemSearchInput').value.toLowerCase();
    
    const filteredItems = searchTerm 
        ? availableItems.filter(item => 
            item.name.toLowerCase().includes(searchTerm) ||
            item.category.toLowerCase().includes(searchTerm)
          )
        : availableItems;
    
    const container = document.getElementById('availableItems');
    
    if (filteredItems.length === 0) {
        container.innerHTML = '<p class="empty-message">No available items found</p>';
        return;
    }
    
    container.innerHTML = filteredItems.map(item => `
        <div class="available-item" onclick="addItemToReceipt(${item.id})">
            <div class="item-info">
                <h4>${item.name}</h4>
                <p>${item.category} • ${item.quantity} available</p>
                <p class="item-price">$${item.price.toFixed(2)} each</p>
            </div>
            <button class="add-item-btn">
                <i class="fas fa-plus"></i>
            </button>
        </div>
    `).join('');
}

// Add item to customer receipt
function addItemToReceipt(itemId) {
    const data = JSON.parse(localStorage.getItem('inventoryData')) || [];
    const item = data.find(i => i.id === itemId);
    
    if (!item || item.quantity === 0) return;
    
    const existingIndex = selectedReceiptItems.findIndex(i => i.id === itemId);
    
    if (existingIndex !== -1) {
        // Increase quantity if not exceeding available stock
        if (selectedReceiptItems[existingIndex].quantity < item.quantity) {
            selectedReceiptItems[existingIndex].quantity++;
        } else {
            showToast(`Cannot add more than ${item.quantity} items`, 'warning');
            return;
        }
    } else {
        // Add new item
        selectedReceiptItems.push({
            id: itemId,
            name: item.name,
            category: item.category,
            price: item.price,
            quantity: 1,
            available: item.quantity
        });
    }
    
    updateSelectedItemsList();
    updateReceiptTotal();
}

// Remove item from customer receipt
function removeItemFromReceipt(itemId) {
    selectedReceiptItems = selectedReceiptItems.filter(item => item.id !== itemId);
    updateSelectedItemsList();
    updateReceiptTotal();
}

// Update quantity in customer receipt
function updateReceiptItemQuantity(itemId, newQuantity) {
    const item = selectedReceiptItems.find(i => i.id === itemId);
    if (!item) return;
    
    if (newQuantity <= 0) {
        removeItemFromReceipt(itemId);
        return;
    }
    
    if (newQuantity > item.available) {
        showToast(`Cannot exceed available quantity of ${item.available}`, 'warning');
        return;
    }
    
    item.quantity = parseInt(newQuantity);
    updateSelectedItemsList();
    updateReceiptTotal();
}

// Update selected items list
function updateSelectedItemsList() {
    const container = document.getElementById('selectedItems');
    
    if (selectedReceiptItems.length === 0) {
        container.innerHTML = '<p class="empty-message">No items selected</p>';
        return;
    }
    
    container.innerHTML = selectedReceiptItems.map(item => `
        <div class="selected-item">
            <div class="item-details">
                <h4>${item.name}</h4>
                <p>${item.category} • $${item.price.toFixed(2)} each</p>
            </div>
            <div class="quantity-controls">
                <button class="qty-btn" onclick="updateReceiptItemQuantity(${item.id}, ${item.quantity - 1})">-</button>
                <input type="number" value="${item.quantity}" min="1" max="${item.available}" 
                       onchange="updateReceiptItemQuantity(${item.id}, this.value)">
                <button class="qty-btn" onclick="updateReceiptItemQuantity(${item.id}, ${item.quantity + 1})">+</button>
            </div>
            <div class="item-total">
                $${(item.price * item.quantity).toFixed(2)}
            </div>
            <button class="remove-btn" onclick="removeItemFromReceipt(${item.id})">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `).join('');
}

// Update receipt total
function updateReceiptTotal() {
    const total = selectedReceiptItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    document.getElementById('receiptTotal').textContent = `$${total.toFixed(2)}`;
}

// Load low stock items for reorder
function loadLowStockItems() {
    const data = JSON.parse(localStorage.getItem('inventoryData')) || [];
    const lowStockItems = data.filter(item => {
        const status = getStockStatus(item);
        return status === 'low' || status === 'out';
    });
    
    reorderItems = lowStockItems.map(item => ({
        id: item.id,
        name: item.name,
        category: item.category,
        currentStock: item.quantity,
        minStock: item.minStock,
        quantity: Math.max(item.minStock * 2, 10),
        estimatedPrice: item.price * Math.max(item.minStock * 2, 10)
    }));
    
    localStorage.setItem('reorderList', JSON.stringify(reorderItems));
    updateReorderItemsList();
    updateReorderTotal();
    
    showToast(`${lowStockItems.length} low stock items added to reorder list`, 'success');
}

// Show manual item selection for reorder
function showManualItemSelection() {
    // This would open a modal or section to manually select items
    // For now, we'll just show a message
    showToast('Manual item selection coming soon', 'info');
}

// Update reorder items list
function updateReorderItemsList() {
    const container = document.getElementById('reorderItemsList');
    
    if (reorderItems.length === 0) {
        container.innerHTML = '<p class="empty-message">No items in reorder list</p>';
        return;
    }
    
    container.innerHTML = reorderItems.map(item => `
        <div class="reorder-item">
            <div class="item-info">
                <h4>${item.name}</h4>
                <p>${item.category}</p>
                <p>Current: ${item.currentStock} | Min: ${item.minStock}</p>
            </div>
            <div class="quantity-controls">
                <label>Order Quantity:</label>
                <input type="number" value="${item.quantity}" min="1" 
                       onchange="updateReorderItemQuantity(${item.id}, this.value)">
            </div>
            <div class="item-total">
                $${item.estimatedPrice.toFixed(2)}
            </div>
            <button class="remove-btn" onclick="removeReorderItem(${item.id})">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `).join('');
}

// Update reorder item quantity
function updateReorderItemQuantity(itemId, newQuantity) {
    const item = reorderItems.find(i => i.id === itemId);
    if (!item) return;
    
    const data = JSON.parse(localStorage.getItem('inventoryData')) || [];
    const originalItem = data.find(i => i.id === itemId);
    
    if (!originalItem) return;
    
    item.quantity = parseInt(newQuantity) || 1;
    item.estimatedPrice = originalItem.price * item.quantity;
    
    localStorage.setItem('reorderList', JSON.stringify(reorderItems));
    updateReorderItemsList();
    updateReorderTotal();
}

// Remove reorder item
function removeReorderItem(itemId) {
    reorderItems = reorderItems.filter(item => item.id !== itemId);
    localStorage.setItem('reorderList', JSON.stringify(reorderItems));
    updateReorderItemsList();
    updateReorderTotal();
}

// Update reorder total
function updateReorderTotal() {
    const total = reorderItems.reduce((sum, item) => sum + item.estimatedPrice, 0);
    document.getElementById('reorderTotal').textContent = `$${total.toFixed(2)}`;
}

// Generate customer receipt
function generateCustomerReceipt() {
    if (selectedReceiptItems.length === 0) {
        showToast('Please select at least one item', 'warning');
        return;
    }
    
    const customerName = document.getElementById('customerName').value || 'Walk-in Customer';
    const total = selectedReceiptItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Create receipt data
    const receipt = {
        id: Date.now(),
        type: 'customer',
        customerName: customerName,
        items: selectedReceiptItems.map(item => ({
            name: item.name,
            category: item.category,
            quantity: item.quantity,
            price: item.price,
            total: item.price * item.quantity
        })),
        total: total,
        date: new Date().toISOString()
    };
    
    // Save receipt to history
    let receiptHistory = JSON.parse(localStorage.getItem('receiptHistory')) || [];
    receiptHistory.unshift(receipt);
    localStorage.setItem('receiptHistory', JSON.stringify(receiptHistory));
    
    // Update inventory quantities
    updateInventoryAfterSale();
    
    // Generate and show receipt
    showGeneratedReceipt(receipt);
    
    closeCustomerReceiptModal();
    showToast('Customer receipt generated successfully', 'success');
}

// Generate reorder receipt
function generateReorderReceipt() {
    if (reorderItems.length === 0) {
        showToast('Please add items to reorder list', 'warning');
        return;
    }
    
    const total = reorderItems.reduce((sum, item) => sum + item.estimatedPrice, 0);
    
    // Create receipt data
    const receipt = {
        id: Date.now(),
        type: 'reorder',
        supplierName: 'Office Supplies Co.',
        items: reorderItems.map(item => ({
            name: item.name,
            category: item.category,
            currentStock: item.currentStock,
            minStock: item.minStock,
            quantity: item.quantity,
            estimatedPrice: item.estimatedPrice
        })),
        total: total,
        date: new Date().toISOString()
    };
    
    // Save receipt to history
    let receiptHistory = JSON.parse(localStorage.getItem('receiptHistory')) || [];
    receiptHistory.unshift(receipt);
    localStorage.setItem('receiptHistory', JSON.stringify(receiptHistory));
    
    // Clear reorder list
    localStorage.removeItem('reorderList');
    
    // Generate and show receipt
    showGeneratedReceipt(receipt);
    
    closeReorderReceiptModal();
    showToast('Reorder receipt generated successfully', 'success');
}

// Update inventory after sale
function updateInventoryAfterSale() {
    let data = JSON.parse(localStorage.getItem('inventoryData')) || [];
    
    selectedReceiptItems.forEach(receiptItem => {
        const inventoryItem = data.find(item => item.id === receiptItem.id);
        if (inventoryItem) {
            inventoryItem.quantity -= receiptItem.quantity;
        }
    });
    
    localStorage.setItem('inventoryData', JSON.stringify(data));
}

// Show generated receipt in a popup window
function showGeneratedReceipt(receipt) {
    const receiptWindow = window.open('', '_blank', 'width=600,height=800,scrollbars=yes');
    
    const receiptHTML = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Receipt #${receipt.id}</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; }
                .receipt-info { margin: 20px 0; }
                .items-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                .items-table th, .items-table td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
                .total { font-size: 1.2em; font-weight: bold; text-align: right; margin-top: 20px; }
                .footer { margin-top: 30px; text-align: center; font-size: 0.9em; color: #666; }
                @media print { .no-print { display: none; } }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>StationeryPro</h1>
                <h2>${receipt.type === 'customer' ? 'Sales Receipt' : 'Reorder Receipt'}</h2>
                <p>Receipt #${receipt.id}</p>
            </div>
            
            <div class="receipt-info">
                <p><strong>Date:</strong> ${new Date(receipt.date).toLocaleString()}</p>
                ${receipt.customerName ? `<p><strong>Customer:</strong> ${receipt.customerName}</p>` : ''}
                ${receipt.supplierName ? `<p><strong>Supplier:</strong> ${receipt.supplierName}</p>` : ''}
            </div>
            
            <table class="items-table">
                <thead>
                    <tr>
                        <th>Item</th>
                        <th>Category</th>
                        <th>Quantity</th>
                        <th>Price</th>
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${receipt.items.map(item => `
                        <tr>
                            <td>${item.name}</td>
                            <td>${item.category}</td>
                            <td>${item.quantity}</td>
                            <td>$${(item.price || item.estimatedPrice / item.quantity).toFixed(2)}</td>
                            <td>$${(item.total || item.estimatedPrice).toFixed(2)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            
            <div class="total">
                <p>Total Amount: $${receipt.total.toFixed(2)}</p>
            </div>
            
            <div class="footer">
                <p>Thank you for your business!</p>
                <p>StationeryPro - Professional Stationery Management</p>
            </div>
            
            <div class="no-print" style="margin-top: 30px; text-align: center;">
                <button onclick="window.print()" style="padding: 10px 20px; margin-right: 10px;">Print Receipt</button>
                <button onclick="window.close()" style="padding: 10px 20px;">Close</button>
            </div>
        </body>
        </html>
    `;
    
    receiptWindow.document.write(receiptHTML);
    receiptWindow.document.close();
}

// Load receipt history
function loadReceiptHistory() {
    const history = JSON.parse(localStorage.getItem('receiptHistory')) || [];
    const container = document.getElementById('receiptHistoryList');
    
    if (history.length === 0) {
        container.innerHTML = '<p class="empty-message">No receipts found</p>';
        return;
    }
    
    container.innerHTML = history.map(receipt => `
        <div class="receipt-history-item">
            <div class="receipt-header">
                <h4>Receipt #${receipt.id}</h4>
                <span class="receipt-type ${receipt.type}">${receipt.type === 'customer' ? 'Sales' : 'Reorder'}</span>
            </div>
            <div class="receipt-details">
                <p><strong>Date:</strong> ${new Date(receipt.date).toLocaleDateString()}</p>
                ${receipt.customerName ? `<p><strong>Customer:</strong> ${receipt.customerName}</p>` : ''}
                <p><strong>Items:</strong> ${receipt.items.length}</p>
                <p><strong>Total:</strong> $${receipt.total.toFixed(2)}</p>
            </div>
            <div class="receipt-actions">
                <button class="btn-secondary btn-sm" onclick="viewReceipt(${receipt.id})">
                    <i class="fas fa-eye"></i>
                    View
                </button>
                <button class="btn-primary btn-sm" onclick="reprintReceipt(${receipt.id})">
                    <i class="fas fa-print"></i>
                    Reprint
                </button>
            </div>
        </div>
    `).join('');
}

// View receipt details
function viewReceipt(receiptId) {
    const history = JSON.parse(localStorage.getItem('receiptHistory')) || [];
    const receipt = history.find(r => r.id === receiptId);
    
    if (receipt) {
        showGeneratedReceipt(receipt);
    }
}

// Reprint receipt
function reprintReceipt(receiptId) {
    viewReceipt(receiptId);
}

// Get stock status (helper function)
function getStockStatus(item) {
    if (item.quantity === 0) return 'out';
    if (item.quantity <= item.minStock) return 'low';
    return 'good';
}

// Initialize receipts page
document.addEventListener('DOMContentLoaded', function() {
    if (!checkAuth()) return;
    
    // Setup item search for customer receipt
    const itemSearchInput = document.getElementById('itemSearchInput');
    if (itemSearchInput) {
        itemSearchInput.addEventListener('input', debounce(loadAvailableItems, 300));
    }
    
    // Check URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const type = urlParams.get('type');
    
    if (type === 'reorder') {
        showReorderReceiptModal();
    } else if (urlParams.get('action') === 'new') {
        showCustomerReceiptModal();
    }
    
    // Add receipt-specific styles
    const receiptStyles = document.createElement('style');
    receiptStyles.textContent = `
        .receipt-tabs {
            display: flex;
            margin-bottom: 2rem;
            border-bottom: 1px solid var(--border);
        }
        
        .tab-btn {
            padding: 1rem 1.5rem;
            border: none;
            background: none;
            cursor: pointer;
            border-bottom: 2px solid transparent;
            transition: all 0.2s;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        
        .tab-btn:hover,
        .tab-btn.active {
            color: var(--primary);
            border-bottom-color: var(--primary);
        }
        
        .tab-content {
            display: none;
        }
        
        .tab-content.active {
            display: block;
        }
        
        .receipt-types {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 2rem;
        }
        
        .receipt-type-card {
            background: var(--card-background);
            border: 1px solid var(--border);
            border-radius: var(--radius);
            padding: 2rem;
            text-align: center;
            cursor: pointer;
            transition: all 0.2s;
        }
        
        .receipt-type-card:hover {
            box-shadow: var(--shadow-md);
            border-color: var(--primary);
        }
        
        .card-icon {
            font-size: 3rem;
            color: var(--primary);
            margin-bottom: 1rem;
        }
        
        .receipt-type-card h3 {
            margin-bottom: 0.5rem;
        }
        
        .receipt-type-card p {
            color: var(--text-secondary);
            margin-bottom: 1.5rem;
        }
        
        .modal.large .modal-content {
            max-width: 800px;
        }
        
        .receipt-form,
        .reorder-form {
            display: flex;
            flex-direction: column;
            gap: 1.5rem;
        }
        
        .customer-info,
        .reorder-options {
            padding: 1rem;
            background: var(--secondary);
            border-radius: var(--radius);
        }
        
        .reorder-options {
            display: flex;
            gap: 1rem;
            justify-content: center;
        }
        
        .items-selection h3,
        .selected-items h3,
        .reorder-items h3 {
            margin-bottom: 1rem;
        }
        
        .available-items {
            max-height: 300px;
            overflow-y: auto;
            border: 1px solid var(--border);
            border-radius: var(--radius);
        }
        
        .available-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 1rem;
            border-bottom: 1px solid var(--border);
            cursor: pointer;
            transition: background-color 0.2s;
        }
        
        .available-item:hover {
            background: var(--secondary);
        }
        
        .available-item:last-child {
            border-bottom: none;
        }
        
        .item-info h4 {
            margin: 0 0 0.25rem 0;
        }
        
        .item-info p {
            margin: 0;
            font-size: 0.9rem;
            color: var(--text-secondary);
        }
        
        .item-price {
            font-weight: 600;
            color: var(--primary);
        }
        
        .add-item-btn {
            background: var(--primary);
            color: white;
            border: none;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            cursor: pointer;
            transition: background-color 0.2s;
        }
        
        .add-item-btn:hover {
            background: var(--primary-dark);
        }
        
        .selected-items-list,
        .reorder-items-list {
            max-height: 400px;
            overflow-y: auto;
        }
        
        .selected-item,
        .reorder-item {
            display: flex;
            align-items: center;
            gap: 1rem;
            padding: 1rem;
            border: 1px solid var(--border);
            border-radius: var(--radius);
            margin-bottom: 0.5rem;
            background: var(--card-background);
        }
        
        .selected-item .item-details,
        .reorder-item .item-info {
            flex: 1;
        }
        
        .quantity-controls {
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        
        .qty-btn {
            width: 30px;
            height: 30px;
            border: 1px solid var(--border);
            background: var(--card-background);
            cursor: pointer;
            border-radius: 4px;
        }
        
        .qty-btn:hover {
            background: var(--secondary);
        }
        
        .quantity-controls input {
            width: 60px;
            text-align: center;
            padding: 0.25rem;
        }
        
        .item-total {
            font-weight: 600;
            color: var(--primary);
            min-width: 80px;
            text-align: right;
        }
        
        .remove-btn {
            background: var(--danger-light);
            color: var(--danger);
            border: none;
            border-radius: 4px;
            padding: 0.5rem;
            cursor: pointer;
            transition: background-color 0.2s;
        }
        
        .remove-btn:hover {
            background: var(--danger);
            color: white;
        }
        
        .receipt-total,
        .reorder-total {
            padding: 1rem;
            background: var(--secondary);
            border-radius: var(--radius);
            text-align: right;
        }
        
        .total-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 1.2rem;
            font-weight: 600;
        }
        
        .history-filters {
            display: flex;
            gap: 1rem;
            margin-bottom: 1.5rem;
            align-items: center;
        }
        
        .receipt-history-item {
            background: var(--card-background);
            border: 1px solid var(--border);
            border-radius: var(--radius);
            padding: 1.5rem;
            margin-bottom: 1rem;
        }
        
        .receipt-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1rem;
        }
        
        .receipt-type {
            padding: 0.25rem 0.75rem;
            border-radius: 9999px;
            font-size: 0.8rem;
            font-weight: 500;
        }
        
        .receipt-type.customer {
            background: var(--success-light);
            color: var(--success);
        }
        
        .receipt-type.reorder {
            background: var(--primary-light);
            color: var(--primary);
        }
        
        .receipt-details {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 0.5rem;
            margin-bottom: 1rem;
        }
        
        .receipt-actions {
            display: flex;
            gap: 0.5rem;
        }
        
        .empty-message {
            text-align: center;
            color: var(--text-secondary);
            padding: 2rem;
            font-style: italic;
        }
        
        @media (max-width: 768px) {
            .receipt-types {
                grid-template-columns: 1fr;
            }
            
            .reorder-options {
                flex-direction: column;
            }
            
            .selected-item,
            .reorder-item {
                flex-direction: column;
                align-items: stretch;
                gap: 0.75rem;
            }
            
            .quantity-controls {
                justify-content: center;
            }
            
            .item-total {
                text-align: center;
            }
            
            .history-filters {
                flex-direction: column;
                align-items: stretch;
            }
            
            .receipt-details {
                grid-template-columns: 1fr;
            }
        }
    `;
    document.head.appendChild(receiptStyles);
});