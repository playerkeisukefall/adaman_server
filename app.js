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

// HTTP サーバのポートを指定する
app.listen(8080);

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

io.on('connection', function (socket) {
  // クライアントへデータ送信
  // emit を使うとイベント名を指定できる
  socket.emit('news', { hello: 'world' });
  socket.on('my other event', function (data) {
    // クライアントから受け取ったデータを出力する
    console.log(data);
  });

  socket.on('register_name', function(data){
    console.log(data);
    if(inputCheck(data.name) == false){
      socket.emit('register_return', {status: "fail"});
    }
    else{
      fs.appendFileSync(csv_path, data.name + "," + String(user_id) + "\n");
      user_id += 1;
      socket.emit('register_return', {status: "success", user_name: data.name, user_id: user_id});
    }
  });

});
