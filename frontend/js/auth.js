// Authentication Module

const Auth = {
    /**
     * Handle user login
     * @param {string} username 
     * @param {string} password 
     * @returns {boolean} Success status
     */
    login: (username, password) => {
        const users = StateGetters.getUsers();
        const user = users[username.toLowerCase().trim()];
        
        if (!username || !password) {
            return { success: false, error: 'Please enter both username and password' };
        }
        
        if (user && user.password === password) {
            StateSetters.setCurrentUser(username, user.role);
            return { success: true };
        }
        
        return { success: false, error: 'Invalid username or password' };
    },
    
    /**
     * Handle user logout
     */
    logout: () => {
        StateSetters.logout();
    },
    
    /**
     * Check if user is logged in
     * @returns {boolean}
     */
    isLoggedIn: () => {
        return StateGetters.getCurrentUser() !== null;
    },
    
    /**
     * Check if current user has specific role
     * @param {string} role 
     * @returns {boolean}
     */
    hasRole: (role) => {
        return StateGetters.getCurrentRole() === role;
    },
    
    /**
     * Check if current user is admin
     * @returns {boolean}
     */
    isAdmin: () => {
        return StateGetters.getCurrentRole() === 'Administrator';
    },
    
    /**
     * Check if current user is faculty
     * @returns {boolean}
     */
    isFaculty: () => {
        return StateGetters.getCurrentRole() === 'Faculty';
    }
};

// NOTE: When integrating with backend, replace these functions with API calls
// Example:
// login: async (username, password) => {
//     try {
//         const response = await fetch('/api/auth/login', {
//             method: 'POST',
//             headers: { 'Content-Type': 'application/json' },
//             body: JSON.stringify({ username, password })
//         });
//         const data = await response.json();
//         if (data.success) {
//             StateSetters.setCurrentUser(data.user.username, data.user.role);
//             // Store JWT token or session info
//         }
//         return data;
//     } catch (error) {
//         return { success: false, error: error.message };
//     }
// }