/**
 * Mock Timetable Repository
 */

let timetable = [

    {
        timetableId: "TT001",
        batchId: "B001",
        facultyId: "F001",
        facultyName: "Dr. Rajesh Sharma",
        subjectCode: "CS301",
        subjectName: "Database Management Systems",
        room: "LH101",
        day: "Monday",
        startTime: "09:00",
        endTime: "10:00"
    },

    {
        timetableId: "TT002",
        batchId: "B001",
        facultyId: "F002",
        facultyName: "Dr. Anita Verma",
        subjectCode: "CS302",
        subjectName: "Operating Systems",
        room: "LH102",
        day: "Monday",
        startTime: "10:00",
        endTime: "11:00"
    },

    {
        timetableId: "TT003",
        batchId: "B002",
        facultyId: "F001",
        facultyName: "Dr. Rajesh Sharma",
        subjectCode: "CS401",
        subjectName: "Machine Learning",
        room: "LH201",
        day: "Tuesday",
        startTime: "09:00",
        endTime: "10:00"
    }

];

/**
 * Get All Timetable
 */
export const getAllTimetable = async () => {
    return timetable;
};

/**
 * Get Today's Timetable
 */
export const getTodayTimetable = async () => {
    return timetable.filter(t => t.day === "Monday");
};

/**
 * Get Timetable by Batch
 */
export const getTimetableByBatch = async (
    batchId: string
) => {

    return timetable.filter(
        t => t.batchId === batchId
    );

};

/**
 * Get Timetable by Faculty
 */
export const getTimetableByFaculty = async (
    facultyId: string
) => {

    return timetable.filter(
        t => t.facultyId === facultyId
    );

};

/**
 * Create Timetable
 */
export const createTimetable = async (
    timetableData: any
) => {

    const newTimetable = {
        timetableId: `TT${timetable.length + 1}`,
        ...timetableData
    };

    timetable.push(newTimetable);

    return newTimetable;

};

/**
 * Update Timetable
 */
export const updateTimetable = async (
    timetableId: string,
    timetableData: any
) => {

    const record = timetable.find(
        t => t.timetableId === timetableId
    );

    if (!record) return null;

    Object.assign(record, timetableData);

    return record;

};

/**
 * Delete Timetable
 */
export const deleteTimetable = async (
    timetableId: string
) => {

    timetable = timetable.filter(
        t => t.timetableId !== timetableId
    );

    return {
        success: true
    };

};