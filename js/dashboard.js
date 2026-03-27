document.addEventListener('DOMContentLoaded', function() {
    const ruolo = localStorage.getItem('userRole');
    const nome = localStorage.getItem('userName');
    const settore = localStorage.getItem('userSettore');
    const isResp = localStorage.getItem('isResponsabile') === 'true';

    // 1. SMISTAMENTO
    if (ruolo === 'admin' || ruolo === 'amministratore') {
        window.location.replace('admin.html');
        return;
    }

    // 2. Personalizzazione Navbar
    if (document.getElementById('userName') && nome) {
        let testoNavbar = "Ciao, " + nome;
        if (isResp && settore) {
            testoNavbar += " (Responsabile " + settore + ")";
        } else if (settore) {
            testoNavbar += " (" + settore + ")";
        }
        document.getElementById('userName').textContent = testoNavbar;
    }

    // 3. Mostra la sezione responsabile
    const sezioneResp = document.getElementById('sezioneResponsabile');
    if (sezioneResp && isResp) {
        sezioneResp.classList.remove('d-none');
    }

    // 4. Carica gli inviti
    caricaInviti();

    // 5. EVENT LISTENERS PER LA NUOVA MODALE
    const tipoInvito = document.getElementById('tipo_invito');
    if (tipoInvito) {
        tipoInvito.addEventListener('change', function() {
            const divRuolo = document.getElementById('divDettaglioRuolo');
            if (this.value === 'ruolo') {
                divRuolo.classList.remove('d-none');
            } else {
                divRuolo.classList.add('d-none');
            }
        });
    }

    const formPren = document.getElementById('formPrenotazione');
    if (formPren) {
        formPren.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = new URLSearchParams();
            formData.append('id_sala', document.getElementById('id_sala').value);
            formData.append('attivita', document.getElementById('attivita').value);
            formData.append('data', document.getElementById('data_pren').value);
            formData.append('ora_inizio', document.getElementById('ora_p').value);
            formData.append('durata', document.getElementById('durata_p').value);
            formData.append('tipo_invito', document.getElementById('tipo_invito').value);
            formData.append('valore_ruolo', document.getElementById('valore_ruolo').value);

            fetch('../backend/crea_prenotazione.php', {
                method: 'POST',
                headers: { 'X-Requested-With': 'XMLHttpRequest' },
                body: formData
            })
            .then(res => res.json())
            .then(data => {
                const feedback = document.getElementById('feedbackPrenotazione');
                if(data.success) {
                    feedback.innerHTML = `<div class="alert alert-success shadow-sm">Prenotazione salvata e inviti mandati!</div>`;
                    setTimeout(() => location.reload(), 1500);
                } else {
                    feedback.innerHTML = `<div class="alert alert-danger shadow-sm">${data.message}</div>`;
                }
            });
        });
    }
});


// --- FUNZIONI GLOBALI ---

