// ===========================
// Smooth scroll for nav links
// ===========================
document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth' });
        }
    });
});

// ===========================
// Contact form handler
// ===========================
const form = document.getElementById('contactForm');
if (form) {
    form.addEventListener('submit', function (e) {
        e.preventDefault();
        alert('Message sent! (Replace this with your real form handler.)');
        form.reset();
    });
}
