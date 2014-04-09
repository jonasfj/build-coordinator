// Web-facing server

var express = require('express');
var app = express();
var incoming = require('./incoming.js');
var data      = require('./data.js');
var BuildTasks = data.BuildTasks;
var TestTasks = data.TestTasks;
var OtherTasks = data.OtherTasks;

var PG_SIZE = 10
var menu = [];

function makeMenu(active) {
  return menu.map(function(link) {
    return {
      url:    link.url,
      name:   link.name,
      active: link.name == active
    };
  });
}

app.engine('jade', require('jade').__express);
app.use(express['static'](__dirname + '/static'));
app.locals.moment = require('moment');

app.get('/', function(req, res) {
  res.render('index.jade', {
    title:        "Build Coordinator",
    hide_search:  true,
    menu:         makeMenu(),
  });
});

menu.push({url: '/list-build-tasks/0', name: 'List Build Tasks'});
app.get('/list-build-tasks/:offset?', function(req,res) {
  var offset = parseInt(req.params.offset) || 0;
  var query  = undefined;
  var title  = "List of Build Tasks"
  if (req.query.q) {
    var q = "%" + req.query.q + "%";
    query = ["owner LIKE ? or revision LIKE ?", q];
    title = "Build Task Search for \"" + req.query.q + "\"";
  }
  BuildTasks.all({
    limit:  PG_SIZE,
    offset: offset,
    where:  query
  }).success(function(tasks) {
    res.render('build-task-list.jade', {
      title:  title,
      tasks:  tasks,
      prev:   (offset == 0 ? false : '/list-build-tasks/' + (offset - PG_SIZE)),
      next:   (tasks.length == PG_SIZE ? '/list-build-tasks/' + (offset + PG_SIZE) : false),
      menu:   makeMenu('List Build Tasks'),
    });
  });
});

menu.push({url: '/list-test-tasks/0', name: 'List Test Tasks'});
app.get('/list-test-tasks/:offset?', function(req,res) {
  var offset = parseInt(req.params.offset) || 0;
  var query  = undefined;
  var title  = "List of Test Tasks";
  if (req.query.q) {
    var q = "%" + req.query.q + "%";
    query = ["owner LIKE ? or revision LIKE ?", q];
    title = "Test Task Search for \"" + req.query.q + "\"";
  }
  TestTasks.all({
    limit:  PG_SIZE,
    offset: offset,
    where:  query
  }).success(function(tasks) {
    res.render('test-task-list.jade', {
      title:  title,
      tasks:  tasks,
      prev:   (offset == 0 ? false : '/list-test-tasks/' + (offset - PG_SIZE)),
      next:   (tasks.length == PG_SIZE ? '/list-test-tasks/' + (offset + PG_SIZE) : false),
      menu:   makeMenu('List Test Tasks'),
    });
  });
});

menu.push({url: '/list-other-tasks/0', name: 'List Other Tasks'});
app.get('/list-other-tasks/:offset?', function(req,res) {
  var offset = parseInt(req.params.offset) || 0;
  var query  = undefined;
  var title  = "List of Other Tasks"
  if (req.query.q) {
    var q = "%" + req.query.q + "%";
    query = ["owner LIKE ? or revision LIKE ?", q];
    title = "Other Task Search for \"" + req.query.q + "\"";
  }
  OtherTasks.all({
    limit:  PG_SIZE,
    offset: offset,
    where:  query,
    order:  [['created', 'DESC']]
  }).success(function(tasks) {
    res.render('build-other-list.jade', {
      title:  title,
      tasks:  tasks,
      prev:   (offset == 0 ? false : '/list-other-tasks/' + (offset - PG_SIZE)),
      next:   (tasks.length == PG_SIZE ? '/list-other-tasks/' + (offset + PG_SIZE) : false),
      menu:   makeMenu('List Other Tasks'),
    });
  });
});

incoming.listen();

// Clear expired data every hour
setInterval(data.clearExpired, 60 * 60 * 1000);
data.clearExpired();

app.listen(process.env.PORT || 3002);
