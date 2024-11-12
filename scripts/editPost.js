import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import { getDatabase, ref, get, update } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-database.js";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-storage.js";

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

// Get postId from URL
const urlParams = new URLSearchParams(window.location.search);
const postId = urlParams.get('postId');

// Get references to DOM elements
const postTitle = document.getElementById('postTitle');
const postImage = document.getElementById('postImage');
const currentImage = document.getElementById('currentImage');
const editPostForm = document.getElementById('editPostForm');

// Load the post data into the form
async function loadPostData() {
    if (!postId) return;

    try {
        const postRef = ref(database, `posts/${postId}`);
        const snapshot = await get(postRef);
        if (snapshot.exists()) {
            const postData = snapshot.val();
            postTitle.value = postData.title;
            quill.setContents(quill.clipboard.convert(postData.text));

            if (postData.imageUrl) {
                currentImage.src = postData.imageUrl;
                currentImage.style.display = 'block';
            }
        } else {
            console.log('No post found with the given ID.');
        }
    } catch (error) {
        console.error('Error loading post data:', error);
    }
}

// Update the post in Firebase
editPostForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const updatedTitle = postTitle.value.trim();
    const updatedText = quill.root.innerHTML.trim();
    let imageUrl = currentImage.src;

    // Check if a new image was uploaded
    if (postImage.files.length > 0) {
        const imageFile = postImage.files[0];
        const storageReference = storageRef(storage, `images/${postId}/${imageFile.name}`);
        await uploadBytes(storageReference, imageFile);
        imageUrl = await getDownloadURL(storageReference);
    }

    const updatedData = {
        title: updatedTitle,
        text: updatedText,
        imageUrl: imageUrl,
        timestamp: new Date().toISOString(),
    };

    try {
        const postRef = ref(database, `posts/${postId}`);
        await update(postRef, updatedData);

        // Only show the success modal if the post is successfully uploaded
        const successModal = new bootstrap.Modal(document.getElementById('successModal'));
        successModal.show();

        // Redirect after the user clicks the button
        document.getElementById('redirectButton').addEventListener('click', () => {
            window.location.href = 'viewUploads.html';
        });

    } catch (error) {
        console.error('Error updating post:', error);
        alert('Failed to update post.');
    }
});

// Handle the cancel button click
cancelButton.addEventListener('click', () => {
    window.location.href = 'viewUploads.html'; // Redirect to the view uploads page or another page
});

// Load the post data when the page loads
window.addEventListener('DOMContentLoaded', loadPostData);

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