import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBfZyTFzkgn8hbaPnqNEdslEglKjBkrPPs",
    authDomain: "sti-onn-d0161.firebaseapp.com",
    projectId: "sti-onn-d0161",
    storageBucket: "sti-onn-d0161.appspot.com",
    messagingSenderId: "538337032363",
    appId: "1:538337032363:web:7e17df22799b2bad85dfee"
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const logoutButton = document.getElementById('logout');
const loggingOutModal = new bootstrap.Modal(document.getElementById('loggingOutModal'), {
    backdrop: 'static',
    keyboard: false
});

logoutButton.addEventListener("click", function(event){
    event.preventDefault();

    loggingOutModal.show();  // Show logging out modal

    signOut(auth).then(() => {
        setTimeout(() => {
            window.location.href = "login.html";  // Redirect to the login page after logout
        }, 1500);  // Simulate a short delay before redirecting
    }).catch((error) => {
        loggingOutModal.hide();  // Hide logging out modal if there is an error
        console.error("Error signing out: ", error);
    });
});

