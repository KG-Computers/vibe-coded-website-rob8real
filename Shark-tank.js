// Eel Pool - Investment Game App

// Disable console access
(function() {
    const noop = function() {};
    const methods = ['log', 'warn', 'error', 'info', 'debug', 'trace', 'dir', 'dirxml', 'group', 'groupEnd', 'time', 'timeEnd', 'assert', 'profile'];
    
    for (let i = 0; i < methods.length; i++) {
        console[methods[i]] = noop;
    }
})();

// Disable right-click, F12, and developer shortcuts
document.addEventListener('contextmenu', e => e.preventDefault());
document.addEventListener('keydown', e => {
    // Disable F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U, Ctrl+Shift+C
    if (e.keyCode === 123 || 
        (e.ctrlKey && e.shiftKey && (e.keyCode === 73 || e.keyCode === 74 || e.keyCode === 67)) ||
        (e.ctrlKey && e.keyCode === 85)) {
        e.preventDefault();
        return false;
    }
});

// Disable network inspection
(function() {
    // Block access to DevTools network tab by detecting and clearing it
    setInterval(function() {
        if (window.performance && window.performance.getEntries) {
            window.performance.clearResourceTimings();
            window.performance.clearMarks();
            window.performance.clearMeasures();
        }
    }, 100);
    
    // Detect if DevTools is open and reload page
    const devtools = { isOpen: false };
    const threshold = 160;
    
    setInterval(function() {
        if (window.outerWidth - window.innerWidth > threshold || 
            window.outerHeight - window.innerHeight > threshold) {
            if (!devtools.isOpen) {
                devtools.isOpen = true;
                window.location.reload();
            }
        } else {
            devtools.isOpen = false;
        }
    }, 500);
})();

let currentUser = null;
let presentations = [];
let categories = [];
let selectedPresentation = null;
let selectedAmount = 0;
let isSignupMode = false;
let selectedCategoryFilter = '';

// DOM Elements
const loginModal = document.getElementById('loginModal');
const pitchModal = document.getElementById('pitchModal');
const investModal = document.getElementById('investModal');
const myInvestmentsModal = document.getElementById('myInvestmentsModal');
const adminModal = document.getElementById('adminModal');
const leaderboardModal = document.getElementById('leaderboardModal');
const categoriesModal = document.getElementById('categoriesModal');
const presentationsList = document.getElementById('presentationsList');
const userBalance = document.getElementById('userBalance');
const loginBtn = document.getElementById('loginBtn');
const myInvestmentsBtn = document.getElementById('myInvestmentsBtn');
const adminPanelBtn = document.getElementById('adminPanelBtn');
const leaderboardBtn = document.getElementById('leaderboardBtn');
const categoriesBtn = document.getElementById('categoriesBtn');
const themeToggle = document.getElementById('themeToggle');
const mobileToggle = document.getElementById('mobileToggle');

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    checkSession();
    loadCategories();
    loadPresentations();
    setupEventListeners();
    loadTheme();
    loadMobileMode();
});

// Load saved theme
function loadTheme() {
    const savedTheme = localStorage.getItem('sharkTankTheme');
    if (savedTheme === 'light') {
        document.body.classList.add('light-mode');
        themeToggle.textContent = '🌙';
    } else {
        themeToggle.textContent = '☀️';
    }
}

// Toggle theme
function toggleTheme() {
    document.body.classList.toggle('light-mode');
    
    if (document.body.classList.contains('light-mode')) {
        localStorage.setItem('sharkTankTheme', 'light');
        themeToggle.textContent = '🌙';
    } else {
        localStorage.setItem('sharkTankTheme', 'dark');
        themeToggle.textContent = '☀️';
    }
}

// Load saved mobile mode
function loadMobileMode() {
    const savedMode = localStorage.getItem('sharkTankMobile');
    if (savedMode === 'true') {
        document.body.classList.add('mobile-mode');
        mobileToggle.textContent = '🖥️';
    } else {
        mobileToggle.textContent = '📱';
    }
}

// Toggle mobile mode
function toggleMobileMode() {
    document.body.classList.toggle('mobile-mode');
    
    if (document.body.classList.contains('mobile-mode')) {
        localStorage.setItem('sharkTankMobile', 'true');
        mobileToggle.textContent = '🖥️';
    } else {
        localStorage.setItem('sharkTankMobile', 'false');
        mobileToggle.textContent = '📱';
    }
}

// Check if user is logged in
async function checkSession() {
    try {
        const response = await fetch('index.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: 'action=get_session'
        });
        const data = await response.json();
        
        if (data.logged_in) {
            currentUser = data.user;
            updateUserUI();
        }
    } catch (error) {
        console.error('Session check failed:', error);
    }
}

// Update UI based on user state
function updateUserUI() {
    const userAccountInfo = document.getElementById('userAccountInfo');
    const userName = document.getElementById('userName');
    const userType = document.getElementById('userType');
    
    if (currentUser) {
        const roleEmoji = {
            'operator': '⚙️',
            'teacher': '👨‍🏫',
            'student': '🎓'
        };
        const roleLabels = {
            'operator': 'Operator',
            'teacher': 'Teacher',
            'student': 'Student'
        };
        const emoji = roleEmoji[currentUser.account_type] || '🎓';
        const label = roleLabels[currentUser.account_type] || 'Student';
        
        // Show account info
        userAccountInfo.style.display = 'flex';
        userName.textContent = currentUser.username;
        userType.textContent = `${emoji} ${label}`;
        userType.className = `user-type-badge ${currentUser.account_type}`;
        
        userBalance.textContent = `$${Number(currentUser.balance).toLocaleString()}`;
        loginBtn.textContent = 'Logout';
        myInvestmentsBtn.style.display = 'inline-block';
        
        // Show admin button only for operators
        if (currentUser.account_type === 'operator') {
            adminPanelBtn.style.display = 'inline-block';
        } else {
            adminPanelBtn.style.display = 'none';
        }
        
        // Show categories button for teachers and operators
        if (currentUser.account_type === 'operator' || currentUser.account_type === 'teacher') {
            categoriesBtn.style.display = 'inline-block';
        } else {
            categoriesBtn.style.display = 'none';
        }
    } else {
        userAccountInfo.style.display = 'none';
        userBalance.textContent = '';
        loginBtn.textContent = 'Login';
        myInvestmentsBtn.style.display = 'none';
        adminPanelBtn.style.display = 'none';
        categoriesBtn.style.display = 'none';
    }
}

