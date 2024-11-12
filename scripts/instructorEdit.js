import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-storage.js";
import { getDatabase, ref as databaseRef, set, onValue, update } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-database.js";
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
            <div class="loading-message mt-3">Updating instructor details, please wait...</div>
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
        }
    `;
    document.head.appendChild(overlayStyle);

    const app = initializeApp(firebaseConfig);
    const auth = getAuth();
    const storage = getStorage(app);
    const database = getDatabase(app);

    let currentAvatarPath = null;
    let currentSchedulePath = null;

    // Get URL parameter for instructor ID
    const urlParams = new URLSearchParams(window.location.search);
    const instructorId = urlParams.get('id');

    const form = document.getElementById('uploadForm');
    const pictureFileInput = document.getElementById('pictureFile');
    const cropButton = document.getElementById('cropButton');
    const cropModal = document.getElementById('cropModal');

    let cropper;
    let croppedFile = null;

    // Function to show/hide loading overlay
    function showLoadingOverlay() {
        loadingOverlay.classList.add('active');
    }

    function hideLoadingOverlay() {
        loadingOverlay.classList.remove('active');
    }

    // Initialize cropper
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
            }
        });
    }

    const fileUpload = document.querySelector('.file-upload1');
    const initialState = document.getElementById('initialUploadState');
    const selectedState = document.getElementById('selectedFileState');
    
    // Ensure these elements exist before using them in other functions
    if (fileUpload && initialState && selectedState) {
        // Fetch and display existing instructor data
        if (instructorId) {
            const instructorRef = databaseRef(database, `instructors/${instructorId}`);
            onValue(instructorRef, (snapshot) => {
                if (snapshot.exists()) {
                    const instructorData = snapshot.val();
    
                    // Store the current schedule URL and extract the path
                    if (instructorData.scheduleURL) {
                        const scheduleURL = new URL(instructorData.scheduleURL);
                        const decodedPath = decodeURIComponent(scheduleURL.pathname);
                        const pathStartIndex = decodedPath.indexOf('/o/') + 3;
                        currentSchedulePath = decodedPath.substring(pathStartIndex);
    
                        // Extract and display file name in selectedFileState
                        const fileName = currentSchedulePath.split('/').pop();
                        document.getElementById('scheduleFileNameDisplay').textContent = fileName;
                        fileUpload.classList.add('has-file');
                        initialState.style.display = 'none';
                        selectedState.style.display = 'flex';
                    }
    
                    // Populate other fields with existing data as before
                    document.getElementById('instructorName').value = instructorData.name || '';
                    document.getElementById('department').value = instructorData.department || '';
                    document.getElementById('avatarPreview').src = instructorData.avatarURL || 'https://via.placeholder.com/100';
                }
            });
        }
    }

    // Function to delete the previous schedule
    async function deletePreviousSchedule() {
        if (currentSchedulePath) {
            try {
                const previousScheduleRef = storageRef(storage, currentSchedulePath);
                await deleteObject(previousScheduleRef);
                console.log('Previous schedule deleted successfully');
            } catch (error) {
                console.error('Error deleting previous schedule:', error);
            }
        }
    }

    // Function to delete the previous avatar
    async function deletePreviousAvatar() {
        if (currentAvatarPath) {
            try {
                const previousAvatarRef = storageRef(storage, currentAvatarPath);
                await deleteObject(previousAvatarRef);
                console.log('Previous avatar deleted successfully');
            } catch (error) {
                console.error('Error deleting previous avatar:', error);
                // Continue with the update even if deletion fails
            }
        }
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
            form.addEventListener('submit', async (event) => {
                event.preventDefault();
            
                const instructorName = document.getElementById('instructorName').value.trim();
                const department = document.getElementById('department').value;
                const scheduleFile = document.getElementById('scheduleFile').files[0];
            
                if (!instructorName || !department) {
                    showErrorModal("Please complete all required fields.");
                    return;
                }
    
                if (scheduleFile && !scheduleFile.name.endsWith('.xlsx')) {
                    showErrorModal("Please upload an Excel file (.xlsx) for the schedule.");
                    return;
                }
            
                try {
                    form.querySelector('button[type="submit"]').disabled = true;
                    showLoadingOverlay();
                    
                    const updates = {
                        name: instructorName,
                        department: department,
                        updatedBy: user.uid,
                        timestamp: Date.now()
                    };
    
                    // Upload new avatar if provided
                    if (croppedFile) {
                        const avatarURL = await uploadFile(
                            croppedFile, 
                            `instructor image/${instructorId}-${Date.now()}-avatar.jpg`,
                            true // Mark this as an avatar upload
                        );
                        updates.avatarURL = avatarURL;
                    }
    
                    // Upload new schedule if provided
                    if (scheduleFile) {
                        await deletePreviousSchedule(); // Delete previous schedule if exists
                        const scheduleURL = await uploadFile(
                            scheduleFile, 
                            `instructor schedule/${instructorId}-${Date.now()}-schedule.xlsx`
                        );
                        updates.scheduleURL = scheduleURL;
                    }
            
                    await updateInstructorData(instructorId, updates);
                    hideLoadingOverlay();
                    showSuccessModal();
                } catch (error) {
                    console.error("Error updating data:", error);
                    hideLoadingOverlay();
                    showErrorModal("Failed to update instructor details. Please try again.");
                } finally {
                    form.querySelector('button[type="submit"]').disabled = false;
                }
            });
        } else {
            window.location.href = 'login.html';
        }
    });

    // Function to upload files to Firebase Storage
    async function uploadFile(file, path, isAvatar = false) {
        if (isAvatar) {
            await deletePreviousAvatar();
        }
        const fileRef = storageRef(storage, path);
        await uploadBytes(fileRef, file);
        return await getDownloadURL(fileRef);
    }

    // Function to update instructor data
    async function updateInstructorData(instructorId, updates) {
        const instructorRef = databaseRef(database, `instructors/${instructorId}`);
        await update(instructorRef, updates);
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

    // Clean up
    window.addEventListener('unload', () => {
        if (cropper) {
            cropper.destroy();
        }
    });

    cropModal.addEventListener('hidden.bs.modal', () => {
        if (cropper) {
            cropper.destroy();
        }
    });
});

document.addEventListener('DOMContentLoaded', function() {
    const fileUploadArea = document.getElementById('fileUploadArea');
    const fileInput = document.getElementById('scheduleFile');
    const fileNameDisplay = document.getElementById('scheduleFileNameDisplay');
    const fileUpload = document.querySelector('.file-upload1');
    const initialState = document.getElementById('initialUploadState');
    const selectedState = document.getElementById('selectedFileState');

    // Prevent default drag behaviors
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        fileUploadArea.addEventListener(eventName, preventDefaults, false);
        document.body.addEventListener(eventName, preventDefaults, false);
    });

    // Handle dropped files
    fileUploadArea.addEventListener('drop', handleDrop, false);

    // Handle selected files
    fileInput.addEventListener('change', handleFiles, false);

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        handleFiles({ target: { files: files } });
    }

    function handleFiles(e) {
        const files = e.target.files;
        if (files.length) {
            const file = files[0];
            // Check if file is an Excel file
            if (file.name.match(/\.xlsx$/)) {
                updateFileInfo(file);
            } else {
                alert('Please upload an Excel file (.xlsx)');
                fileInput.value = '';
                resetFileUpload();
            }
        }
    }

    function updateFileInfo(file) {
        fileNameDisplay.textContent = file.name;
        fileUpload.classList.add('has-file');
        initialState.style.display = 'none';
        selectedState.style.display = 'flex';
    }

    function resetFileUpload() {
        fileNameDisplay.textContent = 'No schedule uploaded.';
        fileUpload.classList.remove('has-file');
        initialState.style.display = 'flex';
        selectedState.style.display = 'none';
    }
});

document.addEventListener('DOMContentLoaded', function () {
    const sidebarOpen = document.getElementById('sidebarOpen');
    const sidebar = document.querySelector('.sidebar');
  
    // Toggle sidebar visibility
    sidebarOpen.addEventListener('click', function () {
        sidebar.classList.toggle('active');
    });
  });

  document.addEventListener('DOMContentLoaded', function () {
    const sidebarOpen = document.getElementById('sidebarOpen');
    const sidebar = document.querySelector('.sidebar');
  
    // Toggle sidebar visibility
    sidebarOpen.addEventListener('click', function () {
        sidebar.classList.toggle('active');
    });
  });
  
  document.addEventListener('DOMContentLoaded', function () {
    const sidebarOpen = document.getElementById('sidebarOpen');
    const sidebar = document.querySelector('.sidebar');
  
    // Toggle sidebar visibility
    sidebarOpen.addEventListener('click', function () {
        sidebar.classList.toggle('active');
    });
  });