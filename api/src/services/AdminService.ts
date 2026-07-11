import * as AdminRepository from "../repositories/AdminRepository";

export const login = async (loginData: any) => {
    if (!loginData?.username || !loginData?.password) {
        throw new Error("username and password are required");
    }
    return await AdminRepository.login(loginData);
};

export const logout = async () => {
    return await AdminRepository.logout();
};

export const getProfile = async (adminId: string) => {
    return await AdminRepository.getProfile(adminId);
};

export const updateProfile = async (adminId: string, profileData: any) => {
    return await AdminRepository.updateProfile(adminId, profileData);
};

export const changePassword = async (adminId: string, passwordData: any) => {
    if (!passwordData?.currentPassword || !passwordData?.newPassword) {
        throw new Error("currentPassword and newPassword are required");
    }
    return await AdminRepository.changePassword(adminId, passwordData);
};

/**
 * SUPER_ADMIN only, enforced at the route level (requireSuperAdmin) — this
 * function trusts the caller has already been authorized.
 */
export const updateSecurity = async (targetAdminId: string, securityData: any) => {
    return await AdminRepository.updateSecurity(targetAdminId, securityData);
};

export const getAllAdmins = async () => {
    return await AdminRepository.getAllAdmins();
};

export const getAdminById = async (adminId: string) => {
    return await AdminRepository.getAdminById(adminId);
};

export const deactivateAdmin = async (adminId: string) => {
    return await AdminRepository.deactivateAdmin(adminId);
};