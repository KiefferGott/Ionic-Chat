var http        = require("http");
var MongoClient = require("mongodb").MongoClient;
var url     = require('url');
var fs      = require('fs');

var server = http.createServer(function(req, res) {
    var page = url.parse(req.url).pathname;
    if (page === '/') {
        res.writeHead(200, {"Content-Type": "text/html"});
        res.write(fs.readFileSync('www/index.html'));
        res.end();
    }
    else {
        try {
            res.write(fs.readFileSync('./www' + page));
            res.end();
        } catch(e) {
            res.writeHead(200, {"Content-Type": "text/html"});
            res.write('');
            res.end();
            console.log(e);
        }
    }
});
MongoClient.connect("mongodb://admin:Li35dk@ds147497.mlab.com:47497/ionic_chat", function(error, db) {
    if (error) {
        return console.log(new Date().toString(), "\n", error, "\n");
    }
    console.log(new Date().toString(), "\n", "Database connected");
    var users = {};
    var io        = require("socket.io").listen(server);
    io.sockets.on("connection", function (socket) {
        db.collection("messages").find().toArray(function (error, results) {
            if (error) {
                return console.log(new Date().toString(), "\n", error, "\n");
            }
            socket.emit("messages", results);
        });
        socket.emit("onlineUsers", users);
        socket.emit("requestPseudo");
        socket.on("pseudo", function (data) {
            socket.pseudo = data;
            users[socket.id] = {pseudo: data, id: socket.id};
            io.sockets.emit("newConnection", {pseudo: socket.pseudo, id: socket.id});
        });
        socket.on("tokenRequest", function () {
            socket.emit("token", require("crypto").randomBytes(16).toString("base64"));
        });
        socket.on("message", function (data) {
            data.time = Date.now();
            data.pseudo = socket.pseudo;
            data.message.replace(/&/g, "&amp;")
                        .replace(/</g, "&lt;")
                        .replace(/>/g, "&gt;")
                        .replace(/"/g, "&quot;")
                        .replace(/'/g, "&#039;");
            db.collection("messages").insert(data, null, function (error, results) {
                if (error) {
                    return console.log(new Date().toString(), "\n", error, "\n");
                }
                return console.log(new Date().toString(), "\n Message inserted into the database \n");    
            });
            io.sockets.emit("message", data);
            socket.emit("sent");
        });

        socket.on("disconnect", function() {
            delete users[socket.id];
            io.sockets.emit("disconnection", socket.id);
        });
    });
});
server.listen(process.env.PORT || 8080);