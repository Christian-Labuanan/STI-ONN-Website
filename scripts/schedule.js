// Firebase initialization
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import { getStorage, ref, uploadBytesResumable, getDownloadURL, listAll } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-storage.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

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

const app = initializeApp(firebaseConfig);
const storage = getStorage(app);
const firestore = getFirestore(app);

// Load and display previously uploaded files on page load
document.addEventListener('DOMContentLoaded', async () => {
    await loadUploadedFiles();
});

async function loadUploadedFiles() {
    const storageRef = ref(storage, 'schedules/');
    
    try {
        const result = await listAll(storageRef);
        const uploadedFilesDiv = document.getElementById('uploadedFiles');
        uploadedFilesDiv.innerHTML = ''; // Clear existing list

        result.items.forEach((itemRef) => {
            const fileButton = document.createElement('button');
            fileButton.textContent = itemRef.name;
            fileButton.classList.add('btn', 'btn-primary', 'mb-2');
            
            fileButton.addEventListener('click', async () => {
                const downloadURL = await getDownloadURL(itemRef);
                loadFileContent(downloadURL, itemRef.name);
            });

            uploadedFilesDiv.appendChild(fileButton);
        });

    } catch (error) {
        console.error("Error listing files:", error);
    }
}

// Handle file upload
document.getElementById('uploadButton').addEventListener('click', async () => {
    const fileInput = document.getElementById('fileInput');
    const file = fileInput.files[0];

    if (!file) {
        alert("Please select a file first.");
        return;
    }

    const storageRef = ref(storage, `schedules/${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on('state_changed',
        (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            console.log(`Upload is ${progress}% done`);
        },
        (error) => {
            console.error("Upload failed:", error);
        },
        async () => {
            try {
                const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                console.log('File available at', downloadURL);
                await loadUploadedFiles(); // Refresh the list of uploaded files
            } catch (error) {
                console.error("Error getting download URL:", error);
            }
        }
    );
});

// Load and display content of the clicked Excel file
async function loadFileContent(downloadURL, fileName) {
    const response = await fetch(downloadURL);
    const data = await response.arrayBuffer();
    const workbook = XLSX.read(data, { type: 'array' });

    displaySheetList(workbook.SheetNames, workbook);
}

function displaySheetList(sheetNames, workbook) {
    const sheetList = document.getElementById('sheetList');
    sheetList.innerHTML = '';

    sheetNames.forEach(sheetName => {
        const button = document.createElement('button');
        button.textContent = sheetName;
        button.classList.add('btn', 'btn-secondary', 'mb-2');

        button.addEventListener('click', () => {
            const sheet = workbook.Sheets[sheetName];
            const schedule = XLSX.utils.sheet_to_json(sheet, { header: 1 });
            displaySheetData(sheetName, schedule);
        });

        sheetList.appendChild(button);
    });
}

function displaySheetData(sheetName, data) {
    const sheetDataDiv = document.getElementById('sheetData');
    sheetDataDiv.innerHTML = '';

    const form = document.createElement('form');
    const maxRows = 25; // Define max rows
    const maxCols = 7;  // Define max columns

    const table = document.createElement('table');
    table.style.borderCollapse = 'collapse';
    table.style.width = '100%';

    for (let rowIndex = 0; rowIndex < maxRows; rowIndex++) {
        const row = document.createElement('tr');

        for (let colIndex = 0; colIndex < maxCols; colIndex++) {
            const cell = document.createElement('td');
            const textarea = document.createElement('textarea');
            textarea.rows = 3;
            textarea.cols = 20;

            textarea.style.width = '100%';
            textarea.style.height = '115px';
            textarea.style.lineHeight = '30px';
            textarea.style.verticalAlign = 'middle';
            textarea.style.border = '1px solid #ccc';
            textarea.style.padding = '5px';
            textarea.style.boxSizing = 'border-box';
            textarea.style.fontSize = '16px';
            textarea.style.resize = 'none';

            if (data[rowIndex] && data[rowIndex][colIndex] !== undefined) {
                textarea.value = data[rowIndex][colIndex];
            } else {
                textarea.value = '';
            }

            cell.style.width = '150px';
            cell.style.height = 'auto';
            cell.style.padding = '5px';
            cell.style.boxSizing = 'border-box';

            cell.appendChild(textarea);
            row.appendChild(cell);
        }

        table.appendChild(row);
    }

    const saveButton = document.createElement('button');
    saveButton.textContent = 'Save Changes';
    saveButton.addEventListener('click', (event) => {
        event.preventDefault();
        saveSheetData(sheetName, form);
    });

    form.appendChild(table);
    form.appendChild(saveButton);
    sheetDataDiv.appendChild(form);
}

async function saveSheetData(sheetName, form) {
    const data = {};
    new FormData(form).forEach((value, key) => {
        const [rowIndex, columnName] = key.split('_');
        if (!data[rowIndex]) {
            data[rowIndex] = {};
        }
        data[rowIndex][columnName] = value;
    });

    const formattedData = Object.values(data);

    try {
        await setDoc(doc(firestore, 'schedules', sheetName), { schedule: formattedData });
        console.log(`Schedule for ${sheetName} successfully updated!`);
    } catch (error) {
        console.error("Error writing document: ", error);
    }
}
