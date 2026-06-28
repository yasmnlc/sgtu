const API_BASE_URL = 'http://127.0.0.1:8000';

const sections = {
    estudante: document.getElementById('view-estudante'),
    motorista: document.getElementById('view-motorista'),
    secretaria: document.getElementById('view-secretaria')
};

const navButtons = {
    estudante: document.getElementById('btn-nav-estudante'),
    motorista: document.getElementById('btn-nav-motorista'),
    secretaria: document.getElementById('btn-nav-secretaria')
};

function switchView(viewName) {
    Object.keys(sections).forEach(key => {
        sections[key].classList.add('hidden');
        navButtons[key].classList.remove('btn-active');
    });

    if (sections[viewName] && navButtons[viewName]) {
        sections[viewName].classList.remove('hidden');
        navButtons[viewName].classList.add('btn-active');

        if (viewName === 'secretaria') {
            const btnVisaoGeral = document.getElementById('btn-sec-visao-geral');
            if (btnVisaoGeral) btnVisaoGeral.click();
        } else if (viewName === 'motorista') {
            carregarListaMotorista().then(() => {
                atualizarOcupacao();
            });
        } else if (viewName === 'visao-geral') {
            carregarDadosDashboard();
        }
    }
}

navButtons.estudante.addEventListener('click', () => switchView('estudante'));
navButtons.motorista.addEventListener('click', () => switchView('motorista'));
navButtons.secretaria.addEventListener('click', () => switchView('secretaria'));

const abasSecretaria = [
    { btn: document.getElementById('btn-sec-visao-geral'), view: document.getElementById('sub-view-visao-geral'), acao: carregarDadosDashboard },
    { btn: document.getElementById('btn-sec-validacao'), view: document.getElementById('sub-view-validacao'), acao: carregarPendenciasSecretaria },
    { btn: document.getElementById('btn-sec-motoristas'), view: document.getElementById('sub-view-motoristas'), acao: null }
];

abasSecretaria.forEach(aba => {
    if (!aba.btn) return;
    aba.btn.addEventListener('click', () => {
        abasSecretaria.forEach(a => {
            a.view?.classList.add('hidden');
            a.btn.className = "w-full flex items-center space-x-3 p-3 rounded-xl text-sm font-medium opacity-60 hover:opacity-100 transition-all";
        });
        
        aba.view.classList.remove('hidden');
        aba.btn.className = "w-full flex items-center space-x-3 p-3 rounded-xl text-sm font-medium bg-blue-900 border-l-4 border-green-500 transition-all";
        
        if (aba.acao) aba.acao();
    });
});

const inputArquivo = document.getElementById('arquivo');
const previewNomeArquivo = document.getElementById('file-name-preview');

inputArquivo.addEventListener('change', function() {
    if (this.files.length > 0) {
        previewNomeArquivo.innerText = `📄 Arquivo selecionado: ${this.files[0].name}`;
        previewNomeArquivo.classList.remove('hidden');
    } else {
        previewNomeArquivo.classList.add('hidden');
    }
});

