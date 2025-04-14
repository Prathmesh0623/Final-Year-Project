// Function to populate input fields with coordinates from local storage
function populateCoordinatesFromLocalStorage() {
    const coordinates = JSON.parse(localStorage.getItem('coordinates'));

    if (coordinates) {
        // If coordinates exist in local storage, populate the input fields
        document.getElementById('longitude1').value = coordinates.longitude1 || '';
        document.getElementById('latitude1').value = coordinates.latitude1 || '';
        document.getElementById('longitude2').value = coordinates.longitude2 || '';
        document.getElementById('latitude2').value = coordinates.latitude2 || '';
        document.getElementById('longitude3').value = coordinates.longitude3 || '';
        document.getElementById('latitude3').value = coordinates.latitude3 || '';
        document.getElementById('longitude4').value = coordinates.longitude4 || '';
        document.getElementById('latitude4').value = coordinates.latitude4 || '';
    }
}

// Initialize form with stored coordinates and setup animations
document.addEventListener('DOMContentLoaded', () => {
    populateCoordinatesFromLocalStorage();
    setupFormInteractions();
    initializeAnimations();
});

function setupFormInteractions() {
    const inputs = document.querySelectorAll('input[type="text"]');
    
    inputs.forEach(input => {
        // Add input validation
        input.addEventListener('input', () => {
            validateInput(input);
        });

        // Add focus animations
        input.addEventListener('focus', () => {
            input.classList.add('input-active');
            input.parentElement.classList.add('group-active');
        });

        input.addEventListener('blur', () => {
            input.classList.remove('input-active');
            if (!input.value) {
                input.parentElement.classList.remove('group-active');
            }
        });
    });
}

function initializeAnimations() {
    const animatedElements = document.querySelectorAll('.animate-fade-in, .input-group, .button-group');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.1 });

    animatedElements.forEach(element => {
        observer.observe(element);
    });
}

function validateInput(input) {
    const value = input.value.trim();
    const isLatitude = input.id.includes('latitude');
    const isValid = isLatitude ? 
        (value >= -90 && value <= 90) : 
        (value >= -180 && value <= 180);

    input.style.borderColor = value && !isValid ? 
        'var(--error-color)' : 
        'rgba(255, 255, 255, 0.2)';

    // Show validation message
    const feedbackElement = input.parentElement.querySelector('.validation-message');
    if (value && !isValid) {
        if (!feedbackElement) {
            const message = document.createElement('div');
            message.className = 'validation-message';
            message.textContent = isLatitude ? 
                'Latitude must be between -90° and 90°' : 
                'Longitude must be between -180° and 180°';
            input.parentElement.appendChild(message);
        }
    } else if (feedbackElement) {
        feedbackElement.remove();
    }
}

document.getElementById('get-map-btn').addEventListener('click', async function () {
    const button = document.getElementById('get-map-btn');
    const buttonText = button.querySelector('.btn-text');
    const loader = button.querySelector('.loader');

    // Disable button and show loader
    button.disabled = true;
    buttonText.style.opacity = '0';
    loader.style.display = 'block';

    // Retrieve the token from localStorage
    const token = localStorage.getItem('token');
    if (!token) {
        showNotification('User not logged in. Please sign in first.', 'error');
        resetButton(button, buttonText, loader);
        return;
    }

    // Get input values from the form
    const coordinates = {};
    document.querySelectorAll('#coordinates-form input').forEach(input => {
        coordinates[input.id] = input.value.trim();
    });

    // Validate coordinates
    const isCoordinatesValid = Object.values(coordinates).every(value => value !== '');
    if (!isCoordinatesValid) {
        showNotification('Please fill in all coordinate fields.', 'error');
        resetButton(button, buttonText, loader);
        return;
    }

    try {
        const response = await fetch('/generate-map', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token
            },
            body: JSON.stringify(coordinates)
        });

        if (response.ok) {
            const { map_url } = await response.json();
            showMap(map_url);
            localStorage.setItem('coordinates', JSON.stringify(coordinates));
            document.getElementById('description-btn').style.display = 'block';
            showNotification('Map generated successfully!', 'success');
        } else {
            const error = await response.text();
            showNotification(error, 'error');
            document.getElementById('description-btn').style.display = 'none';
        }
    } catch (error) {
        showNotification('An error occurred while fetching the map.', 'error');
        document.getElementById('description-btn').style.display = 'none';
    } finally {
        resetButton(button, buttonText, loader);
    }
});

function resetButton(button, buttonText, loader) {
    button.disabled = false;
    buttonText.style.opacity = '1';
    loader.style.display = 'none';
}

function showMap(url) {
    const container = document.getElementById('map-result-container');
    container.style.opacity = '0';
    container.style.display = 'block';
    container.innerHTML = `<iframe src="${url}" width="100%" height="100%" frameborder="0"></iframe>`;
    
    requestAnimationFrame(() => {
        container.style.opacity = '1';
        container.style.transition = 'opacity 0.5s ease-out';
    });
}

function showNotification(message, type) {
    const errorElement = document.getElementById('error-message');
    errorElement.textContent = message;
    errorElement.className = `error-message ${type}`;
    errorElement.style.opacity = '0';
    errorElement.style.display = 'block';

    requestAnimationFrame(() => {
        errorElement.style.opacity = '1';
        errorElement.style.transition = 'opacity 0.3s ease-in';
    });

    if (type === 'success') {
        setTimeout(() => {
            errorElement.style.opacity = '0';
            setTimeout(() => {
                errorElement.style.display = 'none';
            }, 300);
        }, 3000);
    }
}

document.getElementById('next_app').addEventListener('click', function (event) {
    event.preventDefault();

    const coordinates = localStorage.getItem('coordinates');
    
    if (coordinates) {
        const button = this;
        button.classList.add('button-clicked');
        
        setTimeout(() => {
            window.open('/pathdetect', '_self');
        }, 300);
    } else {
        showNotification('Please select coordinates first', 'error');
    }
});

document.getElementById('description-btn').addEventListener('click', function() {
    const button = this;
    button.classList.add('button-clicked');
    
    setTimeout(() => {
        window.location.href = '/description';
    }, 300);
});