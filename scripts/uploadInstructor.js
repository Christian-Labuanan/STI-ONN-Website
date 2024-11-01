import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-storage.js";
import { getDatabase, ref as databaseRef, set, onValue } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-database.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js";

// Initialize Firebase
const firebaseConfig = {
    apiKey: "AIzaSyBfZyTFzkgn8hbaPnqNEdslEglKjBkrPPs",
    authDomain: "sti-onn-d0161.firebaseapp.com",
    databaseURL: "https://sti-onn-d0161-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "sti-onn-d0161",
    storageBucket: "sti-onn-d0161.appspot.com",
    messagingSenderId: "538337032363",
    appId: "1:538337032363:web:7e17df22799b2bad85dfee"
};

document.addEventListener('DOMContentLoaded', () => {
    const app = initializeApp(firebaseConfig);
    const auth = getAuth();
    const storage = getStorage(app);
    const database = getDatabase(app);

    const form = document.getElementById('uploadForm');
    const instructorCardsContainer = document.getElementById('instructorCards');

    // Ensure authentication before uploading
    onAuthStateChanged(auth, (user) => {
        if (user) {
            console.log("Authenticated as:", user.uid);

            form.addEventListener('submit', async (event) => {
                event.preventDefault();

                const instructorName = document.getElementById('instructorName').value.trim();
                const pictureFile = document.getElementById('pictureFile').files[0];
                const scheduleFile = document.getElementById('scheduleFile').files[0];

                if (!instructorName || !pictureFile || !scheduleFile) {
                    showErrorModal("Please complete all fields.");
                    return;
                }

                try {
                    const avatarURL = await uploadFile(pictureFile, `instructor image/${instructorName}-avatar.jpg`);
                    const scheduleURL = await uploadFile(scheduleFile, `instructor schedule/${instructorName}-schedule.xlsx`);

                    await saveInstructorData(instructorName, avatarURL, scheduleURL);
                    showSuccessModal();
                } catch (error) {
                    console.error("Error uploading data:", error);
                    showErrorModal("Failed to upload instructor details. Please try again.");
                }
            });
        } else {
            console.log("User is not signed in.");
        }
    });

    // Function to upload files to Firebase Storage
    async function uploadFile(file, path) {
        const fileRef = storageRef(storage, path);
        await uploadBytes(fileRef, file);
        return await getDownloadURL(fileRef);
    }

    // Function to save instructor data to Firebase Database
    async function saveInstructorData(name, avatarURL, scheduleURL) {
        const instructorRef = databaseRef(database, `instructors/${name}`);
        await set(instructorRef, {
            name: name,
            avatarURL: avatarURL,
            scheduleURL: scheduleURL
        });
    }

    // Function to show success modal
    function showSuccessModal() {
        const successModal = new bootstrap.Modal(document.getElementById('successModal'));
        successModal.show();

        setTimeout(() => {
            window.location.href = 'instructor.html';
        }, 3000);
    }

    // Function to show error modal
    function showErrorModal(message) {
        document.getElementById('errorMessage').textContent = message;
        const errorModal = new bootstrap.Modal(document.getElementById('errorModal'));
        errorModal.show();
    }

});

// Avatar image preview
document.addEventListener('DOMContentLoaded', () => {
    const pictureFileInput = document.getElementById('pictureFile');
    const avatarPreview = document.getElementById('avatarPreview');

    pictureFileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];

        if (file) {
            const reader = new FileReader();

            reader.onload = () => {
                avatarPreview.src = reader.result; // Update preview image
            };

            reader.readAsDataURL(file);
        }
    });
});