function caricaInviti() {
    const lista = document.getElementById('listaInviti');
    if (!lista) return;

    fetch('../backend/get_inviti.php', { headers: { 'X-Requested-With': 'XMLHttpRequest' } })
    .then(response => response.json())
    .then(data => {
        lista.innerHTML = '';
        if (data.success && data.inviti) {
            if (data.inviti.length === 0) {
                lista.innerHTML = '<div class="col-12 text-center text-muted"><p>Nessun invito in programma.</p></div>';
                return;
            }

            data.inviti.forEach(invito => {
                const occupazione = `${invito.confermati || 0} / ${invito.max_iscritti || 0}`;
                const isPiena = (invito.confermati >= invito.max_iscritti) && (invito.stato !== 'confermato');
                const giaConfermato = invito.stato === 'confermato';

                let bottoniAzioni = '';
                if (invito.stato === 'in attesa') {
                    bottoniAzioni = `
                        <button class="btn btn-sm btn-outline-success" onclick="rispondi(${invito.id}, 'confermato')">Accetta</button>
                        <button class="btn btn-sm btn-outline-danger ms-2" onclick="apriModaleRifiuto(${invito.id})">Rifiuta</button>
                    `;
                    if (isPiena) bottoniAzioni = '<small class="text-danger fw-bold">Posti esauriti</small>';
                } else if (invito.stato === 'confermato') {
                    bottoniAzioni = `
                        <button class="btn btn-sm btn-warning text-dark shadow-sm" onclick="rispondi(${invito.id}, 'annullato')">Annulla</button>
                    `;
                } else if (invito.stato === 'rifiutato' || invito.stato === 'annullato') {
                    bottoniAzioni = `<small class="text-muted">Hai declinato</small>`;
                }

                lista.innerHTML += `
                    <div class="col-md-6 mb-3">
                        <div class="card h-100 shadow-sm border-start ${giaConfermato ? 'border-success' : 'border-primary'} border-4">
                            <div class="card-body">
                                <h5 class="card-title ${giaConfermato ? 'text-success' : 'text-primary'} fw-bold">${invito.attivita}</h5>
                                <p class="card-text mb-2 text-muted">
                                    📍 <strong>Sala:</strong> ${invito.nome_sala}<br>
                                    👥 <strong>Posti:</strong> <span class="badge ${isPiena ? 'bg-danger' : 'bg-secondary'}">${occupazione}</span><br>
                                    📅 <strong>Data:</strong> ${invito.data}<br>
                                    🕒 <strong>Ore:</strong> ${invito.ora_inizio}:00 (${invito.durata}h)
                                </p>
                                <div class="d-flex justify-content-between align-items-center mt-3 border-top pt-2">
                                    <span class="badge ${giaConfermato ? 'bg-success' : (invito.stato === 'rifiutato' ? 'bg-danger' : 'bg-info')}">${invito.stato}</span>
                                    <div>${bottoniAzioni}</div>
                                </div>
                            </div>
                        </div>
                    </div>`;
            });
        } else {
            lista.innerHTML = `<div class="col-12 text-center text-danger"><p>Errore nel caricamento degli inviti.</p></div>`;
        }
    })
    .catch(() => {
        lista.innerHTML = '<div class="col-12 text-center text-danger"><p>Errore di connessione col server.</p></div>';
    });
}

function apriModalePrenotazione() {
    fetch('../backend/get_sale_settore.php', { headers: { 'X-Requested-With': 'XMLHttpRequest' } })
    .then(res => res.json())
    .then(data => {
        const selectSala = document.getElementById('id_sala');
        selectSala.innerHTML = '<option value="">Seleziona una sala...</option>';
        if (data.success) {
            data.sale.forEach(s => {
                selectSala.innerHTML += `<option value="${s.id}">${s.nome} (Max: ${s.capienza})</option>`;
            });
        }
    });

    document.getElementById('data_pren').value = new Date().toISOString().split('T')[0];
    new bootstrap.Modal(document.getElementById('modalPrenotazione')).show();
}

function apriModaleRifiuto(idPrenotazione) {
    document.getElementById('rifiuto_id_prenotazione').value = idPrenotazione;
    document.getElementById('rifiuto_motivazione').value = '';
    new bootstrap.Modal(document.getElementById('modalRifiuto')).show();
}

function confermaRifiuto() {
    const id = document.getElementById('rifiuto_id_prenotazione').value;
    const motivazione = document.getElementById('rifiuto_motivazione').value.trim();
    
    if (motivazione === '') {
        alert("Devi inserire una motivazione per il rifiuto.");
        return;
    }
    rispondi(id, 'rifiutato', motivazione);
}

function rispondi(idPrenotazione, stato, motivazione = null) {
    if (stato === 'annullato' && !confirm("Sei sicuro di voler annullare la tua disponibilità?")) return;

    const formData = new URLSearchParams();
    formData.append('id_prenotazione', idPrenotazione);
    formData.append('stato', stato);
    if (motivazione) formData.append('motivazione', motivazione);

    fetch('../backend/rispondi_invito.php', {
        method: 'POST',
        headers: { 'X-Requested-With': 'XMLHttpRequest' },
        body: formData
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            location.reload();
        } else {
            alert("ATTENZIONE: " + data.message);
        }
    });
}

function logout() {
    fetch('../backend/logout.php', { 
        headers: { 'X-Requested-With': 'XMLHttpRequest' } 
    })
    .then(() => {
        localStorage.clear();
        window.location.replace('../index.php'); 
    });
}