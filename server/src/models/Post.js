const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Post = sequelize.define('Post', {
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
    type: {
        type: DataTypes.ENUM('announcement', 'event', 'memo'),
        allowNull: false,
        defaultValue: 'announcement'
    },
    visibility: {
        type: DataTypes.ENUM('public', 'member'),
        defaultValue: 'member'
    },
    status: {
        type: DataTypes.ENUM('draft', 'published', 'archived'),
        defaultValue: 'published'
    },
    is_pinned: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    // Event-specific fields
    event_start_at: {
        type: DataTypes.DATE,
        allowNull: true
    },
    event_end_at: {
        type: DataTypes.DATE,
        allowNull: true
    },
    location: {
        type: DataTypes.STRING,
        allowNull: true
    },
    image_url: {
        type: DataTypes.TEXT, // Store base64 or URL
        allowNull: true
    },
    created_by: {
        type: DataTypes.INTEGER,
        allowNull: true // FK to users.id
    },
    updated_by: {
        type: DataTypes.INTEGER,
        allowNull: true
    }
}, {
    timestamps: true,
    underscored: true,
    indexes: [
        { fields: ['status', 'visibility', 'created_at'] },
        { fields: ['type', 'status'] },
        { fields: ['is_pinned', 'created_at'] },
        { fields: ['event_start_at'] }
    ]
});

module.exports = Post;
