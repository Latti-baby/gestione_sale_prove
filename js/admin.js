document.addEventListener('DOMContentLoaded', () => {
    // Recuperiamo il ruolo salvato durante il login
    const ruolo = localStorage.getItem('userRole'); 

    if (ruolo !== 'admin') {
        alert("Accesso negato! Solo gli amministratori possono visualizzare questa pagina.");
        window.location.href = 'dashboard.html';
        return;
    }
    
    caricaReport();
    // ... resto del codice
});


let datiGlobali = [];

document.addEventListener('DOMContentLoaded', () => {
    caricaReport();
    
    // Listener per il filtro di ricerca testuale
    document.getElementById('filtroTesto').addEventListener('input', applicaFiltri);
    document.getElementById('filtroSettore').addEventListener('change', applicaFiltri);
});

function caricaReport() {
    fetch('backend/api/get_admin_report.php')
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            datiGlobali = data.data;
            popolaFiltroSettori(datiGlobali);
            renderTabella(datiGlobali);
        }
    });
}

function renderTabella(dati) {
    const tbody = document.getElementById('tabellaReport');
    tbody.innerHTML = '';

    dati.forEach(row => {
        // Calcolo progressivo occupanti (es: 3/10)
        const occupanti = `${row.confermati} / ${row.max_iscritti}`;
        const isPiena = row.confermati >= row.max_iscritti;

        tbody.innerHTML += `
            <tr class="${isPiena ? 'table-warning' : ''}">
                <td><strong>${row.attivita}</strong></td>
                <td>
                    ${row.nome_sala} 
                    <span class="badge ${isPiena ? 'bg-danger' : 'bg-success'} ms-2">
                        ${occupanti} posti
                    </span>
                </td>
                <td><span class="badge bg-secondary">${row.nome_settore}</span></td>
                <td>${row.data} @ ${row.ora_inizio}:00</td>
                <td>
                    <div class="btn-group">
                        <button class="btn btn-sm btn-warning" onclick="apriModifica(${JSON.stringify(row).replace(/"/g, '&quot;')})">✎</button>
                        <button class="btn btn-sm btn-danger" onclick="eliminaPrenotazione(${row.id})">🗑</button>
                    </div>
                </td>
            </tr>
        `;
    });
}

// Funzione per riempire il modale di modifica
function apriModifica(prenotazione) {
    document.getElementById('edit_id').value = prenotazione.id;
    document.getElementById('edit_attivita').value = prenotazione.attivita;
    document.getElementById('edit_data').value = prenotazione.data;
    document.getElementById('edit_ora').value = prenotazione.ora_inizio;
    document.getElementById('edit_durata').value = prenotazione.durata;
    
    new bootstrap.Modal(document.getElementById('modalModifica')).show();
}

// Funzione per inviare la modifica al database
function salvaModifica() {
    const data = new URLSearchParams({
        id: document.getElementById('edit_id').value,
        attivita: document.getElementById('edit_attivita').value,
        data: document.getElementById('edit_data').value,
        ora_inizio: document.getElementById('edit_ora').value,
        durata: document.getElementById('edit_durata').value
    });

    fetch('backend/api/aggiorna_prenotazione.php', {
        method: 'POST',
        body: data
    })
    .then(res => res.json())
    .then(res => {
        alert(res.message);
        if(res.success) location.reload();
    });
}

// Funzione che invia la richiesta al server
function eliminaPrenotazione(id) {
    if (confirm("Sei sicuro di voler eliminare questa prenotazione? L'azione è irreversibile.")) {
        const formData = new URLSearchParams();
        formData.append('id', id);

        fetch('backend/api/elimina_prenotazione.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: formData.toString()
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                alert("Prenotazione eliminata!");
                caricaReport(); // Rinfresca la tabella senza ricaricare la pagina
            } else {
                alert("Errore: " + data.message);
            }
        });
    }
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
    settori.forEach(s => {
        select.innerHTML += `<option value="${s}">${s}</option>`;
    });
}

function renderGrafico(dati) {
    const ctx = document.getElementById('chartSettori').getContext('2d');
    
    // Contiamo quante prenotazioni ci sono per ogni settore
    const conteggio = {};
    dati.forEach(item => {
        conteggio[item.nome_settore] = (conteggio[item.nome_settore] || 0) + 1;
    });


    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: Object.keys(conteggio),
            datasets: [{
                label: 'Numero di Prenotazioni',
                data: Object.values(conteggio),
                backgroundColor: 'rgba(54, 162, 235, 0.5)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
        }
    });
}
