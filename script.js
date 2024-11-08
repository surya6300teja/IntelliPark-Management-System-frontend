const API_URL = 'https://intellipark-management-system-backend.onrender.com/api';
let isAdminAuthenticated = false;

// Page Navigation
function showPage(pageId) {
    console.log('Showing page:', pageId);
    
    // Hide all pages
    document.querySelectorAll('.page-content').forEach(page => {
        page.classList.add('hidden');
    });
    
    // Show selected page
    const selectedPage = document.getElementById(`${pageId}Page`);
    if (selectedPage) {
        selectedPage.classList.remove('hidden');
        console.log('Page shown:', pageId);
    } else {
        console.error('Page not found:', pageId);
    }
    
    // Update active nav link
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('data-page') === pageId) {
            link.classList.add('active');
        }
    });
}

// Setup Event Listeners
function setupEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const pageId = e.target.getAttribute('data-page');
            showPage(pageId);
        });
    });

    // Logout
    document.getElementById('logoutBtn').addEventListener('click', (e) => {
        e.preventDefault();
        logout();
    });

    // Forms
    setupFormListeners();

    // Feedback Form
    document.getElementById('feedbackForm').addEventListener('submit', async function(e) {
        

        // Get form values
        const name = document.getElementById('feedback-name').value;
        const email = document.getElementById('feedback-email').value;
        const category = document.getElementById('feedback-category').value;
        const message = document.getElementById('feedback-message').value;

        // Debug log
        console.log('Form Values:', { name, email, category, message });

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                alert('Please login first');
                return;
            }

            const formData = {
                name: name,
                email: email,
                category: category,
                message: message
            };

            console.log('Sending data:', formData);

            const response = await fetch(`${API_URL}/feedback`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to submit feedback');
            }

            const data = await response.json();
            console.log('Success:', data);
            alert('Feedback submitted successfully');
            this.reset();

        } catch (error) {
            console.error('Error:', error);
            alert(error.message || 'Error submitting feedback');
        }
    });
}

// Load Dashboard Data
async function loadDashboardData() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = 'login.html';
            return;
        }

        console.log('Fetching dashboard data...'); // Debug log

        const response = await fetch(`${API_URL}/parking/active`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Server response:', errorText);
            throw new Error('Failed to fetch dashboard data');
        }

        const data = await response.json();
        console.log('Received dashboard data:', data); // Debug log

        if (data && data.activeParking) {
            updateDashboardStats(data);
            updateActiveParkingsTable(data.activeParking);
        } else {
            console.error('Invalid data format received:', data);
        }
    } catch (error) {
        console.error('Error loading dashboard data:', error);
    }
}

// Update Dashboard Stats
function updateDashboardStats(data) {
    const activeCount = data.activeCount || 0;
    document.getElementById('activeCount').textContent = activeCount;
    document.getElementById('availableSpots').textContent = 100 - activeCount;
}

// Update Active Parkings Table
function updateActiveParkingsTable(parkings = []) {
    const tbody = document.getElementById('activeParkingsTable');
    if (!tbody) {
        console.error('Table body element not found');
        return;
    }

    tbody.innerHTML = '';

    if (!parkings || parkings.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="no-data">No active parkings</td>
            </tr>
        `;
        return;
    }

    console.log('Updating table with parkings:', parkings); // Debug log

    parkings.forEach(parking => {
        try {
            const duration = calculateDuration(parking.entryTime);
            const cost = calculateCost(parking.entryTime);
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${parking.vehicleNumber || 'N/A'}</td>
                <td>${parking.spotNumber || 'N/A'}</td>
                <td>${parking.vehicleType || 'N/A'}</td>
                <td>${new Date(parking.entryTime).toLocaleString()}</td>
                <td>${duration}</td>
                <td>$${cost}</td>
            `;
            tbody.appendChild(row);
        } catch (error) {
            console.error('Error creating row for parking:', parking, error);
        }
    });
}

// Helper Functions
function calculateDuration(entryTime) {
    const start = new Date(entryTime);
    const now = new Date();
    const hours = Math.ceil((now - start) / (1000 * 60 * 60));
    return `${hours} hour(s)`;
}

