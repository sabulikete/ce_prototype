const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Event = sequelize.define('Event', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    date: {
        type: DataTypes.DATE, // Storing as date/time
        allowNull: false
    },
    location: {
        type: DataTypes.STRING,
        allowNull: false
    },
    visibility: {
        type: DataTypes.ENUM('PUBLIC', 'MEMBERS_ONLY'),
        defaultValue: 'MEMBERS_ONLY'
    }
}, {
    timestamps: true
});

module.exports = Event;
