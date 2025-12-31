const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Announcement = sequelize.define('Announcement', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    content: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    visibility: {
        type: DataTypes.ENUM('PUBLIC', 'MEMBERS_ONLY'),
        defaultValue: 'MEMBERS_ONLY'
    },
    category: {
        type: DataTypes.STRING, // e.g. "Maintenance", "General", "Alert"
        defaultValue: 'General'
    }
}, {
    timestamps: true
});

module.exports = Announcement;
