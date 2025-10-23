const lista = document.getElementById("listaPokemon");
const mensagem = document.getElementById("mensagem");
const spinner = document.getElementById("spinner");
const buscaNome = document.getElementById("buscaNome");
const filtroTipo = document.getElementById("filtroTipo");
const ordenar = document.getElementById("ordenar");

const btnProximo = document.getElementById("btnProximo");
const btnAnterior = document.getElementById("btnAnterior");
const paginaAtualSpan = document.getElementById("paginaAtual");

let itemAberto = null;
let paginaAtual = 1;
const limitePorPagina = 15;

let todosPokemon = []; // Todos os Pokémon carregados para busca/filtro
let totalPokemon = 0;

// Carregar tipos
async function carregarTipos() {
    try {
        const res = await fetch('https://pokeapi.co/api/v2/type');
        const dados = await res.json();
        dados.results.forEach(t => {
            const opt = document.createElement("option");
            opt.value = t.name;
            opt.textContent = capitalize(t.name);
            filtroTipo.appendChild(opt);
        });
    } catch (e) { console.error(e); }
}
carregarTipos();

// Eventos
btnProximo.addEventListener("click", () => { paginaAtual++; exibirPagina(paginaAtual); });
btnAnterior.addEventListener("click", () => { paginaAtual--; exibirPagina(paginaAtual); });
buscaNome.addEventListener("keyup", aplicarFiltro);
filtroTipo.addEventListener("change", aplicarFiltro);
ordenar.addEventListener("change", aplicarFiltro);

// Carregar todos Pokémon (on-demand)
async function carregarTodosPokemon() {
    if (todosPokemon.length > 0) return; // Evita recarregar

    try {
        mensagem.textContent = "🔄 Carregando todos os Pokémon para busca/filtro...";
        spinner.classList.remove("hidden");
        todosPokemon = [];

        let offset = 0;
        const limit = 50;
        let total = 1;

        while (offset < total) {
            const res = await fetch(`https://pokeapi.co/api/v2/pokemon?offset=${offset}&limit=${limit}`);
            if (!res.ok) throw new Error("Erro HTTP: " + res.status);
            const dados = await res.json();
            total = dados.count;

            for (const p of dados.results) {
                const detalheRes = await fetch(p.url);
                const detalhe = await detalheRes.json();
                todosPokemon.push(detalhe);
            }
            offset += limit;
        }
        totalPokemon = todosPokemon.length;
        mensagem.textContent = `✅ Todos os Pokémon carregados (${totalPokemon})`;
    } catch (e) {
        mensagem.textContent = "❌ Erro: " + e.message;
    } finally {
        spinner.classList.add("hidden");
    }
}

// Exibir página atual (apenas 15 Pokémon)
function exibirPagina(pagina) {
    lista.innerHTML = "";
    paginaAtualSpan.textContent = pagina;

    const inicio = (pagina - 1) * limitePorPagina;
    const fim = inicio + limitePorPagina;
    const paginaPokemon = todosPokemon.slice(inicio, fim);

    paginaPokemon.forEach(d => criarItem(d));

    btnAnterior.disabled = pagina === 1;
    btnProximo.disabled = fim >= totalPokemon;
}

// Criar card Pokémon
function criarItem(dados) {
    const item = document.createElement("li");
    item.classList.add("pokemon-item", dados.types[0].type.name);
    if (dados.id <= 151) item.classList.add("legendario");

    item.innerHTML = `
    <img src="${dados.sprites.front_default}" alt="${dados.name}">
    <p>${capitalize(dados.name)}</p>
  `;
    item.dataset.nome = dados.name;
    item.dataset.tipo = dados.types[0].type.name;
    item.dataset.id = dados.id;

    item.addEventListener("click", () => mostrarDetalhes(item, dados));

    lista.appendChild(item);
    setTimeout(() => item.classList.add("fade-in"), 20);
}

// Mostrar detalhes
function mostrarDetalhes(item, dados) {
    if (itemAberto && itemAberto !== item) {
        const detAnterior = itemAberto.querySelector(".detalhes");
        if (detAnterior) { detAnterior.classList.remove("ativo"); setTimeout(() => detAnterior.remove(), 400); }
    }

    if (itemAberto === item && item.querySelector(".detalhes")) {
        const detAtual = item.querySelector(".detalhes");
        detAtual.classList.remove("ativo");
        setTimeout(() => detAtual.remove(), 400);
        itemAberto = null;
        return;
    }

    const tipos = dados.types.map(t => capitalize(t.type.name)).join(", ");
    const habilidades = dados.abilities.map(a => capitalize(a.ability.name)).join(", ");

    const detalhes = document.createElement("div");
    detalhes.classList.add("detalhes");
    detalhes.innerHTML = `
    <p><strong>ID:</strong> ${dados.id}</p>
    <p><strong>Altura:</strong> ${dados.height / 10} m</p>
    <p><strong>Peso:</strong> ${dados.weight / 10} kg</p>
    <p><strong>Tipos:</strong> ${tipos}</p>
    <p><strong>Habilidades:</strong> ${habilidades}</p>
  `;
    item.appendChild(detalhes);
    itemAberto = item;
    setTimeout(() => detalhes.classList.add("ativo"), 20);
}

// Aplicar filtro/busca/ordenação
async function aplicarFiltro() {
    await carregarTodosPokemon();

    const nome = buscaNome.value.toLowerCase();
    const tipo = filtroTipo.value;
    const ordem = ordenar.value;

    let filtrados = todosPokemon.filter(d =>
        d.name.includes(nome) && (tipo === "" || d.types[0].type.name === tipo)
    );

    if (ordem === "nome") filtrados.sort((a, b) => a.name.localeCompare(b.name));
    else filtrados.sort((a, b) => a.id - b.id);

    todosPokemon = filtrados; // Sobrescreve lista temporária
    paginaAtual = 1;
    totalPokemon = filtrados.length;
    exibirPagina(paginaAtual);
}

function capitalize(str) { return str.charAt(0).toUpperCase() + str.slice(1); }

// Carregar primeira página
carregarTodosPokemon().then(() => exibirPagina(1));