function calculateCost(entryTime) {
    const hours = Math.ceil((new Date() - new Date(entryTime)) / (1000 * 60 * 60));
    return hours * 10; // $10 per hour
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    // Set user name
    const userName = localStorage.getItem('userName');
    document.getElementById('userNameDisplay').textContent = `Welcome, ${userName}`;

    // Setup event listeners
    setupEventListeners();

    // Load initial dashboard data
    loadDashboardData();

    // Refresh dashboard data every minute
    setInterval(loadDashboardData, 60000);
});

// Setup Form Listeners
function setupFormListeners() {
    // Entry Form
    document.getElementById('entryForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const formData = {
                vehicleNumber: document.getElementById('vehicleNumber').value,
                vehicleType: document.getElementById('vehicleType').value,
                entryTime: document.getElementById('entryTime').value || new Date().toISOString(),
                status: 'active'
            };

            console.log('Submitting entry:', formData); // Debug log

            const response = await fetch(`${API_URL}/parking/entry`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Server response:', errorText);
                throw new Error('Failed to record entry');
            }
            
            alert('Vehicle entry recorded successfully');
            e.target.reset();
            loadDashboardData(); // Refresh dashboard data
        } catch (error) {
            console.error('Error:', error);
            alert('Error recording entry: ' + error.message);
        }
    });

    // Exit Form
    document.getElementById('exitForm').addEventListener('submit', async function(e) {
        e.preventDefault();

        const vehicleNumber = document.getElementById('exitVehicleNumber').value.trim();
        const exitTime = document.getElementById('exitTime').value;

        if (!vehicleNumber || !exitTime) {
            alert('Please fill all fields');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                alert('Please login first');
                return;
            }

            // Record exit
            const response = await fetch(`${API_URL}/parking/exit`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    vehicleNumber: vehicleNumber,
                    exitTime: exitTime
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to record exit');
            }

            alert(`Vehicle exit recorded successfully. Cost: $${data.cost.toFixed(2)}`);
            this.reset();
            
            // Optionally refresh the parking list if it's visible
            if (!document.getElementById('reportPage').classList.contains('hidden')) {
                loadReportData();
            }

        } catch (error) {
            console.error('Error:', error);
            alert(error.message || 'Error recording exit');
        }
    });

    // Feedback Form
    document.getElementById('feedbackForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        alert('Feedback submitted successfully');
        e.target.reset();
    });
}

// Update the logout function
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('userName');
    window.location.replace('login.html'); // Use replace instead of href
} 
document.getElementById('logoutBtn').addEventListener('click', (e) => {
    e.preventDefault();
    logout();
});

