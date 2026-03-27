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

    fetch('../backend/get_inviti.php', { headers: { 'X-Requested-With': 'XMLHttpRequest' } })
    .then(response => response.json())
    .then(data => {
        lista.innerHTML = '';
        if (data.success && data.inviti) {
            data.inviti.forEach(invito => {
                const occupazione = `${invito.confermati || 0} / ${invito.max_iscritti || 0}`;
                const isPiena = (invito.confermati >= invito.max_iscritti) && (invito.stato !== 'confermato');
                const giaConfermato = invito.stato === 'confermato';

                // --- LOGICA BOTTONI AGGIORNATA ---
                let bottoniAzioni = '';
                if (invito.stato === 'in attesa') {
                    bottoniAzioni = `
                        <button class="btn btn-sm btn-outline-success" onclick="rispondi(${invito.id}, 'confermato')">Accetta</button>
                        <button class="btn btn-sm btn-outline-danger ms-2" onclick="apriModaleRifiuto(${invito.id})">Rifiuta</button>
                    `;
                    if (isPiena) bottoniAzioni = '<small class="text-danger fw-bold">Posti esauriti</small>';
                } else if (invito.stato === 'confermato') {
                    bottoniAzioni = `
                        <button class="btn btn-sm btn-warning text-dark shadow-sm" onclick="rispondi(${invito.id}, 'annullato')">Annulla Disponibilità</button>
                    `;
                } else if (invito.stato === 'rifiutato' || invito.stato === 'annullato') {
                    bottoniAzioni = `<small class="text-muted">Hai declinato/annullato</small>`;
                }

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
                                <div class="d-flex justify-content-between align-items-center mt-3 border-top pt-2">
                                    <span class="badge ${giaConfermato ? 'bg-success' : (invito.stato === 'rifiutato' ? 'bg-danger' : 'bg-info')}">${invito.stato}</span>
                                    <div>${bottoniAzioni}</div>
                                </div>
                            </div>
                        </div>
                    </div>`;
            });
        }
    });
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