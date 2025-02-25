const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

let waitingUsers = []; // Fila de usuários aguardando atendimento
let availableAttendants = []; // Atendentes disponíveis
let pairings = {}; // Mapeia userSocket.id <-> attendantSocket

app.use(express.static(__dirname));

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

app.get("/attendant", (req, res) => {
  res.sendFile(__dirname + "/attendant.html");
});

function pairSockets(userObj, attendantSocket) {
  const userSocket = userObj.socket;
  pairings[userSocket.id] = attendantSocket;
  pairings[attendantSocket.id] = userSocket;

  console.log(
    `Pareado: Usuário ${userSocket.id} (${userObj.fullName} - ${userObj.sector} - ${userObj.matricula}) <-> Atendente ${attendantSocket.id}`
  );

  userSocket.emit("system message", "Você foi conectado a um atendente.");
  attendantSocket.emit(
    "system message",
    `Você está atendendo ${userObj.fullName} (${userObj.sector}) - Matrícula: ${userObj.matricula}.`
  );

  // Calcula a saudação automática com base na hora atual
  const now = new Date();
  const hour = now.getHours();
  const greeting =
    hour < 12 ? "Bom dia, como posso ajudar?" : "Boa tarde, como posso ajudar?";

  // Envia a mensagem de saudação automaticamente para o usuário
  userSocket.emit("chat message", { message: greeting });
}

io.on("connection", (socket) => {
  console.log("Novo socket conectado: " + socket.id);

  socket.on("attendant join", () => {
    console.log("Atendente conectado: " + socket.id);
    availableAttendants.push(socket);
    if (waitingUsers.length > 0) {
      const userObj = waitingUsers.shift();
      const attendantSocket = availableAttendants.shift();
      pairSockets(userObj, attendantSocket);
    }
  });

  socket.on("request attendant", (userInfo) => {
    console.log(
      `Usuário solicitou atendimento: ${socket.id} - ${userInfo.fullName} - ${userInfo.sector} - ${userInfo.matricula}`
    );
    if (availableAttendants.length > 0) {
      const attendantSocket = availableAttendants.shift();
      pairSockets({ socket, ...userInfo }, attendantSocket);
    } else {
      waitingUsers.push({ socket, ...userInfo });
      socket.emit(
        "system message",
        "Aguarde, um atendente estará disponível em breve."
      );
    }
  });

  socket.on("chat message", (msg) => {
    if (pairings[socket.id]) {
      const targetSocket = pairings[socket.id];
      targetSocket.emit("chat message", { message: msg });
    } else {
      socket.emit(
        "system message",
        "Você ainda não está conectado a um atendente."
      );
    }
  });

  socket.on("typing", (data) => {
    if (pairings[socket.id]) {
      pairings[socket.id].emit("typing", data);
    }
  });

  socket.on("end service", () => {
    if (pairings[socket.id]) {
      const userSocket = pairings[socket.id];
      userSocket.emit("system message", "O atendimento foi finalizado.");
      delete pairings[userSocket.id];
      delete pairings[socket.id];
      if (waitingUsers.length > 0) {
        const nextUserObj = waitingUsers.shift();
        pairSockets(nextUserObj, socket);
      } else {
        availableAttendants.push(socket);
        socket.emit(
          "system message",
          "Atendimento finalizado. Aguardando novo usuário."
        );
      }
    } else {
      socket.emit("system message", "Nenhum atendimento ativo.");
    }
  });

  socket.on("disconnect", () => {
    console.log("Socket desconectado: " + socket.id);
    waitingUsers = waitingUsers.filter((item) => item.socket.id !== socket.id);
    availableAttendants = availableAttendants.filter((s) => s.id !== socket.id);
    if (pairings[socket.id]) {
      const partner = pairings[socket.id];
      partner.emit("system message", "A outra parte desconectou.");
      delete pairings[partner.id];
      delete pairings[socket.id];
    }
  });
});

server.listen(3000, () => {
  console.log("Servidor rodando na porta 3000");
});
