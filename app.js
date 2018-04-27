const app = require('http').createServer(handler)
const io = require('socket.io')(app);
const fs = require('fs');
const CSV = require('comma-separated-values');

let csv_path = "user_data.csv"
let user_data;
let user_id;
function reload_user_data(){
  let csv_data = fs.readFileSync(csv_path, "utf-8");
  let tmp = new CSV(csv_data, {header:false});
  user_data = tmp.parse();
  console.log(user_data);
  console.log(user_data.length);
  user_id = user_data.length;
}
reload_user_data()

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

let player_arr = []; // 通信中のユーザ情報を格納する配列
let player_connection_arr = []; // ユーザが最後に接続した時間を格納する配列
let player_ready_arr = []; // 対戦準備中のプレイヤーを格納する配列
let player_ready_connection_arr = [];
let on_battle = [];
io.on('connection', function (socket) {

  socket.emit('news', { hello: 'world' });
  socket.on('my other event', function (data) {
    console.log(data);
  });

  // ユーザ登録 *************************************************
  socket.on('register_name', function(data){
    if(inputCheck(data.name) == false){
      socket.emit('register_return', {status: "fail"});
    }
    else{
      fs.appendFileSync(csv_path, data.name + "," + String(user_id) + "\n");
      console.log("registered");
      socket.emit('register_return', {status: "success", user_name: data.name, user_id: user_id});
      reload_user_data();
    }
  });
  // **********************************************************

  // マッチング ************************************************
  function check_player(player){ // player の有無の確認 / 接続していない player_connection_arr を1つ削除
    let exist = false;
    let rm_index;
    let time = (new Date()).getTime();
    for(let i=0; i<player_arr.length; i++){
      if(player.user_id == player_arr[i].user_id){
        exist = true;
        player_connection_arr[i] = time;
      }
      if(time - player_connection_arr[i] >= 2000) rm_index = i;
    }
    if(rm_index != undefined){
      player_arr.splice(rm_index,1);
      player_connection_arr.splice(rm_index,1);
    }
    return exist;
  }

  setInterval(function(){
    socket.emit("connection_check", {check:"ok"});
  }, 1000);

  // 対戦相手を探しています
  socket.on("waiting", function(data){
    let player = {user_name: data.user_name, user_id: data.user_id};
    let time = (new Date()).getTime();
    let exist = check_player(player);
    if(exist == false){
      player_arr.push(player);
      player_connection_arr.push(time);
    };
    if(player_arr.length >= 1) socket.emit("room_info", {player_arr: player_arr});
    //console.log(player_arr);
  })

  function check_ready_player(player){
    let exist = false;
    let available = false;
    let rm_index;
    let time = (new Date()).getTime();

    for(let i=0; i<player_ready_arr.length; i++){
      if(player.user_id == player_ready_arr[i].user_id){
        exist = true;
        player_ready_connection_arr[i] = time;
      }
      if(time - player_ready_connection_arr[i] >= 2000) rm_index = i;
    }
    if(rm_index != undefined){
      player_ready_arr.splice(rm_index,1);
      player_ready_connection_arr.splice(rm_index,1);
    }
    if(exist == false) return [exist, available];

    for(let i=0; i<player_ready_arr.length; i++){
      if(player.user_id == player_ready_arr[i].opponent_id) available = true;
    }
    return [exist, available];
  }

  // 対戦準備集
  socket.on("ready", function(data){
    let player = {user_id: data.user_id, opponent_id: data.opponent_id};
    let time = (new Date()).getTime();
    let exist, available;
    [exist, available] = check_ready_player(player);
    if(exist == false){
      player_ready_arr.push(player);
      player_ready_connection_arr.push(time);
    };
    if(exist == true && available == true){
      socket.emit("lets_battle", {ready:"ok"})
      on_battle.push(player)
    }
    console.log(player_ready_arr);
  })
  // **********************************************************

});
