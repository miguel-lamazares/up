const toggler = document.getElementById('theme-toggler');



if (localStorage.getItem('theme') === 'dark') {

    document.body.classList.add('dark-theme');

    toggler.classList.add('active');

}



toggler.addEventListener('click', () => {

    toggler.classList.toggle('active');

    document.body.classList.toggle('dark-theme');



    const theme = document.body.classList.contains('dark-theme') ? 'dark' : 'light';

    localStorage.setItem('theme', theme);

});

window.addEventListener('DOMContentLoaded', () => {
    const name = document.getElementById('name');
    const username = localStorage.getItem('username'); // pega do localStorage
    name.textContent = username || 'Usuário'; // fallback
});

const logout = document.getElementById('logout');

logout.addEventListener('click', async (e) => {
    e.preventDefault();
    localStorage.removeItem('username');
    await fetch('/logout');
    window.location.href = '/';
});



const sideMenu = document.querySelector("aside");
const menuBtn = document.querySelector("#menu-btn");
const closeBtn = document.querySelector("#close-btn");

menuBtn.addEventListener('click', () => {
    sideMenu.style.display = 'block';
});

closeBtn.addEventListener('click', () => {
    sideMenu.style.display = 'none';
});

