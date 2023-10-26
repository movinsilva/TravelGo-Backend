import asyncHandler from "express-async-handler";
import {
  insertBookingService,
  getBookingPriceService,
  getBookingDetailsService,
  getSeatsService,
  bookSeatsService,
  checkSeatsAvailableService,
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


const bookSeats = asyncHandler( async (req, res) => {
  const { userID,
    trainNo,
    date,
    isReturn,
    Source,
    Destination,
    Amount,
    seatList} = req.body;


    const SeatAmount = JSON.parse(seatList).length

    const checkSeatsAvailable = await checkSeatsAvailableService(trainNo, date, Source, Destination, JSON.parse(seatList));

    if(checkSeatsAvailable) {
      res.status(200).json(await bookSeatsService(userID,
        trainNo,
        date,
        isReturn,
        Source,
        Destination,
        Amount,
        SeatAmount,
        JSON.parse(seatList)))
    } else {
      res.status(400).json("You are booking an already booked seat!")
    }

  
})

export { insertBooking, getBookingPrice, getBookingDetails, getSeats, bookSeats };
