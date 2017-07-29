const express = require('express');
const router = express.Router();
const pool = require('../config/db_pool.js');
const aws = require('aws-sdk');
//aws.config.loadFromPath('../../config/aws_config.json');
const s3 = new aws.S3();
const bcrypt = require('bcrypt-nodejs');
const jwt = require('jsonwebtoken');
const saltRounds = 10;


//회원가입(+비밀번호 암호화처리)
router.post('/signUp', async(req, res) => {
  try {
    //데이터 안넣으면 오류발생처리
    if(!(req.body.userId&&req.body.name&&req.body.phone&&req.body.address&&req.body.pwd&&req.body.locationNum))
      res.status(403).send({ message: 'please input all of userId, userName, userPhone, address, pwd, locationNum'});
    //데이터 다 넣으면 실행
    else {
      var connection = await pool.getConnection();
      const userId = req.body.userId;
      // 비밀번호 암호화처리
      //  var pwd = req.body.pwd;
      //  bcrypt.hash(pwd, null, null, function(err, hashed){
      //    if(err) console.log(err);
      //    else pwd = hashed;
      //  });

       //회원가입정보입력 (푸시알림은 허용이 default)
       let query1='insert into user set ?';
       let record = {
            userId : userId,
            name : req.body.name,
            phone : req.body.phone,
            address : req.body.address,
            pwd : req.body.pwd,
            push : 1,
            locationNum : req.body.locationNum,
            deviceToken :  req.body.deviceToken
         };
        await connection.query(query1, record);

        //맵에 user의 위도경도추가
        let query2='insert into map_info set ?';
        let record2 = {
             userId : userId,
             lat : req.body.lat,
             lng : req.body.lng
          };
         await connection.query(query2, record2);

        //성공시
      res.status(200).send({  message : "회원가입성공"});
    }//else문끝
  } //try문끝
  catch(err){
      console.log(err);
      res.status(500).send({"message": "syntax error :" [err]});
      await connection.rollback();
  }
  finally{
      pool.releaseConnection(connection);
  }
});

//아이디 중복 확인
router.get('/duplicate/:userId', async (req, res) => {
    try {
        var connection = await pool.getConnection();
        //아이디중복확인
        let query1='select userId from user';
        let post = await connection.query(query1);
        let flag = 1; //아이디가 중복되면 1, 아니면 0인 변수
        const userId = req.params.userId;
        //아이디가 중복되면 flag변수 0으로 세팅
        for(var i in post){
          if(post[i].userId == userId)
            flag = 0;
        }
      //중복이면 400에러, 중복이 아니면 ok 메세지
       if(flag==0){
           res.status(400).send({ "message": '중복된 아이디입니다.'});
       }//if문 끝
       else{
          res.status(200).send({
              "message" : "사용가능한 아이디 입니다."
          });
        }//else문 끝
    }//try문 끝
    catch(err){
        console.log(err);
        res.status(500).send({
          "message": "syntax error : " [err]
        });
        await connection.rollback();
    }
    finally{
        pool.releaseConnection(connection);
    }
});

//로그인 gps,
router.post('/login', async function(req, res){
    try {
        var connection = await pool.getConnection();
        const userId = req.body.userId;
        const pwd = req.body.pwd;
        let query = 'select userId, pwd from user where userId=?';
        let user_info = await connection.query(query, userId) || null;

        if(pwd!=user_info[0].pwd) res.status(401).send({message: 'wrong email or password'});
        else {
          //클라에서 token 보낼 경우만 갱신
            if(req.body.deviceToken){
              let query ='update user set deviceToken=? where userId=?';
              await connection.query(query, [req.body.deviceToken, userId]);
            }

          //jwt 발급하고 성공메세지 보내주기
          let option = {
            algorithm : 'HS256',
            expiresIn: 60 * 60 * 24 * 30 //토큰 발행 후 유효기간 지정(30일)
          }
          let payload = {
            userId: user_info[0].userId
          };
          let token = jwt.sign(payload, req.app.get('jwt-secret'), option);
          let query2 = 'select user.userId, user.name, user.phone, user.address, user.push, user.locationNum, map_info.lat, map_info.lng from user natural join map_info where userId=?'
          let result = await connection.query(query2, userId);
          res.status(200).send({
            message:'ok',
            token: token,
            userInfo: result[0]
          });
        }
    }
    catch(err) {
        console.log(err);
        res.status(500).send({message: 'server err: '+err });
    }
    finally {
        pool.releaseConnection(connection);
    }
});

//아이디찾기
router.get('/id/:phone', async (req, res) => {
    try {
        var connection = await pool.getConnection();
        // let query = "select userId from user where phone like '%"+phone+"%'";
        let query = "select userId from user where phone=?";
        var userId =  await connection.query(query, req.params.phone);
        console.log(userId);
        if(userId[0] == null){
         res.status(401).send({"message":"아이디가 존재하지 않습니다"});
       }else{
          res.status(200).send({
              "message" : "아이디가 존재합니다",
              "result" : userId[0]
          });
        }//else문끝
    }//try문끝
    catch(err){
        console.log(err);
        res.status(500).send({
          "message": "syntax error : " [err]
        });
        await connection.rollback();
    }
    finally{
        pool.releaseConnection(connection);
    }
});

//폰번호로 계정 확인
router.get('/phone/:phone', async (req, res)=>{
  try{
    var connection = await pool.getConnection();
    let query = 'select * from user where phone=?';
    var info=await connection.query(query, req.params.phone);
    if(info[0] == null) res.status(400).send({message:'존재하지 않는 회원 정보입니다'});
    else res.status(200).send({message:'존재하는 회원입니다. 비밀번호를 변경해 주세요'});
  }
  catch(err){
    res.status(500).send({message:'server err', err});
  }
  finally{
    pool.releaseConnection(connection);
  }
});

//비밀번호수정
router.put('/pwd/:phone', async (req, res)=>{
  try{
    if(!req.body.pwd)
      res.status(403).send({ message: 'please input pwd'});
    else{
      var connection = await pool.getConnection();
      // var phone = req.params.phone; //핸드폰번호
      var pwd = req.body.pwd; //비밀번호

      let query = 'update user set pwd=? where phone=?';
      await connection.query(query, [pwd, req.params.phone]);
      res.status(200).send({
          "message" : "비밀번호 변경 성공"
      });
    }//큰else문 끝
  }//try문 끝
  catch (err){
    res.status(500).send({message:'server err :'+err});
  }
  finally{
    pool.releaseConnection(connection);
  }
});

//로그아웃

module.exports = router;
