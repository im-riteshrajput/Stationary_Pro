import { UserData } from "./UserDataModule.js";
const userDataobj = new UserData();
let currentInventoryData = [];

// Update dashboard statistics
async function updateStats() {
    const InvData = await userDataobj.calculateInventoryStats();

    const lowStockEl = document.getElementById('lowStockCount');
    const outOfStockEl = document.getElementById('outOfStockCount');


    if (lowStockEl) lowStockEl.textContent = InvData.lsc;
    if (outOfStockEl) outOfStockEl.textContent = InvData.oosc;

}

// Required: getStockStatus function (robust for strings/nulls)
function getStockStatus(item) {
    const quantity = Number(item.quantity) || 0;  // Handle "0" string → 0
    const minStock = Number(item.minStock) || 10;


    if (quantity === 0) {
        return 'out-of-stock';
    } else if (quantity < minStock) {
        return 'low';
    } else {
        return 'in-stock';
    }
}


// Main function: displayAlerts with DB integration
async function displayAlerts(filterType = '') {
    console.time('displayAlerts');  // Optional timing

    const container = document.getElementById('alertsList');

    if (!container) {
        console.error("Container 'alertsList' not found! Add <div id='alertsList'></div> to your HTML.");
        console.timeEnd('displayAlerts');
        return;
    }

    // Loading state
    container.innerHTML = `
        <div class="loading-state">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Loading alerts...</p>
        </div>
    `;

    let data = currentInventoryData;

    // Fetch if cache empty (assume userDataobj is global/defined elsewhere)
    if (!data || !Array.isArray(data) || data.length === 0) {
        console.log('Cache empty – fetching from DB...');
        if (typeof userDataobj === 'undefined' || typeof userDataobj.fetchDatafromDB !== 'function') {
            console.error('userDataobj or fetchDatafromDB not defined! Ensure it\'s loaded before alerts.js.');
            container.innerHTML = `
                <div class="empty-state error">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Setup Error</h3>
                    <p>Database object not available. Check script loading order.</p>
                </div>
            `;
            console.timeEnd('displayAlerts');
            return;
        }

        
        try {
            const fetchPromise = userDataobj.fetchDatafromDB();
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('DB fetch timeout')), 10000)
            );
            data = await Promise.race([fetchPromise, timeoutPromise]);
            currentInventoryData = data;
            console.log('DB fetch complete:', data.length, 'total items');
        } catch (error) {
            console.error('DB fetch failed:', error);
            data = [];
        }
    } else {
        console.log('Using cache:', data.length, 'total items');
    }

    if (!data || data.length === 0) {
        container.innerHTML = `
            <div class="empty-state error">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>No Data</h3>
                <p>No inventory data available.</p>
            </div>
        `;
        console.timeEnd('displayAlerts');
        return;
    }

    // Now getStockStatus is defined – no more missing error!

    // Initial filter: All low + out-of-stock alerts
    let alertItems = data.filter(item => {
        const status = getStockStatus(item);
        return status === 'low' || status === 'out-of-stock';
    });

    console.log('Initial alerts (low + out-of-stock):', alertItems.length);
    console.log('Out-of-stock in initial alerts:', alertItems.filter(item => getStockStatus(item) === 'out-of-stock').length);

    // Apply filterType if provided – with debug
    if (filterType) {
        console.log(`Applying filter: "${filterType}" (exact string)`);

        const beforeFilterCount = alertItems.length;
        alertItems = alertItems.filter(item => {
            const status = getStockStatus(item);
            const matches = status === filterType;
            return matches;
        });

        console.log(`Filter result: ${beforeFilterCount} → ${alertItems.length} items (for "${filterType}")`);
    }

    // Sort: Out-of-stock first
    alertItems.sort((a, b) => {
        const statusA = getStockStatus(a);
        const statusB = getStockStatus(b);
        if (statusA === 'out-of-stock' && statusB !== 'out-of-stock') return -1;
        if (statusB === 'out-of-stock' && statusA !== 'out-of-stock') return 1;
        return 0;
    });

    // Render
    if (alertItems.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-check-circle"></i>
                <h3>No Alerts</h3>
                <p>No items match the selected filter. Try "All Alerts".</p>
            </div>
        `;
        console.log('No alerts after filtering');
    } else {
        try {
            container.innerHTML = alertItems.map(item => {
                const status = getStockStatus(item);
                const statusText = status === 'out-of-stock' ? 'Out of Stock' : 'Low Stock';
                const urgency = status === 'out-of-stock' ? 'urgent' : 'warning';
                const suggestedOrder = Math.max((Number(item.minStock) || 10) * 2, 10);

                return `
                    <div class="alert-item ${urgency}">
                        <div class="alert-header">
                            <div class="alert-info">
                                <h4>${item.name || 'Unnamed Item'}</h4>
                                <p>${item.category || 'Uncategorized'} • Row ${item.row || 'N/A'}, Column ${item.column || 'N/A'}</p>
                            </div>
                            <div class="alert-status">
                                <span class="status-badge status-${status}">
                                    ${statusText}
                                </span>
                                <span class="quantity">${Number(item.quantity) || 0} left</span>
                            </div>
                        </div>
                        <div class="alert-details">
                            <div class="stock-info">
                                <span>Current: ${Number(item.quantity) || 0}</span>
                                <span>Minimum: ${Number(item.minStock) || 10}</span>
                                <span>Suggested Order: ${suggestedOrder}</span>
                            </div>
                            <div class="alert-actions">
                                <button class="btn-secondary btn-sm" onclick="editItem('${item.id || ''}')">
                                    <i class="fas fa-edit"></i>
                                    Update Stock
                                </button>
                                <button class="btn-primary btn-sm" onclick="addToReorder('${item.id || ''}', ${suggestedOrder})">
                                    <i class="fas fa-cart-plus"></i>
                                    Add to Reorder
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');

            console.log(`Rendered ${alertItems.length} alerts`);
        } catch (error) {
            console.error('Render error:', error);
            container.innerHTML = `
                <div class="empty-state error">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Render Error</h3>
                    <p>${error.message}</p>
                </div>
            `;
        }
    }

    console.timeEnd('displayAlerts');
}

