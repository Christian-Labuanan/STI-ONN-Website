import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-storage.js";
import { getDatabase, ref as databaseRef, set } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-database.js";
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
    let croppedFile = null;  // Variable to hold cropped image file

    onAuthStateChanged(auth, (user) => {
        if (user) {
            console.log("Authenticated as:", user.uid);

            form.addEventListener('submit', async (event) => {
                event.preventDefault();
            
                const instructorName = document.getElementById('instructorName').value.trim();
                const department = document.getElementById('department').value;
                const scheduleFile = document.getElementById('scheduleFile').files[0];
            
                if (!instructorName || !department || !scheduleFile || !croppedFile) {
                    showErrorModal("Please complete all fields and crop the avatar.");
                    return;
                }
            
                try {
                    const avatarURL = await uploadFile(croppedFile, `instructor image/${instructorName}-avatar.jpg`);
                    const scheduleURL = await uploadFile(scheduleFile, `instructor schedule/${instructorName}-schedule.xlsx`);
            
                    await saveInstructorData(instructorName, department, avatarURL, scheduleURL);
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
    async function saveInstructorData(name, department, avatarURL, scheduleURL) {
        const instructorRef = databaseRef(database, `instructors/${name}`);
        await set(instructorRef, {
            name: name,
            department: department,  // Add department to the data
            avatarURL: avatarURL,
            scheduleURL: scheduleURL,
            timestamp: Date.now()
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

    // Avatar image preview and cropping
    const pictureFileInput = document.getElementById('pictureFile');
    const cropButton = document.getElementById('cropButton');
    let cropper;

    pictureFileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                const image = document.getElementById('cropperImage');
                image.src = reader.result;

                // Show cropper modal
                const cropModal = new bootstrap.Modal(document.getElementById('cropModal'));
                cropModal.show();

                // Initialize Cropper.js
                cropper = new Cropper(image, {
                    aspectRatio: 1,
                    viewMode: 2, // Ensures the image stays within the boundaries
                    autoCropArea: 1,
                    background: false,
                    center: true
                });
            };
            reader.readAsDataURL(file);
        }
    });

    cropButton.addEventListener('click', async () => {
        if (cropper) {
            const canvas = cropper.getCroppedCanvas({
                width: 500,
                height: 500
            });

            // Convert canvas to Blob
            canvas.toBlob((blob) => {
                croppedFile = new File([blob], 'cropped-avatar.jpg', { type: 'image/jpeg' });

                // Preview the cropped image
                const avatarPreview = document.getElementById('avatarPreview');
                avatarPreview.src = URL.createObjectURL(croppedFile);
                avatarPreview.style.display = 'block';

                // Destroy the cropper instance and hide modal
                cropper.destroy();
                const cropModal = bootstrap.Modal.getInstance(document.getElementById('cropModal'));
                cropModal.hide();
            }, 'image/jpeg', 1.0);
        }
    });
});
