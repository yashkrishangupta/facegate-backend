import * as StudentRepository from "../repositories/StudentRepository";

/**
 * Get all students, optionally filtered by academic year / program /
 * semester / batch / department.
 */
export const getAllStudents = async (filters: any = {}) => {
    const hasFilters = Object.values(filters).some(v => v);
    return hasFilters
        ? await StudentRepository.getFilteredStudents(filters)
        : await StudentRepository.getAllStudents();
};

/**
 * Get student by ID
 */
export const getStudentById = async (studentId: string) => {
    return await StudentRepository.getStudentById(studentId);
};

/**
 * Get students by batch
 */
export const getStudentsByBatch = async (batchId: string) => {
    return await StudentRepository.getStudentsByBatch(batchId);
};

/**
 * Create student
 */
export const createStudent = async (studentData: any) => {

    const required = ["batch_id", "registration_number", "roll_number", "first_name", "last_name", "gender", "admission_year"];
    for (const field of required) {
        if (studentData[field] === undefined || studentData[field] === null || studentData[field] === "") {
            throw new Error(`${field} is required`);
        }
    }

    return await StudentRepository.createStudent(studentData);
};

/**
 * Update student
 */
export const updateStudent = async (
    studentId: string,
    studentData: any
) => {

    return await StudentRepository.updateStudent(
        studentId,
        studentData
    );
};

/**
 * Delete student (Soft Delete)
 */
export const deleteStudent = async (
    studentId: string
) => {

    return await StudentRepository.deleteStudent(studentId);
};