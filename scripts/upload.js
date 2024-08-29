import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import { getDatabase, ref as dbRef, set } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-database.js";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-storage.js";

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
const database = getDatabase(app);
const storage = getStorage(app);

// Initialize Quill editor
const quill = new Quill('#editor', {
    theme: 'snow',
    modules: {
        toolbar: [
            [{ 'header': '1' }, { 'header': '2' }, { 'font': [] }],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
            ['bold', 'italic', 'underline'],
            [{ 'color': [] }, { 'background': [] }],
            [{ 'align': [] }],
            ['link', 'image']
        ]
    }
});

// Select form and input elements
const postForm = document.getElementById('postForm');
const imageUpload = document.getElementById('imageUpload');
const cancelButton = document.getElementById('cancelButton');
const postTitle = document.getElementById('postTitle');

postForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const title = postTitle.value; // Get the title from the form
    const text = quill.root.innerHTML; // Get the Quill editor content
    const file = imageUpload.files[0]; // Get the selected file

    if (title && text) {
        try {
            // Generate a unique post ID using the current timestamp
            const postId = Date.now().toString();
            const postRef = dbRef(database, 'posts/' + postId);
            let imageUrl = '';

            // If a file is selected, upload it to Firebase Storage
            if (file) {
                const imageRef = storageRef(storage, 'images/' + postId);
                const snapshot = await uploadBytes(imageRef, file);
                imageUrl = await getDownloadURL(snapshot.ref);
            }

            // Save the post data to the database with a timestamp
            await set(postRef, {
                title: title,
                text: text,
                imageUrl: imageUrl,
                timestamp: new Date().toISOString() // timestamp
            });

        } catch (error) {
            console.error("Error posting content:", error);
            alert("There was an error uploading your post. Please try again.");
        }
    } else {
        alert("Title and text content are required.");
    }

    // Only show the success modal if the post is successfully uploaded
    const successModal = new bootstrap.Modal(document.getElementById('successModal'));
    successModal.show();

    // Redirect after the user clicks the button
    document.getElementById('redirectButton').addEventListener('click', () => {
        window.location.href = 'viewUploads.html';
    });

});

// Handle the cancel button click
cancelButton.addEventListener('click', () => {
    window.location.href = 'viewUploads.html'; // Redirect to the view uploads page or another page
});
