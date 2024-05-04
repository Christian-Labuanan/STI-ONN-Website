const navBar = document.querySelector("nav"),
       menuBtns = document.querySelectorAll(".menu-icon"),
       overlay = document.querySelector(".overlay");

     menuBtns.forEach((menuBtn) => {
       menuBtn.addEventListener("click", () => {
         navBar.classList.toggle("open");
       });
     });

     overlay.addEventListener("click", () => {
       navBar.classList.remove("open");
     });


// Get the button, file input element, and preview container
const uploadBtn = document.getElementById('upload');
const fileInput = document.getElementById('fileInput');
const previewContainer = document.getElementById('previewContainer');

// Add click event listener to the button
uploadBtn.addEventListener('click', () => {
    // Trigger file input click event
    fileInput.click();
});

// Add change event listener to the file input
fileInput.addEventListener('change', () => {
    // Clear previous previews
    previewContainer.innerHTML = '';

    // Loop through selected files
    for (const file of fileInput.files) {
        // Check if the file is an image
        if (file.type.startsWith('image/')) {
            // Create a new image element
            const img = document.createElement('img');
            img.classList.add('preview-image');
            
            // Set the image source to the file URL
            img.src = URL.createObjectURL(file);
            
            // Append the image to the preview container
            previewContainer.appendChild(img);
        }
    }
});

