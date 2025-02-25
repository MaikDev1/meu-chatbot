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