// Load all presentations
async function loadPresentations() {
    try {
        let body = 'action=get_presentations';
        if (selectedCategoryFilter) {
            body += `&category_id=${selectedCategoryFilter}`;
        }
        
        const response = await fetch('index.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: body
        });
        const data = await response.json();
        
        if (data.success) {
            presentations = data.presentations;
            renderPresentations();
            
            // Setup pitch search functionality
            const pitchSearchInput = document.getElementById('pitchSearchInput');
            if (pitchSearchInput && !pitchSearchInput.dataset.listenerAttached) {
                pitchSearchInput.dataset.listenerAttached = 'true';
                pitchSearchInput.addEventListener('input', filterPresentations);
            }
        }
    } catch (error) {
        console.error('Failed to load presentations:', error);
    }
}

// Filter presentations based on search input
function filterPresentations() {
    const searchTerm = document.getElementById('pitchSearchInput').value.toLowerCase().trim();
    renderPresentations(searchTerm);
}

// Load all categories
async function loadCategories() {
    try {
        const response = await fetch('index.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: 'action=get_categories'
        });
        const data = await response.json();
        
        if (data.success) {
            categories = data.categories;
            updateCategoryDropdowns();
        }
    } catch (error) {
        console.error('Failed to load categories:', error);
    }
}

// Update all category dropdowns
function updateCategoryDropdowns() {
    // Update filter dropdown
    const filterDropdown = document.getElementById('categoryFilter');
    filterDropdown.innerHTML = '<option value="">All Categories</option>' + 
        categories.map(c => `<option value="${c.id}">${escapeHtml(c.name)} (${c.teacher_name})</option>`).join('');
    filterDropdown.value = selectedCategoryFilter;
    
    // Update pitch modal dropdown with max funding goal info
    const pitchDropdown = document.getElementById('pitchCategory');
    pitchDropdown.innerHTML = '<option value="">No Category</option>' + 
        categories.map(c => {
            const maxGoal = c.max_funding_goal ? ` - Max $${Number(c.max_funding_goal).toLocaleString()}` : '';
            return `<option value="${c.id}" data-max-goal="${c.max_funding_goal || ''}">${escapeHtml(c.name)}${maxGoal}</option>`;
        }).join('');
    
    // Add change listener for category selection to update max funding goal hint
    pitchDropdown.onchange = updateFundingGoalHint;
}

// Update funding goal hint based on selected category
function updateFundingGoalHint() {
    const pitchDropdown = document.getElementById('pitchCategory');
    const goalInput = document.getElementById('pitchGoal');
    const selectedOption = pitchDropdown.options[pitchDropdown.selectedIndex];
    const maxGoal = selectedOption.dataset.maxGoal;
    
    // Remove existing hint
    let hint = document.getElementById('fundingGoalHint');
    if (!hint) {
        hint = document.createElement('div');
        hint.id = 'fundingGoalHint';
        hint.className = 'funding-goal-hint';
        goalInput.parentNode.insertBefore(hint, goalInput.nextSibling);
    }
    
    if (maxGoal) {
        hint.textContent = `Maximum for this category: $${Number(maxGoal).toLocaleString()}`;
        hint.style.display = 'block';
        goalInput.max = maxGoal;
    } else {
        hint.textContent = '';
        hint.style.display = 'none';
        goalInput.removeAttribute('max');
    }
}

// Render presentations list
function renderPresentations(searchTerm = '') {
    // Filter presentations based on search term
    let filteredPresentations = presentations;
    
    if (searchTerm) {
        filteredPresentations = presentations.filter(p => 
            p.title.toLowerCase().includes(searchTerm) ||
            p.description.toLowerCase().includes(searchTerm) ||
            (p.presenter_name && p.presenter_name.toLowerCase().includes(searchTerm)) ||
            (p.category_name && p.category_name.toLowerCase().includes(searchTerm))
        );
    }
    
    if (filteredPresentations.length === 0) {
        presentationsList.innerHTML = `
            <div class="empty-state">
                <div class="emoji">🌊</div>
                <h3>${searchTerm ? 'No Matching Pitches' : 'No Pitches Yet'}</h3>
                <p>${searchTerm ? 'Try a different search term' : 'Be the first to present your idea!'}</p>
            </div>
        `;
        return;
    }
    
    presentationsList.innerHTML = filteredPresentations.map(p => {
        const progress = Math.min((p.total_invested / p.funding_goal) * 100, 100);
        const isOwner = currentUser && currentUser.id == p.user_id;
        const categoryBadge = p.category_name ? 
            `<div class="category-badge">📚 ${escapeHtml(p.category_name)}</div>` : '';
        
        return `
            <div class="pitch-card">
                <div class="pitch-card-content" onclick="openInvestModal(${p.id})">
                    ${categoryBadge}
                    <h3>${escapeHtml(p.title)}</h3>
                    <div class="presenter">by ${escapeHtml(p.presenter_name || 'Anonymous')}</div>
                    <div class="description">${escapeHtml(p.description)}</div>
                    <div class="pitch-stats">
                        <span class="raised">$${Number(p.total_invested).toLocaleString()}</span>
                        <span class="goal">of $${Number(p.funding_goal).toLocaleString()}</span>
                    </div>
                    <div class="progress-container">
                        <div class="progress-bar" style="width: ${progress}%"></div>
                    </div>
                    <div class="investor-count">👥 ${p.investor_count} investor${p.investor_count != 1 ? 's' : ''}</div>
                </div>
                <div class="pitch-card-buttons">
                    ${isOwner ? `<button class="delete-pitch-btn" onclick="event.stopPropagation(); deletePresentation(${p.id}, '${escapeHtml(p.title)}')">🗑️ Delete</button>` : ''}
                    ${currentUser && currentUser.account_type === 'operator' ? `<button class="force-invest-btn" onclick="event.stopPropagation(); openForceInvestModal(${p.id}, '${escapeHtml(p.title)}')">⚡ Force Invest</button>` : ''}
                </div>
            </div>
        `;
    }).join('');
}