document.getElementById('form-cadastro').addEventListener('submit', async (e) => {
    e.preventDefault();

    const token = localStorage.getItem('sgtu_token');
    if (!token) return fazerLogout();

    const formData = new FormData();
    formData.append('nome_completo', document.getElementById('nome').value);
    formData.append('cpf', document.getElementById('cpf').value);
    formData.append('universidade', document.getElementById('universidade').value);
    formData.append('curso', document.getElementById('curso').value);
    formData.append('arquivo', inputArquivo.files[0]);

    if (!inputArquivo.files.length) {
        alert("Selecione um PDF.");
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/cadastro`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        if (response.status === 401) return fazerLogout();

        const result = await response.json();

        if (response.ok) {
            alert(`Sucesso: ${result.mensagem}`);
            document.getElementById('form-cadastro').reset();
            previewNomeArquivo.classList.add('hidden');
        } else {
            alert(`Atenção: ${result.detail || 'Erro ao processar cadastro.'}`);
        }
    } catch (error) {
        console.error('Erro ao conectar com a API:', error);
        alert('Erro de Conexão: Não foi possível se comunicar com o backend FastAPI.');
    }
});

window.addEventListener('DOMContentLoaded', () => {
    const perfilLogado = localStorage.getItem('sgtu_perfil_logado');
    const nomeUsuario = localStorage.getItem('sgtu_usuario_nome');

    if (!perfilLogado) {
        window.location.href = 'login.html';
        return;
    }

    const barraNavegacao = document.querySelector('.fixed.bottom-6');
    if (barraNavegacao) {
        barraNavegacao.classList.add('hidden');
    }

    switchView(perfilLogado);
    inicializarSelectUniversidades();

    const campoData = document.getElementById('current-date');
    if (campoData) {
        const hoje = new Date();
        campoData.innerText = hoje.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' });
    }
});

function fazerLogout() {
    localStorage.removeItem('sgtu_perfil_logado');
    localStorage.removeItem('sgtu_usuario_nome');
    localStorage.removeItem('sgtu_token');
    window.location.href = 'login.html';
}

async function carregarPendenciasSecretaria() {
    const tabelaBody = document.getElementById('tabela-pendencias');
    if (!tabelaBody) return;

    const token = localStorage.getItem('sgtu_token');
    if (!token) return fazerLogout();

    try {
        const response = await fetch(`${API_BASE_URL}/pendencias`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.status === 401) return fazerLogout();

        const estudantes = await response.json();

        if (estudantes.length === 0) {
            tabelaBody.innerHTML = `
                <tr>
                    <td colspan="6" class="p-8 text-center text-gray-400 font-medium">
                        🎉 Nenhuma verificação pendente no momento!
                    </td>
                </tr>
            `;
            return;
        }

        tabelaBody.innerHTML = '';

        estudantes.forEach(aluno => {
            const linha = document.createElement('tr');
            linha.className = "hover:bg-gray-50/80 text-gray-700 transition-colors border-b border-gray-100";
            
            linha.innerHTML = `
                <td class="p-4 px-6 text-xs font-medium text-gray-400">${aluno.data_envio}</td>
                <td class="p-4 font-semibold text-gray-900">${aluno.nome_completo}</td>
                <td class="p-4 text-xs">${aluno.universidade}</td>
                <td class="p-4 text-xs">${aluno.curso}</td>
                <td class="p-4 text-center">
                    <button onclick="visualizarDocumento('${aluno.documento_nome}')" class="inline-flex items-center space-x-1 text-blue-600 hover:text-blue-800 font-medium text-xs bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100">
                        <i class="fa-solid fa-file-pdf"></i> <span>Ver_Documento.pdf</span>
                    </button>
                </td>
                <td class="p-4 text-center">
                    <button onclick="atualizarStatusAluno('${aluno.id}', 'Autorizado')" class="bg-green-600 text-white px-4 py-1.5 rounded-lg text-xs font-bold mr-1 hover:bg-green-700 shadow-sm transition-all">Aprovar</button>
                    <button onclick="atualizarStatusAluno('${aluno.id}', 'Recusado')" class="bg-red-50 text-red-600 border border-red-200 px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-red-100 transition-all">Recusar</button>
                </td>
            `;
            tabelaBody.appendChild(linha);
        });

    } catch (error) {
        console.error('Erro ao carregar pendências:', error);
    }
}

function visualizarDocumento(nomeArquivo) {
    if (!nomeArquivo) return alert("Arquivo não encontrado para este estudante.");
    const urlDocumento = `${API_BASE_URL}/arquivos/${nomeArquivo}`;
    window.open(urlDocumento, '_blank');
}

async function atualizarStatusAluno(id, novoStatus) {
    let justificativa = "";

    if (novoStatus === 'Recusado') {
        justificativa = prompt("Por favor, digite a justificativa para a recusa deste documento:");
        if (justificativa === null || justificativa.trim() === "") {
            alert("Ação cancelada. É obrigatório informar uma justificativa para recusar.");
            return;
        }
    }

    const confirmar = confirm(`Tem certeza que deseja definir este cadastro como ${novoStatus}?`);
    if (!confirmar) return;

    const token = localStorage.getItem('sgtu_token');
    if (!token) return fazerLogout();

    try {
        const response = await fetch(`${API_BASE_URL}/estudantes/${id}/status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                status: novoStatus,
                justificativa_recusa: justificativa
            })
        });

        if (response.status === 401) return fazerLogout();

        const result = await response.json();

        if (response.ok) {
            alert(`Sucesso: ${result.mensagem}`);
            carregarPendenciasSecretaria();
        } else {
            alert(`Erro: ${result.detail || 'Não foi possível atualizar o status.'}`);
        }

    } catch (error) {
        console.error('Erro ao atualizar status:', error);
        alert('Erro de conexão com o servidor.');
    }
}

