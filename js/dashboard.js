document.addEventListener('DOMContentLoaded', function() {
    const ruolo = localStorage.getItem('userRole');
    const nome = localStorage.getItem('userName');
    const settore = localStorage.getItem('userSettore');
    // localStorage salva tutto come testo, quindi verifichiamo stringa 'true' o numero '1'
    const isResp = (localStorage.getItem('isResponsabile') === 'true' || localStorage.getItem('isResponsabile') === '1');

    if (ruolo === 'admin' || ruolo === 'amministratore') {
        window.location.replace('admin.html');
        return;
    }

    if (document.getElementById('userName') && nome) {
        document.getElementById('userName').innerHTML = `<i class="bi bi-person-circle me-1"></i> ${nome} ${settore ? `<span class="badge bg-secondary ms-2">${settore}</span>` : ''}`;
    }

    const sezioneResp = document.getElementById('sezioneResponsabile');
    if (sezioneResp && isResp) {
        sezioneResp.classList.remove('d-none');
        caricaStatoMieiEventi(); 
    }
    
    caricaNotifiche(); 
    caricaInviti();

    const tipoInvito = document.getElementById('tipo_invito');
    if (tipoInvito) {
        tipoInvito.addEventListener('change', function() {
            const divRuolo = document.getElementById('divDettaglioRuolo');
            if(divRuolo) {
                this.value === 'ruolo' ? divRuolo.classList.remove('d-none') : divRuolo.classList.add('d-none');
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
                if(!feedback) return;
                if(data.success) {
                    feedback.innerHTML = `<div class="alert alert-success">Prenotazione creata!</div>`;
                    setTimeout(() => location.reload(), 1500);
                } else {
                    feedback.innerHTML = `<div class="alert alert-danger">${data.message}</div>`;
                }
            })
            .catch(err => alert("Errore connessione: " + err.message));
        });
    }
});


// --- MONITORAGGIO RESPONSABILI ---
function caricaStatoMieiEventi() {
    const lista = document.getElementById('listaMieiEventi');
    if (!lista) return; // <-- Questo salva la vita se l'HTML non è allineato

    fetch('../backend/get_stato_miei_eventi.php', {
        headers: { 'X-Requested-With': 'XMLHttpRequest' }
    })
    .then(res => res.text()) 
    .then(testo => {
        try {
            const data = JSON.parse(testo); 
            if (data.success && data.eventi) {
                if (data.eventi.length === 0) {
                    lista.innerHTML = '<div class="col-12 text-muted small px-3">Nessun evento creato da te.</div>';
                    return;
                }
                lista.innerHTML = '';
                data.eventi.forEach(evento => {
                    let htmlP = '<ul class="list-group list-group-flush border-top mt-3">';
                    if (evento.partecipanti.length === 0) {
                        htmlP += '<li class="list-group-item text-muted small">Nessun invitato.</li>';
                    } else {
                        evento.partecipanti.forEach(p => {
                            let color = p.stato === 'confermato' ? 'success' : (p.stato === 'rifiutato' ? 'danger' : 'muted');
                            htmlP += `
                                <li class="list-group-item bg-transparent d-flex justify-content-between align-items-center py-2">
                                    <span class="small fw-medium">${p.nome} ${p.cognome}</span>
                                    <span class="badge bg-${color} rounded-pill">${p.stato}</span>
                                </li>`;
                            if(p.stato === 'rifiutato' && p.motivazione) {
                                htmlP += `<li class="list-group-item bg-light-subtle py-1 border-0 small text-danger fst-italic">"${p.motivazione}"</li>`;
                            }
                        });
                    }
                    htmlP += '</ul>';

                    lista.innerHTML += `
                        <div class="col-lg-4 mb-4">
                            <div class="card shadow-sm border-0 border-top border-primary border-4 h-100">
                                <div class="card-body">
                                    <h6 class="fw-bold mb-1">${evento.attivita}</h6>
                                    <p class="text-muted small mb-0"><i class="bi bi-geo-alt"></i> ${evento.nome_sala} | <i class="bi bi-clock"></i> ${evento.ora_inizio}:00</p>
                                    ${htmlP}
                                </div>
                            </div>
                        </div>`;
                });
            } else {
                lista.innerHTML = `<div class="col-12 alert alert-warning">Errore: ${data.message}</div>`;
            }
        } catch (e) {
            lista.innerHTML = `<div class="col-12 alert alert-danger"><h6 class="fw-bold">ERRORE PHP</h6><pre>${testo}</pre></div>`;
        }
    })
    .catch(err => { lista.innerHTML = `<div class="col-12 text-danger">Errore di rete</div>`; });
}

