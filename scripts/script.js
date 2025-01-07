document.addEventListener("DOMContentLoaded", () => {
  const body = document.querySelector("body");
  const sidebar = document.querySelector(".sidebar");
  const submenuItems = document.querySelectorAll(".submenu_item");
  const sidebarOpen = document.querySelector("#sidebarOpen");
  const sidebarClose = document.querySelector(".collapse_sidebar");
  const sidebarExpand = document.querySelector(".expand_sidebar");

  const toggleSidebar = () => {
    sidebar.classList.toggle("close");
  };

  const setSidebarState = () => {
    if (window.innerWidth < 768) {
      sidebar.classList.add("close");
    } else {
      sidebar.classList.remove("close");
    }
  };

  sidebarOpen.addEventListener("click", toggleSidebar);
  sidebarClose.addEventListener("click", () => sidebar.classList.add("close", "hoverable"));
  sidebarExpand.addEventListener("click", () => sidebar.classList.remove("close", "hoverable"));

  sidebar.addEventListener("mouseenter", () => {
    if (sidebar.classList.contains("hoverable")) {
      sidebar.classList.remove("close");
    }
  });

  sidebar.addEventListener("mouseleave", () => {
    if (sidebar.classList.contains("hoverable")) {
      sidebar.classList.add("close");
    }
  });

  submenuItems.forEach((item, index) => {
    item.addEventListener("click", () => {
      item.classList.toggle("show_submenu");
      submenuItems.forEach((item2, index2) => {
        if (index !== index2) {
          item2.classList.remove("show_submenu");
        }
      });
    });
  });

  // Set initial sidebar state based on window size
  setSidebarState();

  // Adjust sidebar on window resize
  window.addEventListener('resize', setSidebarState);
});


document.addEventListener('DOMContentLoaded', function () {
  const sidebarOpen = document.getElementById('sidebarOpen');
  const sidebar = document.querySelector('.sidebar');

  // Toggle sidebar visibility
  sidebarOpen.addEventListener('click', function () {
      sidebar.classList.toggle('active');
  });
});

