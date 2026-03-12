document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault(); 

    const email = document.getElementById('email').value;
    const feedback = document.getElementById('loginFeedback');

    feedback.innerHTML = '<div class="alert alert-info">Verifica in corso...</div>';

    // Pulizia totale della memoria precedente
    localStorage.clear();

    fetch('backend/api/login.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'email=' + encodeURIComponent(email)
    })
    .then(response => {
        if (!response.ok) throw new Error('File non trovato o errore server');
        return response.json();
    })
    .then(data => {
        if (data.success) {
            // PULIZIA DEL RUOLO: togliamo spazi e rendiamo tutto minuscolo
            const ruoloPulito = data.ruolo.toString().trim().toLowerCase();
            
            // Salvataggio dati nel browser
            localStorage.setItem('userName', data.nome);
            localStorage.setItem('userRole', ruoloPulito); 
            localStorage.setItem('userId', data.id);
            localStorage.setItem('isResponsabile', data.isResponsabile);

            // DEBUG: Se ancora non va, questo alert ci dirà cosa vede il JS
            console.log("Ruolo ricevuto:", ruoloPulito);

            // SMISTAMENTO CON CONTROLLO RIGIDO
            if (ruoloPulito === 'admin') {
                alert("Accesso Amministratore confermato. Reindirizzamento...");
                window.location.replace('admin.html');
            } else {
                window.location.replace('dashboard.html');
            }
        } else {
            feedback.innerHTML = `<div class="alert alert-danger">${data.message}</div>`;
        }
    })
    .catch(error => {
        console.error('Errore:', error);
        feedback.innerHTML = `<div class="alert alert-danger">Errore tecnico: ${error.message}</div>`;
    });
});