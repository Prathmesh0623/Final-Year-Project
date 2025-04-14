// Initialize Lucide icons
lucide.createIcons();

// Fullscreen functionality
const fullscreenBtn = document.getElementById('fullscreenBtn');
fullscreenBtn.addEventListener('click', () => {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
        fullscreenBtn.innerHTML = '<i data-lucide="minimize-2"></i>';
    } else {
        document.exitFullscreen();
        fullscreenBtn.innerHTML = '<i data-lucide="maximize-2"></i>';
    }
    lucide.createIcons(); // Reinitialize icons
});

// Hover effect for navigation buttons
document.querySelectorAll('.nav-button').forEach(button => {
    button.addEventListener('mouseenter', () => button.style.transform = 'translateY(-2px)');
    button.addEventListener('mouseleave', () => button.style.transform = 'translateY(0)');
});

// Click animations for control buttons
document.querySelectorAll('.process-btn, .next-btn').forEach(button => {
    button.addEventListener('mousedown', () => button.style.transform = 'scale(0.98)');
    button.addEventListener('mouseup', () => button.style.transform = 'scale(1)');
    button.addEventListener('mouseleave', () => button.style.transform = 'scale(1)');
});

// Process Routes Function
function processRoutes() {
    const loader = document.getElementById('process-routes-loader');
    const nextBtn = document.getElementById('nextBtn'); // Get the "Next" button

    // Disable the "Next" button while processing
    if (nextBtn) {
        nextBtn.disabled = true;
    }

    loader.style.display = 'inline-block';

    const coordinates = JSON.parse(localStorage.getItem('coordinates'));

    fetch('/process-routes', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': localStorage.getItem('token')
        },
        body: JSON.stringify(coordinates)
    })
    .then(response => response.json())
    .then(data => {
        const iframe = document.getElementById('map-iframe');
        if (data.map_url) {
            iframe.src = data.map_url;
            iframe.onload = () => {
                loader.style.display = 'none';
                iframe.style.width = '100%';
                iframe.style.height = '100%';

                // Enable the "Next" button after processing is complete
                if (nextBtn) {
                    nextBtn.disabled = false;
                }
            };
        } else {
            alert(`Error processing routes: ${data.error}`);
            loader.style.display = 'none';

            // Keep the "Next" button disabled if there's an error
            if (nextBtn) {
                nextBtn.disabled = true;
            }
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('An error occurred while processing routes.');
        loader.style.display = 'none';

        // Keep the "Next" button disabled if there's an error
        if (nextBtn) {
            nextBtn.disabled = true;
        }
    });
}

// Highlight Layer Function
function highlightLayer(layer) {
    const loader = document.getElementById(`${layer.replace('_', '-')}-loader`);
    if (loader) loader.style.display = 'inline-block';

    const iframe = document.getElementById('map-iframe');
    if (iframe?.contentWindow) {
        iframe.contentWindow.postMessage({ type: 'toggleLayer', layer }, '*');
    }

    setTimeout(() => {
        if (loader) loader.style.display = 'none';
    }, 1000); // Adjust delay as needed
}

// Function to redirect to the tool page with the token
function redirectToTool() {
    const token = localStorage.getItem('token'); // Get the token from localStorage
    if (token) {
        window.location.href = `/tool?token=${token}`; // Redirect with the token
    } else {
        alert('You are not authorized. Please log in again.');
        window.location.href = '/sign_in'; // Redirect to the sign-in page if no token is found
    }
}

// Function to redirect to the optimalroute page with the token
// function redirectToOptimalRoute() {
//     const token = localStorage.getItem('token'); // Get the token from localStorage
//     if (token) {
//         window.location.href = `/optimalroute?token=${token}`; // Redirect with the token
//     } else {
//         alert('You are not authorized. Please log in again.');
//         window.location.href = '/sign_in'; // Redirect to the sign-in page if no token is found
//     }
// }

function redirectToOptimalRoute() {
    const token = localStorage.getItem('token'); // Get the token from localStorage
    const coordinates = JSON.parse(localStorage.getItem('coordinates')); // Get the coordinates from localStorage

    if (token && coordinates) {
        // Construct the URL with coordinates as query parameters
        const url = `/userselect?token=${token}&lat1=${coordinates.latitude1}&lon1=${coordinates.longitude1}&lat2=${coordinates.latitude2}&lon2=${coordinates.longitude2}&lat3=${coordinates.latitude3}&lon3=${coordinates.longitude3}&lat4=${coordinates.latitude4}&lon4=${coordinates.longitude4}`;
        window.location.href = url; // Redirect with the token and coordinates
    } else {
        alert('You are not authorized or no coordinates found. Please log in again.');
        window.location.href = '/sign_in'; // Redirect to the sign-in page if no token or coordinates are found
    }
}

// Add event listener to the "Previous" button
const prevBtn = document.getElementById('prevBtn');
if (prevBtn) {
    prevBtn.addEventListener('click', redirectToTool);
}

// Add event listener to the "Next" button
const nextBtn = document.getElementById('nextBtn');
if (nextBtn) {
    nextBtn.disabled = true; // Initially disable the "Next" button
    nextBtn.addEventListener('click', redirectToOptimalRoute);
}