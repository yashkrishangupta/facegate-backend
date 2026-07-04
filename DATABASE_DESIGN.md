# FaceGate Database Design

## 1. Student

Stores student information.

Fields:
- id (UUID)
- rollNumber
- fullName
- batch
- email
- phone
- createdAt

---

## 2. Device

Stores Android device information.

Fields:
- id (UUID)
- deviceId
- room
- status
- battery
- storage
- lastSync

---

## 3. Attendance

Stores attendance records.

Fields:
- id (UUID)
- studentId
- sessionId
- deviceId
- timestamp
- confidence
- status

---

## 4. Session

Represents one attendance session.

Fields:
- id (UUID)
- subject
- faculty
- batch
- room
- startTime
- endTime

---

## 5. Timetable

Stores class schedule.

Fields:
- id (UUID)
- day
- period
- subject
- batch
- room
- faculty

---

## 6. Holiday

Stores holidays.

Fields:
- id (UUID)
- title
- date

---

## 7. FaceEmbedding

Stores student face embeddings.

Fields:
- id (UUID)
- studentId
- embeddingVector
- version

---

## 8. Conflict

Stores attendance conflicts.

Fields:
- id (UUID)
- attendanceId
- reason
- resolved
- resolvedBy

---

## 9. ChangeLog

Stores system changes.

Fields:
- id (UUID)
- action
- user
- timestamp