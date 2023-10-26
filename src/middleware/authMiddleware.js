import jwt from "jsonwebtoken";
import asyncHandler from "express-async-handler";
import { getUserByEmail } from "../services/userService.js";
import { getAdminByEmail } from "../services/adminUserService.js";

const protect = asyncHandler(async (req, res, next) => {
    let token;

    // accessing cookie through cookie parser library
     token = req.cookies.jwt;

     if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            const user = await getUserByEmail(decoded.username);
            delete user[0].PasswordHash;

            req.user = user[0];

            next();
        } catch (error) {
            res.status(401);
            throw new Error('Not authorized. Token invalid.')
        }

     } else {
        res.status(401);
        throw new Error('Not authorized. Token unavailable.');
     }
})

const protectBooking = asyncHandler(async (req, res, next) => {
    let token;

    token = req.cookies.jwt_booking;

    if(token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET_BOOKING);
            console.log("🚀 ~ file: authMiddleware.js:41 ~ protectBooking ~ decoded:", decoded)

            
        } catch (error) {
            res.status(401);
            throw new Error('Not authorized to continue this process!')
        }
    }
})


const protectAdmin = asyncHandler(async (req, res, next) => {
    let token;

    // accessing cookie through cookie parser library
     token = req.cookies.jwt_admin;

     if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET_ADMIN);

            const user = await getAdminByEmail(decoded.username);
            delete user[0].PasswordHash;

            req.user = user[0];
            console.log("🚀 ~ file: authMiddleware.js:47 ~ protectAdmin ~ req.user:", req.user)

            next();
        } catch (error) {
            console.log("🚀 ~ file: authMiddleware.js:51 ~ protectAdmin ~ error:", error)
            res.status(401);
            throw new Error('Not authorized. Token invalid.')
        }

     } else {
        res.status(401);
        throw new Error('Not authorized. Token unavailable.');
     }
})


export { protect, protectAdmin }