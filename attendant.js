const socket = io();
socket.emit("attendant join");

const form = document.getElementById("chat-form");
const messagesList = document.getElementById("messages");
const typingIndicator = document.getElementById("typing-indicator");
const endServiceButton = document.getElementById("end-service");
const toggleSoundButton = document.getElementById("toggle-sound");

let soundEnabled = true;

function appendMessage(content, type = "message") {
  const li = document.createElement("li");
  li.textContent = content;
  li.classList.add(type);
  messagesList.appendChild(li);
  updateScroll();
}

function updateScroll() {
  const container = document.querySelector(".chat-main");
  // Aguarda o layout atualizar e então rola para o final
  requestAnimationFrame(() => {
    container.scrollTop = container.scrollHeight;
  });
}

function playSound() {
  if (!soundEnabled) return;
  const audio = new Audio("notification.mp3");
  audio.play().catch((err) => console.error("Erro ao reproduzir som:", err));
}

toggleSoundButton.addEventListener("click", () => {
  soundEnabled = !soundEnabled;
  toggleSoundButton.textContent = soundEnabled ? "Som: Ligado" : "Som: Mutado";
});

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const input = document.getElementById("m");
  const message = input.value.trim();
  if (!message) return;
  appendMessage("Você: " + message, "attendant");
  socket.emit("chat message", message);
  input.value = "";
});

const inputField = document.getElementById("m");
inputField.addEventListener("input", () => {
  socket.emit("typing", "Usuário");
});

socket.on("chat message", (data) => {
  appendMessage("Usuário: " + data.message, "user");
  playSound();
});

socket.on("system message", (msg) => {
  appendMessage("Sistema: " + msg, "system");
});

socket.on("typing", (data) => {
  typingIndicator.style.display = "block";
  typingIndicator.textContent = data + " está digitando...";
  setTimeout(() => {
    typingIndicator.style.display = "none";
  }, 2000);
});

endServiceButton.addEventListener("click", () => {
  socket.emit("end service");
});
