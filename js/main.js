document.addEventListener('DOMContentLoaded', () => {
    const ruolo = localStorage.getItem('userRole');
    if (ruolo === 'admin') {
        window.location.replace('admin.html');
    } else if (ruolo) {
        window.location.replace('dashboard.html');
    }
});

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
            const ruoloPulito = data.ruolo; // Ora è già pulito dal PHP
            
            // Salvataggio dati nel browser
            localStorage.setItem('userName', data.nome);
            localStorage.setItem('userRole', ruoloPulito); 
            localStorage.setItem('userId', data.id);
            localStorage.setItem('isResponsabile', data.isResponsabile);
            localStorage.setItem('userSettore', data.settore || ''); // <-- Salva il settore

            // SMISTAMENTO: controlliamo sia admin che amministratore
            if (ruoloPulito === 'admin' || ruoloPulito === 'amministratore') {
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