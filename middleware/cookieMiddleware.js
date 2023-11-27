// cookieMiddleware.js
const cookieParser = require('cookie-parser');

const expireCookieMiddleware = (req, res, next) => {
  const cookieName = 'yourCookieName';
  const expirationTime = 30 * 60 * 1000; // 30 minutes in milliseconds

  // Use the cookie-parser middleware
  cookieParser()(req, res, () => {});

  // Check if the cookie exists
  const cookieValue = req.cookies[cookieName];

  if (cookieValue) {
    // If the cookie exists, check its creation time
    const cookieCreationTime = parseInt(cookieValue.split('.')[0]);

    if (Date.now() - cookieCreationTime > expirationTime) {
      // If the cookie has expired, don't send it back to the client
      res.clearCookie(cookieName);
    }
  }

  next();
};

module.exports = { expireCookieMiddleware };
