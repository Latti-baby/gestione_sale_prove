document.addEventListener('DOMContentLoaded', () => {
    const ruolo = localStorage.getItem('userRole'); 
    if (ruolo !== 'admin' && ruolo !== 'amministratore') {
        alert("Accesso negato! Solo gli amministratori possono visualizzare questa pagina.");
        window.location.href = 'dashboard.html';
        return;
    }
    
    const opzioniData = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('dataOggiLabel').textContent = new Date().toLocaleDateString('it-IT', opzioniData);

    caricaReport();
    caricaIscritti(); 

    const filtroTesto = document.getElementById('filtroTesto');
    if(filtroTesto) filtroTesto.addEventListener('input', applicaFiltri);
    const filtroSettore = document.getElementById('filtroSettore');
    if(filtroSettore) filtroSettore.addEventListener('change', applicaFiltri);

    const inputRicerca = document.getElementById('ricercaUtente');
    if(inputRicerca) {
        inputRicerca.addEventListener('input', function() {
            const termine = this.value.toLowerCase();
            const righe = document.querySelectorAll('#tabellaIscritti tr');
            
            righe.forEach(riga => {
                if(riga.cells.length < 2) return; 
                const testoRiga = riga.textContent.toLowerCase();
                riga.style.display = testoRiga.includes(termine) ? '' : 'none';
            });
        });
    }
});

let datiGlobali = [];
const coloriBadge = ['bg-primary', 'bg-success', 'bg-danger', 'bg-warning text-dark', 'bg-info text-dark', 'bg-secondary', 'bg-dark'];
let mappaColori = {};
let indiceColore = 0;

function getColoreSettore(nomeSettore) {
    if (!mappaColori[nomeSettore]) {
        mappaColori[nomeSettore] = coloriBadge[indiceColore % coloriBadge.length];
        indiceColore++;
    }
    return mappaColori[nomeSettore];
}

// --- GESTIONE ISCRITTI, PROMOZIONI E REVOCA ---

function caricaIscritti() {
    const tbody = document.getElementById('tabellaIscritti');
    
    fetch('../backend/get_iscritti.php', { headers: { 'X-Requested-With': 'XMLHttpRequest' } })
    .then(res => {
        if (!res.ok) throw new Error("Errore server (Codice " + res.status + ")");
        return res.json();
    })
    .then(data => {
        tbody.innerHTML = '';
        if (data.success && data.iscritti.length > 0) {
            data.iscritti.forEach(user => {
                let badgeRuolo = user.ruolo === 'docente' ? 'bg-primary' : (user.ruolo === 'tecnico' ? 'bg-secondary' : 'bg-info');
                
                let statoResp = user.is_responsabile == 1 
                    ? '<span class="badge bg-success shadow-sm">✓ Responsabile</span>' 
                    : '<span class="text-muted small">No</span>';

                // CAMBIAMENTO: Adesso c'è il tasto REVOCA al posto del tasto disabilitato
                let bottoneAzione = user.is_responsabile == 1
                    ? `<button class="btn btn-sm btn-danger fw-bold shadow-sm" onclick="revocaResponsabile(${user.id}, '${user.nome.replace(/'/g, "\\'")} ${user.cognome.replace(/'/g, "\\'")}')">Revoca 🗑️</button>`
                    : `<button class="btn btn-sm btn-success fw-bold shadow-sm" onclick="apriModalePromozione(${user.id}, '${user.nome.replace(/'/g, "\\'")} ${user.cognome.replace(/'/g, "\\'")}')">Promuovi ⚙️</button>`;

                tbody.innerHTML += `
                    <tr>
                        <td class="fw-bold">${user.nome} ${user.cognome}</td>
                        <td>${user.email}</td>
                        <td><span class="badge ${badgeRuolo}">${user.ruolo}</span></td>
                        <td>${user.nome_settore || '-'}</td>
                        <td>${statoResp}</td>
                        <td>${bottoneAzione}</td>
                    </tr>
                `;
            });
        } else {
            tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted">${data.message || 'Nessun iscritto trovato.'}</td></tr>`;
        }
    })
    .catch(err => {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center text-danger fw-bold py-4">❌ Impossibile caricare gli iscritti:<br><small class="text-muted">${err.message}</small></td></tr>`;
    });
}

// NUOVA FUNZIONE: Revoca Responsabile
function revocaResponsabile(id, nomeCompleto) {
    if (confirm(`⚠️ Sei sicuro di voler REVOCARE il ruolo di Responsabile a ${nomeCompleto}?`)) {
        const formData = new URLSearchParams();
        formData.append('id_iscritto', id);

        fetch('../backend/revoca_responsabile.php', {
            method: 'POST',
            headers: { 'X-Requested-With': 'XMLHttpRequest' },
            body: formData
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                alert(`Ruolo revocato con successo a ${nomeCompleto}.`);
                caricaIscritti(); // Aggiorna tabella
            } else {
                alert("Errore: " + data.message);
            }
        })
        .catch(err => {
            alert("Errore di connessione o file PHP non trovato.");
            console.error(err);
        });
    }
}

