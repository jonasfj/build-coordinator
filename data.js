// Data definitions

var Sequelize = require('sequelize-sqlite').sequelize
var moment = require('moment');

var db = new Sequelize('database', 'username', 'password', {
  dialect:  'sqlite',
  storage:  'database.sqlite',
  logging:  false,
});

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

// Create database schema
db.sync();

/** Delete old tasks */
exports.clearExpired = function() {
  var yesterday = moment().subtract('days', 1).toDate();
  exports.BuildTasks.destroy({where: ['created < ?', yesterday]});
  exports.TestTasks.destroy({where: ['created < ?', yesterday]});
  exports.OtherTasks.destroy({where: ['created < ?', yesterday]});
};
