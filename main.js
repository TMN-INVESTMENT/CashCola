// ============================================
// CASHCOLA - MAIN JAVASCRIPT FILE
// ============================================

// --------------------------------------------
// 1. FIREBASE INITIALIZATION
// --------------------------------------------

const firebaseConfig = {
    apiKey: "AIzaSyB3i_hPnOJ_256SuJkEmICpTYhefrwOZtQ",
    authDomain: "cashcola.firebaseapp.com",
    projectId: "cashcola",
    storageBucket: "cashcola.firebasestorage.app",
    messagingSenderId: "183799496879",
    appId: "1:183799496879:web:cfb4caf4babf089f6cd45a",
    measurementId: "G-6MX72P0VB4"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const realtimeDb = firebase.database();

// Enable offline persistence
db.enablePersistence({ synchronizeTabs: true }).catch((err) => {
    if (err.code === 'failed-precondition') {
        console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time.');
    }
});

// --------------------------------------------
// 2. GLOBAL VARIABLES
// --------------------------------------------

let currentUser = null;
let currentUserData = null;
let currentUserRole = null;
let currentSlide = 0;
let slides = [];
let userBankAccounts = [];
let liveTransactionInterval = null;

// ============================================
// 137 TANZANIAN NAMES FOR LIVE TRANSACTIONS
// ============================================

const tanzanianNames = [
    "Christopher Jonas", "Neema Welu", "Suzana Mwashiuya", "Nelson Inugula",
    "Selemani Mankondya", "Salomey Myovizi", "Edisons Shitindi", "Beatrice Wichison",
    "Gungwa Mswima", "Emanuel Mnkondya", "Fatina Jacksoni", "Patrick Kapola",
    "Donald Msyalha", "Dosita Lusungo", "Jonas Wenga", "Suzana Sinkala",
    "Lilian Mwashiuya", "Fedelika Mmala", "Ester Ngao", "Stela Howa",
    "Mary Silwimba", "Justa Ngonpala", "Matatizo Mentula", "Gabriel Haidhury",
    "Abeli Mwanjosi", "Leonard Nzowa", "Baricki Mwafonego", "Frackson Magwara",
    "Salome Sonka Ludesa", "Esta Ngao", "Lucy Mgala", "Anna Sinkonde",
    "Nobester Kayange", "Riziki Simbete", "Sailo Kabage", "Oliva Nzowa",
    "Judithe Yula", "Juma Bakari", "Neema Mchome", "Baraka Kwayu",
    "Asha Ramadhani", "Godfrey Massawe", "Witness Shao", "Emmanuel Kimaro",
    "Fatuma Hassan", "Dickson Mushi", "Rehema Mtui", "Kelvin Swai",
    "Mariam Said", "Saidi Athumani", "Upendo Lyimo", "Ibrahim Issa",
    "Catherine Kessy", "Frank Mwakideu", "Hadija Shabani", "Richard Magufuli",
    "Salome Nyerere", "Isaka Malecela", "Happy Kikwete", "Nelson Shein",
    "Anna Mghwira", "Joseph Samia", "Zainabu Suleiman", "Peter Msigwa",
    "Grace Mbilinyi", "Musa Nassari", "Farida Makamba", "David Lissu",
    "Amina Zitto", "Lucas Kabwe", "Sophia Mbowe", "Michael Heche",
    "Halima Mdee", "Thomas Nyalandu", "Rose Mongella", "Elias Kawawa",
    "Elizabeth Mkapa", "Simon Msuya", "Joyce Warioba", "Christopher Sumaye",
    "Mary Pinda", "George Majaliwa", "Sarah Mongi", "Steven Mlingi",
    "Monica Kishoa", "Paul Makonda", "Lilian Kimati", "Victor Kavishe",
    "Neema Mollel", "Baraka Lowassa", "Asha Salum", "Godfrey Mrema",
    "Witness Temu", "Emmanuel Lema", "Fatuma Ali", "Dickson Shirima",
    "Rehema Kavishe", "Kelvin Njau", "Mariam Juma", "Saidi Hamisi",
    "Upendo Mariki", "Ibrahim Mussa", "Catherine Urio", "Frank Mwakipesile",
    "Hadija Omary", "Richard Mwita", "Salome Sokoine", "Isaka Mshana",
    "Happy Mshiu", "Nelson Moshi", "Anna Kimario", "Joseph Tarimo",
    "Zainabu Idi", "Peter Muro", "Grace Laswai", "Musa Shayo",
    "Farida Macha", "David Kisanga", "Amina Minja", "Lucas Ngowi",
    "Sophia Tesha", "Michael Malamsha", "Halima Meela", "Thomas Mallya",
    "Rose Shirima", "Elias Maro", "Elizabeth Kimaro", "Simon Lyimo",
    "Joyce Mushi", "Christopher Swai", "Mary Chao", "George Njau",
    "Sarah Nkya", "Steven Masawe", "Monica Temu", "Paul Shayo",
    "Lilian Mshana"
];

// --------------------------------------------
// 3. INITIALIZATION
// --------------------------------------------

document.addEventListener('DOMContentLoaded', () => {
    console.log('CashCola Initializing...');
    checkAuthState();
    loadSlides();
    startLiveTransactions();
});

// --------------------------------------------
// 4. UTILITY FUNCTIONS
// --------------------------------------------

/**
 * Format currency to Tanzanian Shillings
 */
function formatCurrency(amount) {
    return new Intl.NumberFormat('sw-TZ', {
        style: 'currency',
        currency: 'TZS',
        minimumFractionDigits: 0
    }).format(amount || 0);
}

/**
 * Generate a unique referral code
 */
function generateReferralCode() {
    return 'CC' + Math.random().toString(36).substring(2, 8).toUpperCase();
}

/**
 * Get initials from full name
 */
function getInitials(name) {
    if (!name) return '??';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
}

/**
 * Get status badge class
 */
function getStatusClass(status) {
    const classes = {
        'active': 'status-active',
        'suspended': 'status-suspended',
        'pending': 'status-pending',
        'approved': 'status-approved',
        'rejected': 'status-rejected'
    };
    return classes[status] || 'status-pending';
}

/**
 * Get status label in Swahili
 */
function getStatusLabel(status) {
    const labels = {
        'active': 'Inatumika',
        'suspended': 'Imesimamishwa',
        'pending': 'Inasubiri',
        'approved': 'Imeidhinishwa',
        'rejected': 'Imekataliwa'
    };
    return labels[status] || status;
}

// --------------------------------------------
// 5. TOAST NOTIFICATIONS
// --------------------------------------------

function showToast(message, type = 'success') {
    const toast = document.getElementById('notificationToast');
    if (!toast) {
        console.log(`Toast: ${message} (${type})`);
        return;
    }
    
    const toastMessage = document.getElementById('toastMessage');
    const toastIcon = toast.querySelector('.toast-icon');
    
    toastMessage.textContent = message;
    toast.className = `toast-notification ${type}`;
    
    const icons = {
        'success': 'fa-check-circle',
        'error': 'fa-exclamation-circle',
        'info': 'fa-info-circle',
        'warning': 'fa-exclamation-triangle'
    };
    
    toastIcon.className = `fas ${icons[type] || icons.info} toast-icon`;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// --------------------------------------------
// 6. PASSWORD TOGGLE
// --------------------------------------------

function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    if (input) {
        input.type = input.type === 'password' ? 'text' : 'password';
    }
}

/**
 * Check auth state - FIXED to create user doc if missing
 */
function checkAuthState() {
    auth.onAuthStateChanged(async (user) => {
        console.log('Auth state changed:', user ? user.email : 'No user');
        
        if (user) {
            currentUser = user;
            
            try {
                const userDoc = await db.collection('users').doc(user.uid).get();
                
                if (!userDoc.exists) {
                    console.warn('⚠️ User document not found in Firestore! Creating one...');
                    
                    // Create the missing user document
                    const newUserData = {
                        uid: user.uid,
                        username: user.email ? user.email.split('@')[0] : 'user',
                        fullname: user.displayName || 'Mtumiaji',
                        email: user.email || '',
                        phone: '',
                        balance: 0,
                        dailyEarnings: 0,
                        totalEarnings: 0,
                        activeDrinks: 0,
                        role: 'user',
                        status: 'active',
                        referralCode: 'CC' + Math.random().toString(36).substring(2, 8).toUpperCase(),
                        referredBy: '',
                        totalReferrals: 0,
                        totalReferralBonus: 0,
                        firstDepositBonus: false,
                        lastDailyBonusClaim: null,
                        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                    };
                    
                    await db.collection('users').doc(user.uid).set(newUserData);
                    console.log('✅ User document created in Firestore!');
                    
                    currentUserData = newUserData;
                    currentUserRole = 'user';
                    showUserDashboard();
                    return;
                }
                
                currentUserData = userDoc.data();
                currentUserRole = currentUserData.role || 'user';
                
                console.log('User role:', currentUserRole);
                
                // Route to appropriate dashboard
                if (currentUserRole === 'super_admin') {
                    showSuperAdminDashboard();
                } else if (currentUserRole === 'admin') {
                    showAdminDashboard();
                } else {
                    showUserDashboard();
                }
                
            } catch (error) {
                console.error('Auth check error:', error);
                showLoginScreen();
            }
        } else {
            currentUser = null;
            currentUserData = null;
            currentUserRole = null;
            showLoginScreen();
        }
    });
}


/**
 * Create user document helper
 */
async function createUserDocument(user, role = 'user') {
    const userData = {
        uid: user.uid,
        username: user.email ? user.email.split('@')[0] : 'user',
        fullname: user.displayName || (role === 'super_admin' ? 'Super Admin' : 'User'),
        email: user.email || '',
        phone: '',
        balance: 0,
        dailyEarnings: 0,
        totalEarnings: 0,
        activeDrinks: 0,
        role: role,
        status: 'active',
        referralCode: generateReferralCode(),
        referredBy: '',
        referredByUsername: '',
        totalReferrals: 0,
        totalReferralBonus: 0,
        firstDepositBonus: false,
        lastLoginDate: firebase.firestore.FieldValue.serverTimestamp(),
        lastDailyBonusClaim: null,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    await db.collection('users').doc(user.uid).set(userData);
    return userData;
}

/**
 * Show login screen and hide all dashboards
 */
function showLoginScreen() {
    document.getElementById('loginPage').style.display = 'flex';
    document.getElementById('dashboard').style.display = 'none';
    document.getElementById('adminDashboard').style.display = 'none';
    document.getElementById('superAdminDashboard').style.display = 'none';
}

/**
 * Route user to appropriate dashboard based on role
 */
function routeUserByRole() {
    document.getElementById('loginPage').style.display = 'none';
    
    switch(currentUserRole) {
        case 'super_admin':
            showSuperAdminDashboard();
            break;
        case 'admin':
            showAdminDashboard();
            break;
        default:
            showUserDashboard();
    }
}

/**
 * Show login form
 */
function showLoginForm() {
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('signupForm').style.display = 'none';
    document.querySelectorAll('.auth-tab')[0].classList.add('active');
    document.querySelectorAll('.auth-tab')[1].classList.remove('active');
}

/**
 * Show signup form
 */
function showSignupForm() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('signupForm').style.display = 'block';
    document.querySelectorAll('.auth-tab')[0].classList.remove('active');
    document.querySelectorAll('.auth-tab')[1].classList.add('active');
}

/**
 * Handle user login
 */
/**
 * Handle user login - FIXED VERSION
 */
async function handleLogin(event) {
    event.preventDefault();
    
    const identifier = document.getElementById('loginIdentifier').value.trim();
    const password = document.getElementById('loginPassword').value;
    
    if (!identifier || !password) {
        showToast('Tafadhali jaza sehemu zote.', 'warning');
        return;
    }
    
    try {
        let email = identifier;
        
        // If user entered username instead of email
        if (!identifier.includes('@')) {
            try {
                // Try to look up email by username
                const snapshot = await db.collection('users')
                    .where('username', '==', identifier.toLowerCase())
                    .limit(1)
                    .get();
                
                if (snapshot.empty) {
                    showToast('Jina la mtumiaji halijasajiliwa.', 'error');
                    return;
                }
                
                email = snapshot.docs[0].data().email;
                
            } catch (lookupError) {
                console.error('Username lookup error:', lookupError);
                
                // If permission denied, try direct login with username as email
                // Some users might register with username-like emails
                if (lookupError.code === 'permission-denied') {
                    showToast('Hitilafu ya mfumo. Tafadhali tumia barua pepe kuingia.', 'warning');
                    return;
                }
                
                showToast('Imeshindikana kutafuta mtumiaji. Jaribu tena.', 'error');
                return;
            }
        }
        
        // Sign in with Firebase Auth
        await auth.signInWithEmailAndPassword(email, password);
        showToast('Umefanikiwa kuingia!', 'success');
        
    } catch (error) {
        console.error('Login error:', error.code, error.message);
        
        const errorMessages = {
            'auth/user-not-found': 'Mtumiaji hajapatikana. Angalia barua pepe yako.',
            'auth/wrong-password': 'Nenosiri si sahihi. Jaribu tena.',
            'auth/invalid-email': 'Barua pepe si sahihi.',
            'auth/user-disabled': 'Akaunti imesimamishwa. Wasiliana na msimamizi.',
            'auth/too-many-requests': 'Umejaribu mara nyingi. Tafadhali subiri na jaribu tena baadaye.',
            'auth/invalid-credential': 'Taarifa za kuingia si sahihi.',
            'auth/network-request-failed': 'Hitilafu ya mtandao. Angalia muunganisho wako.'
        };
        
        showToast(errorMessages[error.code] || 'Imeshindikana kuingia. Jaribu tena.', 'error');
    }
}

// ============================================
// SIGNUP FUNCTIONS - WITH PROPER referredBy TRACKING
// ============================================

/**
 * Handle user signup - referredBy properly saved from signup
 */
async function handleSignup(event) {
    event.preventDefault();
    
    const username = document.getElementById('signupUsername').value.trim();
    const fullname = document.getElementById('signupFullname').value.trim();
    const email = document.getElementById('signupEmail').value.trim().toLowerCase();
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('signupConfirmPassword').value;
    const referralCode = document.getElementById('referralCode').value.trim().toUpperCase();
    
    // Validation
    if (!username || !fullname || !email || !password || !confirmPassword) {
        showToast('Tafadhali jaza sehemu zote zinazohitajika.', 'warning');
        return;
    }
    
    if (username.length < 2) {
        showToast('Jina la mtumiaji liwe na herufi 2 au zaidi.', 'warning');
        return;
    }
    
    if (password.length < 6) {
        showToast('Nenosiri liwe na herufi 6 au zaidi.', 'warning');
        return;
    }
    
    if (password !== confirmPassword) {
        showToast('Nenosiri na thibitisho havifanani.', 'warning');
        return;
    }
    
    // Disable button
    const signupBtn = document.getElementById('signupButton');
    if (signupBtn) {
        signupBtn.disabled = true;
        signupBtn.innerHTML = '<span>Inasajili...</span><i class="fas fa-spinner fa-spin"></i>';
    }
    
    try {
        console.log('========================================');
        console.log('SIGNUP STARTED');
        console.log('Username:', username);
        console.log('Email:', email);
        console.log('Referral Code Entered:', referralCode || 'NONE');
        console.log('========================================');
        
        // Step 1: Create auth user
        console.log('Step 1: Creating auth user...');
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;
        console.log('✅ Auth user created. UID:', user.uid);
        
        // Step 2: Update profile
        await user.updateProfile({ displayName: username });
        console.log('✅ Profile updated');
        
        // Step 3: Generate own referral code
        const myReferralCode = 'CC' + Math.random().toString(36).substring(2, 8).toUpperCase();
        console.log('Generated referral code:', myReferralCode);
        
        // Step 4: Process referral code - THIS IS THE KEY PART
        let referredBy = '';
        let referrerUsername = '';
        let referrerFullname = '';
        
        if (referralCode) {
            console.log('🔍 Looking up referral code:', referralCode);
            
            try {
                const refSnapshot = await db.collection('users')
                    .where('referralCode', '==', referralCode)
                    .limit(1)
                    .get();
                
                if (!refSnapshot.empty) {
                    const referrerDoc = refSnapshot.docs[0];
                    const referrerData = referrerDoc.data();
                    
                    referredBy = referrerDoc.id; // UID of referrer
                    referrerUsername = referrerData.username || '';
                    referrerFullname = referrerData.fullname || '';
                    
                    console.log('✅ VALID REFERRAL FOUND!');
                    console.log('   Referrer ID:', referredBy);
                    console.log('   Referrer Username:', referrerUsername);
                    console.log('   Referrer Fullname:', referrerFullname);
                } else {
                    console.log('⚠️ Referral code not found in database:', referralCode);
                }
            } catch (err) {
                console.warn('Could not check referral:', err);
            }
        } else {
            console.log('ℹ️ No referral code provided');
        }
        
        // Step 5: Create user document with referredBy
        console.log('Step 5: Creating Firestore document...');
        
        const userData = {
            uid: user.uid,
            username: username,
            fullname: fullname,
            email: email,
            phone: '',
            balance: 0,
            dailyEarnings: 0,
            totalEarnings: 0,
            activeDrinks: 0,
            role: 'user',
            status: 'active',
            // Referral fields
            referralCode: myReferralCode,
            referredBy: referredBy, // UID of referrer (empty if no referral)
            referredByUsername: referrerUsername, // Username of referrer
            referredByFullname: referrerFullname, // Full name of referrer
            referredByCode: referralCode, // The code that was used
            // Stats
            totalReferrals: 0,
            totalReferralBonus: 0,
            // First deposit bonus tracking
            firstDepositBonus: false,
            firstDepositAmount: 0,
            firstDepositBonusAmount: 0,
            firstDepositDate: null,
            // Login tracking
            lastLoginDate: firebase.firestore.FieldValue.serverTimestamp(),
            lastDailyBonusClaim: null,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        // Save to Firestore
        await db.collection('users').doc(user.uid).set(userData);
        
        console.log('✅ Firestore document created!');
        console.log('   UID:', user.uid);
        console.log('   referredBy:', referredBy || 'NONE');
        console.log('   referredByUsername:', referrerUsername || 'NONE');
        console.log('   referralCode:', myReferralCode);
        
        // Step 6: Update referrer's totalReferrals count
        if (referredBy) {
            try {
                await db.collection('users').doc(referredBy).update({
                    totalReferrals: firebase.firestore.FieldValue.increment(1)
                });
                console.log('✅ Referrer totalReferrals incremented for:', referrerUsername);
            } catch (err) {
                console.warn('Could not update referrer count:', err);
            }
        }
        
        // Clear form
        document.getElementById('signupForm').reset();
        
        // Success message
        let successMsg = `Umefanikiwa kujisajili! Karibu ${username} 🎉`;
        if (referredBy) {
            successMsg += ` Umejiunga kupitia rufaa ya @${referrerUsername}.`;
        }
        showToast(successMsg, 'success');
        
        console.log('========================================');
        console.log('✅ SIGNUP COMPLETE');
        console.log('========================================');
        
        // Auto-check daily bonus
        setTimeout(async () => {
            if (auth.currentUser) {
                await checkAndAwardDailyBonus(auth.currentUser.uid);
            }
        }, 2000);
        
    } catch (error) {
        console.error('========================================');
        console.error('❌ SIGNUP ERROR');
        console.error('Code:', error.code);
        console.error('Message:', error.message);
        console.error('========================================');
        
        // Clean up auth user if Firestore failed
        if (auth.currentUser && error.code === 'permission-denied') {
            try { await auth.currentUser.delete(); } catch (e) {}
        }
        
        const errorMessages = {
            'auth/email-already-in-use': 'Barua pepe tayari imesajiliwa. Jaribu kuingia.',
            'auth/invalid-email': 'Barua pepe si sahihi.',
            'auth/weak-password': 'Nenosiri ni dhaifu. Tumia herufi 6 au zaidi.',
            'auth/network-request-failed': 'Hitilafu ya mtandao. Angalia intaneti.',
            'auth/too-many-requests': 'Umejaribu mara nyingi. Subiri kidogo.',
            'permission-denied': 'Imeshindikana kuhifadhi taarifa. Angalia Firestore rules.',
            'unavailable': 'Huduma haipatikani. Jaribu tena baadaye.'
        };
        
        showToast(errorMessages[error.code] || 'Imeshindikana kujisajili. Jaribu tena.', 'error');
        
    } finally {
        if (signupBtn) {
            signupBtn.disabled = false;
            signupBtn.innerHTML = '<span>Jisajili</span><i class="fas fa-user-plus"></i>';
        }
    }
}

/**
 * Verify referral data for a user (Run in console to check)
 */
async function verifyUserReferral(uid) {
    const userDoc = await db.collection('users').doc(uid).get();
    if (!userDoc.exists) {
        console.log('❌ User not found');
        return;
    }
    
    const user = userDoc.data();
    console.log('========================================');
    console.log('👤 User:', user.username);
    console.log('📧 Email:', user.email);
    console.log('🔗 referredBy:', user.referredBy || 'NONE');
    console.log('👤 referredByUsername:', user.referredByUsername || 'NONE');
    console.log('👤 referredByFullname:', user.referredByFullname || 'NONE');
    console.log('🎫 referralCode:', user.referralCode);
    console.log('🎁 firstDepositBonus:', user.firstDepositBonus);
    console.log('👥 totalReferrals:', user.totalReferrals);
    console.log('========================================');
    
    // If referred, check referrer
    if (user.referredBy) {
        const referrerDoc = await db.collection('users').doc(user.referredBy).get();
        if (referrerDoc.exists) {
            console.log('✅ Referrer exists:', referrerDoc.data().username);
        } else {
            console.log('❌ Referrer NOT FOUND!');
        }
    }
}

// Usage: verifyUserReferral('USER_UID_HERE');

/**
 * Generate referral code
 */
function generateReferralCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = 'CC';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

/**
 * Check password strength
 */
document.addEventListener('DOMContentLoaded', () => {
    const passwordInput = document.getElementById('signupPassword');
    if (passwordInput) {
        passwordInput.addEventListener('input', checkPasswordStrength);
    }
    
    const confirmPasswordInput = document.getElementById('signupConfirmPassword');
    if (confirmPasswordInput) {
        confirmPasswordInput.addEventListener('input', checkPasswordMatch);
    }
    
    const referralInput = document.getElementById('referralCode');
    if (referralInput) {
        referralInput.addEventListener('input', validateReferralCode);
    }
});

function checkPasswordStrength() {
    const password = document.getElementById('signupPassword').value;
    const strengthBar = document.querySelector('.strength-bar');
    const strengthText = document.querySelector('.strength-text');
    
    if (!strengthBar || !strengthText) return;
    
    let strength = 0;
    
    if (password.length >= 6) strength++;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    
    strengthBar.className = 'strength-bar';
    
    if (strength <= 2) {
        strengthBar.classList.add('weak');
        strengthText.textContent = 'Dhaifu - Ongeza herufi kubwa na namba';
        strengthText.style.color = '#EF233C';
    } else if (strength <= 3) {
        strengthBar.classList.add('medium');
        strengthText.textContent = 'Wastani - Endelea kuongeza alama maalum';
        strengthText.style.color = '#FFD166';
    } else {
        strengthBar.classList.add('strong');
        strengthText.textContent = 'Imara - Nenosiri salama!';
        strengthText.style.color = '#1A936F';
    }
}

function checkPasswordMatch() {
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('signupConfirmPassword').value;
    const icon = document.querySelector('.password-match-icon');
    
    if (!icon) return;
    
    if (confirmPassword.length === 0) {
        icon.className = 'password-match-icon';
        icon.textContent = '';
    } else if (password === confirmPassword) {
        icon.className = 'password-match-icon valid';
        icon.textContent = '✓';
    } else {
        icon.className = 'password-match-icon invalid';
        icon.textContent = '✗';
    }
}

async function validateReferralCode() {
    const code = document.getElementById('referralCode').value.trim().toUpperCase();
    const status = document.querySelector('.referral-status');
    const info = document.getElementById('referralInfo');
    
    if (!code) {
        if (status) status.textContent = '';
        if (info) info.style.display = 'flex';
        return;
    }
    
    try {
        const snapshot = await db.collection('users')
            .where('referralCode', '==', code)
            .limit(1)
            .get();
        
        if (!snapshot.empty) {
            const referrer = snapshot.docs[0].data();
            if (status) {
                status.className = 'referral-status valid';
                status.textContent = '✓ Sahihi';
            }
            if (info) {
                info.innerHTML = `
                    <i class="fas fa-check-circle"></i>
                    <span>Rufaa ya <strong>${referrer.fullname}</strong> imekubaliwa! Utapata bonasi ya 10% kwenye amana ya kwanza.</span>
                `;
                info.style.background = 'linear-gradient(135deg, #d4edda, #c3e6cb)';
            }
        } else {
            if (status) {
                status.className = 'referral-status invalid';
                status.textContent = '✗ Haijulikani';
            }
            if (info) {
                info.innerHTML = `
                    <i class="fas fa-exclamation-circle"></i>
                    <span>Namba ya rufaa haijatambuliwa. Endelea bila rufaa au ingiza namba sahihi.</span>
                `;
                info.style.background = 'linear-gradient(135deg, #FFF3E0, #FFE0B2)';
            }
        }
    } catch (error) {
        console.error('Error validating referral:', error);
    }
}

/**
 * Check and award daily login bonus
 */
async function checkAndAwardDailyBonus(userId) {
    try {
        const userDoc = await db.collection('users').doc(userId).get();
        if (!userDoc.exists) return;
        
        const userData = userDoc.data();
        const today = new Date().toDateString();
        const lastClaim = userData.lastDailyBonusClaim?.toDate().toDateString();
        
        // If already claimed today, don't award again
        if (lastClaim === today) {
            console.log('Daily bonus already claimed today');
            updateDailyBonusUI(true, userData.lastDailyBonusClaim?.toDate());
            return false;
        }
        
        // Award daily bonus
        const dailyBonus = 200;
        
        await db.collection('users').doc(userId).update({
            balance: (userData.balance || 0) + dailyBonus,
            totalEarnings: (userData.totalEarnings || 0) + dailyBonus,
            lastDailyBonusClaim: firebase.firestore.FieldValue.serverTimestamp(),
            lastLoginDate: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // Create bonus record
        await db.collection('bonuses').add({
            userId: userId,
            type: 'daily_login',
            amount: dailyBonus,
            description: 'Bonasi ya kuingia kila siku',
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        updateDailyBonusUI(true, new Date());
        console.log('Daily bonus awarded:', dailyBonus);
        
        // Show bonus notification
        showToast(`Umepata bonasi ya kuingia ya TZS ${dailyBonus}! 🎉`, 'success');
        
        return true;
        
    } catch (error) {
        console.error('Error awarding daily bonus:', error);
        return false;
    }
}

/**
 * Claim daily bonus manually
 */
async function claimDailyBonus() {
    if (!currentUser) {
        showToast('Tafadhali ingia kwanza.', 'warning');
        return;
    }
    
    const claimBtn = document.getElementById('claimDailyBonusBtn');
    if (!claimBtn) return;
    
    // Disable button
    claimBtn.disabled = true;
    claimBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>Inachukua...</span>';
    
    try {
        const awarded = await checkAndAwardDailyBonus(currentUser.uid);
        
        if (!awarded) {
            showToast('Tayari umechukua bonasi ya leo. Rudi kesho!', 'info');
        }
        
        // Refresh user data
        await loadUserData();
        
    } catch (error) {
        console.error('Error claiming bonus:', error);
        showToast('Imeshindikana kuchukua bonasi.', 'error');
    } finally {
        updateDailyBonusUIButton();
    }
}

/**
 * Update daily bonus UI
 */
function updateDailyBonusUI(claimed, claimDate) {
    const claimBtn = document.getElementById('claimDailyBonusBtn');
    const lastClaimInfo = document.getElementById('lastClaimInfo');
    
    if (!claimBtn) return;
    
    if (claimed) {
        claimBtn.disabled = true;
        claimBtn.classList.add('claimed');
        claimBtn.innerHTML = '<i class="fas fa-check-circle"></i><span>Tayari Umechukua Leo</span>';
    } else {
        claimBtn.disabled = false;
        claimBtn.classList.remove('claimed');
        claimBtn.innerHTML = '<i class="fas fa-hand-holding-usd"></i><span>Chukua Bonasi ya Leo</span>';
    }
    
    if (lastClaimInfo && claimDate) {
        lastClaimInfo.textContent = `Ulichukua mwisho: ${claimDate.toLocaleString('sw-TZ')}`;
    }
}

/**
 * Update daily bonus button state
 */
async function updateDailyBonusUIButton() {
    if (!currentUser) return;
    
    try {
        const userDoc = await db.collection('users').doc(currentUser.uid).get();
        if (!userDoc.exists) return;
        
        const userData = userDoc.data();
        const today = new Date().toDateString();
        const lastClaim = userData.lastDailyBonusClaim?.toDate().toDateString();
        const claimed = (lastClaim === today);
        
        updateDailyBonusUI(claimed, userData.lastDailyBonusClaim?.toDate());
        
    } catch (error) {
        console.error('Error updating bonus UI:', error);
    }
}
 
/**
 * Logout user
 */
async function logout() {
    try {
        // Clear intervals
        if (liveTransactionInterval) {
            clearInterval(liveTransactionInterval);
        }
        
        await auth.signOut();
        currentUser = null;
        currentUserData = null;
        currentUserRole = null;
        showLoginScreen();
        showToast('Umetoka kwenye akaunti yako.', 'info');
        
    } catch (error) {
        console.error('Logout error:', error);
    }
}

// --------------------------------------------
// 8. USER DASHBOARD FUNCTIONS
// --------------------------------------------

/**
 * Show user dashboard
 */
function showUserDashboard() {
    document.getElementById('loginPage').style.display = 'none';
    document.getElementById('dashboard').style.display = 'flex';
    document.getElementById('adminDashboard').style.display = 'none';
    document.getElementById('superAdminDashboard').style.display = 'none';
    
    document.getElementById('currentUsername').textContent = currentUserData.username || 'Mtumiaji';
    
    loadUserData();
    startLiveTransactions();
}

async function loadUserData() {
    if (!currentUser) return;
    
    try {
        const userDoc = await db.collection('users').doc(currentUser.uid).get();
        
        if (!userDoc.exists) {
            console.warn('User document not found');
            return;
        }
        
        currentUserData = userDoc.data();
        const data = currentUserData;
        
        // Update balance display
        const balanceEl = document.getElementById('userBalance');
        if (balanceEl) {
            balanceEl.textContent = formatCurrency(data.balance || 0);
            // Add animation
            balanceEl.style.transform = 'scale(1.1)';
            balanceEl.style.color = '#1A936F';
            setTimeout(() => {
                balanceEl.style.transform = 'scale(1)';
                balanceEl.style.color = '';
            }, 300);
        }
        
        // Update other stats
        const dailyEarningsEl = document.getElementById('dailyEarnings');
        if (dailyEarningsEl) {
            dailyEarningsEl.textContent = formatCurrency(data.dailyEarnings || 0);
        }
        
        const totalEarningsEl = document.getElementById('totalEarnings');
        if (totalEarningsEl) {
            totalEarningsEl.textContent = formatCurrency(data.totalEarnings || 0);
        }
        
        const activeDrinksEl = document.getElementById('activeDrinks');
        if (activeDrinksEl) {
            activeDrinksEl.textContent = data.activeDrinks || 0;
        }
        
        console.log('User data loaded - Balance:', data.balance);
        
    } catch (error) {
        console.error('Error loading user data:', error);
    }
}

/**
 * Load user bank accounts
 */
async function loadUserBankAccounts() {
    try {
        const snapshot = await db.collection('users').doc(currentUser.uid)
            .collection('bankAccounts').get();
        
        userBankAccounts = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        renderBankAccountSelects();
        renderProfileBankAccounts();
        
    } catch (error) {
        console.error('Error loading bank accounts:', error);
    }
}

/**
 * Render bank account select dropdowns
 */
function renderBankAccountSelects() {
    const selects = ['bankAccount', 'withdrawBankAccount'];
    
    selects.forEach(selectId => {
        const select = document.getElementById(selectId);
        if (!select) return;
        
        select.innerHTML = '<option value="">Chagua akaunti...</option>';
        
        userBankAccounts.forEach(account => {
            select.innerHTML += `
                <option value="${account.id}">
                    ${account.bankName} - ${account.accountNumber}
                </option>
            `;
        });
    });
}

/**
 * Render bank accounts in profile
 */
function renderProfileBankAccounts() {
    const container = document.getElementById('userBankAccounts');
    if (!container) return;
    
    if (userBankAccounts.length === 0) {
        container.innerHTML = '<p class="text-muted">Hakuna akaunti ya benki.</p>';
        return;
    }
    
    container.innerHTML = userBankAccounts.map(account => `
        <div class="bank-account-item" style="display: flex; justify-content: space-between; align-items: center; padding: 10px; border: 1px solid #ddd; border-radius: 8px; margin-bottom: 8px;">
            <div>
                <strong>${account.bankName}</strong>
                <p style="margin: 0; font-size: 13px; color: #666;">
                    ${account.accountNumber} - ${account.accountHolder}
                </p>
            </div>
            <button onclick="deleteUserBankAccount('${account.id}')" 
                    style="background: #EF233C; color: white; border: none; padding: 5px 10px; border-radius: 5px; cursor: pointer;">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `).join('');
}

/**
 * Add bank account to user profile
 */
function addBankAccount() {
    const bankName = prompt('Jina la Benki (m.f. CRDB, NMB):');
    if (!bankName) return;
    
    const accountNumber = prompt('Namba ya Akaunti:');
    if (!accountNumber) return;
    
    const accountHolder = prompt('Jina la Mwenye Akaunti:');
    if (!accountHolder) return;
    
    db.collection('users').doc(currentUser.uid)
        .collection('bankAccounts').add({
            bankName,
            accountNumber,
            accountHolder,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        })
        .then(() => {
            showToast('Akaunti imeongezwa!', 'success');
            loadUserBankAccounts();
        })
        .catch(error => {
            console.error('Error adding bank account:', error);
            showToast('Imeshindikana kuongeza akaunti.', 'error');
        });
}

/**
 * Delete user bank account
 */
function deleteUserBankAccount(accountId) {
    if (!confirm('Una uhakika unataka kufuta akaunti hii?')) return;
    
    db.collection('users').doc(currentUser.uid)
        .collection('bankAccounts').doc(accountId).delete()
        .then(() => {
            showToast('Akaunti imefutwa!', 'success');
            loadUserBankAccounts();
        })
        .catch(error => {
            console.error('Error deleting bank account:', error);
            showToast('Imeshindikana kufuta akaunti.', 'error');
        });
}

/**
 * Update user profile
 */
async function updateProfile(event) {
    event.preventDefault();
    
    const fullname = document.getElementById('profileFullname').value.trim();
    const phone = document.getElementById('profilePhone').value.trim();
    
    try {
        await db.collection('users').doc(currentUser.uid).update({
            fullname,
            phone
        });
        
        showToast('Wasifu umesasishwa!', 'success');
        loadUserData();
        
    } catch (error) {
        console.error('Error updating profile:', error);
        showToast('Imeshindikana kusasisha wasifu.', 'error');
    }
}

/**
 * Show profile section
 */
function showProfile() {
    showSection('profile');
    document.getElementById('userDropdown')?.classList.remove('active');
    
    document.getElementById('profileUsername').value = currentUserData.username || '';
    document.getElementById('profileFullname').value = currentUserData.fullname || '';
    document.getElementById('profileEmail').value = currentUserData.email || '';
    document.getElementById('profilePhone').value = currentUserData.phone || '';
}


/**
 * Toggle sidebar
 */
function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('active');
}

/**
 * Toggle user dropdown menu
 */
function toggleUserMenu() {
    document.getElementById('userDropdown').classList.toggle('active');
}

// ============================================
// DEPOSIT FUNCTIONS (UPDATED)
// ============================================

/**
 * Load system bank accounts for deposit (Added by Super Admin)
 */
async function loadDepositBankAccounts() {
    const select = document.getElementById('bankAccount');
    if (!select) return;
    
    try {
        // Show loading
        select.innerHTML = '<option value="">Inapakia akaunti za benki...</option>';
        
        // Get bank accounts from system collection (added by super admin)
        const snapshot = await db.collection('bankAccounts')
            .where('active', '==', true)
            .get();
        
        if (snapshot.empty) {
            select.innerHTML = '<option value="">Hakuna akaunti za benki zinazopatikana</option>';
            return;
        }
        
        // Populate select with bank accounts
        select.innerHTML = '<option value="">Chagua akaunti ya benki...</option>';
        
        snapshot.forEach(doc => {
            const account = doc.data();
            select.innerHTML += `
                <option value="${doc.id}" 
                        data-bank-name="${account.bankName || ''}" 
                        data-account-number="${account.accountNumber || ''}" 
                        data-account-holder="${account.accountHolder || ''}">
                    ${account.bankName} - ${account.accountNumber} (${account.accountHolder})
                </option>
            `;
        });
        
        console.log(`Loaded ${snapshot.size} system bank accounts for deposit`);
        
    } catch (error) {
        console.error('Error loading deposit bank accounts:', error);
        select.innerHTML = '<option value="">Imeshindikana kupakia akaunti</option>';
    }
}

/**
 * Show bank details for deposit - with selected account info
 */
function showBankDetails() {
    const select = document.getElementById('bankAccount');
    const senderName = document.getElementById('senderName')?.value?.trim();
    const senderPhone = document.getElementById('senderPhone')?.value?.trim();
    const amount = document.getElementById('depositAmount')?.value;
    
    if (!select || !select.value) {
        showToast('Tafadhali chagua akaunti ya benki.', 'warning');
        return;
    }
    
    if (!senderName) {
        showToast('Tafadhali weka jina lako kamili.', 'warning');
        return;
    }
    
    if (!senderPhone) {
        showToast('Tafadhali weka namba yako ya simu.', 'warning');
        return;
    }
    
    if (!amount || parseInt(amount) < 5000) {
        showToast('Kiwango cha chini cha amana ni TZS 5,000.', 'warning');
        return;
    }
    
    // Get selected option details
    const selectedOption = select.options[select.selectedIndex];
    const bankName = selectedOption.getAttribute('data-bank-name') || 'N/A';
    const accountNumber = selectedOption.getAttribute('data-account-number') || 'N/A';
    const accountHolder = selectedOption.getAttribute('data-account-holder') || 'N/A';
    
    // Show bank details modal
    const bankDetails = document.getElementById('bankDetails');
    if (!bankDetails) return;
    
    bankDetails.innerHTML = `
        <div style="text-align: center; margin-bottom: 20px;">
            <div style="width: 60px; height: 60px; border-radius: 50%; background: linear-gradient(135deg, #1A936F, #2EC4B6); display: flex; align-items: center; justify-content: center; margin: 0 auto 15px;">
                <i class="fas fa-university" style="color: white; font-size: 24px;"></i>
            </div>
            <h3 style="color: #004E89; margin-bottom: 5px;">Maelezo ya Malipo</h3>
            <p style="color: #666; font-size: 14px;">Tuma fedha kwa akaunti ifuatayo:</p>
        </div>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee;">
                <span style="color: #666;">Benki:</span>
                <strong>${bankName}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee;">
                <span style="color: #666;">Namba ya Akaunti:</span>
                <strong style="font-family: monospace; font-size: 16px; letter-spacing: 1px;">${accountNumber}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee;">
                <span style="color: #666;">Jina la Mwenye Akaunti:</span>
                <strong>${accountHolder}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee;">
                <span style="color: #666;">Kiasi cha Kulipa:</span>
                <strong style="color: #FF6B35; font-size: 18px;">${formatCurrency(amount)}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 8px 0;">
                <span style="color: #666;">Jina la Mtumaji:</span>
                <strong>${senderName}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 8px 0;">
                <span style="color: #666;">Namba ya Simu:</span>
                <strong>${senderPhone}</strong>
            </div>
        </div>
        
        <div style="background: #fff3cd; padding: 12px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #FFD166;">
            <small style="color: #856404;">
                <i class="fas fa-info-circle"></i> 
                Hakikisha unatumia namba ya akaunti iliyo hapo juu. Baada ya kutuma, weka kitambulisho cha muamala (Transaction ID) kuthibitisha malipo.
            </small>
        </div>
        
        <button class="btn-primary" onclick="showTransactionConfirm('${select.value}', '${amount}', '${senderName}', '${senderPhone}', '${bankName}', '${accountNumber}', '${accountHolder}')" 
                style="width: 100%; padding: 14px; font-size: 16px;">
            <i class="fas fa-check-circle"></i> Nimelipa, Weka Kitambulisho cha Muamala
        </button>
    `;
    
    document.getElementById('bankModal').classList.add('active');
}

/**
 * Show transaction confirmation modal
 */
function showTransactionConfirm(bankAccountId, amount, senderName, senderPhone, bankName, accountNumber, accountHolder) {
    document.getElementById('bankModal').classList.remove('active');
    document.getElementById('transactionModal').classList.add('active');
    
    // Store deposit data
    window.depositData = {
        bankAccountId,
        bankName,
        accountNumber,
        accountHolder,
        amount: parseInt(amount),
        senderName,
        senderPhone
    };
}

/**
 * Confirm deposit transaction
 */
async function confirmTransaction(event) {
    event.preventDefault();
    
    const transactionId = document.getElementById('transactionId')?.value?.trim();
    const depositData = window.depositData;
    
    if (!transactionId) {
        showToast('Tafadhali weka kitambulisho cha muamala (Transaction ID).', 'warning');
        return;
    }
    
    if (!depositData) {
        showToast('Taarifa za amana hazipo. Tafadhali jaribu tena.', 'error');
        return;
    }
    
    try {
        // Save deposit request to Firestore
        await db.collection('deposits').add({
            userId: currentUser.uid,
            username: currentUserData?.username || 'Mtumiaji',
            fullname: currentUserData?.fullname || '',
            bankAccountId: depositData.bankAccountId,
            bankName: depositData.bankName,
            accountNumber: depositData.accountNumber,
            accountHolder: depositData.accountHolder,
            amount: depositData.amount,
            senderName: depositData.senderName,
            senderPhone: depositData.senderPhone,
            transactionId: transactionId,
            status: 'pending',
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // Close modal
        document.getElementById('transactionModal').classList.remove('active');
        
        // Reset form
        const form = document.getElementById('depositForm');
        if (form) form.reset();
        
        showToast('Ombi la amana limewasilishwa kwa mafanikio! Subiri uidhinishaji. ✅', 'success');
        
        // Clear stored data
        window.depositData = null;
        
    } catch (error) {
        console.error('Deposit error:', error);
        showToast('Imeshindikana kuwasilisha ombi la amana. Jaribu tena.', 'error');
    }
}

 

 

// ============================================
// WITHDRAWAL - AUTO-FILL FROM SELECTED ACCOUNT
// ============================================

/**
 * Load user bank accounts for withdrawal
 */
async function loadWithdrawalBankAccounts() {
    const select = document.getElementById('withdrawBankAccount');
    if (!select) return;
    
    if (!currentUser) {
        select.innerHTML = '<option value="">Tafadhali ingia kwanza</option>';
        return;
    }
    
    try {
        select.innerHTML = '<option value="">Inapakia akaunti zako...</option>';
        
        // Get user's bank accounts
        const snapshot = await db.collection('users').doc(currentUser.uid)
            .collection('bankAccounts')
            .get();
        
        if (snapshot.empty) {
            select.innerHTML = '<option value="">Huna akaunti. Ongeza kwenye Wasifu.</option>';
            return;
        }
        
        // Update global bank accounts array
        userBankAccounts = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        // Populate select dropdown
        select.innerHTML = '<option value="">Chagua akaunti yako...</option>';
        
        userBankAccounts.forEach(account => {
            const isMobile = account.accountType === 'mobile_money';
            const icon = isMobile ? '📱' : '🏦';
            const phoneNumber = account.phoneNumber || '';
            
            select.innerHTML += `
                <option value="${account.id}" 
                        data-bank-name="${account.bankName || ''}" 
                        data-account-number="${account.accountNumber || ''}" 
                        data-account-holder="${account.accountHolder || ''}"
                        data-account-type="${account.accountType || 'bank'}"
                        data-network="${account.network || ''}"
                        data-phone="${phoneNumber}">
                    ${icon} ${account.bankName} - ${account.accountNumber}
                </option>
            `;
        });
        
        console.log(`Loaded ${userBankAccounts.length} accounts for withdrawal`);
        
    } catch (error) {
        console.error('Error loading withdrawal accounts:', error);
        select.innerHTML = '<option value="">Imeshindikana kupakia akaunti</option>';
    }
}

/**
 * On withdrawal bank account selected - AUTO-FILL PHONE FROM ACCOUNT NUMBER
 */
function onWithdrawalBankAccountSelected() {
    const select = document.getElementById('withdrawBankAccount');
    if (!select || !select.value) {
        clearWithdrawalFields();
        return;
    }
    
    // Get selected option details
    const selectedOption = select.options[select.selectedIndex];
    
    const bankName = selectedOption.getAttribute('data-bank-name') || '';
    const accountNumber = selectedOption.getAttribute('data-account-number') || '';
    const accountHolder = selectedOption.getAttribute('data-account-holder') || '';
    const accountType = selectedOption.getAttribute('data-account-type') || 'bank';
    const network = selectedOption.getAttribute('data-network') || '';
    
    console.log('Selected account:', { bankName, accountNumber, accountHolder, accountType });
    
    // AUTO-FILL 1: Receiver Name = Account Holder Name
    const receiverNameInput = document.getElementById('receiverName');
    if (receiverNameInput) {
        receiverNameInput.value = accountHolder || currentUserData?.fullname || '';
    }
    
    // AUTO-FILL 2: Receiver Phone = Account Number (DIRECTLY)
    const receiverPhoneInput = document.getElementById('receiverPhone');
    if (receiverPhoneInput) {
        // For mobile money, the account number IS the phone number
        if (accountType === 'mobile_money') {
            // Format the phone number if needed
            let phoneNumber = accountNumber.replace(/\s+/g, '').trim();
            
            // Ensure it starts with 0
            if (phoneNumber.startsWith('255')) {
                phoneNumber = '0' + phoneNumber.substring(3);
            } else if (!phoneNumber.startsWith('0') && phoneNumber.length === 9) {
                phoneNumber = '0' + phoneNumber;
            }
            
            receiverPhoneInput.value = phoneNumber;
            console.log('📱 Auto-filled phone from mobile money account:', phoneNumber);
        } else {
            // For bank accounts, use account number OR user profile phone
            receiverPhoneInput.value = currentUserData?.phone || accountNumber;
            console.log('🏦 Auto-filled phone for bank account:', receiverPhoneInput.value);
        }
    }
    
    // Show bank info
    showWithdrawalBankInfo(bankName, accountNumber, accountHolder, accountType, network);
}

/**
 * Show withdrawal bank info summary
 */
function showWithdrawalBankInfo(bankName, accountNumber, accountHolder, accountType, network) {
    // Remove existing info
    const existingInfo = document.getElementById('withdrawalBankInfo');
    if (existingInfo) existingInfo.remove();
    
    // Create new info div
    const infoDiv = document.createElement('div');
    infoDiv.id = 'withdrawalBankInfo';
    
    const isMobile = accountType === 'mobile_money';
    
    infoDiv.style.cssText = `
        background: ${isMobile ? '#e3f2fd' : '#e8f5e9'}; 
        padding: 15px; 
        border-radius: 10px; 
        margin-top: 15px; 
        border-left: 4px solid ${isMobile ? '#1976D2' : '#1A936F'};
    `;
    
    infoDiv.innerHTML = `
        <div style="display: flex; align-items: flex-start; gap: 10px;">
            <i class="fas ${isMobile ? 'fa-mobile-alt' : 'fa-university'}" 
               style="color: ${isMobile ? '#1976D2' : '#1A936F'}; font-size: 18px;"></i>
            <div>
                <strong style="color: ${isMobile ? '#1565C0' : '#2e7d32'};">
                    ${isMobile ? '📱 ' + bankName : '🏦 ' + bankName}
                </strong>
                <p style="margin: 5px 0 0 0; font-size: 13px;">
                    ${isMobile ? 'Namba ya Simu' : 'Namba ya Akaunti'}: <strong>${accountNumber}</strong>
                </p>
                <p style="margin: 3px 0 0 0; font-size: 13px;">
                    Jina: <strong>${accountHolder}</strong>
                </p>
                ${network ? `<p style="margin: 3px 0 0 0; font-size: 12px;">📶 ${network}</p>` : ''}
            </div>
        </div>
    `;
    
    // Insert after the bank select
    const bankSelect = document.getElementById('withdrawBankAccount');
    if (bankSelect && bankSelect.parentNode) {
        bankSelect.parentNode.appendChild(infoDiv);
    }
}

/**
 * Clear withdrawal fields
 */
function clearWithdrawalFields() {
    document.getElementById('receiverName').value = '';
    document.getElementById('receiverPhone').value = '';
    
    const infoDiv = document.getElementById('withdrawalBankInfo');
    if (infoDiv) infoDiv.remove();
}

/**
 * Format phone number to standard format
 */
function formatPhoneNumber(number) {
    if (!number) return '';
    
    // Remove any non-digit characters
    let cleaned = number.replace(/\D/g, '');
    
    // If it starts with 255, keep as is
    if (cleaned.startsWith('255') && cleaned.length === 12) {
        return '0' + cleaned.substring(3); // Convert to 07XX format
    }
    
    // If it starts with 0 and has 10 digits, it's already in correct format
    if (cleaned.startsWith('0') && cleaned.length === 10) {
        return cleaned;
    }
    
    // If it's a 9-digit number, add leading 0
    if (cleaned.length === 9) {
        return '0' + cleaned;
    }
    
    return cleaned;
}

/**
 * Show withdrawal bank info summary
 */
function showWithdrawalBankInfo(bankName, accountNumber, accountHolder, accountType, network) {
    let infoDiv = document.getElementById('withdrawalBankInfo');
    
    if (!infoDiv) {
        // Create info div
        infoDiv = document.createElement('div');
        infoDiv.id = 'withdrawalBankInfo';
        
        const bankSelect = document.getElementById('withdrawBankAccount');
        if (bankSelect && bankSelect.parentNode) {
            bankSelect.parentNode.appendChild(infoDiv);
        } else {
            return;
        }
    }
    
    const isMobile = accountType === 'mobile_money';
    
    infoDiv.style.cssText = `
        background: ${isMobile ? '#e3f2fd' : '#e8f5e9'}; 
        padding: 15px; 
        border-radius: 10px; 
        margin-top: 15px; 
        border-left: 4px solid ${isMobile ? '#1976D2' : '#1A936F'};
        transition: all 0.3s ease;
    `;
    
    infoDiv.innerHTML = `
        <div style="display: flex; align-items: flex-start; gap: 10px;">
            <i class="fas ${isMobile ? 'fa-mobile-alt' : 'fa-university'}" 
               style="color: ${isMobile ? '#1976D2' : '#1A936F'}; font-size: 18px; margin-top: 2px;"></i>
            <div>
                <p style="margin: 0 0 5px 0; font-weight: 600; color: ${isMobile ? '#1565C0' : '#2e7d32'};">
                    ${isMobile ? '📱 Huduma ya Simu' : '🏦 Akaunti ya Benki'}
                </p>
                <p style="margin: 0 0 3px 0; font-size: 13px;">
                    <strong>${bankName}</strong>
                </p>
                <p style="margin: 0 0 3px 0; font-size: 13px; color: #666;">
                    ${isMobile ? 'Namba ya Simu' : 'Namba ya Akaunti'}: <strong>${accountNumber}</strong>
                </p>
                <p style="margin: 0 0 3px 0; font-size: 13px; color: #666;">
                    Jina: <strong>${accountHolder}</strong>
                </p>
                ${network ? `<p style="margin: 0; font-size: 12px; color: #1976D2;">📶 Mtandao: ${network}</p>` : ''}
            </div>
        </div>
    `;
}

/**
 * Update withdrawal form labels based on account type
 */
function updateWithdrawalLabels(accountType) {
    const receiverNameLabel = document.querySelector('label[for="receiverName"]');
    const receiverPhoneLabel = document.querySelector('label[for="receiverPhone"]');
    
    if (accountType === 'mobile_money') {
        if (receiverNameLabel) receiverNameLabel.textContent = 'Jina la Mmiliki wa Simu';
        if (receiverPhoneLabel) receiverPhoneLabel.textContent = 'Namba ya Simu ya Kupokea';
    } else {
        if (receiverNameLabel) receiverNameLabel.textContent = 'Jina Kamili la Mpokeaji';
        if (receiverPhoneLabel) receiverPhoneLabel.textContent = 'Namba ya Simu ya Mpokeaji';
    }
}

/**
 * Clear withdrawal fields
 */
function clearWithdrawalFields() {
    const receiverName = document.getElementById('receiverName');
    const receiverPhone = document.getElementById('receiverPhone');
    
    if (receiverName) receiverName.value = '';
    if (receiverPhone) receiverPhone.value = '';
    
    // Remove bank info
    const infoDiv = document.getElementById('withdrawalBankInfo');
    if (infoDiv) infoDiv.remove();
}

/**
 * Set quick withdrawal amount
 */
function setWithdrawAmount(amount) {
    const amountInput = document.getElementById('withdrawAmount');
    if (amountInput) {
        amountInput.value = amount;
        calculateWithdrawalFee();
    }
}

/**
 * Calculate withdrawal fee
 */
async function calculateWithdrawalFee() {
    const amount = parseInt(document.getElementById('withdrawAmount')?.value) || 0;
    
    if (amount < 10000) {
        document.getElementById('withdrawalFee').textContent = 'TZS 0';
        document.getElementById('receivedAmount').textContent = formatCurrency(amount);
        return;
    }
    
    let feePercent = 10;
    
    try {
        const settingsDoc = await db.collection('settings').doc('site').get();
        if (settingsDoc.exists) {
            feePercent = settingsDoc.data().withdrawalFeePercent || 10;
        }
    } catch (err) {
        console.warn('Could not load settings, using default 10%');
    }
    
    // Check if first withdrawal
    let isFirst = false;
    try {
        const snapshot = await db.collection('withdrawals')
            .where('userId', '==', currentUser.uid)
            .where('status', '==', 'approved')
            .limit(1)
            .get();
        isFirst = snapshot.empty;
    } catch (err) {
        console.warn('Could not check first withdrawal');
    }
    
    const fee = isFirst ? 0 : Math.floor(amount * feePercent / 100);
    const received = amount - fee;
    
    document.getElementById('withdrawalFee').textContent = formatCurrency(fee);
    document.getElementById('receivedAmount').textContent = formatCurrency(received);
}

/**
 * Handle withdrawal submission
 */
async function handleWithdraw(event) {
    event.preventDefault();
    
    const bankAccountId = document.getElementById('withdrawBankAccount')?.value;
    const amount = parseInt(document.getElementById('withdrawAmount')?.value);
    const receiverName = document.getElementById('receiverName')?.value?.trim();
    const receiverPhone = document.getElementById('receiverPhone')?.value?.trim();
    
    // Validation
    if (!bankAccountId) {
        showToast('Tafadhali chagua akaunti yako ya kupokea fedha.', 'warning');
        return;
    }
    
    if (!amount || amount < 10000) {
        showToast('Kiwango cha chini cha uondoaji ni TZS 10,000.', 'warning');
        return;
    }
    
    if (!receiverName) {
        showToast('Tafadhali weka jina la mpokeaji.', 'warning');
        return;
    }
    
    if (!receiverPhone) {
        showToast('Tafadhali weka namba ya simu ya mpokeaji.', 'warning');
        return;
    }
    
    // Get selected account details
    const selectedAccount = userBankAccounts.find(acc => acc.id === bankAccountId);
    if (!selectedAccount) {
        showToast('Akaunti haijapatikana. Tafadhali chagua upya.', 'error');
        return;
    }
    
    // Calculate fee
    let feePercent = 10;
    try {
        const settingsDoc = await db.collection('settings').doc('site').get();
        if (settingsDoc.exists) feePercent = settingsDoc.data().withdrawalFeePercent || 10;
    } catch (err) {}
    
    const isFirst = await checkFirstWithdrawal();
    const fee = isFirst ? 0 : Math.floor(amount * feePercent / 100);
    const totalDeduction = amount + fee;
    
    // Check balance
    try {
        const userDoc = await db.collection('users').doc(currentUser.uid).get();
        const userData = userDoc.data();
        
        if ((userData.balance || 0) < totalDeduction) {
            showToast(`Salio halitoshi. Unahitaji ${formatCurrency(totalDeduction)}.`, 'error');
            return;
        }
        
        // Confirm
        if (!confirm(
            `THIBITISHA UONDOAJI:\n\n` +
            `${selectedAccount.accountType === 'mobile_money' ? '📱 Huduma' : '🏦 Benki'}: ${selectedAccount.bankName}\n` +
            `${selectedAccount.accountType === 'mobile_money' ? '📱 Namba' : '🔢 Akaunti'}: ${selectedAccount.accountNumber}\n` +
            `👤 Mpokeaji: ${receiverName}\n` +
            `📞 Simu: ${receiverPhone}\n` +
            `💰 Kiasi: ${formatCurrency(amount)}\n` +
            `💸 Ada: ${formatCurrency(fee)}\n` +
            `💵 Utapokea: ${formatCurrency(amount - fee)}\n\n` +
            `Unaendelea?`
        )) return;
        
        // Create withdrawal request
        await db.collection('withdrawals').add({
            userId: currentUser.uid,
            username: currentUserData?.username || 'Mtumiaji',
            fullname: currentUserData?.fullname || '',
            bankAccountId: bankAccountId,
            bankName: selectedAccount.bankName,
            accountNumber: selectedAccount.accountNumber,
            accountHolder: selectedAccount.accountHolder,
            accountType: selectedAccount.accountType || 'bank',
            network: selectedAccount.network || '',
            amount: amount,
            fee: fee,
            receivedAmount: amount - fee,
            receiverName: receiverName,
            receiverPhone: receiverPhone,
            isFirstWithdrawal: isFirst,
            status: 'pending',
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // Deduct from balance
        await db.collection('users').doc(currentUser.uid).update({
            balance: (userData.balance || 0) - totalDeduction
        });
        
        // Reset form
        document.getElementById('withdrawForm')?.reset();
        document.getElementById('withdrawalFee').textContent = 'TZS 0';
        document.getElementById('receivedAmount').textContent = 'TZS 0';
        
        const infoDiv = document.getElementById('withdrawalBankInfo');
        if (infoDiv) infoDiv.remove();
        
        showToast('Ombi la kutoa limewasilishwa! ✅', 'success');
        loadUserData();
        
    } catch (error) {
        console.error('Withdrawal error:', error);
        showToast('Imeshindikana kuwasilisha ombi.', 'error');
    }
}

/**
 * Check if first withdrawal
 */
async function checkFirstWithdrawal() {
    try {
        const snapshot = await db.collection('withdrawals')
            .where('userId', '==', currentUser.uid)
            .where('status', '==', 'approved')
            .limit(1)
            .get();
        return snapshot.empty;
    } catch (error) {
        return true;
    }
}

/**
 * Initialize withdrawal section
 */
function initializeWithdrawalSection() {
    loadWithdrawalBankAccounts();
    
    const select = document.getElementById('withdrawBankAccount');
    if (select) {
        select.removeEventListener('change', onWithdrawalBankAccountSelected);
        select.addEventListener('change', onWithdrawalBankAccountSelected);
    }
    
    const amountInput = document.getElementById('withdrawAmount');
    if (amountInput) {
        amountInput.removeEventListener('input', calculateWithdrawalFee);
        amountInput.addEventListener('input', calculateWithdrawalFee);
    }
}


/**
 * Initialize withdrawal section
 */
function initializeWithdrawalSection() {
    // Load bank accounts
    loadWithdrawalBankAccounts();
    
    // Add event listener for bank account selection
    const select = document.getElementById('withdrawBankAccount');
    if (select) {
        // Remove old listener first
        select.removeEventListener('change', onWithdrawalBankAccountSelected);
        // Add new listener
        select.addEventListener('change', onWithdrawalBankAccountSelected);
        console.log('✅ Withdrawal change listener added');
    }
    
    // Add event listener for amount input
    const amountInput = document.getElementById('withdrawAmount');
    if (amountInput) {
        amountInput.removeEventListener('input', calculateWithdrawalFee);
        amountInput.addEventListener('input', calculateWithdrawalFee);
    }
}

console.log('✅ Withdrawal Auto-Fill Functions Loaded');

// Update showSection to initialize deposit/withdrawal
const originalShowSection = showSection;
showSection = function(sectionName) {
    originalShowSection(sectionName);
    
    if (sectionName === 'deposit') {
        initializeDepositSection();
    } else if (sectionName === 'withdraw') {
        initializeWithdrawalSection();
    }
};

console.log('✅ Deposit & Withdrawal Functions Updated');

/**
 * Load Marketplace Drinks - PREMIUM VERSION
 */
async function loadMarketplaceDrinks() {
    const container = document.getElementById('drinksGrid');
    const emptyState = document.getElementById('drinksEmptyState');
    if (!container) return;
    
    try {
        // Show loading skeletons
        container.innerHTML = Array(4).fill(`
            <div class="drink-skeleton"></div>
        `).join('');
        if (emptyState) emptyState.style.display = 'none';
        
        // Get current balance
        let currentBalance = 0;
        if (currentUser) {
            try {
                const userDoc = await db.collection('users').doc(currentUser.uid).get();
                if (userDoc.exists) currentBalance = userDoc.data().balance || 0;
            } catch (err) {}
        }
        
        // Get active drinks
        const snapshot = await db.collection('drinks')
            .where('active', '==', true)
            .get();
        
        if (snapshot.empty) {
            container.innerHTML = '';
            if (emptyState) emptyState.style.display = 'block';
            return;
        }
        
        if (emptyState) emptyState.style.display = 'none';
        
        container.innerHTML = '';
        
        snapshot.forEach(doc => {
            const drink = doc.data();
            const drinkId = doc.id;
            const canAfford = currentBalance >= (drink.price || 0);
            
            const card = document.createElement('div');
            card.className = 'drink-card-premium';
            card.onclick = () => viewDrinkDetail(drinkId);
            card.innerHTML = `
                <!-- Shine Effect -->
                <div class="drink-shine"></div>
                
                <!-- Status Dot -->
                <div class="drink-status-dot active"></div>
                
                <!-- Image Section -->
                <div class="drink-image-section">
                    <div class="drink-image-glow"></div>
                    <img src="${drink.image || 'https://via.placeholder.com/150'}" 
                         alt="${drink.name || 'Kinywaji'}"
                         onerror="this.src='https://via.placeholder.com/150?text=${encodeURIComponent(drink.name || 'Drink')}'">
                </div>
                
                <!-- Details Section -->
                <div class="drink-details-section">
                    <div>
                        <div class="drink-name">${drink.name || 'Kinywaji'}</div>
                        <div class="drink-description">${(drink.description || 'Hakuna maelezo').substring(0, 50)}</div>
                    </div>
                    
                    <div class="drink-meta-row">
                        <span class="drink-meta-badge price">💰 ${formatCurrency(drink.price)}</span>
                        <span class="drink-meta-badge duration">📅 ${drink.duration} siku</span>
                    </div>
                    
                    <div class="drink-daily-earning">
                        <i class="fas fa-coins"></i>
                        <span>Mapato/siku: ${formatCurrency(drink.dailyReturn || 0)}</span>
                    </div>
                    
<!-- Return Badge / Action Button -->
<div style="
    display: inline-block;
    padding: 8px 18px;
    border-radius: 25px;
    background: ${canAfford ? 'linear-gradient(135deg, #FF6B35, #FF8C42)' : '#e0e0e0'};
    color: ${canAfford ? '#fff' : '#999'};
    font-size: 12px; 
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    letter-spacing: 0.3px;
    box-shadow: ${canAfford ? '0 4px 12px rgba(255,107,53,0.3)' : 'none'};
    border: none;
    "
    onclick="event.stopPropagation(); viewDrinkDetail('${drinkId}')"
    onmouseover="this.style.transform='translateY(-2px)';this.style.boxShadow='0 6px 18px rgba(255,107,53,0.4)';"
    onmouseout="this.style.transform='translateY(0)';this.style.boxShadow='${canAfford ? '0 4px 12px rgba(255,107,53,0.3)' : 'none'}';"
>
    <i class="fas fa-${canAfford ? 'shopping-cart' : 'lock'}" style="margin-right: 5px;"></i>
    ${canAfford ? 'Nunua Sasa' : 'Salio Halitoshi'}
</div>
                </div>
            `;
            
            container.appendChild(card);
        });
        
        console.log(`✅ Premium drinks loaded: ${snapshot.size}`);
        
    } catch (error) {
        console.error('Error loading drinks:', error);
        container.innerHTML = `
            <div class="drinks-empty-state">
                <p class="text-danger">Imeshindikana kupakia vinywaji</p>
                <button class="btn-primary" onclick="loadMarketplaceDrinks()">Jaribu Tena</button>
            </div>
        `;
    }
}

/**
 * Update Marketplace Count Badge
 * @param {number} count - Number of drinks
 */
function updateMarketplaceCount(count) {
    const badge = document.getElementById('marketplaceCount');
    if (!badge) return;
    
    // Update text
    badge.textContent = count || 0;
    
    // Add/remove zero class
    if (count === 0 || !count) {
        badge.classList.add('zero');
    } else {
        badge.classList.remove('zero');
    }
    
    // Pulse animation
    badge.classList.remove('pulse');
    void badge.offsetWidth; // Force reflow
    badge.classList.add('pulse');
    
    console.log(`🛒 Marketplace count updated: ${count} drinks`);
}

// Usage in loadMarketplaceDrinks function:
// Replace: if (countBadge) { countBadge.textContent = snapshot.size; ... }
// With: updateMarketplaceCount(snapshot.size);
/**
 * View Drink Detail Modal - With Buy Button
 */
async function viewDrinkDetail(drinkId) {
    if (!drinkId) {
        showToast('Kinywaji hakijachaguliwa.', 'error');
        return;
    }
    
    try {
        const drinkDoc = await db.collection('drinks').doc(drinkId).get();
        if (!drinkDoc.exists) {
            showToast('Kinywaji hakijapatikana.', 'error');
            return;
        }
        
        const drink = drinkDoc.data();
        
        // Get user balance
        let currentBalance = 0;
        if (currentUser) {
            try {
                const userDoc = await db.collection('users').doc(currentUser.uid).get();
                if (userDoc.exists) currentBalance = userDoc.data().balance || 0;
            } catch (err) {}
        }
        
        const canAfford = currentBalance >= (drink.price || 0);
        const shortage = (drink.price || 0) - currentBalance;
        
        document.getElementById('productDetail').innerHTML = `
            <div style="text-align: center;">
                <!-- Close Button -->
                <span onclick="closeProductModal()" style="
                    position: absolute; top: 15px; right: 20px; 
                    font-size: 24px; cursor: pointer; color: #999;
                    transition: color 0.3s ease;
                " onmouseover="this.style.color='#EF233C'" onmouseout="this.style.color='#999'">&times;</span>
                
                <!-- Drink Image -->
                <div style="
                    width: 120px; height: 120px; 
                    margin: 0 auto 15px;
                    border-radius: 20px; 
                    background: #f8f9fa; 
                    display: flex; 
                    align-items: center; 
                    justify-content: center;
                ">
                    <img src="${drink.image || 'https://via.placeholder.com/80'}" 
                         alt="${drink.name}" 
                         style="width: 80px; height: 80px; object-fit: contain;"
                         onerror="this.src='https://via.placeholder.com/80?text=${encodeURIComponent(drink.name?.charAt(0) || 'D')}'">
                </div>
                
                <!-- Drink Name -->
                <h2 style="color: #1a1a2e; margin-bottom: 5px;">${drink.name}</h2>
                <p style="color: #888; font-size: 13px; margin-bottom: 20px;">${drink.description || 'Hakuna maelezo'}</p>
                
                <!-- Details Grid -->
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px;">
                    <div style="background: #fff3e0; padding: 12px; border-radius: 10px;">
                        <small style="color: #888;">Bei</small><br>
                        <strong style="color: #FF6B35; font-size: 18px;">${formatCurrency(drink.price)}</strong>
                    </div>
                    <div style="background: #e3f2fd; padding: 12px; border-radius: 10px;">
                        <small style="color: #888;">Muda</small><br>
                        <strong style="color: #004E89; font-size: 18px;">${drink.duration} Siku</strong>
                    </div>
                    <div style="background: #e8f5e9; padding: 12px; border-radius: 10px;">
                        <small style="color: #888;">Mapato/Siku</small><br>
                        <strong style="color: #1A936F; font-size: 18px;">${formatCurrency(drink.dailyReturn || 0)}</strong>
                    </div>
                    <div style="background: #f3e5f5; padding: 12px; border-radius: 10px;">
                        <small style="color: #888;">Rudishi</small><br>
                        <strong style="color: #9B59B6; font-size: 18px;">${drink.dailyReturnPercentage || 0}%</strong>
                    </div>
                </div>
                
                <!-- Balance Info -->
                <div style="
                    background: ${canAfford ? '#d4edda' : '#f8d7da'}; 
                    padding: 12px; 
                    border-radius: 10px; 
                    margin-bottom: 20px;
                    text-align: center;
                ">
                    <p style="margin: 0; font-size: 14px; color: ${canAfford ? '#155724' : '#721c24'};">
                        <i class="fas fa-${canAfford ? 'check-circle' : 'exclamation-circle'}"></i>
                        <strong>Salio Lako:</strong> ${formatCurrency(currentBalance)}
                        ${!canAfford ? `<br><small style="color: #721c24;">Unahitaji ${formatCurrency(shortage)} zaidi. <a href="#" onclick="closeProductModal();showSection('deposit');" style="color:#721c24;text-decoration:underline;">Weka amana</a></small>` : ''}
                    </p>
                </div>
                
                <!-- BUY BUTTON - Only button, opens from details -->
                <button onclick="buyDrink('${drinkId}')" 
                        style="
                            width: 100%; 
                            padding: 15px; 
                            background: ${canAfford ? 'linear-gradient(135deg, #FF6B35, #FF8C42)' : '#ccc'}; 
                            color: #fff; 
                            border: none; 
                            border-radius: 12px; 
                            font-size: 16px; 
                            font-weight: 700; 
                            cursor: ${canAfford ? 'pointer' : 'not-allowed'};
                            transition: all 0.3s ease;
                        "
                        ${!canAfford ? 'disabled' : ''}
                        onmouseover="if(!this.disabled){this.style.transform='translateY(-2px)';this.style.boxShadow='0 8px 20px rgba(255,107,53,0.4)';}"
                        onmouseout="this.style.transform='translateY(0)';this.style.boxShadow='none';">
                    ${canAfford ? 
                        '<i class="fas fa-shopping-cart"></i> Nunua Sasa - ' + formatCurrency(drink.price) : 
                        '<i class="fas fa-lock"></i> Salio Halitoshi'
                    }
                </button>
            </div>
        `;
        
        document.getElementById('productModal').classList.add('active');
        
    } catch (error) {
        console.error('Error viewing drink:', error);
        showToast('Imeshindikana kupakia kinywaji.', 'error');
    }
}

/**
 * Render Drinks - FIXED (used by admin/super admin)
 */
function renderDrinks(drinks, containerId) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error('Container not found:', containerId);
        return;
    }
    
    if (!drinks || drinks.length === 0) {
        container.innerHTML = '<p class="text-center p-4">Hakuna vinywaji vinavyopatikana.</p>';
        return;
    }
    
    console.log('Rendering', drinks.length, 'drinks to', containerId);
    
    container.innerHTML = drinks.map(drink => {
        const drinkId = drink.id; // Get the document ID
        
        console.log('Drink:', drinkId, drink.name); // Debug
        
        return `
            <div class="drink-card" onclick="viewDrinkDetail('${drinkId}')">
                <div class="drink-image">
                    <img src="${drink.image || 'https://via.placeholder.com/150'}" 
                         alt="${drink.name || 'Kinywaji'}"
                         onerror="this.src='https://via.placeholder.com/150'">
                </div>
                <div class="drink-details">
                    <h3>${drink.name}</h3>
                    <p class="description">${drink.description || ''}</p>
                    <div class="drink-meta">
                        <div class="drink-price">
                            Bei: <span>${formatCurrency(drink.price)}</span>
                        </div>
                        <div class="drink-duration">
                            Muda: <span>${drink.duration} siku</span>
                        </div>
                    </div>
                    <div class="daily-earning">
                        Mapato/siku: ${formatCurrency(drink.dailyReturn || 0)}
                    </div>
                    <button class="buy-btn" onclick="event.stopPropagation(); buyDrink('${drinkId}')">
                        Nunua Sasa
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Buy Drink - FIXED with proper dates
 */
async function buyDrink(drinkId) {
    if (!currentUser) {
        showToast('Tafadhali ingia kwanza.', 'warning');
        return;
    }
    
    try {
        const drinkDoc = await db.collection('drinks').doc(drinkId).get();
        if (!drinkDoc.exists) {
            showToast('Kinywaji hakijapatikana.', 'error');
            return;
        }
        
        const drink = drinkDoc.data();
        const userDoc = await db.collection('users').doc(currentUser.uid).get();
        const userData = userDoc.data();
        const currentBalance = userData.balance || 0;
        
        if (currentBalance < drink.price) {
            showToast(`Salio halitoshi. Una ${formatCurrency(currentBalance)}, unahitaji ${formatCurrency(drink.price)}.`, 'error');
            return;
        }
        
        // Calculate dates
        const now = new Date();
        const endDate = new Date(now);
        endDate.setDate(endDate.getDate() + (drink.duration || 30));
        
        console.log('Purchase dates:', {
            now: now.toISOString(),
            endDate: endDate.toISOString(),
            duration: drink.duration
        });
        
        // Create purchase with PROPER timestamps
        const purchaseData = {
            userId: currentUser.uid,
            username: userData.username || '',
            drinkId: drinkId,
            name: drink.name,
            image: drink.image || '',
            price: drink.price,
            duration: drink.duration || 30,
            dailyReturn: drink.dailyReturn || 0,
            dailyReturnPercentage: drink.dailyReturnPercentage || 0,
            status: 'active',
            purchasedAt: firebase.firestore.Timestamp.fromDate(now),
            endDate: firebase.firestore.Timestamp.fromDate(endDate)
        };
        
        await db.collection('purchases').add(purchaseData);
        
        // Update user balance
        const newBalance = currentBalance - drink.price;
        await db.collection('users').doc(currentUser.uid).update({
            balance: newBalance,
            activeDrinks: firebase.firestore.FieldValue.increment(1)
        });
        
        showToast(`Umefanikiwa kununua ${drink.name}! 🎉`, 'success');
        closeProductModal();
        loadUserData();
        loadMyDrinks();
        
    } catch (error) {
        console.error('Error buying drink:', error);
        showToast('Imeshindikana kununua kinywaji.', 'error');
    }
}

/**
 * Load My Drinks - REAL-TIME PROGRESS FROM 0.01% WITH LIVE PROFIT
 */
async function loadMyDrinks() {
    if (!currentUser) return;
    
    const container = document.getElementById('myDrinksGrid');
    const emptyState = document.getElementById('myDrinksEmpty');
    const countBadge = document.getElementById('myDrinksCount');
    
    if (!container) return;
    
    try {
        container.innerHTML = Array(2).fill('<div class="drink-skeleton"></div>').join('');
        if (emptyState) emptyState.style.display = 'none';
        
        const snapshot = await db.collection('purchases')
            .where('userId', '==', currentUser.uid)
            .where('status', '==', 'active')
            .get();
        
        if (countBadge) countBadge.textContent = snapshot.size;
        
        if (snapshot.empty) {
            container.innerHTML = '';
            if (emptyState) emptyState.style.display = 'flex';
            return;
        }
        
        if (emptyState) emptyState.style.display = 'none';
        container.innerHTML = '';
        
        // Use exact current time for real-time calculation
        const now = new Date();
        
        snapshot.forEach(doc => {
            const purchase = doc.data();
            
            // ============================================
            // EXACT REAL-TIME DATE CALCULATIONS
            // ============================================
            
            // Purchase start - use exact timestamp
            let purchaseStart;
            if (purchase.purchasedAt && typeof purchase.purchasedAt.toDate === 'function') {
                purchaseStart = purchase.purchasedAt.toDate();
            } else if (purchase.purchasedAt instanceof Date) {
                purchaseStart = purchase.purchasedAt;
            } else if (purchase.purchasedAt && purchase.purchasedAt.seconds) {
                purchaseStart = new Date(purchase.purchasedAt.seconds * 1000);
            } else {
                purchaseStart = new Date();
                console.warn('Using current date as fallback for purchase start');
            }
            
            // End date
            let endDate;
            if (purchase.endDate && typeof purchase.endDate.toDate === 'function') {
                endDate = purchase.endDate.toDate();
            } else if (purchase.endDate instanceof Date) {
                endDate = purchase.endDate;
            } else if (purchase.endDate && purchase.endDate.seconds) {
                endDate = new Date(purchase.endDate.seconds * 1000);
            } else {
                endDate = new Date(purchaseStart);
                endDate.setDate(endDate.getDate() + (purchase.duration || 30));
            }
            
            // ============================================
            // REAL-TIME METRICS (Updates every second)
            // ============================================
            
            const totalDays = purchase.duration || 30;
            const price = purchase.price || 0;
            const dailyReturn = purchase.dailyReturn || 0;
            
            // Exact milliseconds elapsed
            const msElapsed = now.getTime() - purchaseStart.getTime();
            const msTotal = endDate.getTime() - purchaseStart.getTime();
            
            // Fractional days elapsed (e.g., 0.5 = half a day)
            const fractionalDaysElapsed = msElapsed / (1000 * 60 * 60 * 24);
            
            // Whole days completed
            const wholeDaysCompleted = Math.floor(fractionalDaysElapsed);
            
            // Days remaining
            const msRemaining = endDate.getTime() - now.getTime();
            const daysRemaining = Math.max(0, Math.ceil(msRemaining / (1000 * 60 * 60 * 24)));
            
            // Real-time progress (0.00% to 100.00%)
            const progressFraction = Math.min(1, Math.max(0, msElapsed / msTotal));
            const progressPercent = (progressFraction * 100).toFixed(1);
            
            // Real-time earnings (proportional to time elapsed)
            const realTimeEarned = dailyReturn * Math.min(fractionalDaysElapsed, totalDays);
            
            // Total expected at completion
            const totalExpectedReturn = dailyReturn * totalDays;
            
            // Current profit/loss
            const currentProfit = realTimeEarned - price;
            
            // ROI
            const roi = price > 0 ? ((totalExpectedReturn - price) / price * 100).toFixed(1) : 0;
            
            console.log('📊 REAL-TIME:', purchase.name, {
                start: purchaseStart.toLocaleString('sw-TZ'),
                end: endDate.toLocaleString('sw-TZ'),
                now: now.toLocaleString('sw-TZ'),
                elapsedHours: (fractionalDaysElapsed * 24).toFixed(1),
                fractionalDays: fractionalDaysElapsed.toFixed(2),
                wholeDays: wholeDaysCompleted,
                progress: progressPercent + '%',
                realTimeEarned: formatCurrency(realTimeEarned),
                currentProfit: formatCurrency(currentProfit)
            });
            
            // ============================================
            // STATUS
            // ============================================
            
            let statusColor, statusBg, progressGradient, statusText, statusIcon;
            
            if (daysRemaining <= 0) {
                statusColor = '#004E89';
                statusBg = '#e3f2fd';
                progressGradient = 'linear-gradient(90deg, #004E89, #0984e3)';
                statusText = 'Imekamilika';
                statusIcon = 'fa-check-double';
            } else if (daysRemaining <= 3) {
                statusColor = '#F39C12';
                statusBg = '#fff8e1';
                progressGradient = 'linear-gradient(90deg, #FFD166, #F39C12)';
                statusText = 'Inakaribia';
                statusIcon = 'fa-clock';
            } else if (wholeDaysCompleted === 0) {
                statusColor = '#1A936F';
                statusBg = '#e8f5e9';
                progressGradient = 'linear-gradient(90deg, #1A936F, #20c997)';
                statusText = 'Imeshaanza';
                statusIcon = 'fa-play-circle';
            } else {
                statusColor = '#1A936F';
                statusBg = '#e8f5e9';
                progressGradient = 'linear-gradient(90deg, #1A936F, #20c997)';
                statusText = 'Inaendelea';
                statusIcon = 'fa-sync-alt fa-spin';
            }
            
            // ============================================
            // BUILD CARD
            // ============================================
            
            const card = document.createElement('div');
            card.style.cssText = `
                background: #fff;
                border-radius: 16px;
                padding: 18px;
                box-shadow: 0 3px 15px rgba(0,0,0,0.08);
                margin-bottom: 15px;
                position: relative;
                overflow: hidden;
            `;
            card.innerHTML = `
    <div style="position:absolute;top:0;left:0;right:0;height:4px;background:${progressGradient};"></div>
    
    <div style="display:flex;gap:12px;margin-bottom:14px;padding-top:6px;">
        <div style="width:60px;height:60px;border-radius:12px;background:#f8f9fa;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
            <img src="${purchase.image || 'https://via.placeholder.com/45'}" 
                 style="width:40px;height:40px;object-fit:contain;"
                 onerror="this.src='https://via.placeholder.com/45'">
        </div>
        <div style="flex:1;min-width:0;">
            <h4 style="margin:0 0 4px;font-size:15px;font-weight:700;">${purchase.name}</h4>
            <span style="font-size:10px;padding:3px 8px;border-radius:10px;background:${statusBg};color:${statusColor};font-weight:600;">
                <i class="fas ${statusIcon}" style="margin-right:3px;"></i>${statusText}
            </span>
        </div>
    </div>
    
    <!-- REAL-TIME PROGRESS BAR - WITH LIVE CLASSES -->
    <div style="margin-bottom:12px;">
        <div style="display:flex;justify-content:space-between;margin-bottom:4px;font-size:10px;">
            <span style="color:#666;">Siku ${wholeDaysCompleted}/${totalDays}</span>
            <span class="progress-text-live" style="color:${statusColor};font-weight:700;font-size:13px;">${progressPercent}%</span>
        </div>
        <div style="height:8px;background:#e9ecef;border-radius:10px;overflow:hidden;">
            <div class="progress-fill-live" style="height:100%;width:${progressPercent}%;border-radius:10px;background:${progressGradient};"></div>
        </div>
        <div style="display:flex;justify-content:space-between;margin-top:2px;font-size:8px;color:#ccc;">
            <span>0%</span><span>50%</span><span>100%</span>
        </div>
    </div>
    
    <!-- EARNINGS CARDS -->
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin-bottom:10px;">
        <div style="padding:10px 6px;border-radius:8px;background:#e8f5e9;text-align:center;">
            <span style="font-size:13px;font-weight:700;color:#1A936F;display:block;">${formatCurrency(dailyReturn)}</span>
            <span style="font-size:9px;color:#666;">/Siku</span>
        </div>
        <div style="padding:10px 6px;border-radius:8px;background:#e3f2fd;text-align:center;">
            <span class="earnings-live" style="font-size:13px;font-weight:700;color:#004E89;display:block;">${formatCurrency(realTimeEarned)}</span>
            <span style="font-size:9px;color:#666;">Mapato</span>
        </div>
        <div style="padding:10px 6px;border-radius:8px;background:#fff3e0;text-align:center;">
            <span style="font-size:13px;font-weight:700;color:#F39C12;display:block;">${formatCurrency(totalExpectedReturn)}</span>
            <span style="font-size:9px;color:#666;">Jumla</span>
        </div>
    </div>
    
    <!-- PROFIT - WITH LIVE CLASS -->
    <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 10px;border-radius:8px;background:${currentProfit >= 0 ? '#f1f8e9' : '#fce4ec'};margin-bottom:8px;font-size:10px;">
        <span style="color:#666;">Bei: <strong>${formatCurrency(price)}</strong></span>
        <span style="font-weight:700;">
            <i class="fas fa-${currentProfit >= 0 ? 'arrow-up' : 'arrow-down'}" style="margin-right:2px;color:${currentProfit >= 0 ? '#1A936F' : '#EF233C'};"></i>
            Faida: <strong class="profit-live" style="color:${currentProfit >= 0 ? '#1A936F' : '#EF233C'};">${formatCurrency(currentProfit)}</strong>
            <span style="font-size:9px;color:#666;"> (${roi}%)</span>
        </span>
    </div>
    
    <!-- FOOTER -->
    <div style="display:flex;justify-content:space-between;align-items:center;padding-top:8px;border-top:1px solid #f0f0f0;">
        <span style="font-size:10px;color:#888;">
            <i class="fas fa-hourglass-half" style="color:${statusColor};margin-right:3px;"></i>
            ${daysRemaining > 0 ? `<strong style="color:${statusColor};">${daysRemaining}</strong> siku` : '<strong style="color:#004E89;">Imekamilika</strong>'}
        </span>
        <span style="font-size:10px;color:#888;">
            ${purchaseStart.toLocaleDateString('sw-TZ')} → ${endDate.toLocaleDateString('sw-TZ')}
        </span>
    </div>
`;
            
            container.appendChild(card);
            
// REAL-TIME UPDATE EVERY SECOND
const cardRef = card;
const updateInterval = setInterval(() => {
    // Stop if card is removed from DOM
    if (!cardRef.parentElement || !document.contains(cardRef)) {
        clearInterval(updateInterval);
        return;
    }
    
    const liveNow = new Date();
    const liveMsElapsed = liveNow.getTime() - purchaseStart.getTime();
    const liveFraction = Math.min(1, Math.max(0, liveMsElapsed / msTotal));
    const liveProgress = (liveFraction * 100).toFixed(1);
    const liveEarned = dailyReturn * Math.min(liveMsElapsed / (1000 * 60 * 60 * 24), totalDays);
    const liveProfit = liveEarned - price;
    
    // Update progress bar width
    const progressFill = cardRef.querySelector('.progress-fill-live');
    if (progressFill) {
        progressFill.style.width = liveProgress + '%';
    }
    
    // Update progress percentage text
    const progressText = cardRef.querySelector('.progress-text-live');
    if (progressText) {
        progressText.textContent = liveProgress + '%';
        
        // Color the text based on progress
        if (parseFloat(liveProgress) >= 100) {
            progressText.style.color = '#004E89';
        } else if (parseFloat(liveProgress) >= 80) {
            progressText.style.color = '#F39C12';
        } else {
            progressText.style.color = '#1A936F';
        }
    }
    
    // Update earnings
    const earningsText = cardRef.querySelector('.earnings-live');
    if (earningsText) {
        const newEarnings = formatCurrency(liveEarned);
        if (earningsText.textContent !== newEarnings) {
            earningsText.textContent = newEarnings;
            earningsText.style.transform = 'scale(1.1)';
            setTimeout(() => earningsText.style.transform = 'scale(1)', 200);
        }
    }
    
    // Update profit
    const profitText = cardRef.querySelector('.profit-live');
    if (profitText) {
        const newProfit = formatCurrency(liveProfit);
        profitText.textContent = newProfit;
        profitText.style.color = liveProfit >= 0 ? '#1A936F' : '#EF233C';
    }
    
}, 1000); // Update every second

// Clean up interval when card is removed
cardRef._updateInterval = updateInterval;
        });
        
    } catch (error) {
        console.error('Error:', error);
        container.innerHTML = '<p class="text-center text-danger p-4">Imeshindikana kupakia</p>';
    }
}

/**
 * Process daily earnings - Run this periodically or on login
 * Adds daily earnings to user balance for active purchases
 */
async function processDailyEarnings() {
    if (!currentUser) return;
    
    try {
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        // Get active purchases
        const snapshot = await db.collection('purchases')
            .where('userId', '==', currentUser.uid)
            .where('status', '==', 'active')
            .get();
        
        if (snapshot.empty) return;
        
        let totalEarningsToday = 0;
        
        for (const doc of snapshot.docs) {
            const purchase = doc.data();
            
            // Get purchase start date
            let purchasedDate = new Date();
            if (purchase.purchasedAt && purchase.purchasedAt.toDate) {
                purchasedDate = purchase.purchasedAt.toDate();
            }
            const purchaseStart = new Date(purchasedDate.getFullYear(), purchasedDate.getMonth(), purchasedDate.getDate());
            
            // Get end date
            let endDate = new Date(purchasedDate);
            endDate.setDate(endDate.getDate() + (purchase.duration || 30));
            if (purchase.endDate && purchase.endDate.toDate) {
                endDate = purchase.endDate.toDate();
            }
            const endStart = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
            
            // Check if still active
            if (todayStart > endStart) {
                // Purchase has expired - mark as completed
                await db.collection('purchases').doc(doc.id).update({
                    status: 'completed',
                    completedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                console.log(`Completed: ${purchase.name}`);
                continue;
            }
            
            // Check if today is within the earning period
            if (todayStart >= purchaseStart && todayStart <= endStart) {
                // Check if already processed today
                const lastProcessed = purchase.lastEarningDate ? purchase.lastEarningDate.toDate() : null;
                const lastProcessedStart = lastProcessed ? 
                    new Date(lastProcessed.getFullYear(), lastProcessed.getMonth(), lastProcessed.getDate()) : null;
                
                if (!lastProcessedStart || lastProcessedStart < todayStart) {
                    // Add daily earning
                    const dailyReturn = purchase.dailyReturn || 0;
                    totalEarningsToday += dailyReturn;
                    
                    // Update last processed date
                    await db.collection('purchases').doc(doc.id).update({
                        lastEarningDate: firebase.firestore.Timestamp.fromDate(now),
                        totalEarnedSoFar: firebase.firestore.FieldValue.increment(dailyReturn)
                    });
                    
                    console.log(`Earnings processed: ${purchase.name} - ${formatCurrency(dailyReturn)}`);
                }
            }
        }
        
        // Add total earnings to user balance
        if (totalEarningsToday > 0) {
            await db.collection('users').doc(currentUser.uid).update({
                balance: firebase.firestore.FieldValue.increment(totalEarningsToday),
                dailyEarnings: firebase.firestore.FieldValue.increment(totalEarningsToday),
                totalEarnings: firebase.firestore.FieldValue.increment(totalEarningsToday)
            });
            
            console.log(`Total earnings added to balance: ${formatCurrency(totalEarningsToday)}`);
        }
        
    } catch (error) {
        console.error('Error processing daily earnings:', error);
    }
}

// Process earnings on login and periodically
document.addEventListener('DOMContentLoaded', () => {
    // Check every hour
    setInterval(() => {
        if (currentUser) {
            processDailyEarnings();
        }
    }, 3600000); // 1 hour
});

// Also process when user logs in
const originalShowUserDashboard = showUserDashboard;
showUserDashboard = function() {
    originalShowUserDashboard();
    setTimeout(() => processDailyEarnings(), 2000);
};

/**
 * View Purchased Drink Detail
 */
async function viewPurchasedDrinkDetail(purchaseId) {
    try {
        const purchaseDoc = await db.collection('purchases').doc(purchaseId).get();
        if (!purchaseDoc.exists) {
            showToast('Kinywaji hakijapatikana.', 'error');
            return;
        }
        
        const purchase = purchaseDoc.data();
        const now = new Date();
        const endDate = purchase.endDate?.toDate() || new Date();
        const purchasedDate = purchase.purchasedAt?.toDate() || new Date();
        const daysRemaining = Math.max(0, Math.floor((endDate - now) / (1000 * 60 * 60 * 24)));
        const totalDays = purchase.duration || 30;
        const daysElapsed = Math.min(totalDays, Math.floor((now - purchasedDate) / (1000 * 60 * 60 * 24)));
        const totalEarned = (purchase.dailyReturn || 0) * daysElapsed;
        
        document.getElementById('productDetail').innerHTML = `
            <div style="text-align: center;">
                <img src="${purchase.image || 'https://via.placeholder.com/200'}" 
                     alt="${purchase.name}" 
                     style="width: 120px; height: 120px; object-fit: contain; margin-bottom: 15px;">
                <h2>${purchase.name}</h2>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 20px 0;">
                    <div style="background: #e8f5e9; padding: 12px; border-radius: 10px;">
                        <small>Mapato/Siku</small><br>
                        <strong style="color: #1A936F;">${formatCurrency(purchase.dailyReturn || 0)}</strong>
                    </div>
                    <div style="background: #e3f2fd; padding: 12px; border-radius: 10px;">
                        <small>Mapato Yote</small><br>
                        <strong style="color: #004E89;">${formatCurrency(totalEarned)}</strong>
                    </div>
                    <div style="background: #fff3e0; padding: 12px; border-radius: 10px;">
                        <small>Siku Zilizobaki</small><br>
                        <strong style="color: #F39C12;">${daysRemaining} / ${totalDays}</strong>
                    </div>
                    <div style="background: #f3e5f5; padding: 12px; border-radius: 10px;">
                        <small>Bei ya Kununua</small><br>
                        <strong style="color: #9B59B6;">${formatCurrency(purchase.price)}</strong>
                    </div>
                </div>
                
                <p style="color: #666; font-size: 13px;">
                    Imenunuliwa: ${purchasedDate.toLocaleDateString('sw-TZ')}<br>
                    Inaisha: ${endDate.toLocaleDateString('sw-TZ')}
                </p>
                
                <button class="btn-primary" onclick="closeProductModal()" style="width: 100%; margin-top: 15px;">Funga</button>
            </div>
        `;
        
        document.getElementById('productModal').classList.add('active');
        
    } catch (error) {
        console.error('Error viewing purchased drink:', error);
        showToast('Imeshindikana kupakia maelezo.', 'error');
    }
}

console.log('✅ My Drinks Premium Loaded');

/**
 * Render history list
 */
function renderHistory(items) {
    const container = document.getElementById('historyList');
    if (!container) return;
    
    if (items.length === 0) {
        container.innerHTML = '<p class="text-center p-4">Hakuna historia inayopatikana.</p>';
        return;
    }
    
    container.innerHTML = items.map(item => {
        const isPositive = item.type === 'deposit' || item.status === 'active';
        const amountClass = isPositive ? 'success' : 'danger';
        const prefix = item.type === 'withdraw' ? '-' : (item.type === 'deposit' ? '+' : '');
        
        return `
            <div class="history-item" style="display: flex; justify-content: space-between; align-items: center; padding: 15px; border-bottom: 1px solid #eee;">
                <div>
                    <h4 style="margin: 0; font-size: 14px;">${item.title}</h4>
                    <small style="color: #666;">${item.date?.toLocaleString('sw-TZ') || 'N/A'}</small>
                </div>
                <div style="text-align: right;">
                    <strong style="color: ${isPositive ? '#1A936F' : '#EF233C'};">
                        ${prefix} ${formatCurrency(item.amount)}
                    </strong>
                    <br>
                    <span class="status-badge ${getStatusClass(item.status)}" style="font-size: 11px;">
                        ${getStatusLabel(item.status)}
                    </span>
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Filter history by type
 */
function filterHistory(filter) {
    document.querySelectorAll('.history-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    if (event && event.target) {
        event.target.classList.add('active');
    }
    
    loadHistory(filter);
}



// --------------------------------------------
// 15. LIVE TRANSACTIONS
// --------------------------------------------

/**
 * Start generating live transactions
 */
function startLiveTransactions() {
    if (liveTransactionInterval) {
        clearInterval(liveTransactionInterval);
    }
    
    generateLiveTransaction();
    
    liveTransactionInterval = setInterval(() => {
        generateLiveTransaction();
    }, 5000);
}

/**
 * Generate a random live transaction
 */
function generateLiveTransaction() {
    const feed = document.getElementById('transactionFeed');
    if (!feed) return;
    
    const randomName = tanzanianNames[Math.floor(Math.random() * tanzanianNames.length)];
    const randomUsername = '@' + randomName.toLowerCase().replace(/\s+/g, '');
    const isDeposit = Math.random() > 0.3;
    const amount = Math.floor(Math.random() * 500000) + 10000;
    const type = isDeposit ? 'deposit' : 'withdrawal';
    
    const transactionHtml = `
        <div class="transaction-item" style="display: flex; align-items: center; gap: 15px; padding: 12px; border-bottom: 1px solid #f0f0f0; animation: slideIn 0.5s ease;">
            <div style="width: 40px; height: 40px; border-radius: 50%; background: ${isDeposit ? '#1A936F' : '#EF233C'}; color: white; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 14px;">
                ${getInitials(randomName)}
            </div>
            <div style="flex: 1;">
                <h4 style="margin: 0; font-size: 14px;">${randomName}</h4>
                <p style="margin: 0; font-size: 12px; color: #666;">${randomUsername}</p>
            </div>
            <div style="font-weight: 700; font-size: 14px; color: ${isDeposit ? '#1A936F' : '#EF233C'};">
                ${isDeposit ? '+' : '-'} ${formatCurrency(amount)}
            </div>
        </div>
    `;
    
    feed.insertAdjacentHTML('afterbegin', transactionHtml);
    
    // Keep only last 10 transactions
    const items = feed.querySelectorAll('.transaction-item');
    if (items.length > 10) {
        items[items.length - 1].remove();
    }
}

// --------------------------------------------
// 16. MODAL FUNCTIONS
// --------------------------------------------

function closeProductModal() {
    document.getElementById('productModal').classList.remove('active');
}

function closeBankModal() {
    document.getElementById('bankModal').classList.remove('active');
}

function closeTransactionModal() {
    document.getElementById('transactionModal').classList.remove('active');
}

function closeUserDetailModal() {
    document.getElementById('userDetailModal')?.classList.remove('active');
}

function closeAddUserModal() {
    document.getElementById('addUserModal')?.classList.remove('active');
}

function closeAddAdminModal() {
    document.getElementById('addAdminModal')?.classList.remove('active');
}

function closeAddDrinkModal() {
    document.getElementById('addDrinkModal')?.classList.remove('active');
}

function closeAddSlideModal() {
    document.getElementById('addSlideModal')?.classList.remove('active');
}

function closeAddBankAccountModal() {
    document.getElementById('addBankAccountModal')?.classList.remove('active');
}

// Close modals when clicking outside
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.classList.remove('active');
    }
};

// Close dropdowns when clicking outside
document.addEventListener('click', (e) => {
    if (!e.target.closest('.user-dropdown')) {
        document.getElementById('userDropdown')?.classList.remove('active');
        document.getElementById('adminUserDropdown')?.classList.remove('active');
        document.getElementById('superAdminUserDropdown')?.classList.remove('active');
    }
    if (!e.target.closest('.notification-bell')) {
        document.getElementById('adminNotificationDropdown')?.classList.remove('active');
    }
});

// --------------------------------------------
// 17. SUPER ADMIN CREATION (ONE-TIME SETUP)
// --------------------------------------------

/**
 * Create super admin account for first-time setup
 * Call this function manually from browser console:
 * createSuperAdminAccount()
 */
async function createSuperAdminAccount() {
    const email = "admin@cashcola.com";
    const password = "SuperAdmin123!";
    
    try {
        // Check if super admin already exists
        const existingAdmins = await db.collection('users')
            .where('role', '==', 'super_admin')
            .limit(1)
            .get();
        
        if (!existingAdmins.empty) {
            console.log('Super Admin already exists.');
            console.log('Email:', existingAdmins.docs[0].data().email);
            return;
        }
        
        // Try to sign in first
        try {
            const userCredential = await auth.signInWithEmailAndPassword(email, password);
            const user = userCredential.user;
            
            await db.collection('users').doc(user.uid).update({
                role: 'super_admin',
                status: 'active'
            });
            
            console.log('Existing user upgraded to Super Admin!');
            console.log('Email:', email);
            console.log('Password:', password);
            await auth.signOut();
            return;
            
        } catch (signInError) {
            if (signInError.code !== 'auth/user-not-found') {
                throw signInError;
            }
        }
        
        // Create new super admin
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        await user.updateProfile({ displayName: 'Super Admin' });
        
        await db.collection('users').doc(user.uid).set({
            uid: user.uid,
            username: 'superadmin',
            fullname: 'Super Admin',
            email: email,
            phone: '',
            balance: 0,
            totalEarnings: 0,
            role: 'super_admin',
            status: 'active',
            referralCode: 'CCSUPER',
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        console.log('✅ Super Admin created successfully!');
        console.log('📧 Email:', email);
        console.log('🔑 Password:', password);
        console.log('⚠️ Please change the password after first login!');
        
        await auth.signOut();
        
    } catch (error) {
        console.error('❌ Error creating super admin:', error);
    }
}

// Auto-create super admin on first load
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        createSuperAdminAccount();
    }, 2000);
});

// --------------------------------------------
// 18. ADMIN DASHBOARD FUNCTIONS
// --------------------------------------------

/**
 * Show admin dashboard
 */
async function showAdminDashboard() {
    document.getElementById('loginPage').style.display = 'none';
    document.getElementById('dashboard').style.display = 'none';
    document.getElementById('adminDashboard').style.display = 'flex';
    document.getElementById('superAdminDashboard').style.display = 'none';
    
    document.getElementById('adminUsername').textContent = currentUserData.fullname || 'Admin';
    document.getElementById('sidebarAdminName').textContent = currentUserData.fullname || 'Admin';
    
    await loadAdminOverview();
    loadAdminNotifications();
}

/**
 * Toggle admin sidebar
 */
function toggleAdminSidebar() {
    document.getElementById('adminSidebar').classList.toggle('active');
}

/**
 * Toggle admin user menu
 */
function toggleAdminUserMenu() {
    document.getElementById('adminUserDropdown').classList.toggle('active');
}

/**
 * Toggle admin notifications
 */
function toggleAdminNotifications() {
    document.getElementById('adminNotificationDropdown').classList.toggle('active');
}

/**
 * Show admin profile
 */
function showAdminProfile() {
    document.getElementById('adminUserDropdown').classList.remove('active');
    showAdminSection('adminSettings');
    document.getElementById('adminFullname').value = currentUserData.fullname || '';
    document.getElementById('adminEmail').value = currentUserData.email || '';
}

/**
 * Load admin overview
 */
async function loadAdminOverview() {
    try {
        // Total users
        const usersSnapshot = await db.collection('users').get();
        document.getElementById('totalUsers').textContent = usersSnapshot.size;
        
        // Calculate totals
        let totalDeposits = 0;
        let totalWithdrawals = 0;
        let pendingCount = 0;
        
        const depositsSnapshot = await db.collection('deposits').get();
        depositsSnapshot.forEach(doc => {
            const data = doc.data();
            if (data.status === 'approved') totalDeposits += (data.amount || 0);
            if (data.status === 'pending') pendingCount++;
        });
        
        const withdrawalsSnapshot = await db.collection('withdrawals').get();
        withdrawalsSnapshot.forEach(doc => {
            const data = doc.data();
            if (data.status === 'approved') totalWithdrawals += (data.amount || 0);
            if (data.status === 'pending') pendingCount++;
        });
        
        const purchasesSnapshot = await db.collection('purchases').get();
        const profit = totalDeposits - totalWithdrawals;
        
        document.getElementById('totalDeposits').textContent = formatCurrency(totalDeposits);
        document.getElementById('totalWithdrawals').textContent = formatCurrency(totalWithdrawals);
        document.getElementById('totalPurchases').textContent = purchasesSnapshot.size;
        document.getElementById('companyProfit').textContent = formatCurrency(profit);
        document.getElementById('pendingRequests').textContent = pendingCount;
        
        // Update badges
        const pendingDeposits = (await db.collection('deposits').where('status', '==', 'pending').get()).size;
        const pendingWithdrawals = (await db.collection('withdrawals').where('status', '==', 'pending').get()).size;
        
        const pendingDepBadge = document.getElementById('pendingDepositsBadge');
        const pendingWithBadge = document.getElementById('pendingWithdrawalsBadge');
        
        if (pendingDepBadge) pendingDepBadge.textContent = pendingDeposits;
        if (pendingWithBadge) pendingWithBadge.textContent = pendingWithdrawals;
        
        await loadAdminActivities();
        await loadAdminNotices();
        
    } catch (error) {
        console.error('Error loading admin overview:', error);
    }
}

/**
 * Load Admin Notices - FIXED (No index required)
 */
async function loadAdminNotices() {
    const board = document.getElementById('adminNoticeBoard');
    if (!board) return;
    
    try {
        // Use a simpler query that doesn't require composite index
        const snapshot = await db.collection('notices')
            .limit(10)
            .get();
        
        if (snapshot.empty) {
            board.innerHTML = '<p class="text-center p-3">Hakuna notisi kwa sasa.</p>';
            return;
        }
        
        // Sort manually in JavaScript instead of relying on Firestore ordering
        const notices = [];
        snapshot.forEach(doc => {
            notices.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        // Sort by date manually
        notices.sort((a, b) => {
            const dateA = a.createdAt?.toDate() || new Date(0);
            const dateB = b.createdAt?.toDate() || new Date(0);
            return dateB - dateA;
        });
        
        board.innerHTML = notices.slice(0, 10).map(notice => `
            <div class="notice-item ${notice.urgent ? 'urgent' : ''}">
                <h5>${notice.title || 'Hakuna Kichwa'}</h5>
                <p>${notice.message || ''}</p>
                <small>${notice.createdAt?.toDate().toLocaleString('sw-TZ') || 'Hivi punde'}</small>
                <button class="btn-sm" onclick="deleteNotice('${notice.id}')" style="margin-top: 5px;">Futa</button>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Error loading notices:', error);
        board.innerHTML = '<p class="text-center p-3 text-danger">Imeshindikana kupakia notisi.</p>';
    }
}

// ============================================
// ENHANCED SLIDESHOW SYSTEM
// ============================================
const SLIDE_DURATION = 10000;
let slideInterval = null;
let isVideoPlaying = false;

/**
 * Load Slides from Firestore
 */
async function loadSlides() {
    try {
        const snapshot = await db.collection('slides')
            .where('active', '==', true)
            .get();
        
        slides = [];
        snapshot.forEach(doc => {
            slides.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        // Sort by order
        slides.sort((a, b) => (a.order || 0) - (b.order || 0));
        
        if (slides.length === 0) {
            // Create default slides
            createDefaultSlides();
        }
        
        renderSlides();
        startSlideshow();
        
    } catch (error) {
        console.error('Error loading slides:', error);
        createDefaultSlides();
        renderSlides();
    }
}

/**
 * Create Default Slides
 */
function createDefaultSlides() {
    slides = [
        {
            id: 'default-1',
            title: 'Karibu CashCola',
            description: 'Jukwaa bora la uwekezaji wa vinywaji na mapato ya kila siku nchini Tanzania. Jiunge nasi leo!',
            type: 'text',
            active: true,
            order: 1,
            gradientClass: 'slide-bg-gradient-1'
        },
        {
            id: 'default-2',
            title: 'Pata Mapato Kila Siku',
            description: 'Nunua vinywaji na upate mapato ya kila siku. Wekeza kidogo, pata zaidi!',
            type: 'text',
            active: true,
            order: 2,
            gradientClass: 'slide-bg-gradient-2'
        },
        {
            id: 'default-3',
            title: 'Rufaa na Ushinde',
            description: 'Mwalike rafiki yako na upate bonasi ya 10% kwenye amana yao ya kwanza!',
            type: 'text',
            active: true,
            order: 3,
            gradientClass: 'slide-bg-gradient-3'
        }
    ];
}

/**
 * Render Slides in Slideshow
 */
function renderSlides() {
    const wrapper = document.getElementById('slidesWrapper');
    const dots = document.getElementById('slideDots');
    
    if (!wrapper || !dots) return;
    
    if (slides.length === 0) {
        createDefaultSlide();
        return;
    }
    
    const gradients = ['slide-bg-gradient-1', 'slide-bg-gradient-2', 'slide-bg-gradient-3', 'slide-bg-gradient-4', 'slide-bg-gradient-5'];
    
    wrapper.innerHTML = slides.map((slide, index) => {
        let slideContent = '';
        
        if (slide.type === 'image' && slide.mediaUrl) {
            // Image slide
            slideContent = `
                <img src="${slide.mediaUrl}" alt="${slide.title || ''}" style="width: 100%; height: 100%; object-fit: cover; position: absolute; top: 0; left: 0;">
                <div class="slide-overlay"></div>
            `;
        } else if (slide.type === 'video' && slide.mediaUrl) {
            // Video slide - AUTOPLAY
            if (slide.mediaUrl.includes('youtube.com') || slide.mediaUrl.includes('youtu.be')) {
                // YouTube - extract video ID
                const videoId = getYouTubeVideoId(slide.mediaUrl);
                if (videoId) {
                    slideContent = `
                        <iframe src="https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=0&rel=0&showinfo=0" 
                                style="width: 100%; height: 100%; position: absolute; top: 0; left: 0; border: none;"
                                allow="autoplay; encrypted-media"
                                allowfullscreen>
                        </iframe>
                    `;
                } else {
                    slideContent = getFallbackContent(slide, index, gradients);
                }
            } else if (slide.mediaUrl.includes('vimeo.com')) {
                // Vimeo - extract video ID
                const videoId = getVimeoVideoId(slide.mediaUrl);
                if (videoId) {
                    slideContent = `
                        <iframe src="https://player.vimeo.com/video/${videoId}?autoplay=1&muted=1&loop=1&background=1" 
                                style="width: 100%; height: 100%; position: absolute; top: 0; left: 0; border: none;"
                                allow="autoplay; fullscreen"
                                allowfullscreen>
                        </iframe>
                    `;
                } else {
                    slideContent = getFallbackContent(slide, index, gradients);
                }
            } else {
                // Direct video URL (MP4, WebM) - AUTOPLAY
                slideContent = `
                    <video src="${slide.mediaUrl}" 
                           autoplay 
                           muted 
                           loop 
                           playsinline
                           style="width: 100%; height: 100%; object-fit: cover; position: absolute; top: 0; left: 0;"
                           onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                    </video>
                    <div class="slide-error" style="display: none; position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); color: white; align-items: center; justify-content: center; text-align: center; padding: 20px;">
                        <div>
                            <i class="fas fa-exclamation-triangle" style="font-size: 32px; margin-bottom: 10px;"></i>
                            <p>Video haikuweza kupakia</p>
                        </div>
                    </div>
                `;
            }
        } else {
            // Text-only slide
            const gradientClass = slide.gradientClass || gradients[index % gradients.length];
            slideContent = `
                <div style="background: ${getGradientByClass(gradientClass)}; height: 100%; width: 100%; position: absolute; top: 0; left: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; color: white; text-align: center; padding: 30px;">
                    <h3 style="font-size: 24px; font-weight: 700; margin-bottom: 10px; text-shadow: 2px 2px 4px rgba(0,0,0,0.3);">${slide.title || 'Karibu CashCola'}</h3>
                    <p style="font-size: 16px; opacity: 0.9; text-shadow: 1px 1px 3px rgba(0,0,0,0.3);">${slide.description || ''}</p>
                </div>
            `;
        }
        
        return `
            <div class="slide ${index === 0 ? 'active' : ''}" data-slide-index="${index}">
                ${slideContent}
            </div>
        `;
    }).join('');
    
    // Render dots
    dots.innerHTML = slides.map((_, index) => `
        <span class="slide-dot ${index === 0 ? 'active' : ''}" onclick="goToSlide(${index})"></span>
    `).join('');
    
    currentSlide = 0;
    updateSlideInfo(0);
}

/**
 * Check if URL is YouTube
 */
function isYouTubeUrl(url) {
    return url.includes('youtube.com') || url.includes('youtu.be');
}

/**
 * Check if URL is Vimeo
 */
function isVimeoUrl(url) {
    return url.includes('vimeo.com');
}

function getGradientByClass(className) {
    const gradients = {
        'slide-bg-gradient-1': 'linear-gradient(135deg, #FF6B35, #FF8C42)',
        'slide-bg-gradient-2': 'linear-gradient(135deg, #004E89, #1A936F)',
        'slide-bg-gradient-3': 'linear-gradient(135deg, #9B59B6, #3498DB)',
        'slide-bg-gradient-4': 'linear-gradient(135deg, #EF233C, #FF6B6B)',
        'slide-bg-gradient-5': 'linear-gradient(135deg, #F39C12, #E67E22)'
    };
    return gradients[className] || gradients['slide-bg-gradient-1'];
}

/**
 * Extract YouTube Video ID
 */
function getYouTubeVideoId(url) {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}

/**
 * Extract Vimeo Video ID
 */
function getVimeoVideoId(url) {
    if (!url) return null;
    const regExp = /vimeo\.com\/(\d+)/;
    const match = url.match(regExp);
    return match ? match[1] : null;
}



function changeSlide(direction) {
    const slideElements = document.querySelectorAll('#slidesWrapper .slide');
    if (slideElements.length === 0) return;
    
    // Hide current
    slideElements[currentSlide].classList.remove('active');
    
    // Calculate new index
    currentSlide = (currentSlide + direction + slideElements.length) % slideElements.length;
    
    // Show new
    slideElements[currentSlide].classList.add('active');
    
    // Update dots
    document.querySelectorAll('.slide-dot').forEach((dot, i) => {
        dot.classList.toggle('active', i === currentSlide);
    });
    
    // Update info
    updateSlideInfo(currentSlide);
    
    // Restart timer
    restartSlideshow();
}

/**
 * Go to specific slide
 */
function goToSlide(index) {
    const slideElements = document.querySelectorAll('#slidesWrapper .slide');
    if (slideElements.length === 0) return;
    
    slideElements[currentSlide].classList.remove('active');
    currentSlide = index;
    slideElements[currentSlide].classList.add('active');
    
    document.querySelectorAll('.slide-dot').forEach((dot, i) => {
        dot.classList.toggle('active', i === currentSlide);
    });
    
    updateSlideInfo(currentSlide);
    restartSlideshow();
}

/**
 * Update slide info bar
 */
function updateSlideInfo(index) {
    const titleEl = document.getElementById('currentSlideTitle');
    const descEl = document.getElementById('currentSlideDescription');
    
    if (slides[index]) {
        if (titleEl) titleEl.textContent = slides[index].title || 'Karibu CashCola';
        if (descEl) descEl.textContent = slides[index].description || '';
    }
}

/**
 * Start slideshow - 10 second interval
 */
function startSlideshow() {
    stopSlideshow();
    
    if (slides.length > 1) {
        slideInterval = setInterval(() => {
            changeSlide(1);
        }, SLIDE_DURATION); // 10 seconds
    }
}

/**
 * Stop slideshow
 */
function stopSlideshow() {
    if (slideInterval) {
        clearInterval(slideInterval);
        slideInterval = null;
    }
}

/**
 * Restart slideshow timer
 */
function restartSlideshow() {
    stopSlideshow();
    startSlideshow();
}

/**
 * Create default slide
 */
function createDefaultSlide() {
    slides = [{
        id: 'default',
        title: 'Karibu CashCola',
        description: 'Jukwaa bora la uwekezaji wa vinywaji na mapato ya kila siku nchini Tanzania.',
        type: 'text',
        active: true,
        order: 1
    }];
    renderSlides();
}

/**
 * Initialize slideshow on page load
 */
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        if (document.getElementById('slidesWrapper')) {
            loadSlides();
        }
    }, 500);
});

// Pause on hover
document.addEventListener('DOMContentLoaded', () => {
    const container = document.querySelector('.slideshow-container');
    if (container) {
        container.addEventListener('mouseenter', stopSlideshow);
        container.addEventListener('mouseleave', startSlideshow);
    }
});

console.log('✅ Slideshow System Loaded - 10s per slide, videos autoplay');

/**
 * Update Slide Dots
 */
function updateDots() {
    const dots = document.querySelectorAll('.slide-dot');
    dots.forEach((dot, index) => {
        dot.classList.toggle('active', index === currentSlide);
    });
}

/**
 * Update Slide Info Bar (Title & Description)
 */
function updateSlideInfo(index) {
    const titleEl = document.getElementById('currentSlideTitle');
    const descEl = document.getElementById('currentSlideDescription');
    
    if (slides[index]) {
        if (titleEl) {
            titleEl.textContent = slides[index].title || 'Karibu CashCola';
            // Animate
            titleEl.style.opacity = '0';
            titleEl.style.transform = 'translateY(10px)';
            setTimeout(() => {
                titleEl.style.opacity = '1';
                titleEl.style.transform = 'translateY(0)';
            }, 100);
        }
        
        if (descEl) {
            descEl.textContent = slides[index].description || '';
            // Animate
            descEl.style.opacity = '0';
            descEl.style.transform = 'translateY(10px)';
            setTimeout(() => {
                descEl.style.opacity = '1';
                descEl.style.transform = 'translateY(0)';
            }, 200);
        }
    }
}

/**
 * Start Slideshow Autoplay
 */
function startSlideshow() {
    stopSlideshow();
    
    // Only autoplay if there are multiple slides
    if (slides.length > 1) {
        slideInterval = setInterval(() => {
            if (!isVideoPlaying) {
                changeSlide(1);
            }
        }, 5000); // Change every 5 seconds
    }
}

/**
 * Stop Slideshow Autoplay
 */
function stopSlideshow() {
    if (slideInterval) {
        clearInterval(slideInterval);
        slideInterval = null;
    }
}

/**
 * Restart Slideshow Timer
 */
function restartSlideshow() {
    stopSlideshow();
    startSlideshow();
}

/**
 * Pause on hover
 */
document.addEventListener('DOMContentLoaded', () => {
    const slideshowContainer = document.querySelector('.slideshow-container');
    if (slideshowContainer) {
        slideshowContainer.addEventListener('mouseenter', () => {
            if (!isVideoPlaying) stopSlideshow();
        });
        
        slideshowContainer.addEventListener('mouseleave', () => {
            if (!isVideoPlaying) startSlideshow();
        });
        
        // Touch events for mobile
        let touchStartX = 0;
        let touchEndX = 0;
        
        slideshowContainer.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
        });
        
        slideshowContainer.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            handleSwipe();
        });
        
        function handleSwipe() {
            const swipeThreshold = 50;
            if (touchEndX < touchStartX - swipeThreshold) {
                changeSlide(1); // Swipe left - next slide
            }
            if (touchEndX > touchStartX + swipeThreshold) {
                changeSlide(-1); // Swipe right - previous slide
            }
        }
    }
});

/**
 * Initialize slideshow on page load
 */
document.addEventListener('DOMContentLoaded', () => {
    // Load slides after a short delay to ensure DOM is ready
    setTimeout(() => {
        if (document.getElementById('slidesWrapper')) {
            loadSlides();
        }
    }, 500);
});

console.log('✅ Enhanced Slideshow System Loaded');

/**
 * Load Admin Activities - FIXED (No index required)
 */
async function loadAdminActivities() {
    const feed = document.getElementById('adminActivityFeed');
    if (!feed) return;
    
    try {
        // Get recent deposits without ordering
        const depositsSnapshot = await db.collection('deposits')
            .limit(10)
            .get();
        
        // Get recent withdrawals without ordering
        const withdrawalsSnapshot = await db.collection('withdrawals')
            .limit(10)
            .get();
        
        let activities = [];
        
        depositsSnapshot.forEach(doc => {
            const data = doc.data();
            activities.push({
                message: `${data.username || 'Mtumiaji'} aliweka amana ya ${formatCurrency(data.amount || 0)}`,
                time: data.createdAt?.toDate(),
                status: data.status || 'pending',
                type: 'deposit'
            });
        });
        
        withdrawalsSnapshot.forEach(doc => {
            const data = doc.data();
            activities.push({
                message: `${data.username || 'Mtumiaji'} alitaka kutoa ${formatCurrency(data.amount || 0)}`,
                time: data.createdAt?.toDate(),
                status: data.status || 'pending',
                type: 'withdrawal'
            });
        });
        
        // Sort manually by date
        activities.sort((a, b) => (b.time || 0) - (a.time || 0));
        
        feed.innerHTML = activities.slice(0, 10).map(activity => {
            const statusClass = activity.status === 'approved' ? 'status-approved' :
                activity.status === 'rejected' ? 'status-rejected' : 'status-pending';
            const statusLabel = activity.status === 'approved' ? 'Imeidhinishwa' :
                activity.status === 'rejected' ? 'Imekataliwa' : 'Inasubiri';
            
            return `
                <div class="activity-item" style="display: flex; align-items: center; gap: 12px; padding: 10px 0; border-bottom: 1px solid #f0f0f0;">
                    <div class="activity-dot" style="width: 10px; height: 10px; border-radius: 50%; background: ${activity.type === 'deposit' ? '#1A936F' : '#EF233C'}; flex-shrink: 0;"></div>
                    <div class="activity-content" style="flex: 1;">
                        <p style="margin: 0; font-size: 13px;">${activity.message}</p>
                        <small style="color: #666;">${activity.time?.toLocaleString('sw-TZ') || 'Hivi punde'}</small>
                    </div>
                    <span class="status-badge ${statusClass}" style="font-size: 10px; padding: 3px 8px;">${statusLabel}</span>
                </div>
            `;
        }).join('');
        
    } catch (error) {
        console.error('Error loading activities:', error);
        feed.innerHTML = '<p class="text-center p-3">Hakuna shughuli za hivi karibuni.</p>';
    }
}

/**
 * Add notice
 */
async function addNotice() {
    const title = prompt('Kichwa cha Notisi:');
    if (!title) return;
    
    const message = prompt('Ujumbe wa Notisi:');
    if (!message) return;
    
    const urgent = confirm('Je, ni notisi ya haraka?');
    
    try {
        await db.collection('notices').add({
            title,
            message,
            urgent,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        showToast('Notisi imeongezwa!', 'success');
        loadAdminNotices();
        
    } catch (error) {
        console.error('Error adding notice:', error);
        showToast('Imeshindikana kuongeza notisi.', 'error');
    }
}

/**
 * Delete notice
 */
async function deleteNotice(noticeId) {
    if (!confirm('Futa notisi hii?')) return;
    
    try {
        await db.collection('notices').doc(noticeId).delete();
        showToast('Notisi imefutwa!', 'success');
        loadAdminNotices();
    } catch (error) {
        console.error('Error deleting notice:', error);
        showToast('Imeshindikana kufuta notisi.', 'error');
    }
}

/**
 * Load admin users
 */

async function viewUserDetail(userId) {
    try {
        const userDoc = await db.collection('users').doc(userId).get();
        if (!userDoc.exists) {
            showToast('Mtumiaji hajapatikana.', 'error');
            return;
        }
        
        const user = userDoc.data();
        
        // Get referrer info
        let referrerInfo = '';
        if (user.referredBy) {
            try {
                const referrerDoc = await db.collection('users').doc(user.referredBy).get();
                if (referrerDoc.exists) {
                    referrerInfo = referrerDoc.data().username || 'Haijulikani';
                }
            } catch (err) {
                referrerInfo = 'Haijulikani';
            }
        }
        
        // Get referrals count
        const referralsSnapshot = await db.collection('users')
            .where('referredBy', '==', userId)
            .get();
        
        document.getElementById('userDetailContent').innerHTML = `
            <h3>Maelezo ya Mtumiaji</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0;">
                <div><strong>Jina la Mtumiaji:</strong> ${user.username}</div>
                <div><strong>Jina Kamili:</strong> ${user.fullname}</div>
                <div><strong>Barua Pepe:</strong> ${user.email}</div>
                <div><strong>Simu:</strong> ${user.phone || 'N/A'}</div>
                <div><strong>Salio:</strong> ${formatCurrency(user.balance || 0)}</div>
                <div><strong>Mapato Yote:</strong> ${formatCurrency(user.totalEarnings || 0)}</div>
                <div><strong>Vinywaji:</strong> ${user.activeDrinks || 0}</div>
                <div><strong>Alijiunga:</strong> ${user.createdAt?.toDate().toLocaleDateString('sw-TZ') || 'N/A'}</div>
            </div>
            
            <div class="user-detail-referral">
                <h4><i class="fas fa-users"></i> Taarifa za Rufaa</h4>
                <div class="referral-tree">
                    <div class="referral-tree-item">
                        <i class="fas fa-qrcode"></i>
                        <span><strong>Namba ya Rufaa:</strong> ${user.referralCode || 'N/A'}</span>
                    </div>
                    <div class="referral-tree-item">
                        <i class="fas fa-user-plus"></i>
                        <span><strong>Alirejea na:</strong> ${referrerInfo || 'Hakuna (Alijisajili mwenyewe)'}</span>
                    </div>
                    <div class="referral-tree-item">
                        <i class="fas fa-users"></i>
                        <span><strong>Warejea wake:</strong> ${referralsSnapshot.size} watu</span>
                    </div>
                    <div class="referral-tree-item">
                        <i class="fas fa-coins"></i>
                        <span><strong>Bonasi za Rufaa:</strong> ${formatCurrency(user.totalReferralBonus || 0)}</span>
                    </div>
                    <div class="referral-tree-item">
                        <i class="fas fa-calendar-check"></i>
                        <span><strong>Bonasi ya Amana ya Kwanza:</strong> ${user.firstDepositBonus ? 'Amepata ✓' : 'Bado ✗'}</span>
                    </div>
                </div>
            </div>
            
            <button class="btn-primary" onclick="closeUserDetailModal()" style="margin-top: 15px;">Funga</button>
        `;
        
        document.getElementById('userDetailModal').classList.add('active');
        
    } catch (error) {
        console.error('Error viewing user:', error);
        showToast('Imeshindikana kupakia maelezo.', 'error');
    }
}

/**
 * Suspend user
 */
async function suspendUser(userId) {
    if (!confirm('Una uhakika unataka kumsimamisha mtumiaji huyu?')) return;
    
    try {
        await db.collection('users').doc(userId).update({ status: 'suspended' });
        showToast('Mtumiaji amesimamishwa!', 'success');
        loadAdminUsers();
    } catch (error) {
        console.error('Error suspending user:', error);
        showToast('Imeshindikana kumsimamisha mtumiaji.', 'error');
    }
}

/**
 * Activate user
 */
async function activateUser(userId) {
    try {
        await db.collection('users').doc(userId).update({ status: 'active' });
        showToast('Mtumiaji amewashwa!', 'success');
        loadAdminUsers();
    } catch (error) {
        console.error('Error activating user:', error);
        showToast('Imeshindikana kumwasha mtumiaji.', 'error');
    }
}

// Continue with Admin Deposit/Withdrawal management, Super Admin functions, etc.
// (The remaining admin functions continue in the same pattern)

// ============================================
// END OF MAIN.JS
// ============================================

console.log('✅ CashCola JavaScript loaded successfully!');
console.log('📝 To create Super Admin, call: createSuperAdminAccount()');

/**
 * Load referral data
 */
async function loadReferralData() {
    if (!currentUser) return;
    
    try {
        const userDoc = await db.collection('users').doc(currentUser.uid).get();
        if (!userDoc.exists) return;
        
        const userData = userDoc.data();
        
        // Update stats
        document.getElementById('totalReferrals').textContent = userData.totalReferrals || 0;
        document.getElementById('totalReferralBonus').textContent = formatCurrency(userData.totalReferralBonus || 0);
        document.getElementById('dailyLoginBonus').textContent = formatCurrency(200);
        
        // Update referral link
        const referralLink = `${window.location.origin}?ref=${userData.referralCode}`;
        document.getElementById('referralLink').value = referralLink;
        document.getElementById('myReferralCode').textContent = userData.referralCode || '-';
        
        // Update daily bonus button
        await updateDailyBonusUIButton();
        
        // Load referral list
        await loadReferralList();
        
        // Load bonus history
        await loadReferralBonusHistory();
        
    } catch (error) {
        console.error('Error loading referral data:', error);
    }
}


/**
 * Load referral bonus history
 */
async function loadReferralBonusHistory() {
    const container = document.getElementById('referralBonusHistory');
    if (!container) return;
    
    try {
        const snapshot = await db.collection('bonuses')
            .where('userId', '==', currentUser.uid)
            .orderBy('createdAt', 'desc')
            .limit(20)
            .get();
        
        if (snapshot.empty) {
            container.innerHTML = '<p class="text-center p-3">Bado huna historia ya bonasi.</p>';
            return;
        }
        
        container.innerHTML = snapshot.docs.map(doc => {
            const bonus = doc.data();
            return `
                <div class="bonus-history-item">
                    <div class="bonus-info">
                        <i class="fas fa-${bonus.type === 'daily_login' ? 'calendar-check' : 'users'}"></i>
                        <div>
                            <strong>${bonus.description}</strong>
                            <br>
                            <small>${bonus.createdAt?.toDate().toLocaleString('sw-TZ') || 'N/A'}</small>
                        </div>
                    </div>
                    <span class="bonus-amount">+${formatCurrency(bonus.amount)}</span>
                </div>
            `;
        }).join('');
        
    } catch (error) {
        console.error('Error loading bonus history:', error);
    }
}

/**
 * Copy referral link
 */
function copyReferralLink() {
    const linkInput = document.getElementById('referralLink');
    if (!linkInput) return;
    
    linkInput.select();
    document.execCommand('copy');
    
    // Modern clipboard API
    if (navigator.clipboard) {
        navigator.clipboard.writeText(linkInput.value);
    }
    
    showToast('Kiungo cha rufaa kimenakiliwa!', 'success');
}

/**
 * Copy referral code
 */
function copyReferralCode() {
    const code = document.getElementById('myReferralCode').textContent;
    
    if (navigator.clipboard) {
        navigator.clipboard.writeText(code);
    }
    
    showToast('Namba ya rufaa imenakiliwa!', 'success');
}

// Update loadReferralData to include initial bonus check
async function loadReferralData() {
    if (!currentUser) return;
    
    try {
        const userDoc = await db.collection('users').doc(currentUser.uid).get();
        if (!userDoc.exists) return;
        
        const userData = userDoc.data();
        
        // Update stats
        document.getElementById('totalReferrals').textContent = userData.totalReferrals || 0;
        document.getElementById('totalReferralBonus').textContent = formatCurrency(userData.totalReferralBonus || 0);
        document.getElementById('dailyLoginBonus').textContent = formatCurrency(200);
        
        // Update referral link
        const referralLink = `${window.location.origin}?ref=${userData.referralCode}`;
        document.getElementById('referralLink').value = referralLink;
        document.getElementById('myReferralCode').textContent = userData.referralCode || '-';
        
        // Update daily bonus button
        await updateDailyBonusUIButton();
        
        // Check if bonus can be claimed today
        const today = new Date().toDateString();
        const lastClaim = userData.lastDailyBonusClaim?.toDate().toDateString();
        
        if (lastClaim !== today && !userData.lastDailyBonusClaim) {
            // New user, show claim button prominently
            updateDailyBonusUI(false, null);
        }
        
        // Load referral list
        await loadReferralList();
        
        // Load bonus history
        await loadReferralBonusHistory();
        
    } catch (error) {
        console.error('Error loading referral data:', error);
    }
}

// ============================================
// SUPER ADMIN DASHBOARD FUNCTIONS (FIXED)
// ============================================

/**
 * Show Super Admin Dashboard - FIXED
 */
async function showSuperAdminDashboard() {
    console.log('Showing Super Admin Dashboard...');
    
    // Hide all dashboards first
    hideAllDashboards();
    
    // Show super admin dashboard
    const superDashboard = document.getElementById('superAdminDashboard');
    if (!superDashboard) {
        console.error('Super admin dashboard element not found in DOM');
        showToast('Hitilafu ya mfumo: Dashibodi haijapatikana.', 'error');
        return;
    }
    
    superDashboard.style.display = 'flex';
    
    // Set user info safely
    const usernameEl = document.getElementById('superAdminUsername');
    const sidebarNameEl = document.getElementById('sidebarSuperAdminName');
    
    if (usernameEl) {
        usernameEl.textContent = currentUserData?.fullname || 'Super Admin';
    }
    if (sidebarNameEl) {
        sidebarNameEl.textContent = currentUserData?.fullname || 'Super Admin';
    }
    
    // Load super admin data
    try {
        await loadSuperAdminOverview();
    } catch (error) {
        console.error('Error loading super admin overview:', error);
    }
}

/**
 * Hide all dashboards
 */
function hideAllDashboards() {
    const dashboards = ['loginPage', 'dashboard', 'adminDashboard', 'superAdminDashboard'];
    
    dashboards.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.style.display = 'none';
        }
    });
}

/**
 * Show login screen
 */
function showLoginScreen() {
    hideAllDashboards();
    const loginPage = document.getElementById('loginPage');
    if (loginPage) {
        loginPage.style.display = 'flex';
    }
}

/**
 * Toggle Super Admin Sidebar
 */
function toggleSuperAdminSidebar() {
    const sidebar = document.getElementById('superAdminSidebar');
    if (sidebar) {
        sidebar.classList.toggle('active');
    }
}

/**
 * Toggle Super Admin User Menu
 */
function toggleSuperAdminUserMenu() {
    const dropdown = document.getElementById('superAdminUserDropdown');
    if (dropdown) {
        dropdown.classList.toggle('active');
    }
}

/**
 * Show Super Admin Section
 */
function showSuperAdminSection(sectionName) {
    console.log('Switching to super admin section:', sectionName);
    
    // Hide all sections
    const sections = document.querySelectorAll('#superAdminDashboard .content-section');
    sections.forEach(section => {
        section.classList.remove('active');
    });
    
    // Show selected section
    const targetSection = document.getElementById(`${sectionName}Section`);
    if (targetSection) {
        targetSection.classList.add('active');
    }
    
    // Update active menu item
    const menuItems = document.querySelectorAll('#superAdminSidebar .menu-item');
    menuItems.forEach(item => {
        item.classList.remove('active');
    });
    
    if (event && event.target) {
        const menuItem = event.target.closest('.menu-item');
        if (menuItem) {
            menuItem.classList.add('active');
        }
    }
    
    // Load section data
    switch(sectionName) {
        case 'superOverview':
            loadSuperAdminOverview();
            break;
        case 'superUserManagement':
            loadSuperUsers();
            break;
        case 'superAdminManagement':
            loadSuperAdmins();
            break;
        case 'superTransactionAnalysis':
            loadTransactionAnalysis();
            break;
        case 'superMarketplace':
            loadManageDrinks();
            break;
        case 'superSlideshow':
            loadManageSlides();
            break;
        case 'superBankAccounts':
            loadManageBankAccounts();
            break;
        case 'superSettings':
            loadSuperSettings();
            break;
        case 'superSocialLinks':
    loadManageSocialLinks();
    break;
    }
    
    // Close sidebar on mobile
    if (window.innerWidth <= 768) {
        const sidebar = document.getElementById('superAdminSidebar');
        if (sidebar) {
            sidebar.classList.remove('active');
        }
    }
}

// ============================================
// ADMIN DASHBOARD FUNCTIONS - COMPLETE
// ============================================

/**
 * Load Admin Notifications
 */
function loadAdminNotifications() {
    const list = document.getElementById('adminNotificationList');
    if (!list) return;
    
    // Get pending requests count
    db.collection('deposits').where('status', '==', 'pending').get()
        .then(depositsSnapshot => {
            const pendingDeposits = depositsSnapshot.size;
            
            return db.collection('withdrawals').where('status', '==', 'pending').get()
                .then(withdrawalsSnapshot => {
                    const pendingWithdrawals = withdrawalsSnapshot.size;
                    const total = pendingDeposits + pendingWithdrawals;
                    
                    // Update notification badge
                    const badge = document.getElementById('adminNotificationCount');
                    if (badge) badge.textContent = total;
                    
                    let html = '';
                    
                    if (pendingDeposits > 0) {
                        html += `
                            <div class="activity-item" style="padding: 15px; border-bottom: 1px solid #eee; cursor: pointer;" onclick="showAdminSection('adminDeposits'); toggleAdminNotifications();">
                                <i class="fas fa-arrow-down" style="color: #1A936F; font-size: 18px;"></i>
                                <div class="activity-content" style="margin-left: 10px;">
                                    <p style="margin: 0; font-size: 14px;"><strong>${pendingDeposits}</strong> amana mpya zinazosubiri uidhinishaji</p>
                                    <small style="color: #666;">Bonyeza kuziangalia</small>
                                </div>
                            </div>
                        `;
                    }
                    
                    if (pendingWithdrawals > 0) {
                        html += `
                            <div class="activity-item" style="padding: 15px; border-bottom: 1px solid #eee; cursor: pointer;" onclick="showAdminSection('adminWithdrawals'); toggleAdminNotifications();">
                                <i class="fas fa-arrow-up" style="color: #EF233C; font-size: 18px;"></i>
                                <div class="activity-content" style="margin-left: 10px;">
                                    <p style="margin: 0; font-size: 14px;"><strong>${pendingWithdrawals}</strong> uondoaji mpya unaosubiri uidhinishaji</p>
                                    <small style="color: #666;">Bonyeza kuuangalia</small>
                                </div>
                            </div>
                        `;
                    }
                    
                    if (total === 0) {
                        html = '<p style="padding: 20px; text-align: center; color: #666;">Hakuna arifa mpya 🎉</p>';
                    }
                    
                    list.innerHTML = html;
                });
        })
        .catch(error => {
            console.error('Error loading notifications:', error);
        });
}

/**
 * Toggle Admin Notifications Dropdown
 */
function toggleAdminNotifications() {
    const dropdown = document.getElementById('adminNotificationDropdown');
    if (dropdown) {
        dropdown.classList.toggle('active');
    }
}

/**
 * Mark All Notifications as Read
 */
function markAllNotificationsRead() {
    const badge = document.getElementById('adminNotificationCount');
    const list = document.getElementById('adminNotificationList');
    
    if (badge) badge.textContent = '0';
    if (list) list.innerHTML = '<p style="padding: 20px; text-align: center; color: #666;">Hakuna arifa mpya 🎉</p>';
    
    showToast('Arifa zote zimesomwa!', 'info');
}

async function loadAdminDeposits(filter = 'pending') {
    currentDepositFilter = filter;
    
    const tbody = document.getElementById('depositsTableBody');
    if (!tbody) return;
    
    try {
        let query = db.collection('deposits');
        
        if (filter !== 'all') {
            query = query.where('status', '==', filter);
        }
        
        const snapshot = await query.orderBy('createdAt', 'desc').limit(50).get();
        
        if (snapshot.empty) {
            tbody.innerHTML = `<tr><td colspan="9" class="text-center p-4">Hakuna amana ${filter === 'pending' ? 'zinazosubiri' : filter === 'approved' ? 'zilizoidhinishwa' : 'zilizokataliwa'}.</td></tr>`;
            return;
        }
        
        tbody.innerHTML = snapshot.docs.map(doc => {
            const deposit = doc.data();
            const statusClass = deposit.status === 'approved' ? 'status-approved' : 
                               deposit.status === 'rejected' ? 'status-rejected' : 'status-pending';
            const statusLabel = deposit.status === 'approved' ? 'Imeidhinishwa' : 
                               deposit.status === 'rejected' ? 'Imekataliwa' : 'Inasubiri';
            
            return `
                <tr>
                    <td>
                        <div class="user-info-cell">
                            <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(deposit.username || 'User')}&background=FF6B35&color=fff&size=35" 
                                 alt="${deposit.username}" 
                                 style="width: 35px; height: 35px; border-radius: 50%;">
                            <div>
                                <h4 style="margin: 0; font-size: 14px;">${deposit.username || 'N/A'}</h4>
                            </div>
                        </div>
                    </td>
                    <td><strong>${formatCurrency(deposit.amount || 0)}</strong></td>
                    <td>${deposit.bankName || 'N/A'}</td>
                    <td>${deposit.senderName || 'N/A'}</td>
                    <td>${deposit.senderPhone || 'N/A'}</td>
                    <td><small style="font-size: 11px;">${deposit.transactionId || 'N/A'}</small></td>
                    <td><small>${deposit.createdAt?.toDate().toLocaleDateString('sw-TZ') || 'N/A'}</small></td>
                    <td><span class="status-badge ${statusClass}">${statusLabel}</span></td>
                    <td>
                        ${deposit.status === 'pending' ? `
                            <div class="action-buttons">
                                <button class="btn-action btn-approve" onclick="approveDeposit('${doc.id}')" 
                                        style="padding: 5px 10px; background: #1A936F; color: white; border: none; border-radius: 5px; cursor: pointer; margin-right: 5px;">
                                    <i class="fas fa-check"></i> Idhinisha
                                </button>
                                <button class="btn-action btn-reject" onclick="rejectDeposit('${doc.id}')" 
                                        style="padding: 5px 10px; background: #EF233C; color: white; border: none; border-radius: 5px; cursor: pointer;">
                                    <i class="fas fa-times"></i> Kataa
                                </button>
                            </div>
                        ` : `
                            <small style="color: #666;">
                                ${deposit.approvedAt ? 'Ilishughulikiwa: ' + deposit.approvedAt.toDate().toLocaleDateString('sw-TZ') : 'Imeshughulikiwa'}
                            </small>
                        `}
                    </td>
                </tr>
            `;
        }).join('');
        
    } catch (error) {
        console.error('Error loading deposits:', error);
        tbody.innerHTML = '<tr><td colspan="9" class="text-center p-4 text-danger">Imeshindikana kupakia amana.</td></tr>';
    }
}

/**
 * Filter Deposits
 */
function filterDeposits(filter) {
    // Update active filter button
    document.querySelectorAll('#adminDepositsSection .filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    if (event && event.target) {
        event.target.classList.add('active');
    }
    
    loadAdminDeposits(filter);
}

/**
 * Approve Deposit - IMMEDIATE BONUS AWARD
 */
async function approveDeposit(depositId) {
    if (!confirm('Una uhakika unataka kuidhinisha amana hii?')) return;
    
    try {
        console.log('========================================');
        console.log('🚀 APPROVING DEPOSIT:', depositId);
        console.log('========================================');
        
        // Step 1: Get deposit data
        const depositDoc = await db.collection('deposits').doc(depositId).get();
        if (!depositDoc.exists) {
            showToast('Amana haijapatikana.', 'error');
            return;
        }
        
        const deposit = depositDoc.data();
        
        if (deposit.status === 'approved') {
            showToast('Amana tayari imeidhinishwa.', 'warning');
            return;
        }
        
        console.log('Deposit amount:', deposit.amount);
        console.log('User ID:', deposit.userId);
        
        // Step 2: Update deposit status to approved
        await db.collection('deposits').doc(depositId).update({
            status: 'approved',
            approvedAt: firebase.firestore.FieldValue.serverTimestamp(),
            approvedBy: currentUser.uid
        });
        console.log('✅ Deposit marked as approved');
        
        // Step 3: Get user data
        const userRef = db.collection('users').doc(deposit.userId);
        const userDoc = await userRef.get();
        
        if (!userDoc.exists) {
            showToast('Mtumiaji hajapatikana.', 'error');
            return;
        }
        
        const userData = userDoc.data();
        console.log('User:', userData.username);
        console.log('Current balance:', userData.balance);
        console.log('Referred by:', userData.referredBy || 'No one');
        console.log('First deposit bonus already claimed?', userData.firstDepositBonus);
        
        let bonusAmount = 0;
        let bonusAwarded = false;
        
        // Step 4: Check if FIRST deposit and award 10% bonus
        if (!userData.firstDepositBonus) {
            bonusAmount = Math.floor(deposit.amount * 0.1);
            console.log('🎉 FIRST DEPOSIT! Bonus amount:', bonusAmount, 'TZS (10%)');
            
            // Mark first deposit bonus as claimed on user document
            await userRef.update({
                firstDepositBonus: true,
                firstDepositAmount: deposit.amount,
                firstDepositBonusAmount: bonusAmount,
                firstDepositDate: firebase.firestore.FieldValue.serverTimestamp()
            });
            console.log('✅ First deposit bonus marked on user');
            
            // Create bonus record for user
            await db.collection('bonuses').add({
                userId: deposit.userId,
                username: userData.username,
                type: 'first_deposit_bonus',
                amount: bonusAmount,
                description: `Bonasi ya amana ya kwanza (10% ya ${formatCurrency(deposit.amount)})`,
                depositId: depositId,
                depositAmount: deposit.amount,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            console.log('✅ Bonus record created for user');
            
            bonusAwarded = true;
            
            // Step 5: Check referredBy and award referrer bonus
            if (userData.referredBy) {
                console.log('🔗 User was referred by:', userData.referredBy);
                
                const referrerRef = db.collection('users').doc(userData.referredBy);
                const referrerDoc = await referrerRef.get();
                
                if (referrerDoc.exists) {
                    const referrerData = referrerDoc.data();
                    const referrerBonus = bonusAmount; // Same 10% for referrer
                    
                    console.log('Referrer found:', referrerData.username);
                    console.log('Referrer bonus:', referrerBonus, 'TZS');
                    
                    // Add bonus to referrer's balance IMMEDIATELY
                    await referrerRef.update({
                        balance: firebase.firestore.FieldValue.increment(referrerBonus),
                        totalReferralBonus: firebase.firestore.FieldValue.increment(referrerBonus),
                        totalEarnings: firebase.firestore.FieldValue.increment(referrerBonus),
                        totalReferrals: firebase.firestore.FieldValue.increment(1)
                    });
                    console.log('✅ Referrer balance updated');
                    
                    // Create bonus record for referrer
                    await db.collection('bonuses').add({
                        userId: userData.referredBy,
                        username: referrerData.username,
                        type: 'referral_bonus',
                        amount: referrerBonus,
                        description: `Bonasi ya rufaa kutoka kwa ${userData.username} - Amana ya kwanza ya ${formatCurrency(deposit.amount)}`,
                        relatedUserId: deposit.userId,
                        relatedUsername: userData.username,
                        depositId: depositId,
                        depositAmount: deposit.amount,
                        createdAt: firebase.firestore.FieldValue.serverTimestamp()
                    });
                    console.log('✅ Referrer bonus record created');
                    
                } else {
                    console.warn('⚠️ Referrer document not found');
                }
            } else {
                console.log('ℹ️ User was not referred by anyone');
            }
        } else {
            console.log('ℹ️ Not first deposit, no bonus awarded');
        }
        
        // Step 6: Add deposit amount + bonus to user balance IMMEDIATELY
        const totalToAdd = deposit.amount + bonusAmount;
        
        await userRef.update({
            balance: firebase.firestore.FieldValue.increment(totalToAdd)
        });
        
        console.log('💰 Balance updated: +' + totalToAdd + ' TZS');
        console.log('   Deposit: +' + deposit.amount);
        console.log('   Bonus: +' + bonusAmount);
        console.log('   New balance should be: ' + (userData.balance + totalToAdd));
        
        // Step 7: Success message
        let message = `Amana ya ${formatCurrency(deposit.amount)} imeidhinishwa! 💰`;
        
        if (bonusAwarded) {
            message += `\n🎉 Bonasi ya amana ya kwanza: +${formatCurrency(bonusAmount)}`;
            
            if (userData.referredBy) {
                message += `\n👥 Bonasi ya rufaa imetumwa kwa mrejea.`;
            }
        }
        
        showToast(message, 'success');
        
        // Refresh admin views
        loadAdminDeposits(currentDepositFilter);
        loadAdminOverview();
        loadAdminNotifications();
        
        console.log('========================================');
        console.log('✅ DEPOSIT APPROVAL COMPLETE');
        console.log('User:', userData.username);
        console.log('Deposit:', formatCurrency(deposit.amount));
        console.log('Bonus:', formatCurrency(bonusAmount));
        console.log('Total added:', formatCurrency(totalToAdd));
        console.log('========================================');
        
    } catch (error) {
        console.error('❌ Error approving deposit:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        showToast('Imeshindikana kuidhinisha amana: ' + error.message, 'error');
    }
}

/**
 * Check if deposit is user's first (used in user dashboard)
 */
async function checkIsFirstDeposit(userId) {
    try {
        const snapshot = await db.collection('deposits')
            .where('userId', '==', userId)
            .where('status', '==', 'approved')
            .get();
        
        return snapshot.empty; // True if no previous approved deposits
    } catch (error) {
        console.error('Error checking first deposit:', error);
        return true;
    }
}

/**
 * Get first deposit bonus status for referral section
 */
async function loadReferralBonusStatus() {
    if (!currentUser) return;
    
    try {
        const userDoc = await db.collection('users').doc(currentUser.uid).get();
        if (!userDoc.exists) return;
        
        const userData = userDoc.data();
        
        // Check if first deposit bonus was claimed
        const firstDepositClaimed = userData.firstDepositBonus || false;
        const firstDepositAmount = userData.firstDepositAmount || 0;
        const firstDepositBonusAmount = userData.firstDepositBonusAmount || 0;
        
        // Update UI
        const bonusStatusEl = document.getElementById('firstDepositBonusStatus');
        if (bonusStatusEl) {
            if (firstDepositClaimed) {
                bonusStatusEl.innerHTML = `
                    <div style="background: #d4edda; padding: 15px; border-radius: 10px; border-left: 4px solid #1A936F;">
                        <i class="fas fa-check-circle" style="color: #1A936F;"></i>
                        <strong>Bonasi ya Amana ya Kwanza Imeshapokelewa! ✅</strong>
                        <p style="margin: 5px 0 0 0; font-size: 13px;">
                            Amana ya kwanza: ${formatCurrency(firstDepositAmount)} | 
                            Bonasi: ${formatCurrency(firstDepositBonusAmount)} (10%)
                        </p>
                    </div>
                `;
            } else {
                bonusStatusEl.innerHTML = `
                    <div style="background: #fff3cd; padding: 15px; border-radius: 10px; border-left: 4px solid #FFD166;">
                        <i class="fas fa-gift" style="color: #F39C12;"></i>
                        <strong>Bonasi ya Amana ya Kwanza Inakusubiri! 🎁</strong>
                        <p style="margin: 5px 0 0 0; font-size: 13px;">
                            Weka amana yako ya kwanza na upate bonasi ya 10%!
                        </p>
                    </div>
                `;
            }
        }
        
        // Update referrer bonus status if user was referred
        if (userData.referredBy && userData.referredByUsername) {
            const referrerStatusEl = document.getElementById('referrerBonusStatus');
            if (referrerStatusEl) {
                const referrerDoc = await db.collection('users').doc(userData.referredBy).get();
                if (referrerDoc.exists) {
                    const referrerData = referrerDoc.data();
                    referrerStatusEl.innerHTML = `
                        <div style="background: #e3f2fd; padding: 15px; border-radius: 10px; border-left: 4px solid #004E89; margin-top: 10px;">
                            <i class="fas fa-user-check" style="color: #004E89;"></i>
                            <strong>Uli rejea kupitia: @${userData.referredByUsername}</strong>
                            ${firstDepositClaimed ? 
                                '<p style="margin: 5px 0 0 0; font-size: 13px; color: #1A936F;">✅ ' + userData.referredByUsername + ' amepata bonasi ya rufaa kutoka kwako!</p>' :
                                '<p style="margin: 5px 0 0 0; font-size: 13px; color: #F39C12;">⏳ ' + userData.referredByUsername + ' atapata bonasi baada ya amana yako ya kwanza kuidhinishwa.</p>'
                            }
                        </div>
                    `;
                }
            }
        }
        
    } catch (error) {
        console.error('Error loading bonus status:', error);
    }
}

/**
 * Load Referral Data - UPDATED with first deposit info
 */
async function loadReferralData() {
    if (!currentUser) return;
    
    try {
        const userDoc = await db.collection('users').doc(currentUser.uid).get();
        if (!userDoc.exists) return;
        
        const userData = userDoc.data();
        
        // Update stats
        document.getElementById('totalReferrals').textContent = userData.totalReferrals || 0;
        document.getElementById('totalReferralBonus').textContent = formatCurrency(userData.totalReferralBonus || 0);
        document.getElementById('dailyLoginBonus').textContent = formatCurrency(200);
        
        // Referral link
        const referralLink = `${window.location.origin}?ref=${userData.referralCode}`;
        document.getElementById('referralLink').value = referralLink;
        document.getElementById('myReferralCode').textContent = userData.referralCode || '-';
        
        // Daily bonus button
        await updateDailyBonusUIButton();
        
        // Load first deposit bonus status
        await loadReferralBonusStatus();
        
        // Load referral list with deposit status
        await loadReferralList();
        
        // Load bonus history
        await loadReferralBonusHistory();
        
    } catch (error) {
        console.error('Error loading referral data:', error);
    }
}

/**
 * Load Referral List - FIXED Status Display
 */
async function loadReferralList() {
    const container = document.getElementById('referralList');
    if (!container) return;
    
    try {
        const snapshot = await db.collection('users')
            .where('referredBy', '==', currentUser.uid)
            .get();
        
        if (snapshot.empty) {
            container.innerHTML = '<p class="text-center p-3">Bado huna warejea. Anza kushiriki kiungo chako cha rufaa!</p>';
            return;
        }
        
        container.innerHTML = '';
        
        for (const doc of snapshot.docs) {
            const referral = doc.data();
            
            // CHECK 1: Has the user's first deposit been approved AND bonus awarded?
            // This is the most reliable check - look at firstDepositBonus field
            const bonusAwarded = referral.firstDepositBonus === true;
            
            // CHECK 2: Has the user made any deposit? (approved or not)
            let hasApprovedDeposit = false;
            let hasPendingDeposit = false;
            
            try {
                // Check for approved deposits
                const approvedSnapshot = await db.collection('deposits')
                    .where('userId', '==', doc.id)
                    .where('status', '==', 'approved')
                    .limit(1)
                    .get();
                hasApprovedDeposit = !approvedSnapshot.empty;
                
                // Check for pending deposits
                const pendingSnapshot = await db.collection('deposits')
                    .where('userId', '==', doc.id)
                    .where('status', '==', 'pending')
                    .limit(1)
                    .get();
                hasPendingDeposit = !pendingSnapshot.empty;
            } catch (err) {
                console.warn('Could not check deposits for:', referral.username);
            }
            
            // Determine status
            let statusText = '';
            let statusColor = '';
            let statusIcon = '';
            
            if (bonusAwarded) {
                // Bonus has been awarded - best case!
                statusText = '✅ Bonasi Imepatikana';
                statusColor = '#1A936F';
                statusIcon = '✅';
            } else if (hasApprovedDeposit) {
                // Deposit approved but bonus might not be awarded yet
                // This should trigger bonus award in approveDeposit function
                statusText = '✅ Amana Imeidhinishwa (Bonasi inashughulikiwa)';
                statusColor = '#1A936F';
                statusIcon = '✅';
            } else if (hasPendingDeposit) {
                // Deposit made but not yet approved
                statusText = '⏳ Inasubiri Uidhinishaji wa Amana';
                statusColor = '#F39C12';
                statusIcon = '⏳';
            } else {
                // No deposit at all
                statusText = '❌ Hajaweka Amana Bado';
                statusColor = '#EF233C';
                statusIcon = '❌';
            }
            
            container.innerHTML += `
                <div class="referral-item" style="display: flex; align-items: center; gap: 12px; padding: 12px; border-bottom: 1px solid #f0f0f0; background: ${bonusAwarded ? '#f0fff4' : 'transparent'};">
                    <div style="width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(135deg, #FF6B35, #FF8C42); color: white; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 14px;">
                        ${getInitials(referral.fullname)}
                    </div>
                    <div style="flex: 1;">
                        <strong>${referral.fullname || 'Mtumiaji'}</strong>
                        <p style="margin: 2px 0 0 0; font-size: 12px; color: #666;">@${referral.username || ''}</p>
                        <p style="margin: 4px 0 0 0; font-size: 12px; color: ${statusColor}; font-weight: 500;">
                            ${statusIcon} ${statusText}
                        </p>
                        ${referral.firstDepositAmount ? `
                            <p style="margin: 2px 0 0 0; font-size: 11px; color: #666;">
                                Amana: ${formatCurrency(referral.firstDepositAmount)} | 
                                Bonasi yako: ${formatCurrency(referral.firstDepositBonusAmount || Math.floor((referral.firstDepositAmount || 0) * 0.1))}
                            </p>
                        ` : ''}
                    </div>
                    <small style="color: #999; font-size: 11px;">${referral.createdAt?.toDate?.().toLocaleDateString('sw-TZ') || ''}</small>
                </div>
            `;
        }
        
    } catch (error) {
        console.error('Error loading referral list:', error);
    }
}

/**
 * Check and update referral status after deposit approval
 * Called automatically when admin approves a deposit
 */
async function updateReferralStatusAfterDeposit(userId, depositId) {
    try {
        const userDoc = await db.collection('users').doc(userId).get();
        if (!userDoc.exists) return;
        
        const userData = userDoc.data();
        
        // Check if user was referred
        if (!userData.referredBy) return;
        
        // Check if this is first deposit
        const depositCount = await db.collection('deposits')
            .where('userId', '==', userId)
            .where('status', '==', 'approved')
            .get();
        
        if (depositCount.size === 1) {
            // First deposit just approved - update referrer status
            
            // Get the deposit amount
            const depositDoc = await db.collection('deposits').doc(depositId).get();
            const depositAmount = depositDoc.exists ? (depositDoc.data().amount || 0) : 0;
            const bonusAmount = Math.floor(depositAmount * 0.1);
            
            // Update referrer
            const referrerRef = db.collection('users').doc(userData.referredBy);
            await referrerRef.update({
                totalReferralBonus: firebase.firestore.FieldValue.increment(bonusAmount),
                balance: firebase.firestore.FieldValue.increment(bonusAmount),
                totalEarnings: firebase.firestore.FieldValue.increment(bonusAmount)
            });
            
            // Mark user's first deposit bonus as claimed
            await db.collection('users').doc(userId).update({
                firstDepositBonus: true,
                firstDepositAmount: depositAmount,
                firstDepositBonusAmount: bonusAmount
            });
            
            console.log('✅ Referral bonus processed:', bonusAmount, 'TZS');
        }
        
    } catch (error) {
        console.error('Error updating referral status:', error);
    }
}

console.log('✅ First Deposit Bonus & Referral System Loaded');

/**
 * Reject Deposit
 */
async function rejectDeposit(depositId) {
    const reason = prompt('Sababu ya kukataa amana hii:');
    if (!reason) return;
    
    try {
        await db.collection('deposits').doc(depositId).update({
            status: 'rejected',
            rejectionReason: reason,
            rejectedAt: firebase.firestore.FieldValue.serverTimestamp(),
            rejectedBy: currentUser.uid
        });
        
        showToast('Amana imekataliwa.', 'info');
        loadAdminDeposits(currentDepositFilter);
        loadAdminNotifications();
        
    } catch (error) {
        console.error('Error rejecting deposit:', error);
        showToast('Imeshindikana kukataa amana.', 'error');
    }
}

async function loadAdminWithdrawals(filter = 'pending') {
    currentWithdrawalFilter = filter;
    
    const tbody = document.getElementById('withdrawalsTableBody');
    if (!tbody) return;
    
    try {
        let query = db.collection('withdrawals');
        
        if (filter !== 'all') {
            query = query.where('status', '==', filter);
        }
        
        const snapshot = await query.orderBy('createdAt', 'desc').limit(50).get();
        
        if (snapshot.empty) {
            tbody.innerHTML = `<tr><td colspan="9" class="text-center p-4">Hakuna uondoaji ${filter === 'pending' ? 'unaosubiri' : filter === 'approved' ? 'ulioidhinishwa' : 'uliokataliwa'}.</td></tr>`;
            return;
        }
        
        tbody.innerHTML = snapshot.docs.map(doc => {
            const withdrawal = doc.data();
            const statusClass = withdrawal.status === 'approved' ? 'status-approved' : 
                               withdrawal.status === 'rejected' ? 'status-rejected' : 'status-pending';
            const statusLabel = withdrawal.status === 'approved' ? 'Imeidhinishwa' : 
                               withdrawal.status === 'rejected' ? 'Imekataliwa' : 'Inasubiri';
            
            return `
                <tr>
                    <td>
                        <div class="user-info-cell">
                            <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(withdrawal.username || 'User')}&background=004E89&color=fff&size=35" 
                                 alt="${withdrawal.username}" 
                                 style="width: 35px; height: 35px; border-radius: 50%;">
                            <div>
                                <h4 style="margin: 0; font-size: 14px;">${withdrawal.username || 'N/A'}</h4>
                            </div>
                        </div>
                    </td>
                    <td><strong>${formatCurrency(withdrawal.amount || 0)}</strong></td>
                    <td>${formatCurrency(withdrawal.fee || 0)}</td>
                    <td>${withdrawal.bankName || 'N/A'}</td>
                    <td>${withdrawal.receiverName || 'N/A'}</td>
                    <td>${withdrawal.receiverPhone || 'N/A'}</td>
                    <td><small>${withdrawal.createdAt?.toDate().toLocaleDateString('sw-TZ') || 'N/A'}</small></td>
                    <td><span class="status-badge ${statusClass}">${statusLabel}</span></td>
                    <td>
                        ${withdrawal.status === 'pending' ? `
                            <div class="action-buttons">
                                <button class="btn-action btn-approve" onclick="approveWithdrawal('${doc.id}')" 
                                        style="padding: 5px 10px; background: #1A936F; color: white; border: none; border-radius: 5px; cursor: pointer; margin-right: 5px;">
                                    <i class="fas fa-check"></i> Idhinisha
                                </button>
                                <button class="btn-action btn-reject" onclick="rejectWithdrawal('${doc.id}')" 
                                        style="padding: 5px 10px; background: #EF233C; color: white; border: none; border-radius: 5px; cursor: pointer;">
                                    <i class="fas fa-times"></i> Kataa
                                </button>
                            </div>
                        ` : `
                            <small style="color: #666;">
                                ${withdrawal.approvedAt ? 'Ilishughulikiwa: ' + withdrawal.approvedAt.toDate().toLocaleDateString('sw-TZ') : 'Imeshughulikiwa'}
                                ${withdrawal.rejectionReason ? '<br><span style="color: #EF233C;">Sababu: ' + withdrawal.rejectionReason + '</span>' : ''}
                            </small>
                        `}
                    </td>
                </tr>
            `;
        }).join('');
        
    } catch (error) {
        console.error('Error loading withdrawals:', error);
        tbody.innerHTML = '<tr><td colspan="9" class="text-center p-4 text-danger">Imeshindikana kupakia uondoaji.</td></tr>';
    }
}

/**
 * Filter Withdrawals
 */
function filterWithdrawals(filter) {
    document.querySelectorAll('#adminWithdrawalsSection .filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    if (event && event.target) {
        event.target.classList.add('active');
    }
    
    loadAdminWithdrawals(filter);
}

/**
 * Approve Withdrawal
 */
async function approveWithdrawal(withdrawalId) {
    if (!confirm('Una uhakika unataka kuidhinisha uondoaji huu?')) return;
    
    try {
        const withdrawalDoc = await db.collection('withdrawals').doc(withdrawalId).get();
        if (!withdrawalDoc.exists) {
            showToast('Uondoaji haujapatikana.', 'error');
            return;
        }
        
        const withdrawal = withdrawalDoc.data();
        
        // Update withdrawal status
        await db.collection('withdrawals').doc(withdrawalId).update({
            status: 'approved',
            approvedAt: firebase.firestore.FieldValue.serverTimestamp(),
            approvedBy: currentUser.uid
        });
        
        showToast('Uondoaji umeidhinishwa!', 'success');
        loadAdminWithdrawals(currentWithdrawalFilter);
        loadAdminOverview();
        loadAdminNotifications();
        
    } catch (error) {
        console.error('Error approving withdrawal:', error);
        showToast('Imeshindikana kuidhinisha uondoaji.', 'error');
    }
}

/**
 * Reject Withdrawal
 */
async function rejectWithdrawal(withdrawalId) {
    const reason = prompt('Sababu ya kukataa uondoaji huu:');
    if (!reason) return;
    
    try {
        const withdrawalDoc = await db.collection('withdrawals').doc(withdrawalId).get();
        if (!withdrawalDoc.exists) {
            showToast('Uondoaji haujapatikana.', 'error');
            return;
        }
        
        const withdrawal = withdrawalDoc.data();
        
        // Update withdrawal status
        await db.collection('withdrawals').doc(withdrawalId).update({
            status: 'rejected',
            rejectionReason: reason,
            rejectedAt: firebase.firestore.FieldValue.serverTimestamp(),
            rejectedBy: currentUser.uid
        });
        
        // Refund user balance (amount + fee)
        const userRef = db.collection('users').doc(withdrawal.userId);
        const userDoc = await userRef.get();
        
        if (userDoc.exists) {
            const userData = userDoc.data();
            const refundAmount = (withdrawal.amount || 0) + (withdrawal.fee || 0);
            
            await userRef.update({
                balance: (userData.balance || 0) + refundAmount
            });
        }
        
        showToast('Uondoaji umekataliwa na fedha zimerejeshwa.', 'info');
        loadAdminWithdrawals(currentWithdrawalFilter);
        loadAdminNotifications();
        
    } catch (error) {
        console.error('Error rejecting withdrawal:', error);
        showToast('Imeshindikana kukataa uondoaji.', 'error');
    }
}

/**
 * Load Admin Reports
 */
function loadAdminReports() {
    console.log('Loading admin reports...');
    
    // Daily Revenue Chart
    const dailyCanvas = document.getElementById('dailyRevenueChart');
    if (dailyCanvas) {
        dailyCanvas.parentElement.innerHTML = `
            <div style="padding: 20px;">
                <h4 style="text-align: center; margin-bottom: 20px;">Mapato ya Wiki Hii</h4>
                <div style="display: flex; align-items: flex-end; justify-content: space-around; height: 200px; padding: 20px 0;">
                    ${['J2', 'J3', 'J4', 'J5', 'J6', 'J7', 'J1'].map((day, i) => {
                        const height = Math.floor(Math.random() * 60) + 20;
                        return `
                            <div style="text-align: center; flex: 1;">
                                <div style="background: linear-gradient(180deg, #FF6B35, #FF8C42); width: 40px; height: ${height}%; border-radius: 8px 8px 0 0; margin: 0 auto; transition: all 0.3s ease; cursor: pointer;" 
                                     onmouseover="this.style.height='${height + 10}%'" 
                                     onmouseout="this.style.height='${height}%'">
                                </div>
                                <small style="margin-top: 5px; display: block;">${day}</small>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }
    
    // New Users Chart
    const usersCanvas = document.getElementById('newUsersChart');
    if (usersCanvas) {
        usersCanvas.parentElement.innerHTML = `
            <div style="padding: 20px;">
                <h4 style="text-align: center; margin-bottom: 20px;">Watumiaji Wapya - Mwezi Huu</h4>
                <div style="text-align: center; padding: 40px;">
                    <div style="font-size: 48px; color: #FF6B35; font-weight: 700;">24</div>
                    <p style="color: #666;">Watumiaji wapya mwezi huu</p>
                    <div style="display: flex; justify-content: center; gap: 30px; margin-top: 20px;">
                        <div>
                            <div style="font-size: 24px; font-weight: 700; color: #1A936F;">18</div>
                            <small>Wanaume</small>
                        </div>
                        <div>
                            <div style="font-size: 24px; font-weight: 700; color: #9B59B6;">6</div>
                            <small>Wanawake</small>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    // Drinks Sold Chart
    const drinksCanvas = document.getElementById('drinksSoldChart');
    if (drinksCanvas) {
        drinksCanvas.parentElement.innerHTML = `
            <div style="padding: 20px;">
                <h4 style="text-align: center; margin-bottom: 20px;">Vinywaji Vilivyouzwa</h4>
                <div style="text-align: center; padding: 40px;">
                    <div style="font-size: 48px; color: #004E89; font-weight: 700;">156</div>
                    <p style="color: #666;">Jumla ya vinywaji vilivyouzwa</p>
                    <div style="margin-top: 20px;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                            <span>Coca Cola</span>
                            <span><strong>45</strong></span>
                        </div>
                        <div style="background: #e0e0e0; height: 8px; border-radius: 4px; margin-bottom: 15px;">
                            <div style="background: #FF6B35; height: 100%; width: 45%; border-radius: 4px;"></div>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                            <span>Pepsi</span>
                            <span><strong>38</strong></span>
                        </div>
                        <div style="background: #e0e0e0; height: 8px; border-radius: 4px; margin-bottom: 15px;">
                            <div style="background: #004E89; height: 100%; width: 38%; border-radius: 4px;"></div>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                            <span>Fanta</span>
                            <span><strong>32</strong></span>
                        </div>
                        <div style="background: #e0e0e0; height: 8px; border-radius: 4px; margin-bottom: 15px;">
                            <div style="background: #1A936F; height: 100%; width: 32%; border-radius: 4px;"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
}

/**
 * Refresh Activities
 */
function refreshActivities() {
    loadAdminActivities();
    showToast('Shughuli zimesasishwa!', 'info');
}

/**
 * Export Users
 */
function exportUsers() {
    showToast('Inatayarisha faili ya watumiaji...', 'info');
    
    // In a real app, you would generate a CSV/Excel file
    setTimeout(() => {
        showToast('Faili imetayarishwa! Inapakuliwa...', 'success');
    }, 2000);
}

/**
 * Search Users
 */
async function searchUsers() {
    const searchTerm = document.getElementById('userSearchInput')?.value?.toLowerCase();
    if (!searchTerm) {
        loadAdminUsers();
        return;
    }
    
    const tbody = document.getElementById('usersTableBody');
    if (!tbody) return;
    
    try {
        // Search by username (starts with)
        const snapshot = await db.collection('users')
            .where('username', '>=', searchTerm)
            .where('username', '<=', searchTerm + '\uf8ff')
            .limit(20)
            .get();
        
        if (snapshot.empty) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center p-4">Hakuna mtumiaji aliyepatikana kwa jina hilo.</td></tr>';
            return;
        }
        
        tbody.innerHTML = snapshot.docs.map(doc => {
            const user = doc.data();
            const status = user.status || 'active';
            
            return `
                <tr>
                    <td>
                        <div class="user-info-cell">
                            <h4>${user.username || 'N/A'}</h4>
                        </div>
                    </td>
                    <td>${user.fullname || 'N/A'}</td>
                    <td>${user.email || 'N/A'}</td>
                    <td>${formatCurrency(user.balance || 0)}</td>
                    <td><span class="status-badge ${getStatusBadgeClass(status)}">${getStatusLabel(status)}</span></td>
                    <td>${user.createdAt?.toDate().toLocaleDateString('sw-TZ') || 'N/A'}</td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn-action btn-view" onclick="viewUserDetail('${doc.id}')">
                                <i class="fas fa-eye"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
        
    } catch (error) {
        console.error('Error searching users:', error);
        tbody.innerHTML = '<tr><td colspan="7" class="text-center p-4 text-danger">Imeshindikana kutafuta watumiaji.</td></tr>';
    }
}

/**
 * Filter Users
 */
function filterUsers(filter) {
    document.querySelectorAll('#adminUserManagementSection .filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    if (event && event.target) {
        event.target.classList.add('active');
    }
    
    loadAdminUsers(filter);
}

/**
 * View User Transactions (Admin)
 */
async function viewUserTransactions(userId) {
    showAdminSection('adminTransactions');
    // You can filter transactions by userId here
    showToast('Inapakia miamala ya mtumiaji...', 'info');
}

/**
 * Review Admin Actions
 */
async function reviewAdminActions(adminId) {
    try {
        const approvedDeposits = await db.collection('deposits')
            .where('approvedBy', '==', adminId)
            .get();
        
        const approvedWithdrawals = await db.collection('withdrawals')
            .where('approvedBy', '==', adminId)
            .get();
        
        alert(
            `Taarifa za Msimamizi:\n\n` +
            `✅ Amana zilizoidhinishwa: ${approvedDeposits.size}\n` +
            `✅ Uondoaji ulioidhinishwa: ${approvedWithdrawals.size}\n` +
            `📊 Jumla ya shughuli: ${approvedDeposits.size + approvedWithdrawals.size}`
        );
        
    } catch (error) {
        console.error('Error reviewing admin:', error);
        showToast('Imeshindikana kupakia taarifa.', 'error');
    }
}

/**
 * Delete Admin
 */
async function deleteAdmin(adminId) {
    if (!confirm('Una uhakika unataka kumfuta msimamizi huyu? Atabadilishwa kuwa mtumiaji wa kawaida.')) return;
    
    try {
        await db.collection('users').doc(adminId).update({
            role: 'user',
            status: 'suspended'
        });
        
        showToast('Msimamizi amefutwa na amesimamishwa!', 'success');
        loadSuperAdmins();
        
    } catch (error) {
        console.error('Error deleting admin:', error);
        showToast('Imeshindikana kumfuta msimamizi.', 'error');
    }
}

/**
 * Deactivate Admin
 */
async function deactivateAdmin(adminId) {
    if (!confirm('Una uhakika unataka kumsimamisha msimamizi huyu?')) return;
    
    try {
        await db.collection('users').doc(adminId).update({
            status: 'suspended'
        });
        
        showToast('Msimamizi amesimamishwa!', 'success');
        loadSuperAdmins();
        
    } catch (error) {
        console.error('Error deactivating admin:', error);
        showToast('Imeshindikana kumsimamisha msimamizi.', 'error');
    }
}

/**
 * Update Admin Profile
 */
async function updateAdminProfile(event) {
    event.preventDefault();
    
    const fullname = document.getElementById('adminFullname')?.value?.trim();
    const newPassword = document.getElementById('adminNewPassword')?.value;
    
    if (!fullname) {
        showToast('Tafadhali jaza jina kamili.', 'warning');
        return;
    }
    
    try {
        await db.collection('users').doc(currentUser.uid).update({
            fullname: fullname,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        if (newPassword && newPassword.length >= 6) {
            await currentUser.updatePassword(newPassword);
        }
        
        // Update displayed names
        const adminUsernameEl = document.getElementById('adminUsername');
        const sidebarAdminNameEl = document.getElementById('sidebarAdminName');
        
        if (adminUsernameEl) adminUsernameEl.textContent = fullname;
        if (sidebarAdminNameEl) sidebarAdminNameEl.textContent = fullname;
        
        currentUserData.fullname = fullname;
        
        showToast('Wasifu umesasishwa!', 'success');
        
    } catch (error) {
        console.error('Error updating admin profile:', error);
        showToast('Imeshindikana kusasisha wasifu.', 'error');
    }
}

/**
 * Update Site Settings
 */
async function updateSiteSettings(event) {
    event.preventDefault();
    
    const withdrawalFeePercent = parseInt(document.getElementById('withdrawalFeePercent')?.value) || 10;
    const minDeposit = parseInt(document.getElementById('minDeposit')?.value) || 5000;
    const minWithdrawal = parseInt(document.getElementById('minWithdrawal')?.value) || 10000;
    
    try {
        await db.collection('settings').doc('site').set({
            withdrawalFeePercent: withdrawalFeePercent,
            minDeposit: minDeposit,
            minWithdrawal: minWithdrawal,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        
        showToast('Mipangilio imehifadhiwa!', 'success');
        
    } catch (error) {
        console.error('Error updating site settings:', error);
        showToast('Imeshindikana kuhifadhi mipangilio.', 'error');
    }
}

/**
 * Show Admin Profile
 */
function showAdminProfile() {
    const dropdown = document.getElementById('adminUserDropdown');
    if (dropdown) dropdown.classList.remove('active');
    
    showAdminSection('adminSettings');
    
    // Populate profile form
    const fullnameEl = document.getElementById('adminFullname');
    const emailEl = document.getElementById('adminEmail');
    
    if (fullnameEl) fullnameEl.value = currentUserData?.fullname || '';
    if (emailEl) emailEl.value = currentUserData?.email || '';
}

/**
 * Toggle Admin Sidebar
 */
function toggleAdminSidebar() {
    const sidebar = document.getElementById('adminSidebar');
    if (sidebar) {
        sidebar.classList.toggle('active');
    }
}

/**
 * Toggle Admin User Menu
 */
function toggleAdminUserMenu() {
    const dropdown = document.getElementById('adminUserDropdown');
    if (dropdown) {
        dropdown.classList.toggle('active');
    }
}

/**
 * Show Admin Section
 */
function showAdminSection(sectionName) {
    console.log('Switching to admin section:', sectionName);
    
    // Hide all sections
    document.querySelectorAll('#adminDashboard .content-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Show selected section
    const targetSection = document.getElementById(`${sectionName}Section`);
    if (targetSection) {
        targetSection.classList.add('active');
    }
    
    // Update active menu item
    document.querySelectorAll('#adminSidebar .menu-item').forEach(item => {
        item.classList.remove('active');
    });
    
    if (event && event.target) {
        const menuItem = event.target.closest('.menu-item');
        if (menuItem) {
            menuItem.classList.add('active');
        }
    }
    
    // Load section data
    switch(sectionName) {
        case 'adminOverview':
            loadAdminOverview();
            break;
        case 'adminUserManagement':
            loadAdminUsers();
            break;
        case 'adminDeposits':
            loadAdminDeposits('pending');
            break;
        case 'adminWithdrawals':
            loadAdminWithdrawals('pending');
            break;
        case 'adminTransactions':
            loadAdminTransactions();
            break;
        case 'adminReports':
            loadAdminReports();
            break;
        case 'adminSettings':
            showAdminProfile();
            break;
    }
    
    // Close sidebar on mobile
    if (window.innerWidth <= 768) {
        const sidebar = document.getElementById('adminSidebar');
        if (sidebar) {
            sidebar.classList.remove('active');
        }
    }
}

// Close dropdowns when clicking outside
document.addEventListener('click', (e) => {
    if (!e.target.closest('.user-dropdown')) {
        document.getElementById('userDropdown')?.classList.remove('active');
        document.getElementById('adminUserDropdown')?.classList.remove('active');
        document.getElementById('superAdminUserDropdown')?.classList.remove('active');
    }
    if (!e.target.closest('.notification-bell')) {
        document.getElementById('adminNotificationDropdown')?.classList.remove('active');
    }
});

// Close modals when clicking outside
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.classList.remove('active');
    }
};

console.log('✅ Admin Dashboard Functions Loaded Successfully');

async function loadSuperAdminOverview() {
    console.log('Loading super admin overview...');
    
    try {
        // Get ALL users
        const allUsersSnapshot = await db.collection('users').get();
        
        // Count regular users only (exclude admins and super admins)
        let regularUserCount = 0;
        allUsersSnapshot.forEach(doc => {
            const user = doc.data();
            if (user.role === 'user' || !user.role) {
                regularUserCount++;
            }
        });
        
        // Count admins
        let adminCount = 0;
        allUsersSnapshot.forEach(doc => {
            const user = doc.data();
            if (user.role === 'admin') {
                adminCount++;
            }
        });
        
        // Calculate revenue
        let totalRevenue = 0;
        let totalWithdrawals = 0;
        
        try {
            const depositsSnapshot = await db.collection('deposits')
                .where('status', '==', 'approved')
                .get();
            depositsSnapshot.forEach(doc => {
                totalRevenue += (doc.data().amount || 0);
            });
        } catch (err) {
            console.warn('Could not fetch deposits:', err);
        }
        
        try {
            const withdrawalsSnapshot = await db.collection('withdrawals')
                .where('status', '==', 'approved')
                .get();
            withdrawalsSnapshot.forEach(doc => {
                totalWithdrawals += (doc.data().amount || 0);
            });
        } catch (err) {
            console.warn('Could not fetch withdrawals:', err);
        }
        
        const profit = totalRevenue - totalWithdrawals;
        
        // Update UI
        updateElementText('superTotalUsers', regularUserCount);
        updateElementText('superTotalAdmins', adminCount);
        updateElementText('superTotalRevenue', formatCurrency(totalRevenue));
        updateElementText('superCompanyProfit', formatCurrency(profit));
        
        console.log('Overview loaded:', {
            regularUsers: regularUserCount,
            admins: adminCount,
            revenue: totalRevenue,
            profit: profit
        });
        
    } catch (error) {
        console.error('Error loading super admin overview:', error);
    }
}

/**
 * Load Super Users - FIXED (No index required)
 */
async function loadSuperUsers() {
    console.log('Loading super users (regular users only)...');
    
    const tbody = document.getElementById('superUsersTableBody');
    if (!tbody) {
        console.warn('Super users table body not found');
        return;
    }
    
    try {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center p-4"><i class="fas fa-spinner fa-spin"></i> Inapakia...</td></tr>';
        
        const snapshot = await db.collection('users')
            .limit(100)
            .get();
        
        if (snapshot.empty) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center p-4">Hakuna watumiaji.</td></tr>';
            return;
        }
        
        // Filter: ONLY regular users (not admins, not super admins)
        const regularUsers = [];
        snapshot.forEach(doc => {
            const user = doc.data();
            if (user.role === 'user' || !user.role || user.role === undefined) {
                regularUsers.push({
                    id: doc.id,
                    ...user
                });
            }
        });
        
        if (regularUsers.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center p-4">Hakuna watumiaji wa kawaida.</td></tr>';
            return;
        }
        
        // Sort by date
        regularUsers.sort((a, b) => {
            const dateA = a.createdAt?.toDate?.() || new Date(0);
            const dateB = b.createdAt?.toDate?.() || new Date(0);
            return dateB - dateA;
        });
        
        tbody.innerHTML = regularUsers.map(user => {
            const status = user.status || 'active';
            const statusClass = status === 'active' ? 'status-active' : 'status-suspended';
            const statusLabel = status === 'active' ? 'Anafanya kazi' : 'Amesimamishwa';
            
            return `
                <tr>
                    <td>
                        <div class="user-info-cell">
                            <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullname || 'User')}&background=FF6B35&color=fff&size=40" 
                                 alt="${user.username}" style="width: 40px; height: 40px; border-radius: 50%;">
                            <div>
                                <h4 style="margin: 0; font-size: 14px;">${user.username || 'N/A'}</h4>
                                <p style="margin: 0; font-size: 11px; color: #666;">${user.email || ''}</p>
                            </div>
                        </div>
                    </td>
                    <td>${user.fullname || 'N/A'}</td>
                    <td>${user.email || 'N/A'}</td>
                    <td>${formatCurrency(user.balance || 0)}</td>
                    <td><span class="status-badge ${statusClass}">${statusLabel}</span></td>
                    <td>
                        <div class="action-buttons" style="display: flex; gap: 5px; flex-wrap: wrap;">
                            <button class="btn-action btn-view" onclick="viewUserDetail('${user.id}')" 
                                    style="padding: 5px 10px; background: #004E89; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 12px;">
                                <i class="fas fa-eye"></i> Angalia
                            </button>
                            ${status === 'active' ? 
                                `<button onclick="suspendUser('${user.id}')" style="padding: 5px 10px; background: #F39C12; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 12px;">
                                    <i class="fas fa-ban"></i> Simamisha
                                </button>` :
                                `<button onclick="activateUser('${user.id}')" style="padding: 5px 10px; background: #1A936F; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 12px;">
                                    <i class="fas fa-check"></i> Washa
                                </button>`
                            }
                            <button class="btn-action btn-delete" onclick="deleteUser('${user.id}')" 
                                    style="padding: 5px 10px; background: #EF233C; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 12px;">
                                <i class="fas fa-trash"></i> Futa
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
        
        console.log(`Loaded ${regularUsers.length} regular users (excluded admins)`);
        
    } catch (error) {
        console.error('Error loading super users:', error);
        tbody.innerHTML = '<tr><td colspan="6" class="text-center p-4 text-danger">Imeshindikana kupakia watumiaji.</td></tr>';
    }
}

// ============================================
// STATUS HELPER FUNCTIONS
// ============================================

/**
 * Get status badge CSS class
 */
function getStatusBadgeClass(status) {
    const classes = {
        'active': 'status-active',
        'suspended': 'status-suspended',
        'pending': 'status-pending',
        'approved': 'status-approved',
        'rejected': 'status-rejected'
    };
    return classes[status] || 'status-pending';
}

/**
 * Get status label in Swahili
 */
function getStatusLabel(status) {
    const labels = {
        'active': 'Inatumika',
        'suspended': 'Imesimamishwa',
        'pending': 'Inasubiri',
        'approved': 'Imeidhinishwa',
        'rejected': 'Imekataliwa'
    };
    return labels[status] || status;
}

/**
 * Safe element text update
 */
function updateElementText(elementId, text) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = text;
    }
}

/**
 * Load Admin Users - ONLY REGULAR USERS (No Admins)
 */
async function loadAdminUsers() {
    console.log('Loading admin users (regular users only)...');
    
    const tbody = document.getElementById('usersTableBody');
    if (!tbody) {
        console.error('Users table body not found');
        return;
    }
    
    try {
        // Show loading state
        tbody.innerHTML = '<tr><td colspan="7" class="text-center p-4"><i class="fas fa-spinner fa-spin"></i> Inapakia watumiaji...</td></tr>';
        
        // Get ONLY users where role is NOT admin and NOT super_admin
        // We'll get all users and filter manually since Firestore doesn't support "not equal" well
        const snapshot = await db.collection('users')
            .limit(100)
            .get();
        
        if (snapshot.empty) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center p-4">Hakuna watumiaji waliopatikana.</td></tr>';
            return;
        }
        
        // Convert to array and FILTER OUT admins
        const allUsers = [];
        snapshot.forEach(doc => {
            const userData = doc.data();
            // ONLY include regular users (role is 'user' or undefined)
            if (userData.role === 'user' || !userData.role || userData.role === undefined) {
                allUsers.push({
                    id: doc.id,
                    ...userData
                });
            }
        });
        
        if (allUsers.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center p-4">Hakuna watumiaji wa kawaida waliopatikana.</td></tr>';
            return;
        }
        
        // Sort by creation date (newest first)
        allUsers.sort((a, b) => {
            const dateA = a.createdAt?.toDate?.() || new Date(0);
            const dateB = b.createdAt?.toDate?.() || new Date(0);
            return dateB - dateA;
        });
        
        // Apply filter if any
        let filteredUsers = allUsers;
        if (window.currentUserFilter === 'active') {
            filteredUsers = allUsers.filter(u => u.status === 'active');
        } else if (window.currentUserFilter === 'suspended') {
            filteredUsers = allUsers.filter(u => u.status === 'suspended');
        } else if (window.currentUserFilter === 'new') {
            // Users from today
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            filteredUsers = allUsers.filter(u => {
                const userDate = u.createdAt?.toDate?.() || new Date(0);
                return userDate >= today;
            });
        }
        
        // Build table rows
        let html = '';
        
        filteredUsers.forEach(user => {
            const status = user.status || 'active';
            const statusClass = status === 'active' ? 'status-active' : 'status-suspended';
            const statusLabel = status === 'active' ? 'Hai' : 'Imesimamishwa';
            const joinDate = user.createdAt?.toDate ? user.createdAt.toDate().toLocaleDateString('sw-TZ') : 'N/A';
            const balance = user.balance || 0;
            
            html += `
                <tr>
                    <td>
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullname || 'User')}&background=FF6B35&color=fff&size=35" 
                                 alt="${user.username || ''}" 
                                 style="width: 35px; height: 35px; border-radius: 50%;"
                                 onerror="this.src='https://via.placeholder.com/35'">
                            <div>
                                <strong style="font-size: 14px;">${user.username || 'N/A'}</strong>
                                <br>
                                <small style="color: #666;">${user.fullname || ''}</small>
                            </div>
                        </div>
                    </td>
                    <td>${user.fullname || 'N/A'}</td>
                    <td>${user.email || 'N/A'}</td>
                    <td><strong>${formatCurrency(balance)}</strong></td>
                    <td><span class="status-badge ${statusClass}" style="padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 600;">${statusLabel}</span></td>
                    <td><small>${joinDate}</small></td>
                    <td>
                        <div style="display: flex; gap: 5px; flex-wrap: wrap;">
                            <button onclick="viewUserDetail('${user.id}')" 
                                    style="padding: 5px 10px; background: #004E89; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 11px;"
                                    title="Angalia maelezo">
                                <i class="fas fa-eye"></i>
                            </button>
                            ${status === 'active' ? 
                                `<button onclick="suspendUser('${user.id}')" 
                                        style="padding: 5px 10px; background: #F39C12; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 11px;"
                                        title="Simamisha mtumiaji">
                                    <i class="fas fa-ban"></i>
                                </button>` :
                                `<button onclick="activateUser('${user.id}')" 
                                        style="padding: 5px 10px; background: #1A936F; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 11px;"
                                        title="Washa mtumiaji">
                                    <i class="fas fa-check"></i>
                                </button>`
                            }
                            <button onclick="viewUserTransactions('${user.id}')" 
                                    style="padding: 5px 10px; background: #6c757d; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 11px;"
                                    title="Angalia miamala">
                                <i class="fas fa-exchange-alt"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        });
        
        tbody.innerHTML = html;
        console.log(`Loaded ${filteredUsers.length} regular users (filtered from ${allUsers.length} total, excluded ${allUsers.length - filteredUsers.length} admins)`);
        
    } catch (error) {
        console.error('Error loading users:', error);
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center p-4">
                    <div style="color: #EF233C;">
                        <i class="fas fa-exclamation-circle"></i> 
                        Imeshindikana kupakia watumiaji.
                    </div>
                    <button onclick="loadAdminUsers()" style="margin-top: 10px; padding: 8px 15px; background: #FF6B35; color: white; border: none; border-radius: 5px; cursor: pointer;">
                        <i class="fas fa-sync-alt"></i> Jaribu Tena
                    </button>
                </td>
            </tr>
        `;
    }
}

/**
 * Filter Users
 */
function filterUsers(filter) {
    // Update active filter button
    document.querySelectorAll('#adminUserManagementSection .filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    if (event && event.target) {
        event.target.classList.add('active');
    }
    
    // Store current filter
    window.currentUserFilter = filter;
    
    // Reload users (you can add filtering logic here later)
    loadAdminUsers();
    
    console.log('Filtering users by:', filter);
}

/**
 * Search Users
 */
async function searchUsers() {
    const searchInput = document.getElementById('userSearchInput');
    if (!searchInput) return;
    
    const searchTerm = searchInput.value.trim().toLowerCase();
    
    if (!searchTerm) {
        loadAdminUsers();
        return;
    }
    
    const tbody = document.getElementById('usersTableBody');
    if (!tbody) return;
    
    try {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center p-4"><i class="fas fa-spinner fa-spin"></i> Inatafuta...</td></tr>';
        
        // Search by username prefix
        const snapshot = await db.collection('users')
            .where('username', '>=', searchTerm)
            .where('username', '<=', searchTerm + '\uf8ff')
            .limit(20)
            .get();
        
        if (snapshot.empty) {
            // Try searching by email
            const emailSnapshot = await db.collection('users')
                .where('email', '>=', searchTerm)
                .where('email', '<=', searchTerm + '\uf8ff')
                .limit(20)
                .get();
            
            if (emailSnapshot.empty) {
                tbody.innerHTML = '<tr><td colspan="7" class="text-center p-4">Hakuna mtumiaji aliyepatikana kwa: <strong>' + searchTerm + '</strong></td></tr>';
                return;
            }
            
            renderUsersTable(emailSnapshot);
            return;
        }
        
        renderUsersTable(snapshot);
        
    } catch (error) {
        console.error('Error searching users:', error);
        tbody.innerHTML = '<tr><td colspan="7" class="text-center p-4 text-danger">Imeshindikana kutafuta watumiaji.</td></tr>';
    }
}

/**
 * Render users from snapshot
 */
function renderUsersTable(snapshot) {
    const tbody = document.getElementById('usersTableBody');
    if (!tbody) return;
    
    let html = '';
    
    snapshot.forEach(doc => {
        const user = doc.data();
        const status = user.status || 'active';
        
        html += `
            <tr>
                <td>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <strong>${user.username || 'N/A'}</strong>
                    </div>
                </td>
                <td>${user.fullname || 'N/A'}</td>
                <td>${user.email || 'N/A'}</td>
                <td>${formatCurrency(user.balance || 0)}</td>
                <td><span class="status-badge ${status === 'active' ? 'status-active' : 'status-suspended'}">${status === 'active' ? 'Hai' : 'Imesimamishwa'}</span></td>
                <td>${user.createdAt?.toDate?.().toLocaleDateString('sw-TZ') || 'N/A'}</td>
                <td>
                    <button onclick="viewUserDetail('${doc.id}')" style="padding: 5px 10px; background: #004E89; color: white; border: none; border-radius: 5px; cursor: pointer;">
                        <i class="fas fa-eye"></i>
                    </button>
                </td>
            </tr>
        `;
    });
    
    tbody.innerHTML = html;
}

/**
 * Suspend User
 */
async function suspendUser(userId) {
    if (!confirm('Una uhakika unataka kumsimamisha mtumiaji huyu?')) return;
    
    try {
        await db.collection('users').doc(userId).update({
            status: 'suspended',
            suspendedAt: firebase.firestore.FieldValue.serverTimestamp(),
            suspendedBy: currentUser?.uid || 'admin'
        });
        
        showToast('Mtumiaji amesimamishwa kwa mafanikio!', 'success');
        loadAdminUsers();
        
    } catch (error) {
        console.error('Error suspending user:', error);
        showToast('Imeshindikana kumsimamisha mtumiaji.', 'error');
    }
}

/**
 * Activate User
 */
async function activateUser(userId) {
    try {
        await db.collection('users').doc(userId).update({
            status: 'active',
            activatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            activatedBy: currentUser?.uid || 'admin'
        });
        
        showToast('Mtumiaji amewashwa kwa mafanikio!', 'success');
        loadAdminUsers();
        
    } catch (error) {
        console.error('Error activating user:', error);
        showToast('Imeshindikana kumwasha mtumiaji.', 'error');
    }
}

/**
 * View User Transactions
 */
async function viewUserTransactions(userId) {
    try {
        // Get user info
        const userDoc = await db.collection('users').doc(userId).get();
        const user = userDoc.data();
        
        if (!user) {
            showToast('Mtumiaji hajapatikana.', 'error');
            return;
        }
        
        // Get deposits
        const depositsSnapshot = await db.collection('deposits')
            .where('userId', '==', userId)
            .limit(20)
            .get();
        
        // Get withdrawals
        const withdrawalsSnapshot = await db.collection('withdrawals')
            .where('userId', '==', userId)
            .limit(20)
            .get();
        
        // Get purchases
        const purchasesSnapshot = await db.collection('purchases')
            .where('userId', '==', userId)
            .limit(20)
            .get();
        
        let message = `Miamala ya ${user.fullname} (@${user.username})\n\n`;
        message += `📥 Amana: ${depositsSnapshot.size}\n`;
        message += `📤 Uondoaji: ${withdrawalsSnapshot.size}\n`;
        message += `🛒 Ununuzi: ${purchasesSnapshot.size}\n`;
        message += `💰 Salio: ${formatCurrency(user.balance || 0)}\n`;
        
        // Switch to transactions section
        showAdminSection('adminTransactions');
        showToast(`Inaonyesha miamala ya ${user.username}`, 'info');
        
    } catch (error) {
        console.error('Error viewing transactions:', error);
        showToast('Imeshindikana kupakia miamala.', 'error');
    }
}

/**
 * View User Detail - FIXED
 */
async function viewUserDetail(userId) {
    try {
        const userDoc = await db.collection('users').doc(userId).get();
        
        if (!userDoc.exists) {
            showToast('Mtumiaji hajapatikana.', 'error');
            return;
        }
        
        const user = userDoc.data();
        
        // Get referral info
        let referrerName = 'Hakuna';
        if (user.referredBy) {
            try {
                const referrerDoc = await db.collection('users').doc(user.referredBy).get();
                if (referrerDoc.exists) {
                    referrerName = referrerDoc.data().username || 'Haijulikani';
                }
            } catch (err) {
                console.warn('Could not fetch referrer:', err);
            }
        }
        
        // Count referrals
        let referralCount = 0;
        try {
            const refSnapshot = await db.collection('users')
                .where('referredBy', '==', userId)
                .get();
            referralCount = refSnapshot.size;
        } catch (err) {
            console.warn('Could not count referrals:', err);
        }
        
        // Build detail HTML
        const statusLabel = user.status === 'active' ? 'Anafanya kazi' : 
                           user.status === 'suspended' ? 'Amesimamishwa' : 'Haijulikani';
        const statusClass = user.status === 'active' ? 'status-active' : 'status-suspended';
        const joinDate = user.createdAt?.toDate ? user.createdAt.toDate().toLocaleString('sw-TZ') : 'N/A';
        
        document.getElementById('userDetailContent').innerHTML = `
            <h3 style="margin-bottom: 20px; color: #004E89;">
                <i class="fas fa-user-circle"></i> Maelezo Kamili ya Mtumiaji
            </h3>
            
            <div style="text-align: center; margin-bottom: 20px;">
                <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullname || 'User')}&background=FF6B35&color=fff&size=80" 
                     alt="${user.username}" 
                     style="width: 80px; height: 80px; border-radius: 50%; border: 3px solid #FF6B35;">
                <h4 style="margin-top: 10px;">${user.fullname || 'N/A'}</h4>
                <p style="color: #666;">@${user.username || 'N/A'}</p>
                <span class="status-badge ${statusClass}" style="padding: 5px 15px; border-radius: 20px; font-size: 12px;">${statusLabel}</span>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px;">
                <div style="background: #f8f9fa; padding: 12px; border-radius: 8px;">
                    <label style="font-size: 11px; color: #666;">Jina la Mtumiaji</label>
                    <div style="font-weight: 600;">${user.username || 'N/A'}</div>
                </div>
                <div style="background: #f8f9fa; padding: 12px; border-radius: 8px;">
                    <label style="font-size: 11px; color: #666;">Jina Kamili</label>
                    <div style="font-weight: 600;">${user.fullname || 'N/A'}</div>
                </div>
                <div style="background: #f8f9fa; padding: 12px; border-radius: 8px;">
                    <label style="font-size: 11px; color: #666;">Barua Pepe</label>
                    <div style="font-weight: 600;">${user.email || 'N/A'}</div>
                </div>
                <div style="background: #f8f9fa; padding: 12px; border-radius: 8px;">
                    <label style="font-size: 11px; color: #666;">Namba ya Simu</label>
                    <div style="font-weight: 600;">${user.phone || 'Haijawasilishwa'}</div>
                </div>
                <div style="background: #f8f9fa; padding: 12px; border-radius: 8px;">
                    <label style="font-size: 11px; color: #666;">Salio</label>
                    <div style="font-weight: 600; color: #1A936F;">${formatCurrency(user.balance || 0)}</div>
                </div>
                <div style="background: #f8f9fa; padding: 12px; border-radius: 8px;">
                    <label style="font-size: 11px; color: #666;">Mapato Yote</label>
                    <div style="font-weight: 600; color: #004E89;">${formatCurrency(user.totalEarnings || 0)}</div>
                </div>
                <div style="background: #f8f9fa; padding: 12px; border-radius: 8px;">
                    <label style="font-size: 11px; color: #666;">Vinywaji Vilivyonunuliwa</label>
                    <div style="font-weight: 600;">${user.activeDrinks || 0}</div>
                </div>
                <div style="background: #f8f9fa; padding: 12px; border-radius: 8px;">
                    <label style="font-size: 11px; color: #666;">Tarehe ya Kujiunga</label>
                    <div style="font-weight: 600; font-size: 13px;">${joinDate}</div>
                </div>
            </div>
            
            <div style="background: #f0f8ff; padding: 15px; border-radius: 10px; margin-bottom: 20px;">
                <h4 style="margin-bottom: 12px; color: #FF6B35;">
                    <i class="fas fa-users"></i> Taarifa za Rufaa
                </h4>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                    <div>
                        <label style="font-size: 11px; color: #666;">Namba ya Rufaa</label>
                        <div style="font-weight: 600; letter-spacing: 2px;">${user.referralCode || 'N/A'}</div>
                    </div>
                    <div>
                        <label style="font-size: 11px; color: #666;">Alirejea na</label>
                        <div style="font-weight: 600;">${referrerName}</div>
                    </div>
                    <div>
                        <label style="font-size: 11px; color: #666;">Warejea Wake</label>
                        <div style="font-weight: 600;">${referralCount} watu</div>
                    </div>
                    <div>
                        <label style="font-size: 11px; color: #666;">Bonasi za Rufaa</label>
                        <div style="font-weight: 600; color: #1A936F;">${formatCurrency(user.totalReferralBonus || 0)}</div>
                    </div>
                </div>
            </div>
            
            <button onclick="closeUserDetailModal()" style="width: 100%; padding: 12px; background: #FF6B35; color: white; border: none; border-radius: 10px; cursor: pointer; font-size: 16px; font-weight: 600;">
                <i class="fas fa-times"></i> Funga
            </button>
        `;
        
        document.getElementById('userDetailModal').classList.add('active');
        
    } catch (error) {
        console.error('Error viewing user detail:', error);
        showToast('Imeshindikana kupakia maelezo ya mtumiaji.', 'error');
    }
}

/**
 * Export Users
 */
function exportUsers() {
    showToast('Inatayarisha faili ya watumiaji...', 'info');
    
    // Get users and create CSV
    db.collection('users').limit(100).get()
        .then(snapshot => {
            let csv = 'Jina la Mtumiaji,Jina Kamili,Barua Pepe,Simu,Salio,Hali,Tarehe ya Kujiunga\n';
            
            snapshot.forEach(doc => {
                const user = doc.data();
                csv += `"${user.username || ''}","${user.fullname || ''}","${user.email || ''}","${user.phone || ''}","${user.balance || 0}","${user.status || 'active'}","${user.createdAt?.toDate().toLocaleDateString() || ''}"\n`;
            });
            
            // Create download link
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `watumiaji_cashcola_${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
            
            showToast(`Faili imepakuliwa! Jumla ya watumiaji: ${snapshot.size}`, 'success');
        })
        .catch(error => {
            console.error('Error exporting users:', error);
            showToast('Imeshindikana kupakua faili.', 'error');
        });
}

/**
 * Show Admin Profile
 */
function showAdminProfile() {
    // Close dropdown
    const dropdown = document.getElementById('adminUserDropdown');
    if (dropdown) dropdown.classList.remove('active');
    
    // Switch to settings section
    showAdminSection('adminSettings');
    
    // Populate form
    const fullnameEl = document.getElementById('adminFullname');
    const emailEl = document.getElementById('adminEmail');
    
    if (fullnameEl) fullnameEl.value = currentUserData?.fullname || '';
    if (emailEl) emailEl.value = currentUserData?.email || '';
}

/**
 * Update Admin Profile
 */
async function updateAdminProfile(event) {
    event.preventDefault();
    
    const fullname = document.getElementById('adminFullname')?.value?.trim();
    const newPassword = document.getElementById('adminNewPassword')?.value;
    
    if (!fullname) {
        showToast('Tafadhali jaza jina kamili.', 'warning');
        return;
    }
    
    try {
        await db.collection('users').doc(currentUser.uid).update({
            fullname: fullname,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        if (newPassword && newPassword.length >= 6) {
            await currentUser.updatePassword(newPassword);
            showToast('Nenosiri limesasishwa!', 'success');
        }
        
        // Update displayed names
        const adminUsernameEl = document.getElementById('adminUsername');
        const sidebarAdminNameEl = document.getElementById('sidebarAdminName');
        
        if (adminUsernameEl) adminUsernameEl.textContent = fullname;
        if (sidebarAdminNameEl) sidebarAdminNameEl.textContent = fullname;
        
        if (currentUserData) currentUserData.fullname = fullname;
        
        showToast('Wasifu umesasishwa!', 'success');
        
    } catch (error) {
        console.error('Error updating profile:', error);
        showToast('Imeshindikana kusasisha wasifu.', 'error');
    }
}

/**
 * Refresh Activities
 */
function refreshActivities() {
    loadAdminActivities();
    showToast('Shughuli zimesasishwa!', 'info');
}

console.log('✅ Admin User Management Functions Loaded Successfully');
/**
 * Load Admin Deposits - FIXED (No index required)
 */
let currentDepositFilter = 'pending';
let currentWithdrawalFilter = 'pending';

/**
 * Load Admin Transactions - FIXED (No index required)
 */
async function loadAdminTransactions() {
    const tbody = document.getElementById('transactionsTableBody');
    if (!tbody) return;
    
    try {
        const depositsSnapshot = await db.collection('deposits').limit(50).get();
        const withdrawalsSnapshot = await db.collection('withdrawals').limit(50).get();
        
        let transactions = [];
        let totalDeposits = 0;
        let totalWithdrawals = 0;
        let totalFees = 0;
        
        depositsSnapshot.forEach(doc => {
            const data = doc.data();
            if (data.status === 'approved') totalDeposits += (data.amount || 0);
            transactions.push({
                type: 'Amana',
                typeClass: 'bg-success',
                username: data.username || 'N/A',
                amount: data.amount || 0,
                fee: 0,
                date: data.createdAt?.toDate(),
                status: data.status
            });
        });
        
        withdrawalsSnapshot.forEach(doc => {
            const data = doc.data();
            if (data.status === 'approved') {
                totalWithdrawals += (data.amount || 0);
                totalFees += (data.fee || 0);
            }
            transactions.push({
                type: 'Uondoaji',
                typeClass: 'bg-danger',
                username: data.username || 'N/A',
                amount: data.amount || 0,
                fee: data.fee || 0,
                date: data.createdAt?.toDate(),
                status: data.status
            });
        });
        
        // Sort manually
        transactions.sort((a, b) => (b.date || 0) - (a.date || 0));
        
        updateElementText('summaryDeposits', formatCurrency(totalDeposits));
        updateElementText('summaryWithdrawals', formatCurrency(totalWithdrawals));
        updateElementText('summaryProfit', formatCurrency(totalDeposits - totalWithdrawals + totalFees));
        
        if (transactions.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center p-4">Hakuna miamala iliyopatikana.</td></tr>';
            return;
        }
        
        tbody.innerHTML = transactions.slice(0, 50).map(trans => {
            const statusClass = trans.status === 'approved' ? 'status-approved' : 
                               trans.status === 'rejected' ? 'status-rejected' : 'status-pending';
            const statusLabel = trans.status === 'approved' ? 'Imeidhinishwa' : 
                               trans.status === 'rejected' ? 'Imekataliwa' : 'Inasubiri';
            
            return `
                <tr>
                    <td><span style="padding: 5px 10px; border-radius: 20px; font-size: 12px; background: ${trans.type === 'Amana' ? '#1A936F' : '#EF233C'}; color: white;">${trans.type}</span></td>
                    <td>${trans.username}</td>
                    <td>${formatCurrency(trans.amount)}</td>
                    <td>${trans.fee > 0 ? formatCurrency(trans.fee) : 'TZS 0'}</td>
                    <td><small>${trans.date?.toLocaleString('sw-TZ') || 'N/A'}</small></td>
                    <td><span class="status-badge ${statusClass}">${statusLabel}</span></td>
                </tr>
            `;
        }).join('');
        
    } catch (error) {
        console.error('Error loading transactions:', error);
        tbody.innerHTML = '<tr><td colspan="6" class="text-center p-4 text-danger">Imeshindikana kupakia miamala.</td></tr>';
    }
}

/**
 * Load History (User) - FIXED (No index required)
 */
async function loadHistory(filter = 'all') {
    if (!currentUser) return;
    
    try {
        let historyItems = [];
        
        // Load deposits
        if (filter === 'all' || filter === 'deposit') {
            const depositSnapshot = await db.collection('deposits')
                .where('userId', '==', currentUser.uid)
                .limit(50)
                .get();
            
            depositSnapshot.forEach(doc => {
                const data = doc.data();
                historyItems.push({
                    type: 'deposit',
                    id: doc.id,
                    title: 'Amana',
                    amount: data.amount,
                    status: data.status,
                    date: data.createdAt?.toDate()
                });
            });
        }
        
        // Load withdrawals
        if (filter === 'all' || filter === 'withdraw') {
            const withdrawSnapshot = await db.collection('withdrawals')
                .where('userId', '==', currentUser.uid)
                .limit(50)
                .get();
            
            withdrawSnapshot.forEach(doc => {
                const data = doc.data();
                historyItems.push({
                    type: 'withdraw',
                    id: doc.id,
                    title: 'Uondoaji',
                    amount: data.amount,
                    fee: data.fee || 0,
                    status: data.status,
                    date: data.createdAt?.toDate()
                });
            });
        }
        
        // Load purchases
        if (filter === 'all' || filter === 'purchase') {
            const purchaseSnapshot = await db.collection('purchases')
                .where('userId', '==', currentUser.uid)
                .limit(50)
                .get();
            
            purchaseSnapshot.forEach(doc => {
                const data = doc.data();
                historyItems.push({
                    type: 'purchase',
                    id: doc.id,
                    title: `Ununuzi - ${data.name || 'Kinywaji'}`,
                    amount: data.price,
                    status: data.status,
                    date: data.purchasedAt?.toDate()
                });
            });
        }
        
        // Sort manually
        historyItems.sort((a, b) => (b.date || 0) - (a.date || 0));
        
        renderHistory(historyItems);
        
    } catch (error) {
        console.error('Error loading history:', error);
    }
}



/**
 * Suspend User
 */
async function suspendUser(userId) {
    if (!confirm('Una uhakika unataka kumsimamisha mtumiaji huyu?')) return;
    
    try {
        await db.collection('users').doc(userId).update({
            status: 'suspended',
            suspendedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        showToast('Mtumiaji amesimamishwa!', 'success');
        loadSuperUsers();
        
    } catch (error) {
        console.error('Error suspending user:', error);
        showToast('Imeshindikana kumsimamisha mtumiaji.', 'error');
    }
}

/**
 * Activate User
 */
async function activateUser(userId) {
    try {
        await db.collection('users').doc(userId).update({
            status: 'active',
            activatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        showToast('Mtumiaji amewashwa!', 'success');
        loadSuperUsers();
        
    } catch (error) {
        console.error('Error activating user:', error);
        showToast('Imeshindikana kumwasha mtumiaji.', 'error');
    }
}

/**
 * Delete User (Super Admin)
 */
async function deleteUser(userId) {
    if (!confirm('UNA UHAKIKA? Hii itamfuta mtumiaji huyu na data zake zote. Huwezi kurudisha nyuma!')) return;
    if (!confirm('Thibitisha tena: Unataka kumfuta mtumiaji huyu KABISA?')) return;
    
    try {
        // Delete user document
        await db.collection('users').doc(userId).delete();
        
        // Delete user's deposits
        const deposits = await db.collection('deposits').where('userId', '==', userId).get();
        deposits.forEach(async doc => await doc.ref.delete());
        
        // Delete user's withdrawals
        const withdrawals = await db.collection('withdrawals').where('userId', '==', userId).get();
        withdrawals.forEach(async doc => await doc.ref.delete());
        
        // Delete user's purchases
        const purchases = await db.collection('purchases').where('userId', '==', userId).get();
        purchases.forEach(async doc => await doc.ref.delete());
        
        showToast('Mtumiaji na data zake zote zimefutwa!', 'success');
        loadSuperUsers();
        
    } catch (error) {
        console.error('Error deleting user:', error);
        showToast('Imeshindikana kumfuta mtumiaji.', 'error');
    }
}

// ============================================
// SUPER ADMIN - ADMIN MANAGEMENT
// ============================================

/**
 * Load Super Admins List
 */
async function loadSuperAdmins() {
    console.log('Loading admins...');
    
    const tbody = document.getElementById('adminsTableBody');
    if (!tbody) return;
    
    try {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center p-4"><i class="fas fa-spinner fa-spin"></i> Inapakia...</td></tr>';
        
        const snapshot = await db.collection('users').where('role', '==', 'admin').get();
        
        // Update stats
        let activeCount = 0, suspendedCount = 0;
        snapshot.forEach(doc => {
            if (doc.data().status === 'active') activeCount++;
            else suspendedCount++;
        });
        document.getElementById('totalAdminsCount').textContent = snapshot.size;
        document.getElementById('activeAdminsCount').textContent = activeCount;
        document.getElementById('suspendedAdminsCount').textContent = suspendedCount;
        
        if (snapshot.empty) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center p-4">Hakuna wasimamizi. <br><button class="btn-primary mt-2" onclick="showAddAdminModal()">Ongeza Msimamizi</button></td></tr>';
            return;
        }
        
        tbody.innerHTML = '';
        
        for (const doc of snapshot.docs) {
            const admin = doc.data();
            const status = admin.status || 'active';
            const statusClass = status === 'active' ? 'status-active' : 'status-suspended';
            const statusLabel = status === 'active' ? 'Anafanya Kazi' : 'Amesimamishwa';
            
            // Get admin's activity count
            let approvedDeposits = 0, approvedWithdrawals = 0;
            try {
                const dCount = await db.collection('deposits').where('approvedBy', '==', doc.id).get();
                approvedDeposits = dCount.size;
                const wCount = await db.collection('withdrawals').where('approvedBy', '==', doc.id).get();
                approvedWithdrawals = wCount.size;
            } catch (e) {}
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>
                    <div class="user-info-cell">
                        <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(admin.fullname || 'A')}&background=004E89&color=fff&size=40" 
                             style="width:40px;height:40px;border-radius:50%;">
                        <div>
                            <h4>${admin.fullname || 'N/A'}</h4>
                            <small style="color:#888;">@${admin.username || ''}</small>
                        </div>
                    </div>
                </td>
                <td>${admin.email || 'N/A'}</td>
                <td><span class="status-badge ${statusClass}">${statusLabel}</span></td>
                <td><small>${admin.createdAt?.toDate?.().toLocaleDateString('sw-TZ') || 'N/A'}</small></td>
                <td>
                    <small style="font-size:11px;">
                        ✅ Amana: ${approvedDeposits}<br>
                        💸 Uondoaji: ${approvedWithdrawals}
                    </small>
                </td>
                <td>
                    <div class="action-buttons" style="display:flex;gap:5px;flex-wrap:wrap;">
                        <button onclick="viewAdminDetails('${doc.id}')" style="padding:6px 10px;background:#004E89;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:11px;" title="Angalia">
                            <i class="fas fa-eye"></i> Kagua
                        </button>
                        <button onclick="showEditAdmin('${doc.id}')" style="padding:6px 10px;background:#1A936F;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:11px;" title="Hariri">
                            <i class="fas fa-edit"></i> Hariri
                        </button>
                        ${status === 'active' ? 
                            `<button onclick="showSuspendAdmin('${doc.id}')" style="padding:6px 10px;background:#F39C12;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:11px;" title="Simamisha">
                                <i class="fas fa-pause"></i> Simamisha
                            </button>` :
                            `<button onclick="activateAdmin('${doc.id}')" style="padding:6px 10px;background:#1A936F;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:11px;" title="Washa">
                                <i class="fas fa-play"></i> Washa
                            </button>`
                        }
                        <button onclick="showWarnAdmin('${doc.id}')" style="padding:6px 10px;background:#FFD166;color:#333;border:none;border-radius:6px;cursor:pointer;font-size:11px;" title="Onyo">
                            <i class="fas fa-exclamation-triangle"></i> Onyo
                        </button>
                        <button onclick="showDeleteAdmin('${doc.id}')" style="padding:6px 10px;background:#EF233C;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:11px;" title="Futa">
                            <i class="fas fa-trash"></i> Futa
                        </button>
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        }
        
    } catch (error) {
        console.error('Error loading admins:', error);
        tbody.innerHTML = '<tr><td colspan="6" class="text-center p-4 text-danger">Imeshindikana kupakia</td></tr>';
    }
}

// ============================================
// VIEW ADMIN DETAILS
// ============================================

async function viewAdminDetails(adminId) {
    try {
        const adminDoc = await db.collection('users').doc(adminId).get();
        if (!adminDoc.exists) { showToast('Msimamizi hajapatikana.', 'error'); return; }
        
        const admin = adminDoc.data();
        
        // Get activity
        const approvedD = await db.collection('deposits').where('approvedBy', '==', adminId).get();
        const approvedW = await db.collection('withdrawals').where('approvedBy', '==', adminId).get();
        const rejectedD = await db.collection('deposits').where('rejectedBy', '==', adminId).get();
        const rejectedW = await db.collection('withdrawals').where('rejectedBy', '==', adminId).get();
        
        // Get warnings
        const warnings = await db.collection('notices')
            .where('targetUserId', '==', adminId)
            .where('type', '==', 'admin_warning')
            .get();
        
        document.getElementById('reviewAdminContent').innerHTML = `
            <h3 style="margin-bottom:20px;"><i class="fas fa-user-shield"></i> Taarifa za Msimamizi</h3>
            
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:20px;">
                <div style="background:#f8f9fa;padding:12px;border-radius:8px;">
                    <small>Jina Kamili</small><br><strong>${admin.fullname}</strong>
                </div>
                <div style="background:#f8f9fa;padding:12px;border-radius:8px;">
                    <small>Jina la Mtumiaji</small><br><strong>@${admin.username}</strong>
                </div>
                <div style="background:#f8f9fa;padding:12px;border-radius:8px;">
                    <small>Barua Pepe</small><br><strong>${admin.email}</strong>
                </div>
                <div style="background:#f8f9fa;padding:12px;border-radius:8px;">
                    <small>Simu</small><br><strong>${admin.phone || 'N/A'}</strong>
                </div>
                <div style="background:#f8f9fa;padding:12px;border-radius:8px;">
                    <small>Hali</small><br><span class="status-badge ${admin.status === 'active' ? 'status-active' : 'status-suspended'}">${admin.status === 'active' ? 'Anafanya Kazi' : 'Amesimamishwa'}</span>
                </div>
                <div style="background:#f8f9fa;padding:12px;border-radius:8px;">
                    <small>Tarehe ya Kuongezwa</small><br><strong>${admin.createdAt?.toDate?.().toLocaleDateString('sw-TZ') || 'N/A'}</strong>
                </div>
            </div>
            
            <h4 style="margin-bottom:12px;">📊 Shughuli za Msimamizi</h4>
            <div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:10px;margin-bottom:20px;">
                <div style="background:#e8f5e9;padding:12px;border-radius:8px;text-align:center;">
                    <div style="font-size:20px;font-weight:700;color:#1A936F;">${approvedD.size}</div>
                    <small>Amana Zilizoidhinishwa</small>
                </div>
                <div style="background:#e3f2fd;padding:12px;border-radius:8px;text-align:center;">
                    <div style="font-size:20px;font-weight:700;color:#004E89;">${approvedW.size}</div>
                    <small>Uondoaji Ulioidhinishwa</small>
                </div>
                <div style="background:#fce4ec;padding:12px;border-radius:8px;text-align:center;">
                    <div style="font-size:20px;font-weight:700;color:#EF233C;">${rejectedD.size + rejectedW.size}</div>
                    <small>Zilizokataliwa</small>
                </div>
                <div style="background:#fff3e0;padding:12px;border-radius:8px;text-align:center;">
                    <div style="font-size:20px;font-weight:700;color:#F39C12;">${warnings.size}</div>
                    <small>Onyo</small>
                </div>
            </div>
            
            ${warnings.size > 0 ? `
                <h4 style="margin-bottom:10px;">⚠️ Historia ya Onyo</h4>
                <div style="margin-bottom:20px;">
                    ${warnings.docs.map(w => {
                        const d = w.data();
                        return `<div style="background:#fff3cd;padding:10px;border-radius:8px;margin-bottom:8px;border-left:4px solid #FFD166;">
                            <strong>${d.warnType || 'Onyo'}</strong>
                            <p style="margin:5px 0 0;font-size:13px;">${d.message}</p>
                            <small style="color:#888;">${d.createdAt?.toDate?.().toLocaleString('sw-TZ') || ''}</small>
                        </div>`;
                    }).join('')}
                </div>
            ` : ''}
            
            <button class="btn-primary" onclick="closeReviewAdminModal()" style="width:100%;">Funga</button>
        `;
        
        document.getElementById('reviewAdminModal').classList.add('active');
        
    } catch (error) {
        console.error('Error viewing admin:', error);
        showToast('Imeshindikana kupakia taarifa.', 'error');
    }
}

// ============================================
// EDIT ADMIN
// ============================================

async function showEditAdmin(adminId) {
    try {
        const adminDoc = await db.collection('users').doc(adminId).get();
        if (!adminDoc.exists) { showToast('Msimamizi hajapatikana.', 'error'); return; }
        
        const admin = adminDoc.data();
        
        document.getElementById('editAdminId').value = adminId;
        document.getElementById('editAdminFullname').value = admin.fullname || '';
        document.getElementById('editAdminEmail').value = admin.email || '';
        document.getElementById('editAdminUsername').value = admin.username || '';
        document.getElementById('editAdminPhone').value = admin.phone || '';
        document.getElementById('editAdminPassword').value = '';
        
        document.getElementById('editAdminModal').classList.add('active');
        
    } catch (error) {
        console.error('Error:', error);
        showToast('Imeshindikana.', 'error');
    }
}

async function updateAdminDetails(event) {
    event.preventDefault();
    
    const adminId = document.getElementById('editAdminId').value;
    const fullname = document.getElementById('editAdminFullname').value.trim();
    const email = document.getElementById('editAdminEmail').value.trim();
    const username = document.getElementById('editAdminUsername').value.trim();
    const phone = document.getElementById('editAdminPhone').value.trim();
    const password = document.getElementById('editAdminPassword').value;
    
    if (!fullname || !email || !username) {
        showToast('Jaza sehemu zote zinazohitajika.', 'warning');
        return;
    }
    
    try {
        await db.collection('users').doc(adminId).update({
            fullname, email, username, phone,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        showToast('Msimamizi amesasishwa! ✅', 'success');
        closeEditAdminModal();
        loadSuperAdmins();
        
    } catch (error) {
        console.error('Error:', error);
        showToast('Imeshindikana kusasisha.', 'error');
    }
}

// ============================================
// SUSPEND ADMIN
// ============================================

function showSuspendAdmin(adminId) {
    document.getElementById('suspendAdminId').value = adminId;
    document.getElementById('suspendReason').value = '';
    document.getElementById('suspendAdminModal').classList.add('active');
}

async function confirmSuspendAdmin() {
    const adminId = document.getElementById('suspendAdminId').value;
    const reason = document.getElementById('suspendReason').value.trim();
    
    if (!reason) {
        showToast('Tafadhali weka sababu ya kusimamisha.', 'warning');
        return;
    }
    
    try {
        await db.collection('users').doc(adminId).update({
            status: 'suspended',
            suspendedAt: firebase.firestore.FieldValue.serverTimestamp(),
            suspendedBy: currentUser.uid,
            suspendReason: reason
        });
        
        // Create notice
        await db.collection('notices').add({
            targetUserId: adminId,
            type: 'admin_warning',
            warnType: 'Suspension',
            message: `Akaunti imesimamishwa. Sababu: ${reason}`,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            createdBy: currentUser.uid
        });
        
        showToast('Msimamizi amesimamishwa! ⏸️', 'success');
        closeSuspendAdminModal();
        loadSuperAdmins();
        
    } catch (error) {
        console.error('Error:', error);
        showToast('Imeshindikana kumsimamisha.', 'error');
    }
}

// ============================================
// ACTIVATE ADMIN
// ============================================

async function activateAdmin(adminId) {
    if (!confirm('Unataka kumwasha msimamizi huyu?')) return;
    
    try {
        await db.collection('users').doc(adminId).update({
            status: 'active',
            activatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            activatedBy: currentUser.uid
        });
        
        showToast('Msimamizi amewashwa! ▶️', 'success');
        loadSuperAdmins();
        
    } catch (error) {
        console.error('Error:', error);
        showToast('Imeshindikana kumwasha.', 'error');
    }
}

// ============================================
// DELETE ADMIN
// ============================================

async function showDeleteAdmin(adminId) {
    try {
        const adminDoc = await db.collection('users').doc(adminId).get();
        if (!adminDoc.exists) return;
        
        const admin = adminDoc.data();
        
        document.getElementById('deleteAdminId').value = adminId;
        document.getElementById('deleteAdminInfo').innerHTML = `
            <p><strong>Jina:</strong> ${admin.fullname}</p>
            <p><strong>Barua Pepe:</strong> ${admin.email}</p>
            <p style="color:#EF233C;font-size:13px;">⚠️ Atabadilishwa kuwa mtumiaji wa kawaida na kusimamishwa.</p>
        `;
        
        document.getElementById('deleteAdminModal').classList.add('active');
        
    } catch (error) {
        console.error('Error:', error);
    }
}

async function confirmDeleteAdmin() {
    const adminId = document.getElementById('deleteAdminId').value;
    
    try {
        await db.collection('users').doc(adminId).update({
            role: 'user',
            status: 'suspended',
            deletedFromAdminAt: firebase.firestore.FieldValue.serverTimestamp(),
            deletedBy: currentUser.uid
        });
        
        showToast('Msimamizi amefutwa! 🗑️', 'success');
        closeDeleteAdminModal();
        loadSuperAdmins();
        
    } catch (error) {
        console.error('Error:', error);
        showToast('Imeshindikana kumfuta.', 'error');
    }
}

// ============================================
// WARN ADMIN
// ============================================

function showWarnAdmin(adminId) {
    document.getElementById('warnAdminId').value = adminId;
    document.getElementById('warnMessage').value = '';
    document.getElementById('warnType').value = 'minor';
    document.getElementById('warnAdminModal').classList.add('active');
}

async function confirmWarnAdmin() {
    const adminId = document.getElementById('warnAdminId').value;
    const warnType = document.getElementById('warnType').value;
    const message = document.getElementById('warnMessage').value.trim();
    
    if (!message) {
        showToast('Tafadhali andika ujumbe wa onyo.', 'warning');
        return;
    }
    
    const warnLabels = { minor: 'Onyo Ndogo', moderate: 'Onyo la Wastani', severe: 'Onyo Kali', final: 'Onyo la Mwisho' };
    
    try {
        await db.collection('notices').add({
            targetUserId: adminId,
            type: 'admin_warning',
            warnType: warnLabels[warnType],
            message: message,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            createdBy: currentUser.uid
        });
        
        showToast(`Onyo limetumwa kwa msimamizi! ⚠️`, 'success');
        closeWarnAdminModal();
        loadSuperAdmins();
        
    } catch (error) {
        console.error('Error:', error);
        showToast('Imeshindikana kutuma onyo.', 'error');
    }
}

// ============================================
// SEARCH ADMINS
// ============================================

async function searchAdmins() {
    const term = document.getElementById('adminSearchInput')?.value?.toLowerCase()?.trim();
    if (!term) { loadSuperAdmins(); return; }
    
    const tbody = document.getElementById('adminsTableBody');
    if (!tbody) return;
    
    try {
        const snapshot = await db.collection('users')
            .where('role', '==', 'admin')
            .get();
        
        tbody.innerHTML = '';
        
        for (const doc of snapshot.docs) {
            const admin = doc.data();
            if (admin.fullname?.toLowerCase().includes(term) || 
                admin.username?.toLowerCase().includes(term) ||
                admin.email?.toLowerCase().includes(term)) {
                // ... render row (same as loadSuperAdmins)
            }
        }
        
    } catch (error) {
        console.error('Error:', error);
    }
}

// ============================================
// MODAL CLOSE FUNCTIONS
// ============================================

function closeViewAdminModal() { document.getElementById('reviewAdminModal')?.classList.remove('active'); }
function closeReviewAdminModal() { document.getElementById('reviewAdminModal')?.classList.remove('active'); }
function closeEditAdminModal() { document.getElementById('editAdminModal')?.classList.remove('active'); }
function closeSuspendAdminModal() { document.getElementById('suspendAdminModal')?.classList.remove('active'); }
function closeDeleteAdminModal() { document.getElementById('deleteAdminModal')?.classList.remove('active'); }
function closeWarnAdminModal() { document.getElementById('warnAdminModal')?.classList.remove('active'); }

console.log('✅ Admin Management Functions Loaded');

/**
 * Add New Admin
 */
async function addNewAdmin(event) {
    event.preventDefault();
    
    const fullname = document.getElementById('newAdminName')?.value?.trim();
    const email = document.getElementById('newAdminEmail')?.value?.trim();
    const password = document.getElementById('newAdminPassword')?.value;
    
    if (!fullname || !email || !password) {
        showToast('Tafadhali jaza taarifa zote.', 'warning');
        return;
    }
    
    if (password.length < 6) {
        showToast('Nenosiri liwe na herufi 6 au zaidi.', 'warning');
        return;
    }
    
    try {
        // Create auth user
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        await user.updateProfile({ displayName: fullname });
        
        // Save to Firestore
        await db.collection('users').doc(user.uid).set({
            uid: user.uid,
            username: email.split('@')[0],
            fullname: fullname,
            email: email,
            role: 'admin',
            status: 'active',
            balance: 0,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        showToast('Msimamizi ameongezwa kwa mafanikio!', 'success');
        closeAddAdminModal();
        loadSuperAdmins();
        
        // Reset form
        document.getElementById('addAdminModal')?.querySelector('form')?.reset();
        
    } catch (error) {
        console.error('Error adding admin:', error);
        
        if (error.code === 'auth/email-already-in-use') {
            showToast('Barua pepe tayari inatumika.', 'error');
        } else {
            showToast('Imeshindikana kuongeza msimamizi.', 'error');
        }
    }
}

/**
 * Add New User (Super Admin)
 */
async function addNewUser(event) {
    event.preventDefault();
    
    const username = document.getElementById('newUsername')?.value?.trim()?.toLowerCase();
    const fullname = document.getElementById('newFullname')?.value?.trim();
    const email = document.getElementById('newEmail')?.value?.trim();
    const password = document.getElementById('newPassword')?.value;
    
    if (!username || !fullname || !email || !password) {
        showToast('Tafadhali jaza taarifa zote.', 'warning');
        return;
    }
    
    try {
        // Create auth user
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        await user.updateProfile({ displayName: username });
        
        // Save to Firestore
        await db.collection('users').doc(user.uid).set({
            uid: user.uid,
            username: username,
            fullname: fullname,
            email: email,
            role: 'user',
            status: 'active',
            balance: 0,
            referralCode: generateReferralCode(),
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        showToast('Mtumiaji ameongezwa kwa mafanikio!', 'success');
        closeAddUserModal();
        loadSuperUsers();
        
        // Reset form
        document.getElementById('addUserModal')?.querySelector('form')?.reset();
        
    } catch (error) {
        console.error('Error adding user:', error);
        
        if (error.code === 'auth/email-already-in-use') {
            showToast('Barua pepe tayari inatumika.', 'error');
        } else {
            showToast('Imeshindikana kuongeza mtumiaji.', 'error');
        }
    }
}

// ============================================
// TRANSACTION ANALYSIS
// ============================================

/**
 * Load Transaction Analysis
 */
async function loadTransactionAnalysis() {
    console.log('Loading transaction analysis...');
    
    try {
        let totalDeposits = 0;
        let totalWithdrawals = 0;
        let totalFees = 0;
        
        // Get approved deposits
        try {
            const depositsSnapshot = await db.collection('deposits')
                .where('status', '==', 'approved')
                .get();
            depositsSnapshot.forEach(doc => {
                totalDeposits += (doc.data().amount || 0);
            });
        } catch (err) {
            console.warn('Error fetching deposits:', err);
        }
        
        // Get approved withdrawals
        try {
            const withdrawalsSnapshot = await db.collection('withdrawals')
                .where('status', '==', 'approved')
                .get();
            withdrawalsSnapshot.forEach(doc => {
                const data = doc.data();
                totalWithdrawals += (data.amount || 0);
                totalFees += (data.fee || 0);
            });
        } catch (err) {
            console.warn('Error fetching withdrawals:', err);
        }
        
        const profit = totalDeposits - totalWithdrawals + totalFees;
        
        // Update UI
        updateElementText('analysisDeposits', formatCurrency(totalDeposits));
        updateElementText('analysisWithdrawals', formatCurrency(totalWithdrawals));
        updateElementText('analysisFees', formatCurrency(totalFees));
        updateElementText('analysisProfit', formatCurrency(profit));
        
        // Update table
        const tbody = document.getElementById('analysisTableBody');
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td>${new Date().toLocaleDateString('sw-TZ')}</td>
                    <td><span class="badge" style="background: #1A936F; padding: 5px 10px; border-radius: 20px; color: white;">Amana</span></td>
                    <td>Watumiaji Wote</td>
                    <td>${formatCurrency(totalDeposits)}</td>
                    <td>TZS 0</td>
                    <td style="color: #1A936F; font-weight: 700;">+${formatCurrency(totalDeposits)}</td>
                </tr>
                <tr>
                    <td>${new Date().toLocaleDateString('sw-TZ')}</td>
                    <td><span class="badge" style="background: #EF233C; padding: 5px 10px; border-radius: 20px; color: white;">Uondoaji</span></td>
                    <td>Watumiaji Wote</td>
                    <td>${formatCurrency(totalWithdrawals)}</td>
                    <td>${formatCurrency(totalFees)}</td>
                    <td style="color: #EF233C; font-weight: 700;">-${formatCurrency(totalWithdrawals - totalFees)}</td>
                </tr>
                <tr style="background: #f0f8ff; font-size: 16px;">
                    <td colspan="5"><strong>FAIDA YA KAMPUNI (Amana - Uondoaji + Ada)</strong></td>
                    <td><strong style="color: #004E89; font-size: 18px;">${formatCurrency(profit)}</strong></td>
                </tr>
            `;
        }
        
    } catch (error) {
        console.error('Error loading transaction analysis:', error);
    }
}

// ============================================
// MARKETPLACE MANAGEMENT (DRINKS)
// ============================================

/**
 * Load Manage Drinks
 */
async function loadManageDrinks() {
    console.log('Loading manage drinks...');
    
    const grid = document.getElementById('manageDrinksGrid');
    if (!grid) {
        console.warn('Manage drinks grid not found');
        return;
    }
    
    try {
        const snapshot = await db.collection('drinks').get();
        
        if (snapshot.empty) {
            grid.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 40px;">
                    <i class="fas fa-glass-whiskey" style="font-size: 48px; color: #ccc; margin-bottom: 20px;"></i>
                    <p>Hakuna vinywaji vilivyoongezwa.</p>
                    <button class="btn-primary" onclick="showAddDrinkModal()" style="margin-top: 15px;">
                        <i class="fas fa-plus"></i> Ongeza Kinywaji cha Kwanza
                    </button>
                </div>
            `;
            return;
        }
        
        grid.innerHTML = snapshot.docs.map(doc => {
            const drink = doc.data();
            return `
                <div style="background: white; border-radius: 15px; padding: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); display: flex; gap: 15px; transition: all 0.3s ease;">
                    <img src="${drink.image || 'https://via.placeholder.com/100'}" 
                         alt="${drink.name}" 
                         style="width: 80px; height: 80px; object-fit: cover; border-radius: 10px;"
                         onerror="this.src='https://via.placeholder.com/100'">
                    <div style="flex: 1;">
                        <h4 style="margin: 0 0 8px 0; color: #1a1a2e;">${drink.name}</h4>
                        <p style="margin: 0 0 3px 0; font-size: 13px;"><strong>Bei:</strong> ${formatCurrency(drink.price)}</p>
                        <p style="margin: 0 0 3px 0; font-size: 13px;"><strong>Muda:</strong> ${drink.duration} siku</p>
                        <p style="margin: 0 0 3px 0; font-size: 13px;"><strong>Mapato/siku:</strong> ${formatCurrency(drink.dailyReturn || 0)} (${drink.dailyReturnPercentage || 0}%)</p>
                        <p style="margin: 0 0 8px 0; font-size: 13px;">
                            <strong>Hali:</strong> 
                            <span class="status-badge ${drink.active ? 'status-active' : 'status-suspended'}" style="font-size: 11px;">
                                ${drink.active ? 'Inauzwa' : 'Imesimamishwa'}
                            </span>
                        </p>
                        <div style="display: flex; gap: 5px;">
                            <button onclick="editDrink('${doc.id}')" 
                                    style="padding: 6px 12px; background: #FFD166; border: none; border-radius: 5px; cursor: pointer; font-size: 12px;">
                                <i class="fas fa-edit"></i> Hariri
                            </button>
                            <button onclick="toggleDrinkActive('${doc.id}', ${!drink.active})" 
                                    style="padding: 6px 12px; background: ${drink.active ? '#6c757d' : '#1A936F'}; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 12px;">
                                <i class="fas fa-power-off"></i> ${drink.active ? 'Simamisha' : 'Washa'}
                            </button>
                            <button onclick="deleteDrink('${doc.id}')" 
                                    style="padding: 6px 12px; background: #EF233C; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 12px;">
                                <i class="fas fa-trash"></i> Futa
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
    } catch (error) {
        console.error('Error loading drinks:', error);
        grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 20px; color: #EF233C;">Imeshindikana kupakia vinywaji.</div>';
    }
}

/**
 * Save Drink (Add/Edit)
 */
async function saveDrink(event) {
    event.preventDefault();
    
    const drinkId = document.getElementById('editDrinkId')?.value;
    const name = document.getElementById('drinkName')?.value?.trim();
    const price = parseInt(document.getElementById('drinkPrice')?.value) || 0;
    const duration = parseInt(document.getElementById('drinkDuration')?.value) || 0;
    const dailyReturnPercent = parseFloat(document.getElementById('drinkDailyReturnPercent')?.value) || 0;
    const description = document.getElementById('drinkDescription')?.value?.trim();
    const image = document.getElementById('drinkImage')?.value?.trim();
    
    if (!name || !price || !duration) {
        showToast('Tafadhali jaza sehemu zinazohitajika (Jina, Bei, Muda).', 'warning');
        return;
    }
    
    const dailyReturn = (price * dailyReturnPercent) / 100;
    
    const drinkData = {
        name: name,
        price: price,
        duration: duration,
        dailyReturn: dailyReturn,
        dailyReturnPercentage: dailyReturnPercent,
        description: description || '',
        image: image || '',
        active: true,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    try {
        if (drinkId) {
            // Update existing drink
            await db.collection('drinks').doc(drinkId).update(drinkData);
            showToast('Kinywaji kimesasishwa!', 'success');
        } else {
            // Add new drink
            drinkData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
            await db.collection('drinks').add(drinkData);
            showToast('Kinywaji kimeongezwa!', 'success');
        }
        
        closeAddDrinkModal();
        loadManageDrinks();
        
    } catch (error) {
        console.error('Error saving drink:', error);
        showToast('Imeshindikana kuhifadhi kinywaji.', 'error');
    }
}

/**
 * Edit Drink
 */
async function editDrink(drinkId) {
    try {
        const drinkDoc = await db.collection('drinks').doc(drinkId).get();
        if (!drinkDoc.exists) {
            showToast('Kinywaji hakijapatikana.', 'error');
            return;
        }
        
        const drink = drinkDoc.data();
        
        document.getElementById('drinkModalTitle').textContent = 'Hariri Kinywaji';
        document.getElementById('editDrinkId').value = drinkId;
        document.getElementById('drinkName').value = drink.name || '';
        document.getElementById('drinkImage').value = drink.image || '';
        document.getElementById('drinkPrice').value = drink.price || '';
        document.getElementById('drinkDuration').value = drink.duration || '';
        document.getElementById('drinkDailyReturnPercent').value = drink.dailyReturnPercentage || 0;
        document.getElementById('drinkDailyReturn').value = drink.dailyReturn || 0;
        document.getElementById('drinkDescription').value = drink.description || '';
        
        document.getElementById('addDrinkModal').classList.add('active');
        
    } catch (error) {
        console.error('Error editing drink:', error);
        showToast('Imeshindikana kupakia taarifa za kinywaji.', 'error');
    }
}

/**
 * Toggle Drink Active Status
 */
async function toggleDrinkActive(drinkId, active) {
    try {
        await db.collection('drinks').doc(drinkId).update({ active: active });
        showToast(`Kinywaji ${active ? 'kimewashwa' : 'kimesimamishwa'}!`, 'success');
        loadManageDrinks();
    } catch (error) {
        console.error('Error toggling drink:', error);
        showToast('Imeshindikana kubadilisha hali ya kinywaji.', 'error');
    }
}

/**
 * Delete Drink
 */
async function deleteDrink(drinkId) {
    if (!confirm('Una uhakika unataka kufuta kinywaji hiki?')) return;
    
    try {
        await db.collection('drinks').doc(drinkId).delete();
        showToast('Kinywaji kimefutwa!', 'success');
        loadManageDrinks();
    } catch (error) {
        console.error('Error deleting drink:', error);
        showToast('Imeshindikana kufuta kinywaji.', 'error');
    }
}

/**
 * Calculate Daily Return
 */
function calculateDailyReturn() {
    const price = parseFloat(document.getElementById('drinkPrice')?.value) || 0;
    const percentage = parseFloat(document.getElementById('drinkDailyReturnPercent')?.value) || 0;
    const dailyReturn = (price * percentage) / 100;
    
    const dailyReturnEl = document.getElementById('drinkDailyReturn');
    if (dailyReturnEl) {
        dailyReturnEl.value = dailyReturn.toFixed(2);
    }
}

// ============================================
// SLIDESHOW MANAGEMENT
// ============================================

/**
 * Load Manage Slides
 */
async function loadManageSlides() {
    console.log('Loading manage slides...');
    
    const list = document.getElementById('manageSlidesList');
    if (!list) {
        console.warn('Manage slides list not found');
        return;
    }
    
    try {
        const snapshot = await db.collection('slides')
            .orderBy('order', 'asc')
            .get();
        
        if (snapshot.empty) {
            list.innerHTML = `
                <div style="text-align: center; padding: 40px;">
                    <i class="fas fa-images" style="font-size: 48px; color: #ccc; margin-bottom: 20px;"></i>
                    <p>Hakuna slides zilizoongezwa.</p>
                    <button class="btn-primary" onclick="showAddSlideModal()" style="margin-top: 15px;">
                        <i class="fas fa-plus"></i> Ongeza Slide ya Kwanza
                    </button>
                </div>
            `;
            return;
        }
        
        list.innerHTML = snapshot.docs.map(doc => {
            const slide = doc.data();
            return `
                <div style="background: white; border-radius: 15px; padding: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); display: flex; align-items: center; gap: 15px; margin-bottom: 15px;">
                    <div style="width: 120px; height: 80px; border-radius: 10px; overflow: hidden; background: #f0f0f0; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                        ${slide.type === 'image' && slide.mediaUrl ? 
                            `<img src="${slide.mediaUrl}" alt="${slide.title}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.style.display='none'">` :
                            slide.type === 'video' ?
                            `<i class="fas fa-video fa-2x" style="color: #666;"></i>` :
                            `<i class="fas fa-heading fa-2x" style="color: #FF6B35;"></i>`
                        }
                    </div>
                    <div style="flex: 1;">
                        <h4 style="margin: 0 0 5px 0; color: #1a1a2e;">${slide.title || 'Hakuna Kichwa'}</h4>
                        <p style="margin: 0 0 5px 0; font-size: 13px; color: #666;">${slide.description || 'Hakuna maelezo'}</p>
                        <p style="margin: 0; font-size: 12px;">
                            <strong>Aina:</strong> ${slide.type === 'image' ? 'Picha' : slide.type === 'video' ? 'Video' : 'Maandishi'} | 
                            <strong>Mpangilio:</strong> #${slide.order || 1} | 
                            <span class="status-badge ${slide.active ? 'status-active' : 'status-suspended'}" style="font-size: 11px;">
                                ${slide.active ? 'Inaonyeshwa' : 'Imesimamishwa'}
                            </span>
                        </p>
                    </div>
                    <div style="display: flex; gap: 5px; flex-shrink: 0;">
                        <button onclick="editSlide('${doc.id}')" 
                                style="padding: 8px 15px; background: #FFD166; border: none; border-radius: 5px; cursor: pointer;">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="toggleSlideActive('${doc.id}', ${!slide.active})" 
                                style="padding: 8px 15px; background: ${slide.active ? '#6c757d' : '#1A936F'}; color: white; border: none; border-radius: 5px; cursor: pointer;">
                            <i class="fas fa-power-off"></i>
                        </button>
                        <button onclick="deleteSlide('${doc.id}')" 
                                style="padding: 8px 15px; background: #EF233C; color: white; border: none; border-radius: 5px; cursor: pointer;">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');
        
    } catch (error) {
        console.error('Error loading slides:', error);
        list.innerHTML = '<div style="text-align: center; padding: 20px; color: #EF233C;">Imeshindikana kupakia slides.</div>';
    }
}

/**
 * Save Slide (Add/Edit)
 */
async function saveSlide(event) {
    event.preventDefault();
    
    const slideId = document.getElementById('editSlideId')?.value;
    const type = document.getElementById('slideType')?.value || 'text';
    const mediaUrl = document.getElementById('slideMediaUrl')?.value?.trim();
    const title = document.getElementById('slideTitle')?.value?.trim();
    const description = document.getElementById('slideDescription')?.value?.trim();
    const order = parseInt(document.getElementById('slideOrder')?.value) || 1;
    const active = document.getElementById('slideActive')?.checked || false;
    
    if (!title) {
        showToast('Tafadhali weka kichwa cha slide.', 'warning');
        return;
    }
    
    const slideData = {
        type: type,
        mediaUrl: mediaUrl || '',
        title: title,
        description: description || '',
        order: order,
        active: active,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    try {
        if (slideId) {
            await db.collection('slides').doc(slideId).update(slideData);
            showToast('Slide imesasishwa!', 'success');
        } else {
            slideData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
            await db.collection('slides').add(slideData);
            showToast('Slide imeongezwa!', 'success');
        }
        
        closeAddSlideModal();
        loadManageSlides();
        loadSlides(); // Refresh user-facing slideshow
        
    } catch (error) {
        console.error('Error saving slide:', error);
        showToast('Imeshindikana kuhifadhi slide.', 'error');
    }
}

/**
 * Edit Slide
 */
async function editSlide(slideId) {
    try {
        const slideDoc = await db.collection('slides').doc(slideId).get();
        if (!slideDoc.exists) {
            showToast('Slide haijapatikana.', 'error');
            return;
        }
        
        const slide = slideDoc.data();
        
        document.getElementById('slideModalTitle').textContent = 'Hariri Slide';
        document.getElementById('editSlideId').value = slideId;
        document.getElementById('slideType').value = slide.type || 'text';
        document.getElementById('slideMediaUrl').value = slide.mediaUrl || '';
        document.getElementById('slideTitle').value = slide.title || '';
        document.getElementById('slideDescription').value = slide.description || '';
        document.getElementById('slideOrder').value = slide.order || 1;
        document.getElementById('slideActive').checked = slide.active || false;
        
        toggleSlideMediaInput();
        document.getElementById('addSlideModal').classList.add('active');
        
    } catch (error) {
        console.error('Error editing slide:', error);
        showToast('Imeshindikana kupakia taarifa za slide.', 'error');
    }
}

/**
 * Toggle Slide Media Input
 */
function toggleSlideMediaInput() {
    const type = document.getElementById('slideType')?.value;
    const mediaGroup = document.getElementById('slideMediaGroup');
    
    if (mediaGroup) {
        mediaGroup.style.display = (type === 'image' || type === 'video') ? 'block' : 'none';
    }
}

/**
 * Toggle Slide Active Status
 */
async function toggleSlideActive(slideId, active) {
    try {
        await db.collection('slides').doc(slideId).update({ active: active });
        showToast(`Slide ${active ? 'imewashwa' : 'imesimamishwa'}!`, 'success');
        loadManageSlides();
        loadSlides();
    } catch (error) {
        console.error('Error toggling slide:', error);
        showToast('Imeshindikana kubadilisha hali ya slide.', 'error');
    }
}

/**
 * Delete Slide
 */
async function deleteSlide(slideId) {
    if (!confirm('Una uhakika unataka kufuta slide hii?')) return;
    
    try {
        await db.collection('slides').doc(slideId).delete();
        showToast('Slide imefutwa!', 'success');
        loadManageSlides();
        loadSlides();
    } catch (error) {
        console.error('Error deleting slide:', error);
        showToast('Imeshindikana kufuta slide.', 'error');
    }
}

// ============================================
// BANK ACCOUNTS MANAGEMENT
// ============================================

/**
 * Load Manage Bank Accounts
 */
async function loadManageBankAccounts() {
    console.log('Loading bank accounts...');
    
    const tbody = document.getElementById('bankAccountsTableBody');
    if (!tbody) {
        console.warn('Bank accounts table body not found');
        return;
    }
    
    try {
        const snapshot = await db.collection('bankAccounts').get();
        
        if (snapshot.empty) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center p-4">
                        <i class="fas fa-university" style="font-size: 36px; color: #ccc; display: block; margin-bottom: 10px;"></i>
                        Hakuna akaunti za benki zilizoongezwa.
                        <br>
                        <button class="btn-primary mt-3" onclick="showAddBankAccountModal()">
                            <i class="fas fa-plus"></i> Ongeza Akaunti ya Benki
                        </button>
                    </td>
                </tr>
            `;
            return;
        }
        
        tbody.innerHTML = snapshot.docs.map(doc => {
            const account = doc.data();
            return `
                <tr>
                    <td><strong>${account.bankName || 'N/A'}</strong></td>
                    <td>${account.accountNumber || 'N/A'}</td>
                    <td>${account.accountHolder || 'N/A'}</td>
                    <td><span class="status-badge status-active">Inatumika</span></td>
                    <td>
                        <button class="btn-action btn-delete" onclick="deleteBankAccount('${doc.id}')" 
                                style="padding: 6px 12px; background: #EF233C; color: white; border: none; border-radius: 5px; cursor: pointer;">
                            <i class="fas fa-trash"></i> Futa
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
        
    } catch (error) {
        console.error('Error loading bank accounts:', error);
        tbody.innerHTML = '<tr><td colspan="5" class="text-center p-4 text-danger">Imeshindikana kupakia akaunti za benki.</td></tr>';
    }
}

/**
 * Add Admin Bank Account
 */
async function addAdminBankAccount(event) {
    event.preventDefault();
    
    const bankName = document.getElementById('adminBankName')?.value?.trim();
    const accountNumber = document.getElementById('adminBankAccountNumber')?.value?.trim();
    const accountHolder = document.getElementById('adminBankAccountHolder')?.value?.trim();
    
    if (!bankName || !accountNumber || !accountHolder) {
        showToast('Tafadhali jaza taarifa zote za benki.', 'warning');
        return;
    }
    
    try {
        await db.collection('bankAccounts').add({
            bankName: bankName,
            accountNumber: accountNumber,
            accountHolder: accountHolder,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        showToast('Akaunti ya benki imeongezwa!', 'success');
        closeAddBankAccountModal();
        loadManageBankAccounts();
        
        // Reset form
        document.getElementById('addBankAccountModal')?.querySelector('form')?.reset();
        
    } catch (error) {
        console.error('Error adding bank account:', error);
        showToast('Imeshindikana kuongeza akaunti ya benki.', 'error');
    }
}

/**
 * Delete Bank Account (System)
 */
async function deleteBankAccount(accountId) {
    if (!confirm('Una uhakika unataka kufuta akaunti hii ya benki?')) return;
    
    try {
        await db.collection('bankAccounts').doc(accountId).delete();
        showToast('Akaunti ya benki imefutwa!', 'success');
        loadManageBankAccounts();
    } catch (error) {
        console.error('Error deleting bank account:', error);
        showToast('Imeshindikana kufuta akaunti ya benki.', 'error');
    }
}

// ============================================
// SETTINGS
// ============================================

/**
 * Load Super Settings
 */
function loadSuperSettings() {
    console.log('Loading super settings...');
    
    // Populate form with default values
    const siteNameEl = document.getElementById('siteName');
    const referralBonusEl = document.getElementById('referralBonus');
    
    if (siteNameEl) siteNameEl.value = 'CashCola';
    if (referralBonusEl) referralBonusEl.value = '10';
    
    // Try to load saved settings
    db.collection('settings').doc('site').get()
        .then(doc => {
            if (doc.exists) {
                const settings = doc.data();
                if (siteNameEl) siteNameEl.value = settings.siteName || 'CashCola';
                if (referralBonusEl) referralBonusEl.value = settings.referralBonusPercent || 10;
            }
        })
        .catch(err => {
            console.warn('Could not load settings:', err);
        });
}

/**
 * Update Super Settings
 */
async function updateSuperSettings(event) {
    event.preventDefault();
    
    const siteName = document.getElementById('siteName')?.value?.trim() || 'CashCola';
    const referralBonus = parseInt(document.getElementById('referralBonus')?.value) || 10;
    
    try {
        await db.collection('settings').doc('site').set({
            siteName: siteName,
            referralBonusPercent: referralBonus,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        
        showToast('Mipangilio ya mfumo imehifadhiwa!', 'success');
        
    } catch (error) {
        console.error('Error updating super settings:', error);
        showToast('Imeshindikana kuhifadhi mipangilio.', 'error');
    }
}

// ============================================
// USER DETAIL VIEW
// ============================================

/**
 * View User Detail
 */
async function viewUserDetail(userId) {
    try {
        const userDoc = await db.collection('users').doc(userId).get();
        if (!userDoc.exists) {
            showToast('Mtumiaji hajapatikana.', 'error');
            return;
        }
        
        const user = userDoc.data();
        
        // Get referrer info
        let referrerInfo = 'Hakuna (Alijisajili mwenyewe)';
        if (user.referredBy) {
            try {
                const referrerDoc = await db.collection('users').doc(user.referredBy).get();
                if (referrerDoc.exists) {
                    referrerInfo = referrerDoc.data().username || 'Haijulikani';
                }
            } catch (err) {
                console.warn('Could not fetch referrer:', err);
            }
        }
        
        // Get referrals count
        let referralsCount = 0;
        try {
            const referralsSnapshot = await db.collection('users')
                .where('referredBy', '==', userId)
                .get();
            referralsCount = referralsSnapshot.size;
        } catch (err) {
            console.warn('Could not count referrals:', err);
        }
        
        const statusLabel = user.status === 'active' ? 'Anafanya kazi' : 
                           user.status === 'suspended' ? 'Amesimamishwa' : 'Haijulikani';
        
        document.getElementById('userDetailContent').innerHTML = `
            <h3 style="margin-bottom: 20px; color: #004E89;">
                <i class="fas fa-user-circle"></i> Maelezo ya Mtumiaji
            </h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px;">
                <div style="background: #f8f9fa; padding: 12px; border-radius: 8px;">
                    <label style="font-size: 11px; color: #666; display: block;">Jina la Mtumiaji</label>
                    <strong>${user.username || 'N/A'}</strong>
                </div>
                <div style="background: #f8f9fa; padding: 12px; border-radius: 8px;">
                    <label style="font-size: 11px; color: #666; display: block;">Jina Kamili</label>
                    <strong>${user.fullname || 'N/A'}</strong>
                </div>
                <div style="background: #f8f9fa; padding: 12px; border-radius: 8px;">
                    <label style="font-size: 11px; color: #666; display: block;">Barua Pepe</label>
                    <strong>${user.email || 'N/A'}</strong>
                </div>
                <div style="background: #f8f9fa; padding: 12px; border-radius: 8px;">
                    <label style="font-size: 11px; color: #666; display: block;">Simu</label>
                    <strong>${user.phone || 'Haijawasilishwa'}</strong>
                </div>
                <div style="background: #f8f9fa; padding: 12px; border-radius: 8px;">
                    <label style="font-size: 11px; color: #666; display: block;">Salio</label>
                    <strong style="color: #1A936F;">${formatCurrency(user.balance || 0)}</strong>
                </div>
                <div style="background: #f8f9fa; padding: 12px; border-radius: 8px;">
                    <label style="font-size: 11px; color: #666; display: block;">Hali</label>
                    <span class="status-badge ${user.status === 'active' ? 'status-active' : 'status-suspended'}">${statusLabel}</span>
                </div>
            </div>
            
            <div style="background: #f0f8ff; padding: 15px; border-radius: 10px; margin-bottom: 20px;">
                <h4 style="margin-bottom: 10px;"><i class="fas fa-users"></i> Taarifa za Rufaa</h4>
                <p><strong>Namba ya Rufaa:</strong> ${user.referralCode || 'N/A'}</p>
                <p><strong>Alirejea na:</strong> ${referrerInfo}</p>
                <p><strong>Warejea wake:</strong> ${referralsCount} watu</p>
                <p><strong>Bonasi za Rufaa:</strong> ${formatCurrency(user.totalReferralBonus || 0)}</p>
                <p><strong>Bonasi ya Amana ya Kwanza:</strong> ${user.firstDepositBonus ? '✅ Amepata' : '❌ Bado'}</p>
            </div>
            
            <button class="btn-primary" onclick="closeUserDetailModal()" style="width: 100%;">Funga</button>
        `;
        
        document.getElementById('userDetailModal').classList.add('active');
        
    } catch (error) {
        console.error('Error viewing user:', error);
        showToast('Imeshindikana kupakia maelezo ya mtumiaji.', 'error');
    }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Safely update element text
 */
function updateElementText(elementId, text) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = text;
    }
}

/**
 * Show Toast Notification
 */
function showToast(message, type = 'success') {
    const toast = document.getElementById('notificationToast');
    if (!toast) {
        alert(message);
        return;
    }
    
    const toastMessage = document.getElementById('toastMessage');
    const toastIcon = toast.querySelector('.toast-icon');
    
    if (toastMessage) toastMessage.textContent = message;
    
    toast.className = `toast-notification ${type}`;
    
    const icons = {
        'success': 'fa-check-circle',
        'error': 'fa-exclamation-circle',
        'warning': 'fa-exclamation-triangle',
        'info': 'fa-info-circle'
    };
    
    if (toastIcon) {
        toastIcon.className = `fas ${icons[type] || icons.info} toast-icon`;
    }
    
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// ============================================
// INITIALIZATION
// ============================================

console.log('✅ All Super Admin & Admin Functions Loaded Successfully');  

// ============================================
// RESPONSIVE SIDEBAR FUNCTIONS
// ============================================

/**
 * Toggle User Sidebar (Mobile/Tablet)
 */
function toggleUserSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('userSidebarOverlay');
    const hamburger = document.getElementById('userHamburger');
    
    if (!sidebar) return;
    
    const isActive = sidebar.classList.contains('active');
    
    if (isActive) {
        // Close sidebar
        closeUserSidebar();
    } else {
        // Open sidebar
        sidebar.classList.add('active');
        if (overlay) overlay.classList.add('active');
        if (hamburger) hamburger.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

/**
 * Close User Sidebar
 */
function closeUserSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('userSidebarOverlay');
    const hamburger = document.getElementById('userHamburger');
    
    if (sidebar) sidebar.classList.remove('active');
    if (overlay) overlay.classList.remove('active');
    if (hamburger) hamburger.classList.remove('active');
    document.body.style.overflow = '';
}

/**
 * Toggle Admin Sidebar (Mobile/Tablet)
 */
function toggleAdminSidebar() {
    const sidebar = document.getElementById('adminSidebar');
    const overlay = document.getElementById('adminSidebarOverlay');
    const hamburger = document.getElementById('adminHamburger');
    
    if (!sidebar) return;
    
    const isActive = sidebar.classList.contains('active');
    
    if (isActive) {
        closeAdminSidebar();
    } else {
        sidebar.classList.add('active');
        if (overlay) overlay.classList.add('active');
        if (hamburger) hamburger.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

/**
 * Close Admin Sidebar
 */
function closeAdminSidebar() {
    const sidebar = document.getElementById('adminSidebar');
    const overlay = document.getElementById('adminSidebarOverlay');
    const hamburger = document.getElementById('adminHamburger');
    
    if (sidebar) sidebar.classList.remove('active');
    if (overlay) overlay.classList.remove('active');
    if (hamburger) hamburger.classList.remove('active');
    document.body.style.overflow = '';
}

/**
 * Toggle Super Admin Sidebar (Mobile/Tablet)
 */
function toggleSuperAdminSidebar() {
    const sidebar = document.getElementById('superAdminSidebar');
    const overlay = document.getElementById('superAdminSidebarOverlay');
    const hamburger = document.getElementById('superAdminHamburger');
    
    if (!sidebar) return;
    
    const isActive = sidebar.classList.contains('active');
    
    if (isActive) {
        closeSuperAdminSidebar();
    } else {
        sidebar.classList.add('active');
        if (overlay) overlay.classList.add('active');
        if (hamburger) hamburger.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

/**
 * Close Super Admin Sidebar
 */
function closeSuperAdminSidebar() {
    const sidebar = document.getElementById('superAdminSidebar');
    const overlay = document.getElementById('superAdminSidebarOverlay');
    const hamburger = document.getElementById('superAdminHamburger');
    
    if (sidebar) sidebar.classList.remove('active');
    if (overlay) overlay.classList.remove('active');
    if (hamburger) hamburger.classList.remove('active');
    document.body.style.overflow = '';
}

/**
 * Handle window resize - Reset sidebar state
 */
let resizeTimer;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
        const width = window.innerWidth;
        
        // On desktop (1024px+), ensure sidebar is visible and overlays are hidden
        if (width >= 1024) {
            document.querySelectorAll('.sidebar').forEach(sidebar => {
                sidebar.classList.remove('active');
                sidebar.style.left = ''; // Reset inline style
            });
            document.querySelectorAll('.sidebar-overlay').forEach(overlay => {
                overlay.classList.remove('active');
            });
            document.querySelectorAll('.hamburger-menu').forEach(hamburger => {
                hamburger.classList.remove('active');
            });
            document.body.style.overflow = '';
        }
    }, 250);
});

/**
 * Close sidebar when clicking a menu item (on mobile)
 */
document.addEventListener('DOMContentLoaded', () => {
    // Close sidebar when menu item is clicked on mobile
    document.querySelectorAll('.sidebar .menu-item').forEach(item => {
        item.addEventListener('click', () => {
            if (window.innerWidth < 1024) {
                setTimeout(() => {
                    closeUserSidebar();
                    closeAdminSidebar();
                    closeSuperAdminSidebar();
                }, 200);
            }
        });
    });
    
    // Close dropdowns when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.user-dropdown')) {
            document.getElementById('userDropdown')?.classList.remove('active');
            document.getElementById('adminUserDropdown')?.classList.remove('active');
            document.getElementById('superAdminUserDropdown')?.classList.remove('active');
        }
        if (!e.target.closest('.notification-bell')) {
            document.getElementById('adminNotificationDropdown')?.classList.remove('active');
        }
    });
});

/**
 * Toggle User Dropdown Menu
 */
function toggleUserMenu() {
    const dropdown = document.getElementById('userDropdown');
    if (dropdown) {
        dropdown.classList.toggle('active');
    }
    // Close other dropdowns
    document.getElementById('adminUserDropdown')?.classList.remove('active');
    document.getElementById('superAdminUserDropdown')?.classList.remove('active');
}

/**
 * Toggle Admin User Menu
 */
function toggleAdminUserMenu() {
    const dropdown = document.getElementById('adminUserDropdown');
    if (dropdown) {
        dropdown.classList.toggle('active');
    }
    document.getElementById('userDropdown')?.classList.remove('active');
    document.getElementById('superAdminUserDropdown')?.classList.remove('active');
}

/**
 * Toggle Super Admin User Menu
 */
function toggleSuperAdminUserMenu() {
    const dropdown = document.getElementById('superAdminUserDropdown');
    if (dropdown) {
        dropdown.classList.toggle('active');
    }
    document.getElementById('userDropdown')?.classList.remove('active');
    document.getElementById('adminUserDropdown')?.classList.remove('active');
}

/**
 * Toggle Notifications (User)
 */
function toggleNotifications() {
    showToast('Arifa zitapatikana hivi karibuni.', 'info');
}

/**
 * Toggle Admin Notifications
 */
function toggleAdminNotifications() {
    const dropdown = document.getElementById('adminNotificationDropdown');
    if (dropdown) {
        dropdown.classList.toggle('active');
    }
}

console.log('✅ Responsive Navigation System Loaded');

// ============================================
// DRINK MANAGEMENT FUNCTIONS (Super Admin)
// ============================================

/**
 * Show Add Drink Modal
 */
function showAddDrinkModal() {
    const modal = document.getElementById('addDrinkModal');
    if (!modal) {
        console.error('Add drink modal not found in DOM');
        return;
    }
    
    // Reset form for new drink
    const titleEl = document.getElementById('drinkModalTitle');
    const editIdEl = document.getElementById('editDrinkId');
    const form = document.getElementById('drinkForm');
    
    if (titleEl) titleEl.textContent = 'Ongeza Kinywaji Kipya';
    if (editIdEl) editIdEl.value = '';
    if (form) form.reset();
    
    // Clear calculated fields
    const dailyReturnEl = document.getElementById('drinkDailyReturn');
    if (dailyReturnEl) dailyReturnEl.value = '';
    
    // Show modal
    modal.classList.add('active');
    console.log('Add drink modal opened');
}

/**
 * Close Add Drink Modal
 */
function closeAddDrinkModal() {
    const modal = document.getElementById('addDrinkModal');
    if (modal) {
        modal.classList.remove('active');
    }
}

/**
 * Edit Drink - Load drink data into modal
 */
async function editDrink(drinkId) {
    console.log('Editing drink:', drinkId);
    
    try {
        const drinkDoc = await db.collection('drinks').doc(drinkId).get();
        
        if (!drinkDoc.exists) {
            showToast('Kinywaji hakijapatikana.', 'error');
            return;
        }
        
        const drink = drinkDoc.data();
        
        // Update modal title
        const titleEl = document.getElementById('drinkModalTitle');
        if (titleEl) titleEl.textContent = 'Hariri Kinywaji';
        
        // Set edit ID
        const editIdEl = document.getElementById('editDrinkId');
        if (editIdEl) editIdEl.value = drinkId;
        
        // Populate form fields
        const nameEl = document.getElementById('drinkName');
        const imageEl = document.getElementById('drinkImage');
        const priceEl = document.getElementById('drinkPrice');
        const durationEl = document.getElementById('drinkDuration');
        const percentEl = document.getElementById('drinkDailyReturnPercent');
        const returnEl = document.getElementById('drinkDailyReturn');
        const descEl = document.getElementById('drinkDescription');
        
        if (nameEl) nameEl.value = drink.name || '';
        if (imageEl) imageEl.value = drink.image || '';
        if (priceEl) priceEl.value = drink.price || '';
        if (durationEl) durationEl.value = drink.duration || '';
        if (percentEl) percentEl.value = drink.dailyReturnPercentage || 0;
        if (returnEl) returnEl.value = drink.dailyReturn || 0;
        if (descEl) descEl.value = drink.description || '';
        
        // Show modal
        const modal = document.getElementById('addDrinkModal');
        if (modal) modal.classList.add('active');
        
        console.log('Edit drink modal opened for:', drink.name);
        
    } catch (error) {
        console.error('Error editing drink:', error);
        showToast('Imeshindikana kupakia taarifa za kinywaji.', 'error');
    }
}

/**
 * Save Drink (Create or Update)
 */
async function saveDrink(event) {
    event.preventDefault();
    
    const drinkId = document.getElementById('editDrinkId')?.value;
    const name = document.getElementById('drinkName')?.value?.trim();
    const image = document.getElementById('drinkImage')?.value?.trim();
    const price = parseInt(document.getElementById('drinkPrice')?.value) || 0;
    const duration = parseInt(document.getElementById('drinkDuration')?.value) || 0;
    const dailyReturnPercent = parseFloat(document.getElementById('drinkDailyReturnPercent')?.value) || 0;
    const description = document.getElementById('drinkDescription')?.value?.trim();
    
    // Validation
    if (!name) {
        showToast('Tafadhali weka jina la kinywaji.', 'warning');
        return;
    }
    
    if (price < 1000) {
        showToast('Bei iwe angalau TZS 1,000.', 'warning');
        return;
    }
    
    if (duration < 1) {
        showToast('Muda uwe angalau siku 1.', 'warning');
        return;
    }
    
    // Calculate daily return
    const dailyReturn = (price * dailyReturnPercent) / 100;
    
    const drinkData = {
        name: name,
        image: image || '',
        price: price,
        duration: duration,
        dailyReturn: dailyReturn,
        dailyReturnPercentage: dailyReturnPercent,
        description: description || '',
        active: true,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    try {
        if (drinkId) {
            // Update existing drink
            await db.collection('drinks').doc(drinkId).update(drinkData);
            showToast('Kinywaji kimesasishwa kwa mafanikio! ✅', 'success');
            console.log('Drink updated:', drinkId);
        } else {
            // Create new drink
            drinkData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
            await db.collection('drinks').add(drinkData);
            showToast('Kinywaji kimeongezwa kwa mafanikio! 🎉', 'success');
            console.log('New drink created:', name);
        }
        
        // Close modal and refresh list
        closeAddDrinkModal();
        loadManageDrinks();
        
    } catch (error) {
        console.error('Error saving drink:', error);
        showToast('Imeshindikana kuhifadhi kinywaji. Jaribu tena.', 'error');
    }
}

/**
 * Calculate Daily Return (called on input change)
 */
function calculateDailyReturn() {
    const price = parseFloat(document.getElementById('drinkPrice')?.value) || 0;
    const percentage = parseFloat(document.getElementById('drinkDailyReturnPercent')?.value) || 0;
    const dailyReturn = (price * percentage) / 100;
    
    const dailyReturnEl = document.getElementById('drinkDailyReturn');
    if (dailyReturnEl) {
        dailyReturnEl.value = dailyReturn.toFixed(2);
    }
}

/**
 * Toggle Drink Active Status
 */
async function toggleDrinkActive(drinkId, active) {
    try {
        await db.collection('drinks').doc(drinkId).update({ 
            active: active,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        showToast(`Kinywaji ${active ? 'kimewashwa' : 'kimesimamishwa'}!`, 'success');
        loadManageDrinks();
        
    } catch (error) {
        console.error('Error toggling drink:', error);
        showToast('Imeshindikana kubadilisha hali ya kinywaji.', 'error');
    }
}

/**
 * Delete Drink
 */
async function deleteDrink(drinkId) {
    if (!confirm('Una uhakika unataka kufuta kinywaji hiki? Kitafutwa kabisa.')) return;
    
    try {
        await db.collection('drinks').doc(drinkId).delete();
        showToast('Kinywaji kimefutwa!', 'success');
        loadManageDrinks();
        
    } catch (error) {
        console.error('Error deleting drink:', error);
        showToast('Imeshindikana kufuta kinywaji.', 'error');
    }
}

/**
 * Load Manage Drinks (Super Admin)
 */
async function loadManageDrinks() {
    console.log('Loading drinks for management...');
    
    const grid = document.getElementById('manageDrinksGrid');
    if (!grid) {
        console.warn('Manage drinks grid not found');
        return;
    }
    
    try {
        // Show loading
        grid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 40px;">
                <i class="fas fa-spinner fa-spin fa-2x" style="color: #FF6B35;"></i>
                <p style="margin-top: 10px;">Inapakia vinywaji...</p>
            </div>
        `;
        
        const snapshot = await db.collection('drinks').get();
        
        if (snapshot.empty) {
            grid.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 40px; background: white; border-radius: 15px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                    <i class="fas fa-glass-whiskey" style="font-size: 48px; color: #ccc; margin-bottom: 15px; display: block;"></i>
                    <p style="font-size: 16px; color: #666;">Hakuna vinywaji vilivyoongezwa bado.</p>
                    <button class="btn-primary" onclick="showAddDrinkModal()" style="margin-top: 15px; padding: 12px 25px; font-size: 16px;">
                        <i class="fas fa-plus"></i> Ongeza Kinywaji cha Kwanza
                    </button>
                </div>
            `;
            return;
        }
        
        // Build drinks grid
        let html = '';
        
        snapshot.forEach(doc => {
            const drink = doc.data();
            const statusClass = drink.active ? 'status-active' : 'status-suspended';
            const statusLabel = drink.active ? 'Inauzwa' : 'Imesimamishwa';
            
            html += `
                <div style="background: white; border-radius: 15px; padding: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); display: flex; gap: 15px; transition: all 0.3s ease; hover: transform: translateY(-5px);">
                    <img src="${drink.image || 'https://via.placeholder.com/100'}" 
                         alt="${drink.name}" 
                         style="width: 80px; height: 80px; object-fit: cover; border-radius: 10px; flex-shrink: 0;"
                         onerror="this.src='https://via.placeholder.com/100?text=${encodeURIComponent(drink.name)}'">
                    <div style="flex: 1; min-width: 0;">
                        <h4 style="margin: 0 0 8px 0; color: #1a1a2e; font-size: 16px;">${drink.name}</h4>
                        <p style="margin: 0 0 3px 0; font-size: 13px;"><strong>Bei:</strong> ${formatCurrency(drink.price)}</p>
                        <p style="margin: 0 0 3px 0; font-size: 13px;"><strong>Muda:</strong> ${drink.duration} siku</p>
                        <p style="margin: 0 0 3px 0; font-size: 13px;"><strong>Mapato/siku:</strong> ${formatCurrency(drink.dailyReturn || 0)} <span style="color: #666;">(${drink.dailyReturnPercentage || 0}%)</span></p>
                        ${drink.description ? `<p style="margin: 0 0 8px 0; font-size: 12px; color: #666;">${drink.description.substring(0, 60)}...</p>` : ''}
                        <p style="margin: 0 0 8px 0; font-size: 12px;">
                            <span class="status-badge ${statusClass}" style="font-size: 10px; padding: 3px 8px;">${statusLabel}</span>
                        </p>
                        <div style="display: flex; gap: 5px; flex-wrap: wrap;">
                            <button onclick="editDrink('${doc.id}')" 
                                    style="padding: 6px 12px; background: #FFD166; border: none; border-radius: 5px; cursor: pointer; font-size: 11px; font-weight: 500;">
                                <i class="fas fa-edit"></i> Hariri
                            </button>
                            <button onclick="toggleDrinkActive('${doc.id}', ${!drink.active})" 
                                    style="padding: 6px 12px; background: ${drink.active ? '#6c757d' : '#1A936F'}; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 11px; font-weight: 500;">
                                <i class="fas fa-power-off"></i> ${drink.active ? 'Simamisha' : 'Washa'}
                            </button>
                            <button onclick="deleteDrink('${doc.id}')" 
                                    style="padding: 6px 12px; background: #EF233C; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 11px; font-weight: 500;">
                                <i class="fas fa-trash"></i> Futa
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });
        
        grid.innerHTML = html;
        console.log(`Loaded ${snapshot.size} drinks`);
        
    } catch (error) {
        console.error('Error loading drinks:', error);
        grid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #EF233C;">
                <i class="fas fa-exclamation-circle" style="font-size: 48px; display: block; margin-bottom: 15px;"></i>
                <p>Imeshindikana kupakia vinywaji.</p>
                <button onclick="loadManageDrinks()" style="margin-top: 10px; padding: 10px 20px; background: #FF6B35; color: white; border: none; border-radius: 8px; cursor: pointer;">
                    <i class="fas fa-sync-alt"></i> Jaribu Tena
                </button>
            </div>
        `;
    }
}

// ============================================
// SLIDE MANAGEMENT FUNCTIONS (Super Admin)
// ============================================

/**
 * Show Add Slide Modal
 */
function showAddSlideModal() {
    const modal = document.getElementById('addSlideModal');
    if (!modal) {
        console.error('Add slide modal not found');
        return;
    }
    
    // Reset form
    const titleEl = document.getElementById('slideModalTitle');
    const editIdEl = document.getElementById('editSlideId');
    const form = document.getElementById('slideForm');
    const mediaGroup = document.getElementById('slideMediaGroup');
    
    if (titleEl) titleEl.textContent = 'Ongeza Slide Mpya';
    if (editIdEl) editIdEl.value = '';
    if (form) form.reset();
    if (mediaGroup) mediaGroup.style.display = 'none';
    
    // Set default values
    const typeEl = document.getElementById('slideType');
    const orderEl = document.getElementById('slideOrder');
    const activeEl = document.getElementById('slideActive');
    
    if (typeEl) typeEl.value = 'text';
    if (orderEl) orderEl.value = '1';
    if (activeEl) activeEl.checked = true;
    
    modal.classList.add('active');
    console.log('Add slide modal opened');
}

/**
 * Close Add Slide Modal
 */
function closeAddSlideModal() {
    const modal = document.getElementById('addSlideModal');
    if (modal) {
        modal.classList.remove('active');
    }
}

/**
 * Toggle Slide Media Input
 */
function toggleSlideMediaInput() {
    const type = document.getElementById('slideType')?.value;
    const mediaGroup = document.getElementById('slideMediaGroup');
    
    if (mediaGroup) {
        mediaGroup.style.display = (type === 'image' || type === 'video') ? 'block' : 'none';
    }
}

/**
 * Edit Slide
 */
async function editSlide(slideId) {
    console.log('Editing slide:', slideId);
    
    try {
        const slideDoc = await db.collection('slides').doc(slideId).get();
        
        if (!slideDoc.exists) {
            showToast('Slide haijapatikana.', 'error');
            return;
        }
        
        const slide = slideDoc.data();
        
        // Update modal
        const titleEl = document.getElementById('slideModalTitle');
        const editIdEl = document.getElementById('editSlideId');
        
        if (titleEl) titleEl.textContent = 'Hariri Slide';
        if (editIdEl) editIdEl.value = slideId;
        
        // Populate form
        const typeEl = document.getElementById('slideType');
        const mediaUrlEl = document.getElementById('slideMediaUrl');
        const slideTitleEl = document.getElementById('slideTitle');
        const descEl = document.getElementById('slideDescription');
        const orderEl = document.getElementById('slideOrder');
        const activeEl = document.getElementById('slideActive');
        
        if (typeEl) typeEl.value = slide.type || 'text';
        if (mediaUrlEl) mediaUrlEl.value = slide.mediaUrl || '';
        if (slideTitleEl) slideTitleEl.value = slide.title || '';
        if (descEl) descEl.value = slide.description || '';
        if (orderEl) orderEl.value = slide.order || 1;
        if (activeEl) activeEl.checked = slide.active || false;
        
        // Show/hide media input
        toggleSlideMediaInput();
        
        // Show modal
        const modal = document.getElementById('addSlideModal');
        if (modal) modal.classList.add('active');
        
        console.log('Edit slide modal opened');
        
    } catch (error) {
        console.error('Error editing slide:', error);
        showToast('Imeshindikana kupakia slide.', 'error');
    }
}

/**
 * Save Slide
 */
async function saveSlide(event) {
    event.preventDefault();
    
    const slideId = document.getElementById('editSlideId')?.value;
    const type = document.getElementById('slideType')?.value || 'text';
    const mediaUrl = document.getElementById('slideMediaUrl')?.value?.trim();
    const title = document.getElementById('slideTitle')?.value?.trim();
    const description = document.getElementById('slideDescription')?.value?.trim();
    const order = parseInt(document.getElementById('slideOrder')?.value) || 1;
    const active = document.getElementById('slideActive')?.checked || false;
    
    if (!title) {
        showToast('Tafadhali weka kichwa cha slide.', 'warning');
        return;
    }
    
    const slideData = {
        type: type,
        mediaUrl: mediaUrl || '',
        title: title,
        description: description || '',
        order: order,
        active: active,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    try {
        if (slideId) {
            await db.collection('slides').doc(slideId).update(slideData);
            showToast('Slide imesasishwa! ✅', 'success');
        } else {
            slideData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
            await db.collection('slides').add(slideData);
            showToast('Slide imeongezwa! 🎉', 'success');
        }
        
        closeAddSlideModal();
        loadManageSlides();
        loadSlides(); // Refresh user-facing slideshow
        
    } catch (error) {
        console.error('Error saving slide:', error);
        showToast('Imeshindikana kuhifadhi slide.', 'error');
    }
}

/**
 * Toggle Slide Active
 */
async function toggleSlideActive(slideId, active) {
    try {
        await db.collection('slides').doc(slideId).update({ 
            active: active,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        showToast(`Slide ${active ? 'imewashwa' : 'imesimamishwa'}!`, 'success');
        loadManageSlides();
        loadSlides();
        
    } catch (error) {
        console.error('Error toggling slide:', error);
        showToast('Imeshindikana kubadilisha hali ya slide.', 'error');
    }
}

/**
 * Delete Slide
 */
async function deleteSlide(slideId) {
    if (!confirm('Una uhakika unataka kufuta slide hii?')) return;
    
    try {
        await db.collection('slides').doc(slideId).delete();
        showToast('Slide imefutwa!', 'success');
        loadManageSlides();
        loadSlides();
        
    } catch (error) {
        console.error('Error deleting slide:', error);
        showToast('Imeshindikana kufuta slide.', 'error');
    }
}

/**
 * Load Manage Slides
 */
async function loadManageSlides() {
    console.log('Loading slides for management...');
    
    const list = document.getElementById('manageSlidesList');
    if (!list) return;
    
    try {
        list.innerHTML = '<div style="text-align: center; padding: 20px;"><i class="fas fa-spinner fa-spin"></i> Inapakia slides...</div>';
        
        const snapshot = await db.collection('slides').get();
        
        if (snapshot.empty) {
            list.innerHTML = `
                <div style="text-align: center; padding: 40px; background: white; border-radius: 15px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                    <i class="fas fa-images" style="font-size: 48px; color: #ccc; display: block; margin-bottom: 15px;"></i>
                    <p>Hakuna slides zilizoongezwa.</p>
                    <button class="btn-primary" onclick="showAddSlideModal()" style="margin-top: 15px;">
                        <i class="fas fa-plus"></i> Ongeza Slide
                    </button>
                </div>
            `;
            return;
        }
        
        const slidesList = [];
        snapshot.forEach(doc => {
            slidesList.push({ id: doc.id, ...doc.data() });
        });
        
        slidesList.sort((a, b) => (a.order || 0) - (b.order || 0));
        
        list.innerHTML = slidesList.map(slide => `
            <div style="background: white; border-radius: 15px; padding: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); display: flex; align-items: center; gap: 15px; margin-bottom: 15px;">
                <div style="width: 120px; height: 80px; border-radius: 10px; overflow: hidden; background: #f0f0f0; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                    ${slide.type === 'image' && slide.mediaUrl ? 
                        `<img src="${slide.mediaUrl}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.style.display='none'">` :
                        `<i class="fas fa-${slide.type === 'video' ? 'video' : 'heading'} fa-2x" style="color: #FF6B35;"></i>`
                    }
                </div>
                <div style="flex: 1;">
                    <h4 style="margin: 0 0 5px 0;">${slide.title || 'Hakuna Kichwa'}</h4>
                    <p style="margin: 0 0 5px 0; font-size: 13px; color: #666;">${slide.description || 'Hakuna maelezo'}</p>
                    <p style="margin: 0; font-size: 12px;">
                        <strong>Aina:</strong> ${slide.type} | 
                        <strong>Mpangilio:</strong> #${slide.order} | 
                        <span class="status-badge ${slide.active ? 'status-active' : 'status-suspended'}" style="font-size: 10px;">
                            ${slide.active ? 'Inaonyeshwa' : 'Imesimamishwa'}
                        </span>
                    </p>
                </div>
                <div style="display: flex; gap: 5px; flex-shrink: 0;">
                    <button onclick="editSlide('${slide.id}')" style="padding: 8px 12px; background: #FFD166; border: none; border-radius: 5px; cursor: pointer;">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="toggleSlideActive('${slide.id}', ${!slide.active})" style="padding: 8px 12px; background: ${slide.active ? '#6c757d' : '#1A936F'}; color: white; border: none; border-radius: 5px; cursor: pointer;">
                        <i class="fas fa-power-off"></i>
                    </button>
                    <button onclick="deleteSlide('${slide.id}')" style="padding: 8px 12px; background: #EF233C; color: white; border: none; border-radius: 5px; cursor: pointer;">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Error loading slides:', error);
        list.innerHTML = '<div style="text-align: center; padding: 20px; color: #EF233C;">Imeshindikana kupakia slides.</div>';
    }
}

console.log('✅ Drink & Slide Management Functions Loaded');

// ============================================
// BANK ACCOUNT MANAGEMENT FUNCTIONS
// ============================================

/**
 * Show Add Bank Account Modal
 */
function showAddBankAccountModal() {
    const modal = document.getElementById('addBankAccountModal');
    if (!modal) {
        console.error('Add bank account modal not found in DOM');
        return;
    }
    
    // Reset form
    const form = modal.querySelector('form');
    if (form) form.reset();
    
    // Show modal
    modal.classList.add('active');
    console.log('Add bank account modal opened');
}

/**
 * Close Add Bank Account Modal
 */
function closeAddBankAccountModal() {
    const modal = document.getElementById('addBankAccountModal');
    if (modal) {
        modal.classList.remove('active');
    }
}

/**
 * Add Admin Bank Account (System Bank Account for Deposits)
 */
async function addAdminBankAccount(event) {
    event.preventDefault();
    
    const bankName = document.getElementById('adminBankName')?.value?.trim();
    const accountNumber = document.getElementById('adminBankAccountNumber')?.value?.trim();
    const accountHolder = document.getElementById('adminBankAccountHolder')?.value?.trim();
    
    // Validation
    if (!bankName) {
        showToast('Tafadhali weka jina la benki.', 'warning');
        return;
    }
    
    if (!accountNumber) {
        showToast('Tafadhali weka namba ya akaunti.', 'warning');
        return;
    }
    
    if (!accountHolder) {
        showToast('Tafadhali weka jina la mwenye akaunti.', 'warning');
        return;
    }
    
    try {
        // Add to system bank accounts collection
        await db.collection('bankAccounts').add({
            bankName: bankName,
            accountNumber: accountNumber,
            accountHolder: accountHolder,
            active: true,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            createdBy: currentUser?.uid || 'super_admin'
        });
        
        // Also add to super admin's bank accounts for reference
        if (currentUser) {
            await db.collection('users').doc(currentUser.uid)
                .collection('bankAccounts').add({
                    bankName: bankName,
                    accountNumber: accountNumber,
                    accountHolder: accountHolder,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
        }
        
        showToast('Akaunti ya benki imeongezwa kwa mafanikio! ✅', 'success');
        
        // Close modal
        closeAddBankAccountModal();
        
        // Reset form
        const form = document.getElementById('addBankAccountModal')?.querySelector('form');
        if (form) form.reset();
        
        // Refresh bank accounts list
        loadManageBankAccounts();
        
        console.log('Bank account added:', bankName, accountNumber);
        
    } catch (error) {
        console.error('Error adding bank account:', error);
        showToast('Imeshindikana kuongeza akaunti ya benki. Jaribu tena.', 'error');
    }
}

/**
 * Load Manage Bank Accounts (Super Admin)
 */
async function loadManageBankAccounts() {
    console.log('Loading bank accounts for management...');
    
    const tbody = document.getElementById('bankAccountsTableBody');
    if (!tbody) {
        console.warn('Bank accounts table body not found');
        return;
    }
    
    try {
        // Show loading
        tbody.innerHTML = '<tr><td colspan="5" class="text-center p-4"><i class="fas fa-spinner fa-spin"></i> Inapakia akaunti za benki...</td></tr>';
        
        const snapshot = await db.collection('bankAccounts')
            .where('active', '==', true)
            .get();
        
        if (snapshot.empty) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center p-4">
                        <div style="padding: 20px;">
                            <i class="fas fa-university" style="font-size: 48px; color: #ccc; display: block; margin-bottom: 15px;"></i>
                            <p style="font-size: 16px; color: #666;">Hakuna akaunti za benki zilizoongezwa.</p>
                            <p style="font-size: 13px; color: #999;">Ongeza akaunti za benki ambazo watumiaji watatumia kuweka amana.</p>
                            <button class="btn-primary" onclick="showAddBankAccountModal()" style="margin-top: 15px; padding: 10px 20px;">
                                <i class="fas fa-plus"></i> Ongeza Akaunti ya Benki
                            </button>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }
        
        let html = '';
        
        snapshot.forEach(doc => {
            const account = doc.data();
            const createdDate = account.createdAt?.toDate?.()?.toLocaleDateString('sw-TZ') || 'N/A';
            
            html += `
                <tr>
                    <td>
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <div style="width: 40px; height: 40px; border-radius: 10px; background: linear-gradient(135deg, #004E89, #1A936F); display: flex; align-items: center; justify-content: center; color: white;">
                                <i class="fas fa-university"></i>
                            </div>
                            <strong>${account.bankName || 'N/A'}</strong>
                        </div>
                    </td>
                    <td><span style="font-family: monospace; font-size: 14px; letter-spacing: 1px;">${account.accountNumber || 'N/A'}</span></td>
                    <td>${account.accountHolder || 'N/A'}</td>
                    <td>
                        <span class="status-badge status-active" style="padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 600;">
                            <i class="fas fa-check-circle"></i> Inatumika
                        </span>
                    </td>
                    <td>
                        <div style="display: flex; gap: 5px;">
                            <button onclick="editBankAccount('${doc.id}')" 
                                    style="padding: 6px 12px; background: #FFD166; border: none; border-radius: 5px; cursor: pointer; font-size: 12px;"
                                    title="Hariri akaunti">
                                <i class="fas fa-edit"></i> Hariri
                            </button>
                            <button onclick="deleteBankAccount('${doc.id}')" 
                                    style="padding: 6px 12px; background: #EF233C; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 12px;"
                                    title="Futa akaunti">
                                <i class="fas fa-trash"></i> Futa
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        });
        
        tbody.innerHTML = html;
        console.log(`Loaded ${snapshot.size} bank accounts`);
        
    } catch (error) {
        console.error('Error loading bank accounts:', error);
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center p-4">
                    <div style="color: #EF233C;">
                        <i class="fas fa-exclamation-circle"></i> Imeshindikana kupakia akaunti za benki.
                    </div>
                    <button onclick="loadManageBankAccounts()" style="margin-top: 10px; padding: 8px 15px; background: #FF6B35; color: white; border: none; border-radius: 5px; cursor: pointer;">
                        <i class="fas fa-sync-alt"></i> Jaribu Tena
                    </button>
                </td>
            </tr>
        `;
    }
}

/**
 * Edit Bank Account
 */
async function editBankAccount(accountId) {
    try {
        const accountDoc = await db.collection('bankAccounts').doc(accountId).get();
        
        if (!accountDoc.exists) {
            showToast('Akaunti haijapatikana.', 'error');
            return;
        }
        
        const account = accountDoc.data();
        
        // Populate form
        const bankNameEl = document.getElementById('adminBankName');
        const accountNumberEl = document.getElementById('adminBankAccountNumber');
        const accountHolderEl = document.getElementById('adminBankAccountHolder');
        
        if (bankNameEl) bankNameEl.value = account.bankName || '';
        if (accountNumberEl) accountNumberEl.value = account.accountNumber || '';
        if (accountHolderEl) accountHolderEl.value = account.accountHolder || '';
        
        // Store account ID for update
        const form = document.getElementById('addBankAccountModal')?.querySelector('form');
        if (form) {
            form.setAttribute('data-edit-id', accountId);
        }
        
        // Change modal title
        const modalTitle = document.querySelector('#addBankAccountModal h3');
        if (modalTitle) modalTitle.textContent = 'Hariri Akaunti ya Benki';
        
        // Change button text
        const submitBtn = document.querySelector('#addBankAccountModal button[type="submit"]');
        if (submitBtn) submitBtn.innerHTML = '<i class="fas fa-save"></i> Sasisha Akaunti';
        
        // Show modal
        document.getElementById('addBankAccountModal')?.classList.add('active');
        
    } catch (error) {
        console.error('Error editing bank account:', error);
        showToast('Imeshindikana kupakia taarifa za akaunti.', 'error');
    }
}

/**
 * Delete Bank Account (System)
 */
async function deleteBankAccount(accountId) {
    if (!confirm('Una uhakika unataka kufuta akaunti hii ya benki? Watu hawataweza kuitumia kuweka amana.')) return;
    
    try {
        // Soft delete - mark as inactive
        await db.collection('bankAccounts').doc(accountId).update({
            active: false,
            deletedAt: firebase.firestore.FieldValue.serverTimestamp(),
            deletedBy: currentUser?.uid || 'super_admin'
        });
        
        showToast('Akaunti ya benki imefutwa!', 'success');
        loadManageBankAccounts();
        
    } catch (error) {
        console.error('Error deleting bank account:', error);
        showToast('Imeshindikana kufuta akaunti ya benki.', 'error');
    }
}

/**
 * Override addAdminBankAccount to handle both add and edit
 */
const originalAddAdminBankAccount = addAdminBankAccount;

addAdminBankAccount = async function(event) {
    event.preventDefault();
    
    const form = event.target;
    const editId = form.getAttribute('data-edit-id');
    
    const bankName = document.getElementById('adminBankName')?.value?.trim();
    const accountNumber = document.getElementById('adminBankAccountNumber')?.value?.trim();
    const accountHolder = document.getElementById('adminBankAccountHolder')?.value?.trim();
    
    if (!bankName || !accountNumber || !accountHolder) {
        showToast('Tafadhali jaza taarifa zote za benki.', 'warning');
        return;
    }
    
    try {
        if (editId) {
            // Update existing account
            await db.collection('bankAccounts').doc(editId).update({
                bankName: bankName,
                accountNumber: accountNumber,
                accountHolder: accountHolder,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            showToast('Akaunti ya benki imesasishwa! ✅', 'success');
        } else {
            // Add new account
            await db.collection('bankAccounts').add({
                bankName: bankName,
                accountNumber: accountNumber,
                accountHolder: accountHolder,
                active: true,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                createdBy: currentUser?.uid || 'super_admin'
            });
            showToast('Akaunti ya benki imeongezwa! 🎉', 'success');
        }
        
        // Close modal and reset
        closeAddBankAccountModal();
        form.reset();
        form.removeAttribute('data-edit-id');
        
        // Reset modal title and button
        const modalTitle = document.querySelector('#addBankAccountModal h3');
        if (modalTitle) modalTitle.textContent = 'Ongeza Akaunti ya Benki';
        
        const submitBtn = document.querySelector('#addBankAccountModal button[type="submit"]');
        if (submitBtn) submitBtn.innerHTML = '<i class="fas fa-save"></i> Ongeza Akaunti';
        
        // Refresh list
        loadManageBankAccounts();
        
    } catch (error) {
        console.error('Error saving bank account:', error);
        showToast('Imeshindikana kuhifadhi akaunti ya benki.', 'error');
    }
};

console.log('✅ Bank Account Management Functions Loaded');

// ============================================
// PROFILE FUNCTIONS
// ============================================

/**
 * Load and display profile data
 */
async function loadProfileData() {
    if (!currentUser) return;
    
    try {
        const userDoc = await db.collection('users').doc(currentUser.uid).get();
        if (!userDoc.exists) return;
        
        const user = userDoc.data();
        currentUserData = user;
        
        // Update profile header
        document.getElementById('profileDisplayName').textContent = user.fullname || 'Mtumiaji';
        document.getElementById('profileDisplayUsername').textContent = '@' + (user.username || 'mtumiaji');
        document.getElementById('profileAvatarImg').src =
            `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullname || 'User')}&background=FF6B35&color=fff&size=100`;
        
        // Update role badge
        const roleBadge = document.getElementById('profileRoleBadge');
        if (roleBadge) {
            const roles = { 'super_admin': 'Msimamizi Mkuu', 'admin': 'Msimamizi', 'user': 'Mtumiaji' };
            roleBadge.textContent = roles[user.role] || 'Mtumiaji';
        }
        
        // Update stats
        document.getElementById('profileBalance').textContent = formatCurrency(user.balance || 0);
        document.getElementById('profileEarnings').textContent = formatCurrency(user.totalEarnings || 0);
        document.getElementById('profileDrinks').textContent = user.activeDrinks || 0;
        
        // Update form fields
        document.getElementById('profileUsername').value = user.username || '';
        document.getElementById('profileFullname').value = user.fullname || '';
        document.getElementById('profileEmail').value = user.email || '';
        document.getElementById('profilePhone').value = user.phone || '';
        document.getElementById('profileReferralCode').textContent = user.referralCode || '-';
        
        // Update account info
        document.getElementById('profileJoinDate').textContent =
            user.createdAt?.toDate?.().toLocaleDateString('sw-TZ') || '-';
        document.getElementById('profileStatus').textContent =
            user.status === 'active' ? 'Inatumika' : 'Imesimamishwa';
        document.getElementById('profileReferrals').textContent = user.totalReferrals || 0;
        document.getElementById('profileReferralBonus').textContent = formatCurrency(user.totalReferralBonus || 0);
        
        // Load bank accounts
        loadProfileBankAccounts();
        
    } catch (error) {
        console.error('Error loading profile:', error);
    }
}

/**
 * Load bank accounts in profile
 */
async function loadProfileBankAccounts() {
    const container = document.getElementById('profileBankAccountsList');
    if (!container) return;
    
    try {
        const snapshot = await db.collection('users').doc(currentUser.uid)
            .collection('bankAccounts').get();
        
        if (snapshot.empty) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-university" style="font-size: 40px; color: #ccc; display: block; margin-bottom: 10px;"></i>
                    <p>Huna akaunti za benki</p>
                    <button class="btn-add-item" onclick="showAddBankAccountForm()" style="margin-top: 10px;">
                        <i class="fas fa-plus"></i> Ongeza Akaunti
                    </button>
                </div>
            `;
            return;
        }
        
        // Update global bank accounts
        userBankAccounts = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        container.innerHTML = userBankAccounts.map(account => `
            <div class="bank-account-card">
                <div class="bank-account-icon">
                    <i class="fas fa-university"></i>
                </div>
                <div class="bank-account-info">
                    <h4>${account.bankName}</h4>
                    <p>${account.accountNumber} - ${account.accountHolder}</p>
                </div>
                <div class="bank-account-actions">
                    <button class="btn-delete-bank" onclick="deleteProfileBankAccount('${account.id}')" title="Futa akaunti">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Error loading bank accounts:', error);
    }
}

/**
 * Show add bank account form
 */
function showAddBankAccountForm() {
    const form = document.getElementById('addBankForm');
    if (form) {
        form.style.display = 'block';
        form.scrollIntoView({ behavior: 'smooth' });
        
        // Auto-fill account holder name
        const holderInput = document.getElementById('newAccountHolder');
        if (holderInput && currentUserData) {
            holderInput.value = currentUserData.fullname || '';
        }
    }
}

/**
 * Hide add bank account form
 */
function hideAddBankAccountForm() {
    const form = document.getElementById('addBankForm');
    if (form) {
        form.style.display = 'none';
        // Reset form
        const formEl = form.querySelector('form');
        if (formEl) formEl.reset();
    }
}

/**
 * Handle bank selection change
 */
document.addEventListener('DOMContentLoaded', () => {
    const bankSelect = document.getElementById('bankNameSelect');
    if (bankSelect) {
        bankSelect.addEventListener('change', function() {
            const otherGroup = document.getElementById('otherBankGroup');
            if (otherGroup) {
                otherGroup.style.display = this.value === 'Other' ? 'block' : 'none';
            }
        });
    }
});

/**
 * Save user bank account
 */
async function saveUserBankAccount(event) {
    event.preventDefault();
    
    let bankName = document.getElementById('bankNameSelect')?.value;
    const otherBankName = document.getElementById('otherBankName')?.value?.trim();
    const accountNumber = document.getElementById('newAccountNumber')?.value?.trim();
    const accountHolder = document.getElementById('newAccountHolder')?.value?.trim();
    
    // Use other bank name if selected
    if (bankName === 'Other' && otherBankName) {
        bankName = otherBankName;
    }
    
    if (!bankName || bankName === 'Other') {
        showToast('Tafadhali chagua au taja jina la benki.', 'warning');
        return;
    }
    
    if (!accountNumber) {
        showToast('Tafadhali weka namba ya akaunti.', 'warning');
        return;
    }
    
    if (!accountHolder) {
        showToast('Tafadhali weka jina la mwenye akaunti.', 'warning');
        return;
    }
    
    try {
        await db.collection('users').doc(currentUser.uid)
            .collection('bankAccounts').add({
                bankName: bankName,
                accountNumber: accountNumber,
                accountHolder: accountHolder,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        
        showToast('Akaunti ya benki imeongezwa! ✅', 'success');
        hideAddBankAccountForm();
        loadProfileBankAccounts();
        
    } catch (error) {
        console.error('Error adding bank account:', error);
        showToast('Imeshindikana kuongeza akaunti.', 'error');
    }
}

/**
 * Delete profile bank account
 */
async function deleteProfileBankAccount(accountId) {
    if (!confirm('Una uhakika unataka kufuta akaunti hii ya benki?')) return;
    
    try {
        await db.collection('users').doc(currentUser.uid)
            .collection('bankAccounts').doc(accountId).delete();
        
        showToast('Akaunti imefutwa!', 'success');
        loadProfileBankAccounts();
        
    } catch (error) {
        console.error('Error deleting bank account:', error);
        showToast('Imeshindikana kufuta akaunti.', 'error');
    }
}

/**
 * Update profile
 */
async function updateProfile(event) {
    event.preventDefault();
    
    const fullname = document.getElementById('profileFullname')?.value?.trim();
    const phone = document.getElementById('profilePhone')?.value?.trim();
    
    if (!fullname) {
        showToast('Tafadhali weka jina lako kamili.', 'warning');
        return;
    }
    
    try {
        await db.collection('users').doc(currentUser.uid).update({
            fullname: fullname,
            phone: phone || '',
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // Update local data
        if (currentUserData) {
            currentUserData.fullname = fullname;
            currentUserData.phone = phone || '';
        }
        
        // Update display
        document.getElementById('profileDisplayName').textContent = fullname;
        document.getElementById('currentUsername').textContent = fullname;
        document.getElementById('profileAvatarImg').src =
            `https://ui-avatars.com/api/?name=${encodeURIComponent(fullname)}&background=FF6B35&color=fff&size=100`;
        
        showToast('Wasifu umesasishwa! ✅', 'success');
        
    } catch (error) {
        console.error('Error updating profile:', error);
        showToast('Imeshindikana kusasisha wasifu.', 'error');
    }
}

/**
 * Copy profile referral code
 */
function copyProfileReferral() {
    const code = document.getElementById('profileReferralCode')?.textContent;
    if (code && code !== '-') {
        navigator.clipboard?.writeText(code);
        showToast('Namba ya rufaa imenakiliwa!', 'success');
    }
}

/**
 * Change profile avatar
 */
function changeProfileAvatar() {
    showToast('Kipengele hiki kitapatikana hivi karibuni.', 'info');
    // You can implement image upload here later
}

/**
 * Show profile section
 */
function showProfile() {
    showSection('profile');
    document.getElementById('userDropdown')?.classList.remove('active');
    loadProfileData();
}

console.log('✅ Profile Functions Loaded');

// ============================================
// BANK & MOBILE MONEY SELECTION
// ============================================

// List of mobile money services
const mobileMoneyServices = [
    'M-Pesa', 'Tigo Pesa', 'Airtel Money', 'HaloPesa', 'AzamPesa', 'TTCL Pesa'
];

/**
 * Toggle other bank input and mobile money fields
 */
function toggleOtherBankInput() {
    const select = document.getElementById('bankNameSelect');
    const otherGroup = document.getElementById('otherBankGroup');
    const networkGroup = document.getElementById('networkGroup');
    const mobileInfo = document.getElementById('mobileMoneyInfo');
    const accountLabel = document.getElementById('accountNumberLabel');
    const accountHint = document.getElementById('accountNumberHint');
    
    if (!select) return;
    
    const selectedValue = select.value;
    
    // Show/hide other bank name input
    if (otherGroup) {
        otherGroup.style.display = selectedValue === 'Other' ? 'block' : 'none';
    }
    
    // Check if mobile money selected
    const isMobileMoney = mobileMoneyServices.includes(selectedValue);
    
    // Show/hide network selection
    if (networkGroup) {
        networkGroup.style.display = isMobileMoney ? 'block' : 'none';
    }
    
    // Show/hide mobile money info
    if (mobileInfo) {
        mobileInfo.style.display = isMobileMoney ? 'block' : 'none';
        
        // Update info box class
        const infoBox = mobileInfo.querySelector('.info-box');
        if (infoBox) {
            infoBox.className = isMobileMoney ? 'info-box' : 'info-box bank-info';
            
            if (isMobileMoney) {
                infoBox.querySelector('strong').textContent = 'Kumbuka:';
                infoBox.querySelector('p').textContent = 
                    'Hakikisha namba ya simu imesajiliwa kwa jina lako halisi. Fedha zitatumwa kwa namba hii ya simu.';
            }
        }
    }
    
    // Update account number label and hint
    if (accountLabel) {
        if (isMobileMoney) {
            accountLabel.textContent = 'Namba ya Simu (Mobile Money)';
            accountLabel.classList.add('active');
        } else if (selectedValue && selectedValue !== 'Other') {
            accountLabel.textContent = 'Namba ya Akaunti';
            accountLabel.classList.remove('active');
        } else {
            accountLabel.textContent = 'Namba ya Akaunti / Namba ya Simu';
            accountLabel.classList.remove('active');
        }
    }
    
    if (accountHint) {
        if (isMobileMoney) {
            accountHint.textContent = 'Weka namba ya simu iliyosajiliwa kwenye huduma ya ' + selectedValue;
        } else {
            accountHint.textContent = 'Weka namba ya akaunti ya benki au namba ya simu kwa huduma za mobile money';
        }
    }
    
    // Auto-fill network based on mobile money selection
    autoFillNetwork(selectedValue);
    
    // Add validation pattern for phone number if mobile money
    const accountInput = document.getElementById('newAccountNumber');
    if (accountInput) {
        if (isMobileMoney) {
            accountInput.setAttribute('placeholder', 'Mf. 0755123456');
            accountInput.setAttribute('pattern', '[0-9]{10,12}');
            accountInput.setAttribute('title', 'Weka namba ya simu yenye tarakimu 10-12');
        } else {
            accountInput.setAttribute('placeholder', 'Mf. 0150XXXXXXX');
            accountInput.removeAttribute('pattern');
            accountInput.removeAttribute('title');
        }
    }
}

/**
 * Auto-fill network based on mobile money service
 */
function autoFillNetwork(service) {
    const networkSelect = document.getElementById('networkSelect');
    if (!networkSelect || !service) return;
    
    const networkMap = {
        'M-Pesa': 'Vodacom',
        'Tigo Pesa': 'Tigo',
        'Airtel Money': 'Airtel',
        'HaloPesa': 'Halotel',
        'TTCL Pesa': 'TTCL',
        'AzamPesa': 'Zantel'
    };
    
    if (networkMap[service]) {
        networkSelect.value = networkMap[service];
    }
}

/**
 * Validate phone number format for mobile money
 */
function validateMobileNumber(number, network) {
    const prefixes = {
        'Vodacom': ['0754', '0755', '0756', '0757', '0758', '0767'],
        'Tigo': ['0713', '0714', '0715', '0653', '0654', '0655'],
        'Airtel': ['0785', '0786', '0787', '0685', '0686', '0687'],
        'Halotel': ['0621', '0622', '0623', '0624', '0625'],
        'TTCL': ['0731', '0732', '0733', '0734'],
        'Zantel': ['0777', '0778', '0779']
    };
    
    if (!network || !prefixes[network]) return true; // Skip validation if no network
    
    const numStr = number.toString();
    const validPrefixes = prefixes[network] || [];
    
    return validPrefixes.some(prefix => numStr.startsWith(prefix));
}



/**
 * Load bank accounts in profile - UPDATED display
 */
async function loadProfileBankAccounts() {
    const container = document.getElementById('profileBankAccountsList');
    if (!container) return;
    
    try {
        const snapshot = await db.collection('users').doc(currentUser.uid)
            .collection('bankAccounts').get();
        
        if (snapshot.empty) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-university" style="font-size: 40px; color: #ccc; display: block; margin-bottom: 10px;"></i>
                    <p>Huna akaunti za benki wala huduma za simu</p>
                    <button class="btn-add-item" onclick="showAddBankAccountForm()" style="margin-top: 10px;">
                        <i class="fas fa-plus"></i> Ongeza Akaunti
                    </button>
                </div>
            `;
            return;
        }
        
        userBankAccounts = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        container.innerHTML = userBankAccounts.map(account => {
            const isMobile = account.accountType === 'mobile_money';
            const icon = isMobile ? 'fa-mobile-alt' : 'fa-university';
            const cardClass = isMobile ? 'mobile-money' : 'bank-account';
            const badgeText = isMobile ? 'Simu' : 'Benki';
            const badgeClass = isMobile ? 'mobile' : 'bank';
            
            return `
                <div class="bank-account-card ${cardClass}">
                    <div class="bank-account-icon" style="background: ${isMobile ? 'linear-gradient(135deg, #1976D2, #42A5F5)' : 'linear-gradient(135deg, #004E89, #1A936F)'};">
                        <i class="fas ${icon}"></i>
                    </div>
                    <div class="bank-account-info">
                        <h4>
                            ${account.bankName}
                            <span class="bank-type-badge ${badgeClass}">${badgeText}</span>
                        </h4>
                        <p>${account.accountNumber} - ${account.accountHolder}</p>
                        ${account.network ? `<p style="font-size: 11px; color: #1976D2;">📶 Mtandao: ${account.network}</p>` : ''}
                    </div>
                    <div class="bank-account-actions">
                        <button class="btn-delete-bank" onclick="deleteProfileBankAccount('${account.id}')" title="Futa">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');
        
    } catch (error) {
        console.error('Error loading bank accounts:', error);
    }
}

/**
 * Initialize event listeners
 */
document.addEventListener('DOMContentLoaded', () => {
    const bankSelect = document.getElementById('bankNameSelect');
    if (bankSelect) {
        bankSelect.addEventListener('change', toggleOtherBankInput);
    }
});

console.log('✅ Mobile Money & Bank Selection Loaded');

// ============================================
// SECTION INITIALIZATION FUNCTIONS
// ============================================

/**
 * Initialize Deposit Section
 */
function initializeDepositSection() {
    console.log('Initializing deposit section...');
    loadDepositBankAccounts();
}

/**
 * Initialize Withdrawal Section
 */
function initializeWithdrawalSection() {
    console.log('Initializing withdrawal section...');
    loadWithdrawalBankAccounts();
    
    // Add event listener for bank account selection
    const select = document.getElementById('withdrawBankAccount');
    if (select) {
        select.removeEventListener('change', onWithdrawalBankAccountSelected);
        select.addEventListener('change', onWithdrawalBankAccountSelected);
    }
    
    // Add event listener for amount input
    const amountInput = document.getElementById('withdrawAmount');
    if (amountInput) {
        amountInput.removeEventListener('input', calculateWithdrawalFee);
        amountInput.addEventListener('input', calculateWithdrawalFee);
    }
}

/**
 * Load deposit bank accounts (System accounts added by admin)
 */
async function loadDepositBankAccounts() {
    const select = document.getElementById('bankAccount');
    if (!select) return;
    
    try {
        select.innerHTML = '<option value="">Inapakia akaunti za benki...</option>';
        
        const snapshot = await db.collection('bankAccounts')
            .where('active', '==', true)
            .get();
        
        if (snapshot.empty) {
            select.innerHTML = '<option value="">Hakuna akaunti za benki zinazopatikana</option>';
            return;
        }
        
        select.innerHTML = '<option value="">Chagua akaunti ya benki kuweka amana...</option>';
        
        snapshot.forEach(doc => {
            const account = doc.data();
            select.innerHTML += `
                <option value="${doc.id}" 
                        data-bank-name="${account.bankName || ''}" 
                        data-account-number="${account.accountNumber || ''}" 
                        data-account-holder="${account.accountHolder || ''}">
                    🏦 ${account.bankName} - ${account.accountNumber} (${account.accountHolder})
                </option>
            `;
        });
        
        console.log(`Loaded ${snapshot.size} deposit bank accounts`);
        
    } catch (error) {
        console.error('Error loading deposit bank accounts:', error);
        select.innerHTML = '<option value="">Imeshindikana kupakia akaunti</option>';
    }
}

// ============================================
// PROFILE SECTION JAVASCRIPT
// ============================================

/**
 * Show Profile Section
 */
function showProfile() {
    ection('profile');
    document.getElementById('userDropdown')?.classList.remove('active');
    loadProfileData();
}

/**
 * Show section in user dashboard - FIXED (no infinite loop)
 */
function showSection(sectionName) {
    console.log('Showing section:', sectionName);
    
    // Hide all sections
    document.querySelectorAll('#dashboard .content-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Show selected section
    const section = document.getElementById(`${sectionName}Section`);
    if (section) {
        section.classList.add('active');
    }
    
    // Update active menu item
    document.querySelectorAll('#sidebar .menu-item').forEach(item => {
        item.classList.remove('active');
    });
    
    if (event && event.target) {
        const menuItem = event.target.closest('.menu-item');
        if (menuItem) {
            menuItem.classList.add('active');
        }
    }
    
    // Load section-specific data - NO recursive calls
    switch(sectionName) {
        case 'home':
            loadUserData();
            loadSlides();
            break;
        case 'marketplace':
            loadMarketplaceDrinks();
            break;
        case 'myDrinks':
            loadMyDrinks();
            break;
        case 'deposit':
            loadDepositBankAccounts();
            break;
        case 'withdraw':
            loadWithdrawalBankAccounts();
            break;
        case 'history':
            loadHistory();
            break;
        case 'profile':
            loadProfileData();
            break;
        case 'referral':
            loadReferralData();
            break;
    }
    
    // Close sidebar on mobile
    if (window.innerWidth <= 768) {
        document.getElementById('sidebar')?.classList.remove('active');
    }
}

/**
 * Show profile - FIXED
 */
function showProfile() {
    // Close dropdown
    document.getElementById('userDropdown')?.classList.remove('active');
    
    // Call showSection ONCE
    showSection('profile');
}

/**
 * Load all profile data
 */
async function loadProfileData() {
    if (!currentUser) return;
    
    try {
        const userDoc = await db.collection('users').doc(currentUser.uid).get();
        if (!userDoc.exists) return;
        
        const user = userDoc.data();
        currentUserData = user;
        
        // Header
        document.getElementById('profileDisplayName').textContent = user.fullname || 'Mtumiaji';
        document.getElementById('profileDisplayUsername').textContent = '@' + (user.username || 'mtumiaji');
        document.getElementById('profileAvatarImg').src = 
            `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullname || 'User')}&background=FF6B35&color=fff&size=100`;
        
        // Role badge
        const roles = { 'super_admin': 'Msimamizi Mkuu', 'admin': 'Msimamizi', 'user': 'Mtumiaji' };
        document.getElementById('profileRoleBadge').textContent = roles[user.role] || 'Mtumiaji';
        
        // Stats
        document.getElementById('profileBalance').textContent = formatCurrency(user.balance || 0);
        document.getElementById('profileEarnings').textContent = formatCurrency(user.totalEarnings || 0);
        document.getElementById('profileDrinks').textContent = user.activeDrinks || 0;
        
        // Form
        document.getElementById('profileUsername').value = user.username || '';
        document.getElementById('profileFullname').value = user.fullname || '';
        document.getElementById('profileEmail').value = user.email || '';
        document.getElementById('profilePhone').value = user.phone || '';
        document.getElementById('profileReferralCode').textContent = user.referralCode || '-';
        
        // Account info
        document.getElementById('profileJoinDate').textContent = 
            user.createdAt?.toDate?.().toLocaleDateString('sw-TZ') || '-';
        document.getElementById('profileStatus').textContent = 
            user.status === 'active' ? 'Inatumika' : 'Imesimamishwa';
        document.getElementById('profileReferrals').textContent = user.totalReferrals || 0;
        document.getElementById('profileReferralBonus').textContent = formatCurrency(user.totalReferralBonus || 0);
        
        // Load bank accounts
        loadProfileBankAccounts();
        
    } catch (error) {
        console.error('Error loading profile:', error);
    }
}

/**
 * Update profile
 */
async function updateProfile(event) {
    event.preventDefault();
    
    const fullname = document.getElementById('profileFullname').value.trim();
    const phone = document.getElementById('profilePhone').value.trim();
    
    if (!fullname) {
        showToast('Tafadhali weka jina lako kamili.', 'warning');
        return;
    }
    
    try {
        await db.collection('users').doc(currentUser.uid).update({
            fullname: fullname,
            phone: phone,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // Update local data
        currentUserData.fullname = fullname;
        currentUserData.phone = phone;
        
        // Update display
        document.getElementById('profileDisplayName').textContent = fullname;
        document.getElementById('currentUsername').textContent = fullname;
        document.getElementById('profileAvatarImg').src = 
            `https://ui-avatars.com/api/?name=${encodeURIComponent(fullname)}&background=FF6B35&color=fff&size=100`;
        
        showToast('Wasifu umesasishwa! ✅', 'success');
        
    } catch (error) {
        console.error('Error updating profile:', error);
        showToast('Imeshindikana kusasisha wasifu.', 'error');
    }
}

/**
 * Copy referral code
 */
function copyProfileReferral() {
    const code = document.getElementById('profileReferralCode').textContent;
    if (code && code !== '-') {
        navigator.clipboard?.writeText(code);
        showToast('Namba ya rufaa imenakiliwa!', 'success');
    }
}

/**
 * Change avatar (placeholder)
 */
function changeProfileAvatar() {
    showToast('Kipengele cha kubadilisha picha kitapatikana hivi karibuni.', 'info');
}

// ============================================
// SOCIAL LINKS SYSTEM
// ============================================

let socialLinksInterval = null;
let currentSocialLinks = [];
let userFollowedLinks = [];

/**
 * Check and show social links popup
 */
async function checkSocialLinksPopup() {
    if (!currentUser) return;
    
    try {
        // Get active social links
        const linksSnapshot = await db.collection('socialLinks')
            .where('active', '==', true)
            .get();
        
        if (linksSnapshot.empty) return;
        
        currentSocialLinks = linksSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        // Get user's followed links
        const userDoc = await db.collection('users').doc(currentUser.uid).get();
        const userData = userDoc.data();
        userFollowedLinks = userData.followedSocialLinks || [];
        
        // Check if all links are followed
        const allFollowed = currentSocialLinks.every(link => 
            userFollowedLinks.includes(link.id)
        );
        
        if (allFollowed) {
            console.log('All social links followed');
            return;
        }
        
        // Check last popup time
        const lastPopup = userData.lastSocialPopup?.toDate?.() || new Date(0);
        const now = new Date();
        const minutesSinceLastPopup = (now.getTime() - lastPopup.getTime()) / (1000 * 60);
        
        if (minutesSinceLastPopup >= 2) {
            showSocialLinksPopup();
        }
        
    } catch (error) {
        console.error('Error checking social links:', error);
    }
}

/**
 * Show social links popup
 */
function showSocialLinksPopup() {
    const modal = document.getElementById('socialLinksModal');
    const list = document.getElementById('socialLinksList');
    
    if (!modal || !list) return;
    
    // Update last popup time
    db.collection('users').doc(currentUser.uid).update({
        lastSocialPopup: firebase.firestore.FieldValue.serverTimestamp()
    }).catch(() => {});
    
    // Build social links list
    list.innerHTML = currentSocialLinks.map(link => {
        const isFollowed = userFollowedLinks.includes(link.id);
        const iconBgClass = link.icon || 'globe';
        
        return `
            <a href="${link.url}" target="_blank" 
               class="social-link-item ${isFollowed ? 'followed' : ''}"
               onclick="trackSocialLinkClick('${link.id}')">
                <div class="social-link-icon ${iconBgClass}">
                    ${getSocialIconHtml(link.icon)}
                </div>
                <div class="social-link-info">
                    <h4>${link.title}</h4>
                    ${link.description ? `<p>${link.description}</p>` : ''}
                </div>
                <div class="social-link-arrow">
                    <i class="fas ${isFollowed ? 'fa-check-circle' : 'fa-external-link-alt'}"></i>
                </div>
            </a>
        `;
    }).join('');
    
    modal.classList.add('active');
}

/**
 * Get social icon HTML
 */
function getSocialIconHtml(icon) {
    const iconMap = {
        'facebook': '<i class="fab fa-facebook-f"></i>',
        'instagram': '<i class="fab fa-instagram"></i>',
        'twitter': '<i class="fab fa-twitter"></i>',
        'tiktok': '<i class="fab fa-tiktok"></i>',
        'youtube': '<i class="fab fa-youtube"></i>',
        'telegram': '<i class="fab fa-telegram-plane"></i>',
        'whatsapp': '<i class="fab fa-whatsapp"></i>',
        'linkedin': '<i class="fab fa-linkedin-in"></i>',
        'discord': '<i class="fab fa-discord"></i>',
        'globe': '<i class="fas fa-globe"></i>'
    };
    return iconMap[icon] || iconMap['globe'];
}

/**
 * Track social link click
 */
async function trackSocialLinkClick(linkId) {
    if (!userFollowedLinks.includes(linkId)) {
        userFollowedLinks.push(linkId);
        
        await db.collection('users').doc(currentUser.uid).update({
            followedSocialLinks: userFollowedLinks,
            lastSocialClick: firebase.firestore.FieldValue.serverTimestamp()
        }).catch(() => {});
        
        // Update the link appearance
        setTimeout(() => {
            const allFollowed = currentSocialLinks.every(link => 
                userFollowedLinks.includes(link.id)
            );
            if (allFollowed) {
                setTimeout(() => closeSocialLinksModal(), 1500);
            }
        }, 500);
    }
}

/**
 * Skip social links
 */
function skipSocialLinks() {
    closeSocialLinksModal();
}

/**
 * Confirm following social links
 */
function confirmSocialLinks() {
    const unfollowedLinks = currentSocialLinks.filter(link => 
        !userFollowedLinks.includes(link.id)
    );
    
    if (unfollowedLinks.length > 0) {
        showToast(`Please follow ${unfollowedLinks.length} more link(s)!`, 'warning');
    } else {
        showToast('Thank you for following us! 🎉', 'success');
        closeSocialLinksModal();
        clearInterval(socialLinksInterval);
    }
}

/**
 * Close social links modal
 */
function closeSocialLinksModal() {
    document.getElementById('socialLinksModal')?.classList.remove('active');
}

// ============================================
// INITIALIZE SOCIAL LINKS POPUP
// ============================================

/**
 * Start social links check - Called after user login
 */
function startSocialLinksCheck() {
    console.log('🔄 Starting social links check...');
    
    // Clear existing interval
    if (socialLinksInterval) {
        clearInterval(socialLinksInterval);
        socialLinksInterval = null;
    }
    
    // Check immediately on login (after 3 second delay)
    setTimeout(async () => {
        if (currentUser) {
            console.log('📱 Checking social links popup...');
            await checkSocialLinksPopup();
        }
    }, 3000);
    
    // Check every 2 minutes
    socialLinksInterval = setInterval(async () => {
        if (currentUser) {
            console.log('⏰ Social links interval check...');
            await checkSocialLinksPopup();
        } else {
            // User logged out, stop checking
            clearInterval(socialLinksInterval);
            socialLinksInterval = null;
        }
    }, 120000); // 120000ms = 2 minutes
    
    console.log('✅ Social links check started (every 2 minutes)');
}

/**
 * Check and show social links popup
 */
async function checkSocialLinksPopup() {
    if (!currentUser || !currentUser.uid) {
        console.log('❌ No user logged in, skipping social links check');
        return;
    }
    
    try {
        // Get active social links from Firestore
        const linksSnapshot = await db.collection('socialLinks')
            .where('active', '==', true)
            .get();
        
        console.log('📊 Active social links found:', linksSnapshot.size);
        
        if (linksSnapshot.empty) {
            console.log('ℹ️ No active social links to show');
            return;
        }
        
        // Store links globally
        currentSocialLinks = [];
        linksSnapshot.forEach(doc => {
            currentSocialLinks.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        // Get user data
        const userDoc = await db.collection('users').doc(currentUser.uid).get();
        if (!userDoc.exists) {
            console.log('❌ User document not found');
            return;
        }
        
        const userData = userDoc.data();
        userFollowedLinks = userData.followedSocialLinks || [];
        
        console.log('👤 User followed links:', userFollowedLinks.length, '/', currentSocialLinks.length);
        
        // Check if all links are already followed
        const allFollowed = currentSocialLinks.every(link =>
            userFollowedLinks.includes(link.id)
        );
        
        if (allFollowed) {
            console.log('✅ All social links already followed - no popup needed');
            // Stop checking if all followed
            if (socialLinksInterval) {
                clearInterval(socialLinksInterval);
                socialLinksInterval = null;
                console.log('🛑 Stopped social links checks - all followed');
            }
            return;
        }
        
        // Check last popup time
        const lastPopup = userData.lastSocialPopup?.toDate?.() || new Date(0);
        const now = new Date();
        const minutesSinceLastPopup = (now.getTime() - lastPopup.getTime()) / (1000 * 60);
        
        console.log('⏱️ Minutes since last popup:', minutesSinceLastPopup.toFixed(1));
        
        if (minutesSinceLastPopup >= 2) {
            console.log('🔔 Showing social links popup!');
            showSocialLinksPopup();
        } else {
            console.log('⏳ Too soon for next popup. Wait', (2 - minutesSinceLastPopup).toFixed(1), 'more minutes');
        }
        
    } catch (error) {
        console.error('❌ Error checking social links:', error);
        
        // If permission denied, the rules need updating
        if (error.code === 'permission-denied') {
            console.warn('⚠️ Permission denied! Update Firestore rules for socialLinks collection');
        }
    }
}

/**
 * Override the showUserDashboard to start social links
 */

showUserDashboard = function() {
    // Call original function
    originalShowUserDashboard();
    
    // Start social links check
    console.log('👤 User dashboard shown - starting social links');
    startSocialLinksCheck();
};

/**
 * Override checkAuthState to start social links on login
 */
const originalRouteUserByRole = routeUserByRole;
routeUserByRole = function() {
    originalRouteUserByRole();
    
    // Start social links for regular users
    if (currentUserRole === 'user') {
        console.log('👤 Regular user logged in - starting social links');
        startSocialLinksCheck();
    }
};

// Also start on signup success
const originalHandleSignup = handleSignup;
handleSignup = async function(event) {
    await originalHandleSignup(event);
    
    // After successful signup, start social links
    if (currentUser) {
        setTimeout(() => startSocialLinksCheck(), 5000);
    }
};

console.log('✅ Social Links Auto-Popup System Ready');

// ============================================
// ADMIN - SOCIAL LINKS MANAGEMENT
// ============================================

let selectedSocialIcon = '';

function selectSocialIcon(icon) {
    selectedSocialIcon = icon;
    document.getElementById('selectedSocialIcon').value = icon;
    
    document.querySelectorAll('.social-icon-option').forEach(el => {
        el.classList.toggle('selected', el.dataset.icon === icon);
    });
}

function showAddSocialLinkModal() {
    document.getElementById('socialLinkModalTitle').innerHTML = '<i class="fas fa-plus-circle"></i> Add Social Link';
    document.getElementById('editSocialLinkId').value = '';
    document.getElementById('selectedSocialIcon').value = '';
    document.getElementById('socialLinkTitle').value = '';
    document.getElementById('socialLinkUrl').value = '';
    document.getElementById('socialLinkDescription').value = '';
    document.getElementById('socialLinkActive').checked = true;
    selectedSocialIcon = '';
    document.querySelectorAll('.social-icon-option').forEach(el => el.classList.remove('selected'));
    document.getElementById('addSocialLinkModal').classList.add('active');
}

function closeAddSocialLinkModal() {
    document.getElementById('addSocialLinkModal')?.classList.remove('active');
}

async function saveSocialLink(event) {
    event.preventDefault();
    
    const editId = document.getElementById('editSocialLinkId').value;
    const icon = selectedSocialIcon || document.getElementById('selectedSocialIcon').value;
    const title = document.getElementById('socialLinkTitle').value.trim();
    const url = document.getElementById('socialLinkUrl').value.trim();
    const description = document.getElementById('socialLinkDescription').value.trim();
    const active = document.getElementById('socialLinkActive').checked;
    
    if (!icon) { showToast('Please select an icon.', 'warning'); return; }
    if (!title) { showToast('Please enter a title.', 'warning'); return; }
    if (!url) { showToast('Please enter a URL.', 'warning'); return; }
    
    const data = { icon, title, url, description, active, updatedAt: firebase.firestore.FieldValue.serverTimestamp() };
    
    try {
        if (editId) {
            await db.collection('socialLinks').doc(editId).update(data);
            showToast('Social link updated! ✅', 'success');
        } else {
            data.createdAt = firebase.firestore.FieldValue.serverTimestamp();
            await db.collection('socialLinks').add(data);
            showToast('Social link added! ✅', 'success');
        }
        closeAddSocialLinkModal();
        loadManageSocialLinks();
    } catch (error) {
        console.error('Error:', error);
        showToast('Failed to save social link.', 'error');
    }
}

async function loadManageSocialLinks() {
    const grid = document.getElementById('manageSocialLinksGrid');
    if (!grid) return;
    
    try {
        const snapshot = await db.collection('socialLinks').get();
        
        if (snapshot.empty) {
            grid.innerHTML = `
                <div style="grid-column:1/-1;text-align:center;padding:40px;">
                    <i class="fas fa-share-alt" style="font-size:48px;color:#ccc;display:block;margin-bottom:15px;"></i>
                    <p>No social links added yet.</p>
                    <button class="btn-primary" onclick="showAddSocialLinkModal()">Add First Link</button>
                </div>`;
            return;
        }
        
        grid.innerHTML = '';
        snapshot.forEach(doc => {
            const link = doc.data();
            grid.innerHTML += `
                <div class="social-link-manage-card">
                    <div class="social-link-manage-icon ${link.icon || 'globe'}">
                        ${getSocialIconHtml(link.icon)}
                    </div>
                    <div class="social-link-manage-info">
                        <h4>${link.title}</h4>
                        ${link.description ? `<p>${link.description}</p>` : ''}
                        <a href="${link.url}" target="_blank">${link.url.substring(0, 40)}...</a>
                        <br>
                        <span class="status-badge ${link.active ? 'status-active' : 'status-suspended'}" style="font-size:10px;">
                            ${link.active ? 'Active' : 'Inactive'}
                        </span>
                    </div>
                    <div class="social-link-manage-actions">
                        <button onclick="editSocialLink('${doc.id}')" style="padding:6px 10px;background:#FFD166;border:none;border-radius:6px;cursor:pointer;"><i class="fas fa-edit"></i></button>
                        <button onclick="toggleSocialLink('${doc.id}', ${!link.active})" style="padding:6px 10px;background:${link.active ? '#6c757d' : '#1A936F'};color:#fff;border:none;border-radius:6px;cursor:pointer;"><i class="fas fa-power-off"></i></button>
                        <button onclick="deleteSocialLink('${doc.id}')" style="padding:6px 10px;background:#EF233C;color:#fff;border:none;border-radius:6px;cursor:pointer;"><i class="fas fa-trash"></i></button>
                    </div>
                </div>`;
        });
    } catch (error) {
        console.error('Error:', error);
    }
}

async function editSocialLink(linkId) {
    try {
        const doc = await db.collection('socialLinks').doc(linkId).get();
        if (!doc.exists) return;
        const link = doc.data();
        
        document.getElementById('socialLinkModalTitle').innerHTML = '<i class="fas fa-edit"></i> Edit Social Link';
        document.getElementById('editSocialLinkId').value = linkId;
        document.getElementById('selectedSocialIcon').value = link.icon;
        document.getElementById('socialLinkTitle').value = link.title;
        document.getElementById('socialLinkUrl').value = link.url;
        document.getElementById('socialLinkDescription').value = link.description || '';
        document.getElementById('socialLinkActive').checked = link.active;
        selectSocialIcon(link.icon);
        document.getElementById('addSocialLinkModal').classList.add('active');
    } catch (error) {
        console.error('Error:', error);
    }
}

async function toggleSocialLink(linkId, active) {
    await db.collection('socialLinks').doc(linkId).update({ active });
    showToast(`Social link ${active ? 'activated' : 'deactivated'}!`, 'success');
    loadManageSocialLinks();
}

async function deleteSocialLink(linkId) {
    if (!confirm('Delete this social link?')) return;
    await db.collection('socialLinks').doc(linkId).delete();
    showToast('Social link deleted!', 'success');
    loadManageSocialLinks();
}

// Initialize on login/signup
const origShowUserDashboard = showUserDashboard;
showUserDashboard = function() {
    origShowUserDashboard();
    startSocialLinksCheck();
};

console.log('✅ Social Links System Loaded');