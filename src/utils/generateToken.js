import jwt from "jsonwebtoken";

const generateToken = (res, username) => {
    const token = jwt.sign(
        {
            username
        },
        process.env.JWT_SECRET,
        {
            expiresIn: '1h'
        }
    );

    /**
     * secure - whether https
     * sameSite - prevent csrf attacks
     */
    res.cookie('jwt', token, {
        httpOnly: true,
        secure: false,
        sameSite: 'strict',
        maxAge: 60 * 60 * 1000
    });

};

const generateTokenBooking = (res, username, bookingId) => {
    const token = jwt.sign(
        {
            username,
        },
        process.env.JWT_SECRET_BOOKING,
        {
            expiresIn: '460s'
        }
    );
    res.cookie('jwt_booking', token, {
        httpOnly: true,
        secure: false,
        sameSite: 'strict',
        maxAge: 8 * 60 * 1000
    })
}


const generateTokenAdmin = (res, username) => {
    const token = jwt.sign(
        {
            username
        },
        process.env.JWT_SECRET_ADMIN,
        {
            expiresIn: '1h'
        }
    );

    /**
     * secure - whether https
     * sameSite - prevent csrf attacks
     */
    res.cookie('jwt_admin', token, {
        httpOnly: true,
        secure: false,
        sameSite: "strict",
        maxAge: 60 * 60 * 1000,
        
    });

};



export {generateToken, generateTokenAdmin, generateTokenBooking};