// Setup event listeners
function setupEventListeners() {
    // Dropdown menu toggle
    const menuToggle = document.getElementById('menuToggle');
    const dropdownContent = document.getElementById('dropdownContent');
    
    menuToggle.onclick = (e) => {
        e.stopPropagation();
        dropdownContent.classList.toggle('show');
    };
    
    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.dropdown-menu')) {
            dropdownContent.classList.remove('show');
        }
    });
    
    // Theme toggle
    themeToggle.onclick = () => {
        toggleTheme();
        dropdownContent.classList.remove('show');
    };
    
    // Mobile toggle
    mobileToggle.onclick = () => {
        toggleMobileMode();
        dropdownContent.classList.remove('show');
    };
    
    // Login button
    loginBtn.onclick = () => {
        dropdownContent.classList.remove('show');
        if (currentUser) {
            logout();
        } else {
            loginModal.style.display = 'flex';
        }
    };
    
    // New pitch button
    document.getElementById('newPitchBtn').onclick = () => {
        if (!currentUser) {
            alert('Please login first!');
            loginModal.style.display = 'flex';
            return;
        }
        pitchModal.style.display = 'flex';
    };
    
    // Login submit
    document.getElementById('loginSubmit').onclick = login;
    
    // Submit pitch
    document.getElementById('submitPitch').onclick = createPitch;
    
    // Amount buttons
    document.querySelectorAll('.amount-btn').forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll('.amount-btn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            selectedAmount = parseInt(btn.dataset.amount);
            document.getElementById('customAmount').value = '';
        };
    });
    
    // Custom amount
    document.getElementById('customAmount').oninput = (e) => {
        document.querySelectorAll('.amount-btn').forEach(b => b.classList.remove('selected'));
        selectedAmount = parseInt(e.target.value) || 0;
    };
    
    // Confirm investment
    document.getElementById('confirmInvest').onclick = invest;
    
    // Close modals
    document.querySelectorAll('.closeModal').forEach(btn => {
        btn.onclick = () => {
            loginModal.style.display = 'none';
            pitchModal.style.display = 'none';
            investModal.style.display = 'none';
            myInvestmentsModal.style.display = 'none';
            adminModal.style.display = 'none';
            leaderboardModal.style.display = 'none';
            categoriesModal.style.display = 'none';
            const privacyModal = document.getElementById('privacyPolicyModal');
            if (privacyModal) privacyModal.style.display = 'none';
        };
    });
    
    // Privacy policy link
    const showPrivacyLink = document.getElementById('showPrivacyPolicy');
    if (showPrivacyLink) {
        showPrivacyLink.onclick = (e) => {
            e.preventDefault();
            document.getElementById('privacyPolicyModal').style.display = 'flex';
        };
    }
    
    // Close modal on outside click
    [loginModal, pitchModal, investModal, myInvestmentsModal, adminModal, leaderboardModal, categoriesModal].forEach(modal => {
        modal.onclick = (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        };
    });
    
    // My Investments button
    myInvestmentsBtn.onclick = () => {
        dropdownContent.classList.remove('show');
        openMyInvestments();
    };
    
    // Admin Panel button
    adminPanelBtn.onclick = () => {
        dropdownContent.classList.remove('show');
        openAdminPanel();
    };
    
    // Leaderboard button
    leaderboardBtn.onclick = () => {
        dropdownContent.classList.remove('show');
        openLeaderboard();
    };
    
    // Categories button
    categoriesBtn.onclick = () => {
        dropdownContent.classList.remove('show');
        openCategoriesModal();
    };
    
    // Create category button
    document.getElementById('createCategoryBtn').onclick = createCategory;
    
    // Category filter change
    document.getElementById('categoryFilter').onchange = (e) => {
        selectedCategoryFilter = e.target.value;
        loadPresentations();
    };
    
    // Enter key for login
    document.getElementById('usernameInput').onkeypress = (e) => {
        if (e.key === 'Enter') document.getElementById('passwordInput').focus();
    };
    
    document.getElementById('passwordInput').onkeypress = (e) => {
        if (e.key === 'Enter') handleAuth();
    };
    
    // Auth switch link
    document.getElementById('authSwitchLink').onclick = (e) => {
        e.preventDefault();
        toggleAuthMode();
    };
    
    // Account type change - show/hide role password
    document.getElementById('accountTypeSelect').onchange = (e) => {
        const rolePasswordContainer = document.getElementById('rolePasswordContainer');
        const rolePasswordHint = document.getElementById('rolePasswordHint');
        const accountType = e.target.value;
        
        // Always show role password for all account types during signup
        rolePasswordContainer.style.display = 'block';
        
        if (accountType === 'operator') {
            rolePasswordHint.textContent = 'Enter operator password to create admin account';
        } else if (accountType === 'teacher') {
            rolePasswordHint.textContent = 'Enter teacher password to create teacher account';
        } else {
            rolePasswordHint.textContent = 'Enter student password to create student account';
        }
    };
}

