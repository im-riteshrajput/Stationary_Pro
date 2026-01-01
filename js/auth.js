import { initializeApp } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";
// import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-analytics.js";

const firebaseConfig = {
    apiKey: "AIzaSyAcJy4UKH1dCkvgfXOkGJz1RzpVyGLM3gI",
    authDomain: "stationary-management-a0d6f.firebaseapp.com",
    projectId: "stationary-management-a0d6f",
    storageBucket: "stationary-management-a0d6f.firebasestorage.app",
    messagingSenderId: "730351773379",
    appId: "1:730351773379:web:6c723dc539348f1d2b2476",
    measurementId: "G-ELSVGHEBP1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);
const auth = getAuth();

// Function to show error message
function showError(message) {
    const errorMessage = document.getElementById('error-message');
    if (errorMessage) {
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
        
        // Hide the error after 3 seconds
        setTimeout(() => {
            errorMessage.style.display = 'none';
        }, 5000);
    }
}

// Function to get user-friendly error message based on Firebase error code
function getErrorMessage(error) {
    switch (error.code) {
        case 'auth/invalid-email':
            return 'Invalid email format. Please check your email address.';
        case 'auth/invalid-credential':
            return 'Invalid email or password. Please try again.';
        case 'auth/network-request-failed':
            return 'Network error. Please check your internet connection and try again.';
        case 'auth/too-many-requests':
            return 'Too many failed login attempts. Please try again later.';
        case 'auth/user-disabled':
            return 'This account has been disabled. Please contact support.';
        default:
            console.error('Unknown error:', error);
            return 'An unexpected error occurred. Please try again later.';
    }
}

// Check whether is logged in or logout
onAuthStateChanged(auth, user => {
    const currentPage = window.location.pathname;
    // Explicitly define which pages are public and private
    const isLoginPage = currentPage.includes("index.html") || currentPage === "/";
    const isDashboardPage = currentPage.includes("dashboard.html");
    const isInventoryPage = currentPage.includes("inventory.html");
    const isSearchPage = currentPage.includes("search.html");
    const isReceiptPage = currentPage.includes("receipts.html");
    const isAlertPage = currentPage.includes("alerts.html");

    if (user) {
        // --- User is Signed IN ---
        console.log('User is logged in:', user.email);

        // If the user is on the login page, they should be redirected to the dashboard.
        if (isLoginPage) {
            window.location.href = 'dashboard.html';
        }

    } else {
        // --- User is Signed OUT ---
        console.log('User is logged out.');

        // If the user is trying to access a protected page (like the dashboard),
        // redirect them to the login page.
        if (isDashboardPage) {
            window.location.href = 'index.html';
        }

        else if (isInventoryPage) {
            window.location.href = 'index.html';
        }
        else if (isSearchPage) {
            window.location.href = 'index.html';
        }
        else if (isReceiptPage) {
            window.location.href = 'index.html';
        }
        else if (isAlertPage) {
            window.location.href = 'index.html';
        }
    }
});

// sign Out Button

const eplogin = document.getElementById("submit");

// Sign In Button
if (eplogin) {
    eplogin.addEventListener("click", function (event) {
        event.preventDefault();
        const email = document.getElementById('username').value;
        const pass = document.getElementById('password').value;

        console.log(email);
        console.log(pass);

        signInWithEmailAndPassword(auth, email, pass)
            .then((userCredential) => {
                // The onAuthStateChanged listener will handle the redirect automatically.
                console.log('Login successful for:', userCredential.user.email);
                // Clear any previous errors
                const errorMessage = document.getElementById('error-message');
                if (errorMessage) {
                    errorMessage.style.display = 'none';
                }
            })
            .catch((error) => {
                console.log('Login failed:', error.message);
                const errorMessage = getErrorMessage(error);
                showError(errorMessage);
            });
    });
}

export function signOutfunc() {
    signOut(auth).then(() => {
        // The onAuthStateChanged listener will handle the redirect automatically.
        // window.location.href = 'index.html';
        console.log('Sign-out successful.');
    }).catch((error) => {
        console.error('Sign Out Error', error);
    });
}

const UserDetail = auth.currentUser;

export { app, UserDetail };