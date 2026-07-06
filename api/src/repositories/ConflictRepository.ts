/**
 * Mock Conflict Repository
 */

let conflicts = [

    {
        conflictId: "C001",
        attendanceId: "A001",
        studentId: "S001",
        conflictType: "LOW_CONFIDENCE",
        description: "Face recognition confidence below threshold.",
        status: "PENDING",
        createdAt: "2026-07-06T09:05:00Z",
        resolvedBy: null,
        resolution: null
    },

    {
        conflictId: "C002",
        attendanceId: "A002",
        studentId: "S002",
        conflictType: "DUPLICATE_ATTENDANCE",
        description: "Student attempted attendance twice.",
        status: "PENDING",
        createdAt: "2026-07-06T09:15:00Z",
        resolvedBy: null,
        resolution: null
    },

    {
        conflictId: "C003",
        attendanceId: null,
        studentId: null,
        conflictType: "UNKNOWN_FACE",
        description: "Face not recognized in database.",
        status: "RESOLVED",
        createdAt: "2026-07-05T11:30:00Z",
        resolvedBy: "ADMIN001",
        resolution: "Ignored after manual verification."
    }

];

/**
 * Get All Conflicts
 */
export const getAllConflicts = async () => {
    return conflicts;
};

/**
 * Get Conflict By ID
 */
export const getConflictById = async (
    conflictId: string
) => {

    return conflicts.find(
        conflict => conflict.conflictId === conflictId
    );

};

/**
 * Create Conflict
 */
export const createConflict = async (
    conflictData: any
) => {

    const newConflict = {
        conflictId: `C${String(conflicts.length + 1).padStart(3, "0")}`,
        status: "PENDING",
        createdAt: new Date().toISOString(),
        resolvedBy: null,
        resolution: null,
        ...conflictData
    };

    conflicts.push(newConflict);

    return newConflict;

};

/**
 * Resolve Conflict
 */
export const resolveConflict = async (
    conflictId: string,
    resolutionData: any
) => {

    const conflict = conflicts.find(
        c => c.conflictId === conflictId
    );

    if (!conflict) {
        return null;
    }

    conflict.status = "RESOLVED";
    conflict.resolvedBy = resolutionData.resolvedBy || "ADMIN001";
    conflict.resolution = resolutionData.resolution || "Resolved";

    return conflict;

};

/**
 * Delete Conflict
 */
export const deleteConflict = async (
    conflictId: string
) => {

    conflicts = conflicts.filter(
        conflict => conflict.conflictId !== conflictId
    );

    return {
        success: true
    };

};