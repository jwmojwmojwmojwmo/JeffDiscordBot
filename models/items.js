export default (sequelize, DataTypes) => {
    return sequelize.define('items', {
        itemid: { // item's id (CCRRNNN), where C is category, RR is rarity, N is unique identifier (which is just 001 - 999 tbh)
            type: DataTypes.STRING,
            primaryKey: true,
            allowNull: false,
            unique: true
        },
        name: { // item's name
            type: DataTypes.STRING,
            unique: true,
            allowNull: false
        },
        description: {
            type: DataTypes.STRING,
            defaultValue: "Just a random item bro"
        },
        value: { // how much the item is worth (cost)
            type: DataTypes.INTEGER,
            defaultValue: 0
        }
    }, {
        tableName: 'items',
        timestamps: false,
    });
}