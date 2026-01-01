let currentView = 'grid';

// Get stock status
function getStockStatus(item) {
    if (item.quantity === 0) return 'out';
    if (item.quantity <= item.minStock) return 'low';
    return 'good';
}

// Get stock status text
function getStatusText(item) {
    const status = getStockStatus(item);
    switch (status) {
        case 'out': return 'Out of Stock';
        case 'low': return 'Low Stock';
        case 'good': return 'In Stock';
        default: return 'Unknown';
    }
}

// Perform search
function performSearch() {
    const searchTerm = document.getElementById('mainSearch').value.toLowerCase();
    const category = document.getElementById('searchCategory').value;
    const row = document.getElementById('searchRow').value.toUpperCase();
    const column = document.getElementById('searchColumn').value.toUpperCase();
    const status = document.getElementById('searchStatus').value;
    
    let data = JSON.parse(localStorage.getItem('inventoryData')) || [];
    let results = data;
    
    // Filter by search term
    if (searchTerm) {
        results = results.filter(item => 
            item.name.toLowerCase().includes(searchTerm) ||
            item.category.toLowerCase().includes(searchTerm) ||
            `${item.row}${item.column}`.toLowerCase().includes(searchTerm)
        );
    }
    
    // Filter by category
    if (category) {
        results = results.filter(item => item.category === category);
    }
    
    // Filter by row
    if (row) {
        results = results.filter(item => item.row.toUpperCase() === row);
    }
    
    // Filter by column
    if (column) {
        results = results.filter(item => item.column.toUpperCase() === column);
    }
    
    // Filter by status
    if (status) {
        results = results.filter(item => getStockStatus(item) === status);
    }
    
    displayResults(results);
    updateResultsCount(results.length);
    
    // Show/hide clear button
    const hasFilters = searchTerm || category || row || column || status;
    document.getElementById('clearSearch').style.display = hasFilters ? 'block' : 'none';
}

// Display search results
function displayResults(items) {
    const container = document.getElementById('searchResults');
    container.className = `results-container ${currentView}-view`;
    
    if (items.length === 0) {
        container.innerHTML = `
            <div class="no-results">
                <i class="fas fa-search"></i>
                <h3>No items found</h3>
                <p>Try adjusting your search criteria</p>
            </div>
        `;
        return;
    }
    
    if (currentView === 'grid') {
        displayGridView(items, container);
    } else {
        displayListView(items, container);
    }
}

// Display grid view
function displayGridView(items, container) {
    container.innerHTML = items.map(item => `
        <div class="item-card">
            <div class="item-header">
                <h4>${item.name}</h4>
                <span class="status-badge status-${getStockStatus(item)}">
                    ${getStatusText(item)}
                </span>
            </div>
            <div class="item-details">
                <p><i class="fas fa-tag"></i> ${item.category}</p>
                <p><i class="fas fa-map-marker-alt"></i> Row ${item.row}, Column ${item.column}</p>
                <p><i class="fas fa-boxes"></i> ${item.quantity} in stock</p>
                <p><i class="fas fa-exclamation-triangle"></i> Min: ${item.minStock}</p>
            </div>
            <div class="item-actions">
                <button class="btn-secondary btn-sm" onclick="viewItemDetails(${item.id})">
                    <i class="fas fa-eye"></i>
                    View
                </button>
                <button class="btn-primary btn-sm" onclick="editItem(${item.id})">
                    <i class="fas fa-edit"></i>
                    Edit
                </button>
            </div>
        </div>
    `).join('');
}

// Display list view
function displayListView(items, container) {
    container.innerHTML = `
        <div class="list-table">
            <div class="list-header">
                <span>Item Name</span>
                <span>Category</span>
                <span>Location</span>
                <span>Stock</span>
                <span>Status</span>
                <span>Actions</span>
            </div>
            ${items.map(item => `
                <div class="list-row">
                    <span class="item-name">${item.name}</span>
                    <span>${item.category}</span>
                    <span>Row ${item.row}, Col ${item.column}</span>
                    <span>${item.quantity} / ${item.minStock}</span>
                    <span>
                        <span class="status-badge status-${getStockStatus(item)}">
                            ${getStatusText(item)}
                        </span>
                    </span>
                    <span class="list-actions">
                        <button class="btn-icon btn-view" onclick="viewItemDetails(${item.id})" title="View">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn-icon btn-edit" onclick="editItem(${item.id})" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                    </span>
                </div>
            `).join('')}
        </div>
    `;
}