// --- INVITI RICEVUTI ---
function caricaInviti() {
    const lista = document.getElementById('listaInviti');
    if (!lista) return;

    fetch('../backend/get_inviti.php', {
        headers: { 'X-Requested-With': 'XMLHttpRequest' }
    })
    .then(res => res.text()) 
    .then(testo => {
        try {
            const data = JSON.parse(testo);
            if (data.success && data.inviti) {
                if (data.inviti.length === 0) {
                    lista.innerHTML = '<div class="col-12 text-muted small px-3">Nessun invito ricevuto.</div>';
                    return;
                }
                lista.innerHTML = '';
                data.inviti.forEach(invito => {
                    const giaConfermato = invito.stato === 'confermato';
                    const isPiena = (invito.confermati >= invito.max_iscritti) && !giaConfermato;

                    let bottoni = '';
                    if (invito.stato === 'in attesa') {
                        bottoni = isPiena ? '<span class="text-danger small fw-bold">POSTI ESAURITI</span>' : 
                            `<button class="btn btn-sm btn-success me-2" onclick="rispondi(${invito.id}, 'confermato')">Accetta</button>
                             <button class="btn btn-sm btn-outline-danger" onclick="apriModaleRifiuto(${invito.id})">Rifiuta</button>`;
                    } else if (giaConfermato) {
                        bottoni = `<button class="btn btn-sm btn-warning" onclick="rispondi(${invito.id}, 'annullato')">Annulla</button>`;
                    }

                    lista.innerHTML += `
                        <div class="col-md-6 mb-3">
                            <div class="card shadow-sm border-0 border-start border-${giaConfermato ? 'success' : 'primary'} border-4 h-100">
                                <div class="card-body">
                                    <div class="d-flex justify-content-between">
                                        <h6 class="fw-bold text-primary mb-1">${invito.attivita}</h6>
                                        <span class="badge bg-light text-dark border">${invito.confermati}/${invito.max_iscritti} 👥</span>
                                    </div>
                                    <p class="text-muted small mb-3">Organizzato da: <b>${invito.organizzatore || 'Responsabile'}</b><br>
                                    <i class="bi bi-calendar"></i> ${invito.data} ore ${invito.ora_inizio}:00</p>
                                    <div class="d-flex align-items-center justify-content-between">
                                        <span class="badge bg-${invito.stato === 'rifiutato' ? 'danger' : (giaConfermato ? 'success' : 'info')}">${invito.stato}</span>
                                        <div>${bottoni}</div>
                                    </div>
                                </div>
                            </div>
                        </div>`;
                });
            } else {
                lista.innerHTML = `<div class="col-12 alert alert-warning">Errore inviti: ${data.message}</div>`;
            }
        } catch(e) {
            lista.innerHTML = `<div class="col-12 alert alert-danger"><h6 class="fw-bold">ERRORE PHP</h6><pre>${testo}</pre></div>`;
        }
    })
    .catch(err => { lista.innerHTML = `<div class="col-12 text-danger">Errore di rete</div>`; });
}

function apriModalePrenotazione() {
    fetch('../backend/get_sale_settore.php', {
        headers: { 'X-Requested-With': 'XMLHttpRequest' }
    }).then(res => res.json()).then(data => {
        const sel = document.getElementById('id_sala');
        if(!sel) return;
        sel.innerHTML = '<option value="">Seleziona...</option>';
        if (data.success) data.sale.forEach(s => { sel.innerHTML += `<option value="${s.id}">${s.nome}</option>`; });
    });
    document.getElementById('data_pren').value = new Date().toISOString().split('T')[0];
    new bootstrap.Modal(document.getElementById('modalPrenotazione')).show();
}

function rispondi(id, stato, motivazione = null) {
    if (stato === 'annullato' && !confirm("Sicuro di voler annullare?")) return;
    const fd = new URLSearchParams();
    fd.append('id_prenotazione', id);
    fd.append('stato', stato);
    if(motivazione) fd.append('motivazione', motivazione);

    fetch('../backend/rispondi_invito.php', { 
        method: 'POST', 
        headers: { 'X-Requested-With': 'XMLHttpRequest' },
        body: fd 
    })
    .then(res => res.json())
    .then(d => { if (d.success) { location.reload(); } else { alert("Errore: " + d.message); } });
}

function apriModaleRifiuto(id) {
    document.getElementById('rifiuto_id_prenotazione').value = id;
    new bootstrap.Modal(document.getElementById('modalRifiuto')).show();
}

function confermaRifiuto() {
    const id = document.getElementById('rifiuto_id_prenotazione').value;
    const mot = document.getElementById('rifiuto_motivazione').value.trim();
    if(!mot) return alert("Inserisci una motivazione");
    rispondi(id, 'rifiutato', mot);
}

function logout() { 
    fetch('../backend/logout.php', { headers: { 'X-Requested-With': 'XMLHttpRequest' } })
    .then(() => { localStorage.clear(); window.location.replace('../index.php'); }); 
}

function caricaNotifiche() {
    const l = document.getElementById('listaNotifiche');
    const box = document.getElementById('sezioneNotifiche');
    if(!l || !box) return;

    fetch('../backend/get_notifiche.php', { headers: { 'X-Requested-With': 'XMLHttpRequest' } })
    .then(res => res.json()).then(data => {
        if (data.success && data.notifiche && data.notifiche.length > 0) {
            box.classList.remove('d-none');
            l.innerHTML = '';
            data.notifiche.forEach(n => { l.innerHTML += `<li>${n.messaggio} <small class="text-muted">(${n.data_creazione})</small></li>`; });
        }
    }).catch(e => console.log("Notifiche disattivate/Errore"));
}