async function carregarListaMotorista() {
    const containerCards = document.querySelector('#view-motorista .overflow-y-auto');
    if (!containerCards) return;

    const token = localStorage.getItem('sgtu_token');
    if (!token) return fazerLogout();

    try {
        const response = await fetch(`${API_BASE_URL}/autorizados`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.status === 401) return fazerLogout();

        const estudantes = await response.json();

        if (estudantes.length === 0) {
            containerCards.innerHTML = `
                <div class="col-span-full p-8 text-center text-gray-400 font-medium">
                    🚌 Nenhum estudante autorizado para transporte.
                </div>
            `;
            return;
        }

        containerCards.innerHTML = '';

        estudantes.forEach(aluno => {
            const iniciais = aluno.nome_completo.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

            const card = document.createElement('div');
            card.className = "flex items-center justify-between bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all";
            
            card.innerHTML = `
                <div class="flex items-center space-x-4">
                    <div class="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-sgtu-dark text-base border">${iniciais}</div>
                    <div>
                        <h4 class="font-bold text-sm text-gray-800">${aluno.nome_completo}</h4>
                        <p class="text-xs text-gray-400">${aluno.universidade} - ${aluno.curso}</p>
                        <span class="inline-block mt-1 text-[10px] bg-green-50 text-green-600 font-semibold px-2 py-0.5 rounded border border-green-100">Regular</span>
                    </div>
                </div>
                <button onclick="alternarEmbarque(this)" class="btn-embarque flex flex-col items-center justify-center text-gray-300 font-semibold text-xs hover:text-green-500 p-2.5 rounded-xl border border-dashed border-gray-300 bg-gray-50">
                    <i class="fa-regular fa-square text-xl mb-0.5"></i>
                    <span>Embarcar</span>
                </button>
            `;
            containerCards.appendChild(card);
        });

        atualizarOcupacao();

    } catch (error) {
        console.error('Erro ao carregar lista do motorista:', error);
    }
}

function alternarEmbarque(botao) {
    const icon = botao.querySelector('i');
    const text = botao.querySelector('span');

    if (!botao.classList.contains('embarcado')) {
        botao.classList.add('embarcado');
        icon.className = 'fa-solid fa-circle-check text-xl mb-0.5';
        botao.className = 'btn-embarque embarcado flex flex-col items-center justify-center text-green-600 font-semibold text-xs bg-green-50 p-2.5 rounded-xl border border-green-200';
        text.innerText = 'Embarcado';
    } else {
        botao.classList.remove('embarcado');
        icon.className = 'fa-regular fa-square text-xl mb-0.5';
        botao.className = 'btn-embarque flex flex-col items-center justify-center text-gray-300 font-semibold text-xs hover:text-green-500 p-2.5 rounded-xl border border-dashed border-gray-300 bg-gray-50';
        text.innerText = 'Embarcar';
    }

    atualizarOcupacao();
}

function atualizarOcupacao() {
    const botoes = document.querySelectorAll('.btn-embarque');
    let embarcados = 0;

    botoes.forEach(botao => {
        const texto = botao.querySelector('span');
        if (texto && texto.innerText.trim() === 'Embarcado') {
            embarcados++;
        }
    });

    const contador = document.getElementById('ocupacao-counter');
    if (contador) {
        contador.innerText = `${embarcados} / ${botoes.length} Alunos`;
    }
}

async function carregarDadosDashboard() {
    const cardTotal = document.getElementById('card-total-cadastrados');
    const cardPendentes = document.getElementById('card-total-pendentes');
    const cardAutorizados = document.getElementById('card-total-autorizados');

    const token = localStorage.getItem('sgtu_token');
    if (!token) return fazerLogout();

    try {
        const response = await fetch(`${API_BASE_URL}/secretaria/dashboard`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.status === 401) return fazerLogout();

        const dados = await response.json();

        if (cardTotal) cardTotal.innerText = dados.total_cadastrados;
        if (cardPendentes) cardPendentes.innerText = dados.pendentes;
        if (cardAutorizados) cardAutorizados.innerText = dados.autorizados;

    } catch (error) {
        console.error('Erro ao carregar dados do painel geral:', error);
    }
}

async function inicializarSelectUniversidades() {
    const selectUni = document.getElementById('universidade');
    if (!selectUni) return;

    selectUni.innerHTML = '<option value="" disabled selected>Carregando instituições...</option>';

    try {
        const response = await fetch('public/universidades.json');
        const universidades = await response.json();

        selectUni.innerHTML = '<option value="" disabled selected>Selecione sua instituição...</option>';

        universidades.forEach(uni => {
            const option = document.createElement('option');
            option.value = uni.id;
            option.innerText = uni.nome;
            selectUni.appendChild(option);
        });

    } catch (error) {
        console.error('Erro ao carregar a lista modular de universidades:', error);
        selectUni.innerHTML = '<option value="" disabled selected>Erro ao carregar instituições</option>';
    }
}

const btnSolicitacoes = document.getElementById('btn-solicitacoes');
const modalSolicitacoes = document.getElementById('modal-solicitacoes');
const fecharModal = document.getElementById('fechar-modal');

if (btnSolicitacoes) {
    btnSolicitacoes.addEventListener('click', () => {
        modalSolicitacoes.classList.remove('hidden');
        modalSolicitacoes.classList.add('flex');
    });
}