// Update results count
function updateResultsCount(count) {
    const countElement = document.getElementById('resultsCount');
    if (count === 0) {
        countElement.textContent = 'No results found';
    } else if (count === 1) {
        countElement.textContent = '1 item found';
    } else {
        countElement.textContent = `${count} items found`;
    }
}

// View item details
function viewItemDetails(id) {
    const data = JSON.parse(localStorage.getItem('inventoryData')) || [];
    const item = data.find(i => i.id === id);
    
    if (!item) return;
    
    const details = `
        Name: ${item.name}
        Category: ${item.category}
        Current Stock: ${item.quantity}
        Minimum Stock: ${item.minStock}
        Location: Row ${item.row}, Column ${item.column}
        Status: ${getStatusText(item)}
        Price: $${item.price.toFixed(2)}
    `;
    
    alert(details);
}

// Edit item (redirect to inventory page)
function editItem(id) {
    window.location.href = `inventory.html?edit=${id}`;
}

// Toggle advanced search
function toggleAdvancedSearch() {
    const advancedSearch = document.getElementById('advancedSearch');
    const toggleBtn = document.getElementById('toggleAdvanced');
    const isVisible = advancedSearch.style.display !== 'none';
    
    if (isVisible) {
        advancedSearch.style.display = 'none';
        toggleBtn.innerHTML = '<i class="fas fa-sliders-h"></i> Advanced Search';
    } else {
        advancedSearch.style.display = 'block';
        toggleBtn.innerHTML = '<i class="fas fa-sliders-h"></i> Hide Advanced';
    }
}

// Clear all filters
function clearAllFilters() {
    document.getElementById('mainSearch').value = '';
    document.getElementById('searchCategory').value = '';
    document.getElementById('searchRow').value = '';
    document.getElementById('searchColumn').value = '';
    document.getElementById('searchStatus').value = '';
    
    performSearch();
}

// Switch view mode
function switchViewMode(view) {
    currentView = view;
    
    // Update active button
    document.querySelectorAll('.view-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`[data-view="${view}"]`).classList.add('active');
    
    // Re-display results with new view
    performSearch();
}

// Setup event listeners
function setupEventListeners() {
    const searchInput = document.getElementById('mainSearch');
    const searchFilters = [
        'searchCategory', 'searchRow', 'searchColumn', 'searchStatus'
    ];
    
    // Main search input
    searchInput.addEventListener('input', debounce(performSearch, 300));
    
    // Filter inputs
    searchFilters.forEach(filterId => {
        const element = document.getElementById(filterId);
        if (element) {
            element.addEventListener('change', performSearch);
            if (element.type === 'text') {
                element.addEventListener('input', debounce(performSearch, 300));
            }
        }
    });
    
    // Advanced search toggle
    document.getElementById('toggleAdvanced').addEventListener('click', toggleAdvancedSearch);
    
    // Clear search button
    document.getElementById('clearSearch').addEventListener('click', clearAllFilters);
    
    // Reset filters button
    document.getElementById('resetFilters').addEventListener('click', clearAllFilters);
    
    // View mode buttons
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            switchViewMode(btn.dataset.view);
        });
    });
}

