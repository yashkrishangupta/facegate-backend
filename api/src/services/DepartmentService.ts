import * as DepartmentRepository from "../repositories/DepartmentRepository";

export const getAllDepartments = async () => await DepartmentRepository.getAllDepartments();
export const getDepartmentById = async (id: string) => await DepartmentRepository.getDepartmentById(id);

export const createDepartment = async (data: any) => {
    if (!data.department_code || !data.department_name) {
        throw new Error("department_code and department_name are required");
    }
    return await DepartmentRepository.createDepartment(data);
};

export const updateDepartment = async (id: string, data: any) => await DepartmentRepository.updateDepartment(id, data);
export const deactivateDepartment = async (id: string) => await DepartmentRepository.deactivateDepartment(id);
