import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import { getDatabase, ref, update, onValue } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-database.js";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-storage.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBfZyTFzkgn8hbaPnqNEdslEglKjBkrPPs",
    authDomain: "sti-onn-d0161.firebaseapp.com",
    databaseURL: "https://sti-onn-d0161-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "sti-onn-d0161",
    storageBucket: "sti-onn-d0161.appspot.com",
    messagingSenderId: "538337032363",
    appId: "1:538337032363:web:7e17df22799b2bad85dfee"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase();
const storage = getStorage();
const auth = getAuth();

// Get URL parameter
const urlParams = new URLSearchParams(window.location.search);
const instructorId = urlParams.get('id');

// Get form elements
const uploadForm = document.getElementById('uploadForm');
const instructorNameInput = document.getElementById('instructorName');
const departmentSelect = document.getElementById('department');
const pictureFileInput = document.getElementById('pictureFile');
const scheduleFileInput = document.getElementById('scheduleFile');
const avatarPreview = document.getElementById('avatarPreview');
const uploadStatusDiv = document.getElementById('uploadStatus');

// Fetch and display instructor data
const instructorRef = ref(database, `instructors/${instructorId}`);
onValue(instructorRef, (snapshot) => {
    if (snapshot.exists()) {
        const instructorData = snapshot.val();

        // Populate fields with existing data
        instructorNameInput.value = instructorData.name || '';
        departmentSelect.value = instructorData.department || '';
        avatarPreview.src = instructorData.avatarURL || 'https://via.placeholder.com/100';

        // Display only the filename for the schedule
        if (instructorData.scheduleURL) {
            // Decode the URL to handle URL-encoded characters
            const decodedURL = decodeURIComponent(instructorData.scheduleURL);
            // Extract the file name from the decoded URL
            const scheduleFileName = decodedURL.split('/').pop().split('?')[0];
            const scheduleFileNameDisplay = document.getElementById('scheduleFileNameDisplay');
            scheduleFileNameDisplay.textContent = scheduleFileName || "No schedule uploaded.";
        } else {
            const scheduleFileNameDisplay = document.getElementById('scheduleFileNameDisplay');
            scheduleFileNameDisplay.textContent = "No schedule uploaded.";
        }
    } else {
        console.error('No instructor data found for ID:', instructorId);
    }
});

// Handle form submission
uploadForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const name = instructorNameInput.value;
    const department = departmentSelect.value;
    const pictureFile = pictureFileInput.files[0];
    const scheduleFile = scheduleFileInput.files[0];

    // Check if the user is authenticated
    const user = auth.currentUser;
    if (!user) {
        alert('Please log in first.');
        return;
    }

    try {
        await updateInstructor(instructorId, name, department, pictureFile, scheduleFile);
        uploadStatusDiv.textContent = 'Instructor details updated successfully.';
    } catch (error) {
        console.error('Error updating instructor:', error);
        uploadStatusDiv.textContent = 'Error updating instructor details.';
    }
});

// Update instructor data
async function updateInstructor(instructorId, name, department, pictureFile, scheduleFile) {
    const user = auth.currentUser;
    if (!user) {
        alert('Please log in first.');
        return;
    }

    const instructorRef = ref(database, `instructors/${instructorId}`);
    const updates = { name: name, department: department };

    try {
        // Update profile picture if a new file is selected
        if (pictureFile) {
            const avatarRef = storageRef(storage, `instructors/${instructorId}/avatar.jpg`);
            await uploadBytes(avatarRef, pictureFile);
            const avatarURL = await getDownloadURL(avatarRef);
            updates.avatarURL = avatarURL;
        }

        // Update schedule file if a new file is selected
        if (scheduleFile) {
            const scheduleRef = storageRef(storage, `instructors/${instructorId}/schedule.xlsx`);
            await uploadBytes(scheduleRef, scheduleFile);
            const scheduleURL = await getDownloadURL(scheduleRef);
            updates.scheduleURL = scheduleURL;
        }

        // Apply updates to Firebase Realtime Database
        await update(instructorRef, updates);
    } catch (error) {
        console.error('Error updating instructor:', error);
        throw new Error('Error updating instructor details');
    }
}