if (fecharModal) {
    fecharModal.addEventListener('click', () => {
        modalSolicitacoes.classList.add('hidden');
        modalSolicitacoes.classList.remove('flex');
    });
}

modalSolicitacoes?.addEventListener('click', (e) => {
    if (e.target === modalSolicitacoes) {
        modalSolicitacoes.classList.add('hidden');
        modalSolicitacoes.classList.remove('flex');
    }
});

document.getElementById('btn-opcao-1')?.addEventListener('click', async () => {

    const token = localStorage.getItem('sgtu_token');

    if (!token) {
        alert("Você precisa fazer login.");
        return;
    }

    try {

        const response = await fetch(
            `${API_BASE_URL}/gerar-carteirinha`,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        if (!response.ok) {
            const erro = await response.json();
            alert(erro.detail);
            return;
        }

        const blob = await response.blob();

        const url = window.URL.createObjectURL(blob);

        window.open(url);

    } catch (erro) {

        console.error(erro);

        alert("Erro ao gerar a carteirinha.");

    }

});

const botao = document.getElementById("btn-opcao-2");
console.log(botao);

botao.addEventListener("click", () => {
    console.log("CLICOU!");
    alert("Funcionou");
});

document.getElementById('btn-opcao-2')?.addEventListener('click', () => {
    //alert('Solicitar Revisão');
});

const formMotorista = document.getElementById('form-cadastro-motorista');
if (formMotorista) {
    formMotorista.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const nome = document.getElementById('mot-nome').value;
        const cpf = document.getElementById('mot-cpf').value;
        const senha = document.getElementById('mot-senha').value;
        
        try {
            const response = await fetch(`${API_BASE_URL}/cadastrar`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nome_completo: nome,
                    cpf: cpf,
                    senha: senha,
                    perfil: "motorista" // 💡 Informamos que é um motorista!
                })
            });

            const data = await response.json();

            if (response.ok) {
                alert(`Sucesso! O acesso do motorista ${nome} foi criado.\nEle deve entrar com o CPF e a senha provisória.`);
                formMotorista.reset();
                document.getElementById('mot-senha').value = "Muda@123"; // Reseta a senha padrão
            } else {
                alert(`Atenção: ${data.detail || 'Não foi possível cadastrar.'}`);
            }
        } catch (error) {
            console.error("Erro na requisição:", error);
            alert("Erro ao conectar com o servidor.");
        }
    });
}

const btnStatusOnibus = document.getElementById('btn-status-onibus');

const modalStatusOnibus = document.getElementById("modal-status-onibus");

document.getElementById('btn-opcao-2')?.addEventListener('click', () => {

    // Fecha o modal de Solicitações
    modalSolicitacoes.classList.add('hidden');
    modalSolicitacoes.classList.remove('flex');

    // Abre o modal Status do Ônibus
    modalStatusOnibus.classList.remove('hidden');
    modalStatusOnibus.classList.add('flex');

});

modalStatusOnibus?.addEventListener('click', (e) => {

    if (e.target === modalStatusOnibus) {
        modalStatusOnibus.classList.add('hidden');
        modalStatusOnibus.classList.remove('flex');
    }

});

document.getElementById('fechar-status-onibus')?.addEventListener('click', () => {

    modalStatusOnibus.classList.add('hidden');
    modalStatusOnibus.classList.remove('flex');

});

const modalLotacao = document.getElementById("modal-lotacao");

document.getElementById("btn-lotacao")?.addEventListener("click", () => {

    modalStatusOnibus.classList.add("hidden");
    modalStatusOnibus.classList.remove("flex");

    atualizarModalLotacao();

    modalLotacao.classList.remove("hidden");
    modalLotacao.classList.add("flex");

});

function atualizarModalLotacao() {

    const total = document.querySelectorAll(".btn-embarque").length;

    const embarcados = document.querySelectorAll(".btn-embarque.embarcado").length;

    const vagas = total - embarcados;

    document.getElementById("texto-lotacao").innerText =
        `${embarcados} / ${total}`;

    document.getElementById("embarcados").innerText =
        embarcados;

    document.getElementById("vagas").innerText =
        vagas;

    document.getElementById("barra-lotacao").style.width =
        `${(embarcados/total)*100}%`;

}

document.getElementById("fechar-lotacao")?.addEventListener("click", () => {

    modalLotacao.classList.add("hidden");
    modalLotacao.classList.remove("flex");

});

modalLotacao?.addEventListener("click", (e) => {

    if (e.target === modalLotacao) {

        modalLotacao.classList.add("hidden");
        modalLotacao.classList.remove("flex");

    }

});