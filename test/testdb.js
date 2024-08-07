// // testModels.js
// const db = require('../models'); // Adjust path as needed

// console.log('Models loaded:', db);
// console.log('User model:', db.User); // Check if User model is loaded
// testDatabase.js
const { User, sequelize } = require('../models'); // Adjust path as needed

(async () => {
  try {
    await sequelize.authenticate();
    console.log('Connection has been established successfully.');

    console.log('Models loaded:', { User });
  } catch (error) {
    console.error('Error connecting to the database:', error);
  } finally {
    await sequelize.close();
  }
})();
