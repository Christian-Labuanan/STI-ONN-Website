const navBar = document.querySelector("nav"),
       menuBtns = document.querySelectorAll(".menu-icon"),
       overlay = document.querySelector(".overlay");

     menuBtns.forEach((menuBtn) => {
       menuBtn.addEventListener("click", () => {
         navBar.classList.toggle("open");
       });
     });

// Get the button, file input element, and preview container
const uploadBtn = document.getElementById('upload');
const fileInput = document.getElementById('fileInput');
const previewContainer = document.getElementById('previewContainer');


