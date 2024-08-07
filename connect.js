const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('nodeapp', 'root', 'password', {
  host: 'localhost',
  dialect: 'mysql',
});

module.exports = sequelize;
