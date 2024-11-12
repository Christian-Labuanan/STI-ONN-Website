import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { listAll, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-storage.js";
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

//load file schedules
async function loadFloorFiles(floor) {
    // Check if user is authenticated
    const user = auth.currentUser;
    if (!user) {
        alert('You must be logged in to access files.');
        window.location("login.html");
        return;
    }

    const storageRef = ref(storage, `schedules/${floor}/`);
    const fileListDiv = document.getElementById('fileList');
    const sheetListDiv = document.getElementById('sheetList');
    const sheetDataDiv = document.getElementById('sheetData');

    // Clear previous data
    fileListDiv.innerHTML = '';
    sheetListDiv.innerHTML = '';
    sheetDataDiv.innerHTML = '';

    // Show loading indicator
    showLoading(`Loading files for ${floor}...`);

    try {
        const result = await listAll(storageRef);
        hideLoading();
        fileListDiv.innerHTML = `<h2>Files for ${floor}</h2>`;

        if (result.items.length === 0) {
            fileListDiv.innerHTML += '<p>No schedule files found for this floor.</p>';
            return;
        }

        result.items.forEach((itemRef) => {
            const fileContainer = document.createElement('div');
            fileContainer.classList.add('file-container', 'd-flex', 'align-items-center', 'mb-2');

            // File button
            const fileButton = document.createElement('button');
            fileButton.textContent = itemRef.name;
            fileButton.classList.add('btn', 'btn-secondary', 'me-2');
            fileButton.setAttribute('aria-label', `Load file ${itemRef.name}`);
            fileButton.addEventListener('click', () => loadFileContent(itemRef, floor));

            // Delete icon
            const deleteIcon = document.createElement('span');
            deleteIcon.classList.add('delete-icon', 'ms-2');
            deleteIcon.innerHTML = '&#128465;'; // Trash icon using HTML code
            deleteIcon.style.cursor = 'pointer';
            deleteIcon.style.fontSize = '1.5em'; // Larger size
            deleteIcon.setAttribute('aria-label', `Delete file ${itemRef.name}`);
            deleteIcon.addEventListener('click', () => deleteFile(itemRef, floor));

            // Append file button and delete icon to container
            fileContainer.appendChild(fileButton);
            fileContainer.appendChild(deleteIcon);
            fileListDiv.appendChild(fileContainer);
        });
    } catch (error) {
        console.error("Error listing files:", error);
        hideLoading();
        fileListDiv.innerHTML = `<p>Error loading files for ${floor}. Please try again later.</p>`;
    }
}

// Function to delete a file
let filePathToDelete; // Variable to store the file path for deletion
let floorToReload; // Variable to store the floor to reload after deletion

async function deleteFile(filePath, floor) {
    filePathToDelete = filePath; // Store the file path
    floorToReload = floor; // Store the floor

    // Show the confirmation modal
    const deleteModal = new bootstrap.Modal(document.getElementById('deleteConfirmationModal'));
    deleteModal.show();

    // Add event listener for the confirm delete button
    document.getElementById("confirmDeleteButton").addEventListener("click", async () => {
        const storage = getStorage(); // Get the storage instance
        const itemRef = ref(storage, filePathToDelete); // Create a reference to the file

        try {
            await deleteObject(itemRef); // Delete the file
            deleteModal.hide(); // Hide the delete confirmation modal
            
            // Show the success modal
            const successModal = new bootstrap.Modal(document.getElementById('successModal'));
            successModal.show();

            loadFloorFiles(floorToReload); // Reload the file list to reflect the deletion
        } catch (error) {
            console.error("Error deleting file:", error);
            
            if (error.code === 'storage/object-not-found') {
                alert('File not found. It may have already been deleted.');
            } else {
                alert('Error deleting file. Please try again later.');
            }
        }
    });
}

//load the content of the schedules
let currentWorkbook = null;

async function loadFileContent(itemRef, floor) {
    const sheetListDiv = document.getElementById('sheetList');
    const sheetDataDiv = document.getElementById('sheetData');

    // Clear previous sheet data
    sheetListDiv.innerHTML = '';
    sheetDataDiv.innerHTML = '';

    // Show loading indicator
    showLoading(`Loading content for ${itemRef.name}...`);

    try {
        const downloadURL = await getDownloadURL(itemRef);
        const response = await fetch(downloadURL);
        const data = await response.arrayBuffer();
        currentWorkbook = XLSX.read(new Uint8Array(data), { type: 'array' });
        hideLoading();

        if (currentWorkbook.SheetNames.length === 0) {
            sheetListDiv.innerHTML = '<p>No sheets found in this file.</p>';
            return;
        }

        displaySheetList(currentWorkbook.SheetNames, currentWorkbook, floor, itemRef.name);
    } catch (error) {
        console.error("Error loading file content:", error);
        hideLoading();
        sheetListDiv.innerHTML = '<p>Error loading file content. Please try again.</p>';
    }
}

function displaySheetList(sheetNames, workbook, floor, fileName) {
    const sheetList = document.getElementById('sheetList');
    const sheetDataDiv = document.getElementById('sheetData');

    sheetList.innerHTML = `<h3>Sheets in ${fileName}</h3>`;

    sheetNames.forEach(sheetName => {
        const button = document.createElement('button');
        button.textContent = sheetName;
        button.classList.add('btn', 'btn-info', 'mb-2', 'me-2');
        button.setAttribute('aria-label', `View sheet ${sheetName}`);
        button.addEventListener('click', async () => {
            // Reload the latest workbook data before displaying the sheet
            try {
                showLoading('Loading latest sheet data...');
                const storageRef = ref(storage, `schedules/${floor}/${fileName}`);
                const downloadURL = await getDownloadURL(storageRef);
                const response = await fetch(downloadURL);
                const data = await response.arrayBuffer();
                currentWorkbook = XLSX.read(new Uint8Array(data), { type: 'array' });
                
                const sheet = currentWorkbook.Sheets[sheetName];
                const schedule = XLSX.utils.sheet_to_json(sheet, { header: 1 });
                hideLoading();
                displaySheetData(sheetName, schedule, floor, fileName);
            } catch (error) {
                console.error("Error reloading workbook:", error);
                hideLoading();
                showModal('errorModal');
            }
        });
        sheetList.appendChild(button);
    });
}

async function displaySheetData(sheetName, data, floor, fileName) {
    const sheetDataDiv = document.getElementById('sheetData');
    sheetDataDiv.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-3">
            <h3>Viewing: ${sheetName} (${fileName})</h3>
            <div class="btn-group" role="group">
                <button id="editToggleBtn" class="btn btn-warning">
                    <i class="fas fa-edit me-2"></i>Edit
                </button>
            </div>
        </div>
    `;

    const form = document.createElement('form');
    form.setAttribute('id', 'sheetForm');

    const table = document.createElement('table');
    table.classList.add('table', 'table-bordered', 'table-striped');

    // Store the original data for reference
    const originalData = JSON.parse(JSON.stringify(data));

    const tbody = document.createElement('tbody');
    const maxRows = data.length;
    const maxCols = Math.max(...data.map(row => row.length));

    for (let rowIndex = 0; rowIndex < maxRows; rowIndex++) {
        const tr = document.createElement('tr');
        for (let colIndex = 0; colIndex < maxCols; colIndex++) {
            const td = document.createElement('td');
            
            const textarea = document.createElement('textarea');
            textarea.value = (data[rowIndex] && data[rowIndex][colIndex]) !== undefined ? data[rowIndex][colIndex] : '';
            textarea.name = `cell_${rowIndex}_${colIndex}`;
            textarea.dataset.row = rowIndex;
            textarea.dataset.col = colIndex;
            textarea.classList.add('form-control', 'cell-textarea', 'readonly-textarea');
            
            // Always make first row and first column readonly
            const isHeaderCell = rowIndex === 0 || colIndex === 0;
            if (isHeaderCell) {
                textarea.classList.add('header-cell');
                textarea.style.backgroundColor = '#f8f9fa';
                textarea.style.fontWeight = 'bold';
            }
            
            textarea.readOnly = true;
            textarea.rows = 4;
            textarea.style.resize = 'none';

            td.appendChild(textarea);
            tr.appendChild(td);
        }
        tbody.appendChild(tr);
    }
    
    table.appendChild(tbody);
    form.appendChild(table);

    const saveButton = document.createElement('button');
    saveButton.textContent = 'Save Changes';
    saveButton.classList.add('btn', 'btn-primary', 'mt-3', 'd-none');
    saveButton.setAttribute('type', 'submit');
    saveButton.id = 'saveButton';

    form.appendChild(saveButton);
    sheetDataDiv.appendChild(form);

    let isEditMode = false;
    const editToggleBtn = document.getElementById('editToggleBtn');
    const allTextareas = form.querySelectorAll('textarea');
    const saveBtn = document.getElementById('saveButton');

    function toggleEditMode(enable) {
        isEditMode = enable;
        
        allTextareas.forEach(textarea => {
            const row = parseInt(textarea.dataset.row);
            const col = parseInt(textarea.dataset.col);
            const isHeaderCell = row === 0 || col === 0;
            
            if (!isHeaderCell) {
                textarea.readOnly = !enable;
                if (enable) {
                    textarea.classList.remove('readonly-textarea');
                    textarea.classList.add('editable-textarea');
                } else {
                    textarea.classList.remove('editable-textarea');
                    textarea.classList.add('readonly-textarea');
                }
            }
        });

        if (enable) {
            editToggleBtn.innerHTML = '<i class="fas fa-times me-2"></i>Cancel';
            editToggleBtn.classList.remove('btn-warning');
            editToggleBtn.classList.add('btn-danger');
            saveBtn.classList.remove('d-none');
        } else {
            editToggleBtn.innerHTML = '<i class="fas fa-edit me-2"></i>Edit';
            editToggleBtn.classList.remove('btn-danger');
            editToggleBtn.classList.add('btn-warning');
            saveBtn.classList.add('d-none');
        }
    }

    editToggleBtn.addEventListener('click', () => {
        if (isEditMode) {
            if (confirm('Are you sure you want to cancel editing? All changes will be lost.')) {
                toggleEditMode(false);
                // Restore original values
                allTextareas.forEach(textarea => {
                    const row = parseInt(textarea.dataset.row);
                    const col = parseInt(textarea.dataset.col);
                    textarea.value = (originalData[row] && originalData[row][col]) !== undefined ? originalData[row][col] : '';
                });
            }
        } else {
            toggleEditMode(true);
        }
    });

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        if (!isEditMode) return;

        try {
            showLoading('Saving changes...');

            // Get the current file content first
            const storageRef = ref(storage, `schedules/${floor}/${fileName}`);
            const downloadURL = await getDownloadURL(storageRef);
            const response = await fetch(downloadURL);
            const fileData = await response.arrayBuffer();
            const existingWorkbook = XLSX.read(new Uint8Array(fileData), { type: 'array' });

            // Create updated data array from form
            const updatedData = Array(maxRows).fill().map(() => Array(maxCols).fill(''));
            allTextareas.forEach(textarea => {
                const row = parseInt(textarea.dataset.row);
                const col = parseInt(textarea.dataset.col);
                updatedData[row][col] = textarea.value;
            });

            // Create a new worksheet for the edited sheet
            const newWorksheet = XLSX.utils.aoa_to_sheet(updatedData);

            // Update only the edited sheet in the existing workbook
            existingWorkbook.Sheets[sheetName] = newWorksheet;

            // Convert workbook to binary data
            const workbookBinary = XLSX.write(existingWorkbook, { bookType: 'xlsx', type: 'array' });

            // Upload to Firebase Storage
            const blob = new Blob([workbookBinary], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            await uploadBytes(storageRef, blob);

            hideLoading();
            showModal('successModal');
            toggleEditMode(false);

            // Update the original data reference
            Object.assign(originalData, updatedData);

        } catch (error) {
            console.error('Error saving changes:', error);
            hideLoading();
            showModal('errorModal');
        }
    });
}

function showLoading(message = 'Loading...') {
    // Create or display a loading spinner
    let loadingDiv = document.getElementById('loadingIndicator');
    if (!loadingDiv) {
        loadingDiv = document.createElement('div');
        loadingDiv.id = 'loadingIndicator';
        loadingDiv.classList.add('loading-overlay');
        loadingDiv.innerHTML = `
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
            <p>${message}</p>
        `;
        document.body.appendChild(loadingDiv);
    } else {
        loadingDiv.querySelector('p').textContent = message;
        loadingDiv.style.display = 'flex';
    }
}

function hideLoading() {
    const loadingDiv = document.getElementById('loadingIndicator');
    if (loadingDiv) {
        loadingDiv.style.display = 'none';
    }
}

function showModal(modalId) {
    const modalElement = document.getElementById(modalId);

    if (!modalElement) {
        console.error(`Modal with ID "${modalId}" not found in the DOM.`);
        return;
    }

    const modal = new bootstrap.Modal(modalElement);
    modal.show();
}

document.addEventListener('DOMContentLoaded', () => {
    const postButton = document.getElementById('postButton');
    // Function to toggle dimmed class based on scroll position
    function handleScroll() {
        if (window.scrollY > 100) {
            postButton.classList.add('dimmed');
        } else {
            postButton.classList.remove('dimmed');
        }
    }
    window.addEventListener('scroll', handleScroll);
    handleScroll();
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