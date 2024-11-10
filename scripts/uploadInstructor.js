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
    // Add loading overlay to the document
    const loadingOverlay = document.createElement('div');
    loadingOverlay.className = 'loading-overlay';
    loadingOverlay.innerHTML = `
        <div class="loading-content">
            <div class="spinner-border text-light" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
            <div class="loading-message mt-3">Uploading instructor details, please wait...</div>
        </div>
    `;
    document.body.appendChild(loadingOverlay);

    // Add styles for loading overlay
    const overlayStyle = document.createElement('style');
    overlayStyle.textContent = `
        .loading-overlay {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.7);
            z-index: 9999;
            justify-content: center;
            align-items: center;
        }
        .loading-overlay.active {
            display: flex;
        }
        .loading-content {
            text-align: center;
            color: white;
        }
        .loading-message {
            font-size: 1.2rem;
            margin-top: 1rem;
        }
        #cropModal .modal-body {
            max-height: 80vh;
            padding: 1rem;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        #cropperImage {
            max-height: 70vh;
            max-width: 100%;
            display: block;
        }
        .cropper-container {
            max-height: 70vh !important;
        }
        .modal-dialog {
            display: flex;
            align-items: center;
            min-height: calc(100% - 1rem);
    `;
    document.head.appendChild(overlayStyle);

    const app = initializeApp(firebaseConfig);
    const auth = getAuth();
    const storage = getStorage(app);
    const database = getDatabase(app);

    const form = document.getElementById('uploadForm');
    const pictureFileInput = document.getElementById('pictureFile');
    const cropButton = document.getElementById('cropButton');
    const cropModal = document.getElementById('cropModal');
    let cropper;
    let croppedFile = null;

    // Function to show loading overlay
    function showLoadingOverlay() {
        loadingOverlay.classList.add('active');
    }

    // Function to hide loading overlay
    function hideLoadingOverlay() {
        loadingOverlay.classList.remove('active');
    }

    // Function to initialize cropper with proper sizing
    function initializeCropper(image) {
        if (cropper) {
            cropper.destroy();
        }
        
        cropper = new Cropper(image, {
            aspectRatio: 1,
            viewMode: 2,
            autoCropArea: 1,
            background: false,
            center: true,
            responsive: true,
            scalable: true,
            ready() {
                this.cropper.resize();
            },
            crop(event) {
                console.log('Crop box data:', event.detail);
            }
        });
    }

    // Handle file selection for avatar
    pictureFileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                showErrorModal('Please select an image file.');
                return;
            }

            const reader = new FileReader();
            reader.onload = () => {
                const image = document.getElementById('cropperImage');
                image.src = reader.result;

                const cropModalInstance = new bootstrap.Modal(cropModal);
                cropModalInstance.show();

                cropModal.addEventListener('shown.bs.modal', function modalShownHandler() {
                    initializeCropper(image);
                    cropModal.removeEventListener('shown.bs.modal', modalShownHandler);
                });
            };
            reader.readAsDataURL(file);
        }
    });

    // Handle crop button click
    cropButton.addEventListener('click', () => {
        if (cropper) {
            const canvas = cropper.getCroppedCanvas({
                width: 500,
                height: 500
            });
    
            canvas.toBlob((blob) => {
                croppedFile = new File([blob], 'cropped-avatar.jpg', { type: 'image/jpeg' });
    
                const avatarPreview = document.getElementById('avatarPreview');
                avatarPreview.src = URL.createObjectURL(croppedFile);
                avatarPreview.style.display = 'block';
    
                cropper.destroy();
                const cropModalInstance = bootstrap.Modal.getInstance(cropModal);
                cropModalInstance.hide();
            }, 'image/jpeg', 0.9);
        }
    });

    // Handle form submission
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

                if (!scheduleFile.name.endsWith('.xlsx')) {
                    showErrorModal("Please upload an Excel file (.xlsx) for the schedule.");
                    return;
                }
            
                try {
                    form.querySelector('button[type="submit"]').disabled = true;
                    showLoadingOverlay(); // Show loading overlay before starting upload
                    
                    const avatarURL = await uploadFile(croppedFile, `instructor image/${instructorName}-${Date.now()}-avatar.jpg`);
                    const scheduleURL = await uploadFile(scheduleFile, `instructor schedule/${instructorName}-${Date.now()}-schedule.xlsx`);
            
                    await saveInstructorData(instructorName, department, avatarURL, scheduleURL);
                    hideLoadingOverlay(); // Hide loading overlay before showing success modal
                    showSuccessModal();
                } catch (error) {
                    console.error("Error uploading data:", error);
                    hideLoadingOverlay(); // Hide loading overlay if there's an error
                    showErrorModal("Failed to upload instructor details. Please try again.");
                } finally {
                    form.querySelector('button[type="submit"]').disabled = false;
                }
            });
        } else {
            console.log("User is not signed in.");
            window.location.href = 'login.html';
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
        const instructorRef = databaseRef(database, `instructors/${name.replace(/\s+/g, '_').toLowerCase()}`);
        await set(instructorRef, {
            name: name,
            department: department,
            avatarURL: avatarURL,
            scheduleURL: scheduleURL,
            timestamp: Date.now(),
            updatedBy: auth.currentUser.uid
        });
    }

    // Function to show success modal
    function showSuccessModal() {
        const successModal = new bootstrap.Modal(document.getElementById('successModal'));
        successModal.show();

        setTimeout(() => {
            window.location.href = 'instructor.html';
        }, 2000);
    }

    // Function to show error modal
    function showErrorModal(message) {
        const errorMessage = document.getElementById('errorMessage');
        errorMessage.textContent = message;
        const errorModal = new bootstrap.Modal(document.getElementById('errorModal'));
        errorModal.show();
    }

    // Clean up on page unload
    window.addEventListener('unload', () => {
        if (cropper) {
            cropper.destroy();
        }
    });

    // Handle modal close
    cropModal.addEventListener('hidden.bs.modal', () => {
        if (cropper) {
            cropper.destroy();
        }
    });
});