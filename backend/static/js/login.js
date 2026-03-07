document.addEventListener("DOMContentLoaded", function() {
    const btnLogin = document.getElementById("btnLogin");
    const user = document.getElementById("userInput")
    const password = document.getElementById("passwordInput");
    const errorDiv = document.getElementById("loginError");

    btnLogin.addEventListener("click", async () => {
        // Validação
        if (!user.value.trim() || !password.value.trim()) {
            showError("Preencha todos os campos!");
            return;
        }

        // Loading
        btnLogin.disabled = true;
        btnLogin.textContent = "Entrando...";
        hideError();

        try {
            const response = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    username: user.value,
                    password: password.value
                })
            });

            if (response.ok) {
                const data = await response.json();
                localStorage.setItem("token", data.token);
                window.location.href = "/dashboard";
            } else {
                const errorText = await response.text();
                showError(errorText || "Falha no login. Verifique suas credenciais.");
            }
        } catch (error) {
            showError("Erro de rede. Tente novamente.");
        } finally {
            btnLogin.disabled = false;
            btnLogin.textContent = "Entrar";
        }
    });

    function showError(msg) {
        errorDiv.textContent = msg;
        errorDiv.style.display = "block";
    }

    function hideError() {
        errorDiv.style.display = "none";
    }


    console.log("Login script carregado.");
});