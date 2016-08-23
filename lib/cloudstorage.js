// Copyright 2015-2016, Google, Inc.
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

'use strict';

var request = require('request');
var gcloud = require('gcloud');
var config = require('../config');
var logging = require('./logging');
var path = require('path');

var CLOUD_BUCKET = config.get('CLOUD_BUCKET');

var storage = gcloud.storage({
  projectId: config.get('GCLOUD_PROJECT')
});
var bucket = storage.bucket(CLOUD_BUCKET);

// Returns the public, anonymously accessable URL to a given Cloud Storage
// object.
// The object's ACL has to be set to public read.
function getPublicUrl (filename) {
  return 'https://storage.googleapis.com/' + CLOUD_BUCKET + '/' + filename;
}

// Express middleware that will automatically pass uploads to Cloud Storage.
// req.file is processed and will have two new properties:
// * ``cloudStorageObject`` the object name in cloud storage.
// * ``cloudStoragePublicUrl`` the public url to the object.
function upload (data, cb) {
  if (!data) {
    return cb();
  }

  var ext = path.extname(data.name);
  var gcsname = data.name.slice(0, -(ext.length)) + "_" + Date.now() + ext;
  var file = bucket.file(gcsname);
  var stream = file.createWriteStream();

  stream.on('error', function (err) {
    cb(err);
  });

  stream.on('finish', function () {
    cb(null, gcsname);
  });

  stream.end(data.buffer);
}

module.exports = {
  getPublicUrl: getPublicUrl,
  upload: upload,
};