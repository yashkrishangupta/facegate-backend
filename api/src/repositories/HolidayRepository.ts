/**
 * Mock Holiday Repository
 */

let holidays = [

    {
        holidayId: "H001",
        holidayName: "Republic Day",
        holidayDate: "2026-01-26",
        holidayType: "NATIONAL",
        description: "Republic Day Celebration",
        isRecurring: true
    },

    {
        holidayId: "H002",
        holidayName: "Holi",
        holidayDate: "2026-03-04",
        holidayType: "FESTIVAL",
        description: "Festival of Colors",
        isRecurring: true
    },

    {
        holidayId: "H003",
        holidayName: "Semester Break",
        holidayDate: "2026-05-20",
        holidayType: "ACADEMIC",
        description: "End Semester Vacation",
        isRecurring: false
    }

];

/**
 * Get All Holidays
 */
export const getAllHolidays = async () => {
    return holidays;
};

/**
 * Get Holiday By ID
 */
export const getHolidayById = async (
    holidayId: string
) => {

    return holidays.find(
        holiday => holiday.holidayId === holidayId
    );

};

/**
 * Create Holiday
 */
export const createHoliday = async (
    holidayData: any
) => {

    const newHoliday = {
        holidayId: `H${String(holidays.length + 1).padStart(3, "0")}`,
        ...holidayData
    };

    holidays.push(newHoliday);

    return newHoliday;

};

/**
 * Update Holiday
 */
export const updateHoliday = async (
    holidayId: string,
    holidayData: any
) => {

    const holiday = holidays.find(
        h => h.holidayId === holidayId
    );

    if (!holiday) {
        return null;
    }

    Object.assign(holiday, holidayData);

    return holiday;

};

/**
 * Delete Holiday
 */
export const deleteHoliday = async (
    holidayId: string
) => {

    holidays = holidays.filter(
        h => h.holidayId !== holidayId
    );

    return {
        success: true
    };

};