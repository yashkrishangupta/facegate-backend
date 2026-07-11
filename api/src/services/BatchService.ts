import * as BatchRepository from "../repositories/BatchRepository";

export const getAllBatches = async (filters: any) => await BatchRepository.getAllBatches(filters);
export const getBatchById = async (id: string) => await BatchRepository.getBatchById(id);

export const createBatch = async (data: any) => {
    const required = ["department_id", "batch_code", "program_id", "academic_year", "semester", "section", "strength"];
    for (const field of required) {
        if (data[field] === undefined || data[field] === null || data[field] === "") {
            throw new Error(`${field} is required`);
        }
    }
    return await BatchRepository.createBatch(data);
};

export const updateBatch = async (id: string, data: any) => await BatchRepository.updateBatch(id, data);
export const deactivateBatch = async (id: string) => await BatchRepository.deactivateBatch(id);
