import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import { getStorage, ref as storageRef } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-storage.js";
import { getDatabase, ref as databaseRef, onValue, remove } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-database.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js";
import { deleteObject } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-storage.js";


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
    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const database = getDatabase(app);
    const auth = getAuth(app);
    const storage = getStorage(app);
    
    const instructorCardsContainer = document.getElementById('instructorCards');
    const instructorDetailModal = document.getElementById('instructorDetailModal');
    const deleteConfirmationModal = document.getElementById('deleteConfirmationModal');
    const successModal = document.getElementById('successModal'); // Success modal for deletion
    const departmentFilter = document.getElementById('departmentFilter');

    // Add event listener to the department filter dropdown
    departmentFilter.addEventListener('change', (event) => {
        const selectedDepartment = event.target.value;
        loadInstructors(selectedDepartment);  // Reload instructors based on department
    });

    // Initialize all modals
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        new bootstrap.Modal(modal, {
            backdrop: true,
            keyboard: true
        });
    });

    let instructorToDelete = null;

    // Function to show modal properly
    function showModal(modalElement) {
        const modalInstance = bootstrap.Modal.getInstance(modalElement) || 
            new bootstrap.Modal(modalElement, {
                backdrop: true,
                keyboard: true
            });
        modalInstance.show();
    }

    // Function to clean up modal
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

    // Function to create instructor card with Delete, Edit buttons, and Department
    function createInstructorCard(instructor, key) {
        const card = document.createElement('div');
        card.classList.add('col-md-4', 'mb-4');

        // Check if instructor data exists and has required properties
        if (!instructor || !instructor.name || !instructor.avatarURL) {
            console.error('Invalid instructor data:', instructor);
            return card;
        }

        // Default department to 'N/A' if not available
        const department = instructor.department || 'N/A';

        card.innerHTML = `
        <div class="card" data-instructor-id="${key}" 
            data-name="${instructor.name}" 
            data-avatar="${instructor.avatarURL}" 
            data-schedule="${instructor.scheduleURL || ''}">
            <img src="${instructor.avatarURL}" class="card-img-top" alt="${instructor.name}" 
                onerror="this.src='assets/default-avatar.png'">
            <div class="card-body d-flex flex-column">
            <h5 class="card-title"><strong>${instructor.name}</strong></h5>
            <p class="card-text">${instructor.description || ''}</p>
            <p class="card-text">Department: ${department}</p>
            <div class="mt-auto text-center">
                <button class="btn btn-delete" data-instructor-id="${key}">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
            </div>
        </div>
        `;

        const deleteButton = card.querySelector('.btn-delete');
        deleteButton.addEventListener('click', (event) => {
            event.stopPropagation(); // Prevent event bubbling to the card click listener
            instructorToDelete = key; // Set the instructor to delete
            showModal(deleteConfirmationModal); // Show the delete confirmation modal
        });
        return card;
    }

    // Function to load instructors based on the selected department
    function loadInstructors(departmentFilter = 'All') {
        const instructorsRef = databaseRef(database, 'instructors');

        onValue(instructorsRef, (snapshot) => {
            console.log('Fetching instructors data...'); // Debug log
            instructorCardsContainer.innerHTML = '';

            if (!snapshot.exists()) {
                console.log('No instructors data found');
                instructorCardsContainer.innerHTML = '<div class="col-12"><p>No instructors found.</p></div>';
                return;
            }

            const instructorsArray = [];

            snapshot.forEach((childSnapshot) => {
                const instructorData = childSnapshot.val();
                const instructorKey = childSnapshot.key;
                console.log('Instructor data:', instructorData); // Debug log

                // If a department filter is set, only include instructors from that department
                if (departmentFilter !== 'All' && instructorData.department !== departmentFilter) {
                    return;  // Skip this instructor if the department doesn't match the filter
                }

                instructorsArray.push({ key: instructorKey, ...instructorData });
            });

            // Sort instructors by timestamp (assumes `timestamp` is present in the data)
            instructorsArray.sort((a, b) => b.timestamp - a.timestamp); // Newest first

            // Create cards for each instructor and prepend them to the container
            instructorsArray.forEach(instructor => {
                const card = createInstructorCard(instructor, instructor.key);
                instructorCardsContainer.appendChild(card);
            });
        }, (error) => {
            console.error('Error loading instructors:', error);
            instructorCardsContainer.innerHTML = '<div class="col-12"><p>Error loading instructors.</p></div>';
        });
    }

    // Handle card clicks
    instructorCardsContainer.addEventListener('click', (event) => {
        if (event.target.matches('.delete-icon')) {
            instructorToDelete = event.target.getAttribute('data-instructor-id');
            showModal(deleteConfirmationModal); // Show the confirmation modal
        } else {
            const card = event.target.closest('.card');
            if (!card) return;

            const name = card.getAttribute('data-name');
            const avatar = card.getAttribute('data-avatar');
            const schedule = card.getAttribute('data-schedule');

            // Update modal content
            const modalTitle = document.getElementById('instructorDetailModalLabel');
            const modalAvatar = document.getElementById('detailAvatar');
            const excelContent = document.getElementById('excelContent');

            if (modalTitle) modalTitle.textContent = name;
            if (modalAvatar) modalAvatar.src = avatar;
            if (excelContent) excelContent.innerHTML = '';

            // Show modal with updated content
            showModal(instructorDetailModal);

            if (schedule) {
                displayExcelContent(schedule);
            }
        }
    });

    // Display Excel content function
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

    // Handle delete confirmation
    document.getElementById('confirmDeleteButton').addEventListener('click', () => {
        if (instructorToDelete) {
            deleteInstructor(instructorToDelete); // Call your delete function
            instructorToDelete = null; // Reset the variable
            cleanupModal(); // Clean up the modal
        }
    });

