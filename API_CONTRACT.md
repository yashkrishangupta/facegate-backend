# FaceGate API Contract

## Authentication

- POST /api/auth/login
- POST /api/auth/pair-device
- POST /api/auth/refresh

---

## Students

- GET /api/students
- GET /api/students/{id}
- POST /api/students
- PUT /api/students/{id}
- DELETE /api/students/{id}

---

## Devices

- GET /api/devices
- POST /api/devices/register
- PUT /api/devices/{id}
- DELETE /api/devices/{id}

---

## Attendance

- POST /api/attendance
- GET /api/attendance
- GET /api/attendance/{studentId}
- DELETE /api/attendance/{id}

---

## Timetable

- GET /api/timetable
- POST /api/timetable
- PUT /api/timetable/{id}
- DELETE /api/timetable/{id}

---

## Holidays

- GET /api/holidays
- POST /api/holidays
- PUT /api/holidays/{id}
- DELETE /api/holidays/{id}

---

## Reports

- GET /api/reports/student
- GET /api/reports/batch
- GET /api/reports/subject
- GET /api/reports/room

---

## Dashboard

- GET /api/dashboard

---

## Sync

- POST /api/sync

---

## Conflicts

- GET /api/conflicts
- PUT /api/conflicts/{id}