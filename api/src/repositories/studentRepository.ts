export const getAllStudents = async () => {
    return [
        {
            student_id: "S001",
            registration_number: "PEC2024001",
            roll_number: "23103001",
            first_name: "Mahima",
            last_name: "Goyal",
            email: "mahima@pec.edu.in",
            phone: "9876543210",
            gender: "Female",
            batch_id: "B001",
            department: "Computer Science",
            semester: 5,
            student_status: "ACTIVE"
        },
        {
            student_id: "S002",
            registration_number: "PEC2024002",
            roll_number: "23103002",
            first_name: "Rahul",
            last_name: "Sharma",
            email: "rahul@pec.edu.in",
            phone: "9876543211",
            gender: "Male",
            batch_id: "B001",
            department: "Computer Science",
            semester: 5,
            student_status: "ACTIVE"
        }
    ];
};

export const getStudentById = async (studentId: string) => {

    const students = await getAllStudents();

    return students.find(student => student.student_id === studentId);
};

export const getStudentsByBatch = async (batchId: string) => {

    const students = await getAllStudents();

    return students.filter(student => student.batch_id === batchId);
};

export const createStudent = async (studentData: any) => {

    return {
        student_id: "S003",
        ...studentData
    };

};

export const updateStudent = async (
    studentId: string,
    studentData: any
) => {

    return {
        student_id: studentId,
        ...studentData
    };

};

export const deleteStudent = async (
    studentId: string
) => {

    return {
        success: true
    };

};