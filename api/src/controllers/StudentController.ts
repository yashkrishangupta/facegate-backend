import { Request, Response } from "express";
import * as StudentService from "../services/StudentService";

/**
 * GET /students
 */
export const getAllStudents = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const students = await StudentService.getAllStudents();

        res.status(200).json({
            success: true,
            data: students
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch students"
        });
    }
};

/**
 * GET /students/:studentId
 */
export const getStudentById = async (
    req: Request,
    res: Response
): Promise<void> => {

    try {

        const studentId = req.params.studentId as string;

        const student = await StudentService.getStudentById(studentId);

        if (!student) {
            res.status(404).json({
                success: false,
                message: "Student not found"
            });
            return;
        }

        res.status(200).json({
            success: true,
            data: student
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch student"
        });
    }

};

/**
 * GET /students/batch/:batchId
 */
export const getStudentsByBatch = async (
    req: Request,
    res: Response
): Promise<void> => {

    try {

        const batchId = req.params.batchId as string;

        const students = await StudentService.getStudentsByBatch(batchId);

        res.status(200).json({
            success: true,
            data: students
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch batch students"
        });
    }

};

/**
 * POST /students
 */
export const createStudent = async (
    req: Request,
    res: Response
): Promise<void> => {

    try {

        const student = await StudentService.createStudent(req.body);

        res.status(201).json({
            success: true,
            message: "Student created successfully",
            data: student
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to create student"
        });
    }

};

/**
 * PUT /students/:studentId
 */
export const updateStudent = async (
    req: Request,
    res: Response
): Promise<void> => {

    try {

        const studentId = req.params.studentId as string;

        const updatedStudent =
            await StudentService.updateStudent(studentId, req.body);

        res.status(200).json({
            success: true,
            message: "Student updated successfully",
            data: updatedStudent
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to update student"
        });
    }

};

/**
 * DELETE /students/:studentId
 */
export const deleteStudent = async (
    req: Request,
    res: Response
): Promise<void> => {

    try {

        const studentId = req.params.studentId as string;

        await StudentService.deleteStudent(studentId);

        res.status(200).json({
            success: true,
            message: "Student deleted successfully"
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to delete student"
        });
    }

};