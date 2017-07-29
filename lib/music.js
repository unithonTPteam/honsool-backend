const _ = require('lodash');
const musics = require('./../resources/musics');

module.exports = ({ feeling }) => {
  let ret = [];

  if (!!feeling) {
    // 감정 종류가 같은 노래들 모두 리턴
    _.forEach(musics, (value, key) => {
      if (feeling == value.feeling) ret.push(value);
    });
  } else {
    // 일정한 값 (5개) 랜덤으로 던져주기
    ret = _.sampleSize(_.values(musics), 5);
  }

  return ret;
};
