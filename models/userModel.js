// models/userModel.js
module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    fullname: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    cardNo: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    event: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    type:{
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    time: {
      type: DataTypes.DATE,
      allowNull: true,
    }
  }, {
    tableName: 'users',
    timestamps: false,
  });

  return User;
};
