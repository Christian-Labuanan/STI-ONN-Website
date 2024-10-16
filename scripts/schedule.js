import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getStorage, ref, listAll, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-storage.js";
import { getFirestore, doc, setDoc } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

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
const firestore = getFirestore(app);
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

    // Clear previous data
    fileListDiv.innerHTML = '';

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
            const fileButton = document.createElement('button');
            fileButton.textContent = itemRef.name;
            fileButton.classList.add('btn', 'btn-secondary', 'mb-2', 'me-2');
            fileButton.setAttribute('aria-label', `Load file ${itemRef.name}`);
            fileButton.addEventListener('click', () => loadFileContent(itemRef, floor));
            fileListDiv.appendChild(fileButton);
        });
    } catch (error) {
        console.error("Error listing files:", error);
        hideLoading();
        fileListDiv.innerHTML = `<p>Error loading files for ${floor}. Please try again later.</p>`;
    }
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
    const data = {};

    // Constructing the data object from form inputs
    formData.forEach((value, key) => {
        const [row, col] = key.split('_');
        if (!data[row]) data[row] = {};
        data[row][col] = value;
    });

    // Flatten the data structure
    const sheetData = flattenData(data);
    console.log("Data to save:", sheetData); // Log data for debugging

    try {
        showLoading('Saving changes...');

        const sanitizedFileName = sanitizeName(fileName);
        const sanitizedSheetName = sanitizeName(sheetName);
        console.log("Sanitized File Name:", sanitizedFileName); // Log sanitized names
        console.log("Sanitized Sheet Name:", sanitizedSheetName);

        const sheetRef = doc(firestore, `schedules/${floor}/sheets/${sanitizedFileName}_${sanitizedSheetName}`);

        // Validate that the sheetData is in the correct format
        if (Object.keys(sheetData).length === 0) {
            throw new Error('No data to save');
        }

        // Save the data in Firestore
        await setDoc(sheetRef, { data: sheetData }, { merge: true });

        hideLoading();
        alert('Changes saved successfully!');
    } catch (error) {
        console.error("Error saving changes:", error);
        hideLoading();
        alert('Error saving changes. Please try again. Error details: ' + error.message);
    }
}

// Function to flatten the nested data structure
function flattenData(data) {
    const flattened = {};
    for (const rowKey in data) {
        for (const colKey in data[rowKey]) {
            flattened[`${rowKey}_${colKey}`] = data[rowKey][colKey];
        }
    }
    return flattened;
}

// Function to sanitize document names
function sanitizeName(name) {
    // Replace any characters that are not allowed in Firestore document names
    return name.replace(/[^a-zA-Z0-9_]/g, '_'); // Replace with underscores
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
