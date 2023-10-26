import asyncHandler from "express-async-handler";
import {
  insertBookingService,
  getBookingPriceService,
  getBookingDetailsService,
  getSeatsService,
} from "../services/bookingService.js";

const insertBooking = asyncHandler(async (req, res) => {
  const {
    userID,
    trainID,
    isReturn,
    Source,
    Destination,
    Amount,
    isPaid,
    SeatAmount,
  } = req.body;

  res
    .status(200)
    .json(
      await insertBookingService(
        userID,
        trainID,
        isReturn,
        Source,
        Destination,
        Amount,
        isPaid,
        SeatAmount
      )
    );
});

// Admin api: list of prices
const getBookingPrice = asyncHandler(async (req, res) => {
  res.status(200).json(await getBookingPriceService());
});

const getBookingDetails = asyncHandler(async (req, res) => {
  const { trainNo, startStation, endStation, date } = req.body;
  res
    .status(200)
    .json(
      await getBookingDetailsService(trainNo, startStation, endStation, date)
    );
});

const getSeats = asyncHandler(async (req, res) => {
  const { trainNo, date, startStation, endStation } = req.body;

  res
    .status(200)
    .json(await getSeatsService(trainNo, date, startStation, endStation));
});

export { insertBooking, getBookingPrice, getBookingDetails, getSeats };
