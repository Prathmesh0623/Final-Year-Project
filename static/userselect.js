document.addEventListener('DOMContentLoaded', function () {
  // Elements
  const header = document.querySelector('.header');
  const purposeBoxes = document.querySelectorAll('.purpose-box');
  const prevButton = document.querySelector('.nav-button.prev');
  const nextButton = document.querySelector('.nav-button.next');
  const selectedInfo = document.querySelector('.selected-info');
  const selectedPurposeTitle = document.getElementById('selected-purpose-title');
  const parallaxBackground = document.querySelector('.parallax-background');

  // State
  let selectedPurposeId = null;
  let selectedPurposeTitleText = null;

  // Initialize animations
  setTimeout(() => {
      header.classList.add('animate-in');

      purposeBoxes.forEach((box, index) => {
          setTimeout(() => {
              box.classList.add('animate-in');

              // Set custom properties for each box
              const color = box.getAttribute('data-color');
              box.style.setProperty('--border-color', color);
              box.querySelector('.purpose-icon').style.color = color;

              // Set different float animation delay for each box
              box.style.animationDelay = `${index * 0.2}s`;
          }, 100 + index * 150);
      });
  }, 300);

  // Parallax effect on scroll
  window.addEventListener('scroll', function () {
      const scrollPosition = window.pageYOffset;
      parallaxBackground.style.transform = `translateY(${scrollPosition * 0.4}px)`;
  });

  // Purpose box click handler
  purposeBoxes.forEach((box) => {
      box.addEventListener('click', function () {
          const purposeId = parseInt(this.getAttribute('data-id'));
          const purposeTitle = this.querySelector('h2').textContent;

          // Remove selected class from all boxes
          purposeBoxes.forEach((b) => b.classList.remove('selected'));

          // Add selected class to clicked box
          this.classList.add('selected');

          // Update selected purpose
          selectedPurposeId = purposeId;
          selectedPurposeTitleText = purposeTitle;
          selectedPurposeTitle.textContent = purposeTitle;

          // Store the selected purpose in local storage
          const selectedPurpose = {
              id: selectedPurposeId,
              title: selectedPurposeTitleText,
          };
          localStorage.setItem('selectedPurpose', JSON.stringify(selectedPurpose));

          // Show selected info
          selectedInfo.classList.remove('hidden');
          setTimeout(() => {
              selectedInfo.classList.add('show');
          }, 50);

          // Add pulse effect
          this.classList.add('pulse');
          setTimeout(() => {
              this.classList.remove('pulse');
          }, 500);

          // Debugging: Log the selected purpose
          console.log('Selected Purpose:', { id: purposeId, title: purposeTitle });

          // Handle Emergency Evacuation purpose
          if (purposeTitle === "Emergency Evacuation") {
              console.log("Emergency Evacuation selected. Merging and storing data...");

              // Send a request to merge and store emergency data
              fetch('/merge-and-store-emergency-data', {
                  method: 'POST',
                  headers: {
                      'Content-Type': 'application/json',
                  },
              })
                  .then(response => {
                      if (!response.ok) {
                          throw new Error('Network response was not ok');
                      }
                      return response.json();
                  })
                  .then(data => {
                      if (data.success) {
                          console.log('Emergency data merged and stored successfully!');
                      } else {
                          console.error('Error:', data.message);
                      }
                  })
                  .catch(error => {
                      console.error('Error during fetch:', error);
                  });
          }
      });
  });

  // Navigation button handlers
  nextButton.addEventListener('click', function () {
      // Ensure a purpose is selected
      if (selectedPurposeId === null || selectedPurposeTitleText === null) {
          alert('Please select a purpose before proceeding.');
          return;
      }

      // Get the token from local storage
      const token = localStorage.getItem('token');
      if (!token) {
          alert('No token found. Please log in again.');
          return;
      }

      // Retrieve coordinates from local storage or set defaults if not available
      let coordinates = JSON.parse(localStorage.getItem('coordinates'));
      if (!coordinates) {
          console.warn('No coordinates found in localStorage. Using default coordinates.');
          // Default coordinates (e.g., a rectangle around Bangalore, India)
          coordinates = {
              latitude1: 12.9716,  // South-West
              longitude1: 77.5946,
              latitude2: 13.0827,  // North-West
              longitude2: 77.5946,
              latitude3: 13.0827,  // North-East
              longitude3: 80.2707,
              latitude4: 12.9716,  // South-East
              longitude4: 80.2707
          };
          localStorage.setItem('coordinates', JSON.stringify(coordinates)); // Save defaults
      }

      // Debugging: Log the coordinates
      console.log('Coordinates used:', coordinates);

      // Redirect to the optimalroute page with the token and coordinates as query parameters
      const queryParams = new URLSearchParams({
          token: encodeURIComponent(token),
          lat1: coordinates.latitude1,
          lon1: coordinates.longitude1,
          lat2: coordinates.latitude2,
          lon2: coordinates.longitude2,
          lat3: coordinates.latitude3,
          lon3: coordinates.longitude3,
          lat4: coordinates.latitude4,
          lon4: coordinates.longitude4,
      });

      window.location.href = `/optimalroute?${queryParams.toString()}`;
  });
});