// Edit item (redirect to inventory page)
function editItem(id) {
    window.location.href = `inventory.html?edit=${id}`;
}

// Add item to reorder list
function addToReorder(itemId, quantity) {
    let reorderList = JSON.parse(localStorage.getItem('reorderList')) || [];

    // Check if item already in reorder list
    const existingIndex = reorderList.findIndex(item => item.id === itemId);

    if (existingIndex !== -1) {
        // Update quantity
        reorderList[existingIndex].quantity = quantity;
        showToast('Reorder quantity updated', 'info');
    } else {
        // Add new item
        const data = JSON.parse(localStorage.getItem('inventoryData')) || [];
        const item = data.find(i => i.id === itemId);

        if (item) {
            reorderList.push({
                id: itemId,
                name: item.name,
                category: item.category,
                currentStock: item.quantity,
                minStock: item.minStock,
                quantity: quantity,
                estimatedPrice: item.price * quantity
            });
            showToast('Item added to reorder list', 'success');
        }
    }

    localStorage.setItem('reorderList', JSON.stringify(reorderList));
}

// Generate reorder receipt
function generateReorderReceipt() {
    const data = JSON.parse(localStorage.getItem('inventoryData')) || [];
    const alertItems = data.filter(item => {
        const status = getStockStatus(item);
        return status === 'low' || status === 'out';
    });

    if (alertItems.length === 0) {
        showToast('No items need restocking', 'info');
        return;
    }

    // Auto-add all alert items to reorder list
    const reorderList = alertItems.map(item => ({
        id: item.id,
        name: item.name,
        category: item.category,
        currentStock: item.quantity,
        minStock: item.minStock,
        quantity: Math.max(item.minStock * 2, 10),
        estimatedPrice: item.price * Math.max(item.minStock * 2, 10)
    }));

    localStorage.setItem('reorderList', JSON.stringify(reorderList));

    // Redirect to receipts page
    window.location.href = 'receipts.html?type=reorder';
}

// Setup filters
function setupFilters() {
    const alertTypeFilter = document.getElementById('alertTypeFilter');

    alertTypeFilter.addEventListener('change', function () {
        displayAlerts(this.value);
    });
}

// Initialize alerts page
document.addEventListener('DOMContentLoaded', async function () {
    // if (!checkAuth()) return;
    
    // Show the loader at the start (assuming your loader has id='loader' and is initially hidden)
    const loader = document.getElementById('loader');
    if (loader) loader.style.display = 'flex';
    
    await updateStats();
    await displayAlerts();
    setupFilters();
    
    // Hide the loader after initial data loading is complete (success or error)
    if (loader) loader.style.display = 'none';

    // Add CSS for alert styles
    const alertStyles = document.createElement('style');
    alertStyles.textContent = `
        .alerts-summary {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 1.5rem;
            margin-bottom: 2rem;
        }
        
        .alert-filters {
            display: flex;
            gap: 1rem;
        }
        
        .alerts-list {
            display: flex;
            flex-direction: column;
            gap: 1rem;
        }
        
        .alert-item {
            border: 1px solid var(--border);
            border-radius: var(--radius);
            padding: 1.5rem;
            background: var(--card-background);
        }
        
        .alert-item.urgent {
            border-left: 4px solid var(--danger);
            background: var(--danger-light);
        }
        
        .alert-item.warning {
            border-left: 4px solid var(--warning);
            background: var(--warning-light);
        }
        
        .alert-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 1rem;
        }
        
        .alert-info h4 {
            font-weight: 600;
            margin-bottom: 0.25rem;
        }
        
        .alert-info p {
            color: var(--text-secondary);
            font-size: 0.9rem;
        }
        
        .alert-status {
            display: flex;
            flex-direction: column;
            align-items: flex-end;
            gap: 0.5rem;
        }
        
        .quantity {
            font-size: 0.9rem;
            color: var(--text-secondary);
        }
        
        .alert-details {
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 1rem;
        }
        
        .stock-info {
            display: flex;
            gap: 1rem;
            font-size: 0.9rem;
            color: var(--text-secondary);
        }
        
        .alert-actions {
            display: flex;
            gap: 0.5rem;
        }
        
        .btn-sm {
            padding: 0.5rem 1rem;
            font-size: 0.9rem;
        }
        
        .empty-state {
            text-align: center;
            padding: 3rem;
            color: var(--text-secondary);
        }
        
        .empty-state i {
            font-size: 3rem;
            color: var(--success);
            margin-bottom: 1rem;
        }
        
        .empty-state h3 {
            margin-bottom: 0.5rem;
            color: var(--text-primary);
        }
        
        @media (max-width: 768px) {
            .alert-header {
                flex-direction: column;
                gap: 1rem;
            }
            
            .alert-status {
                align-items: flex-start;
            }
            
            .alert-details {
                flex-direction: column;
                align-items: stretch;
            }
            
            .stock-info {
                justify-content: space-between;
            }
            
            .alert-actions {
                justify-content: stretch;
            }
            
            .alert-actions button {
                flex: 1;
            }
        }
    `;
    document.head.appendChild(alertStyles);

    // Refresh data every 30 seconds (this runs independently and won't re-show the loader)
    setInterval(() => {
        displayAlerts(document.getElementById('alertTypeFilter').value);
    }, 30000);
});
