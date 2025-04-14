document.addEventListener('DOMContentLoaded', function () {
    const signInButton = document.getElementById('signInBtn');
    const signUpButton = document.getElementById('signUpBtn');
    const getStartedButton = document.querySelector('.get-started');
    const userProfile = document.getElementById('user-profile');
    const profileCircle = document.getElementById('profile-circle');
    const dropdownContent = document.querySelector('.dropdown-content');
    const logoutPopup = document.getElementById('logoutPopup');
    const confirmLogout = document.getElementById('confirmLogout');
    const cancelLogout = document.getElementById('cancelLogout');
    const logoutOption = document.getElementById('logoutOption');

    // Function to check if the user is logged in
    function checkLoginStatus() {
        const token = localStorage.getItem('token');
        if (token) {
            fetch('/check_session', {
                headers: {
                    'Authorization': token
                }
            })
            .then(response => response.json())
            .then(data => {
                console.log('Check session response:', data);
                if (data.logged_in && data.email && data.email.length > 0) {
                    userProfile.style.display = 'inline-block';
                    profileCircle.textContent = data.email[0].toUpperCase();
                    signInButton.style.display = 'none';
                    signUpButton.style.display = 'none';
                } else {
                    console.log('No email or not logged in:', data);
                    userProfile.style.display = 'none';
                    signInButton.style.display = 'inline-block';
                    signUpButton.style.display = 'inline-block';
                }
            })
        } else {
            // Show the sign-in and sign-up buttons
            document.getElementById('signUpBtn').style.display = 'block';
            document.getElementById('signInBtn').style.display = 'block';
            userProfile.style.display = 'none';
        }
    }

    // Check login status on page load
    checkLoginStatus();

    // Toggle dropdown when clicking the profile circle
    profileCircle.addEventListener('click', function (event) {
        event.stopPropagation(); // Prevent the click from bubbling up
        dropdownContent.style.display = dropdownContent.style.display === 'block' ? 'none' : 'block';
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', function (event) {
        if (!profileCircle.contains(event.target) && !dropdownContent.contains(event.target)) {
            dropdownContent.style.display = 'none';
        }
    });

    // Open logout confirmation popup
    logoutOption.addEventListener('click', function (event) {
        event.preventDefault();
        logoutPopup.style.display = 'block';
    });

    // Confirm logout
    confirmLogout.addEventListener('click', function () {
        fetch('/logout', {
            method: 'GET',
            headers: {
                'Authorization': localStorage.getItem('token')
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                localStorage.removeItem('token');
                //alert('Logout successful!');
                localStorage.removeItem('coordinates');
                localStorage.removeItem('selectedPurpose');
                localStorage.removeItem('destinationCoords');
                localStorage.removeItem('sourceCoords');
                localStorage.removeItem('mapState');
                checkLoginStatus();
                logoutPopup.style.display = 'none';
            } else {
                alert('Logout failed. Please try again.');
            }
        })
        .catch(error => {
            console.error('Error during logout:', error);
            alert('An error occurred during logout. Please try again.');
        });
    });

    // Cancel logout
    cancelLogout.addEventListener('click', function () {
        logoutPopup.style.display = 'none';
    });

    // Event listeners for buttons
    if (signInButton) {
        signInButton.addEventListener('click', function (event) {
            event.preventDefault();
            window.open('/sign_in', '_self');
        });
    }

    if (signUpButton) {
        signUpButton.addEventListener('click', function (event) {
            event.preventDefault();
            window.open('/sign_up', '_self');
        });
    }

    if (getStartedButton) {
        getStartedButton.addEventListener('click', function (event) {
            event.preventDefault();
            const token = localStorage.getItem('token');
            if (!token || token === 'null') {  // Check if token is missing or null
                alert('User needs to login!');
                return;  // Stop execution if not logged in
            }
            fetch('/check_session', {
                headers: {
                    'Authorization': token
                }
            })
            .then(response => response.json())
            .then(data => {
                if (data.logged_in) {
                    window.open(`/tool?token=${token}`, '_blank');
                } else {
                    alert('User needs to login!');
                }
            });
        });
    }

    // Scroll Animation Logic
    const sections = document.querySelectorAll('#about, #features, #Technology');
    const checkScroll = () => {
        const triggerBottom = window.innerHeight / 5 * 4;
        sections.forEach(section => {
            const sectionTop = section.getBoundingClientRect().top;
            if (sectionTop < triggerBottom) {
                section.classList.add('visible');
            } else {
                section.classList.remove('visible');
            }
        });
    };
    window.addEventListener('scroll', checkScroll);
    checkScroll();

    // Ensure Profile link redirects to profile.html with token
    const profileLink = document.querySelector('.dropdown-content a[href="/profile"]');
    if (profileLink) {
        profileLink.addEventListener('click', function (event) {
            event.preventDefault(); // Prevent default link behavior
            const token = localStorage.getItem('token');
            if (token) {
                window.location.href = `/profile?token=${token}`; // Redirect with token
            } else {
                alert('User needs to login!');
                window.location.href = '/sign_in'; // Redirect to sign-in if no token
            }
        });
    }
});