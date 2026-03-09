export default (sequelize, DataTypes) => {
    return sequelize.define('pets', {
        userid: { 
            type: DataTypes.STRING,
            primaryKey: true
        },
        name: {
            type: DataTypes.STRING,
            defaultValue: "Jeff",
            allowNull: false
        },
        picture: {
            type: DataTypes.STRING,
            defaultValue: "jeff.webp"
        },
        xp: { 
            type: DataTypes.INTEGER,
            defaultValue: 0,
            allowNull: false
        },
        hunger: {
            type: DataTypes.INTEGER,
            defaultValue: 100,
            allowNull: false
        },
        affection: {
            type: DataTypes.INTEGER,
            defaultValue: 50,
            allowNull: false
        },
        last_interacted: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
            allowNull: false
        }
    }, {
        tableName: 'pets',
        timestamps: false,
    });
}