// Setup history button listener
document.getElementById('viewHistoryBtn').addEventListener('click', async () => {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/parking/history`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch parking history');
        }

        const data = await response.json();
        console.log('History data:', data); // Debug log
        showHistoryModal(data);
    } catch (error) {
        console.error('Error loading history:', error);
        alert('Error loading parking history');
    }
});

// Function to show history modal
function showHistoryModal(parkings) {
    let modal = document.getElementById('historyModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'historyModal';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Parking History</h2>
                    <span class="close-modal">&times;</span>
                </div>
                <div class="modal-body">
                    <table>
                        <thead>
                            <tr>
                                <th>Vehicle Number</th>
                                <th>Vehicle Type</th>
                                <th>Spot Number</th>
                                <th>Entry Time</th>
                                <th>Exit Time</th>
                                <th>Duration</th>
                                <th>Total Cost</th>
                                <th>Recorded By</th>
                            </tr>
                        </thead>
                        <tbody id="historyTableBody"></tbody>
                    </table>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        // Add close functionality
        const closeBtn = modal.querySelector('.close-modal');
        closeBtn.onclick = () => modal.style.display = 'none';
        window.onclick = (event) => {
            if (event.target == modal) {
                modal.style.display = 'none';
            }
        };
    }

    const tbody = document.getElementById('historyTableBody');
    tbody.innerHTML = '';

    if (!parkings || parkings.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="no-data">No parking history found</td>
            </tr>
        `;
        modal.style.display = 'block';
        return;
    }

    parkings.forEach(parking => {
        const duration = calculateParkingDuration(parking.entryTime, parking.exitTime);
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${parking.vehicleNumber}</td>
            <td>${parking.vehicleType}</td>
            <td>${parking.spotNumber}</td>
            <td>${new Date(parking.entryTime).toLocaleString()}</td>
            <td>${new Date(parking.exitTime).toLocaleString()}</td>
            <td>${duration}</td>
            <td>$${parking.cost}</td>
            <td>${parking.recordedBy || 'Unknown'}</td>
        `;
        tbody.appendChild(row);
    });

    modal.style.display = 'block';
}

// Helper function to calculate parking duration
function calculateParkingDuration(entryTime, exitTime) {
    const start = new Date(entryTime);
    const end = new Date(exitTime);
    const diffInHours = Math.ceil((end - start) / (1000 * 60 * 60));
    return `${diffInHours} hour(s)`;
}

// Load Report Data
async function loadReportData() {
    try {
        const token = localStorage.getItem('token');
        if (!token) return;

        // Fetch parking history
        const parkingResponse = await fetch(`${API_URL}/parking/history`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const parkingData = await parkingResponse.json();

        // Fetch feedback data
        const feedbackResponse = await fetch(`${API_URL}/feedback`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const feedbackData = await feedbackResponse.json();

        // Update the UI
        updateParkingHistory(parkingData);
        updateFeedbackList(feedbackData);
        updateSummaryCards(parkingData, feedbackData);

    } catch (error) {
        console.error('Error loading report data:', error);
    }
}

// Function to calculate and format duration
function calculateDuration(entryTime, exitTime) {
    const start = new Date(entryTime);
    // If no exit time (for active parkings), calculate duration until now
    const end = exitTime ? new Date(exitTime) : new Date();
    
    // Calculate difference in milliseconds
    const diff = end - start;
    
    // If duration is negative (future entry time), return "Not Started"
    if (diff < 0) {
        return "Not Started";
    }
    
    // Convert to hours and minutes
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    // Format the duration string
    if (hours === 0) {
        return `${minutes}m`;
    }
    return `${hours}h ${minutes}m`;
}

// Function to update parking history table
function updateParkingHistory(parkings) {
    const tbody = document.getElementById('parkingHistoryTable');
    if (!parkings || parkings.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="no-data">No parking history available</td></tr>';
        return;
    }

    tbody.innerHTML = parkings.map(parking => {
        const entryTime = new Date(parking.entryTime);
        const exitTime = parking.exitTime ? new Date(parking.exitTime) : null;
        const duration = calculateDuration(entryTime, exitTime);
        
        // Determine cost display
        let costDisplay;
        if (parking.status === 'active') {
            // For active parkings, calculate current cost
            const currentTime = new Date();
            const currentDuration = (currentTime - entryTime) / (1000 * 60 * 60); // hours
            
            // Calculate cost based on vehicle type
            let hourlyRate;
            switch (parking.vehicleType) {
                case 'bike': hourlyRate = 10; break;
                case 'car': hourlyRate = 20; break;
                case 'truck': hourlyRate = 30; break;
                default: hourlyRate = 20;
            }
            const currentCost = Math.ceil(currentDuration * hourlyRate);
            costDisplay = `$${currentCost.toFixed(2)}`;
        } else {
            // For completed parkings
            costDisplay = `$${parking.cost.toFixed(2)}`;
        }
        
        return `
            <tr>
                <td>${parking.vehicleNumber}</td>
                <td>${parking.vehicleType}</td>
                <td>${parking.spotNumber || 'N/A'}</td>
                <td>${formatDateTime(entryTime)}</td>
                <td>${exitTime ? formatDateTime(exitTime) : 'Active'}</td>
                <td>${duration}</td>
                <td class="cost-column">${costDisplay}</td>
                <td><span class="status-${parking.status.toLowerCase()}">${parking.status}</span></td>
            </tr>
        `;
    }).join('');
}

// Helper function to format date and time
function formatDateTime(date) {
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(date);
}

// Function to update feedback list table
function updateFeedbackList(feedbacks) {
    const tbody = document.getElementById('feedbackListTable');
    if (!feedbacks || feedbacks.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="no-data">No feedback available</td></tr>';
        return;
    }

    tbody.innerHTML = feedbacks.map(feedback => `
        <tr>
            <td>${formatDateTime(new Date(feedback.createdAt))}</td>
            <td>${feedback.name}</td>
            <td>${feedback.email}</td>
            <td>${feedback.category}</td>
            <td>${feedback.message}</td>
        </tr>
    `).join('');
}

// Function to update summary cards
function updateSummaryCards(parkings, feedbacks) {
    // Calculate total revenue only for completed parkings with positive cost
    const totalRevenue = parkings
        .filter(p => p.status === 'completed' && p.cost > 0)
        .reduce((sum, parking) => Math.max(0, sum + parking.cost), 0);
    
    // Update UI
    document.getElementById('totalRevenue').textContent = `$${totalRevenue.toFixed(2)}`;
    document.getElementById('totalParkings').textContent = parkings.length;
    document.getElementById('totalFeedbacks').textContent = feedbacks.length;
}

// Add event listener for tab switching
document.addEventListener('DOMContentLoaded', function() {
    // Load report data when page loads
    loadReportData();

    // Add tab switching functionality
    document.querySelectorAll('.tab-btn').forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons and contents
            document.querySelectorAll('.tab-btn').forEach(btn => 
                btn.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(content => 
                content.classList.remove('active'));
            
            // Add active class to clicked button and corresponding content
            button.classList.add('active');
            const tabId = button.getAttribute('data-tab');
            document.getElementById(tabId).classList.add('active');
        });
    });

    // Refresh report data periodically (every 5 minutes)
    setInterval(loadReportData, 5 * 60 * 1000);
});

// Add this to verify the form is loaded
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('feedbackForm');
    const name = document.getElementById('feedback-name');
    const email = document.getElementById('feedback-email');
    const category = document.getElementById('feedback-category');
    const message = document.getElementById('feedback-message');

    console.log('Form elements found:', {
        form: !!form,
        name: !!name,
        email: !!email,
        category: !!category,
        message: !!message
    });
});

// Feedback Form Handler
document.addEventListener('DOMContentLoaded', function() {
    const feedbackForm = document.getElementById('feedbackForm');
    
    if (feedbackForm) {
        feedbackForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // Get form elements
            const nameInput = document.getElementById('feedback-name');
            const emailInput = document.getElementById('feedback-email');
            const categoryInput = document.getElementById('feedback-category');
            const messageInput = document.getElementById('feedback-message');

            // Get values and trim whitespace
            const name = nameInput ? nameInput.value.trim() : '';
            const email = emailInput ? emailInput.value.trim() : '';
            const category = categoryInput ? categoryInput.value.trim() : '';
            const message = messageInput ? messageInput.value.trim() : '';

            // Debug log
            console.log('Form Values Before Validation:', {
                name,
                email,
                category,
                message,
                nameElement: nameInput,
                emailElement: emailInput,
                categoryElement: categoryInput,
                messageElement: messageInput
            });

            // Validate all fields
            if (!name || !email || !category || !message) {
                console.log('Missing Fields:', {
                    name: !name,
                    email: !email,
                    category: !category,
                    message: !message
                });
                alert('Please fill in all fields');
                return;
            }

            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    alert('Please login first');
                    return;
                }

                const formData = {
                    name,
                    email,
                    category,
                    message
                };

                console.log('Sending data to server:', formData);

                const response = await fetch(`${API_URL}/feedback`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formData)
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message || 'Failed to submit feedback');
                }

                console.log('Server response:', data);
                alert('Feedback submitted successfully');
                feedbackForm.reset();

            } catch (error) {
                console.error('Submission error:', error);
                alert(error.message || 'Error submitting feedback');
            }
        });
    } else {
        console.error('Feedback form not found in DOM');
    }

    // Test if elements are properly connected
    console.log('Form Elements Check:', {
        form: !!document.getElementById('feedbackForm'),
        name: !!document.getElementById('feedback-name'),
        email: !!document.getElementById('feedback-email'),
        category: !!document.getElementById('feedback-category'),
        message: !!document.getElementById('feedback-message')
    });
});

// Add this function to test form values at any time
window.testFormValues = function() {
    const form = {
        name: document.getElementById('feedback-name'),
        email: document.getElementById('feedback-email'),
        category: document.getElementById('feedback-category'),
        message: document.getElementById('feedback-message')
    };

    console.log('Current Form Values:', {
        nameValue: form.name ? form.name.value : 'Element not found',
        emailValue: form.email ? form.email.value : 'Element not found',
        categoryValue: form.category ? form.category.value : 'Element not found',
        messageValue: form.message ? form.message.value : 'Element not found',
        elements: form
    });
};

// Global function to submit feedback
async function submitFeedback(event) {
    event.preventDefault();
    
    // Get form values directly
    const name = document.getElementById('feedback-name').value.trim();
    const email = document.getElementById('feedback-email').value.trim();
    const category = document.getElementById('feedback-category').value.trim();
    const message = document.getElementById('feedback-message').value.trim();

    // Debug log
    console.log('Raw form values:', {
        name,
        email,
        category,
        message
    });

    // Validate fields
    if (!name || !email || !category || !message) {
        const missingFields = [];
        if (!name) missingFields.push('Name');
        if (!email) missingFields.push('Email');
        if (!category) missingFields.push('Category');
        if (!message) missingFields.push('Message');
        
        alert(`Please fill in the following fields: ${missingFields.join(', ')}`);
        return;
    }

    try {
        const token = localStorage.getItem('token');
        if (!token) {
            alert('Please login first');
            return;
        }

        const formData = {
            name,
            email,
            category,
            message
        };

        console.log('Sending feedback data:', formData);

        const response = await fetch(`${API_URL}/feedback`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to submit feedback');
        }

        console.log('Server response:', data);
        alert('Feedback submitted successfully!');
        
        // Reset form
        document.getElementById('feedbackForm').reset();

    } catch (error) {
        console.error('Submission error:', error);
        alert(error.message || 'Error submitting feedback');
    }
}

// Add event listener when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Verify form elements are loaded
    const formElements = {
        form: document.getElementById('feedbackForm'),
        name: document.getElementById('feedback-name'),
        email: document.getElementById('feedback-email'),
        category: document.getElementById('feedback-category'),
        message: document.getElementById('feedback-message')
    };

    console.log('Form elements loaded:', {
        formFound: !!formElements.form,
        nameFound: !!formElements.name,
        emailFound: !!formElements.email,
        categoryFound: !!formElements.category,
        messageFound: !!formElements.message
    });

    // Add input event listeners for debugging
    ['name', 'email', 'category', 'message'].forEach(field => {
        const element = document.getElementById(`feedback-${field}`);
        if (element) {
            element.addEventListener('input', function() {
                console.log(`${field} changed:`, this.value);
            });
        }
    });
});

// Update the exit time input validation
document.getElementById('exitTime').addEventListener('change', async function() {
    const exitVehicleNumber = document.getElementById('exitVehicleNumber').value;
    if (!exitVehicleNumber) return;

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/parking/vehicle/${exitVehicleNumber}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const parkingData = await response.json();
        
        if (parkingData && parkingData.entryTime) {
            const entryTime = new Date(parkingData.entryTime);
            const selectedExitTime = new Date(this.value);

            if (selectedExitTime <= entryTime) {
                alert('Exit time must be after the entry time');
                // Reset to entry time + 1 minute
                const minExitTime = new Date(entryTime.getTime() + 60000);
                this.value = formatDateTimeForInput(minExitTime);
            }
        }
    } catch (error) {
        console.error('Error checking entry time:', error);
    }
});

// Helper function to format datetime for input fields
function formatDateTimeForInput(date) {
    return date.toISOString().slice(0, 16);
}

// Add validation for exit time when vehicle number changes
document.getElementById('exitVehicleNumber').addEventListener('change', async function() {
    const vehicleNumber = this.value.trim();
    const exitTimeInput = document.getElementById('exitTime');
    
    if (!vehicleNumber) return;

    try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const response = await fetch(`${API_URL}/parking/vehicle/${vehicleNumber}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            if (response.status === 404) {
                alert('No active parking found for this vehicle');
                exitTimeInput.value = '';
            }
            return;
        }

        const parkingData = await response.json();
        
        // Set minimum exit time to entry time + 1 minute
        const minExitTime = new Date(parkingData.entryTime);
        minExitTime.setMinutes(minExitTime.getMinutes() + 1);
        
        exitTimeInput.min = formatDateTimeForInput(minExitTime);
        if (!exitTimeInput.value) {
            exitTimeInput.value = formatDateTimeForInput(new Date());
        }
    } catch (error) {
        console.error('Error checking vehicle:', error);
    }
});

