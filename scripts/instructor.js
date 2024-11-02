import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-storage.js";
import { getDatabase, ref as databaseRef, set, onValue, remove } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-database.js";
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
    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const database = getDatabase(app);
    const auth = getAuth(app);
    const storage = getStorage(app);
    
    const instructorCardsContainer = document.getElementById('instructorCards');
    const instructorDetailModal = document.getElementById('instructorDetailModal');
    const deleteConfirmationModal = document.getElementById('deleteConfirmationModal');
    const successModal = document.getElementById('successModal'); // Success modal for deletion

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

    // Function to create instructor card
    function createInstructorCard(instructor, key) {
        const card = document.createElement('div');
        card.classList.add('col-md-4', 'mb-4');

        // Check if instructor data exists and has required properties
        if (!instructor || !instructor.name || !instructor.avatarURL) {
            console.error('Invalid instructor data:', instructor);
            return card;
        }

        card.innerHTML = `
            <div class="card" data-instructor-id="${key}"
                data-name="${instructor.name}" 
                data-avatar="${instructor.avatarURL}" 
                data-schedule="${instructor.scheduleURL || ''}">
                <img src="${instructor.avatarURL}" class="card-img-top" alt="${instructor.name}" 
                    onerror="this.src='assets/default-avatar.png'">
                <div class="card-body">
                    <h5 class="card-title">${instructor.name}</h5>
                    <button class="delete-icon btn btn-sm" data-instructor-id="${key}" title="Delete Instructor">
                        <i class="fas fa-trash-alt delete-icon" data-instructor-id="${key}" style="cursor: pointer;"></i>
                    </button>
                </div>
            </div>
        `;
        return card;
    }

    // Load and display instructor cards
    function loadInstructors() {
        const instructorsRef = databaseRef(database, 'instructors');
        
        onValue(instructorsRef, (snapshot) => {
            console.log('Fetching instructors data...'); // Debug log
            instructorCardsContainer.innerHTML = '';
            
            if (!snapshot.exists()) {
                console.log('No instructors data found');
                instructorCardsContainer.innerHTML = '<div class="col-12"><p>No instructors found.</p></div>';
                return;
            }

            snapshot.forEach((childSnapshot) => {
                const instructorData = childSnapshot.val();
                const instructorKey = childSnapshot.key;
                console.log('Instructor data:', instructorData); // Debug log
                
                const card = createInstructorCard(instructorData, instructorKey);
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
        remove(instructorRef)
            .then(() => {
                console.log('Instructor deleted successfully');
                showModal(successModal); // Show success modal
                loadInstructors(); // Reload instructors after deletion
                // Hide delete confirmation modal
                const deleteModalInstance = bootstrap.Modal.getInstance(deleteConfirmationModal);
                if (deleteModalInstance) deleteModalInstance.hide();
            })
            .catch((error) => {
                console.error('Error deleting instructor:', error);
            });
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
