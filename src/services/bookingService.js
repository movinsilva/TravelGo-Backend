import DbHandler from "../database/dbHandler.js";
import { getTrainIDService, getWagonTypesService } from "./trainService.js";

const insertBookingService = async (
  userID,
  trainID,
  isReturn,
  Source,
  Destination,
  Amount,
  isPaid,
  SeatAmount
) => {
  const query = `INSERT INTO "Booking" ("userID", "TrainID", "isReturn", "Source", "Destination", "BookedTime", "Amount", "isPaid", "SeatAmount")
    VALUES ('${userID}', ${trainID}, '${isReturn}', '${Source}', '${Destination}', NOW(), '${Amount}', '${isPaid}', '${SeatAmount}') returning*;
    `;
  return await DbHandler.executeSingleQuery(query);
};

const getBookingPriceService = async () => {
  const query = `SELECT
    bp.*,
    ss."StationName" AS "SourceStationName",
    sd."StationName" AS "DestinationStationName"
  FROM
    "BookingPrice" bp
  JOIN
    "Station" ss ON bp."SourceID" = ss."StationID"
  JOIN
    "Station" sd ON bp."DestinationID" = sd."StationID";`;
  return await DbHandler.executeSingleQuery(query);
};

const getBookingDetailsService = async (
  trainNo,
  startStation,
  endStation,
  date
) => {
  const priceQuery = `SELECT * FROM "BookingPrice" 
    WHERE 
      "SourceID"=(SELECT "BookingStartStation" FROM "Station" WHERE "StationID"=${startStation}) 
    AND
      "DestinationID"=(SELECT "BookingEndStation" FROM "Station" WHERE "StationID"=${endStation})`;

  const prices = await DbHandler.executeSingleQuery(priceQuery);

  // Source station distance < booking table's destination station distance
  // and
  // Destination distance > booking table's source station distance
  // The seats booked under this condition are the real booked ones for given source and destination

  const seatQuery = `SELECT COUNT("Booking"."BookingID") as "BookedCount", "Wagon"."Class"
      FROM "Booking"
      JOIN "Station" ON "Booking"."Source" = "Station"."StationID"
      JOIN "Station" as "s" ON "Booking"."Destination" = "s"."StationID"
      JOIN "SeatBooking" ON "Booking"."BookingID" = "SeatBooking"."BookingID"
      JOIN "Wagon" ON "SeatBooking"."WagonID" = "Wagon"."WagonID"
      WHERE "Booking"."TrainID" = (
          SELECT "TrainID" 
          FROM "Train" 
          WHERE "TrainNo" = ${trainNo} AND "Date" = '${date}'
      ) 
      AND CASE
          WHEN (SELECT "Distance" FROM "Station" WHERE "StationID" = ${startStation}) < (SELECT "Distance" FROM "Station" WHERE "StationID" = ${endStation})
          THEN "Station"."Distance" < (SELECT "Distance" FROM "Station" WHERE "StationID" = ${endStation}) 
          AND "s"."Distance" > (SELECT "Distance" FROM "Station" WHERE "StationID" = ${startStation})
          
          ELSE "Station"."Distance" > (SELECT "Distance" FROM "Station" WHERE "StationID" = ${endStation})
          AND "s"."Distance" < (SELECT "Distance" FROM "Station" WHERE "StationID" = ${startStation})
      END
      GROUP BY "Wagon"."Class";`;

  const seats = await DbHandler.executeSingleQuery(seatQuery);

  return { ...prices[0], seats };
};

const getSeatsService = async (trainNo, date, startStation, endStation) => {
  const wagonTypes = await DbHandler.executeSingleQuery(
    `SELECT * FROM "Wagon"`
  );

  // Source station distance < booking table's destination station distance
  // and
  // Destination distance > booking table's source station distance
  // The seats booked under this condition are the real booked ones for given source and destination

  const seatQuery = `SELECT "SeatBooking".*
      FROM "Booking"
      JOIN "Station" ON "Booking"."Source" = "Station"."StationID"
      JOIN "Station" as "s" ON "Booking"."Destination" = "s"."StationID"
      JOIN "SeatBooking" ON "Booking"."BookingID" = "SeatBooking"."BookingID"
      WHERE "Booking"."TrainID" = (
          SELECT "TrainID" 
          FROM "Train" 
          WHERE "TrainNo" = ${trainNo} AND "Date" = '${date}'
      ) 
      AND CASE
          WHEN (SELECT "Distance" FROM "Station" WHERE "StationID" = ${startStation}) < (SELECT "Distance" FROM "Station" WHERE "StationID" = ${endStation})
          THEN "Station"."Distance" < (SELECT "Distance" FROM "Station" WHERE "StationID" = ${endStation}) 
          AND "s"."Distance" > (SELECT "Distance" FROM "Station" WHERE "StationID" = ${startStation})
          
          ELSE "Station"."Distance" > (SELECT "Distance" FROM "Station" WHERE "StationID" = ${endStation})
          AND "s"."Distance" < (SELECT "Distance" FROM "Station" WHERE "StationID" = ${startStation})
      END;`;

  const seats = await DbHandler.executeSingleQuery(seatQuery);

  return { WagonTypes: wagonTypes, BookedSeats: seats };
};