// Helper function to format datetime for input
function formatDateTimeForInput(date) {
    return new Date(date).toISOString().slice(0, 16);
}

// Function to update active parkings in dashboard
function updateActiveParkings(parkings) {
    const tbody = document.getElementById('activeParkingsTable');
    if (!parkings || parkings.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="no-data">No active parkings</td></tr>';
        return;
    }

    tbody.innerHTML = parkings
        .filter(parking => parking.status === 'active')
        .map(parking => {
            const entryTime = new Date(parking.entryTime);
            const duration = calculateDuration(entryTime);
            
            // Calculate current cost for active parking
            let costDisplay;
            if (duration === 'Not Started') {
                costDisplay = '-';
            } else {
                const currentTime = new Date();
                const currentDuration = (currentTime - entryTime) / (1000 * 60 * 60); // hours
                
                if (currentDuration <= 0) {
                    costDisplay = '-';
                } else {
                    // Calculate cost based on vehicle type
                    let hourlyRate;
                    switch (parking.vehicleType) {
                        case 'bike': hourlyRate = 10; break;
                        case 'car': hourlyRate = 20; break;
                        case 'truck': hourlyRate = 30; break;
                        default: hourlyRate = 20;
                    }
                    const currentCost = Math.max(0, Math.ceil(currentDuration * hourlyRate));
                    costDisplay = currentCost > 0 ? `$${currentCost.toFixed(2)}` : '-';
                }
            }

            return `
                <tr>
                    <td>${parking.vehicleNumber}</td>
                    <td>${parking.vehicleType}</td>
                    <td>${parking.spotNumber || 'N/A'}</td>
                    <td>${formatDateTime(entryTime)}</td>
                    <td>${duration}</td>
                    <td class="cost-column">${costDisplay}</td>
                    <td>
                        <button class="btn-exit" onclick="handleExit('${parking.vehicleNumber}')">
                            Record Exit
                        </button>
                    </td>
                </tr>
            `;
        })
        .join('');
}

