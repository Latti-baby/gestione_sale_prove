document.addEventListener('DOMContentLoaded', function() {
    const ruolo = localStorage.getItem('userRole');
    if (ruolo !== 'admin' && ruolo !== 'amministratore') {
        window.location.replace('dashboard.html');
        return;
    }

    caricaIscritti();

    // ----------------------------------------------------
    // FUNZIONE DI RICERCA IN TEMPO REALE
    // ----------------------------------------------------
    const inputRicerca = document.getElementById('ricercaUtente');
    if(inputRicerca) {
        inputRicerca.addEventListener('input', function() {
            const termine = this.value.toLowerCase();
            const righe = document.querySelectorAll('#tabellaIscritti tr');
            
            righe.forEach(riga => {
                // Se la riga è quella del caricamento, ignorala
                if(riga.cells.length < 2) return; 
                
                const testoRiga = riga.textContent.toLowerCase();
                if (testoRiga.includes(termine)) {
                    riga.style.display = '';
                } else {
                    riga.style.display = 'none';
                }
            });
        });
    }
});

function caricaIscritti() {
    const tbody = document.getElementById('tabellaIscritti');
    
    fetch('../backend/get_iscritti.php', { headers: { 'X-Requested-With': 'XMLHttpRequest' } })
    .then(res => res.json())
    .then(data => {
        tbody.innerHTML = '';
        if (data.success && data.iscritti.length > 0) {
            data.iscritti.forEach(user => {
                let badgeRuolo = user.ruolo === 'docente' ? 'bg-primary' : (user.ruolo === 'tecnico' ? 'bg-secondary' : 'bg-info');
                
                let statoResp = user.is_responsabile == 1 
                    ? '<span class="badge bg-success shadow-sm">✓ Responsabile</span>' 
                    : '<span class="text-muted small">No</span>';

                let bottoneAzione = user.is_responsabile == 1
                    ? `<button class="btn btn-sm btn-outline-secondary" disabled>Già Promosso</button>`
                    : `<button class="btn btn-sm btn-success fw-bold shadow-sm" onclick="apriModalePromozione(${user.id}, '${user.nome} ${user.cognome}')">Promuovi ⚙️</button>`;

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
            tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">Nessun iscritto trovato.</td></tr>';
        }
    });
}

function apriModalePromozione(id, nomeCompleto) {
    document.getElementById('prom_id_iscritto').value = id;
    document.getElementById('prom_nome_utente').textContent = nomeCompleto;
    document.getElementById('prom_anni').value = 0;
    
    // Resetta la modale allo stato "Normale"
    document.getElementById('stepNormale').classList.remove('d-none');
    document.getElementById('stepSostituzione').classList.add('d-none');
    document.getElementById('btnPromuoviNormale').classList.remove('d-none');
    document.getElementById('btnPromuoviForzato').classList.add('d-none');
    document.getElementById('headerModale').classList.replace('bg-danger', 'bg-success');
    document.getElementById('feedbackPromozione').innerHTML = '';
    
    new bootstrap.Modal(document.getElementById('modalPromuovi')).show();
}

// Seleziona la funzione con un parametro "force_replace" (0 di default, 1 se forzato)
function confermaPromozione(force_replace = 0) {
    const id = document.getElementById('prom_id_iscritto').value;
    const anni = document.getElementById('prom_anni').value;
    
    const formData = new URLSearchParams();
    formData.append('id_iscritto', id);
    formData.append('anni_servizio', anni);
    formData.append('force_replace', force_replace);

    fetch('../backend/promuovi_responsabile.php', {
        method: 'POST',
        headers: { 'X-Requested-With': 'XMLHttpRequest' },
        body: formData
    })
    .then(res => res.json())
    .then(data => {
        const feedback = document.getElementById('feedbackPromozione');
        
        // Se il backend ci dice che dobbiamo confermare la SOSTITUZIONE
        if (data.require_confirm) {
            // Nascondiamo i form normali e mostriamo l'avviso
            document.getElementById('stepNormale').classList.add('d-none');
            document.getElementById('stepSostituzione').classList.remove('d-none');
            
            // Cambiamo i bottoni
            document.getElementById('btnPromuoviNormale').classList.add('d-none');
            document.getElementById('btnPromuoviForzato').classList.remove('d-none');
            document.getElementById('headerModale').classList.replace('bg-success', 'bg-danger');
            
            // Inseriamo il messaggio di errore dinamico
            document.getElementById('msgSostituzioneTesto').textContent = data.message;
            feedback.innerHTML = '';
            return;
        }

        if (data.success) {
            feedback.innerHTML = '<div class="alert alert-success mt-3 shadow-sm">Operazione completata con successo!</div>';
            setTimeout(() => {
                bootstrap.Modal.getInstance(document.getElementById('modalPromuovi')).hide();
                caricaIscritti(); // Ricarica la tabella per mostrare il cambio
            }, 1500);
        } else {
            feedback.innerHTML = `<div class="alert alert-danger mt-3 shadow-sm">${data.message}</div>`;
        }
    });
}

function logout() {
    fetch('../backend/logout.php', { headers: { 'X-Requested-With': 'XMLHttpRequest' } })
    .then(() => {
        localStorage.clear();
        window.location.replace('../index.php'); 
    });
}