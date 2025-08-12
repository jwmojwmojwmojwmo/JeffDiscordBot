import { Sequelize, DataTypes } from 'sequelize';

/* Jeff DB definitions 

username VARCHAR(255) UNIQUE PRIMARY KEY,
num_nommed INT DEFAULT 0
num_namnamnam INT DEFAULT 0
num_queries INT DEFAULT 0
createdAt TIMESTAMP //auto-set values
updatedAT TIMESTAMP //auto-set values
*/

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
        const sequelize = new Sequelize(db_name, user_name, 'password', {
            host: host,
            dialect: 'sqlite',
            logging: false,
            storage:db_name + '.sqlite'
        });
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