const { Sequelize } = require('sequelize');
const path = require('path');

// Use SQLite for local development simplicity (file-based DB)
// In production, this can be swapped to MySQL easily via dotenv
const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.join(__dirname, '../../database.sqlite'),
    logging: false
});

module.exports = sequelize;
