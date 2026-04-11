document.addEventListener('DOMContentLoaded', () => {
    const ruolo = localStorage.getItem('userRole'); 
    if (ruolo !== 'admin' && ruolo !== 'amministratore') {
        window.location.href = 'dashboard.html'; return;
    }

    caricaReport();
    caricaIscritti();
    caricaSaleEDotazioni();

    const inputRicerca = document.getElementById('ricercaUtente');
    if(inputRicerca) {
        inputRicerca.addEventListener('input', function() {
            const termine = this.value.toLowerCase();
            document.querySelectorAll('#tabellaIscritti tr').forEach(riga => {
                if(riga.cells.length < 2) return; 
                riga.style.display = riga.textContent.toLowerCase().includes(termine) ? '' : 'none';
            });
        });
    }
});

let datiGlobali = [];

function cambiaScheda(nomeScheda) {
    document.getElementById('schedaDashboard').classList.add('d-none');
    document.getElementById('schedaSale').classList.add('d-none');
    
    if(nomeScheda === 'dashboard') document.getElementById('schedaDashboard').classList.remove('d-none');
    if(nomeScheda === 'sale') document.getElementById('schedaSale').classList.remove('d-none');
}

// =========================================================
// NUOVA SEZIONE: GESTIONE E MODIFICA DELLE SALE
// =========================================================

function apriModaleNuovaSala() {
    // Carica i settori per la tendina della nuova sala
    fetch('../backend/get_settori.php', { headers: { 'X-Requested-With': 'XMLHttpRequest' } })
    .then(res => res.json())
    .then(data => {
        const sel = document.getElementById('ns_settore');
        sel.innerHTML = '<option value="">-- Seleziona Settore --</option>';
        if(data.success) {
            data.settori.forEach(s => { sel.innerHTML += `<option value="${s.id}">${s.nome}</option>`; });
        }
        document.getElementById('ns_nome').value = '';
        document.getElementById('ns_capienza').value = '10';
        new bootstrap.Modal(document.getElementById('modalNuovaSala')).show();
    });
}

function salvaNuovaSala() {
    const data = new URLSearchParams();
    data.append('nome', document.getElementById('ns_nome').value);
    data.append('capienza', document.getElementById('ns_capienza').value);
    data.append('id_settore', document.getElementById('ns_settore').value);

    fetch('../backend/aggiungi_sala.php', { 
        method: 'POST', 
        headers: { 'X-Requested-With': 'XMLHttpRequest' },
        body: data 
    })
    .then(res => res.json())
    .then(res => {
        if(res.success) {
            bootstrap.Modal.getInstance(document.getElementById('modalNuovaSala')).hide();
            caricaSaleEDotazioni(); // Ricarica la griglia
        } else {
            alert("Errore nella creazione della sala: " + res.message);
        }
    });
}

function apriModificaSala(id, nome, capienza) {
    document.getElementById('ms_id').value = id;
    document.getElementById('ms_nome').value = nome;
    document.getElementById('ms_capienza').value = capienza;
    new bootstrap.Modal(document.getElementById('modalModificaSala')).show();
}

function salvaModificaSala() {
    const data = new URLSearchParams();
    data.append('id', document.getElementById('ms_id').value);
    data.append('nome', document.getElementById('ms_nome').value);
    data.append('capienza', document.getElementById('ms_capienza').value);

    fetch('../backend/modifica_sala.php', { 
        method: 'POST', 
        headers: { 'X-Requested-With': 'XMLHttpRequest' },
        body: data 
    })
    .then(res => res.json())
    .then(res => {
        if(res.success) {
            bootstrap.Modal.getInstance(document.getElementById('modalModificaSala')).hide();
            caricaSaleEDotazioni(); 
        } else {
            alert("Errore modifica sala: " + res.message);
        }
    });
}

// =========================================================
// GESTIONE INVENTARIO E DOTAZIONI
// =========================================================

function caricaSaleEDotazioni() {
    const griglia = document.getElementById('grigliaSale');
    fetch('../backend/get_sale_dotazioni.php', { headers: { 'X-Requested-With': 'XMLHttpRequest' } })
    .then(res => res.json())
    .then(data => {
        if(data.success) {
            renderGrigliaSale(data.sale, data.dotazioni);
        } else {
            griglia.innerHTML = `<div class="col-12 text-center text-danger fw-bold py-5">❌ Errore DB: ${data.message}</div>`;
        }
    })
    .catch(err => {
        griglia.innerHTML = `<div class="col-12 text-center text-danger fw-bold py-5">❌ Errore Connessione Server.</div>`;
    });
}

