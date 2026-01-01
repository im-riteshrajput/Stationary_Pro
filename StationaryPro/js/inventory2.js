// Show add item modal
function showAddItemModal() {
    currentEditingId = null;
    document.getElementById('modalTitle').textContent = 'Add New Item';
    document.getElementById('itemForm').reset();
    document.getElementById('itemId').value = '';
    document.getElementById('itemModal').classList.add('show');
}
// Close modal when clicking outside
const itemModel = document.getElementById('itemModal');
if(itemModel){
    itemModel.addEventListener('click', function (e) {
    if (e.target === this) {
        closeItemModal();
    }
});
}


// Close modal
function closeItemModal() {
    document.getElementById('itemModal').classList.remove('show');
    currentEditingId = null;
}

// Search functionality
function setupSearch() {
    const searchInput = document.getElementById('searchInput');
    const categoryFilter = document.getElementById('categoryFilter');
    const statusFilter = document.getElementById('statusFilter');

    const performSearch = debounce(() => {
        const searchTerm = searchInput.value.toLowerCase();
        const selectedCategory = categoryFilter.value;
        const selectedStatus = statusFilter.value;

        let data = JSON.parse(localStorage.getItem('inventoryData')) || [];

        // Filter by search term
        if (searchTerm) {
            data = data.filter(item =>
                item.name.toLowerCase().includes(searchTerm) ||
                item.category.toLowerCase().includes(searchTerm)
            );
        }

        // Filter by category
        if (selectedCategory) {
            data = data.filter(item => item.category === selectedCategory);
        }

        // Filter by status
        if (selectedStatus) {
            data = data.filter(item => getStockStatus(item) === selectedStatus);
        }

        displayInventory(data);
    }, 300);

    searchInput.addEventListener('input', performSearch);
    categoryFilter.addEventListener('change', performSearch);
    statusFilter.addEventListener('change', performSearch);
}



