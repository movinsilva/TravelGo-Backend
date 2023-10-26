import DbHandler from "../database/dbHandler.js";

const getStationsService = async () => {
  return await DbHandler.executeSingleQuery('SELECT * FROM "Station"');
};

const getScheduleService = async (sourceID, destID, day) => {
  const dayString = '"' + day + '"';
  console.log(dayString);

  var query1 = `SELECT
    ts."TrainNo",
    ts."TrainName",
    trainStart."StationName" as "TrainStartStation",
    ts."ArrivalTime",
    trainEnd."StationName" as "TrainEndStation",
    ts."DepartureTime",
    ts."TrainType",
    ts."DefaultWagonsWithDirection",
    f."Name" AS "FrequencyName",
    ts."Frequency",
    ts."InvertedStations",
    ts."DefaultTotalSeats",
    t."SourceStationID",
    t."DestinationStationID",
    t."ArrivalTimeAtSource",
    t."DepartureTimeAtSource",
    t."ArrivalTimeAtDestination",
    t."DepartureTimeAtDestination"
FROM
    "TrainSchedule" ts
JOIN 
    "Station" trainStart ON trainStart."StationID" = ts."Source"
JOIN 
    "Station" trainEnd ON trainEnd."StationID" = ts."Destination"
JOIN
    "Frequency" f ON ts."Frequency" = f."FrequencyID"
JOIN
    (
        SELECT
            a."TrainNo",
            a."StationID" AS "SourceStationID",

            a."ArrivalTime" AS "ArrivalTimeAtSource",
            a."DepartureTime" AS "DepartureTimeAtSource",
            b."StationID" AS "DestinationStationID",
            b."ArrivalTime" AS "ArrivalTimeAtDestination",
            b."DepartureTime" AS "DepartureTimeAtDestination"
        FROM
            "TrainStop" a
        JOIN
            "TrainStop" b ON a."TrainNo" = b."TrainNo"
        WHERE
            a."StationID" = ${sourceID}
            AND b."StationID" = ${destID}
    ) t ON ts."TrainNo" = t."TrainNo"
WHERE
    f.${dayString} = true
ORDER BY
    ts."TrainNo";`;

  const res = await DbHandler.executeSingleQuery(query1);

  for (let index = 0; index < res.length; index++) {
    //Adding a load array for the train
    const query2 = `SELECT array_agg("Load"::integer) AS "LoadArray"
      FROM (
          SELECT "Load"
          FROM "TrainStop"
          WHERE "TrainNo" = ${res[index].TrainNo}
          ORDER BY "ArrivalTime"
      ) AS sorted_stops;`;

    const load = await DbHandler.executeSingleQuery(query2);

    res[index].load = load[0].LoadArray;

    /* FINDING CLASS NAMES OF WAGONS IN THE TRAIN */

    // Taking distinct wagonID s
    const distinctElements = [];
const seen = new Map();


for (const nestedArray of res[index].DefaultWagonsWithDirection) {
  const firstElement = nestedArray[0];
  if (seen.has(firstElement)) {
    // If we've seen this element before, increment its count
    seen.set(firstElement, seen.get(firstElement) + 1);
  } else {
    // If it's the first time, set the count to 1
    seen.set(firstElement, 1);
    distinctElements.push(firstElement);
  }
}
console.log("🚀 ~ file: trainService.js:74 ~ getScheduleService ~ seen:", seen)

    
    // Changing the array to a usable string in sql. Ex: [1,2] --> "(1,2)"
  const distinctString = `(${distinctElements.join(', ')})`;
console.log("🚀 ~ file: trainService.js:90 ~ getScheduleService ~ distinctString:", distinctString)
    const query3 = `SELECT "Class", "Capacity", "WagonID" FROM "Wagon" WHERE "WagonID" IN ${distinctString}; `;
    const classes = await DbHandler.executeSingleQuery(query3);
    console.log("🚀 ~ file: trainService.js:95 ~ getScheduleService ~ classes:", classes)

    // add new field called count to each object in the returned array which is the count of that class.
    const result = classes.map(item => {
      const count = seen.get(item.WagonID);
      return { ...item, count };
    });
    res[index].classes = result;

    
  }


  return res;
};

const getAllScheduleService = async () => {
  return await DbHandler.executeSingleQuery('SELECT * FROM "TrainSchedule";');
};

