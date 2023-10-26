import DbHandler from "../database/dbHandler.js";
import { getWagonTypesService } from "./trainService.js";

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
    `
    return ( await DbHandler.executeSingleQuery(query));
}

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
    "Station" sd ON bp."DestinationID" = sd."StationID";`
    return (await DbHandler.executeSingleQuery(query))
  }

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
      "DestinationID"=(SELECT "BookingEndStation" FROM "Station" WHERE "StationID"=${endStation})`


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
      GROUP BY "Wagon"."Class";`

      const seats = await DbHandler.executeSingleQuery(seatQuery);

      return {...prices[0], seats};
    
  }

  const getSeatsService = async (
    trainNo,
    date,
    startStation,
    endStation
  ) => {
    const wagonTypes = await DbHandler.executeSingleQuery(`SELECT * FROM "Wagon"`);

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
      END;`

      const seats = await DbHandler.executeSingleQuery(seatQuery);

      return {"WagonTypes": wagonTypes,
              "BookedSeats": seats}
  }


export {
    insertBookingService,
    getBookingPriceService,
    getBookingDetailsService,
    getSeatsService
}