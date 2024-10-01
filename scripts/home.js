// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";
import { getDatabase, ref, set, onValue } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-database.js";

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
const auth = getAuth(app);
const database = getDatabase(app);

// Track user engagement
onAuthStateChanged(auth, (user) => {
    if (user) {
        const userId = user.uid;
        const timestamp = Date.now();

        // Log user sign-in activity
        set(ref(database, 'userEngagement/' + userId + '/' + timestamp), {
            signInTime: timestamp,
            email: user.email
        });
    } else {
        console.log('No user is signed in.');
    }
});

// Function to get user engagement overview
function getUserEngagementOverview() {
    const userEngagementRef = ref(database, 'userEngagement/');
    onValue(userEngagementRef, (snapshot) => {
        const data = snapshot.val();
        const trafficData = processData(data); // Process data for the graph
        drawChart(trafficData); // Draw the chart with processed data
    });
}

// Function to process engagement data for the chart
function processData(data) {
    const trafficCounts = {};

    for (const userId in data) {
        for (const timestamp in data[userId]) {
            const day = new Date(Number(timestamp)).toLocaleString('en-US', { weekday: 'short' });
            if (!trafficCounts[day]) {
                trafficCounts[day] = 0;
            }
            trafficCounts[day]++;
        }
    }

    // Prepare data for the chart
    const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const trafficValues = labels.map(day => trafficCounts[day] || 0);

    return { labels, trafficValues };
}

// Function to draw the chart
function drawChart(trafficData) {
    const options = {
        chart: {
            type: 'line',
            height: 350,
            toolbar: {
                show: false // Hide the toolbar
            }
        },
        series: [{
            name: 'User Traffic',
            data: trafficData.trafficValues // Use processed traffic values
        }],
        xaxis: {
            categories: trafficData.labels, // Day labels from processed data
            title: {
                text: 'Days',
                style: {
                    color: '#333'
                }
            }
        },
        yaxis: {
            title: {
                text: 'User Count',
                style: {
                    color: '#333'
                }
            }
        },
        grid: {
            borderColor: '#e0e0e0' // Light grid lines
        },
        stroke: {
            curve: 'smooth', // Smooth line
            width: 2 // Line thickness
        },
        colors: ['#36A2EB'], // Line color
        fill: {
            opacity: 0.2 // Area under the line
        },
        markers: {
            size: 4 // Marker size
        },
        tooltip: {
            shared: true,
            intersect: false
        }
    };

    // Create the chart
    const chart = new ApexCharts(document.querySelector("#chart"), options);
    chart.render();
}

// Call the function to get the overview
getUserEngagementOverview();

// Calendar code remains unchanged
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

        if (currMonth < 0 || currMonth > 11) { // if current month is less than 0 or greater than 11
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
