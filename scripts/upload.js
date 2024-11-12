// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import { getDatabase, ref as dbRef, set } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-database.js";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-storage.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js";

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

// Initialize Firebase services
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const storage = getStorage(app);
const auth = getAuth();

// Initialize UI elements
const postForm = document.getElementById('postForm');
const imageUpload = document.getElementById('imageUpload');
const cancelButton = document.getElementById('cancelButton');
const postTitle = document.getElementById('postTitle');
const loadingIndicator = document.getElementById('loadingIndicator');
const currentImage = document.getElementById('currentImage');
const removeImageBtn = document.getElementById('removeImage');
const imageUploadContainer = document.getElementById('imageUploadContainer');

// Initialize Quill editor with your configuration
const quill = new Quill('#quillEditor', {
    theme: 'snow',
    placeholder: 'Write your announcement content here...',
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

// Image handling functions
function showLoadingIndicator() {
    loadingIndicator.style.display = 'block';
}

function hideLoadingIndicator() {
    loadingIndicator.style.display = 'none';
}

function showImagePreview(src) {
    currentImage.src = src;
    currentImage.style.display = 'block';
    removeImageBtn.style.display = 'flex';
}

function clearImagePreview() {
    currentImage.src = '';
    currentImage.style.display = 'none';
    removeImageBtn.style.display = 'none';
    imageUpload.value = '';
}

// Image upload event listeners
imageUploadContainer.addEventListener('click', () => {
    imageUpload.click();
});

imageUploadContainer.addEventListener('dragover', (e) => {
    e.preventDefault();
    imageUploadContainer.style.borderColor = getComputedStyle(document.documentElement)
        .getPropertyValue('--primary-color').trim();
    imageUploadContainer.style.backgroundColor = 'rgba(99, 102, 241, 0.05)';
});

imageUploadContainer.addEventListener('dragleave', (e) => {
    e.preventDefault();
    imageUploadContainer.style.borderColor = getComputedStyle(document.documentElement)
        .getPropertyValue('--border-color').trim();
    imageUploadContainer.style.backgroundColor = getComputedStyle(document.documentElement)
        .getPropertyValue('--background-color').trim();
});

imageUploadContainer.addEventListener('drop', (e) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        handleImageFile(files[0]);
    }
});

imageUpload.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        handleImageFile(e.target.files[0]);
    }
});

removeImageBtn.addEventListener('click', clearImagePreview);

function handleImageFile(file) {
    if (file.type.startsWith('image/')) {
        showLoadingIndicator();
        const reader = new FileReader();
        reader.onload = function(e) {
            hideLoadingIndicator();
            showImagePreview(e.target.result);
        };
        reader.readAsDataURL(file);
    } else {
        alert('Please upload an image file (PNG, JPG, or GIF)');
    }
}

// Form submission handler
postForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const user = auth.currentUser;
    if (!user) {
        alert('You must be logged in to post announcements.');
        return;
    }

    const title = postTitle.value.trim();
    const text = quill.root.innerHTML;
    const file = imageUpload.files[0];

    if (!title || !text) {
        alert("Title and text content are required.");
        return;
    }

    // Show loading state
    const submitButton = postForm.querySelector('button[type="submit"]');
    const originalButtonText = submitButton.innerHTML;
    submitButton.disabled = true;
    submitButton.innerHTML = '<span class="spinner"></span> Publishing...';

    try {
        const postId = Date.now().toString();
        const postRef = dbRef(database, 'posts/' + postId);
        let imageUrl = '';

        if (file) {
            const imageRef = storageRef(storage, 'images/' + postId);
            const snapshot = await uploadBytes(imageRef, file);
            imageUrl = await getDownloadURL(snapshot.ref);
        }

        await set(postRef, {
            title: title,
            text: text,
            imageUrl: imageUrl,
            timestamp: new Date().toISOString(),
            authorId: user.uid,
            authorName: user.displayName || 'Anonymous'
        });

        // Show success modal
        const successModal = new bootstrap.Modal(document.getElementById('successModal'));
        successModal.show();

        // Add redirect listener
        document.getElementById('redirectButton').addEventListener('click', () => {
            window.location.href = 'viewUploads.html';
        });

    } catch (error) {
        console.error("Error posting content:", error);
        alert("There was an error uploading your post. Please try again.");
        
        // Reset button state
        submitButton.disabled = false;
        submitButton.innerHTML = originalButtonText;
    }
});

// Cancel button handler
cancelButton.addEventListener('click', () => {
    if (confirm('Are you sure you want to cancel? All changes will be lost.')) {
        window.location.href = 'viewUploads.html';
    }
});

// Add authentication state observer
auth.onAuthStateChanged((user) => {
    const submitButton = postForm.querySelector('button[type="submit"]');
    if (!user) {
        submitButton.disabled = true;
        submitButton.title = 'Please log in to post announcements';
    } else {
        submitButton.disabled = false;
        submitButton.title = '';
    }
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