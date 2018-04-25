const app = require('http').createServer(handler)
const io = require('socket.io')(app);
const fs = require('fs');
const CSV = require('comma-separated-values');

let csv_path = "user_data.csv"
let csv_data = fs.readFileSync(csv_path, "utf-8");
let tmp = new CSV(csv_data, {header:false});
let data = tmp.parse();
console.log(data);
console.log(data.length);
let user_id = data.length;


function inputCheck(val) {
 if (val.match(/[^A-Za-z0-9]+/)) {
 //半角英数字以外の文字が存在する場合、エラー
 return false;
 }
 return true;
}

// Webサーバの構築 ********************************************
app.listen(8080); // HTTP サーバのポートを指定する
function handler (req, res) {
  fs.readFile(__dirname + '/index.html',
  function (err, data) {
    if (err) {
      res.writeHead(500);
      return res.end('Error loading index.html');
    }

    res.writeHead(200);
    res.end(data);
  });
}
// **********************************************************

io.on('connection', function (socket) {

  socket.emit('news', { hello: 'world' });
  socket.on('my other event', function (data) {
    console.log(data);
  });

  // ユーザ登録 *************************************************
  socket.on('register_name', function(data){
    console.log(data);
    if(inputCheck(data.name) == false){
      socket.emit('register_return', {status: "fail"});
    }
    else{
      fs.appendFileSync(csv_path, data.name + "," + String(user_id) + "\n");
      socket.emit('register_return', {status: "success", user_name: data.name, user_id: user_id});
      user_id += 1;
    }
  });
  // **********************************************************

  let player1;
  let player2;
  socket.on("waiting", function(data){
    player1 = {user_name: data.user_name, user_id: data.user_id};
    if(data.user_id != player1.user_id){
      player2 = {user_name: data.user_name, user_id: data.user_id};
    }
    console.log("player1: " ,player1);
    console.log("player2: ", player2);

  })

});
