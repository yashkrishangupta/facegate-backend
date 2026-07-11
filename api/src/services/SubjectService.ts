import * as SubjectRepository from "../repositories/SubjectRepository";

export const getAllSubjects = async (filters: any) => await SubjectRepository.getAllSubjects(filters);
export const getSubjectById = async (id: string) => await SubjectRepository.getSubjectById(id);

export const createSubject = async (data: any) => {
    const required = ["department_id", "subject_code", "subject_name", "program_id", "semester", "credits", "subject_type", "contact_hours_per_week"];
    for (const field of required) {
        if (data[field] === undefined || data[field] === null || data[field] === "") {
            throw new Error(`${field} is required`);
        }
    }
    return await SubjectRepository.createSubject(data);
};

export const updateSubject = async (id: string, data: any) => await SubjectRepository.updateSubject(id, data);
export const deactivateSubject = async (id: string) => await SubjectRepository.deactivateSubject(id);
