import * as RoomRepository from "../repositories/RoomRepository";

export const getAllRooms = async () => {
    return await RoomRepository.getAllRooms();
};

export const getRoomById = async (roomId: string) => {
    return await RoomRepository.getRoomById(roomId);
};

export const createRoom = async (roomData: any) => {

    if (!roomData.room_number || !roomData.building_name ||
        !roomData.room_type || !roomData.capacity) {
        throw new Error(
            "room_number, building_name, room_type, and capacity are required"
        );
    }

    return await RoomRepository.createRoom(roomData);
};

export const updateRoom = async (roomId: string, roomData: any) => {
    return await RoomRepository.updateRoom(roomId, roomData);
};

export const deactivateRoom = async (roomId: string) => {
    return await RoomRepository.deactivateRoom(roomId);
};
