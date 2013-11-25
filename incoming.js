// Mozilla pulse consumer

var data = require('./data.js');
var BuildTasks = data.BuildTasks;
var TestTasks = data.TestTasks;
var OtherTasks = data.OtherTasks;
var pulse = require("pulse");
var moment = require('moment');

exports.consumePulse = function(msg) {
  if(msg._meta && msg.payload && msg.payload.change) {
    var meta    = msg._meta;
    var change  = msg.payload.change;
    
    // Create build tasks when somebody pushes to try
    if (change.branch == 'try') {
      BuildTasks.create({
        revision:     change.revision,
        repository:   'hg.mozilla.org/try',
        options:      change.comments,
        owner:        change.who,
        created:      moment(meta.sent).toDate(),
        raw:          JSON.stringify(msg)
      });
      return;
    }
    
    // Create a test task when a linux 64 bit try debug build is scheduled for
    // unit testing
    if (change.branch == 'try-linux64-debug-unittest') {
      var files = change.files.map(function(entry) {return entry.name});
      TestTasks.create({
        platform:     'linux64',
        revision:     change.revision,
        repository:   'hg.mozilla.org/try',
        options:      change.comments,
        owner:        change.who,
        created:      moment(meta.sent).toDate(),
        type:         'debug',
        binaries:     JSON.stringify(files),
        raw:          JSON.stringify(msg)
      });
      return;
    }

    // Create a test task when a linux 64 bit try optimized build is scheduled
    // for unit testing
    if (change.branch == 'try-linux64-opt-unittest') {
      var files = change.files.map(function(entry) {return entry.name});
      TestTasks.create({
        platform:     'linux64',
        revision:     change.revision,
        repository:   'hg.mozilla.org/try',
        options:      change.comments,
        owner:        change.who,
        created:      moment(meta.sent).toDate(),
        type:         'optimized',
        binaries:     JSON.stringify(files),
        raw:          JSON.stringify(msg)
      });
      return;
    }
    
    // TODO: Add more try branch names, for instance try-linux64-talos, etc...
    
    // Cache all other tasks for fun
    var files = change.files.map(function(entry) {return entry.name});
    OtherTasks.create({
      revision:       change.revision,
      virtualBranch:  change.branch,
      comment:        change.comments,
      owner:          change.who,
      created:        moment(meta.sent).toDate(),
      files:          JSON.stringify(files),
      raw:            JSON.stringify(msg)
    });
  }
};

exports.listen = function() {
  var consumer = pulse.createConsumer('build', 'build-coordinator');
  consumer.on('message', exports.consumePulse);
};

