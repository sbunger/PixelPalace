const parallax = document.querySelector('.parallax-bg');
const speed = 0.25;

window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    parallax.style.backgroundPositionY = `${- (scrollY * speed)}px`;
});