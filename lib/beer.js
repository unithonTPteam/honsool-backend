const _ = require('lodash');
const beers = require('./../resources/beers');

module.exports = ({ feeling='sad', gender='male', timing='0', age='20' }) => {
  const score = {};
  let ret = {};
  let hour = timing;
  if (hour < 2 && hour >= 20) {
    timing = '밤';
  } else if ( hour >= 2 && hour < 7) {
    timing = '새벽';
  } else if ( hour >= 7 && hour < 11) {
    timing = '아침';
  } else if ( hour >= 11 && hour < 16) {
    timing = '점심';
  } else if ( hour >= 16 && hour < 20) {
    timing = '저녁';
  }

  if (age >= 20 && age < 30) {
    age = 20;
  } else if (age >= 30 && age < 40) {
    age = 30;
  } else {
    age = 10;
  }

  // initialize
  _.forEach(beers, (value, key) => {
    // console.log(key, value);
    score[key] = 0;

    // 이거 지워야
    ret = value;
  });

  _.forEach(beers, (value, key) => {
    _.forEach(value.feeling.split(', '), (v) => {
      if (feeling == v) score[key] += 1;
    });
    if (gender == value.gender) score[key] += 1;
    if (timing == value.timing) score[key] += 1;
    if (age == value.age) score[key] += 1;
  });

  // 리턴값 수정해야됨
  console.log(ret);
  return ret;
};
