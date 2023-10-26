const validateEmail = (Email) => {
    if (!validator.isEmail(Email)) {
      return false;
    }
    return true;
  };

 module.exports = validateEmail ;