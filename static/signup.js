document.getElementById('signup-form').addEventListener('submit', function (event) {
    // Get input values
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;

    // Remove any existing error messages
    const existingErrors = document.querySelectorAll('.error-message');
    existingErrors.forEach(error => error.remove());

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showError('Please enter a valid email address');
        event.preventDefault();
        animateInput(document.getElementById('signup-email'));
        return;
    }

    // Check if all fields are filled
    if (!email || !password || !confirmPassword) {
        showError('Please fill in all fields');
        event.preventDefault();
        return;
    }

    // Check if passwords match
    if (password !== confirmPassword) {
        showError('Passwords do not match!');
        event.preventDefault();
        animateInput(document.getElementById('signup-password'));
        animateInput(document.getElementById('confirm-password'));
        return;
    }

    // Check password strength
    if (password.length < 8) {
        showError('Password must be at least 8 characters long');
        event.preventDefault();
        animateInput(document.getElementById('signup-password'));
        return;
    }

    // Add loading state to button
    const submitButton = event.target.querySelector('button[type="submit"]');
    submitButton.innerHTML = 'Signing Up...';
    submitButton.style.opacity = '0.7';
    submitButton.style.cursor = 'wait';
});

// Function to show error messages
function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.style.color = '#ef4444';
    errorDiv.style.fontSize = '0.875rem';
    errorDiv.style.marginTop = '0.5rem';
    errorDiv.style.textAlign = 'center';
    errorDiv.style.animation = 'shake 0.5s ease-in-out';
    errorDiv.textContent = message;

    const form = document.getElementById('signup-form');
    form.appendChild(errorDiv);
}

// Function to animate invalid inputs
function animateInput(inputElement) {
    inputElement.style.animation = 'shake 0.5s ease-in-out';
    inputElement.style.borderColor = '#ef4444';
    
    // Remove animation class after it completes
    setTimeout(() => {
        inputElement.style.animation = '';
    }, 500);
    
    // Reset border color after 2 seconds
    setTimeout(() => {
        inputElement.style.borderColor = '';
    }, 2000);
}

// Add input focus animations
document.querySelectorAll('.input-group input').forEach(input => {
    input.addEventListener('focus', function() {
        this.parentElement.querySelector('.input-icon').style.color = '#4f46e5';
    });

    input.addEventListener('blur', function() {
        if (!this.value) {
            this.parentElement.querySelector('.input-icon').style.color = '#9ca3af';
        }
    });
});