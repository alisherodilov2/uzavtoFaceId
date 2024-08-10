
const { User, sequelize } = require('../models'); 

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
