const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const connectDB = require("./config/db");
const userRoute = require("./routes/userRoute");
const chatRoute = require("./routes/chatRoutes");
const messageRoute = require("./routes/messageRoutes");
require("dotenv").config();
const { notFound, errorHandler } = require("./middlewares/errorMiddlewares");
const { configureCloudinary } = require("./config/cloudinaryConfig");
const path = require("path");

connectDB();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  pingtimeout: 60000,
  cors: {
    origin: "https://fax-pbi7.onrender.com",
  },
});
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors());
const port = process.env.PORT || 5000;
configureCloudinary();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// APIs----
app.use("/api/user", userRoute);
app.use("/api/chat", chatRoute);
app.use("/api/message", messageRoute);

// setup for deployment-----

if (process.env.NODE_ENV === "production") {
  const __dirname1 = path.resolve();
  app.use(express.static(path.join(__dirname1, "client/dist")));

  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname1, "client", "dist", "index.html"));
  });
} else {
  app.get("/", (req, res) => {
    res.status(200).send("mern chat is running");
  });
}
// setup end for deployment

//  socket starts--------
let activeUsers = {};

io.on("connection", (socket) => {
  const userId = socket.handshake.query.userId;
  console.log(`${userId} is connected`);

  if (userId) {
    activeUsers[userId] = socket.id;
  }

  // emiting active users
  io.emit("activeUsers", activeUsers);

  // send message
  socket.on("sendMessage", (data) => {
    const { chat } = data;
    // console.log("chat users", chat.users);

    // console.log(data);

    if (chat.users.length) {
      chat.users.forEach((userId) => {
        // if (userId === data.sender._id) return;
        io.to(activeUsers[userId]).emit("recieveMessage", data);
        // console.log("message sent to", activeUsers[userId]);
      });
    }
  });

  // getting message that deleted for everyone to get it deleted immediatly
  socket.on("deletedMessage", (deletedMessage) => {
    const { users } = deletedMessage;

    if (users.length) {
      users.forEach((userId) => {
        io.to(activeUsers[userId]).emit("deletedMessage", deletedMessage);
      });
    }
  });

  // typing status
  const typingUsers = new Map();
  socket.on("typingStatus", (data) => {
    // typingUsers.set(data?.user._id, true);

    clearTimeout(typingUsers.get(data?.user._id));

    typingUsers.set(
      data?.user._id,
      setTimeout(() => {
        io.emit("typing", { ...data, isTyping: false });
        typingUsers.delete(data?.user._id);
      }, 2500)
    );

    io.emit("typing", data);
  });

  socket.on("disconnect", () => {
    delete activeUsers[userId];
    // console.log(`${userId} is disconnected`);
    io.emit("activeUsers", activeUsers);
  });
});
// socket ends----------

app.use(notFound);
app.use(errorHandler);

server.listen(port, () => {
  console.log(`chat app is running on port ${port}`);
});