function apriModalePromozione(id, nomeCompleto) {
    document.getElementById('prom_id_iscritto').value = id;
    document.getElementById('prom_nome_utente').textContent = nomeCompleto;
    document.getElementById('prom_anni').value = 0;
    
    document.getElementById('stepNormale').classList.remove('d-none');
    document.getElementById('stepSostituzione').classList.add('d-none');
    document.getElementById('btnPromuoviNormale').classList.remove('d-none');
    document.getElementById('btnPromuoviForzato').classList.add('d-none');
    document.getElementById('headerModale').classList.replace('bg-danger', 'bg-success');
    document.getElementById('feedbackPromozione').innerHTML = '';
    
    new bootstrap.Modal(document.getElementById('modalPromuovi')).show();
}

function confermaPromozione(force_replace = 0) {
    const id = document.getElementById('prom_id_iscritto').value;
    const anni = document.getElementById('prom_anni').value;
    const feedback = document.getElementById('feedbackPromozione');
    
    feedback.innerHTML = '<div class="alert alert-info mt-3 shadow-sm">Elaborazione in corso...</div>';

    const formData = new URLSearchParams();
    formData.append('id_iscritto', id);
    formData.append('anni_servizio', anni);
    formData.append('force_replace', force_replace);

    fetch('../backend/promuovi_responsabile.php', {
        method: 'POST',
        headers: { 'X-Requested-With': 'XMLHttpRequest' },
        body: formData
    })
    .then(res => {
        if (!res.ok) throw new Error("Errore del server: " + res.status);
        return res.json();
    })
    .then(data => {
        if (data.require_confirm) {
            document.getElementById('stepNormale').classList.add('d-none');
            document.getElementById('stepSostituzione').classList.remove('d-none');
            document.getElementById('btnPromuoviNormale').classList.add('d-none');
            document.getElementById('btnPromuoviForzato').classList.remove('d-none');
            document.getElementById('headerModale').classList.replace('bg-success', 'bg-danger');
            document.getElementById('msgSostituzioneTesto').textContent = data.message;
            feedback.innerHTML = '';
            return;
        }

        if (data.success) {
            feedback.innerHTML = '<div class="alert alert-success mt-3 shadow-sm">Operazione completata con successo!</div>';
            setTimeout(() => {
                bootstrap.Modal.getInstance(document.getElementById('modalPromuovi')).hide();
                caricaIscritti(); 
            }, 1500);
        } else {
            feedback.innerHTML = `<div class="alert alert-danger mt-3 shadow-sm">${data.message}</div>`;
        }
    })
    // AGGIUNTO CATCH DEGLI ERRORI: Ora se fallisce ti dice il motivo
    .catch(err => {
        console.error(err);
        feedback.innerHTML = `<div class="alert alert-danger mt-3 shadow-sm">❌ Impossibile promuovere: ${err.message}. Controlla il file PHP.</div>`;
    });
}

// --- GESTIONE PRENOTAZIONI, GRAFICI E REPORT ---

function caricaReport() {
    fetch('../backend/get_admin_report.php', { headers: { 'X-Requested-With': 'XMLHttpRequest' } })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            datiGlobali = data.data;
            popolaFiltroSettori(datiGlobali);
            renderTabella(datiGlobali);
            renderPrenotazioniOggi(datiGlobali);
            renderGrafico(datiGlobali);
        }
    });
}

