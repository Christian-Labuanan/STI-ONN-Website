import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import { getStorage, ref as storageRef } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-storage.js";
import { getDatabase, ref as databaseRef, onValue, remove } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-database.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js";
import { deleteObject } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-storage.js";

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

document.addEventListener('DOMContentLoaded', () => {
    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const database = getDatabase(app);
    const auth = getAuth(app);
    const storage = getStorage(app);
    
    // DOM elements
    const instructorCardsContainer = document.getElementById('instructorCards');
    const instructorDetailModal = document.getElementById('instructorDetailModal');
    const deleteConfirmationModal = document.getElementById('deleteConfirmationModal');
    const successModal = document.getElementById('successModal');
    const departmentFilter = document.getElementById('departmentFilter');

    // Add Mass Delete Controls
    const massDeleteControl = document.createElement('div');
    massDeleteControl.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-3">
            <button id="massDeleteToggle" class="btn btn-secondary">Delete</button>
        </div>
        <div id="bulkActionControls" class="d-none">
            <div class="d-flex justify-content-between align-items-center mb-3">
                <div>
                    <span id="selectedCount" class="me-2">0 selected</span>
                    <button id="bulkDeleteBtn" class="btn btn-danger" disabled>
                        <i class="fas fa-trash"></i> Delete Selected
                    </button>
                </div>
                <div>
                    <button id="selectAllBtn" class="btn btn-secondary">Select All</button>
                </div>
            </div>
        </div>
    `;
    instructorCardsContainer.parentNode.insertBefore(massDeleteControl, instructorCardsContainer);

    // Set for tracking selected instructors
    const selectedInstructors = new Set();

    // Initialize all modals
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        new bootstrap.Modal(modal);
    });

    // Modal utility functions
    function showModal(modalElement) {
        const modalInstance = bootstrap.Modal.getInstance(modalElement) || 
            new bootstrap.Modal(modalElement);
        modalInstance.show();
    }

    function cleanupModal() {
        document.body.classList.remove('modal-open');
        const backdrops = document.querySelectorAll('.modal-backdrop');
        backdrops.forEach(backdrop => backdrop.remove());
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
    }

    // Add modal event listeners
    instructorDetailModal.addEventListener('hidden.bs.modal', cleanupModal);
    deleteConfirmationModal.addEventListener('hidden.bs.modal', cleanupModal);
    successModal.addEventListener('hidden.bs.modal', cleanupModal);

    // Update selected count and button state
    function updateSelectedCount() {
        const count = selectedInstructors.size;
        document.getElementById('selectedCount').textContent = `${count} selected`;
        document.getElementById('bulkDeleteBtn').disabled = count === 0;
    }

    // Mass Delete Toggle Functionality
    const massDeleteToggle = document.getElementById('massDeleteToggle');
    const bulkActionControls = document.getElementById('bulkActionControls');

    massDeleteToggle.addEventListener('click', () => {
        const isActive = bulkActionControls.classList.contains('d-none');
        
        // Toggle controls visibility
        bulkActionControls.classList.toggle('d-none');
        massDeleteToggle.textContent = isActive ? 'Cancel Delete' : 'Delete';
        massDeleteToggle.classList.toggle('btn-secondary');
        massDeleteToggle.classList.toggle('btn-danger');
        
        // Show/hide checkboxes
        document.querySelectorAll('.card-header').forEach(header => {
            header.style.display = isActive ? 'block' : 'none';
        });
        
        // Clear selections when canceling
        if (!isActive) {
            selectedInstructors.clear();
            updateSelectedCount();
            document.querySelectorAll('.select-instructor').forEach(checkbox => {
                checkbox.checked = false;
            });
            document.getElementById('selectAllBtn').textContent = 'Select All';
        }
    });

    // Create instructor card function
    function createInstructorCard(instructor, key) {
        const card = document.createElement('div');
        card.classList.add('col-md-4', 'mb-4');
        
        if (!instructor || !instructor.name || !instructor.avatarURL) {
            console.error('Invalid instructor data:', instructor);
            return card;
        }

        const department = instructor.department || 'N/A';

        card.innerHTML = `
        <div class="card" data-instructor-id="${key}" 
            data-name="${instructor.name}" 
            data-avatar="${instructor.avatarURL}" 
            data-schedule="${instructor.scheduleURL || ''}">
            <div class="card-header p-2" style="display: none;">
                <div class="form-check">
                    <input class="form-check-input select-instructor" type="checkbox" value="${key}" id="check_${key}">
                    <label class="form-check-label" for="check_${key}">Select</label>
                </div>
            </div>
            <img src="${instructor.avatarURL}" class="card-img-top" alt="${instructor.name}" 
                onerror="this.src='assets/default-avatar.png'">
            <div class="card-body d-flex flex-column">
                <h5 class="card-title"><strong>${instructor.name}</strong></h5>
                <p class="card-text">${instructor.description || ''}</p>
                <p class="card-text">Department: ${department}</p>
                <div class="mt-auto">
                    <a href="instructorEdit.html?id=${key}" class="btn btn-primary">
                        <i class="bx bx-edit"></i> Edit
                    </a>
                </div>
            </div>
        </div>
        `;

        // Add checkbox event listener
        const checkbox = card.querySelector('.select-instructor');
        checkbox.addEventListener('change', (e) => {
            if (e.target.checked) {
                selectedInstructors.add(key);
            } else {
                selectedInstructors.delete(key);
            }
            updateSelectedCount();
        });

        // Add card click event (for viewing details)
        card.addEventListener('click', (e) => {
            // Don't trigger details view when clicking checkbox or in mass delete mode
            if (!e.target.classList.contains('form-check-input') && 
                bulkActionControls.classList.contains('d-none')) {
                const cardElement = e.currentTarget.querySelector('.card');
                showInstructorDetails(cardElement);
            }
        });

        return card;
    }

    // Show instructor details
    function showInstructorDetails(cardElement) {
        const name = cardElement.getAttribute('data-name');
        const avatar = cardElement.getAttribute('data-avatar');
        const schedule = cardElement.getAttribute('data-schedule');

        const modalTitle = document.getElementById('instructorDetailModalLabel');
        const modalAvatar = document.getElementById('detailAvatar');
        const excelContent = document.getElementById('excelContent');

        modalTitle.textContent = name;
        modalAvatar.src = avatar;
        excelContent.innerHTML = '';

        showModal(instructorDetailModal);

        if (schedule) {
            displayExcelContent(schedule);
        }
    }

    // Display Excel content
    async function displayExcelContent(url) {
        if (!url) {
            document.getElementById('excelContent').innerHTML = '<p>No schedule available.</p>';
            return;
        }

        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error('Failed to fetch schedule');
            
            const data = await response.arrayBuffer();
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const html = XLSX.utils.sheet_to_html(worksheet, { editable: false });
            
            const instructorName = document.getElementById('instructorDetailModalLabel').textContent;
            const caption = `<caption>Schedule for ${instructorName}</caption>`;
            document.getElementById('excelContent').innerHTML = caption + html;
        } catch (error) {
            console.error("Error reading Excel file:", error);
            document.getElementById('excelContent').innerHTML = '<p>Failed to load schedule.</p>';
        }
    }

    // Load instructors function
    function loadInstructors(departmentFilter = 'All') {
        const instructorsRef = databaseRef(database, 'instructors');

        onValue(instructorsRef, (snapshot) => {
            console.log('Fetching instructors data...');
            instructorCardsContainer.innerHTML = '';
            selectedInstructors.clear();
            updateSelectedCount();

            if (!snapshot.exists()) {
                console.log('No instructors data found');
                instructorCardsContainer.innerHTML = '<div class="col-12"><p>No instructors found.</p></div>';
                return;
            }

            const instructorsArray = [];

            snapshot.forEach((childSnapshot) => {
                const instructorData = childSnapshot.val();
                const instructorKey = childSnapshot.key;

                if (departmentFilter === 'All' || instructorData.department === departmentFilter) {
                    instructorsArray.push({ key: instructorKey, ...instructorData });
                }
            });

            instructorsArray.sort((a, b) => b.timestamp - a.timestamp);

            instructorsArray.forEach(instructor => {
                const card = createInstructorCard(instructor, instructor.key);
                instructorCardsContainer.appendChild(card);
            });
        }, (error) => {
            console.error('Error loading instructors:', error);
            instructorCardsContainer.innerHTML = '<div class="col-12"><p>Error loading instructors.</p></div>';
        });
    }

    // Delete multiple instructors function
    async function deleteMultipleInstructors(instructorIds) {
        const deletePromises = Array.from(instructorIds).map(async (id) => {
            const instructorRef = databaseRef(database, `instructors/${id}`);
            
            try {
                const snapshot = await new Promise((resolve, reject) => {
                    onValue(instructorRef, resolve, { onlyOnce: true });
                });

                if (snapshot.exists()) {
                    const instructorData = snapshot.val();
                    const deletePromises = [];

                    // Delete avatar
                    if (instructorData.avatarURL) {
                        const avatarPath = decodeURIComponent(instructorData.avatarURL.split('/o/')[1].split('?')[0]);
                        const avatarRef = storageRef(storage, avatarPath);
                        deletePromises.push(deleteObject(avatarRef));
                    }

                    // Delete schedule
                    if (instructorData.scheduleURL) {
                        const schedulePath = decodeURIComponent(instructorData.scheduleURL.split('/o/')[1].split('?')[0]);
                        const scheduleRef = storageRef(storage, schedulePath);
                        deletePromises.push(deleteObject(scheduleRef));
                    }

                    // Delete database entry
                    deletePromises.push(remove(instructorRef));

                    await Promise.all(deletePromises);
                    return true;
                }
            } catch (error) {
                console.error(`Error deleting instructor ${id}:`, error);
                return false;
            }
        });

        const results = await Promise.all(deletePromises);
        const successCount = results.filter(result => result).length;
        
        const successModalBody = successModal.querySelector('.modal-body');
        successModalBody.textContent = `Successfully deleted ${successCount} instructor${successCount !== 1 ? 's' : ''}.`;
        
        showModal(successModal);
        selectedInstructors.clear();
        updateSelectedCount();
        
        // Reset mass delete mode
        massDeleteToggle.click();
        
        loadInstructors(departmentFilter.value);
    }

    // Event Listeners
    departmentFilter.addEventListener('change', (event) => {
        loadInstructors(event.target.value);
    });

    document.getElementById('bulkDeleteBtn').addEventListener('click', () => {
        if (selectedInstructors.size > 0) {
            const modalBody = deleteConfirmationModal.querySelector('.modal-body');
            modalBody.textContent = `Are you sure you want to delete ${selectedInstructors.size} selected instructor${selectedInstructors.size !== 1 ? 's' : ''}?`;
            
            const confirmDeleteBtn = document.getElementById('confirmDeleteButton');
            confirmDeleteBtn.onclick = () => {
                deleteMultipleInstructors(selectedInstructors);
                bootstrap.Modal.getInstance(deleteConfirmationModal).hide();
            };
            
            showModal(deleteConfirmationModal);
        }
    });

    document.getElementById('selectAllBtn').addEventListener('click', function() {
        const checkboxes = document.querySelectorAll('.select-instructor');
        const isSelectAll = this.textContent === 'Select All';
        
        checkboxes.forEach(checkbox => {
            checkbox.checked = isSelectAll;
            if (isSelectAll) {
                selectedInstructors.add(checkbox.value);
            } else {
                selectedInstructors.delete(checkbox.value);
            }
        });
        
        this.textContent = isSelectAll ? 'Deselect All' : 'Select All';
        updateSelectedCount();
    });

    // Initialize tooltips
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });

    // Handle authentication state
    onAuthStateChanged(auth, (user) => {
        if (user) {
            loadInstructors();
        } else {
            window.location.href = 'login.html';
        }
    });
});

// Handle edit button click
document.querySelectorAll('.card .btn-primary').forEach(button => {
    button.addEventListener('click', (e) => {
        const card = e.target.closest('.card');
        const instructorId = card.getAttribute('data-instructor-id');
        window.location.href = `editInstructor.html?id=${instructorId}`;
    });
});