function renderGrigliaSale(sale, dotazioni) {
    const griglia = document.getElementById('grigliaSale');
    griglia.innerHTML = '';

    sale.forEach(sala => {
        const oggetti = dotazioni.filter(d => d.id_sala === sala.id);
        
        let htmlDotazioni = '';
        oggetti.forEach(ogg => {
            let badgeColore = "bg-success";
            if(ogg.condizione.includes("Buona")) badgeColore = "bg-warning text-dark";
            if(ogg.condizione.includes("sostituire")) badgeColore = "bg-secondary text-white"; 
            if(ogg.condizione.includes("Guasta")) badgeColore = "bg-danger";

            htmlDotazioni += `
                <li class="list-group-item d-flex justify-content-between align-items-start">
                    <div class="ms-2 me-auto">
                        <div class="fw-bold">${ogg.nome_dotazione}</div>
                        ${ogg.note ? `<small class="text-muted d-block mt-1"><em>Note: ${ogg.note}</em></small>` : ''}
                    </div>
                    <div class="text-end">
                        <span class="badge ${badgeColore} rounded-pill mb-1">${ogg.condizione}</span><br>
                        <button class="btn btn-sm btn-outline-secondary" onclick="apriModificaDotazione(${ogg.id}, '${ogg.condizione}', '${(ogg.note || '').replace(/'/g, "\\'")}')">✎ Stato</button>
                    </div>
                </li>
            `;
        });

        if(oggetti.length === 0) htmlDotazioni = `<li class="list-group-item text-muted text-center small">Nessuna dotazione registrata</li>`;

        griglia.innerHTML += `
            <div class="col-md-6 mb-4">
                <div class="card shadow-sm border-0 border-top border-4 border-info h-100">
                    
                    <div class="card-header bg-white d-flex justify-content-between align-items-center py-3">
                        <div>
                            <h5 class="fw-bold mb-0 text-dark">${sala.nome} <span class="badge bg-light text-dark border ms-2 shadow-sm">Max ${sala.capienza} pax</span></h5>
                        </div>
                        <div>
                            <span class="badge bg-secondary me-2 shadow-sm">${sala.nome_settore || 'Generico'}</span>
                            <button class="btn btn-sm btn-outline-primary fw-bold" onclick="apriModificaSala(${sala.id}, '${sala.nome.replace(/'/g, "\\'")}', ${sala.capienza})">⚙️ Modifica</button>
                        </div>
                    </div>

                    <div class="card-body bg-light">
                        <h6 class="fw-bold text-muted small text-uppercase">Inventario Attuale</h6>
                        <ul class="list-group list-group-flush mb-3 border shadow-sm rounded bg-white">
                            ${htmlDotazioni}
                        </ul>
                        <div class="input-group input-group-sm">
                            <input type="text" id="nuova_dot_${sala.id}" class="form-control border-info" placeholder="Es: Amplificatore, Luci...">
                            <button class="btn btn-info text-white fw-bold" onclick="aggiungiDotazione(${sala.id})">Aggiungi +</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });
}

function aggiungiDotazione(idSala) {
    const input = document.getElementById(`nuova_dot_${idSala}`);
    const nome = input.value.trim();
    if(!nome) return;

    const data = new URLSearchParams();
    data.append('id_sala', idSala);
    data.append('nome_dotazione', nome);

    fetch('../backend/aggiungi_dotazione.php', { method: 'POST', headers: { 'X-Requested-With': 'XMLHttpRequest' }, body: data })
    .then(() => caricaSaleEDotazioni());
}

function apriModificaDotazione(id, condizione, note) {
    document.getElementById('dot_id').value = id;
    document.getElementById('dot_condizione').value = condizione;
    document.getElementById('dot_note').value = note;
    new bootstrap.Modal(document.getElementById('modalModificaDotazione')).show();
}

function salvaDotazione() {
    const data = new URLSearchParams({
        id_dotazione: document.getElementById('dot_id').value,
        condizione: document.getElementById('dot_condizione').value,
        note: document.getElementById('dot_note').value
    });

    fetch('../backend/aggiorna_dotazione.php', { method: 'POST', headers: { 'X-Requested-With': 'XMLHttpRequest' }, body: data })
    .then(() => {
        bootstrap.Modal.getInstance(document.getElementById('modalModificaDotazione')).hide();
        caricaSaleEDotazioni();
    });
}

// =========================================================
// GESTIONE ISCRITTI E PROMOZIONI E REPORT
// =========================================================

function formattazioneData(dataSQL) {
    if(!dataSQL) return 'N/A';
    const d = new Date(dataSQL);
    return d.toLocaleDateString('it-IT');
}

function caricaIscritti() {
    const tbody = document.getElementById('tabellaIscritti');
    fetch('../backend/get_iscritti.php', { headers: { 'X-Requested-With': 'XMLHttpRequest' } })
    .then(res => res.json())
    .then(data => {
        tbody.innerHTML = '';
        if (data.success && data.iscritti.length > 0) {
            data.iscritti.forEach(user => {
                let badgeRuolo = user.ruolo === 'admin' || user.ruolo === 'amministratore' ? 'bg-danger' : (user.ruolo === 'docente' ? 'bg-primary' : 'bg-info');
                let statoResp = user.is_responsabile == 1 ? '<span class="badge bg-success shadow-sm">✓ Responsabile</span>' : '<span class="text-muted small">No</span>';
                let dataIscr = formattazioneData(user.data_registrazione);

                let bottoneAzione = user.is_responsabile == 1 || user.ruolo === 'admin' || user.ruolo === 'amministratore'
                    ? `<button class="btn btn-sm btn-outline-secondary" disabled>Non Promuovibile</button>`
                    : `<button class="btn btn-sm btn-success fw-bold shadow-sm" onclick="apriModalePromozione(${user.id}, '${user.nome.replace(/'/g, "\\'")} ${user.cognome.replace(/'/g, "\\'")}')">Promuovi ⚙️</button>`;

                tbody.innerHTML += `
                    <tr>
                        <td class="fw-bold">${user.nome} ${user.cognome}<br><small class="text-muted">${user.email}</small></td>
                        <td><span class="badge ${badgeRuolo}">${user.ruolo}</span></td>
                        <td>${user.nome_settore || '-'}</td>
                        <td class="small fw-bold text-secondary">📅 ${dataIscr}</td>
                        <td>${statoResp}</td>
                        <td>${bottoneAzione}</td>
                    </tr>
                `;
            });
        }
    });
}