// Toggle between login and signup mode
function toggleAuthMode() {
    isSignupMode = !isSignupMode;
    
    const title = document.getElementById('authTitle');
    const subtitle = document.getElementById('authSubtitle');
    const submitBtn = document.getElementById('loginSubmit');
    const switchText = document.getElementById('authSwitchText');
    const switchLink = document.getElementById('authSwitchLink');
    const accountTypeContainer = document.getElementById('accountTypeContainer');
    const rolePasswordContainer = document.getElementById('rolePasswordContainer');
    const privacyPolicyContainer = document.getElementById('privacyPolicyContainer');
    
    if (isSignupMode) {
        title.textContent = '🌊 Sign Up';
        subtitle.textContent = 'Create an account to get $100,000!';
        submitBtn.textContent = 'Create Account';
        switchText.textContent = 'Already have an account?';
        switchLink.textContent = 'Login';
        accountTypeContainer.style.display = 'block';
        privacyPolicyContainer.style.display = 'block';
        // Reset and show role password for students by default
        document.getElementById('accountTypeSelect').value = 'student';
        rolePasswordContainer.style.display = 'block';
        document.getElementById('rolePasswordInput').value = '';
        document.getElementById('rolePasswordHint').textContent = 'Enter student password to create student account';
        document.getElementById('privacyPolicyCheckbox').checked = false;
    } else {
        title.textContent = '🌊 Login';
        subtitle.textContent = 'Welcome back, shark!';
        submitBtn.textContent = 'Login';
        switchText.textContent = "Don't have an account?";
        switchLink.textContent = 'Sign Up';
        accountTypeContainer.style.display = 'none';
        rolePasswordContainer.style.display = 'none';
        privacyPolicyContainer.style.display = 'none';
        document.getElementById('rolePasswordInput').value = '';
    }
}

// Handle auth (login or signup)
async function handleAuth() {
    const username = document.getElementById('usernameInput').value.trim();
    const password = document.getElementById('passwordInput').value;
    
    if (!username) {
        alert('Please enter a username!');
        return;
    }
    
    if (!password) {
        alert('Please enter a password!');
        return;
    }
    
    // Check privacy policy agreement for signup
    if (isSignupMode) {
        const privacyCheckbox = document.getElementById('privacyPolicyCheckbox');
        if (!privacyCheckbox.checked) {
            alert('You must agree to the Privacy Policy to create an account.');
            return;
        }
        
        // Check role password is provided
        const rolePassword = document.getElementById('rolePasswordInput').value;
        if (!rolePassword) {
            alert('Please enter the role password for your account type.');
            return;
        }
    }
    
    const action = isSignupMode ? 'signup' : 'login';
    let body = `action=${action}&username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`;
    
    // Include account type and role password for signup
    if (isSignupMode) {
        const accountType = document.getElementById('accountTypeSelect').value;
        const rolePassword = document.getElementById('rolePasswordInput').value;
        body += `&account_type=${encodeURIComponent(accountType)}`;
        body += `&role_password=${encodeURIComponent(rolePassword)}`;
    }
    
    try {
        const response = await fetch('index.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: body
        });
        const data = await response.json();
        
        if (data.success) {
            currentUser = data.user;
            updateUserUI();
            loginModal.style.display = 'none';
            document.getElementById('usernameInput').value = '';
            document.getElementById('passwordInput').value = '';
            document.getElementById('rolePasswordInput').value = '';
            isSignupMode = false;
            toggleAuthMode(); // Reset to login mode
            toggleAuthMode(); // Toggle back to set correct state
        } else {
            alert(data.message || 'Authentication failed');
        }
    } catch (error) {
        console.error('Auth failed:', error);
        alert('Authentication failed. Please check your connection.');
    }
}

// Login function (legacy, now uses handleAuth)
async function login() {
    handleAuth();
}

// Logout function
async function logout() {
    try {
        await fetch('index.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: 'action=logout'
        });
        currentUser = null;
        updateUserUI();
    } catch (error) {
        console.error('Logout failed:', error);
    }
}

// Create new pitch
async function createPitch() {
    const title = document.getElementById('pitchTitle').value.trim();
    const description = document.getElementById('pitchDescription').value.trim();
    const goal = parseInt(document.getElementById('pitchGoal').value) || 0;
    const categoryId = document.getElementById('pitchCategory').value;
    const pitchDropdown = document.getElementById('pitchCategory');
    const selectedOption = pitchDropdown.options[pitchDropdown.selectedIndex];
    const maxGoal = selectedOption.dataset.maxGoal ? parseInt(selectedOption.dataset.maxGoal) : null;
    
    if (!title || !description || goal < 1000) {
        alert('Please fill in all fields. Goal must be at least $1,000.');
        return;
    }
    
    // Validate against category max funding goal
    if (maxGoal && goal > maxGoal) {
        alert(`Funding goal exceeds the maximum for this category ($${maxGoal.toLocaleString()}).`);
        return;
    }
    
    try {
        let body = `action=create_presentation&title=${encodeURIComponent(title)}&description=${encodeURIComponent(description)}&goal=${goal}`;
        if (categoryId) {
            body += `&category_id=${categoryId}`;
        }
        
        const response = await fetch('index.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: body
        });
        const data = await response.json();
        
        if (data.success) {
            pitchModal.style.display = 'none';
            document.getElementById('pitchTitle').value = '';
            document.getElementById('pitchDescription').value = '';
            document.getElementById('pitchGoal').value = '';
            document.getElementById('pitchCategory').value = '';
            loadPresentations();
        } else {
            alert(data.message || 'Failed to create pitch');
        }
    } catch (error) {
        console.error('Create pitch failed:', error);
        alert('Failed to create pitch. Please try again.');
    }
}

// Open investment modal
async function openInvestModal(id) {
    if (!currentUser) {
        alert('Please login to invest!');
        loginModal.style.display = 'flex';
        return;
    }
    
    selectedPresentation = presentations.find(p => p.id == id);
    if (!selectedPresentation) return;
    
    document.getElementById('investTitle').textContent = selectedPresentation.title;
    document.getElementById('investDescription').textContent = selectedPresentation.description;
    document.getElementById('investGoal').textContent = `Goal: $${Number(selectedPresentation.funding_goal).toLocaleString()}`;
    document.getElementById('investRaised').textContent = `Raised: $${Number(selectedPresentation.total_invested).toLocaleString()}`;
    
    const progress = Math.min((selectedPresentation.total_invested / selectedPresentation.funding_goal) * 100, 100);
    document.getElementById('investProgressBar').style.width = `${progress}%`;
    
    selectedAmount = 0;
    document.querySelectorAll('.amount-btn').forEach(b => b.classList.remove('selected'));
    document.getElementById('customAmount').value = '';
    document.getElementById('investComment').value = '';
    
    // Load comments
    await loadComments(id);
    
    investModal.style.display = 'flex';
}

