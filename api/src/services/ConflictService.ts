import * as ConflictRepository from "../repositories/ConflictRepository";

/**
 * Get All Conflicts, optionally filtered by status / severity / type / room / date range.
 */
export const getAllConflicts = async (filters: any = {}) => {
    const hasFilters = Object.values(filters).some(v => v);
    return hasFilters
        ? await ConflictRepository.getFilteredConflicts(filters)
        : await ConflictRepository.getAllConflicts();
};

/**
 * Get Conflict By ID
 */
export const getConflictById = async (
    conflictId: string
) => {
    return await ConflictRepository.getConflictById(conflictId);
};

/**
 * Create Conflict
 */
export const createConflict = async (
    conflictData: any
) => {
    return await ConflictRepository.createConflict(conflictData);
};

/**
 * Resolve Conflict
 */
export const resolveConflict = async (
    conflictId: string,
    resolutionData: any
) => {
    return await ConflictRepository.resolveConflict(
        conflictId,
        resolutionData
    );
};

/**
 * Delete Conflict
 */
export const deleteConflict = async (
    conflictId: string
) => {
    return await ConflictRepository.deleteConflict(conflictId);
};