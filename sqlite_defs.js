import Sequelize from 'sequelize';
const errPath = 'errors.txt';

const sequelize = new Sequelize( {
    dialect: 'sqlite',
    logging: false,
    storage: 'jeff.sqlite'
});

function reportError(err) {
    let date = new Date();
    fs.appendFileSync(errPath, err.stack + ", " + date.toLocaleString() + "\n\n");
    console.error(err);
}

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
        reputation: { // total num of reputation (lose by getting spit on, gain by getting bubbled)
            type: Sequelize.INTEGER,
            defaultValue: 10 
        },
        energy: { // total energy, used up by spitting/bubbling
            type: Sequelize.INTEGER,
            defaultValue: 100
        },
        last_daily: { // date of last time user claimed daily
            type: Sequelize.DATE
        }
    }, {
        tableName: db_name,
        timestamps: false,
    })
    return tbl;
}

/* Generic sequalize connection protocol */
// arguments not passed as not necessary (kevin's fault for adding them)
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
        sequelize.authenticate();
        const db = jeff_defines(sequelize, db_name);
        return db;
    } catch(err) {
        reportError(err);
        return err;
    }
}