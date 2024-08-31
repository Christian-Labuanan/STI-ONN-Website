import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import { getDatabase, ref, get, child, remove } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-database.js";
import { getStorage, ref as storageRef, deleteObject } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-storage.js";

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

            const postsContainer = document.getElementById('postsContainer');
            const modalBackdrop = document.getElementById('modalBackdrop');
            const modalContent = document.getElementById('modalContent');
            const modalText = document.getElementById('modalText');
            const modalCloseBtn = document.getElementById('modalCloseBtn');
            const modalNavigation = document.getElementById('modalNavigation');

            let postsArray = [];
            let currentIndex = 0;
            let postIdToDelete = null;

            async function loadPosts() {
                try {
                    const dbRef = ref(database);
                    const snapshot = await get(child(dbRef, 'posts'));
                    if (snapshot.exists()) {
                        const posts = snapshot.val();
                        postsArray = Object.entries(posts).reverse(); // Reverse the order to show new posts first
                        if (postsArray.length > 0) {
                            displayPosts(postsArray);
                        } else {
                            postsContainer.innerHTML = '<p>No posts yet</p>';
                        }
                    } else {
                        postsContainer.innerHTML = '<p>No posts yet</p>';
                    }
                } catch (error) {
                    console.error("Error loading posts:", error);
                }
            }
            
            // Helper function to check if a post is within the last 3 hours
            function isRecent(postTimestamp) {
                const now = new Date();
                const postDate = new Date(postTimestamp);
                const diffInHours = (now - postDate) / (1000 * 60 * 60); // Difference in hours
                return diffInHours <= 3;  //highlights the new post for 3 hours
            }

            function displayPosts(posts) {
                postsContainer.innerHTML = '<div class="row"></div>';
                const row = postsContainer.querySelector('.row');
                posts.forEach(([postId, post], index) => {
                    const col = document.createElement('div');
                    col.classList.add('col-md-4', 'mb-4'); // Adjust column classes as needed
            
                    const card = document.createElement('div');
                    card.classList.add('card', 'shadow-sm');
            
                    // Add 'new-post' class to highlight the newest posts if they are within the last 3 hours
                    if (isRecent(post.timestamp)) {
                        card.classList.add('new-post');
            
                        // Create and add the "new" icon
                        const newIcon = document.createElement('span');
                        newIcon.classList.add('new-icon');
            
                        // Add mouse hover event listener to remove the highlight and icon permanently
                        card.addEventListener('mouseover', () => {
                            card.classList.remove('new-post'); // Remove the highlight
                            if (newIcon) {
                                newIcon.remove(); // Remove the "new" icon
                            }
                        });
                    }
            
                    // Add the post title above the image
                    const cardHeader = document.createElement('div');
                    cardHeader.classList.add('card-header');
                    cardHeader.innerHTML = `<h5 class="card-title">${post.title}</h5>`;
                    card.appendChild(cardHeader);
            
                    // Check for a thumbnail image
                    if (post.imageUrl) {
                        const img = document.createElement('img');
                        img.classList.add('card-img-top');
                        img.src = post.imageUrl;
                        img.alt = 'Posted Image';
                        card.appendChild(img);
                    } else {
                        // If no thumbnail, check for an image in the text area content
                        const textImage = extractImageFromText(post.text);
                        if (textImage) {
                            const img = document.createElement('img');
                            img.classList.add('card-img-top');
                            img.src = textImage;
                            img.alt = 'Posted Image';
                            card.appendChild(img);
                        } else {
                            const placeholder = document.createElement('div');
                            placeholder.classList.add('card-img-top', 'd-flex', 'align-items-center', 'justify-content-center');
                            placeholder.innerText = '';
                            card.appendChild(placeholder);
                        }
                    }
            
                    const cardBody = document.createElement('div');
                    cardBody.classList.add('card-body');
            
                    const text = document.createElement('p');
                    text.classList.add('card-text');
                    text.innerHTML = getGist(post.text); // Get the gist of the text
            
                    const btnContainer = document.createElement('div');
                    btnContainer.classList.add('d-flex', 'align-items-center', 'mb-2'); // Flexbox container for buttons
            
                    const editBtn = document.createElement('button');
                    editBtn.classList.add('btn', 'btn-warning', 'me-2'); // Margin-end class for spacing
                    editBtn.innerHTML = '<i class="fa-solid fa-edit"></i> Edit';
                    editBtn.onclick = () => editPost(postId);
            
                    const deleteBtn = document.createElement('button');
                    deleteBtn.classList.add('btn', 'btn-danger');
                    deleteBtn.innerHTML = '<i class="fa-solid fa-trash"></i> Delete';
                    deleteBtn.onclick = () => deletePost(postId);
            
                    btnContainer.appendChild(editBtn);
                    btnContainer.appendChild(deleteBtn);
            
                    const zoomBtn = document.createElement('button');
                    zoomBtn.classList.add('zoom-btn');
                    zoomBtn.innerHTML = '<i class="fas fa-expand"></i>';
                    zoomBtn.onclick = () => zoomPost(index);
            
                    cardBody.appendChild(text);
                    cardBody.appendChild(btnContainer);
                    cardBody.appendChild(zoomBtn);
                    card.appendChild(cardBody);
            
                    col.appendChild(card);
                    row.appendChild(col);
                });
            }


            // Function to get the gist of the text (e.g., first 100 characters)
            function getGist(text) {
                const div = document.createElement('div');
                div.innerHTML = text;
                const plainText = div.innerText || div.textContent || "";
                return plainText.length > 100 ? plainText.substring(0, 100) + '...' : plainText;
            }

            // Function to extract the first image source from the text area content
            function extractImageFromText(text) {
                const div = document.createElement('div');
                div.innerHTML = text;
                const img = div.querySelector('img');
                return img ? img.src : null;
            }

            function editPost(postId) {
                // Navigate to the edit page with postId
                window.location.href = `edit.html?postId=${postId}`;
            }

            async function deletePost(postId) {
                postIdToDelete = postId; // Store the postId for later use
                const deleteConfirmationModal = new bootstrap.Modal(document.getElementById('deleteConfirmationModal'));
                deleteConfirmationModal.show();
            }
            
            document.getElementById('confirmDeleteBtn').addEventListener('click', async () => {
                try {
                    const postRef = ref(database, 'posts/' + postIdToDelete);
                    const postSnapshot = await get(postRef);
                    if (postSnapshot.exists()) {
                        const post = postSnapshot.val();
            
                        // If there's an image associated with the post, delete it from Storage
                        if (post.imageUrl) {
                            const imageRef = storageRef(storage, post.imageUrl);
                            await deleteObject(imageRef);
                            console.log(`Image ${post.imageUrl} deleted successfully`);
                        }
            
                        // Delete the post from the Realtime Database
                        await remove(postRef);
                        console.log(`Post ${postIdToDelete} deleted successfully`);
                    } else {
                        console.log(`Post ${postIdToDelete} does not exist`);
                    }
            
                    // Refresh the posts
                    loadPosts();
                } catch (error) {
                    console.error("Error deleting post:", error.message);
                }
            
                // Close the modal after deletion
                const deleteConfirmationModalElement = document.getElementById('deleteConfirmationModal');
                const deleteConfirmationModalInstance = bootstrap.Modal.getInstance(deleteConfirmationModalElement);
                if (deleteConfirmationModalInstance) {
                    deleteConfirmationModalInstance.hide(); // Close the modal
                }
            });

            function zoomPost(index) {
                currentIndex = index;
                const post = postsArray[index][1]; // Get the post object
                updateModalContent(post);
                modalBackdrop.style.display = 'block';
                modalContent.style.display = 'block';
                modalNavigation.style.display = 'flex';
            }

            function updateModalContent(post) {
                // Clear previous modal content
                modalText.innerHTML = '';
                const existingImage = modalContent.querySelector('img');
                if (existingImage) {
                    existingImage.remove();
                }
                // Update modal title with post title
                const modalTitle = modalContent.querySelector('.modal-title');
                if (modalTitle) {
                    modalTitle.textContent = post.title; // Set the title dynamically
                } else {
                    // Create and insert modal title if it does not exist
                    const modalHeader = document.createElement('div');
                    modalHeader.classList.add('modal-header');
                    modalHeader.innerHTML = `<h5 class="modal-title">${post.title}</h5>`;
                    modalContent.insertBefore(modalHeader, modalText);
                }
                // Set the content and image
                modalText.innerHTML = post.text;

                if (post.imageUrl) {
                    const modalImage = document.createElement('img');
                    modalImage.src = post.imageUrl;
                    modalImage.alt = 'Zoomed Image';
                    modalContent.insertBefore(modalImage, modalText);
                }
            }

            function showNextPost() {
                currentIndex = (currentIndex + 1) % postsArray.length;
                updateModalContent(postsArray[currentIndex][1]);
            }

            function showPreviousPost() {
                currentIndex = (currentIndex - 1 + postsArray.length) % postsArray.length;
                updateModalContent(postsArray[currentIndex][1]);
            }

            function closeModal() {
                modalBackdrop.style.display = 'none';
                modalContent.style.display = 'none';
                modalNavigation.style.display = 'none';
            }

            modalBackdrop.onclick = closeModal;
            document.getElementById('modalNextBtn').onclick = showNextPost;
            document.getElementById('modalBackBtn').onclick = showPreviousPost;
            modalCloseBtn.onclick = closeModal;

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


            loadPosts();