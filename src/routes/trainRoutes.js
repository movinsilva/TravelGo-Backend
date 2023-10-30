import express from "express";
const router = express.Router();
import {
  getStations,
  getSchedule,
  getAllSchedule,
  getTrainStops,
  getWagonTypes,
  getBookingAggregateDataByMonth,
  getBookingAggregateDataByDay,
  getTrainFrequency,
  createTrainSchedule,
  getStatBoxData,
  deleteTrainSchedule,
  createWagon,
  createFrequency,
} from "../controllers/trainController.js";
import { protectAdmin } from "../middleware/authMiddleware.js";

router.get("/stations", getStations);
router.post("/schedule", getSchedule);

router.get("/admin/schedule", getAllSchedule);
router.get("/admin/train-stations", getTrainStops);
router.get("/admin/wagon-types", getWagonTypes);
router.get("/admin/aggregated-booking-data-month",
  getBookingAggregateDataByMonth
);
router.get("/admin/aggregated-booking-data-day", getBookingAggregateDataByDay);
router.get("/admin/train-frequency", getTrainFrequency);

router.post("/admin/create-train-schedule", createTrainSchedule);
router.get("/admin/stat-box-data", getStatBoxData);
router.delete("/admin/delete-train-schedule", deleteTrainSchedule);

router.post("/admin/create-wagon", createWagon);
router.post("/admin/create-frequency", createFrequency);



// Protected routes

// router.route("/admin/schedule").get(protectAdmin, getAllSchedule);
// router.route("/admin/train-stations").get(protectAdmin, getTrainStops);
// router.route("/admin/wagon-types").get(protectAdmin, getWagonTypes);
// router.route("/admin/aggregated-booking-data-month").get(
//   protectAdmin,
//   getBookingAggregateDataByMonth
// );
// router.route("/admin/aggregated-booking-data-day").get(protectAdmin, getBookingAggregateDataByDay);
// router.route("/admin/train-frequency").get(protectAdmin, getTrainFrequency);

// router.route("/admin/create-train-schedule").post(protectAdmin, createTrainSchedule);
// router.route("/admin/stat-box-data").get(protectAdmin, getStatBoxData);
// router.route("/admin/delete-train-schedule").delete(protectAdmin, deleteTrainSchedule);

// router.route("/admin/create-wagon").post(protectAdmin, createWagon);
// router.route("/admin/create-frequency").post(protectAdmin, createFrequency);





export default router;
