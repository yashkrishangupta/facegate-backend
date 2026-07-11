import * as ProgramRepository from "../repositories/ProgramRepository";

export const getAllPrograms = async () => await ProgramRepository.getAllPrograms();
export const getProgramById = async (id: string) => await ProgramRepository.getProgramById(id);

export const createProgram = async (data: any) => {
    const required = ["program_code", "program_name", "degree_type", "duration_years"];
    for (const field of required) {
        if (data[field] === undefined || data[field] === null || data[field] === "") {
            throw new Error(`${field} is required`);
        }
    }
    return await ProgramRepository.createProgram(data);
};

export const updateProgram = async (id: string, data: any) => await ProgramRepository.updateProgram(id, data);
export const deactivateProgram = async (id: string) => await ProgramRepository.deactivateProgram(id);
