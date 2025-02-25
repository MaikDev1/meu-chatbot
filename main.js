const socket = io();

const form = document.getElementById("chat-form");
const messagesList = document.getElementById("messages");
const toggleSoundButton = document.getElementById("toggle-sound");

// Estado da conversa: "faq", "waitingName", "waitingSector", "waitingMatricula", ou "normal"
let state = "faq";
// Dados para solicitar atendimento
let attendantDetails = { fullName: "", sector: "", matricula: "" };

let soundEnabled = true; // Som ativado por padrão

// Definição das opções FAQ
const faqOptions = {
  1: {
    question: "Como faço para redefinir minha senha?",
    answer:
      "Para redefinir sua senha, acesse a página de login e clique em 'Esqueci minha senha'. Siga as instruções enviadas para o seu e-mail.",
  },
  2: {
    question: "Meu computador está muito lento.",
    answer:
      "Se seu computador está muito lento, feche programas desnecessários, reinicie o sistema e, se o problema persistir, contate o TI.",
  },
};

// Função para adicionar mensagem e garantir auto-scroll usando um dummy <li>
// Mantenho exatamente sua implementação original.
// Função para adicionar mensagem e garantir auto-scroll usando um dummy <li>
function appendMessage(content, type = "message") {
  const li = document.createElement("li");
  li.textContent = content;
  li.classList.add(type);
  messagesList.appendChild(li);

  // Cria ou reposiciona o elemento dummy para forçar o scroll até o final
  let dummy = document.getElementById("dummy");
  if (!dummy) {
    dummy = document.createElement("li");
    dummy.id = "dummy";
    messagesList.appendChild(dummy);
  } else {
    messagesList.appendChild(dummy);
  }

  updateScroll();
}

// Função para atualizar o scroll do contêiner (elemento .chat-main)
function updateScroll() {
  const container = document.querySelector(".chat-main");
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

// Exibe a mensagem inicial do FAQ com as opções
document.addEventListener("DOMContentLoaded", () => {
  appendMessage(
    "Bom dia, aqui estão nossos serviços para você tirar dúvidas:",
    "system"
  );
  appendMessage("1 - Como faço para redefinir minha senha?", "faq");
  appendMessage("2 - Meu computador está muito lento.", "faq");
  appendMessage("3 - Falar com Atendente", "faq");
});

// Processamento do envio do formulário
form.addEventListener("submit", (e) => {
  e.preventDefault();
  const input = document.getElementById("m");
  const message = input.value.trim();
  if (!message) return;

  // Se o usuário estiver no modo FAQ ou coleta de dados
  if (state !== "normal") {
    appendMessage("Você: " + message, "user");

    if (state === "faq") {
      if (message === "1") {
        appendMessage("Bot: " + faqOptions["1"].answer, "system");
        playSound();
        appendMessage(
          'Bot: Se desejar atendimento, digite "atendimento". Ou, para voltar ao início, digite "Inicio".',
          "system"
        );
      } else if (message === "2") {
        appendMessage("Bot: " + faqOptions["2"].answer, "system");
        playSound();
        appendMessage(
          'Bot: Se desejar atendimento, digite "atendimento". Ou, para voltar ao início, digite "Inicio".',
          "system"
        );
      } else if (
        message.toLowerCase() === "3" ||
        message.toLowerCase() === "atendimento"
      ) {
        state = "waitingName";
        appendMessage(
          "Bot: Para falar com um atendente, por favor, informe seu nome completo.",
          "system"
        );
      } else if (message.toLowerCase() === "inicio") {
        state = "faq";
        appendMessage(
          "Bot: Aqui estão nossos serviços para você tirar dúvidas:",
          "system"
        );
        appendMessage("1 - Como faço para redefinir minha senha?", "faq");
        appendMessage("2 - Meu computador está muito lento.", "faq");
        appendMessage("3 - Falar com Atendente", "faq");
      } else {
        appendMessage(
          'Bot: Por favor, escolha uma opção válida: 1, 2 ou digite "atendimento" para falar com um atendente, ou "Inicio" para ver as opções novamente.',
          "system"
        );
      }
    } else if (state === "waitingName") {
      // Validação: não aceitar apenas números para nome
      if (/^\d+$/.test(message)) {
        appendMessage("Bot: Por favor, insira um nome válido.", "system");
        playSound();
        return;
      }
      attendantDetails.fullName = message;
      state = "waitingSector";
      appendMessage("Bot: Qual é o seu setor?", "system");
    } else if (state === "waitingSector") {
      attendantDetails.sector = message;
      state = "waitingMatricula";
      appendMessage("Bot: Qual é a sua matrícula?", "system");
    } else if (state === "waitingMatricula") {
      attendantDetails.matricula = message;
      state = "normal";
      socket.emit("request attendant", attendantDetails);
      appendMessage(
        "Bot: Aguarde, estamos conectando você a um atendente...",
        "system"
      );
    }
  } else {
    // Se o estado é "normal", envia a mensagem normalmente (fluxo de atendimento com atendente)
    appendMessage("Você: " + message, "user");
    socket.emit("chat message", message);
  }

  input.value = "";
});

// Envia indicador de "digitando" no modo normal
const inputField = document.getElementById("m");
inputField.addEventListener("input", () => {
  if (state === "normal") {
    socket.emit("typing", "Atendente");
  }
});

socket.on("chat message", (data) => {
  appendMessage("Atendente: " + data.message, "attendant");
  playSound();
});

socket.on("system message", (msg) => {
  appendMessage("Sistema: " + msg, "system");
});

// (Opcional) Indicador de "digitando"
socket.on("typing", (data) => {
  // Aqui você pode implementar um indicador visual, se necessário.
});
