export default (sequelize, DataTypes) => {
    return sequelize.define('equipment', {
        userid: { 
            type: DataTypes.STRING,
            primaryKey: true
        },
        itemid: {
            type: DataTypes.STRING,
            primaryKey: true
        },
        slot: {
            type: DataTypes.STRING
        }
    }, {
        tableName: 'equipment',
        timestamps: false,
    });
}