const getTrainStopsService = async (page, pageSize, sort, search) => {
  console.log(
    "🚀 ~ file: trainService.js:60 ~ getTrainStopsService ~ search:",
    search
  );
  let sql = `SELECT * FROM "TrainStop" `;

  if (search) {
    sql += `WHERE
                    CAST("stopID" AS TEXT) LIKE '%${search}%'
                    OR CAST("TrainNo" AS TEXT) LIKE '%${search}%'`;
  }

  if (sort.length > 2) {
    const sortParsed = JSON.parse(sort);
    const { field, sort: sortOrder } = sortParsed;
    sql += `ORDER BY "${field}" ${sortOrder} `;
  }

  // Calculate the offset based on the requested page and page size
  const offset = page * pageSize;

  // Add pagination
  sql += `LIMIT ${pageSize} OFFSET ${offset};`;

  console.log(
    "🚀 ~ file: trainService.js:73 ~ getTrainStopsService ~ sql:",
    sql
  );

  return await DbHandler.executeSingleQuery(sql);
};

const getTrainStopsTotalService = async () => {
  return await DbHandler.executeSingleQuery(
    'SELECT COUNT(*) FROM "TrainStop";'
  );
};

const getWagonTypesService = async () => {
  return await DbHandler.executeSingleQuery(
    'SELECT "WagonID", "Capacity", "Class", "Amenities", "HasTables", "Description" FROM "Wagon";'
  );
};

const getBookingAggregateDataByMonthService = async () => {
  return await DbHandler.executeSingleQuery(
    ` WITH MonthlyData AS (SELECT
      TO_CHAR("BookedTime", 'Month') AS "month",
          SUM("Amount") AS "total_booking_amount",
          COUNT(*) AS "total_customers"
      FROM
          (SELECT * FROM "Booking" WHERE
      EXTRACT(YEAR FROM "BookedTime")=2023) AS "2023Booking"
      GROUP BY
          TO_CHAR("BookedTime", 'Month'))
  SELECT
      SUM(MonthlyData."total_customers") AS "yearly_total_customers",
      SUM(MonthlyData."total_booking_amount") AS "yearly_booking_amount_total",
      json_agg(
          json_build_object(
              'month', MonthlyData."month",
              'total_booking_amount', MonthlyData."total_booking_amount",
              'total_customers', MonthlyData."total_customers"
          )
      ) AS "monthly_data"
  FROM
      MonthlyData`
  );
};

const getBookingAggregateDataByDayService = async () => {
  return await DbHandler.executeSingleQuery(
    `WITH DailyData AS (
      SELECT
          DATE("BookedTime") AS "day",
          SUM("Amount") AS "total_booking_amount",
          COUNT(*) AS "total_customers"
      FROM
          (SELECT * FROM "Booking" WHERE EXTRACT(YEAR FROM "BookedTime") = 2023) AS "2023Booking"
      GROUP BY
          DATE("BookedTime")
  )
  SELECT
    json_agg(
          json_build_object(
              'day', DailyData."day",
              'total_booking_amount', DailyData."total_booking_amount",
              'total_customers', DailyData."total_customers"
          )
      ) AS "daily_data"
  FROM
      DailyData`
  );
};

const getTrainFrequencyService = async () => {
  return await DbHandler.executeSingleQuery(
    `SELECT "Name", "FrequencyID" from "Frequency";`
  );
};

const createTrainScheduleService = async (
  trainNo,
  trainName,
  source,
  dest,
  arrivalTime,
  departureTime,
  trainType,
  frequency,
  defaultWagonsWithDirection,
  invertedStations
) => {
  console.log(
    "🚀 ~ file: trainService.js:173 ~ defaultWagonsWithDirection:",
    defaultWagonsWithDirection
  );
  // Convert the defaultWagonsWithDirection array to a PostgreSQL array format
  const defaultWagonsArray = defaultWagonsWithDirection
    .map((item) => `{${item.join(",")}}`)
    .join(",");

  var query = `INSERT INTO "TrainSchedule" ("TrainNo", "TrainName", "Source", "Destination", "ArrivalTime", "DepartureTime", 
              "TrainType", "Frequency", "DefaultWagonsWithDirection", "InvertedStations") 
              VALUES (${trainNo}, '${trainName}', ${source}, ${dest}, '${getTimeFormat(
    arrivalTime
  )}', '${getTimeFormat(departureTime)}',
               '${trainType}', ${frequency},'{${defaultWagonsArray}}', '{${invertedStations}}') returning*`;

  console.log("train schedule create query: ", query);

  return await DbHandler.executeSingleQuery(query);
};

