/**
 * Mock Admin Repository
 */

let admins = [

    {
        adminId: "ADM001",
        employeeId: "EMP001",
        firstName: "Anjali",
        lastName: "Sharma",
        email: "admin@pec.edu.in",
        role: "SUPER_ADMIN",
        phone: "9876543210",
        accountStatus: "ACTIVE",
        lastLogin: "2026-07-06T09:00:00Z"
    },

    {
        adminId: "ADM002",
        employeeId: "EMP002",
        firstName: "Rahul",
        lastName: "Verma",
        email: "faculty@pec.edu.in",
        role: "FACULTY",
        phone: "9876543211",
        accountStatus: "ACTIVE",
        lastLogin: "2026-07-05T16:30:00Z"
    }

];

/**
 * Login
 */
export const login = async (
    loginData: any
) => {

    const admin = admins.find(
        admin => admin.email === loginData.email
    );

    if (!admin) {

        return {
            success: false,
            message: "Invalid credentials"
        };

    }

    return {

        success: true,

        token: "mock-jwt-token-facegate",

        admin

    };

};

/**
 * Logout
 */
export const logout = async () => {

    return {
        success: true
    };

};

/**
 * Get Profile
 */
export const getProfile = async () => {

    return admins[0];

};

/**
 * Update Profile
 */
export const updateProfile = async (
    profileData: any
) => {

    Object.assign(admins[0], profileData);

    return admins[0];

};

/**
 * Change Password
 */
export const changePassword = async (
    passwordData: any
) => {

    return {

        success: true,

        message: "Password changed successfully"

    };

};

/**
 * Get All Admins
 */
export const getAllAdmins = async () => {

    return admins;

};