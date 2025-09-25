tosCerca - Modern Mexican Food Finder App v2.1
class BurritosCerca {
    constructor() {
        this.vendors = [];
        this.filteredVendors = [];
        this.storageKey = 'burritoscerca_vendors';
        
        // Supabase configuration - Replace with your actual values
        this.supabaseUrl = 'https://ojshbaedxjapfrkmfcfq.supabase.co';
        this.supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qc2hiYWVkeGphcGZya21mY2ZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg1NjI5NzgsImV4cCI6MjA3NDEzODk3OH0.K1L6KQfqPkkvYLfMuuBDzjFS6RnTfhxcWhQ-f1gge3U';
        this.foodKeywords = [
            // Tacos callejeros
            'tacos', 'suadero', 'tripas', 'cabeza', 'lengua', 'adobada', 'al pastor',
            'carnitas', 'chorizo', 'carne asada', 'pollo', 'pescado', 'camaron',
            // Antojitos callejeros
            'elotes', 'esquites', 'raspados', 'nieves', 'paletas', 'churros',
            'hot dogs', 'dorilocos', 'tostilocos', 'mangoneadas', 'chamoyadas',
            // Comida rápida callejera  
            'quesadillas', 'sopes', 'huaraches', 'gorditas', 'flautas', 'tostadas',
            'tamales', 'atole', 'champurrado', 'pozole', 'menudo',
            // Bebidas callejeras
            'aguas frescas', 'horchata', 'jamaica', 'tamarindo', 'limonada',
            'tepache', 'tejuino', 'cafe de olla', 'chocolate caliente',
            // Frutas y dulces
            'frutas con chile', 'jicamas', 'pepinos', 'sandia', 'mango', 'piña',
            'algodones', 'obleas', 'palanquetas', 'cocadas', 'glorias'
        ];
        this.init();
    }

    init() {
        this.loadVendors();
        this.addSampleData();
        this.renderVendors();
        this.setupEventListeners();
        console.log('BurritosCerca initialized with', this.vendors.length, 'vendors');
    }

