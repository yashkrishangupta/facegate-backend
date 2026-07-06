/**
 * Mock Dashboard Repository
 */

/**
 * Dashboard Summary
 */
export const getDashboardSummary = async () => {

    return {

        totalStudents: 240,

        totalFaculty: 18,

        totalDepartments: 3,

        activeDevices: 5,

        offlineDevices: 1,

        todayClasses: 12,

        attendanceToday: 218,

        attendancePercentage: 90.83,

        pendingConflicts: 3,

        resolvedConflicts: 27,

        unreadNotifications: 5,

        lastSync: "2026-07-06T10:30:00Z"

    };

};

/**
 * Recent Attendance
 */
export const getRecentAttendance = async () => {

    return [

        {
            attendanceId: "A001",
            studentName: "Mahima Goyal",
            subject: "Database Management Systems",
            room: "LH101",
            status: "PRESENT",
            time: "09:01 AM"
        },

        {
            attendanceId: "A002",
            studentName: "Rahul Sharma",
            subject: "Operating Systems",
            room: "LH102",
            status: "ABSENT",
            time: "10:00 AM"
        },

        {
            attendanceId: "A003",
            studentName: "Aman Singh",
            subject: "Machine Learning",
            room: "LH201",
            status: "PRESENT",
            time: "11:02 AM"
        }

    ];

};

/**
 * Recent Conflicts
 */
export const getRecentConflicts = async () => {

    return [

        {
            conflictId: "C001",
            studentName: "Mahima Goyal",
            type: "LOW_CONFIDENCE",
            status: "PENDING"
        },

        {
            conflictId: "C002",
            studentName: "Rahul Sharma",
            type: "DUPLICATE_ATTENDANCE",
            status: "PENDING"
        }

    ];

};

/**
 * Recent Notifications
 */
export const getRecentNotifications = async () => {

    return [

        {
            notificationId: "N001",
            title: "Attendance Sync Completed",
            priority: "LOW",
            isRead: false
        },

        {
            notificationId: "N002",
            title: "Device Offline",
            priority: "HIGH",
            isRead: false
        },

        {
            notificationId: "N003",
            title: "Unknown Face Detected",
            priority: "CRITICAL",
            isRead: true
        }

    ];

};