// Load comments for a presentation
async function loadComments(presentationId) {
    try {
        const response = await fetch('index.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `action=get_comments&presentation_id=${presentationId}`
        });
        const data = await response.json();
        
        const commentsList = document.getElementById('commentsList');
        
        if (data.success && data.comments.length > 0) {
            commentsList.innerHTML = data.comments.map(c => `
                <div class="comment-item">
                    <div class="comment-header">
                        <strong>Anonymous Investor</strong>
                        <span class="comment-amount">$${Number(c.amount).toLocaleString()}</span>
                    </div>
                    <p class="comment-text">${escapeHtml(c.comment)}</p>
                </div>
            `).join('');
            document.getElementById('investComments').style.display = 'block';
        } else {
            commentsList.innerHTML = '<p class="no-comments">No comments yet. Be the first!</p>';
            document.getElementById('investComments').style.display = 'block';
        }
    } catch (error) {
        console.error('Failed to load comments:', error);
    }
}

// Invest in presentation
async function invest() {
    if (!selectedPresentation || selectedAmount <= 0) {
        alert('Please select an amount to invest!');
        return;
    }
    
    if (selectedAmount > currentUser.balance) {
        alert('Insufficient funds!');
        return;
    }
    
    const comment = document.getElementById('investComment').value.trim();
    
    try {
        const response = await fetch('index.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `action=invest&presentation_id=${selectedPresentation.id}&amount=${selectedAmount}&comment=${encodeURIComponent(comment)}`
        });
        const data = await response.json();
        
        if (data.success) {
            currentUser.balance = data.new_balance;
            updateUserUI();
            investModal.style.display = 'none';
            loadPresentations();
            alert(`Successfully invested $${selectedAmount.toLocaleString()}!`);
        } else {
            alert(data.message || 'Investment failed');
        }
    } catch (error) {
        console.error('Investment failed:', error);
        alert('Investment failed. Please try again.');
    }
}

