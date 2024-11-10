import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import { getStorage, ref, uploadBytes, deleteObject  } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-storage.js";


const firebaseConfig = {
    apiKey: "AIzaSyBfZyTFzkgn8hbaPnqNEdslEglKjBkrPPs",
    authDomain: "sti-onn-d0161.firebaseapp.com",
    databaseURL: "https://sti-onn-d0161-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "sti-onn-d0161",
    storageBucket: "sti-onn-d0161.appspot.com",
    messagingSenderId: "538337032363",
    appId: "1:538337032363:web:7e17df22799b2bad85dfee"
};

const app = initializeApp(firebaseConfig);
const storage = getStorage(app);
const auth = getAuth(app);

document.addEventListener('DOMContentLoaded', () => {
    const floorButtons = document.querySelectorAll('.floor-btn');
    floorButtons.forEach(button => {
        button.addEventListener('click', () => {
            const floor = button.dataset.floor;
            loadFloorFiles(floor);
        });
    });
});


window.uploadFile = function(floor) {
    const fileInput = document.getElementById('file-input');
    const file = fileInput.files[0];
    
    if (!file) {
        document.getElementById('upload-status').innerText = 'Please select a file to upload.';
        return;
    }

    const fileRef = ref(storage, `schedules/${floor}/${file.name}`);

    uploadBytes(fileRef, file)
        .then(() => {
            document.getElementById('upload-status').innerText = 'File uploaded successfully!';
        })
        .catch(error => {
            console.error('Error uploading file:', error);
            document.getElementById('upload-status').innerText = 'Error uploading file.';
        });
};

const dropZone = document.querySelector('.file-upload');
const fileInput = document.getElementById('file-input');
let currentFile = null;

// Update the file upload UI
function updateUploadUI(file) {
    const uploadSection = document.querySelector('.file-upload');
    if (file) {
        uploadSection.innerHTML = `
            <i class="bx bx-check-circle fs-1 text-success mb-2"></i>
            <h5>File Selected</h5>
            <p class="text-success mb-0">${file.name}</p>
            <small class="text-muted">Click to change file</small>
        `;
        // Enable floor buttons
        document.querySelectorAll('.btn-floor').forEach(btn => {
            btn.classList.remove('disabled');
            btn.removeAttribute('disabled');
        });
    } else {
        uploadSection.innerHTML = `
            <i class="bx bx-upload fs-1 text-primary mb-2"></i>
            <h5>Upload Excel File</h5>
            <p class="text-muted mb-0">Click to browse or drag and drop your file here</p>
            <input type="file" id="file-input" accept=".xlsx, .xls" class="d-none" aria-label="Upload Excel File">
        `;
        // Disable floor buttons
        document.querySelectorAll('.btn-floor').forEach(btn => {
            btn.classList.add('disabled');
            btn.setAttribute('disabled', 'true');
        });
    }
    // Ensure the file input is always available
    if (!document.getElementById('file-input')) {
        const newFileInput = document.createElement('input');
        newFileInput.type = 'file';
        newFileInput.id = 'file-input';
        newFileInput.accept = '.xlsx, .xls';
        newFileInput.className = 'd-none';
        newFileInput.setAttribute('aria-label', 'Upload Excel File');
        uploadSection.appendChild(newFileInput);
    }
}

// Initialize UI
document.addEventListener('DOMContentLoaded', () => {
    // Initially disable floor buttons
    document.querySelectorAll('.btn-floor').forEach(btn => {
        if (!btn.classList.contains('btn-cancel')) {  // Skip cancel button
            btn.classList.add('disabled');
            btn.setAttribute('disabled', 'true');
        }
    });

    // File input change handler
    document.body.addEventListener('change', (e) => {
        if (e.target && e.target.id === 'file-input') {
            const file = e.target.files[0];
            if (file) {
                if (file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
                    file.type === 'application/vnd.ms-excel') {
                    currentFile = file;
                    updateUploadUI(file);
                } else {
                    alert('Please select an Excel file (.xlsx or .xls)');
                    e.target.value = '';
                    currentFile = null;
                    updateUploadUI(null);
                }
            }
        }
    });

    // Drag and drop handlers
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('drag-over');
    });

    dropZone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
        
        const file = e.dataTransfer.files[0];
        if (file) {
            if (file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
                file.type === 'application/vnd.ms-excel') {
                currentFile = file;
                updateUploadUI(file);
                // Update the file input as well
                const fileInput = document.getElementById('file-input');
                const dataTransfer = new DataTransfer();
                dataTransfer.items.add(file);
                fileInput.files = dataTransfer.files;
            } else {
                alert('Please drop an Excel file (.xlsx or .xls)');
                currentFile = null;
                updateUploadUI(null);
            }
        }
    });

    // Upload handler
    window.uploadFile = function(floor) {
        if (!currentFile) {
            document.getElementById('upload-status').innerHTML = `
                <div class="alert alert-warning" role="alert">
                    Please select a file to upload.
                </div>
            `;
            return;
        }
    
        // Show loading state
        document.getElementById('upload-status').innerHTML = `
            <div class="alert alert-info" role="alert">
                <div class="spinner-border spinner-border-sm me-2" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                Uploading ${currentFile.name} to Floor ${floor}...
            </div>
        `;
    
        const fileRef = ref(storage, `schedules/${floor}/${currentFile.name}`);
    
        uploadBytes(fileRef, currentFile)
            .then(() => {
                // Trigger the success modal
                const successModal = new bootstrap.Modal(document.getElementById('successModal'), {
                    backdrop: 'static', // Prevent closing by clicking outside
                    keyboard: false      // Prevent closing by pressing escape key
                });
    
                successModal.show();
    
                // Redirect after showing modal (with a small delay to allow modal animation)
                setTimeout(() => {
                    window.location.href = 'schedule.html'; // Redirect to schedule.html after modal is shown
                }, 2000); // 2 seconds delay to allow user to see the modal
    
                // Reset the upload form after successful upload
                currentFile = null;
                updateUploadUI(null);
                fileInput.value = '';
            })
            .catch(error => {
                console.error('Error uploading file:', error);
                document.getElementById('upload-status').innerHTML = `
                    <div class="alert alert-danger" role="alert">
                        <i class="bx bx-error-circle me-2"></i>
                        Error uploading file: ${error.message}
                    </div>
                `;
            });
    };
});