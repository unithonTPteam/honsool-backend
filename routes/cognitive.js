const express = require('express');
const aws = require('aws-sdk');
aws.config.loadFromPath('./config/aws_config.json');
const pool = require('../config/db-pool.js');
const multer = require('multer');
const multerS3 = require('multer-s3');
const s3 = new aws.S3();
const router = express.Router();
const apiKey = require('../config/apiKey.js').apiKey;
const clovaKey = require('../config/clovaKey.js');
const request = require('request');
const rp = require('request-promise');
const str2json = require('string-to-json');
const storage = multer.diskStorage({
  destination:'./public/images',
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now())
  }
});
const upload = multer({storage:storage});
const fs = require('fs');
const beer = require('./../lib/beer');
const music = require('./../lib/music');
const beers = require('./../resources/beers');
router.post('/', upload.single('image'), async(req, res)=>{
  // var url = 'https://s3.ap-northeast-2.amazonaws.com/unithon-5th-3rd/20140806001762_0.jpg';
  var url =  'https://s3.ap-northeast-2.amazonaws.com/unithon-5th-3rd/2015032403230_0.jpg';
//clova options
 var options = {
     method: 'POST',
     url: 'https://openapi.naver.com/v1/vision/face',
     headers: {
       'X-Naver-Client-Id': clovaKey.clientId,
       'X-Naver-Client-Secret': clovaKey.clientSecret,
       'Content-Type':'multipart/form-data'
     },
     formData: {"image": fs.createReadStream(req.file.path)},
 };

  //clova
  rp(options)
    .then(function (parsedBody) {

      let body = JSON.parse(parsedBody);
      //얼굴 사진 올린 경우
      if(body.info.faceCount != 0){
        let feeling, gender, timing, age;
        feeling = body.faces[0].emotion.value;
        gender = body.faces[0].gender.value;
        age = body.faces[0].age.value;
        if(age.match('~')) age = age.split('~')[0];
        timing = new Date().getHours();

        const bestBeer = beer({feeling, gender, timing, age});
        console.log(bestBeer);
        const bestMusic = music({feeling});
        bestBeer.emotion=emotion;
        let ret ={ message:'face', beer:bestBeer, musics:bestMusic};
        res.status(200).json(ret);
      }else{  //맥주사진 올린 경우
        //custom vison (맥주 브랜드 인식 -> 병맛, )

          fs.readFile(req.file.path, function(err, data){
            var options2 = {
                method: 'POST',
                uri: 'https://southcentralus.api.cognitive.microsoft.com/customvision/v1.0/Prediction/094e0291-bfb1-4106-a79e-e5093327e291/image?iterationId=b2cf81bd-8ff4-45b7-aa18-9640389afa56',
                headers: {
                  'Prediction-Key': 'f581d616e1204868aa9d9d546f0d67a5',
                  'Content-Type':'application/octet-stream'
                },
                body: data
                // "json": true // Automatically stringifies the body to JSON
            };

            rp(options2)
              .then(function (pb) {
                   let body = JSON.parse(pb);

                   console.log(body.Predictions[1].Tag);
                   let ret = {
                     message:'beer',
                     beer:beers[body.Predictions[1].Tag],
                     musics:music({})
                   };
                   res.status(200).json(ret);
              })
              .catch(function (error) {
                  console.log('custom vision err: ', error);
                  res.status(500).send({message:'custom vision err'});
              });
          });
      }

    })
    .catch(function (err) {
      console.log('naver clova err: ', err);
      res.status(500).send({message:"clova err"});
    });

});



module.exports = router;
