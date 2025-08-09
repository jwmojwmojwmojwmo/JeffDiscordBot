    module.exports = (sequelize, DataTypes) => {
        return sequelize.define('users', {
            user_id: {
                type: DataTypes.TEXT,
                primaryKey: true,
                unique: true
            },
            username: DataTypes.STRING,
            killcount: DataTypes.INTEGER
        }, {
            timestamps: false,
        });
    };