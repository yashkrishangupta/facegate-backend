import * as AcademicCalendarRepository from "../repositories/AcademicCalendarRepository";

export const getAllCalendarEntries = async (filters: any) => await AcademicCalendarRepository.getAllCalendarEntries(filters);
export const getCalendarEntryById = async (id: string) => await AcademicCalendarRepository.getCalendarEntryById(id);

export const createCalendarEntry = async (data: any) => {
    if (!data.calendar_date || !data.academic_year || !data.semester) {
        throw new Error("calendar_date, academic_year, and semester are required");
    }
    return await AcademicCalendarRepository.createCalendarEntry(data);
};

export const updateCalendarEntry = async (id: string, data: any) => await AcademicCalendarRepository.updateCalendarEntry(id, data);
export const deactivateCalendarEntry = async (id: string) => await AcademicCalendarRepository.deactivateCalendarEntry(id);
