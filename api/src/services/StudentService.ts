import * as StudentRepository from "../repositories/StudentRepository";

/**
 * Get all students
 */
export const getAllStudents = async () => {
    return await StudentRepository.getAllStudents();
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

    // Business logic can be added here later
    // Example:
    // - Validate email
    // - Check duplicate roll number
    // - Validate batch

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