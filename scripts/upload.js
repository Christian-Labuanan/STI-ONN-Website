 // Import the functions you need from the SDKs you need
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
 const postedText = document.getElementById('postedText');
 const thumbnailContainer = document.getElementById('thumbnailContainer');
 const thumbnailImage = document.getElementById('thumbnailImage');
 const imageUpload = document.getElementById('imageUpload');

 postForm.addEventListener('submit', async (e) => {
     e.preventDefault();

     const text = quill.root.innerHTML; // Get the Quill editor content
     const file = imageUpload.files[0]; // Get the selected file

     if (text) {
         try {
             // Save the post data to the database
             const postId = Date.now().toString();
             const postRef = dbRef(database, 'posts/' + postId);
             let imageUrl = '';

             if (file) {
                 // Upload the file to Firebase Storage
                 const imageRef = storageRef(storage, 'images/' + postId);
                 const snapshot = await uploadBytes(imageRef, file);
                 imageUrl = await getDownloadURL(snapshot.ref);
             }

             // Save the post data to the database
             await set(postRef, {
                 text: text,
                 imageUrl: imageUrl
             });

             // Update the display of posted content
             postedText.innerHTML = text;
             if (imageUrl) {
                 thumbnailImage.src = imageUrl;
                 thumbnailImage.style.display = 'block';
             }
             thumbnailContainer.style.display = 'flex';
         } catch (error) {
             console.error("Error posting content:", error);
         }
     } else {
         alert("Text content is required.");
     }
 });