const checkSeatsAvailableService = async (
  trainNo,
  date,
  Source,
  Destination,
  seatList
) => {
  const trainID = await getTrainIDService(trainNo, date);
  console.log(
    "🚀 ~ file: bookingService.js:123 ~ checkSeatsAvailableService ~ trainID:",
    trainID
  );
  const trainIDData = trainID && trainID[0].TrainID;

  const seatQueryCheck = `SELECT "SeatBooking"."SeatNo"
    FROM "Booking"
    JOIN "Station" ON "Booking"."Source" = "Station"."StationID"
    JOIN "Station" as "s" ON "Booking"."Destination" = "s"."StationID"
    JOIN "SeatBooking" ON "Booking"."BookingID" = "SeatBooking"."BookingID"
    WHERE "Booking"."TrainID" = ${trainIDData}
    AND CASE
        WHEN (SELECT "Distance" FROM "Station" WHERE "StationID" = ${Source}) < (SELECT "Distance" FROM "Station" WHERE "StationID" = ${Destination})
        THEN "Station"."Distance" < (SELECT "Distance" FROM "Station" WHERE "StationID" = ${Destination}) 
        AND "s"."Distance" > (SELECT "Distance" FROM "Station" WHERE "StationID" = ${Source})
        
        ELSE "Station"."Distance" > (SELECT "Distance" FROM "Station" WHERE "StationID" = ${Destination})
        AND "s"."Distance" < (SELECT "Distance" FROM "Station" WHERE "StationID" = ${Source})
    END;`;

  const bookedSeats = await DbHandler.executeSingleQuery(seatQueryCheck);
  console.log("🚀 ~ file: bookingService.js:152 ~ bookedSeats:", bookedSeats);

  // Check if there are any seat numbers in seatList that match the SeatNo values in bookedSeats
  const haveMatchingSeats = seatList.some((seat) => {
    const seatNoToCheck = seat[0];
    return bookedSeats.some(
      (bookedSeat) => bookedSeat.SeatNo === seatNoToCheck
    );
  });

  if (haveMatchingSeats) {
    console.log("There are matching seats.");
    return false;
  } else {
    console.log("No matching seats found.");
    return true;
  }
};

const bookSeatsService = async (
  userID,
  trainNo,
  date,
  isReturn,
  Source,
  Destination,
  Amount,
  SeatAmount,
  seatList
) => {
  const trainID = await getTrainIDService(trainNo, date);
  const trainIDData = trainID && trainID[0].TrainID;

  const booking = await insertBookingService(
    userID,
    trainIDData,
    isReturn,
    Source,
    Destination,
    Amount,
    false,
    SeatAmount
  );

  seatList.forEach(async (element) => {
    const seatQuery = `INSERT INTO "SeatBooking" ("BookingID", "WagonPosition", "SeatNo", "WagonID") VALUES (${booking[0].BookingID}, ${element[1]}, ${element[0]}, ${element[2]})`;
    await DbHandler.executeSingleQuery(seatQuery);
  });

  return booking;
};

const paymentService = async (
  bookingID,
  paymentMethod,
  cardNumber,
  cardHolderName,
  cardExpiryMonth,
  CardExpiryYear,
  cvv,
  amount,
  isSave
) => {
  try {
    const cardSaveQuery = `INSERT INTO "CardDetail" ("Type", "CardNumber", "CardHolderName", 
  "CardExpiryMonth", "CardExpiryYear") VALUES ('${paymentMethod}', ${cardNumber}, 
  '${cardHolderName}', ${cardExpiryMonth}, ${CardExpiryYear})`;

  if(isSave) {
    DbHandler.executeSingleQuery(cardSaveQuery);
  }

  const bookingUpdateQuery = `UPDATE "Booking"
  SET "isPaid" = TRUE
  WHERE "BookingID" = ${bookingID};
  `
  await DbHandler.executeSingleQuery(bookingUpdateQuery);
  // Run some validation on given data
  return "Payment is successful!"
  } catch (e) {
    const deleteQuery = `DELETE FROM "SeatBooking"
    WHERE "BookingID" = ${bookingID};
    `

    const deleteQuery1 = `DELETE FROM "Booking"
    WHERE "BookingID" = ${bookingID};
    `
    await DbHandler.executeSingleQuery(deleteQuery)
    await DbHandler.executeSingleQuery(deleteQuery1)

    throw new Error("Some error occured! Bookings roll backed.")
  }
};

export {
  insertBookingService,
  getBookingPriceService,
  getBookingDetailsService,
  getSeatsService,
  bookSeatsService,
  checkSeatsAvailableService,
};
