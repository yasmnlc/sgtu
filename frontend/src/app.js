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
            carregarPendenciasSecretaria();
        }
    }
}

navButtons.estudante.addEventListener('click', () => switchView('estudante'));
navButtons.motorista.addEventListener('click', () => switchView('motorista'));
navButtons.secretaria.addEventListener('click', () => switchView('secretaria'));

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
        // Busca os dados da nova rota do backend
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
                    <button onclick="visualizarDocumento('${aluno.cpf}')" class="inline-flex items-center space-x-1 text-blue-600 hover:text-blue-800 font-medium text-xs bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100">
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

// Funções auxiliares para os botões não darem erro de clique (vamos programá-las na Task 5)
function visualizarDocumento(cpf) {
    alert(`Abrindo documento do CPF: ${cpf}. (A rota de download será feita a seguir!)`);
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