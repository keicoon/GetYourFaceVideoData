const _ = require('lodash');

module.exports = (vttString) => {
  return new Promise(resolve => {
    var current = {}
    var sections = []
    var start = false;
    var vttArray = vttString.split('\n');
    vttArray.forEach((line, index) => {
      if (line.replace(/<\/?[^>]+(>|$)/g, "") === " ") {
      } else if (line.replace(/<\/?[^>]+(>|$)/g, "") == "") {
      } else if (line.indexOf('-->') !== -1) {
        start = true;

        if (current.start) {
          sections.push(clone(current))
        }

        current = {
          start: timeString2ms(line.split("-->")[0].trimRight().split(" ").pop()),
          end: timeString2ms(line.split("-->")[1].trimLeft().split(" ").shift()),
          part: ''
        }
      } else if (line.replace(/<\/?[^>]+(>|$)/g, "") === "") {
      } else if (line.replace(/<\/?[^>]+(>|$)/g, "") === " ") {
      } else {
        if (start) {
          if (sections.length !== 0) {
            if (sections[sections.length - 1].part.replace(/<\/?[^>]+(>|$)/g, "") === line.replace(/<\/?[^>]+(>|$)/g, "")) {
            } else {
              if (current.part.length === 0) {
                current.part = line
              } else {
                current.part = `${current.part} ${line}`
              }
              // If it's the last line of the subtitles
              if (index === vttArray.length - 1) {
                sections.push(clone(current))
              }
            }
          } else {
            current.part = line
            sections.push(clone(current))
            current.part = ''
          }
        }
      }
    })

    current = []

    sections = _.filter(sections, section => section.part.length > 0)

    let resultsArray = [];

    var regex = /(<([0-9:.>]+)>)/ig
    let id = 0;
    sections.forEach(section => {
      let { start, end } = section;
      strs = section.part.split()
      var results = strs.map(function (s) {
        return s.replace(regex, function (n) {
          return n.split('').reduce(function (s, i) { return `==${n.replace("<", "").replace(">", "")}` }, 0)
        })
      });
      cleanText = results[0].replace(/<\/?[^>]+(>|$)/g, "");
      cleanArray = cleanText.split(" ")
      let LastIdxCleanArray = cleanArray.length - 1;
      let valid_text = false;
      cleanArray.forEach(function (item, idx) {
        if (item.indexOf('==') > -1) {
          var pair = item.split("==")
          var key = pair[0]
          var value = pair[1]
          if (key == "" || key == "##") {
            return;
          }
          let time = timeString2ms(item.split("==")[1]);
          resultsArray.push({
            word: cleanWord(item.split("==")[0]),
            start,
            end: time,
            id: id++
          })
          start = time;
          valid_text = true;
        } else {
          if (valid_text && LastIdxCleanArray == idx) {
            resultsArray.push({
              word: cleanWord(item),
              start,
              end,
              id: id++
            })
          }
        }
      })
      // section.words = resultsArray;
      // section.part = section.part.replace(/<\/?[^>]+(>|$)/g, "")
    })
    resolve(resultsArray);
  })
}

// helpers
//   http://codereview.stackexchange.com/questions/45335/milliseconds-to-time-string-time-string-to-milliseconds
function timeString2ms(a, b) {// time(HH:MM:SS.mss) // optimized
  return a = a.split('.'), // optimized
    b = a[1] * 1 || 0, // optimized
    a = a[0].split(':'),
    b + (a[2] ? a[0] * 3600 + a[1] * 60 + a[2] * 1 : a[1] ? a[0] * 60 + a[1] * 1 : a[0] * 1) * 1e3 // optimized
}

// removes everything but characters and apostrophe and dash
function cleanWord(word) {
  // return word.replace(/[^0-9a-z'-]/gi, '').toLowerCase()
  return word;
}

function clone(obj) {
  if (null == obj || "object" != typeof obj) return obj;
  var copy = obj.constructor();
  for (var attr in obj) {
    if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
  }
  return copy;
}