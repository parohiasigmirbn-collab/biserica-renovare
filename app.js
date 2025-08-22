// Orthodox Church Website JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Initialize all functionality
    initNavigation();
    initScrollAnimations();
    initProgressBars();
    initForms();
    initMobileMenu();
});

// Navigation functionality
function initNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    const header = document.querySelector('.header');
    
    // Smooth scrolling for navigation links
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            
            if (targetSection) {
                const headerHeight = header.offsetHeight;
                const targetPosition = targetSection.offsetTop - headerHeight;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
                
                // Close mobile menu if open
                closeMobileMenu();
            }
        });
    });
    
    // Update active navigation link on scroll
    window.addEventListener('scroll', updateActiveNavLink);
    
    // Header background on scroll
    window.addEventListener('scroll', function() {
        if (window.scrollY > 50) {
            header.style.background = 'rgba(var(--color-surface), 0.98)';
        } else {
            header.style.background = 'rgba(var(--color-surface), 0.95)';
        }
    });
}

function updateActiveNavLink() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');
    const headerHeight = document.querySelector('.header').offsetHeight;
    
    let currentSection = '';
    
    sections.forEach(section => {
        const sectionTop = section.offsetTop - headerHeight - 100;
        const sectionHeight = section.offsetHeight;
        
        if (window.scrollY >= sectionTop && window.scrollY < sectionTop + sectionHeight) {
            currentSection = section.getAttribute('id');
        }
    });
    
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${currentSection}`) {
            link.classList.add('active');
        }
    });
}

// Mobile menu functionality
function initMobileMenu() {
    const navToggle = document.querySelector('.nav-toggle');
    const navMenu = document.querySelector('.nav-menu');
    
    if (navToggle && navMenu) {
        navToggle.addEventListener('click', toggleMobileMenu);
        
        // Close menu when clicking on a link
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', closeMobileMenu);
        });
        
        // Close menu when clicking outside
        document.addEventListener('click', function(e) {
            if (!navToggle.contains(e.target) && !navMenu.contains(e.target)) {
                closeMobileMenu();
            }
        });
    }
}

function toggleMobileMenu() {
    const navMenu = document.querySelector('.nav-menu');
    const navToggle = document.querySelector('.nav-toggle');
    
    navMenu.classList.toggle('active');
    navToggle.classList.toggle('active');
    
    // Add mobile menu styles dynamically
    if (navMenu.classList.contains('active')) {
        navMenu.style.display = 'flex';
        navMenu.style.flexDirection = 'column';
        navMenu.style.position = 'absolute';
        navMenu.style.top = '100%';
        navMenu.style.left = '0';
        navMenu.style.right = '0';
        navMenu.style.background = 'var(--color-surface)';
        navMenu.style.padding = 'var(--space-16)';
        navMenu.style.boxShadow = 'var(--shadow-lg)';
        navMenu.style.borderTop = '1px solid var(--color-border)';
        navMenu.style.gap = 'var(--space-16)';
    } else {
        navMenu.style.display = '';
        navMenu.style.flexDirection = '';
        navMenu.style.position = '';
        navMenu.style.top = '';
        navMenu.style.left = '';
        navMenu.style.right = '';
        navMenu.style.background = '';
        navMenu.style.padding = '';
        navMenu.style.boxShadow = '';
        navMenu.style.borderTop = '';
        navMenu.style.gap = '';
    }
}

function closeMobileMenu() {
    const navMenu = document.querySelector('.nav-menu');
    const navToggle = document.querySelector('.nav-toggle');
    
    if (navMenu && navToggle) {
        navMenu.classList.remove('active');
        navToggle.classList.remove('active');
        
        // Reset styles
        navMenu.style.display = '';
        navMenu.style.flexDirection = '';
        navMenu.style.position = '';
        navMenu.style.top = '';
        navMenu.style.left = '';
        navMenu.style.right = '';
        navMenu.style.background = '';
        navMenu.style.padding = '';
        navMenu.style.boxShadow = '';
        navMenu.style.borderTop = '';
        navMenu.style.gap = '';
    }
}

// Scroll animations
function initScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, observerOptions);
    
    // Observe elements for animation
    const animateElements = document.querySelectorAll(
        '.stat-card, .news-card, .timeline-item, .work-item, .method-card'
    );
    
    animateElements.forEach(element => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(30px)';
        element.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
        observer.observe(element);
    });
    
    // Add CSS for animate-in class
    const style = document.createElement('style');
    style.textContent = `
        .animate-in {
            opacity: 1 !important;
            transform: translateY(0) !important;
        }
    `;
    document.head.appendChild(style);
}

// Progress bar animations
function initProgressBars() {
    const progressBars = document.querySelectorAll('.progress-fill');
    
    const progressObserver = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const progressBar = entry.target;
                const targetWidth = progressBar.style.width;
                
                // Reset width and animate
                progressBar.style.width = '0%';
                
                setTimeout(() => {
                    progressBar.style.width = targetWidth;
                }, 200);
            }
        });
    }, {
        threshold: 0.5
    });
    
    progressBars.forEach(bar => {
        progressObserver.observe(bar);
    });
}

// Form handling
function initForms() {
    const contactForm = document.querySelector('.contact-form');
    const volunteerButtons = document.querySelectorAll('.volunteer-card .btn');
    
    // Contact form submission
    if (contactForm) {
        contactForm.addEventListener('submit', handleContactForm);
    }
    
    // Volunteer button clicks
    volunteerButtons.forEach(button => {
        button.addEventListener('click', handleVolunteerClick);
    });
}

function handleContactForm(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const submitButton = e.target.querySelector('button[type="submit"]');
    
    // Disable submit button and show loading state
    submitButton.disabled = true;
    submitButton.textContent = 'Se trimite...';
    
    // Simulate form submission (replace with actual API call)
    setTimeout(() => {
        showNotification('Mesajul a fost trimis cu succes! Vă vom contacta în curând.', 'success');
        e.target.reset();
        
        // Reset button
        submitButton.disabled = false;
        submitButton.textContent = 'Trimite Mesajul';
    }, 2000);
}

function handleVolunteerClick(e) {
    e.preventDefault();
    
    // Show volunteer interest modal or scroll to contact
    showNotification('Vă mulțumim pentru interes! Vă rugăm să ne contactați pentru mai multe detalii despre voluntariat.', 'info');
    
    // Scroll to contact section
    setTimeout(() => {
        const contactSection = document.querySelector('#contact');
        const headerHeight = document.querySelector('.header').offsetHeight;
        const targetPosition = contactSection.offsetTop - headerHeight;
        
        window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
        });
    }, 2000);
}

// Notification system
function showNotification(message, type = 'info') {
    // Remove existing notification
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification--${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-message">${message}</span>
            <button class="notification-close">&times;</button>
        </div>
    `;
    
    // Add notification styles
    const notificationStyles = `
        .notification {
            position: fixed;
            top: 100px;
            right: var(--space-20);
            background: var(--color-surface);
            border: 1px solid var(--color-border);
            border-radius: var(--radius-base);
            box-shadow: var(--shadow-lg);
            z-index: 1001;
            max-width: 400px;
            transform: translateX(100%);
            transition: transform var(--duration-normal) var(--ease-standard);
        }
        
        .notification--success {
            border-left: 4px solid var(--color-success);
        }
        
        .notification--error {
            border-left: 4px solid var(--color-error);
        }
        
        .notification--info {
            border-left: 4px solid var(--color-info);
        }
        
        .notification.show {
            transform: translateX(0);
        }
        
        .notification-content {
            padding: var(--space-16);
            display: flex;
            align-items: flex-start;
            gap: var(--space-12);
        }
        
        .notification-message {
            flex: 1;
            line-height: 1.5;
        }
        
        .notification-close {
            background: none;
            border: none;
            font-size: var(--font-size-xl);
            cursor: pointer;
            color: var(--color-text-secondary);
            padding: 0;
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .notification-close:hover {
            color: var(--color-text);
        }
    `;
    
    // Add styles if not already added
    if (!document.querySelector('#notification-styles')) {
        const styleElement = document.createElement('style');
        styleElement.id = 'notification-styles';
        styleElement.textContent = notificationStyles;
        document.head.appendChild(styleElement);
    }
    
    // Add to DOM
    document.body.appendChild(notification);
    
    // Show notification
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    // Handle close button
    const closeButton = notification.querySelector('.notification-close');
    closeButton.addEventListener('click', () => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    });
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }
    }, 5000);
}

