const API_URL = 'https://intellipark-management-system-backend.onrender.com/api';

// Function to switch between forms
function showForm(formId) {
    document.getElementById('loginContainer').classList.toggle('hidden', formId !== 'loginContainer');
    document.getElementById('signUpContainer').classList.toggle('hidden', formId !== 'signUpContainer');
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Check if user is already logged in
    const token = localStorage.getItem('token');
    if (token) {
        window.location.href = 'index.html';
    }

    // Switch to Sign Up
    document.getElementById('switchToSignUp').addEventListener('click', (e) => {
        e.preventDefault();
        showForm('signUpContainer');
    });

    // Switch to Login
    document.getElementById('switchToLogin').addEventListener('click', (e) => {
        e.preventDefault();
        showForm('loginContainer');
    });

    // Login Form Submit
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            const formData = {
                email: e.target.querySelector('input[type="email"]').value,
                password: e.target.querySelector('input[type="password"]').value
            };

            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();
            if (response.ok) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('userName', data.name);
                window.location.href = 'index.html';
            } else {
                alert(data.message || 'Login failed');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error during login');
        }
    });

    // Sign Up Form Submit
    document.getElementById('signUpForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            const formData = {
                name: e.target.querySelector('input[type="text"]').value,
                email: e.target.querySelector('input[type="email"]').value,
                password: e.target.querySelector('input[type="password"]').value
            };

            const response = await fetch(`${API_URL}/auth/signup`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();
            if (response.ok) {
                alert('Sign up successful! Please login.');
                showForm('loginContainer');
                e.target.reset();
            } else {
                alert(data.message || 'Sign up failed');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error during sign up');
        }
    });
});