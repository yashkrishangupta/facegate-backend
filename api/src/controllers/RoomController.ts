import { Request, Response } from "express";
import * as RoomService from "../services/RoomService";
import * as ChangeLogRepository from "../repositories/ChangeLogRepository";

/**
 * Get All Rooms
 */
export const getAllRooms = async (
    req: Request,
    res: Response
): Promise<void> => {

    try {

        const rooms = await RoomService.getAllRooms();

        res.status(200).json({
            success: true,
            data: rooms
        });

    } catch {

        res.status(500).json({
            success: false,
            message: "Failed to fetch rooms"
        });

    }

};

/**
 * Get Room By ID
 */
export const getRoomById = async (
    req: Request,
    res: Response
): Promise<void> => {

    try {

        const roomId = req.params.roomId as string;
        const room = await RoomService.getRoomById(roomId);

        if (!room) {
            res.status(404).json({
                success: false,
                message: "Room not found"
            });
            return;
        }

        res.status(200).json({
            success: true,
            data: room
        });

    } catch {

        res.status(500).json({
            success: false,
            message: "Failed to fetch room"
        });

    }

};

/**
 * Create Room
 */
export const createRoom = async (
    req: Request,
    res: Response
): Promise<void> => {

    try {

        const room = await RoomService.createRoom(req.body);

        await ChangeLogRepository.recordChange(
            req.user?.adminId ?? null, "room", room.room_id, "CREATE", null, room
        );

        res.status(201).json({
            success: true,
            message: "Room created successfully",
            data: room
        });

    } catch (err: any) {

        res.status(400).json({
            success: false,
            message: err?.message || "Room creation failed"
        });

    }

};

/**
 * Update Room
 */
export const updateRoom = async (
    req: Request,
    res: Response
): Promise<void> => {

    try {

        const roomId = req.params.roomId as string;
        const room = await RoomService.updateRoom(roomId, req.body);

        await ChangeLogRepository.recordChange(
            req.user?.adminId ?? null, "room", roomId, "UPDATE", null, req.body
        );

        res.status(200).json({
            success: true,
            message: "Room updated successfully",
            data: room
        });

    } catch {

        res.status(500).json({
            success: false,
            message: "Failed to update room"
        });

    }

};

/**
 * Deactivate Room
 */
export const deactivateRoom = async (
    req: Request,
    res: Response
): Promise<void> => {

    try {

        const roomId = req.params.roomId as string;
        const result = await RoomService.deactivateRoom(roomId);

        await ChangeLogRepository.recordChange(
            req.user?.adminId ?? null, "room", roomId, "DELETE"
        );

        res.status(200).json({
            success: true,
            message: "Room deactivated successfully",
            data: result
        });

    } catch {

        res.status(500).json({
            success: false,
            message: "Failed to deactivate room"
        });

    }

};
