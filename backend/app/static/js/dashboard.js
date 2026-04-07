document.addEventListener("DOMContentLoaded", () => {

    // ======================= CONTROLE DE SEÇÕES =======================
    const sidebarLinks = document.querySelectorAll(".sidebar a[data-section]");
    const sections = document.querySelectorAll("main > div[id$='-section']");

    function showSection(sectionName) {
        sections.forEach(sec => sec.style.display = "none");
        const target = document.getElementById(sectionName + "-section");
        if (target) target.style.display = "block";

        sidebarLinks.forEach(link => link.classList.remove("active"));
        const activeLink = document.querySelector(`.sidebar a[data-section='${sectionName}']`);
        if (activeLink) activeLink.classList.add("active");
    }

    sidebarLinks.forEach(link => {
        link.addEventListener("click", e => {
            e.preventDefault();
            showSection(link.dataset.section);
        });
    });

    // Inicializa exibindo a seção ativa ou dashboard
    const activeLink = document.querySelector(".sidebar a.active");
    if (activeLink) showSection(activeLink.dataset.section);
    else showSection("dashboard");

    // ======================= FORMULÁRIO DINÂMICO DE PRODUTOS =======================
    let produtoCounter = 1;
    const produtosContainer = document.getElementById("produtos-pedido");

    window.adicionarProduto = function() {
        const div = document.createElement("div");
        div.classList.add("produto-item");
        div.innerHTML = `
            <select name="produtos[${produtoCounter}][id]">
                {% for produto in produtos %}
                <option value="{{ produto.id }}">{{ produto.nome }}</option>
                {% endfor %}
            </select>
            <input type="number" name="produtos[${produtoCounter}][quantidade]" placeholder="Quantidade" min="1">
            <button type="button" onclick="removerProduto(this)">-</button>
        `;
        produtosContainer.appendChild(div);
        produtoCounter++;
    }

    window.removerProduto = function(btn) {
        btn.parentElement.remove();
    }

    // ======================= POPUPS DE INSUMOS =======================
    window.abrirPopup = function(id) {
        const popup = document.getElementById(`popup-${id}`);
        if (popup) popup.style.display = "flex";
    }

    window.fecharPopup = function(id) {
        const popup = document.getElementById(`popup-${id}`);
        if (popup) popup.style.display = "none";
    }

    // ======================= SIDEBAR MOBILE =======================
    const sidebar = document.querySelector("aside");
    const closeBtn = document.getElementById("close-btn");

    if (closeBtn) {
        closeBtn.addEventListener("click", () => sidebar.classList.remove("active"));
    }

    const menuBtn = document.createElement("button");
    menuBtn.className = "menu-btn";
    menuBtn.textContent = "☰";
    document.body.appendChild(menuBtn);

    menuBtn.addEventListener("click", () => sidebar.classList.toggle("active"));

    // ======================= LOGOUT =======================
    const logoutLink = document.getElementById("logout");

if (logoutLink) {
    logoutLink.addEventListener("click", async (e) => {
        e.preventDefault();

        const confirmLogout = confirm("Deseja realmente sair?");
        if (!confirmLogout) return;

        try {
            const response = await fetch("/logout", {
                method: "POST",
                credentials: "include", // mantém cookies/sessão
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRF-Token": window.CSRF_TOKEN || "" // se usar CSRF
                }
            });

            if (response.ok) {
                // Redireciona para a página de login
                window.location.href = "/login";
            } else {
                alert("Falha ao deslogar. Tente novamente.");
            }
        } catch (err) {
            console.error(err);
            alert("Erro de rede no logout.");
        }
    });
}

});