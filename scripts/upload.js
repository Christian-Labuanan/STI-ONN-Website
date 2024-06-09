const firebaseConfig = {
    apiKey: "AIzaSyBfZyTFzkgn8hbaPnqNEdslEglKjBkrPPs",
    authDomain: "sti-onn-d0161.firebaseapp.com",
    databaseURL: "https://sti-onn-d0161-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "sti-onn-d0161",
    storageBucket: "sti-onn-d0161.appspot.com",
    messagingSenderId: "538337032363",
    appId: "1:538337032363:web:7e17df22799b2bad85dfee"
  };
  const app = firebase.initializeApp(firebaseConfig);
  const storage = firebase.storage();

  const inp = document.querySelector(".inp");
  const imgPreview = document.querySelector(".img");
  const progressbar = document.querySelector(".progress");
  const img = document.querySelector(".img");
  const fileData = document.querySelector(".filedata");
  const loading = document.querySelector(".loading");
  
  const docPreview = document.createElement('iframe'); // Create an iframe for document preview
  document.body.appendChild(docPreview); // Append iframe to body or a specific container
  docPreview.style.display = 'none'; // Initially hide the iframe
  docPreview.style.width = '100%';
  docPreview.style.height = '600px';
  const fileListContainer = document.getElementById('fileList');
  let file;
  let fileName;
  let progress = 0;
  let isLoading = false;
  let uploadedFileName;
  // Function to display error messages
const showError = (error) => {
    console.error(error);
    alert("An error occurred. Please try again.");
};
  const selectImage = () => {
    inp.click();
  };
  const getImageData = (e) => {
    file = e.target.files[0];
    fileName = Math.round(Math.random() * 9999) + file.name;
    if (fileName) {
      fileData.style.display = "block";
    }
    fileData.innerHTML = fileName;
    console.log(file, fileName);
  };

  const uploadImage = () => {
    if (!file) {
        alert("Please select a file.");
        return;
    }
    loading.style.display = "block";
    const storageRef = storage.ref().child("Files");
    const folderRef = storageRef.child(fileName);
    const uploadtask = folderRef.put(file);
    uploadtask.on(
      "state_changed",
      (snapshot) => {
        console.log("Snapshot", snapshot.ref.name);
        progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        progress = Math.round(progress);
        progressbar.style.width = progress + "%";
        progressbar.innerHTML = progress + "%";
        uploadedFileName = snapshot.ref.name;
      },
      (error) => {
        showError(error);
      },
      () => {
        storage
          .ref("Files")
          .child(uploadedFileName)
          .getDownloadURL()
          .then((url) => {
            console.log("URL", url);
            if (!url) {
              img.style.display = "none";
              loading.style.display = "none";
            if (file.type === 'application/pdf') {
              img.style.display = "none"; // Hide image preview if it's a document
              docPreview.src = url; // Set the iframe src to the file URL
              docPreview.style.display = 'block'; // Show the iframe
            } else {
              img.style.display = "block";
              loading.style.display = "none";
            }
            img.setAttribute("src", url);
            }
            const fileListContainer = document.getElementById('fileList');
          });
        console.log("File Uploaded Successfully");
        // Show success modal
        const successModal = new bootstrap.Modal(document.getElementById('successModal'));
        successModal.show();
        // Hide loading indicator
        loading.style.display = "none";
      }
    );
        // Function to display image preview
        const displayImagePreview = (file) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            imgPreview.src = e.target.result;
            imgPreview.style.display = "block";
        };

        reader.readAsDataURL(file);
        };

        // Event listener for file input change
        inp.addEventListener("change", (event) => {
        const file = event.target.files[0];
        if (file) {
        displayImagePreview(file);
        }
        fileName = Math.round(Math.random() * 9999) + file.name;
        fileData.innerHTML = fileName;
        console.log(file, fileName);
        }
    );
  };
// Function to display the list of files
const displayFiles = () => {
  const storageRef = storage.ref().child("Files");
  storageRef.listAll().then((result) => {
    fileListContainer.innerHTML = ''; // Clear the existing list
    result.items.forEach((fileRef) => {
      fileRef.getDownloadURL().then((url) => {
        const li = document.createElement('li');
        li.innerHTML = `<a href="${url}" target="_blank">${fileRef.name}</a>`;
        fileListContainer.appendChild(li);
      }).catch((error) => {
        showError(error);
      });
    });
  }).catch((error) => {
    showError(error);
  });
};

// Initial call to display the files when the page loads
displayFiles();