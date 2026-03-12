document.addEventListener('DOMContentLoaded', function() {
    const ruolo = localStorage.getItem('userRole');
    const nome = localStorage.getItem('userName');
    const settore = localStorage.getItem('userSettore');
    const isResp = localStorage.getItem('isResponsabile') === 'true';

    // 1. SMISTAMENTO: Se sei admin o amministratore, via di qui!
    if (ruolo === 'admin' || ruolo === 'amministratore') {
        window.location.replace('admin.html');
        return;
    }

    if (document.getElementById('userName') && nome) {
        // Formatta il testo in base al ruolo e al settore
        let testoNavbar = "Ciao, " + nome;
        if (isResp && settore) {
            testoNavbar += " (Responsabile " + settore + ")";
        } else if (settore) {
            testoNavbar += " (" + settore + ")";
        }
        document.getElementById('userName').textContent = testoNavbar;
    }

    const sezioneResp = document.getElementById('sezioneResponsabile');
    if (sezioneResp && isResp) {
        sezioneResp.classList.remove('d-none');
    }

    caricaInviti();
});


function caricaInviti() {
    const lista = document.getElementById('listaInviti');
    if (!lista) return;

    fetch('backend/api/get_inviti.php')
    .then(response => response.json())
    .then(data => {
        lista.innerHTML = '';
        if (data.success && data.inviti) {
            data.inviti.forEach(invito => {
                const occupazione = `${invito.confermati || 0} / ${invito.max_iscritti || 0}`;
                const isPiena = (invito.confermati >= invito.max_iscritti) && (invito.stato !== 'confermato');
                const giaConfermato = invito.stato === 'confermato';

                lista.innerHTML += `
                    <div class="col-md-6 mb-3">
                        <div class="card h-100 shadow-sm border-start ${giaConfermato ? 'border-success' : 'border-primary'} border-4">
                            <div class="card-body">
                                <h5 class="card-title ${giaConfermato ? 'text-success' : 'text-primary'}">${invito.attivita}</h5>
                                <p class="card-text">
                                    📍 <strong>Sala:</strong> ${invito.nome_sala}<br>
                                    👥 <strong>Posti:</strong> <span class="badge ${isPiena ? 'bg-danger' : 'bg-secondary'}">${occupazione}</span><br>
                                    📅 <strong>Data:</strong> ${invito.data}<br>
                                    🕒 <strong>Ore:</strong> ${invito.ora_inizio}:00 (${invito.durata}h)
                                </p>
                                <div class="d-flex justify-content-between align-items-center">
                                    <span class="badge ${giaConfermato ? 'bg-success' : 'bg-info'}">${invito.stato}</span>
                                    ${(!giaConfermato && !isPiena) ? 
                                        `<button class="btn btn-sm btn-outline-success" onclick="rispondi(${invito.id}, 'confermato')">Accetta</button>` 
                                        : (isPiena && !giaConfermato ? '<small class="text-danger">Posti esauriti</small>' : '')}
                                </div>
                            </div>
                        </div>
                    </div>`;
            });
        }
    });
}

function rispondi(idPrenotazione, stato) {
    const formData = new URLSearchParams();
    formData.append('id_prenotazione', idPrenotazione);
    formData.append('stato', stato);

    fetch('backend/api/rispondi_invito.php', {
        method: 'POST',
        body: formData
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            alert("Operazione completata!");
            location.reload();
        } else {
            // QUESTO è il blocco sovrapposizione che arriva dal server
            alert("ATTENZIONE: " + data.message);
        }
    });
}

function logout() {
    // Chiama l'API per distruggere la sessione, poi pulisce il browser e reindirizza
    fetch('backend/api/logout.php').then(() => {
        localStorage.clear();
        window.location.replace('index.html');
    });
}