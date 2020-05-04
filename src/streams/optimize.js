'use strict';

var sharp  = require('sharp');
var env    = require('../config/environment_vars');
var map    = require('map-stream');


module.exports = function () {

  return map( function (image, callback) {

    // pass through if there is an error
    if (image.isError()) {
      return callback(null, image);
    }

    // let this pass through if we are requesting the metadata as JSON
    if (image.modifiers.action === 'json'){
      image.log.log('optimize: json metadata call');
      return callback(null, image);
    }

    image.log.time('optimize-sharp:' + (image.outputFormat || image.format));

    var r = sharp(image.contents);

    var options = {};

    if (env.IMAGE_PROGRESSIVE) {
      switch (image.format) {
        case 'jpeg':
        case 'jpg':
        case 'png':
          options.progressive = true;
          break;
      }
    }

    // set the output quality
    if (image.modifiers.quality < 100) {
      switch (image.format) {
        case 'jpeg':
        case 'jpg':
        case 'webp':
        case 'tiff':
        case 'heif':
          options.quality = image.modifiers.quality;
          break;
      }
    }

    // if a specific output format is specified, set it
    if (image.outputFormat) {
      r.toFormat(image.outputFormat, options);
    }

    // write out the optimised image to buffer and pass it on
    r.toBuffer( function (err, buffer) {
      if (err) {
        image.log.error('optimize error', err);
        image.error = new Error(err);
      }
      else {
        image.contents = buffer;
      }

      image.log.timeEnd('optimize-sharp:' + image.format);
      callback(null, image);
    });
  });

};
