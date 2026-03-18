// Aguarda o DOM carregar
document.addEventListener("DOMContentLoaded", function() {
    // Elementos
    const sidebarLinks = document.querySelectorAll(".sidebar a[data-section]");
    const dashboardSection = document.getElementById("dashboard-section");
    const estoqueSection = document.getElementById("estoque-section");
    const logoutLink = document.getElementById("logout");

    // Função para mostrar a seção correta
    function showSection(sectionName) {
        // Esconde todas as seções (por enquanto só temos duas, mas podemos esconder todas que começam com "section-")
        // Ou podemos esconder manualmente:
        if (dashboardSection) dashboardSection.style.display = "none";
        if (estoqueSection) estoqueSection.style.display = "none";

        // Mostra a seção escolhida
        if (sectionName === "dashboard" && dashboardSection) {
            dashboardSection.style.display = "block";
        } else if (sectionName === "estoque" && estoqueSection) {
            estoqueSection.style.display = "block";
        }

        // Atualiza a classe active nos links da sidebar
        sidebarLinks.forEach(link => {
            link.classList.remove("active");
            if (link.dataset.section === sectionName) {
                link.classList.add("active");
            }
        });

        // Atualiza o hash da URL (opcional)
        if (sectionName === "dashboard") {
            history.pushState(null, "", "/dashboard");
        } else if (sectionName === "estoque") {
            history.pushState(null, "", "/dashboard#estoque");
        }
    }

    // Adiciona evento de clique nos links da sidebar (exceto logout)
    sidebarLinks.forEach(link => {
        link.addEventListener("click", function(e) {
            e.preventDefault(); // Evita o comportamento padrão do link
            const section = this.dataset.section;
            showSection(section);
        });
    });

    // Verifica o hash na URL ao carregar a página
    if (window.location.hash === "#estoque") {
        showSection("estoque");
    } else {
        showSection("dashboard"); // padrão
    }

    // Logout
    if (logoutLink) {
        logoutLink.addEventListener("click", function(e) {
            e.preventDefault();
            window.location.href = "/logout";
        });
    }

    // Menu responsivo (já existente, mas ajustado)
    const menuBtn = document.getElementById("menu-btn");
    const closeBtn = document.getElementById("close-btn");
    const aside = document.querySelector("aside");

    if (menuBtn) {
        menuBtn.addEventListener("click", function() {
            aside.classList.add("active");
        });
    }

    if (closeBtn) {
        closeBtn.addEventListener("click", function() {
            aside.classList.remove("active");
        });
    }
});