export default (sequelize, DataTypes) => {
    return sequelize.define('items', {
        itemid: { // item's id (CCRRNNN), where CC is category, RR is rarity, N is unique identifier (which is just 001 - 999 tbh)
            // CO: common, RA: rare, EP: epic, LE: legendary
            // catergories: see itemlist.js 
            type: DataTypes.STRING,
            primaryKey: true,
            allowNull: false,
            unique: true
        },
        name: { // item's name
            type: DataTypes.STRING,
            allowNull: false
        },
        emoji: {
            type: DataTypes.STRING
        },
        description: {
            type: DataTypes.STRING,
            defaultValue: "Just a random item bro"
        },
        cost: { // if you can buy this item in the shop, have a json with {item_to_buy_with: num_of_items}, else null
            type: DataTypes.JSON,
            allowNull: true,
            defaultValue: null
        },
        effect: {
            type: DataTypes.JSON, 
            allowNull: true, 
            defaultValue: null 
        },
        rarity: { // CO: common, RA: rare, EP: epic, LE: legendary (follows itemid naming)
            type: DataTypes.STRING
        }
    }, {
        tableName: 'items',
        timestamps: false,
    });
}