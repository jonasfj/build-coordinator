var debug           = require('debug')('post');
var request         = require('superagent-promise');
var yaml            = require('yamljs')
var moment          = require('moment');
var _               = require('lodash');

/** Return a promise for a taskGraphId when taskGraph is posted */
exports.postTryPush = function(change) {
  // Parameters
  var params = {
    reason:       "try-push",
    revision:     change.revision,
    repository:   'hg.mozilla.org',
    branch:       'try',
    owner:        change.who,
    flags:        change.comments,
    created:      moment().toDate().toJSON(),
    deadline:     moment().add('hours', 24).toDate().toJSON()
  };

  // Url to fetch task-graph from
  var url = 'https://hg.mozilla.org/try/raw-file/' + change.revision +
            '/taskgraph.yml';

  var gotTaskGraph = request.get(url).end();

  return gotTaskGraph.then(function(res) {
    if(!res.ok) {
      throw new Error("No taskgraph.yml available");
    }
    return yaml.parse(res.text);
  }).then(function(taskGraph) {
    taskGraph.params = _.defaults(taskGraph.params, params);
    return request
            .post('http://scheduler.taskcluster.net/v1/task-graph/create')
            .send(taskGraph)
            .end();
  }).then(function(res) {
    if(!res.ok) {
      debug("Error from scheduler: %j", res.body);
      throw new Error(res.text);
    }
    debug("Posted task-graph with id: " + res.body.status.taskGraphId);
    return res.body.status.taskGraphId;
  });
};
