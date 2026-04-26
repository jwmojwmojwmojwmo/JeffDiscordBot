export default (sequelize, DataTypes) => {
    return sequelize.define('inventory', {
        userid: { 
            type: DataTypes.STRING,
            primaryKey: true
        },
        itemid: {
            type: DataTypes.STRING,
            primaryKey: true
        },
        amount: { 
            type: DataTypes.INTEGER,
            defaultValue: 0,
            allowNull: false
        }
    }, {
        tableName: 'inventory',
        timestamps: false,
    });
}