// Donation button functionality
document.addEventListener('DOMContentLoaded', function() {
    const donationButtons = document.querySelectorAll('[href="#sustine"]');
    
    donationButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            // Add a visual feedback for donation interest
            setTimeout(() => {
                const sustainSection = document.querySelector('#sustine');
                if (sustainSection) {
                    sustainSection.style.background = 'var(--color-bg-3)';
                    
                    setTimeout(() => {
                        sustainSection.style.background = '';
                    }, 2000);
                }
            }, 500);
        });
    });
});

// Timeline interaction
function initTimelineInteraction() {
    const timelineItems = document.querySelectorAll('.timeline-item');
    
    timelineItems.forEach(item => {
        item.addEventListener('click', function() {
            // Add click effect for timeline items
            this.style.transform = 'scale(1.02)';
            this.style.transition = 'transform 0.2s ease';
            
            setTimeout(() => {
                this.style.transform = '';
            }, 200);
        });
    });
}

// Initialize timeline interaction
document.addEventListener('DOMContentLoaded', initTimelineInteraction);

// Lazy loading for images
function initLazyLoading() {
    const images = document.querySelectorAll('img[src]');
    
    const imageObserver = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.style.opacity = '0';
                img.style.transition = 'opacity 0.3s ease';
                
                img.addEventListener('load', function() {
                    this.style.opacity = '1';
                });
                
                imageObserver.unobserve(img);
            }
        });
    });
    
    images.forEach(img => {
        imageObserver.observe(img);
    });
}

