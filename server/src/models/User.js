const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: true
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true
        }
    },
    password_hash: {
        type: DataTypes.STRING,
        allowNull: true // invitees might not have password yet
    },
    role: {
        type: DataTypes.ENUM('ADMIN', 'MEMBER'),
        defaultValue: 'MEMBER'
    },
    status: {
        type: DataTypes.ENUM('Active', 'Invited', 'Inactive'),
        defaultValue: 'Invited'
    },
    unit: {
        type: DataTypes.STRING,
        allowNull: true
    },
    invite_token: {
        type: DataTypes.STRING,
        allowNull: true
    }
}, {
    timestamps: true
});

module.exports = User;