// Initialize search page
document.addEventListener('DOMContentLoaded', function() {
    if (!checkAuth()) return;
    
    setupEventListeners();
    
    // Initial search (show all items)
    performSearch();
    
    // Add search-specific styles
    const searchStyles = document.createElement('style');
    searchStyles.textContent = `
        .search-container {
            margin-bottom: 2rem;
        }
        
        .search-form {
            background: var(--card-background);
            padding: 1.5rem;
            border-radius: var(--radius);
            border: 1px solid var(--border);
        }
        
        .search-input-group {
            position: relative;
            margin-bottom: 1rem;
        }
        
        .search-input-group i {
            position: absolute;
            left: 1rem;
            top: 50%;
            transform: translateY(-50%);
            color: var(--text-secondary);
        }
        
        .search-input-group input {
            width: 100%;
            padding: 1rem 1rem 1rem 3rem;
            border: 2px solid var(--border);
            border-radius: var(--radius);
            font-size: 1.1rem;
        }
        
        .search-input-group input:focus {
            border-color: var(--primary);
            box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
        }
        
        .clear-btn {
            position: absolute;
            right: 1rem;
            top: 50%;
            transform: translateY(-50%);
            background: none;
            border: none;
            color: var(--text-secondary);
            cursor: pointer;
            padding: 0.5rem;
        }
        
        .clear-btn:hover {
            color: var(--danger);
        }
        
        .search-filters {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1rem;
            margin-bottom: 1rem;
        }
        
        .filter-group label {
            display: block;
            margin-bottom: 0.5rem;
            font-weight: 500;
        }
        
        .search-actions {
            display: flex;
            gap: 1rem;
            justify-content: flex-end;
        }
        
        .search-results {
            margin-top: 2rem;
        }
        
        .results-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1.5rem;
        }
        
        .view-options {
            display: flex;
            gap: 0.5rem;
        }
        
        .view-btn {
            padding: 0.75rem;
            border: 1px solid var(--border);
            background: var(--card-background);
            cursor: pointer;
            border-radius: var(--radius);
            color: var(--text-secondary);
            transition: all 0.2s;
        }
        
        .view-btn:hover,
        .view-btn.active {
            background: var(--primary);
            color: white;
            border-color: var(--primary);
        }
        
        .results-container.grid-view {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 1.5rem;
        }
        
        .item-card {
            background: var(--card-background);
            border: 1px solid var(--border);
            border-radius: var(--radius);
            padding: 1.5rem;
            transition: all 0.2s;
        }
        
        .item-card:hover {
            box-shadow: var(--shadow-md);
            border-color: var(--primary);
        }
        
        .item-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 1rem;
        }
        
        .item-header h4 {
            font-weight: 600;
            margin: 0;
            flex: 1;
            margin-right: 1rem;
        }
        
        .item-details {
            margin-bottom: 1.5rem;
        }
        
        .item-details p {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            margin-bottom: 0.5rem;
            font-size: 0.9rem;
            color: var(--text-secondary);
        }
        
        .item-details i {
            width: 16px;
            text-align: center;
        }
        
        .item-actions {
            display: flex;
            gap: 0.5rem;
        }
        
        .results-container.list-view {
            background: var(--card-background);
            border: 1px solid var(--border);
            border-radius: var(--radius);
        }
        
        .list-table {
            width: 100%;
        }
        
        .list-header {
            display: grid;
            grid-template-columns: 2fr 1fr 1fr 1fr 1fr 1fr;
            padding: 1rem;
            background: var(--secondary);
            font-weight: 600;
            border-bottom: 1px solid var(--border);
        }
        
        .list-row {
            display: grid;
            grid-template-columns: 2fr 1fr 1fr 1fr 1fr 1fr;
            padding: 1rem;
            border-bottom: 1px solid var(--border);
            transition: background-color 0.2s;
        }
        
        .list-row:hover {
            background: var(--secondary);
        }
        
        .list-row:last-child {
            border-bottom: none;
        }
        
        .item-name {
            font-weight: 500;
        }
        
        .list-actions {
            display: flex;
            gap: 0.5rem;
        }
        
        .btn-view {
            background: var(--primary-light);
            color: var(--primary);
        }
        
        .btn-view:hover {
            background: var(--primary);
            color: white;
        }
        
        .no-results {
            text-align: center;
            padding: 3rem;
            color: var(--text-secondary);
        }
        
        .no-results i {
            font-size: 3rem;
            margin-bottom: 1rem;
            color: var(--text-secondary);
        }
        
        .no-results h3 {
            margin-bottom: 0.5rem;
            color: var(--text-primary);
        }
        
        @media (max-width: 768px) {
            .search-filters {
                grid-template-columns: 1fr;
            }
            
            .results-header {
                flex-direction: column;
                gap: 1rem;
                align-items: stretch;
            }
            
            .results-container.grid-view {
                grid-template-columns: 1fr;
            }
            
            .list-header,
            .list-row {
                grid-template-columns: 1fr;
                gap: 0.5rem;
            }
            
            .list-header {
                display: none;
            }
            
            .list-row {
                display: flex;
                flex-direction: column;
                padding: 1rem;
                background: var(--card-background);
                margin-bottom: 1rem;
                border: 1px solid var(--border);
                border-radius: var(--radius);
            }
        }
    `;
    document.head.appendChild(searchStyles);
});