const getTimeFormat = (dateInput) => {
  //making arrivalTime and departureTime into usable format for DB
  const dateConverted = new Date(dateInput);

  // Extract the hours, minutes, and seconds from the Date object
  const hours = dateConverted.getHours();
  const minutes = dateConverted.getMinutes();
  const seconds = dateConverted.getSeconds();

  // Format the time as "HH:MM:SS" string
  const formattedArrivalTime = `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

  return formattedArrivalTime;
};

const getStatBoxDataService = async () => {
  const totalUsers = await DbHandler.executeSingleQuery(
    `SELECT COUNT(*) AS "total_users" FROM "User"`
  );

  const newUsersThisMonth = await DbHandler.executeSingleQuery(
    `SELECT
    SUM(CASE WHEN DATE_TRUNC('month', "TimeStamp") = DATE_TRUNC('month', CURRENT_DATE) THEN 1 ELSE 0 END) AS "new_users_current_month"
    FROM
        "User"
    WHERE
        DATE_PART('year', "TimeStamp") = DATE_PART('year', CURRENT_DATE);`
  );

  const todaySales = await DbHandler.executeSingleQuery(
    `SELECT SUM("Amount") AS "TotalSales"
    FROM "Booking"
    WHERE DATE("BookedTime") = CURRENT_DATE;`
  );

  const yesterdaySales = await DbHandler.executeSingleQuery(
    `SELECT SUM("Amount") AS "TotalSales"
    FROM "Booking"
    WHERE DATE("BookedTime") = CURRENT_DATE - INTERVAL '1 day';`
  );

  const salesDayGain = (
    ((todaySales[0].TotalSales - yesterdaySales[0].TotalSales) /
      yesterdaySales[0].TotalSales) *
    100
  ).toFixed(2);

  // const monthlySales = await DbHandler.executeSingleQuery(
  //   `SELECT SUM("Amount") AS "TotalSales"
  //   FROM "Booking"
  //   WHERE EXTRACT(MONTH FROM "BookedTime") = EXTRACT(MONTH FROM CURRENT_DATE)
  //     AND EXTRACT(YEAR FROM "BookedTime") = EXTRACT(YEAR FROM CURRENT_DATE);`
  // );

  // const previousMonthSales = await DbHandler.executeSingleQuery(
  //   `SELECT SUM("Amount") AS "TotalSales"
  //   FROM "Booking"
  //   WHERE EXTRACT(MONTH FROM "BookedTime") = EXTRACT(MONTH FROM (CURRENT_DATE - INTERVAL '1 month'))
  //     AND EXTRACT(YEAR FROM "BookedTime") = EXTRACT(YEAR FROM (CURRENT_DATE - INTERVAL '1 month'));`
  // )

  const sales = await DbHandler.executeSingleQuery(
    `SELECT
    ROUND(SUM(CASE
        WHEN EXTRACT(MONTH FROM "BookedTime") = EXTRACT(MONTH FROM CURRENT_DATE)
             AND EXTRACT(YEAR FROM "BookedTime") = EXTRACT(YEAR FROM CURRENT_DATE)
        THEN "Amount"::NUMERIC
        ELSE 0
    END), 2) AS "TotalSalesCurrentMonth",
    
    ROUND(SUM(CASE
        WHEN EXTRACT(YEAR FROM "BookedTime") = EXTRACT(YEAR FROM CURRENT_DATE)
        THEN "Amount"::NUMERIC
        ELSE 0
    END), 2) AS "TotalSalesCurrentYear"
FROM "Booking";`
  );

  const prevSales = await DbHandler.executeSingleQuery(
    `SELECT
    ROUND(SUM(CASE
        WHEN EXTRACT(MONTH FROM "BookedTime") = EXTRACT(MONTH FROM CURRENT_DATE - INTERVAL '1 month')
             AND EXTRACT(YEAR FROM "BookedTime") = EXTRACT(YEAR FROM CURRENT_DATE - INTERVAL '1 month')
        THEN "Amount"::NUMERIC
        ELSE 0
    END), 2) AS "TotalSalesPreviousMonth",
    
    ROUND(SUM(CASE
        WHEN EXTRACT(YEAR FROM "BookedTime") = EXTRACT(YEAR FROM CURRENT_DATE - INTERVAL '1 year')
        THEN "Amount"::NUMERIC
        ELSE 0
    END), 2) AS "TotalSalesPreviousYear"
FROM "Booking";
`
  );
  const salesMonthlyGain = (
    ((sales[0].TotalSalesCurrentMonth - prevSales[0].TotalSalesPreviousMonth) /
      prevSales[0].TotalSalesPreviousMonth) *
    100
  ).toFixed(2);
  const salesYearlyGain = (
    ((sales[0].TotalSalesCurrentYear - prevSales[0].TotalSalesPreviousYear) /
      prevSales[0].TotalSalesPreviousYear) *
    100
  ).toFixed(2);

  const bookings = await DbHandler.executeSingleQuery(
    `SELECT
    b."BookingID",
	  t."TrainNo",
    ts."TrainName",
    b."Amount",
    TO_CHAR(DATE(DATE_TRUNC('DAY', b."BookedTime")), 'YYYY-MM-DD') AS "BookingDate",

	ss."StationName" AS "Source",
	sd."StationName" AS "Destination"
FROM
    "Booking" b
JOIN
    "Train" t ON b."TrainID" = t."TrainID"
JOIN
    "TrainSchedule" ts ON t."TrainNo" = ts."TrainNo"
JOIN
	"Station" ss ON ss."StationID" = b."Source"
JOIN
	"Station" sd ON sd."StationID" = b."Destination";`
  );

  return {
    ...totalUsers[0],
    ...newUsersThisMonth[0],
    ...todaySales[0],
    salesDayGain: salesDayGain,
    ...sales[0],
    salesMonthlyGain: salesMonthlyGain,
    salesYearlyGain: salesYearlyGain,
    bookings: bookings,
  };
};

