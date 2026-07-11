import * as ChangeLogRepository from "../repositories/ChangeLogRepository";

export const getAllChanges = async (filters: any) => await ChangeLogRepository.getAllChanges(filters);
