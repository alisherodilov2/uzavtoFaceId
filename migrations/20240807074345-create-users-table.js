  'use strict';

  /** @type {import('sequelize-cli').Migration} */
  module.exports = {
    up: async (queryInterface, Sequelize) => {
      await queryInterface.createTable('users', {
        id: {
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
          type: Sequelize.INTEGER
        },
        fullname: {
          type: Sequelize.STRING,
          allowNull: true
        },
        cardNo:{
          type: Sequelize.STRING,
          allowNull: true
        },
        event:{
          type: Sequelize.STRING,
          allowNull: true
        },
        type:{
          type:Sequelize.INTEGER,
          allowNull: true
        },
        time:{
          type: Sequelize.DATE,
          allowNull: true
        }
      });
    },

    down: async (queryInterface, Sequelize) => {
      await queryInterface.dropTable('users');
    }
  };
