// Preserve existing authentication logic
document.getElementById('signin-form').addEventListener('submit', function (event) {
    event.preventDefault(); // Prevent the default form submission

    // Get the email and password values
    const email = document.getElementById('signin-email').value;
    const password = document.getElementById('signin-password').value;

    // Validate email and password (basic validation)
    if (!email || !password) {
        alert('Please enter both email and password.');
        return;
    }

    // Send a POST request to the server
    fetch('/sign_in', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password }) // Send email and password as JSON
    })
    .then(response => {
        if (!response.ok) {
            // Handle HTTP errors (e.g., 401 Unauthorized, 500 Server Error)
            throw new Error(`Network response was not ok: ${response.status}`);
        }
        return response.json(); // Parse the JSON response
    })
    .then(data => {
        if (data.success) {
            // Ensure token exists before storing
            if (!data.token) {
                throw new Error('No token received from server.');
            }
            // Store the JWT token in localStorage
            localStorage.setItem('token', data.token);

            // Show a success message
            alert('Login successful!');

            // Redirect the user to the home page or another protected route
            window.location.href = '/';
        } else {
            // Display an error message if login fails
            alert(data.message || 'Login failed. Please check your credentials.');
        }
    })
    .catch(error => {
        console.error('Error during login:', error);
        alert(`An error occurred during login: ${error.message}. Please try again.`);
    });
});

// Add snow animation
function createSnowflake() {
    const snowContainer = document.querySelector('.snow-container');
    const maxSnowflakes = 6; // Maximum number of snowflakes on screen

    // Check current number of snowflakes
    const currentSnowflakes = snowContainer.querySelectorAll('.snowflake').length;
    if (currentSnowflakes >= maxSnowflakes) {
        return; // Don't create more if limit is reached
    }

    const snowflake = document.createElement('div');
    snowflake.className = 'snowflake';
    
    // Random properties for each snowflake
    const size = Math.random() * 5 + 2;
    const startPositionX = Math.random() * window.innerWidth;
    const startPositionY = -10;
    const duration = Math.random() * 3 + 2;
    const delay = Math.random() * 2; // Reduced delay range for smoother appearance
    
    snowflake.style.width = `${size}px`;
    snowflake.style.height = `${size}px`;
    snowflake.style.left = `${startPositionX}px`;
    snowflake.style.top = `${startPositionY}px`;
    snowflake.style.animationDuration = `${duration}s`;
    snowflake.style.animationDelay = `${delay}s`;
    
    snowContainer.appendChild(snowflake);
    
    // Remove snowflake after animation
    snowflake.addEventListener('animationend', () => {
        snowflake.remove();
    });
}

// Create new snowflakes periodically, but only if below limit
setInterval(createSnowflake, 1000); // Increased interval to 1 second for slower creation

// Initial snowflake creation (up to 5)
for (let i = 0; i < 5; i++) {
    createSnowflake();
}