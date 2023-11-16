use user_auth;

DELIMITER //

CREATE TRIGGER before_inserting_user
BEFORE INSERT ON user_auth.users
FOR EACH ROW
BEGIN
  SET NEW.UserID = CONCAT('P', LPAD((SELECT AUTO_INCREMENT FROM information_schema.TABLES WHERE TABLE_SCHEMA = 'user_auth' AND TABLE_NAME = 'users'), 5, '0'));
END;
//

DELIMITER ;