const deleteTrainScheduleService = async (TrainNo) => {
  return await DbHandler.executeSingleQuery(
    `DELETE FROM "TrainSchedule"
    WHERE "TrainNo" = ${TrainNo};
     `
  );
};

const createWagonService = async (
  Capacity,
  Class,
  SeatNoScheme,
  Description,
  HasTables,
  Amenities
) => {
  // Replace square brackets with curly brackets
  const AmenitiesFormatted = `{ ${Amenities.map((item) => `"${item}"`).join(
    ", "
  )} }`;

  const query = `INSERT INTO "Wagon" ("Capacity", "Class", "SeatNoScheme", "Description", "HasTables", "Amenities" )
  VALUES (${Capacity}, '${Class}', '${SeatNoScheme}', '${Description}', '${HasTables}', '${AmenitiesFormatted}') returning*;`;
  console.log(query);
  return await DbHandler.executeSingleQuery(query);
};

const createFrequencyService = async (
  frequencyName,
  monday,
  tuesday,
  wednesday,
  thursday,
  friday,
  saturday,
  sunday
) => {
  const query = `INSERT INTO "Frequency" ("Name", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday")
  VALUES ('${frequencyName}', '${monday}', '${tuesday}', '${wednesday}', '${thursday}', '${friday}', '${saturday}', '${sunday}')`;

  console.log(query);
  return await DbHandler.executeSingleQuery(query);
};

const getTrainIDService = async (trainNo, date) => {
  const trainIDQuery = `SELECT "TrainID" 
    FROM "Train" 
    WHERE "TrainNo" = ${trainNo} AND "Date" = '${date}'`

    return await DbHandler.executeSingleQuery(trainIDQuery);
}

export {
  getStationsService,
  getScheduleService,
  getAllScheduleService,
  getTrainStopsService,
  getTrainStopsTotalService,
  getWagonTypesService,
  getBookingAggregateDataByMonthService,
  getBookingAggregateDataByDayService,
  getTrainFrequencyService,
  createTrainScheduleService,
  getStatBoxDataService,
  deleteTrainScheduleService,
  createWagonService,
  createFrequencyService,
  getTrainIDService
};