    // Event Listeners
    setupEventListeners() {
        // Search functionality
        const searchInput = document.getElementById('searchInput');
        const searchBtn = document.querySelector('.search-btn');

        searchBtn.addEventListener('click', () => this.searchFood());
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.searchFood();
        });

        // Vendor form submission
        const vendorForm = document.getElementById('vendorForm');
        vendorForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.addVendor();
        });

        // Close modal on outside click
        const modal = document.getElementById('vendorModal');
        modal.addEventListener('click', (e) => {
            if (e.target === modal) this.closeVendorModal();
        });
    }

    // Search functionality
    searchFood() {
        const query = document.getElementById('searchInput').value.toLowerCase().trim();

        if (!query) {
            this.filteredVendors = [...this.vendors];
        } else {
            this.filteredVendors = this.vendors.filter(vendor => {
                const searchText = `${vendor.name} ${vendor.description} ${vendor.specialties.join(' ')} ${vendor.menuItems.map(item => item.name).join(' ')}`.toLowerCase();
                return searchText.includes(query);
            });
        }

        this.renderVendors();
        this.updateVendorCount();
    }

    // Quick search from popular tags
    quickSearch(keyword) {
        document.getElementById('searchInput').value = keyword;
        this.searchFood();
    }

    // Check if query matches food keywords (removed - was causing false matches)

    // Vendor Management
    async addVendor() {
        // Check if user is verified first
        const email = prompt('Ingresa el email que usaste en Payhip para comprar:');
        if (!email) return;

        const isVerified = await this.checkVerification(email);
        if (!isVerified) {
            alert('No encontramos tu compra. Asegúrate de usar el mismo email de Payhip.\n\nSi acabas de comprar, espera 2-3 minutos para la verificación automática.');
            return;
        }

        const formData = this.getFormData();

        if (!this.validateVendorData(formData)) {
            alert('Por favor completa todos los campos requeridos');
            return;
        }

        // Add customer email to vendor data
        formData.customerEmail = email.toLowerCase().trim();

        const vendor = {
            id: Date.now().toString(),
            ...formData,
            rating: (Math.random() * 2 + 3).toFixed(1), // Random rating 3.0-5.0
            createdAt: new Date().toISOString()
        };

        // Save to Supabase instead of localStorage
        const success = await this.saveVendorToSupabase(vendor);
        
        if (success) {
            this.vendors.unshift(vendor);
            this.renderVendors();
            this.closeVendorModal();
            this.resetForm();
            this.showNotification('¡Tu puesto callejero está activo! 🚚🌮');
        } else {
            alert('Error al guardar tu puesto. Intenta de nuevo.');
        }
    }

    async checkVerification(email) {
        try {
            const response = await fetch('https://burritoscerca.com/.netlify/functions/check-verification', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.supabaseAnonKey}`
                },
                body: JSON.stringify({ email })
            });

            const result = await response.json();
            return result.verified;
        } catch (error) {
            console.error('Verification check failed:', error);
            return false;
        }
    }

    async saveVendorToSupabase(vendor) {
        try {
            const response = await fetch(`${this.supabaseUrl}/rest/v1/vendors`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.supabaseAnonKey}`,
                    'apikey': this.supabaseAnonKey
                },
                body: JSON.stringify({
                    customer_email: vendor.customerEmail,
                    name: vendor.name,
                    location: vendor.location,
                    description: vendor.description,
                    menu_items: vendor.menuItems,
                    specialties: vendor.specialties,
                    rating: parseFloat(vendor.rating)
                })
            });

            return response.ok;
        } catch (error) {
            console.error('Failed to save vendor:', error);
            return false;
        }
    }

    getFormData() {
        const menuItems = [];
        const menuElements = document.querySelectorAll('.menu-item');

        menuElements.forEach(item => {
            const name = item.querySelector('.item-name').value.trim();
            const price = parseFloat(item.querySelector('.item-price').value);
            const imagePreview = item.querySelector('.image-preview img');
            const image = imagePreview ? imagePreview.src : null;

            if (name && price) {
                menuItems.push({
                    name,
                    price: price.toFixed(2),
                    image: image
                });
            }
        });

        // Extract specialties from menu items
        const specialties = this.extractSpecialties(menuItems);

        return {
            name: document.getElementById('vendorName').value.trim(),
            location: document.getElementById('vendorLocation').value.trim(),
            description: document.getElementById('vendorDescription').value.trim(),
            menuItems,
            specialties
        };
    }

    extractSpecialties(menuItems) {
        const specialties = new Set();

        menuItems.forEach(item => {
            const itemName = item.name.toLowerCase();
            this.foodKeywords.forEach(keyword => {
                if (itemName.includes(keyword)) {
                    specialties.add(keyword);
                }
            });
        });

        return Array.from(specialties).slice(0, 4); // Limit to 4 specialties
    }

    validateVendorData(data) {
        return data.name && data.location && data.menuItems.length > 0;
    }

    // Render vendors
    renderVendors() {
        const grid = document.getElementById('vendorsGrid');
        const vendorsToShow = this.filteredVendors.length > 0 ? this.filteredVendors : this.vendors;

        if (vendorsToShow.length === 0) {
            grid.innerHTML = `
                <div class="no-vendors">
                    <h3>🔍 No se encontraron vendedores</h3>
                    <p>Intenta con otra búsqueda o agrega tu puesto</p>
                </div>
            `;
            return;
        }

        grid.innerHTML = vendorsToShow.map(vendor => this.createVendorCard(vendor)).join('');
        this.updateVendorCount();
    }

    createVendorCard(vendor) {
        const specialtyTags = vendor.specialties.map(specialty =>
            `<span class="specialty-tag">${specialty}</span>`
        ).join('');

        const priceRange = this.calculatePriceRange(vendor.menuItems);

        return `
            <div class="vendor-card" data-id="${vendor.id}">
                <div class="vendor-header">
                    <div class="vendor-name">${vendor.name}</div>
                    <div class="vendor-rating">
                        <span>⭐</span>
                        <span>${vendor.rating}</span>
                    </div>
                    <div class="vendor-location">📍 ${vendor.location}</div>
                </div>
                <div class="vendor-body">
                    <div class="vendor-description">${vendor.description}</div>
                    <div class="vendor-specialties">${specialtyTags}</div>
                    <div class="vendor-price">💰 $${priceRange}</div>
                    <div class="vendor-actions">
                        <button class="btn-menu" onclick="app.showVendorMenu('${vendor.id}')">
                            Ver Menú (${vendor.menuItems.length} platillos)
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    calculatePriceRange(menuItems) {
        if (menuItems.length === 0) return 'Consultar precios';

        const prices = menuItems.map(item => parseFloat(item.price));
        const min = Math.min(...prices);
        const max = Math.max(...prices);

        if (min === max) return `${min}`;
        return `${min} - ${max}`;
    }

    showVendorMenu(vendorId) {
        const vendor = this.vendors.find(v => v.id === vendorId);
        if (!vendor) return;

        const menuHtml = vendor.menuItems.map(item =>
            `<div class="menu-item-display">
                ${item.image ? `<div class="menu-item-image"><img src="${item.image}" alt="${item.name}"></div>` : ''}
                <div class="menu-item-info">
                    <span class="item-name">${item.name}</span>
                    <span class="item-price">$${item.price}</span>
                </div>
            </div>`
        ).join('');

        const menuModal = `
            <div class="modal active" id="menuModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>🍽️ Menú de ${vendor.name}</h3>
                        <button class="close-btn" onclick="app.closeMenuModal()">&times;</button>
                    </div>
                    <div class="menu-display">
                        ${menuHtml}
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', menuModal);
    }

    closeMenuModal() {
        const menuModal = document.getElementById('menuModal');
        if (menuModal) menuModal.remove();
    }

    updateVendorCount() {
        const count = this.filteredVendors.length > 0 ? this.filteredVendors.length : this.vendors.length;
        document.getElementById('vendorCount').textContent = `${count} vendedores encontrados`;
    }

    // Modal controls
    openVendorModal() {
        document.getElementById('vendorModal').classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    closeVendorModal() {
        document.getElementById('vendorModal').classList.remove('active');
        document.body.style.overflow = 'auto';
    }

    // Menu item management
    addMenuItem() {
        const menuContainer = document.getElementById('menuItems');
        const newItem = document.createElement('div');
        newItem.className = 'menu-item';
        newItem.innerHTML = `
            <div class="form-row">
                <input type="text" placeholder="Nombre del platillo" class="item-name" required>
                <input type="number" placeholder="Precio" class="item-price" step="0.01" required>
                <button type="button" class="remove-item-btn" onclick="this.parentElement.parentElement.remove()">🗑️</button>
            </div>
            <div class="form-row">
                <div class="image-upload-container">
                    <label class="image-upload-label">
                        📷 Subir foto del platillo
                        <input type="file" accept="image/*" class="item-image" onchange="previewImage(this)">
                    </label>
                    <div class="image-preview">
                        <span class="preview-placeholder">Vista previa</span>
                    </div>
                </div>
            </div>
        `;
        menuContainer.appendChild(newItem);
    }

    resetForm() {
        document.getElementById('vendorForm').reset();
        // Keep only one menu item
        const menuContainer = document.getElementById('menuItems');
        const menuItems = menuContainer.querySelectorAll('.menu-item');
        for (let i = 1; i < menuItems.length; i++) {
            menuItems[i].remove();
        }
    }

    // Data persistence
    saveVendors() {
        localStorage.setItem(this.storageKey, JSON.stringify(this.vendors));
    }

    loadVendors() {
        const saved = localStorage.getItem(this.storageKey);
        this.vendors = saved ? JSON.parse(saved) : [];
        this.filteredVendors = [...this.vendors];
    }

    // Sample data for demo
    addSampleData() {
        if (this.vendors.length === 0) {
            const sampleVendors = [
                {
                    id: '1',
                    name: 'Tacos Doña Chela',
                    location: 'Esquina 5ta y Revolución, junto al semáforo',
                    description: 'Lunes a Sábado 7pm-12am. Tacos de suadero y pastor en comal de carbón. 25 años en el mismo lugar.',
                    menuItems: [
                        { name: 'Taco de Suadero', price: '1.50' },
                        { name: 'Taco de Pastor', price: '1.50' },
                        { name: 'Quesadilla de Pastor', price: '3.00' },
                        { name: 'Refresco', price: '1.00' }
                    ],
                    specialties: ['tacos', 'suadero', 'al pastor'],
                    rating: '4.9',
                    createdAt: new Date().toISOString()
                },
                {
                    id: '2',
                    name: 'Elotes El Chavo',
                    location: 'Parque Morelos, entrada principal',
                    description: 'Todos los días 6pm-11pm. Elotes, esquites y raspados. Carrito amarillo con sombrilla.',
                    menuItems: [
                        { name: 'Elote Preparado', price: '2.50' },
                        { name: 'Esquites en Vaso', price: '2.00' },
                        { name: 'Raspado Chico', price: '1.50' },
                        { name: 'Raspado Grande', price: '2.50' }
                    ],
                    specialties: ['elotes', 'esquites', 'raspados'],
                    rating: '4.7',
                    createdAt: new Date().toISOString()
                },
                {
                    id: '3',
                    name: 'Hot Dogs Sonorenses Kike',
                    location: 'Afuera del Cine, Blvd. Díaz Ordaz',
                    description: 'Viernes a Domingo 8pm-2am. Hot dogs estilo Sonora con tocino y frijoles. Carrito rojo.',
                    menuItems: [
                        { name: 'Hot Dog Sencillo', price: '3.50' },
                        { name: 'Hot Dog Especial', price: '4.50' },
                        { name: 'Refresco', price: '1.00' },
                        { name: 'Agua', price: '0.50' }
                    ],
                    specialties: ['hot dogs', 'tocino', 'frijoles'],
                    rating: '4.5',
                    createdAt: new Date().toISOString()
                },
                {
                    id: '4',
                    name: 'Frutas con Chile La Güerita',
                    location: 'Plaza de Armas, lado norte',
                    description: 'Martes a Domingo 4pm-9pm. Frutas frescas con chile, limón y sal. Jicamas, pepinos, mangos.',
                    menuItems: [
                        { name: 'Jicama con Chile', price: '2.00' },
                        { name: 'Mango en Vaso', price: '2.50' },
                        { name: 'Pepino Loco', price: '1.50' },
                        { name: 'Agua Fresca', price: '1.50' }
                    ],
                    specialties: ['frutas con chile', 'jicamas', 'mango', 'pepinos'],
                    rating: '4.6',
                    createdAt: new Date().toISOString()
                },
                {
                    id: '5',
                    name: 'Quesadillas Doña Rosa',
                    location: 'Mercado Municipal, pasillo central',
                    description: 'Lunes a Sábado 10am-6pm. Quesadillas de comal con queso oaxaca. Salsas caseras.',
                    menuItems: [
                        { name: 'Quesadilla de Queso', price: '2.00' },
                        { name: 'Quesadilla de Flor de Calabaza', price: '2.50' },
                        { name: 'Quesadilla de Chorizo', price: '3.00' },
                        { name: 'Agua de Jamaica', price: '1.00' }
                    ],
                    specialties: ['quesadillas', 'queso', 'chorizo'],
                    rating: '4.8',
                    createdAt: new Date().toISOString()
                }
            ];

            this.vendors = sampleVendors;
            this.filteredVendors = [...this.vendors];
            this.saveVendors();
        }
    }

    // Utility functions
    showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(45deg, #06d6a0, #118ab2);
            color: white;
            padding: 15px 25px;
            border-radius: 10px;
            font-weight: 600;
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// Global functions for HTML onclick events
function openVendorModal() {
    app.openVendorModal();
}

function closeVendorModal() {
    app.closeVendorModal();
}

function addMenuItem() {
    app.addMenuItem();
}

function quickSearch(keyword) {
    app.quickSearch(keyword);
}

function searchFood() {
    app.searchFood();
}

function previewImage(input) {
    const preview = input.parentElement.querySelector('.image-preview');
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function (e) {
            preview.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
        };
        reader.readAsDataURL(input.files[0]);
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new BurritosCerca();
});

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    
    .no-vendors {
        grid-column: 1 / -1;
        text-align: center;
        padding: 60px 20px;
        background: rgba(255, 255, 255, 0.9);
        border-radius: 20px;
        backdrop-filter: blur(10px);
    }
    
    .no-vendors h3 {
        font-size: 1.5rem;
        margin-bottom: 10px;
        color: #666;
    }
    
    .menu-display {
        padding: 30px;
        max-height: 400px;
        overflow-y: auto;
    }
    
    .menu-item-display {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 15px 0;
        border-bottom: 1px solid #eee;
    }
    
    .menu-item-display:last-child {
        border-bottom: none;
    }
    
    .menu-item-display .item-name {
        font-weight: 600;
        color: #333;
    }
    
    .menu-item-display .item-price {
        font-weight: 700;
        color: #ff6b35;
        font-size: 1.1rem;
    }
    
    .remove-item-btn {
        background: #dc3545;
        color: white;
        border: none;
        padding: 8px 12px;
        border-radius: 8px;
        cursor: pointer;
        font-size: 0.9rem;
    }
    
    .remove-item-btn:hover {
        background: #c82333;
    }
    
    /* Image Upload Styles */
    .image-upload-container {
        display: flex;
        gap: 15px;
        align-items: center;
        width: 100%;
    }
    
    .image-upload-label {
        background: linear-gradient(45deg, #06d6a0, #118ab2);
        color: white;
        padding: 12px 20px;
        border-radius: 12px;
        cursor: pointer;
        font-weight: 600;
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        gap: 8px;
        flex: 1;
    }
    
    .image-upload-label:hover {
        transform: translateY(-2px);
        box-shadow: 0 5px 15px rgba(6, 214, 160, 0.3);
    }
    
    .image-upload-label input {
        display: none;
    }
    
    .image-preview {
        width: 100px;
        height: 100px;
        border: 2px dashed #ddd;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #f8f9fa;
        overflow: hidden;
        position: relative;
    }
    
    .image-preview img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        border-radius: 10px;
    }
    
    .preview-placeholder {
        color: #999;
        font-size: 0.8rem;
        text-align: center;
    }
    
    /* Menu Display with Images */
    .menu-item-display {
        display: flex;
        gap: 15px;
        align-items: center;
        padding: 15px 0;
        border-bottom: 1px solid #eee;
    }
    
    .menu-item-image {
        width: 80px;
        height: 80px;
        border-radius: 12px;
        overflow: hidden;
        flex-shrink: 0;
    }
    
    .menu-item-image img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }
    
    .menu-item-info {
        flex: 1;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
`;
document.head.appendChild(style);
