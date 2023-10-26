CREATE DATABASE travelgodb;

CREATE TABLE "User" (
    "UserID" UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    "Username" VARCHAR(255),
    "FirstName" VARCHAR(255),
    "LastName" VARCHAR(255),
    "Birthday" DATE,
    "PhoneNo" VARCHAR(20),
    "NIC" VARCHAR(15),
    "Address" VARCHAR(255),
    "PasswordHash" VARCHAR(255),
    "EmailConfirmed" BOOLEAN DEFAULT false,
    "TimeStamp" timestamp DEFAULT current_timestamp
);

CREATE TABLE "Station" (
    "StationID" SERIAL PRIMARY KEY,
    "StationName" VARCHAR(255) NOT NULL,
    "BookingStartStation" INTEGER REFERENCES "Station"("StationID"),
    "BookingEndStation" INTEGER REFERENCES "Station"("StationID"),
    "LineID" INTEGER REFERENCES "Line"("LineID"),
    "Distance" DECIMAL(10, 2)
);

CREATE TABLE "Frequency" (
    "FrequencyID" SERIAL PRIMARY KEY,
    "Name" VARCHAR(255),
    "Monday" BOOLEAN DEFAULT false,
    "Tuesday" BOOLEAN DEFAULT false,
    "Wednesday" BOOLEAN DEFAULT false,
    "Thursday" BOOLEAN DEFAULT false,
    "Friday" BOOLEAN DEFAULT false,
    "Saturday" BOOLEAN DEFAULT false,
    "Sunday" BOOLEAN DEFAULT false
);

CREATE TABLE "TrainSchedule" (
    "TrainNo" INTEGER PRIMARY KEY,
    "TrainName" VARCHAR(255),
    "Source" INTEGER REFERENCES "Station"("StationID"),
    "Destination" INTEGER REFERENCES "Station"("StationID"),
    "ArrivalTime" TIME,
    "DepartureTime" TIME,
    "TrainType" VARCHAR(255),
    "Frequency" INTEGER REFERENCES "Frequency"("FrequencyID"),
    "DefaultWagonsWithDirection" INTEGER[][],
    "InvertedStations" INTEGER[],
    "DefaultTotalSeats" INTEGER
);

CREATE TABLE "TrainStop" (
    "stopID" SERIAL PRIMARY KEY,
    "TrainNo" INTEGER REFERENCES "TrainSchedule"("TrainNo"),
    "StationID" INTEGER REFERENCES "Station"("StationID"),
    "ArrivalTime" TIME,
    "DepartureTime" TIME,
    "Load" INTEGER,
    "PlatformNo" INTEGER
);

CREATE TABLE "Wagon" (
    "WagonID" SERIAL PRIMARY KEY,
    "Capacity" INTEGER,
    "Class" VARCHAR(255),
    "SeatNoScheme" TEXT[][],
    "Description" VARCHAR(255),
    "HasTables" BOOLEAN DEFAULT false,
    "Amenities" TEXT[]
);


CREATE TABLE "Train" (
    "TrainID" SERIAL PRIMARY kEY,
    "TrainNo" INTEGER REFERENCES "TrainSchedule"("TrainNo"),
    "Date" DATE,
    "ChangedWagonsWithDirection" INTEGER[][]
);



CREATE TABLE "Booking" (
    "BookingID" SERIAL PRIMARY KEY,
    "userID" UUID REFERENCES "User"("UserID"),
    "TrainID" INTEGER REFERENCES "Train"("TrainID"),
    "isReturn" BOOLEAN DEFAULT false,
    "Source" INTEGER REFERENCES "Station"("StationID"),
    "Destination" INTEGER REFERENCES "Station"("StationID"),
    "BookedTime" TIMESTAMP,
    "Amount" FLOAT,
    "isPaid" BOOLEAN DEFAULT false
);

CREATE TABLE "SeatBooking" (
    "SeatBookingID" SERIAL PRIMARY KEY,
    "BookingID" INTEGER REFERENCES "Booking"("BookingID"),
    "WagonPosition" INTEGER,
    "WagonID" INTEGER REFERENCES "Wagon"("WagonID"),
    "SeatNo" INTEGER
);

CREATE TABLE "Passenger" (
    "PassengerID" INTEGER REFERENCES "SeatBooking"("SeatBookingID"),
    "NIC" VARCHAR(20),
    "Name" VARCHAR(255),
    "IsMale" BOOLEAN,
    "Age" INTEGER,
    PRIMARY KEY ("PassengerID")
);

CREATE TABLE "Payments" (
    "PaymentID" INTEGER PRIMARY KEY,
    "BookingID" INTEGER REFERENCES "Booking"("BookingID"),
    "Timestamp" TIMESTAMP,
    "isSuccess" BOOLEAN DEFAULT false,
    "Response" VARCHAR(255)
);


--Admin tables

CREATE TABLE "AdminUser" (
    "UserID" UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    "Username" VARCHAR(255),
    "FirstName" VARCHAR(255),
    "LastName" VARCHAR(255),
    "PasswordHash" VARCHAR(255),
);


--Pricing tables..



-- CREATE TABLE "RouteConnector" (
--     "ConnectorID" SERIAL PRIMARY KEY,
--     "LineID1" INTEGER REFERENCES "TrainLine"("LineID"),
--     "LineID2" INTEGER REFERENCES "TrainLine"("LineID"),
--     "MiddleRoutes" INTEGER[],
--     "InitialConnectorStationID" INTEGER REFERENCES "Station"("StationID"),
--     "EndConnectorStationID" INTEGER REFERENCES "Station"("StationID")
-- )

CREATE TABLE "GenralPrice" (
    "Distance" INTEGER PRIMARY kEY,
    "FirstClass" DECIMAL(10, 2),
    "SecondClass" DECIMAL(10, 2),
    "ThirdClass" DECIMAL(10, 2)
)

CREATE TABLE "BookingPrice" (
    "ID" SERIAL PRIMARY KEY,
    "SourceID" INTEGER REFERENCES "Station"("StationID"),
    "DestinationID" INTEGER REFERENCES "Station"("StationID"),
    "FirstClass" DECIMAL(10, 2),
    "SecondClass" DECIMAL(10, 2),
    "ThirdClass" DECIMAL(10, 2),
)

CREATE TABLE "Line" (
    "LineID" SERIAL PRIMARY KEY,
    "LineName" VARCHAR(255),
    "StartStationID" INTEGER REFERENCES "Station"("StationID"),
    "EndStationID" INTEGER REFERENCES "Station"("StationID")
);