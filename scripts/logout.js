import { auth } from './firebaseInit.js';  // Ensure this path is correct
import { signOut } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";

const logoutButton = document.getElementById('logout');
const loggingOutModal = new bootstrap.Modal(document.getElementById('loggingOutModal'), {
    backdrop: 'static',
    keyboard: false
});
const confirmationModal = new bootstrap.Modal(document.getElementById('logoutConfirmationModal'), {
    backdrop: 'static',
    keyboard: false
});

// Show confirmation modal on logout button click
logoutButton.addEventListener("click", (event) => {
    event.preventDefault();
    console.log("Logout button clicked."); // Log the click event
    confirmationModal.show();  // Show the logout confirmation modal
});

// Handle the logout confirmation
const confirmLogoutButton = document.getElementById('confirmLogout');
confirmLogoutButton.addEventListener("click", async () => {
    confirmationModal.hide();  // Hide confirmation modal
    console.log("Confirmation modal hidden. Showing logging out modal...");

    // Show the "Logging Out" modal after a 5-second delay
    setTimeout(async () => {
        loggingOutModal.show();  // Show logging out modal

        try {
            await signOut(auth);
            console.log("User signed out."); // Log successful sign-out
            window.location.href = "login.html";  // Redirect to the login page after logout
        } catch (error) {
            loggingOutModal.hide();  // Hide logging out modal if there is an error
            console.error("Error signing out: ", error);
            alert("There was an error signing out. Please try again."); // Notify the user of the error
        }
    }, 1500); //
});

// Optionally, add a cancel button listener to hide the confirmation modal
const cancelLogoutButton = document.getElementById('cancelLogout'); // Ensure you have a cancel button in your modal
if (cancelLogoutButton) {
    cancelLogoutButton.addEventListener("click", () => {
        confirmationModal.hide(); // Hide confirmation modal on cancel
        console.log("Logout canceled."); // Log cancel action
    });
}
