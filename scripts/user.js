import { auth } from './firebaseInit.js';  // Ensure this path is correct
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";

onAuthStateChanged(auth, (user) => {
    const userInfo = document.getElementById('user-info');
    if (user) {
        // User is signed in.
        userInfo.innerHTML = `
            <p>${user.email}</p>
        `;
    } else {
        // No user is signed in.
        userInfo.innerHTML = "<p>No user signed in.</p>";
        console.log("No user signed in.");
    }
});
