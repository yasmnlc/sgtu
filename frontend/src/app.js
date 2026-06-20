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
            carregarListaMotorista();
        } else if (viewName === 'visao-geral') {
            carregarDadosDashboard();
        }
    }
}

navButtons.estudante.addEventListener('click', () => switchView('estudante'));
navButtons.motorista.addEventListener('click', () => switchView('motorista'));
navButtons.secretaria.addEventListener('click', () => switchView('secretaria'));

const btnVisaoGeral = document.getElementById('btn-sec-visao-geral');
const btnValidacao = document.getElementById('btn-sec-validacao');
const subViewVisaoGeral = document.getElementById('sub-view-visao-geral');
const subViewValidacao = document.getElementById('sub-view-validacao');

if (btnVisaoGeral && btnValidacao) {
    btnVisaoGeral.addEventListener('click', () => {
        subViewVisaoGeral.classList.remove('hidden');
        subViewValidacao.classList.add('hidden');
        
        btnVisaoGeral.className = "w-full flex items-center space-x-3 p-3 rounded-xl text-sm font-medium bg-blue-900 border-l-4 border-green-500 transition-all";
        btnValidacao.className = "w-full flex items-center space-x-3 p-3 rounded-xl text-sm font-medium opacity-60 hover:opacity-100 transition-all";
        
        carregarDadosDashboard();
    });

    btnValidacao.addEventListener('click', () => {
        subViewVisaoGeral.classList.add('hidden');
        subViewValidacao.classList.remove('hidden');
        
        btnValidacao.className = "w-full flex items-center space-x-3 p-3 rounded-xl text-sm font-medium bg-blue-900 border-l-4 border-green-500 transition-all";
        btnVisaoGeral.className = "w-full flex items-center space-x-3 p-3 rounded-xl text-sm font-medium opacity-60 hover:opacity-100 transition-all";
        
        carregarPendenciasSecretaria();
    });
}

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

    const formData = new FormData();
    formData.append('nome_completo', document.getElementById('nome').value);
    formData.append('cpf', document.getElementById('cpf').value);
    formData.append('universidade', document.getElementById('universidade').value);
    formData.append('curso', document.getElementById('curso').value);
    formData.append('arquivo', inputArquivo.files[0]);

    try {
        const response = await fetch(`${API_BASE_URL}/cadastro`, {
            method: 'POST',
            body: formData
        });

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
        alert('Erro de Conexão: Não foi possível se comunicar com o backend FastAPI. Verifique se o servidor Uvicorn está rodando.');
    }
});

document.querySelectorAll('.btn-embarque').forEach(button => {
    button.addEventListener('click', function() {
        const icon = this.querySelector('i');
        const text = this.querySelector('span');

        if (icon.classList.contains('fa-regular')) {
            
            icon.className = 'fa-solid fa-circle-check text-xl mb-0.5';
            this.className = 'btn-embarque flex flex-col items-center justify-center text-green-600 font-semibold text-xs';
            text.innerText = 'Embarcado';
        } else {
            
            icon.className = 'fa-regular fa-square text-xl mb-0.5';
            this.className = 'btn-embarque flex flex-col items-center justify-center text-gray-300 font-semibold text-xs hover:text-green-500';
            text.innerText = 'Embarcar';
        }
    });
});

window.addEventListener('DOMContentLoaded', () => {
    switchView('estudante');

    inicializarSelectUniversidades();

    const campoData = document.getElementById('current-date');
    if (campoData) {
        const hoje = new Date();
        campoData.innerText = hoje.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' });
    }
});


async function carregarPendenciasSecretaria() {
    const tabelaBody = document.getElementById('tabela-pendencias');
    if (!tabelaBody) return;

    try {
        const response = await fetch(`${API_BASE_URL}/pendencias`);
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
    if (!nomeArquivo) {
        alert("Arquivo não encontrado para este estudante.");
        return;
    }
    
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

    try {
        const response = await fetch(`${API_BASE_URL}/estudantes/${id}/status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                status: novoStatus,
                justificativa_recusa: justificativa
            })
        });

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

    try {
        const response = await fetch(`${API_BASE_URL}/autorizados`);
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

        atualizarContadorOcupacao(estudantes.length);

    } catch (error) {
        console.error('Erro ao carregar lista do motorista:', error);
    }
}

function alternarEmbarque(botao) {
    const icon = botao.querySelector('i');
    const text = botao.querySelector('span');

    if (icon.classList.contains('fa-regular')) {
        icon.className = 'fa-solid fa-circle-check text-xl mb-0.5';
        botao.className = 'btn-embarque flex flex-col items-center justify-center text-green-600 font-semibold text-xs bg-green-50 p-2.5 rounded-xl border border-green-200';
        text.innerText = 'Embarcado';
    } else {
        icon.className = 'fa-regular fa-square text-xl mb-0.5';
        botao.className = 'btn-embarque flex flex-col items-center justify-center text-gray-300 font-semibold text-xs hover:text-green-500 p-2.5 rounded-xl border border-dashed border-gray-300 bg-gray-50';
        text.innerText = 'Embarcar';
    }
    
    const totalEmbarcados = document.querySelectorAll('.fa-circle-check').length;
    const totalAlunos = document.querySelectorAll('.btn-embarque').length;
    document.querySelector('.text-green-400').innerText = `${totalEmbarcados} / ${totalAlunos} Alunos`;
}

function atualizarContadorOcupacao(total) {
    const elementoContador = document.querySelector('.text-green-400');
    if (elementoContador) elementoContador.innerText = `0 / ${total} Alunos`;
}

async function carregarDadosDashboard() {
    const cardTotal = document.getElementById('card-total-cadastrados');
    const cardPendentes = document.getElementById('card-total-pendentes');
    const cardAutorizados = document.getElementById('card-total-autorizados');

    try {
        const response = await fetch(`${API_BASE_URL}/secretaria/dashboard`);
        const dados = await response.json();

        if (cardTotal) cardTotal.innerText = dados.total_cadastrados;
        if (cardPendentes) cardPendentes.innerText = dados.pendentes;
        if (cardAutorizados) cardAutorizados.innerText = dados.autorizados;

        console.log("Dados por universidade para o gráfico:", dados.por_universidade);

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

document.getElementById('btn-opcao-1')?.addEventListener('click', () => {
    alert('Solicitar Carteirinha');
});

document.getElementById('btn-opcao-2')?.addEventListener('click', () => {
    alert('Solicitar Revisão');
});