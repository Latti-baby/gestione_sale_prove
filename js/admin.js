document.addEventListener('DOMContentLoaded', () => {
    const ruolo = localStorage.getItem('userRole'); 
    if (ruolo !== 'admin' && ruolo !== 'amministratore') {
        alert("Accesso negato! Solo gli amministratori possono visualizzare questa pagina.");
        window.location.href = 'dashboard.html';
        return;
    }
    
    // Imposta la data di oggi nell'interfaccia
    const opzioniData = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('dataOggiLabel').textContent = new Date().toLocaleDateString('it-IT', opzioniData);

    caricaReport();

    // Filtri in tempo reale
    document.getElementById('filtroTesto').addEventListener('input', applicaFiltri);
    document.getElementById('filtroSettore').addEventListener('change', applicaFiltri);
});

let datiGlobali = [];

// Sistema di colori automatici per i settori
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

function caricaReport() {
    fetch('../backend/get_admin_report.php', { headers: { 'X-Requested-With': 'XMLHttpRequest' } })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            datiGlobali = data.data;
            popolaFiltroSettori(datiGlobali);
            renderTabella(datiGlobali);
            renderPrenotazioniOggi(datiGlobali); // Popola le sale di oggi
            renderGrafico(datiGlobali); // Accende il grafico!
        }
    });
}

function renderPrenotazioniOggi(dati) {
    const griglia = document.getElementById('grigliaOggi');
    griglia.innerHTML = '';
    
    // Ottiene la data di oggi in formato YYYY-MM-DD
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
    }
}

function logout() {
    fetch('../backend/logout.php', { headers: { 'X-Requested-With': 'XMLHttpRequest' } })
}