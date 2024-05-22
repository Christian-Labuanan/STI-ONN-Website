import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBfZyTFzkgn8hbaPnqNEdslEglKjBkrPPs",
    authDomain: "sti-onn-d0161.firebaseapp.com",
    projectId: "sti-onn-d0161",
    storageBucket: "sti-onn-d0161.appspot.com",
    messagingSenderId: "538337032363",
    appId: "1:538337032363:web:7e17df22799b2bad85dfee"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Login function
const submit = document.getElementById('submit');

submit.addEventListener("click", function(event){
    event.preventDefault();

    const mail = document.getElementById('email').value;
    const pass = document.getElementById('pass').value;
    const errorMessageElement = document.getElementById('error-message');
    const loggingInModal = new bootstrap.Modal(document.getElementById('loggingInModal'), {
        backdrop: 'static',
        keyboard: false
    });

    signInWithEmailAndPassword(auth, mail, pass)
    .then((userCredential) => {
        const user = userCredential.user;
        errorMessageElement.style.display = 'none';  // Hide error message if any
        loggingInModal.show();  // Show logging in modal
        setTimeout(() => {
            window.location.href = "home.html";
        }, 1500); // Simulate a short delay before redirecting
    })
    .catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        loggingInModal.hide();  // Hide logging in modal
        errorMessageElement.style.display = 'block';
        errorMessageElement.textContent = "Incorrect email or password. Please try again.";
    });
});
