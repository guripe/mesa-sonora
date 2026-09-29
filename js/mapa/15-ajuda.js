"use strict";
// ---------- tutorial rápido (jogador, na primeira vez) e ajuda (botão ?) ----------
const TUT_P = [
  [
    "🗺️",
    "Bem-vindo à mesa!",
    "Este é o mapa da sessão. <b>Arraste</b> para olhar em volta e use a <b>roda do mouse</b> (ou pinça no celular) para o zoom. O mestre pode trazer sua tela para onde a ação está.",
  ],
  [
    "🧙",
    "Seu personagem",
    "O seu token tem o nome em <b>amarelo</b>. Clique nele para selecionar e depois <b>clique numa casa</b> para andar até lá. <b>Q</b> e <b>E</b> giram. Para abrir uma porta, chegue perto e clique nela.",
  ],
  [
    "🎲",
    "Dados",
    "<b>Rolar dados</b> abre a mesa de dados. A barra de atalhos ao lado rola com um clique (clique direito edita). Todo mundo vê as rolagens no <b>Histórico</b>.",
  ],
  [
    "📜",
    "Sua ficha",
    "O botão de ficha na barra da esquerda abre a ficha do seu personagem. <b>Clique nos números</b> (atributos, perícias, ataques, magias) para rolar direto. Ligue a ficha ao seu token para a vida acompanhar.",
  ],
  [
    "💬",
    "Conversar",
    "<b>Entrar na voz</b> liga o microfone. O <b>💬 Chat</b> (ou a tecla Enter) serve para escrever, e dá para mandar <b>sussurro</b> só para o mestre. No chat, <b>/r 1d20+3</b> rola dados.",
  ],
  [
    "⚔️",
    "Combate",
    "Quando o mestre começar o combate, a ordem aparece no topo. No seu turno aparece <b>“Seu turno!”</b>; o 🥾 mostra quanto você já andou, e <b>Terminar meu turno</b> passa a vez. Condições (envenenado, caído…) aparecem em volta do token.",
  ],
  [
    "🔊",
    "Som",
    "Músicas e efeitos tocam na aba da <b>Mesa Sonora</b> (a página inicial do site). Deixe ela aberta com “Entrar” clicado. Pronto, boa sessão!",
  ],
];
const HELP_GM = [
  [
    "Mapa",
    "Arrastar move a visão · roda = zoom · 0 enquadra · Alt+clique faz um ping (Alt+Shift leva todos até lá) · Ctrl+Z/Ctrl+Y desfaz/refaz.",
  ],
  [
    "Tokens",
    "Duplo clique ou clique direito edita · Q/E giram · barra de baixo: condições, ficha, ocultar · ✎ ao lado das barrinhas edita vida etc.",
  ],
  [
    "Paredes (W)",
    "Parede, porta, secreta, “Ocultar trecho” (vira passagem secreta), círculo, apagar. Clique numa porta com Mover para abrir/fechar e trancar.",
  ],
  [
    "Combate",
    "Iniciativa (⚔) → Começar combate. O deslocamento por turno é contado (🥾) e as condições descem sozinhas no turno do token.",
  ],
  [
    "Fichas",
    "Botão de ficha: crie para cada personagem, defina o dono (apelido do jogador) e ligue ao token. Os jogadores editam as deles.",
  ],
  [
    "Som",
    "Botão 🎵: toque músicas/ambientes/efeitos, defina a trilha de cada mapa, a música de combate e zonas de som que ligam quando alguém chega perto.",
  ],
  ["Chat", "Enter abre. Escolha “sussurro” para falar só com um jogador. Você vê todos os sussurros."],
  [
    "Backup",
    "Mapas salvos → 💾 Backup baixa tudo num arquivo; 📥 Restaurar volta. Faça antes de mudanças grandes.",
  ],
];
function openHelp(step) {
  $("#tutBox")?.remove();
  const el = document.createElement("div");
  el.id = "tutBox";
  el.className = "tutbox";
  el.setAttribute("role", "dialog");
  document.body.appendChild(el);
  el.onpointerdown = e => e.stopPropagation();
  const close = () => {
    el.remove();
    try {
      localStorage.setItem("mesa.tut1", "1");
    } catch {}
  };
  if (isGM) {
    el.innerHTML = `<div class="tut-card wide"><div class="tut-h"><b>Ajuda do mestre</b><button class="be-x" data-x aria-label="Fechar">✕</button></div>
      <dl class="tut-list">${HELP_GM.map(([a, b]) => `<dt>${a}</dt><dd>${b}</dd>`).join("")}</dl>
      <div class="acts"><span class="hint">Os jogadores veem um tutorial rápido na primeira vez que entram.</span><span class="spacer"></span><button class="btn small" data-demo>Ver o tutorial dos jogadores</button><button class="btn small primary" data-x>Fechar</button></div></div>`;
    el.onclick = e => {
      if (e.target.closest("[data-x]") || e.target === el) close();
      if (e.target.closest("[data-demo]")) {
        el.remove();
        tutPlayer(0);
      }
    };
    return;
  }
  tutPlayer(step || 0);
}
function tutPlayer(i) {
  $("#tutBox")?.remove();
  const el = document.createElement("div");
  el.id = "tutBox";
  el.className = "tutbox";
  document.body.appendChild(el);
  el.onpointerdown = e => e.stopPropagation();
  const close = () => {
    el.remove();
    try {
      localStorage.setItem("mesa.tut1", "1");
    } catch {}
  };
  const draw = () => {
    const [ic, h, tx] = TUT_P[i];
    el.innerHTML = `<div class="tut-card"><div class="tut-ic">${ic}</div><b class="tut-t">${h}</b><p>${tx}</p>
      <div class="tut-dots">${TUT_P.map((_, k) => `<i class="${k === i ? "on" : ""}"></i>`).join("")}</div>
      <div class="acts"><button class="btn small" data-skip>${i === TUT_P.length - 1 ? "Fechar" : "Pular"}</button><span class="spacer"></span>${i ? `<button class="btn small" data-prev>Voltar</button>` : ""}<button class="btn small primary" data-next>${i === TUT_P.length - 1 ? "Vamos jogar!" : "Próximo"}</button></div></div>`;
  };
  el.onclick = e => {
    if (e.target.closest("[data-skip]")) return close();
    if (e.target.closest("[data-prev]")) {
      i = Math.max(0, i - 1);
      draw();
    }
    if (e.target.closest("[data-next]")) {
      if (i >= TUT_P.length - 1) return close();
      i++;
      draw();
    }
  };
  el.onkeydown = e => {
    e.stopPropagation();
    if (e.key === "Escape") close();
    if (e.key === "ArrowRight" || e.key === "Enter") el.querySelector("[data-next]").click();
    if (e.key === "ArrowLeft") el.querySelector("[data-prev]")?.click();
  };
  draw();
  el.tabIndex = -1;
  el.focus();
}