// Function to delete instructor
function deleteInstructor(instructorId) {
    const instructorRef = databaseRef(database, `instructors/${instructorId}`);
    
    // Retrieve instructor data to confirm it exists
    onValue(instructorRef, (snapshot) => {
        if (snapshot.exists()) {
            const instructorData = snapshot.val();

            // Get the URLs for the avatar and schedule file
            const avatarURL = instructorData.avatarURL;
            const scheduleURL = instructorData.scheduleURL;

            // Delete the avatar image from Firebase Storage
            if (avatarURL) {
                const avatarRef = storageRef(storage, decodeURIComponent(avatarURL.split('/o/')[1].split('?')[0])); // Extract the path
                deleteObject(avatarRef)
                    .then(() => {
                        console.log("Avatar image deleted successfully.");
                    })
                    .catch((error) => {
                        console.error("Error deleting avatar image:", error);
                    });
            } else {
                console.warn("No avatar URL found for instructor:", instructorId);
            }

            // Delete the schedule file from Firebase Storage
            if (scheduleURL) {
                const scheduleRef = storageRef(storage, decodeURIComponent(scheduleURL.split('/o/')[1].split('?')[0])); // Extract the path
                deleteObject(scheduleRef)
                    .then(() => {
                        console.log("Schedule file deleted successfully.");
                    })
                    .catch((error) => {
                        console.error("Error deleting schedule file:", error);
                    });
            } else {
                console.warn("No schedule URL found for instructor:", instructorId);
            }

            // Finally, delete the instructor data from Realtime Database
            remove(instructorRef)
                .then(() => {
                    console.log('Instructor deleted successfully from database');
                    showModal(successModal); // Show success modal
                    loadInstructors(); // Reload instructors after deletion
                    
                    // Hide delete confirmation modal
                    const deleteModalInstance = bootstrap.Modal.getInstance(deleteConfirmationModal);
                    if (deleteModalInstance) deleteModalInstance.hide();
                })
                .catch((error) => {
                    console.error('Error deleting instructor from database:', error);
                });
        } else {
            console.warn('Instructor not found in database:', instructorId);
        }
    }, { onlyOnce: true });
}


    // Handle authentication state
    onAuthStateChanged(auth, (user) => {
        if (user) {
            // User is signed in, load instructors
            loadInstructors();
        } else {
            // User is signed out, redirect to login
            window.location.href = 'login.html';
        }
    });

    // Initialize tooltips if you're using them
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
});