// Helper function to calculate duration (same as before)
function calculateDuration(entryTime, exitTime) {
    const start = new Date(entryTime);
    const end = exitTime ? new Date(exitTime) : new Date();
    
    // Calculate difference in milliseconds
    const diff = end - start;
    
    // If duration is negative (future entry time), return "Not Started"
    if (diff < 0) {
        return "Not Started";
    }
    
    // Convert to hours and minutes
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    // Format the duration string
    if (hours === 0) {
        return `${minutes}m`;
    }
    return `${hours}h ${minutes}m`;
}

// Add these styles to your CSS if not already present

// Add at the top of your file


// Update the click handler for nav links
document.addEventListener('DOMContentLoaded', function() {
    // Add click event listeners to all nav links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const pageId = this.getAttribute('data-page');
            
            // Check if trying to access reports
            if (pageId === 'report' && !isAdminAuthenticated) {
                // Hide all pages first
                document.querySelectorAll('.page-content').forEach(page => {
                    page.classList.add('hidden');
                });
                showAdminVerification();
            } else {
                showPage(pageId);
            }
        });
    });

    // Admin verification form handler
    document.getElementById('adminVerifyForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const username = document.getElementById('adminUsername').value;
        const password = document.getElementById('adminPassword').value;

        if (username === 'admin' && password === '1234') {
            isAdminAuthenticated = true;
            hideAdminVerification();
            showPage('report');
        } else {
            alert('Invalid admin credentials');
        }

        // Clear the form
        this.reset();
    });

    // Cancel button handler
    document.getElementById('cancelAdminVerify').addEventListener('click', function() {
        hideAdminVerification();
        // Show dashboard when canceling
        showPage('dashboardPage');
    });

    // Close modal when clicking outside
    document.getElementById('adminVerifyModal').addEventListener('click', function(e) {
        if (e.target === this) {
            hideAdminVerification();
            // Show dashboard when closing
            showPage('dashboardPage');
        }
    });

    // Update logout to clear admin authentication
    document.getElementById('logoutBtn').addEventListener('click', function() {
        localStorage.removeItem('token');
        isAdminAuthenticated = false;
        showPage('loginPage');
    });
});

// Function to show admin verification modal
function showAdminVerification() {
    document.getElementById('adminVerifyModal').style.display = 'block';
}

// Function to hide admin verification modal
function hideAdminVerification() {
    document.getElementById('adminVerifyModal').style.display = 'none';
}