// Initialize lazy loading
document.addEventListener('DOMContentLoaded', initLazyLoading);

// Scroll to top functionality
function addScrollToTop() {
    const scrollToTopButton = document.createElement('button');
    scrollToTopButton.innerHTML = '↑';
    scrollToTopButton.className = 'scroll-to-top';
    scrollToTopButton.setAttribute('aria-label', 'Scroll to top');
    
    // Add styles for scroll to top button
    const scrollToTopStyles = `
        .scroll-to-top {
            position: fixed;
            bottom: var(--space-24);
            right: var(--space-24);
            width: 50px;
            height: 50px;
            background: var(--color-primary);
            color: var(--color-btn-primary-text);
            border: none;
            border-radius: 50%;
            font-size: var(--font-size-xl);
            cursor: pointer;
            opacity: 0;
            visibility: hidden;
            transition: all var(--duration-normal) var(--ease-standard);
            z-index: 1000;
            box-shadow: var(--shadow-lg);
        }
        
        .scroll-to-top.visible {
            opacity: 1;
            visibility: visible;
        }
        
        .scroll-to-top:hover {
            background: var(--color-primary-hover);
            transform: translateY(-2px);
        }
    `;
    
    // Add styles
    const styleElement = document.createElement('style');
    styleElement.textContent = scrollToTopStyles;
    document.head.appendChild(styleElement);
    
    // Add button to DOM
    document.body.appendChild(scrollToTopButton);
    
    // Show/hide on scroll
    window.addEventListener('scroll', function() {
        if (window.scrollY > 300) {
            scrollToTopButton.classList.add('visible');
        } else {
            scrollToTopButton.classList.remove('visible');
        }
    });
    
    // Handle click
    scrollToTopButton.addEventListener('click', function() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// Initialize scroll to top
document.addEventListener('DOMContentLoaded', addScrollToTop);