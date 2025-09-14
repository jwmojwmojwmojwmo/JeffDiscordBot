import Sequelize from 'sequelize';

const sequelize = new Sequelize( {
    dialect: 'sqlite',
    logging: false,
    storage: 'jeff.sqlite'
});

// Jeff DB definitions 
function jeff_defines(con, db_name) {
    const tbl = con.define(db_name, {
        userid: { // discord user ID
            type: Sequelize.STRING,
            primaryKey: true,
            allowNull: false,
            unique: true
        },
        username: { // discord username (prioritises display name but fallback to username)
            type: Sequelize.STRING,
            // primaryKey : true,
            // allowNull: false,
            // unique: true
        },
        num_nommed: { // num of times user has been nommed
            type: Sequelize.INTEGER,
            defaultValue: 0
        },
        num_namnamnam: { // num of times user has nommed someone
            type: Sequelize.INTEGER,
            defaultValue: 0
        },
        num_queries: { // num of times user has been fetched from database
            type: Sequelize.INTEGER,
            defaultValue: 0 
        },
        karma: { // total num of karma (lose by getting spit on, gain by getting bubbled)
            type: Sequelize.INTEGER,
            defaultValue: 10 
        },
        energy: { // total energy, used up by getting spit on/bubbled on
            type: Sequelize.INTEGER,
            defaultValue: 100
        }
    }, {
        tableName: db_name,
        timestamps: false,
    })
    return tbl;
}

/* Generic sequalize connection protocol */
function create_sqlite_con (db_name, user_name, host) {
    try {
        sequelize.authenticate();
        return sequelize;
    }
    catch(error) {
        return error;
    }
}

/* THIS IS A JEFF SPECIFIC INITIALIZATION PROCESS. General initialization processes found above */
export function create_jeff_sqlite(db_name, user_name, host) {
    try {
        const con = create_sqlite_con(db_name, user_name, host);
        const db = jeff_defines(con, db_name);
        return db;
    } catch(err) {
        return err;
    }
}