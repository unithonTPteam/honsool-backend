const _ = require('lodash');
const beers = require('./../resources/beers');

module.exports = ({ feeling='sad', gender='male', timing='아침', age='20' }) => {
  const score = {};
  let ret = {};

  _.forEach(beers, (value, key) => {
    // console.log(key, value);
    score[key] = 0;
    ret = value;
  });

  // console.log(feeling);
  // console.log(gender);
  // console.log(timing);
  // console.log(age);
  console.log(ret);
  return ret;
};