function renderPrenotazioniOggi(dati) {
    const griglia = document.getElementById('grigliaOggi');
    griglia.innerHTML = '';
    const oggiString = new Date().toISOString().split('T')[0];
    const filtrateOggi = dati.filter(item => item.data === oggiString);

    if (filtrateOggi.length === 0) {
        griglia.innerHTML = `<div class="col-12"><div class="alert alert-light text-center border text-muted">Nessuna prenotazione prevista per oggi.</div></div>`;
        return;
    }

    filtrateOggi.forEach(row => {
        const occupanti = `${row.confermati} / ${row.max_iscritti}`;
        const isPiena = row.confermati >= row.max_iscritti;
        const coloreBadge = getColoreSettore(row.nome_settore);

        griglia.innerHTML += `
            <div class="col-md-4">
                <div class="card card-oggi h-100 bg-white border-0 shadow-sm border-start border-5 ${isPiena ? 'border-danger' : 'border-success'}">
                    <div class="card-body position-relative">
                        <span class="badge ${coloreBadge} position-absolute top-0 end-0 m-3 shadow-sm">${row.nome_settore}</span>
                        <h5 class="card-title text-dark fw-bold pe-5">${row.attivita}</h5>
                        <p class="mb-1 text-muted">📍 <strong>Sala:</strong> ${row.nome_sala}</p>
                        <p class="mb-1 text-muted">🕒 <strong>Ora:</strong> ${row.ora_inizio}:00 (${row.durata || 1}h)</p>
                        <div class="mt-3">
                            <span class="badge ${isPiena ? 'bg-danger' : 'bg-light text-dark border'} w-100 py-2 fs-6">
                                👥 Posti: ${occupanti}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });
}

function renderTabella(dati) {
    const tbody = document.getElementById('tabellaReport');
    tbody.innerHTML = '';

    dati.forEach(row => {
        const occupanti = `${row.confermati} / ${row.max_iscritti}`;
        const isPiena = row.confermati >= row.max_iscritti;
        const coloreBadge = getColoreSettore(row.nome_settore); 

        tbody.innerHTML += `
            <tr class="${isPiena ? 'table-warning' : ''}">
                <td class="fw-bold text-dark">${row.attivita}</td>
                <td>
                    ${row.nome_sala} 
                    <span class="badge ${isPiena ? 'bg-danger' : 'bg-success'} ms-2 rounded-pill">${occupanti}</span>
                </td>
                <td><span class="badge ${coloreBadge} shadow-sm">${row.nome_settore}</span></td>
                <td>${row.data} <br><small class="text-muted">Ore: ${row.ora_inizio}:00</small></td>
                <td class="text-end">
                    <div class="btn-group shadow-sm">
                        <button class="btn btn-sm btn-outline-primary" onclick="apriModifica(${JSON.stringify(row).replace(/"/g, '&quot;')})">✎ Modifica</button>
                        <button class="btn btn-sm btn-outline-danger" onclick="eliminaPrenotazione(${row.id})">🗑 Cancella</button>
                    </div>
                </td>
            </tr>
        `;
    });
}

function applicaFiltri() {
    const testo = document.getElementById('filtroTesto').value.toLowerCase();
    const settore = document.getElementById('filtroSettore').value;

    const filtrati = datiGlobali.filter(item => {
        const matchTesto = item.attivita.toLowerCase().includes(testo) || 
                           item.nome_sala.toLowerCase().includes(testo);
        const matchSettore = settore === "" || item.nome_settore === settore;
        return matchTesto && matchSettore;
    });
    renderTabella(filtrati);
}

function popolaFiltroSettori(dati) {
    const select = document.getElementById('filtroSettore');
    const settori = [...new Set(dati.map(item => item.nome_settore))];
    select.innerHTML = '<option value="">Tutti i settori</option>';
    settori.forEach(s => {
        select.innerHTML += `<option value="${s}">${s}</option>`;
    });
}

function renderGrafico(dati) {
    const ctx = document.getElementById('chartSettori').getContext('2d');
    
    if(window.mioGrafico) { window.mioGrafico.destroy(); }

    const conteggio = {};
    dati.forEach(item => {
        conteggio[item.nome_settore] = (conteggio[item.nome_settore] || 0) + 1;
    });

    window.mioGrafico = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.keys(conteggio),
            datasets: [{
                label: 'Totale Prenotazioni per Settore',
                data: Object.values(conteggio),
                backgroundColor: 'rgba(13, 110, 253, 0.7)', 
                borderColor: 'rgba(13, 110, 253, 1)',
                borderWidth: 2,
                borderRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
            plugins: { legend: { display: false } }
        }
    });
}

function apriModifica(prenotazione) {
    document.getElementById('edit_id').value = prenotazione.id;
    document.getElementById('edit_attivita').value = prenotazione.attivita;
    document.getElementById('edit_data').value = prenotazione.data;
    document.getElementById('edit_ora').value = prenotazione.ora_inizio;
    new bootstrap.Modal(document.getElementById('modalModifica')).show();
}

function salvaModifica() {
    const data = new URLSearchParams({
        id: document.getElementById('edit_id').value,
        attivita: document.getElementById('edit_attivita').value,
        data: document.getElementById('edit_data').value,
        ora_inizio: document.getElementById('edit_ora').value,
        durata: document.getElementById('edit_durata') ? document.getElementById('edit_durata').value : 1
    });

    fetch('../backend/aggiorna_prenotazione.php', { 
        method: 'POST', 
        headers: { 
            'Content-Type': 'application/x-www-form-urlencoded',
            'X-Requested-With': 'XMLHttpRequest' 
        },
        body: data 
    })
    .then(res => res.json())
    .then(res => {
        alert(res.message);
        if(res.success) location.reload();
    });
}

function eliminaPrenotazione(id) {
    if (confirm("Sei sicuro di voler eliminare questa prenotazione? L'azione è irreversibile.")) {
        const formData = new URLSearchParams();
        formData.append('id', id);

        fetch('../backend/elimina_prenotazione.php', {
            method: 'POST', 
            headers: { 
                'Content-Type': 'application/x-www-form-urlencoded',
                'X-Requested-With': 'XMLHttpRequest' 
            }, 
            body: formData.toString()
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                caricaReport(); 
            } else { 
                alert("Errore: " + data.message); 
            }
        });
    }
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