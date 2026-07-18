import { Request, Response } from "express";
import * as ExtraPeriodService from "../services/ExtraPeriodService";
import * as ChangeLogRepository from "../repositories/ChangeLogRepository";

/**
 * Extra Period Controller
 *
 * Change-log writes follow the existing BatchController pattern:
 * ChangeLogRepository.recordChange is called directly here using
 * req.user?.adminId ?? null.
 *
 * Faculty ownership enforcement:
 *   - FACULTY users may only create/update/delete their own records.
 *   - ADMIN / SUPER_ADMIN have full access.
 * The `requireRole` middleware on the route already blocks VIEWER.
 */

/* ------------------------------------------------------------------ */
/*  Helper                                                              */
/* ------------------------------------------------------------------ */

const isAdmin = (req: Request): boolean =>
    req.user?.role === "SUPER_ADMIN" || req.user?.role === "ADMIN";

/* ------------------------------------------------------------------ */
/*  GET /api/v1/extra-periods                                           */
/* ------------------------------------------------------------------ */

/**
 * Get Extra Periods
 *
 * Optional query params: faculty_id, batch_id, week_start_date.
 * Faculty users are automatically scoped to their own faculty_id.
 */
export const getAllExtraPeriods = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const { batch_id, week_start_date } = req.query;

        // Faculty users are always scoped to their own records.
        let faculty_id = req.query.faculty_id as string | undefined;
        if (!isAdmin(req)) {
            faculty_id = req.user?.facultyId ?? undefined;
        }

        const data = await ExtraPeriodService.getAllExtraPeriods({
            faculty_id,
            batch_id:        batch_id        as string | undefined,
            week_start_date: week_start_date as string | undefined
        });

        res.status(200).json({ success: true, data });
    } catch {
        res.status(500).json({ success: false, message: "Failed to fetch extra periods" });
    }
};

/* ------------------------------------------------------------------ */
/*  GET /api/v1/extra-periods/:extraPeriodId                           */
/* ------------------------------------------------------------------ */

export const getExtraPeriodById = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const extraPeriodId = req.params.extraPeriodId as string;
        const data = await ExtraPeriodService.getExtraPeriodById(extraPeriodId);

        if (!data) {
            res.status(404).json({ success: false, message: "Extra period not found" });
            return;
        }

        // Faculty may only view their own records.
        if (!isAdmin(req) && data.faculty_id !== req.user?.facultyId) {
            res.status(403).json({ success: false, message: "You don't have permission to do that" });
            return;
        }

        res.status(200).json({ success: true, data });
    } catch {
        res.status(500).json({ success: false, message: "Failed to fetch extra period" });
    }
};

/* ------------------------------------------------------------------ */
/*  POST /api/v1/extra-periods                                         */
/* ------------------------------------------------------------------ */

/**
 * Create Extra Period
 *
 * Faculty users: faculty_id in the body is overridden with their own
 * facultyId from the JWT — they cannot create a period for someone else.
 */
export const createExtraPeriod = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const body = { ...req.body };

        if (!isAdmin(req)) {
            if (!req.user?.facultyId) {
                res.status(403).json({ success: false, message: "Faculty account is not linked to a faculty record" });
                return;
            }
            // Force to caller's own faculty_id regardless of what was sent.
            body.faculty_id = req.user.facultyId;
        }

        const data = await ExtraPeriodService.createExtraPeriod(body);

        await ChangeLogRepository.recordChange(
            req.user?.adminId ?? null,
            "extra_period",
            data.extra_period_id,
            "CREATE",
            null,
            data
        );

        res.status(201).json({
            success: true,
            message: "Extra period created successfully",
            data
        });
    } catch (err: any) {
        res.status(400).json({
            success: false,
            message: err?.message || "Failed to create extra period"
        });
    }
};

/* ------------------------------------------------------------------ */
/*  PUT /api/v1/extra-periods/:extraPeriodId                           */
/* ------------------------------------------------------------------ */

/**
 * Update Extra Period
 *
 * Faculty users may only edit their own records and cannot reassign
 * the period to a different faculty_id.
 */
export const updateExtraPeriod = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const extraPeriodId = req.params.extraPeriodId as string;

        if (!isAdmin(req)) {
            const existing = await ExtraPeriodService.getExtraPeriodById(extraPeriodId);

            if (!existing) {
                res.status(404).json({ success: false, message: "Extra period not found" });
                return;
            }

            if (existing.faculty_id !== req.user?.facultyId) {
                res.status(403).json({ success: false, message: "You can only edit your own extra periods" });
                return;
            }

            // Prevent re-assigning to a different faculty.
            if (req.body.faculty_id && req.body.faculty_id !== req.user?.facultyId) {
                res.status(403).json({ success: false, message: "You cannot reassign an extra period to another faculty member" });
                return;
            }
        }

        const data = await ExtraPeriodService.updateExtraPeriod(extraPeriodId, req.body);

        await ChangeLogRepository.recordChange(
            req.user?.adminId ?? null,
            "extra_period",
            extraPeriodId,
            "UPDATE",
            null,
            req.body
        );

        res.status(200).json({
            success: true,
            message: "Extra period updated successfully",
            data
        });
    } catch (err: any) {
        res.status(400).json({
            success: false,
            message: err?.message || "Failed to update extra period"
        });
    }
};

/* ------------------------------------------------------------------ */
/*  DELETE /api/v1/extra-periods/:extraPeriodId                        */
/* ------------------------------------------------------------------ */

/**
 * Delete Extra Period (soft delete)
 *
 * Faculty users may only delete their own records.
 */
export const deleteExtraPeriod = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const extraPeriodId = req.params.extraPeriodId as string;

        if (!isAdmin(req)) {
            const existing = await ExtraPeriodService.getExtraPeriodById(extraPeriodId);

            if (!existing) {
                res.status(404).json({ success: false, message: "Extra period not found" });
                return;
            }

            if (existing.faculty_id !== req.user?.facultyId) {
                res.status(403).json({ success: false, message: "You can only delete your own extra periods" });
                return;
            }
        }

        await ExtraPeriodService.deleteExtraPeriod(extraPeriodId);

        await ChangeLogRepository.recordChange(
            req.user?.adminId ?? null,
            "extra_period",
            extraPeriodId,
            "DELETE"
        );

        res.status(200).json({
            success: true,
            message: "Extra period deleted successfully"
        });
    } catch (err: any) {
        res.status(400).json({
            success: false,
            message: err?.message || "Failed to delete extra period"
        });
    }
};
