import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import "./config/env";

import studentRoutes from "./routes/students";
import syncRoutes from "./routes/sync";
import attendanceRoutes from "./routes/attendance";
import timetableRoutes from "./routes/timetable";
import deviceRoutes from "./routes/devices";
import holidayRoutes from "./routes/holidays";

const app = express();

app.use(cors());
app.use(helmet());
app.use(morgan("dev"));

app.use(express.json());

app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "FaceGate Backend Running "
    });
});

app.use("/api/v1/students", studentRoutes);
app.use("/api/v1/sync", syncRoutes);
app.use("/api/v1/attendance", attendanceRoutes);
app.use("/api/v1/timetable", timetableRoutes);
app.use("/api/v1/devices", deviceRoutes);
app.use("/api/v1/holidays", holidayRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(` Server running on http://localhost:${PORT}`);
});