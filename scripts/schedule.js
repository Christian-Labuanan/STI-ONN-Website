// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-storage.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBfZyTFzkgn8hbaPnqNEdslEglKjBkrPPs",
    authDomain: "sti-onn-d0161.firebaseapp.com",
    databaseURL: "https://sti-onn-d0161-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "sti-onn-d0161",
    storageBucket: "sti-onn-d0161.appspot.com",
    messagingSenderId: "538337032363",
    appId: "1:538337032363:web:7e17df22799b2bad85dfee"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const storage = getStorage(app);
const firestore = getFirestore(app);

// Handle file upload
document.getElementById('uploadButton').addEventListener('click', () => {
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
            // Handle upload progress
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            console.log(`Upload is ${progress}% done`);
        }, 
        (error) => {
            console.error("Upload failed:", error);
        }, 
        async () => {
            // Handle successful uploads
            try {
                const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                console.log('File available at', downloadURL);
                // Optionally, process the file further
                processFile(file);
            } catch (error) {
                console.error("Error getting download URL:", error);
            }
        }
    );
});

function processFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, {type: 'array'});

        // Display sheet names for selection
        displaySheetList(workbook.SheetNames);
        
        workbook.SheetNames.forEach(sheetName => {
            const sheet = workbook.Sheets[sheetName];
            const schedule = XLSX.utils.sheet_to_json(sheet);

            // Save schedule to Firestore
            setDoc(doc(firestore, 'schedules', sheetName), { schedule })
                .then(() => {
                    console.log(`Schedule for ${sheetName} successfully uploaded!`);
                })
                .catch((error) => {
                    console.error("Error writing document: ", error);
                });
        });
    };
    reader.readAsArrayBuffer(file);
}

function displaySheetList(sheetNames) {
    const sheetList = document.getElementById('sheetList');
    sheetList.innerHTML = '';
    sheetNames.forEach(sheetName => {
        const button = document.createElement('button');
        button.textContent = sheetName;
        button.addEventListener('click', () => loadSheetData(sheetName));
        sheetList.appendChild(button);
    });
}

function loadSheetData(sheetName) {
    getDoc(doc(firestore, 'schedules', sheetName)).then((doc) => {
        if (doc.exists()) {
            displaySheetData(sheetName, doc.data().schedule);
        } else {
            console.error("No such document!");
        }
    }).catch((error) => {
        console.error("Error getting document:", error);
    });
}

function displaySheetData(sheetName, data) {
    const sheetDataDiv = document.getElementById('sheetData');
    sheetDataDiv.innerHTML = '';

    const form = document.createElement('form');
    data.forEach((row, rowIndex) => {
        Object.keys(row).forEach(key => {
            const input = document.createElement('input');
            input.type = 'text';
            input.name = `${rowIndex}_${key}`;
            input.value = row[key];
            form.appendChild(input);
        });
        form.appendChild(document.createElement('br'));
    });

    const saveButton = document.createElement('button');
    saveButton.textContent = 'Save Changes';
    saveButton.addEventListener('click', (event) => {
        event.preventDefault();
        saveSheetData(sheetName, form);
    });

    form.appendChild(saveButton);
    sheetDataDiv.appendChild(form);
}

function saveSheetData(sheetName, form) {
    const data = {};
    new FormData(form).forEach((value, key) => {
        const [rowIndex, columnName] = key.split('_');
        if (!data[rowIndex]) {
            data[rowIndex] = {};
        }
        data[rowIndex][columnName] = value;
    });

    const formattedData = Object.values(data);

    setDoc(doc(firestore, 'schedules', sheetName), { schedule: formattedData })
        .then(() => {
            console.log(`Schedule for ${sheetName} successfully updated!`);
        })
        .catch((error) => {
            console.error("Error writing document: ", error);
        });
}
