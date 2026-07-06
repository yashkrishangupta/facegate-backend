import * as HolidayRepository from "../repositories/HolidayRepository";

/**
 * Get All Holidays
 */
export const getAllHolidays = async () => {
    return await HolidayRepository.getAllHolidays();
};

/**
 * Get Holiday By ID
 */
export const getHolidayById = async (
    holidayId: string
) => {
    return await HolidayRepository.getHolidayById(holidayId);
};

/**
 * Create Holiday
 */
export const createHoliday = async (
    holidayData: any
) => {
    return await HolidayRepository.createHoliday(holidayData);
};

/**
 * Update Holiday
 */
export const updateHoliday = async (
    holidayId: string,
    holidayData: any
) => {
    return await HolidayRepository.updateHoliday(
        holidayId,
        holidayData
    );
};

/**
 * Delete Holiday
 */
export const deleteHoliday = async (
    holidayId: string
) => {
    return await HolidayRepository.deleteHoliday(holidayId);
};