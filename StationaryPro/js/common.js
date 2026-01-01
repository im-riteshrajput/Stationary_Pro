import { signOutfunc } from "./auth.js";

const eplogout = document.getElementById("logout");
if (eplogout) {
    eplogout.addEventListener('click', () => {
        signOutfunc();
    });
}

// Sidebar toggle functionality
document.addEventListener('DOMContentLoaded', function() {
    // Check authentication first
    // if (!checkAuth()) return;
    
    const sidebar = document.getElementById('sidebar');
    const sidebarToggle = document.getElementById('sidebarToggle');
    
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', function() {
            sidebar.classList.toggle('collapsed');
            localStorage.setItem('sidebarCollapsed', sidebar.classList.contains('collapsed'));
        });
    }
    
    // Restore sidebar state
    const sidebarCollapsed = localStorage.getItem('sidebarCollapsed');
    if (sidebarCollapsed === 'true') {
        sidebar.classList.add('collapsed');
    }
    
    // Update user info
    const username = localStorage.getItem('username');
    const email = localStorage.getItem('email');
    
    const usernameEl = document.querySelector('.username');
    const emailEl = document.querySelector('.email');
    
    if (usernameEl && username) {
        usernameEl.textContent = username;
    }
    
    if (emailEl && email) {
        emailEl.textContent = email;
    }
    
    // Mobile menu handling
    handleMobileMenu();
});

// Mobile menu functionality
function handleMobileMenu() {
    const sidebar = document.getElementById('sidebar');
    
    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', function(e) {
        if (window.innerWidth <= 768) {
            if (!sidebar.contains(e.target) && !e.target.matches('.mobile-menu-btn')) {
                sidebar.classList.remove('show');
            }
        }
    });
    
    // Handle window resize
    window.addEventListener('resize', function() {
        if (window.innerWidth > 768) {
            sidebar.classList.remove('show');
        }
    });
}

export function showComingSoon() {
    // This would open a modal or section to manually select items
    // For now, we'll just show a message
    showToast('Manual item selection coming soon', 'info');
}

// Show toast notification
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    // Add toast styles if not already added
    if (!document.getElementById('toast-styles')) {
        const styles = document.createElement('style');
        styles.id = 'toast-styles';
        styles.textContent = `
            .toast {
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 1rem 1.5rem;
                border-radius: 0.75rem;
                color: white;
                font-weight: 500;
                z-index: 1000;
                animation: slideIn 0.3s ease;
            }
            .toast-success { background: var(--success); }
            .toast-error { background: var(--danger); }
            .toast-warning { background: var(--warning); }
            .toast-info { background: var(--primary); }
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
        `;
        document.head.appendChild(styles);
    }
    
    document.body.appendChild(toast);
    
    // Remove toast after 3 seconds
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, 3000);
}

// // Format currency
// function formatCurrency(amount) {
//     return new Intl.NumberFormat('en-US', {
//         style: 'currency',
//         currency: 'USD'
//     }).format(amount);
// }

// // Format date
// function formatDate(date) {
//     return new Intl.DateTimeFormat('en-US', {
//         year: 'numeric',
//         month: 'short',
//         day: 'numeric'
//     }).format(new Date(date));
// }

// // Debounce function for search
// function debounce(func, wait) {
//     let timeout;
//     return function executedFunction(...args) {
//         const later = () => {
//             clearTimeout(timeout);
//             func(...args);
//         };
//         clearTimeout(timeout);
//         timeout = setTimeout(later, wait);
//     };
// }