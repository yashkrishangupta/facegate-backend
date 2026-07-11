import { Router } from "express";
import {
  getAllStudents,
  getStudentById,
  getStudentsByBatch,
  createStudent,
  updateStudent,
  deleteStudent
} from "../controllers/StudentController";
import { requireAuth, requireAdmin } from "../middleware/auth";

const router = Router();

router.use(requireAuth);

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
router.post("/", requireAdmin, createStudent);

// Update
router.put("/:studentId", requireAdmin, updateStudent);

// Delete
router.delete("/:studentId", requireAdmin, deleteStudent);
export default router;