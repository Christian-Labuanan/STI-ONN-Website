import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-storage.js";
import { getDatabase, ref as databaseRef, set, onValue } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-database.js";
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
    const app = initializeApp(firebaseConfig);
    const auth = getAuth();
    const storage = getStorage(app);
    const database = getDatabase(app);

    const instructorCardsContainer = document.getElementById('instructorCards');

    // Display instructor cards
    onValue(databaseRef(database, 'instructors'), (snapshot) => {
        instructorCardsContainer.innerHTML = ""; // Clear existing cards

        snapshot.forEach((childSnapshot) => {
            const instructor = childSnapshot.val();
            const card = createInstructorCard(instructor);
            instructorCardsContainer.appendChild(card);
        });
    });

    // Function to create instructor card
    function createInstructorCard(instructor) {
        const card = document.createElement('div');
        card.classList.add('col-md-4', 'mb-4');
        card.innerHTML = `
            <div class="card" data-bs-toggle="modal" data-bs-target="#instructorDetailModal" data-name="${instructor.name}" data-avatar="${instructor.avatarURL}" data-schedule="${instructor.scheduleURL}">
                <img src="${instructor.avatarURL}" class="card-img-top" alt="${instructor.name}">
                <div class="card-body">
                    <h5 class="card-title">${instructor.name}</h5>
                </div>
            </div>
        `;
        return card;
    }

    // Add event listener for card clicks
    instructorCardsContainer.addEventListener('click', (event) => {
        const card = event.target.closest('.card');
        if (!card) return;

        const name = card.getAttribute('data-name');
        const avatar = card.getAttribute('data-avatar');
        const schedule = card.getAttribute('data-schedule');

        document.getElementById('instructorDetailModalLabel').innerText = name;
        document.getElementById('detailAvatar').src = avatar;
        document.getElementById('excelContent').innerHTML = "";

        displayExcelContent(schedule);
        const detailModal = new bootstrap.Modal(document.getElementById('instructorDetailModal'));
        detailModal.show();
    });

    // Function to display Excel content in modal
    async function displayExcelContent(url) {
        try {
            const response = await fetch(url);
            const data = await response.arrayBuffer();
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const html = XLSX.utils.sheet_to_html(worksheet, { editable: false });
            const caption = `<caption>Schedule for ${document.getElementById('instructorDetailModalLabel').innerText}</caption>`;
            document.getElementById('excelContent').innerHTML = caption + html;
        } catch (error) {
            console.error("Error reading Excel file:", error);
            document.getElementById('excelContent').innerText = "Failed to load schedule.";
        }
    }
});