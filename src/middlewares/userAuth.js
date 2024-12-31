const User = require('../models/user');
const jwt = require('jsonwebtoken');

const userAuth = async (req, res, next) => {
    try {
        // Verify token from cookies
        const { token } = req.cookies;
        console.log('Token received:', token);

        if (!token) {
            return res.status(401).send('Please Login!'); // Unauthorized access
        }

        // Decode and verify the token
        const decodeToken = jwt.verify(token, "ahir@2000");

        // Check if the decoded token has an _id
        if (!decodeToken || !decodeToken._id) {
            return res.status(403).send('Invalid token!'); // Forbidden if token is invalid
        }

        // Find the user by decoded _id
        const user = await User.findById(decodeToken._id);
        
        if (!user) {
            return res.status(404).send('User not found'); // User not found
        }

        // Attach user to the request object for use in subsequent routes
        req.user = user;

        // Proceed to the next middleware or route handler
        next();
    } catch (err) {
        console.error("Authentication error:", err.message);
        // Handle invalid token or expired token
        res.status(400).send("ERROR : " + err.message); // Bad request for errors
    }
}

module.exports = userAuth;
