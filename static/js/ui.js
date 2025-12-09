// ui.js - General UI interactions for VoiceVibe
console.log('UI.js loaded');

// Smooth scroll for anchor links
document.addEventListener('DOMContentLoaded', () => {
    // Handle smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Add any other general UI functionality here
});
