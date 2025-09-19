// Landing Page JavaScript for BurritosCerca
class LandingPage {
    constructor() {
        this.spotsLeft = 47; // Simulated spots remaining
        this.init();
    }

    init() {
        this.startCountdown();
        this.updateSpotsLeft();
        this.setupScrollEffects();
    }

    // Countdown Timer
    startCountdown() {
        const countdownElement = document.getElementById('countdown');
        if (!countdownElement) return;

        // Set countdown to 24 hours from now
        const endTime = new Date().getTime() + (24 * 60 * 60 * 1000);

        const timer = setInterval(() => {
            const now = new Date().getTime();
            const distance = endTime - now;

            if (distance < 0) {
                clearInterval(timer);
                countdownElement.innerHTML = "¡Oferta terminada!";
                return;
            }

            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);

            countdownElement.innerHTML = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }, 1000);
    }

    // Update spots left (simulate decreasing)
    updateSpotsLeft() {
        const spotsElement = document.getElementById('spotsLeft');
        if (!spotsElement) return;

        // Simulate spots decreasing every few minutes
        setInterval(() => {
            if (this.spotsLeft > 10) {
                this.spotsLeft -= Math.floor(Math.random() * 3) + 1;
                spotsElement.textContent = this.spotsLeft;
                
                // Save to localStorage to persist across page reloads
                localStorage.setItem('burritoscerca_spots_left', this.spotsLeft);
            }
        }, 180000); // Every 3 minutes

        // Load from localStorage if available
        const savedSpots = localStorage.getItem('burritoscerca_spots_left');
        if (savedSpots && parseInt(savedSpots) < this.spotsLeft) {
            this.spotsLeft = parseInt(savedSpots);
            spotsElement.textContent = this.spotsLeft;
        }
    }

    // Scroll effects
    setupScrollEffects() {
        // Animate elements on scroll
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, observerOptions);

        // Observe elements for animation
        const animateElements = document.querySelectorAll('.benefit-card, .testimonial, .step, .faq-item');
        animateElements.forEach(el => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(30px)';
            el.style.transition = 'all 0.6s ease';
            observer.observe(el);
        });
    }

    // Social proof notifications
    showSocialProof() {
        const notifications = [
            "🌮 María de Tijuana acaba de unirse",
            "🚚 Carlos de Phoenix activó su puesto",
            "⭐ Nuevo vendedor en Los Angeles",
            "🔥 +3 vendedores se unieron hoy"
        ];

        const showNotification = () => {
            const notification = document.createElement('div');
            const randomMessage = notifications[Math.floor(Math.random() * notifications.length)];
            
            notification.innerHTML = `
                <div class="social-notification">
                    <span>${randomMessage}</span>
                    <button onclick="this.parentElement.parentElement.remove()">×</button>
                </div>
            `;

            notification.style.cssText = `
                position: fixed;
                bottom: 20px;
                left: 20px;
                z-index: 1000;
                animation: slideInLeft 0.5s ease;
            `;

            const style = document.createElement('style');
            style.textContent = `
                @keyframes slideInLeft {
                    from { transform: translateX(-100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                
                .social-notification {
                    background: white;
                    padding: 15px 20px;
                    border-radius: 10px;
                    box-shadow: 0 5px 20px rgba(0, 0, 0, 0.2);
                    display: flex;
                    align-items: center;
                    gap: 15px;
                    font-weight: 600;
                    color: #333;
                    border-left: 4px solid #06d6a0;
                }
                
                .social-notification button {
                    background: none;
                    border: none;
                    font-size: 1.2rem;
                    cursor: pointer;
                    color: #999;
                }
            `;

            if (!document.querySelector('#social-proof-styles')) {
                style.id = 'social-proof-styles';
                document.head.appendChild(style);
            }

            document.body.appendChild(notification);

            // Auto remove after 5 seconds
            setTimeout(() => {
                if (notification.parentElement) {
                    notification.remove();
                }
            }, 5000);
        };

        // Show first notification after 10 seconds
        setTimeout(showNotification, 10000);
        
        // Then show random notifications every 30-60 seconds
        setInterval(() => {
            if (Math.random() > 0.5) {
                showNotification();
            }
        }, 45000);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.landingPage = new LandingPage();
    
    // Start social proof notifications after page load
    setTimeout(() => {
        landingPage.showSocialProof();
    }, 5000);
});