// Open Force Invest Modal
function openForceInvestModal(presentationId, title) {
    const modal = document.createElement('div');
    modal.className = 'modal force-invest-modal';
    modal.style.display = 'flex';
    modal.innerHTML = `
        <div class="modal-content">
            <h2>⚡ Force Investment</h2>
            <p>Pitch: <strong>${escapeHtml(title)}</strong></p>
            <p>Enter the amount to withdraw from each account:</p>
            <input type="number" id="forceInvestAmount" placeholder="Amount per account" min="1000" step="1000">
            <div class="modal-buttons">
                <button class="btn-primary" onclick="executeForceInvest(${presentationId}, this.parentElement.parentElement.parentElement)">Execute Force Investment</button>
                <button class="btn-secondary" onclick="this.parentElement.parentElement.parentElement.remove()">Cancel</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    document.getElementById('forceInvestAmount').focus();
}

// Execute Force Investment
async function executeForceInvest(presentationId, modal) {
    const amount = parseInt(document.getElementById('forceInvestAmount').value) || 0;
    
    if (amount < 1000) {
        alert('Amount must be at least $1,000');
        return;
    }
    
    if (!confirm(`⚠️ Are you sure you want to force invest $${amount.toLocaleString()} from every account into this pitch?\n\nThis will deduct from all student and teacher accounts.`)) {
        return;
    }
    
    try {
        const response = await fetch('index.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `action=force_invest&presentation_id=${presentationId}&amount=${amount}`
        });
        const data = await response.json();
        
        if (data.success) {
            modal.remove();
            alert(data.message || 'Force investment completed!');
            loadPresentations();
            loadAdminUsers();
        } else {
            alert(data.message || 'Force investment failed');
        }
    } catch (error) {
        console.error('Force investment failed:', error);
        alert('Force investment failed. Please try again.');
    }
}

// Utility: Escape HTML
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Delete presentation
async function deletePresentation(presentationId, title) {
    if (!confirm(`Are you sure you want to delete "${title}"?\n\nAll investments will be refunded to investors.`)) {
        return;
    }
    
    try {
        const response = await fetch('index.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `action=delete_presentation&presentation_id=${presentationId}`
        });
        const data = await response.json();
        
        if (data.success) {
            alert('Presentation deleted successfully!');
            loadPresentations();
        } else {
            alert(data.message || 'Failed to delete presentation');
        }
    } catch (error) {
        console.error('Delete failed:', error);
        alert('Failed to delete presentation. Please try again.');
    }
}

// Open My Investments modal
async function openMyInvestments() {
    if (!currentUser) {
        alert('Please login first!');
        return;
    }
    
    try {
        const response = await fetch('index.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: 'action=get_my_investments'
        });
        const data = await response.json();
        
        if (data.success) {
            renderMyInvestments(data.investments);
            myInvestmentsModal.style.display = 'flex';
        }
    } catch (error) {
        console.error('Failed to load investments:', error);
        alert('Failed to load investments');
    }
}

// Render my investments list
function renderMyInvestments(investments) {
    const list = document.getElementById('myInvestmentsList');
    
    if (investments.length === 0) {
        list.innerHTML = `
            <div class="empty-state" style="padding: 20px;">
                <p>You haven't made any investments yet.</p>
            </div>
        `;
        return;
    }
    
    list.innerHTML = investments.map(inv => `
        <div class="investment-item">
            <div class="investment-info">
                <strong>${escapeHtml(inv.presentation_title)}</strong>
                <span class="investment-amount">$${Number(inv.amount).toLocaleString()}</span>
            </div>
            <div class="investment-actions">
                <input type="number" class="edit-amount-input" id="edit-amount-${inv.id}" 
                       value="${inv.amount}" min="0" step="100" 
                       placeholder="New amount">
                <button class="edit-btn" onclick="editInvestment(${inv.id}, ${inv.amount})">
                    Update
                </button>
            </div>
        </div>
    `).join('');
}

// Edit investment amount
async function editInvestment(investmentId, currentAmount) {
    const input = document.getElementById(`edit-amount-${investmentId}`);
    const newAmount = parseInt(input.value) || 0;
    
    if (newAmount === currentAmount) {
        alert('Amount is the same. No changes made.');
        return;
    }
    
    const difference = newAmount - currentAmount;
    let confirmMessage;
    
    if (newAmount <= 0) {
        confirmMessage = `Are you sure you want to remove this investment? You will get $${currentAmount.toLocaleString()} back.`;
    } else if (difference > 0) {
        confirmMessage = `This will invest an additional $${difference.toLocaleString()}. New total: $${newAmount.toLocaleString()}. Continue?`;
    } else {
        confirmMessage = `This will reduce your investment by $${Math.abs(difference).toLocaleString()}. New total: $${newAmount.toLocaleString()}. Continue?`;
    }
    
    if (!confirm(confirmMessage)) {
        return;
    }
    
    try {
        const response = await fetch('index.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `action=change_investment&investment_id=${investmentId}&new_amount=${newAmount}`
        });
        const data = await response.json();
        
        if (data.success) {
            currentUser.balance = data.new_balance;
            updateUserUI();
            
            if (data.removed) {
                alert(`Investment removed! $${currentAmount.toLocaleString()} returned to your balance.`);
            } else {
                alert(`Investment updated to $${data.new_amount.toLocaleString()}!`);
            }
            openMyInvestments(); // Refresh the list
            loadPresentations(); // Refresh presentations to update totals
        } else {
            alert(data.message || 'Update failed');
        }
    } catch (error) {
        console.error('Update failed:', error);
        alert('Update failed. Please try again.');
    }
}

// Open Admin Panel
async function openAdminPanel() {
    if (!currentUser || currentUser.account_type !== 'operator') {
        alert('Access denied. Operators only.');
        return;
    }
    
    adminModal.style.display = 'flex';
    await loadAdminUsers();
}

// Store all users for filtering
let allAdminUsers = [];

// Load all users for admin panel
async function loadAdminUsers() {
    try {
        const response = await fetch('index.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: 'action=get_all_users'
        });
        const data = await response.json();
        
        if (data.success) {
            allAdminUsers = data.users;
            renderAdminUsers(allAdminUsers);
            
            // Setup search functionality
            const searchInput = document.getElementById('adminSearchInput');
            if (searchInput && !searchInput.dataset.listenerAttached) {
                searchInput.dataset.listenerAttached = 'true';
                searchInput.addEventListener('input', filterAdminUsers);
            }
        } else {
            document.getElementById('adminUsersList').innerHTML = `<p class="error">${data.message}</p>`;
        }
    } catch (error) {
        console.error('Failed to load users:', error);
        document.getElementById('adminUsersList').innerHTML = '<p class="error">Failed to load users</p>';
    }
}

// Filter admin users based on search input
function filterAdminUsers() {
    const searchTerm = document.getElementById('adminSearchInput').value.toLowerCase().trim();
    
    if (searchTerm === '') {
        renderAdminUsers(allAdminUsers);
    } else {
        const filtered = allAdminUsers.filter(user => 
            user.username.toLowerCase().includes(searchTerm) ||
            user.account_type.toLowerCase().includes(searchTerm)
        );
        renderAdminUsers(filtered);
    }
}

// Render admin users list
function renderAdminUsers(users) {
    const container = document.getElementById('adminUsersList');
    
    if (users.length === 0) {
        container.innerHTML = '<p class="no-data">No users found</p>';
        return;
    }
    
    const roleEmoji = {
        'operator': '⚙️',
        'teacher': '👨‍🏫',
        'student': '🎓'
    };
    
    container.innerHTML = users.map(user => {
        const isBanned = user.is_banned == 1;
        const bannedBadge = isBanned ? '<span class="banned-badge">🚫 BANNED</span>' : '';
        
        return `
        <div class="admin-user-card ${isBanned ? 'banned-user' : ''}" data-user-id="${user.id}">
            <div class="user-header">
                <span class="user-name">${roleEmoji[user.account_type] || '🎓'} ${user.username}</span>
                ${user.id === currentUser.id ? '<span class="you-badge">(You)</span>' : ''}
                ${bannedBadge}
            </div>
            <div class="user-controls">
                <div class="control-group">
                    <label>Role:</label>
                    <select class="role-select" onchange="updateAccountType(${user.id}, this.value)" ${user.id === currentUser.id || isBanned ? 'disabled' : ''}>
                        <option value="student" ${user.account_type === 'student' ? 'selected' : ''}>🎓 Student</option>
                        <option value="teacher" ${user.account_type === 'teacher' ? 'selected' : ''}>👨‍🏫 Teacher</option>
                        <option value="operator" ${user.account_type === 'operator' ? 'selected' : ''}>⚙️ Operator</option>
                    </select>
                </div>
                <div class="control-group">
                    <label>Balance: $</label>
                    <input type="number" class="balance-input" value="${user.balance}" min="0" 
                           onchange="updateBalance(${user.id}, this.value)" ${isBanned ? 'disabled' : ''}>
                    <span class="balance-display">($${Number(user.balance).toLocaleString()})</span>
                </div>
                ${user.id !== currentUser.id ? (isBanned ? `
                    <button class="unban-user-btn" onclick="unbanUser(${user.id}, '${user.username}')">✅ Unban User</button>
                ` : `
                    <button class="ban-user-btn" onclick="banUser(${user.id}, '${user.username}')">🚫 Ban User</button>
                    <button class="delete-user-btn" onclick="deleteUser(${user.id}, '${user.username}')">🗑️ Delete</button>
                `) : ''}
            </div>
        </div>
    `}).join('');
}

// Update account type
async function updateAccountType(userId, newType) {
    try {
        const response = await fetch('index.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `action=update_account_type&user_id=${userId}&account_type=${newType}`
        });
        const data = await response.json();
        
        if (data.success) {
            loadAdminUsers(); // Refresh the list
        } else {
            alert(data.message || 'Failed to update account type');
            loadAdminUsers(); // Reset the dropdown
        }
    } catch (error) {
        console.error('Update failed:', error);
        alert('Failed to update account type');
    }
}

// Update user balance
async function updateBalance(userId, newBalance) {
    try {
        const response = await fetch('index.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `action=update_balance&user_id=${userId}&balance=${newBalance}`
        });
        const data = await response.json();
        
        if (data.success) {
            // If updating own balance, refresh UI
            if (userId === currentUser.id) {
                currentUser.balance = parseInt(newBalance);
                updateUserUI();
            }
        } else {
            alert(data.message || 'Failed to update balance');
            loadAdminUsers();
        }
    } catch (error) {
        console.error('Update failed:', error);
        alert('Failed to update balance');
    }
}

// Delete user
async function deleteUser(userId, username) {
    if (!confirm(`Are you sure you want to delete user "${username}"? This will also delete all their presentations and investments.`)) {
        return;
    }
    
    try {
        const response = await fetch('index.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `action=delete_user&user_id=${userId}`
        });
        const data = await response.json();
        
        if (data.success) {
            loadAdminUsers();
            loadPresentations(); // Refresh presentations
        } else {
            alert(data.message || 'Failed to delete user');
        }
    } catch (error) {
        console.error('Delete failed:', error);
        alert('Failed to delete user');
    }
}

// Ban user
async function banUser(userId, username) {
    if (!confirm(`⚠️ Are you sure you want to PERMANENTLY BAN "${username}"?\n\nThis will:\n- Mark their account as banned\n- Refund all their investments back to them\n- Delete all their pitches\n- Prevent them from logging in again\n\nThis action is for privacy policy violations and cannot be undone.`)) {
        return;
    }
    
    try {
        const response = await fetch('index.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `action=ban_user&user_id=${userId}`
        });
        const data = await response.json();
        
        if (data.success) {
            alert(`User "${username}" has been permanently banned.`);
            loadAdminUsers();
            loadPresentations(); // Refresh presentations
        } else {
            alert(data.message || 'Failed to ban user');
        }
    } catch (error) {
        console.error('Ban failed:', error);
        alert('Failed to ban user');
    }
}

// Unban User
async function unbanUser(userId, username) {
    if (!confirm(`Are you sure you want to UNBAN "${username}"?\n\nThis will allow them to log in again.`)) {
        return;
    }
    
    try {
        const response = await fetch('index.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `action=unban_user&user_id=${userId}`
        });
        const data = await response.json();
        
        if (data.success) {
            alert(`User "${username}" has been unbanned.`);
            loadAdminUsers();
        } else {
            alert(data.message || 'Failed to unban user');
        }
    } catch (error) {
        console.error('Unban failed:', error);
        alert('Failed to unban user');
    }
}

// Leaderboard level filter
let selectedLeaderboardLevel = 'all';

// Open Leaderboard
function openLeaderboard() {
    leaderboardModal.style.display = 'flex';
    selectedLeaderboardLevel = 'all';
    updateLeaderboardLevelTabs();
    renderLeaderboard();
    
    // Setup level tab listeners
    document.querySelectorAll('.level-tab').forEach(tab => {
        tab.onclick = () => {
            selectedLeaderboardLevel = tab.dataset.level;
            updateLeaderboardLevelTabs();
            renderLeaderboard();
        };
    });
}

// Update level tab active state
function updateLeaderboardLevelTabs() {
    document.querySelectorAll('.level-tab').forEach(tab => {
        if (tab.dataset.level === selectedLeaderboardLevel) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    });
}

// Get category level from category name
function getCategoryLevel(categoryName) {
    if (!categoryName) return null;
    const match = categoryName.match(/^Level (\d+)$/i);
    return match ? match[1] : null;
}

// Render Leaderboard
function renderLeaderboard() {
    const containerTotal = document.getElementById('leaderboardListTotal');
    const containerPercent = document.getElementById('leaderboardListPercent');
    
    // Debug check
    if (!containerTotal || !containerPercent) {
        console.error('Leaderboard containers not found:', { containerTotal, containerPercent });
        return;
    }
    
    // Filter presentations with investments
    let presentationsWithInvestments = [...presentations].filter(p => Number(p.total_invested) > 0);
    
    // Filter by level if selected
    if (selectedLeaderboardLevel !== 'all') {
        presentationsWithInvestments = presentationsWithInvestments.filter(p => {
            const level = getCategoryLevel(p.category_name);
            return level === selectedLeaderboardLevel;
        });
    }
    
    console.log('Presentations with investments:', presentationsWithInvestments);
    
    // Sort by total invested
    const sortedByTotal = [...presentationsWithInvestments]
        .sort((a, b) => Number(b.total_invested) - Number(a.total_invested));
    
    // Sort by percentage of goal
    const sortedByPercent = [...presentationsWithInvestments]
        .sort((a, b) => {
            const percentA = (Number(a.total_invested) / Number(a.funding_goal)) * 100;
            const percentB = (Number(b.total_invested) / Number(b.funding_goal)) * 100;
            return percentB - percentA;
        });
    
    const levelLabel = selectedLeaderboardLevel === 'all' ? '' : ` (Level ${selectedLeaderboardLevel})`;
    
    // Render Total Invested leaderboard
    if (sortedByTotal.length === 0) {
        containerTotal.innerHTML = `<p class="no-data">No investments yet${levelLabel}.</p>`;
    } else {
        containerTotal.innerHTML = sortedByTotal.map((p, index) => {
            const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`;
            const progress = Math.min((Number(p.total_invested) / Number(p.funding_goal)) * 100, 100);
            const funded = progress >= 100;
            const levelBadge = getCategoryLevel(p.category_name) ? `<span class="level-badge">L${getCategoryLevel(p.category_name)}</span>` : '';
            
            return `
                <div class="leaderboard-item ${funded ? 'fully-funded' : ''}">
                    <div class="leaderboard-rank">${medal}</div>
                    <div class="leaderboard-info">
                        <div class="leaderboard-title">${escapeHtml(p.title)} ${levelBadge}</div>
                        <div class="leaderboard-presenter">by ${escapeHtml(p.presenter_name || 'Anonymous')}</div>
                        <div class="leaderboard-progress">
                            <div class="progress-bar" style="width: ${progress}%"></div>
                        </div>
                    </div>
                    <div class="leaderboard-stats">
                        <div class="leaderboard-amount">$${Number(p.total_invested).toLocaleString()}</div>
                        <div class="leaderboard-goal">of $${Number(p.funding_goal).toLocaleString()}</div>
                        <div class="leaderboard-investors">👥 ${p.investor_count}</div>
                    </div>
                </div>
            `;
        }).join('');
    }
    
    // Render Percent of Goal leaderboard
    if (sortedByPercent.length === 0) {
        containerPercent.innerHTML = `<p class="no-data">No investments yet${levelLabel}.</p>`;
    } else {
        containerPercent.innerHTML = sortedByPercent.map((p, index) => {
            const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`;
            const progress = Math.min((Number(p.total_invested) / Number(p.funding_goal)) * 100, 100);
            const actualPercent = (Number(p.total_invested) / Number(p.funding_goal)) * 100;
            const funded = progress >= 100;
            const levelBadge = getCategoryLevel(p.category_name) ? `<span class="level-badge">L${getCategoryLevel(p.category_name)}</span>` : '';
            
            return `
                <div class="leaderboard-item ${funded ? 'fully-funded' : ''}">
                    <div class="leaderboard-rank">${medal}</div>
                    <div class="leaderboard-info">
                        <div class="leaderboard-title">${escapeHtml(p.title)} ${levelBadge}</div>
                        <div class="leaderboard-presenter">by ${escapeHtml(p.presenter_name || 'Anonymous')}</div>
                        <div class="leaderboard-progress">
                            <div class="progress-bar" style="width: ${progress}%"></div>
                        </div>
                    </div>
                    <div class="leaderboard-stats">
                        <div class="leaderboard-amount">${actualPercent.toFixed(1)}%</div>
                        <div class="leaderboard-goal">$${Number(p.total_invested).toLocaleString()} of $${Number(p.funding_goal).toLocaleString()}</div>
                        <div class="leaderboard-investors">👥 ${p.investor_count}</div>
                    </div>
                </div>
            `;
        }).join('');
    }
}

// Open Categories Modal
function openCategoriesModal() {
    if (!currentUser || !['teacher', 'operator'].includes(currentUser.account_type)) {
        alert('Access denied. Teachers and operators only.');
        return;
    }
    
    categoriesModal.style.display = 'flex';
    renderCategories();
}

// Render Categories List
function renderCategories() {
    const container = document.getElementById('categoriesList');
    
    // Filter to show only user's categories + system categories (unless operator who sees all)
    const userCategories = currentUser.account_type === 'operator' 
        ? categories 
        : categories.filter(c => c.teacher_id == currentUser.id || c.is_system == 1);
    
    if (userCategories.length === 0) {
        container.innerHTML = '<p class="no-data">No categories yet. Create one above!</p>';
        return;
    }
    
    container.innerHTML = userCategories.map(c => {
        const isSystem = c.is_system == 1;
        const maxGoalText = c.max_funding_goal ? ` • Max: $${Number(c.max_funding_goal).toLocaleString()}` : '';
        
        return `
        <div class="category-item ${isSystem ? 'system-category' : ''}">
            <div class="category-info">
                <div class="category-name">${isSystem ? '🔒' : '📚'} ${escapeHtml(c.name)}</div>
                <div class="category-description">${escapeHtml(c.description || 'No description')}${maxGoalText}</div>
                <div class="category-meta">
                    ${isSystem ? '<span>🔐 System Category</span>' : `<span>👨‍🏫 ${escapeHtml(c.teacher_name)}</span>`}
                    <span>📊 ${c.pitch_count} pitch${c.pitch_count != 1 ? 'es' : ''}</span>
                </div>
            </div>
            ${isSystem ? '' : `<button class="delete-category-btn" onclick="deleteCategory(${c.id}, '${escapeHtml(c.name)}')">🗑️</button>`}
        </div>
    `}).join('');
}

// Create Category
async function createCategory() {
    const name = document.getElementById('newCategoryName').value.trim();
    const description = document.getElementById('newCategoryDescription').value.trim();
    
    if (!name) {
        alert('Please enter a category name');
        return;
    }
    
    try {
        const response = await fetch('index.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `action=create_category&name=${encodeURIComponent(name)}&description=${encodeURIComponent(description)}`
        });
        const data = await response.json();
        
        if (data.success) {
            document.getElementById('newCategoryName').value = '';
            document.getElementById('newCategoryDescription').value = '';
            await loadCategories();
            renderCategories();
        } else {
            alert(data.message || 'Failed to create category');
        }
    } catch (error) {
        console.error('Create category failed:', error);
        alert('Failed to create category');
    }
}

// Delete Category
async function deleteCategory(categoryId, name) {
    if (!confirm(`Are you sure you want to delete the category "${name}"?\n\nPitches in this category will be moved to "No Category".`)) {
        return;
    }
    
    try {
        const response = await fetch('index.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `action=delete_category&category_id=${categoryId}`
        });
        const data = await response.json();
        
        if (data.success) {
            await loadCategories();
            renderCategories();
            loadPresentations();
        } else {
            alert(data.message || 'Failed to delete category');
        }
    } catch (error) {
        console.error('Delete category failed:', error);
        alert('Failed to delete category');
    }
}
