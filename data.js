// Data definitions

var Sequelize = require('sequelize');
var moment = require('moment');

var db = null;
if (process.env.DATABASE_URL) {
  var connstr = process.env.DATABASE_URL;
  var match = connstr.match(/postgres:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
  db = new Sequelize(match[5], match[1], match[2], {
    dialect:  'postgres',
    protocol: 'postgres',
    port:     match[4],
    host:     match[3],
    logging:  false
  });
} else {
  db = new Sequelize('database', 'username', 'password', {
    dialect:  'sqlite',
    storage:  'database.sqlite',
    logging:  false
  });
}

/** Queue of revisions to built */
exports.BuildTasks = db.define('BuildTask', {
  id:           {type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true},
  revision:     Sequelize.STRING,
  repository:   Sequelize.STRING,
  options:      Sequelize.STRING,
  owner:        Sequelize.STRING,
  created:      {type: Sequelize.DATE, defaultValue: Sequelize.NOW},
  claimedUntil: {type: Sequelize.DATE, defaultValue: Sequelize.NOW},
  raw:          Sequelize.TEXT
});

/** Queue of tests to execute */
exports.TestTasks = db.define('TestTask', {
  id:           {type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true},
  platform:     Sequelize.STRING,
  revision:     Sequelize.STRING,
  repository:   Sequelize.STRING,
  options:      Sequelize.STRING,
  owner:        Sequelize.STRING,
  created:      {type: Sequelize.DATE, defaultValue: Sequelize.NOW},
  claimedUntil: {type: Sequelize.DATE, defaultValue: Sequelize.NOW},
  type:         Sequelize.STRING,
  binaries:     Sequelize.TEXT,
  raw:          Sequelize.TEXT
});

/** Queue of other tasks */
exports.OtherTasks = db.define('OtherTask', {
  id:             {type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true},
  revision:       Sequelize.STRING,
  virtualBranch:  Sequelize.STRING,
  comment:        Sequelize.STRING,
  owner:          Sequelize.STRING,
  created:        {type: Sequelize.DATE, defaultValue: Sequelize.NOW},
  files:          Sequelize.TEXT,
  raw:            Sequelize.TEXT
});


/** Delete old tasks */
exports.clearExpired = function() {
  var yesterday = moment().subtract('hours', 24).toDate();
  exports.BuildTasks.destroy({created: {'lt': yesterday}});
  exports.TestTasks.destroy({created: {'lt': yesterday}});
  exports.OtherTasks.destroy({created: {'lt': yesterday}});
};

// Create database schema
db.sync().success(function() {
  exports.clearExpired();
});
