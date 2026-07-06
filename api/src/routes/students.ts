import { Router } from "express";
import {
  getAllStudents,
  getStudentById,
  getStudentsByBatch,
  createStudent,
  updateStudent,
  deleteStudent
} from "../controllers/StudentController";

const router = Router();

/**
 * Student Routes
 */

// Get all students
router.get("/", getAllStudents);

// Get students by batch
router.get("/batch/:batchId", getStudentsByBatch);

// Get student by ID
router.get("/:studentId", getStudentById);

// Create
router.post("/", createStudent);

// Update
router.put("/:studentId", updateStudent);

// Delete
router.delete("/:studentId", deleteStudent);
export default router;