function apriModalePromozione(id, nome) {
    document.getElementById('prom_id_iscritto').value = id;
    document.getElementById('prom_nome_utente').textContent = nome;
    document.getElementById('stepNormale').classList.remove('d-none');
    document.getElementById('stepSostituzione').classList.add('d-none');
    document.getElementById('btnPromuoviNormale').classList.remove('d-none');
    document.getElementById('btnPromuoviForzato').classList.add('d-none');
    document.getElementById('feedbackPromozione').innerHTML = '';
    new bootstrap.Modal(document.getElementById('modalPromuovi')).show();
}

function confermaPromozione(force = 0) {
    const id = document.getElementById('prom_id_iscritto').value;
    const anni = document.getElementById('prom_anni').value;
    
    fetch('../backend/promuovi_responsabile.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'X-Requested-With': 'XMLHttpRequest' },
        body: `id_iscritto=${id}&anni_servizio=${anni}&force_replace=${force}`
    }).then(res => res.json()).then(data => {
        if (data.require_confirm) {
            document.getElementById('stepNormale').classList.add('d-none');
            document.getElementById('stepSostituzione').classList.remove('d-none');
            document.getElementById('btnPromuoviNormale').classList.add('d-none');
            document.getElementById('btnPromuoviForzato').classList.remove('d-none');
            document.getElementById('msgSostituzioneTesto').textContent = data.message;
        } else if (data.success) {
            bootstrap.Modal.getInstance(document.getElementById('modalPromuovi')).hide();
            caricaIscritti(); 
        }
    });
}

function caricaReport() {
    fetch('../backend/get_admin_report.php', { headers: { 'X-Requested-With': 'XMLHttpRequest' } })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            datiGlobali = data.data;
            renderTabella(datiGlobali);
            renderGrafico(datiGlobali);
        }
    });
}

function renderTabella(dati) {
    const tbody = document.getElementById('tabellaReport');
    tbody.innerHTML = '';
    dati.forEach(row => {
        tbody.innerHTML += `<tr>
            <td class="fw-bold">${row.attivita}</td>
            <td>${row.nome_sala}</td>
            <td><span class="badge bg-secondary">${row.nome_settore}</span></td>
            <td>${row.data} (${row.ora_inizio}:00)</td>
            <td class="text-end"><button class="btn btn-sm btn-outline-danger" onclick="eliminaPrenotazione(${row.id})">🗑 Cancella</button></td>
        </tr>`;
    });
}

function renderGrafico(dati) {
    const ctx = document.getElementById('chartSettori');
    if(!ctx) return;
    const ctx2d = ctx.getContext('2d');
    const conteggio = {};
    dati.forEach(item => { conteggio[item.nome_settore] = (conteggio[item.nome_settore] || 0) + 1; });

    if(window.mioGrafico) window.mioGrafico.destroy();
    window.mioGrafico = new Chart(ctx2d, {
        type: 'bar',
        data: { labels: Object.keys(conteggio), datasets: [{ data: Object.values(conteggio), backgroundColor: 'rgba(13,110,253,0.7)' }] },
        options: { plugins: { legend: { display: false } }, maintainAspectRatio: false }
    });
}

function eliminaPrenotazione(id) {
    if(confirm("Eliminare prenotazione?")) {
        fetch('../backend/elimina_prenotazione.php', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'X-Requested-With': 'XMLHttpRequest' }, body: `id=${id}` })
        .then(() => caricaReport());
    }
}

function logout() {
    fetch('../backend/logout.php', { headers: { 'X-Requested-With': 'XMLHttpRequest' } }).then(() => { localStorage.clear(); window.location.replace('../index.php'); });
}