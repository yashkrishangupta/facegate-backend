import * as AdminRepository from "../repositories/AdminRepository";

/**
 * Login
 */
export const login = async (loginData: any) => {
    return await AdminRepository.login(loginData);
};

/**
 * Logout
 */
export const logout = async () => {
    return await AdminRepository.logout();
};

/**
 * Get Profile
 */
export const getProfile = async () => {
    return await AdminRepository.getProfile();
};

/**
 * Update Profile
 */
export const updateProfile = async (
    profileData: any
) => {
    return await AdminRepository.updateProfile(profileData);
};

/**
 * Change Password
 */
export const changePassword = async (
    passwordData: any
) => {
    return await AdminRepository.changePassword(passwordData);
};

/**
 * Get All Admins
 */
export const getAllAdmins = async () => {
    return await AdminRepository.getAllAdmins();
};