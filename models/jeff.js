export default (sequelize, DataTypes) => {
    return sequelize.define('jeff', {
        userid: { // discord user ID
            type: DataTypes.STRING,
            primaryKey: true,
            allowNull: false,
            unique: true
        },
        username: { // discord username (prioritises display name but fallback to username)
            type: DataTypes.STRING,
            allowNull: false
        },
        num_nommed: { // num of times user has been nommed
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        num_namnamnam: { // num of times user has nommed someone
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        num_queries: { // num of times user has been fetched from database
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        reputation: { // total num of reputation (lose by getting spit on, gain by getting bubbled)
            type: DataTypes.INTEGER,
            defaultValue: 10
        },
        energy: { // total energy, used up by spitting/bubbling
            type: DataTypes.INTEGER,
            defaultValue: 100
        },
        last_daily: { // date of last time user claimed daily
            type: DataTypes.DATE
        },
        claimedVote: { // true if user has voted in the current 12 hour period, false otherwise
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        },
        settings: { // user settings
            type: DataTypes.JSON,
            allowNull: false,
            defaultValue: {
                dailyReminders: true,
                voteReminders: true,
                donateJeffDM: true
            }
        }
    }, {
        tableName: 'jeff',
        timestamps: false,
    });
}