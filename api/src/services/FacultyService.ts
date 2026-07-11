import * as FacultyRepository from "../repositories/FacultyRepository";

export const getAllFaculty = async () => {
    return await FacultyRepository.getAllFaculty();
};

export const getFacultyById = async (facultyId: string) => {
    return await FacultyRepository.getFacultyById(facultyId);
};

export const createFaculty = async (facultyData: any) => {

    const required = ["department_id", "employee_id", "first_name", "last_name", "email", "designation", "password"];
    for (const field of required) {
        if (!facultyData[field]) {
            throw new Error(`${field} is required`);
        }
    }

    if (String(facultyData.password).length < 8) {
        throw new Error("Password must be at least 8 characters");
    }

    return await FacultyRepository.createFacultyWithAccount(facultyData, facultyData.password);
};

export const updateFaculty = async (facultyId: string, facultyData: any) => {
    return await FacultyRepository.updateFaculty(facultyId, facultyData);
};

export const deactivateFaculty = async (facultyId: string) => {
    return await FacultyRepository.deactivateFaculty(facultyId);
};
