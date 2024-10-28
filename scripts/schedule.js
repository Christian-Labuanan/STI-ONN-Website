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
        const workbook = XLSX.read(new Uint8Array(data), { type: 'array' });
        hideLoading();

        if (workbook.SheetNames.length === 0) {
            sheetListDiv.innerHTML = '<p>No sheets found in this file.</p>';
            return;
        }

        displaySheetList(workbook.SheetNames, workbook, floor, itemRef.name);
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
        button.addEventListener('click', () => {
            const sheet = workbook.Sheets[sheetName];
            const schedule = XLSX.utils.sheet_to_json(sheet, { header: 1 });
            displaySheetData(sheetName, schedule, floor, fileName);
        });
        sheetList.appendChild(button);
    });
}

function displaySheetData(sheetName, data, floor, fileName) {
    const sheetDataDiv = document.getElementById('sheetData');
    sheetDataDiv.innerHTML = `<h3>Editing: ${sheetName} (${fileName})</h3>`;

    const form = document.createElement('form');
    form.setAttribute('id', 'sheetForm');

    const table = document.createElement('table');
    table.classList.add('table', 'table-bordered');

    const maxRows = data.length;
    const maxCols = Math.max(...data.map(row => row.length));

    for (let rowIndex = 0; rowIndex < maxRows; rowIndex++) {
        const tr = document.createElement('tr');
        for (let colIndex = 0; colIndex < maxCols; colIndex++) {
            const td = document.createElement('td');

            // Create a textarea for each cell
            const textarea = document.createElement('textarea');
            textarea.value = (data[rowIndex] && data[rowIndex][colIndex]) !== undefined ? data[rowIndex][colIndex] : '';
            textarea.name = `${rowIndex}_${colIndex}`;
            textarea.classList.add('form-control', 'cell-textarea');
            textarea.style.height = '128px'; // Set height for multi-line content
            textarea.style.resize = 'none'; // Prevent resizing

            // Append the textarea to the table cell
            td.appendChild(textarea);
            tr.appendChild(td);
        }
        table.appendChild(tr);
    }

    form.appendChild(table);

    const saveButton = document.createElement('button');
    saveButton.textContent = 'Save Changes';
    saveButton.classList.add('btn', 'btn-primary', 'mt-3');
    saveButton.setAttribute('type', 'submit');
    saveButton.setAttribute('aria-label', 'Save changes to the schedule');

    form.appendChild(saveButton);
    sheetDataDiv.appendChild(form);

    // Handle form submission
    form.addEventListener('submit', (event) => {
        event.preventDefault();
        saveSheetData(sheetName, form, floor, fileName);
    });
}

async function saveSheetData(sheetName, form, floor, fileName) {
    const formData = new FormData(form);
    const updatedData = [];

    // Reconstruct the data from the form inputs to match Excel format
    formData.forEach((value, key) => {
        const [row, col] = key.split('_').map(Number);
        if (!updatedData[row]) updatedData[row] = [];
        updatedData[row][col] = value;
    });

    // Create a new workbook and worksheet
    const newWorkbook = XLSX.utils.book_new();
    const newWorksheet = XLSX.utils.aoa_to_sheet(updatedData);

    // Append the new worksheet to the workbook
    XLSX.utils.book_append_sheet(newWorkbook, newWorksheet, sheetName);

    // Convert workbook to binary data
    const workbookBinary = XLSX.write(newWorkbook, { bookType: 'xlsx', type: 'array' });

    try {
        showLoading('Saving changes...');

        const storageRef = ref(storage, `schedules/${floor}/${fileName}`);
        const blob = new Blob([workbookBinary], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

        // Upload the new Excel file to Firebase Storage
        await uploadBytes(storageRef, blob);

        hideLoading();
        showModal('successModal');
    } catch (error) {
        console.error("Error saving changes to Firebase Storage:", error);
        hideLoading();
        showModal('errorModal');
    }
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

function showModal(modalId) {
    const modalElement = document.getElementById(modalId);

    if (!modalElement) {
        console.error(`Modal with ID "${modalId}" not found in the DOM.`);
        return;
    }

    const modal = new bootstrap.Modal(modalElement);
    modal.show();
}
