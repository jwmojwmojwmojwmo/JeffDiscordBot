export default (sequelize, DataTypes) => {
    return sequelize.define('rivalsdata', {
        uid: { // marvel rivals uid
            type: DataTypes.STRING,
            primaryKey: true,
            allowNull: false,
            unique: true
        },
        username: { // marvel rivals username
            type: DataTypes.STRING,
            allowNull: false
        }
    }, {
        tableName: 'rivalsdata',
        timestamps: false,
    });
}