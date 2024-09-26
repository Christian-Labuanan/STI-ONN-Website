import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import { getDatabase, ref, get, child } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-database.js";
import { getStorage, ref as storageRef } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-storage.js";

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

 async function loadCarouselItems() {
        try {
            const dbRef = ref(database);
            const snapshot = await get(child(dbRef, 'posts'));
            if (snapshot.exists()) {
                const posts = snapshot.val();
                const carouselItems = document.getElementById('carouselItems');
                const indicators = document.querySelector('.carousel-indicators');
                let index = 0;

                Object.entries(posts).forEach(([postId, post]) => {
                    const item = document.createElement('div');
                    item.classList.add('carousel-item');
                    if (index === 0) item.classList.add('active');

                    const img = document.createElement('img');
                    img.src = post.imageUrl || ''; // Replace with actual image URL from your post
                    img.classList.add('d-block', 'w-100');

                    // Create title element
                    const title = document.createElement('div');
                    title.classList.add('carousel-caption'); // Bootstrap classes for styling
                    title.innerHTML = `<h5>${post.title || 'Uploaded Image'}</h5>`; // Add the title

                    if (img.src) {
                        item.appendChild(img);
                        item.appendChild(title); // Add title to the item
                        carouselItems.appendChild(item);
                    } else {
                        console.warn("Empty image URL for post ID:", postId);
                    }

                    const indicator = document.createElement('button');
                    indicator.type = 'button';
                    indicator.setAttribute('data-bs-target', '#myCarousel');
                    indicator.setAttribute('data-bs-slide-to', index);
                    if (index === 0) indicator.classList.add('active');
                    indicators.appendChild(indicator);

                    index++;
                });

                console.log("Carousel items loaded:", carouselItems.children.length);
            } else {
                console.log("No posts available.");
            }
        } catch (error) {
            console.error("Error loading posts:", error);
        }
    }

    document.addEventListener('DOMContentLoaded', loadCarouselItems);


    const daysTag = document.querySelector(".days"),
    currentDate = document.querySelector(".current-date"),
    prevNextIcon = document.querySelectorAll(".icons span");
    
    // getting new date, current year and month
    let date = new Date(),
    currYear = date.getFullYear(),
    currMonth = date.getMonth();
    
    // storing full name of all months in array
    const months = ["January", "February", "March", "April", "May", "June", "July",
                  "August", "September", "October", "November", "December"];
    
    const renderCalendar = () => {
        let firstDayofMonth = new Date(currYear, currMonth, 1).getDay(), // getting first day of month
        lastDateofMonth = new Date(currYear, currMonth + 1, 0).getDate(), // getting last date of month
        lastDayofMonth = new Date(currYear, currMonth, lastDateofMonth).getDay(), // getting last day of month
        lastDateofLastMonth = new Date(currYear, currMonth, 0).getDate(); // getting last date of previous month
        let liTag = "";
    
        for (let i = firstDayofMonth; i > 0; i--) { // creating li of previous month last days
            liTag += `<li class="inactive">${lastDateofLastMonth - i + 1}</li>`;
        }
    
        for (let i = 1; i <= lastDateofMonth; i++) { // creating li of all days of current month
            // adding active class to li if the current day, month, and year matched
            let isToday = i === date.getDate() && currMonth === new Date().getMonth() 
                         && currYear === new Date().getFullYear() ? "active" : "";
            liTag += `<li class="${isToday}">${i}</li>`;
        }
    
        for (let i = lastDayofMonth; i < 6; i++) { // creating li of next month first days
            liTag += `<li class="inactive">${i - lastDayofMonth + 1}</li>`
        }
        currentDate.innerText = `${months[currMonth]} ${currYear}`; // passing current mon and yr as currentDate text
        daysTag.innerHTML = liTag;
    }
    renderCalendar();
    
    prevNextIcon.forEach(icon => { // getting prev and next icons
        icon.addEventListener("click", () => { // adding click event on both icons
            // if clicked icon is previous icon then decrement current month by 1 else increment it by 1
            currMonth = icon.id === "prev" ? currMonth - 1 : currMonth + 1;
    
            if(currMonth < 0 || currMonth > 11) { // if current month is less than 0 or greater than 11
                // creating a new date of current year & month and pass it as date value
                date = new Date(currYear, currMonth, new Date().getDate());
                currYear = date.getFullYear(); // updating current year with new date year
                currMonth = date.getMonth(); // updating current month with new date month
            } else {
                date = new Date(); // pass the current date as date value
            }
            renderCalendar(); // calling renderCalendar function
        });
    });