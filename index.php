<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login - Gestione Sale Prove</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="css/style.css">
</head>
<body class="bg-light">

<div class="container d-flex justify-content-center align-items-center vh-100">
    <div class="card shadow" style="width: 100%; max-width: 400px;">
        <div class="card-body">
            <h3 class="card-title text-center mb-4">Accesso Associazione</h3>
            <form id="loginForm">
                <div class="mb-3">
                    <label for="email" class="form-label">Indirizzo Email</label>
                    <input type="email" class="form-control" id="email" placeholder="nome@esempio.it" required>
                </div>
                
                <button type="submit" class="btn btn-primary w-100">Accedi</button>
                
                <div class="text-center mt-3">
                    <p class="mb-0">Non sei ancora iscritto? <br> <a href="Frontend/registrazione.html" class="text-decoration-none fw-bold">Registrati qui</a></p>
                </div>

            </form>
            <div id="loginFeedback" class="mt-3"></div>
        </div>
    </div>
</div>

<script src="JS/main.js"></script>
</body>
</html>