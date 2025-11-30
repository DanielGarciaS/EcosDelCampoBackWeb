// ===== DASHBOARD PREMIUM =====
import AuthAPI from '../api/auth.js';
import ProductsAPI from '../api/products.js';
import OrdersAPI from '../api/orders.js';

// ===== PROTEGER PÁGINA =====
if (!AuthAPI.isAuthenticated()) {
  window.location.href = '/pages/login.html';
}

const user = AuthAPI.getCurrentUser();
const userRole = user.role;
let currentTab = 'marketplace';
let currentImageBase64 = null;

// ===== CART STATE =====
let cart = JSON.parse(localStorage.getItem('cart')) || [];

// ===== ELEMENTOS DEL DOM =====
const dom = {
  userName: document.getElementById('userName'),
  userRole: document.getElementById('userRole'),
  userAvatar: document.getElementById('userAvatar'),
  logoutBtn: document.getElementById('logoutBtn'),
  mobileLogout: document.getElementById('mobileLogout'),

  pageTitle: document.getElementById('pageTitle'),
  pageSubtitle: document.getElementById('pageSubtitle'),
  content: document.getElementById('dashboardContent'),

  // Cart Badges
  navCartBadge: document.getElementById('navCartBadge'),
  mobileCartBadge: document.getElementById('mobileCartBadge'),

  mobileNav: document.getElementById('mobileNav')
};

// ===== INICIALIZAR =====
function init() {
  dom.userName.textContent = user.name;
  dom.userRole.textContent = userRole === 'farmer' ? 'Agricultor' : 'Comprador';
  dom.userAvatar.textContent = user.name.charAt(0).toUpperCase();

  if (userRole === 'farmer') {
    // Hide buyer tabs
    document.getElementById('tabMarketplace').style.display = 'none';
    document.getElementById('tabCart').style.display = 'none';
    document.getElementById('tabOrders').style.display = 'none';

    // Show farmer tabs
    document.getElementById('tabProducts').style.display = 'flex';
    document.getElementById('tabPublish').style.display = 'flex';
    document.getElementById('tabIncoming').style.display = 'flex';

    const mobileLinks = dom.mobileNav.querySelectorAll('.mobile-nav-item');
    // Slot 1: Products
    mobileLinks[0].innerHTML = '<span class="mobile-nav-icon">🥕</span><span>Productos</span>';
    mobileLinks[0].dataset.tab = 'products';
    // Slot 2: Incoming Orders (replace Cart slot)
    mobileLinks[1].innerHTML = '<span class="mobile-nav-icon">📥</span><span>Pedidos</span>';
    mobileLinks[1].dataset.tab = 'incoming';

    // Check if we need to append a Publish tab to mobile nav
    if (!dom.mobileNav.querySelector('[data-tab="publish"]')) {
      const publishLink = document.createElement('a');
      publishLink.href = '#';
      publishLink.className = 'mobile-nav-item';
      publishLink.dataset.tab = 'publish';
      publishLink.innerHTML = '<span class="mobile-nav-icon">➕</span><span>Publicar</span>';
      // Insert before Logout
      dom.mobileNav.insertBefore(publishLink, dom.mobileLogout);
    }

    switchTab('products');

    // Toggle Stats Widgets
    const farmerWidget = document.getElementById('farmerStatsWidget');
    const buyerWidget = document.getElementById('buyerStatsWidget');
    if (farmerWidget) farmerWidget.style.display = 'block';
    if (buyerWidget) buyerWidget.style.display = 'none';

    updateFarmerStats();
  } else {
    switchTab('marketplace');
    updateCartBadges(); // Init cart for buyer
  }

  updateSidebarStats();
  setupEventListeners();
}

async function updateSidebarStats() {
  if (userRole === 'farmer') return;

  const result = await OrdersAPI.getMy();
  if (result.success) {
    const orders = result.data;
    const activeCount = orders.filter(o => o.status === 'pending' || o.status === 'accepted').length;
    document.getElementById('sidebarActiveOrders').textContent = activeCount;

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const monthSpent = orders.reduce((total, order) => {
      const orderDate = new Date(order.createdAt);
      if (order.status !== 'cancelled' &&
        orderDate.getMonth() === currentMonth &&
        orderDate.getFullYear() === currentYear) {
        return total + (order.price * order.quantity);
      }
      return total;
    }, 0);

    document.getElementById('sidebarMonthSpent').textContent = `$${monthSpent.toFixed(2)}`;
  }
}

async function updateFarmerStats() {
  if (userRole !== 'farmer') return;

  try {
    const [ordersResult, productsResult] = await Promise.all([
      OrdersAPI.getIncoming(),
      ProductsAPI.getMyProducts()
    ]);

    if (ordersResult.success) {
      const orders = ordersResult.data;

      // Total Sales (Delivered orders)
      const totalSales = orders
        .filter(o => o.status === 'delivered')
        .reduce((sum, o) => sum + (o.price * o.quantity), 0);

      // Active Orders (Not delivered, not cancelled)
      const activeOrders = orders
        .filter(o => ['pending', 'accepted', 'prepared', 'on_way'].includes(o.status))
        .length;

      // Unique Clients
      const uniqueClients = new Set(orders.map(o => o.buyer._id)).size;

      // Update DOM
      const elSales = document.getElementById('statTotalSales');
      const elActive = document.getElementById('statActiveOrders');
      const elClients = document.getElementById('statTotalClients');

      if (elSales) elSales.textContent = `$${totalSales.toFixed(2)}`;
      if (elActive) elActive.textContent = activeOrders;
      if (elClients) elClients.textContent = uniqueClients;
    }

    if (productsResult.success) {
      const elProducts = document.getElementById('statTotalProducts');
      if (elProducts) elProducts.textContent = productsResult.data.length;
    }

  } catch (error) {
    console.error('Error updating farmer stats:', error);
  }
}

function setupEventListeners() {
  const handleLogout = () => {
    if (confirm('¿Seguro que quieres cerrar sesión?')) AuthAPI.logout();
  };
  dom.logoutBtn.addEventListener('click', handleLogout);
  dom.mobileLogout.addEventListener('click', handleLogout);

  // Delegate tab clicks
  document.addEventListener('click', (e) => {
    const tabBtn = e.target.closest('[data-tab]');
    if (tabBtn) {
      e.preventDefault();
      const tab = tabBtn.dataset.tab;
      switchTab(tab);
    }
  });
}

// ===== NAVEGACIÓN =====
window.switchTab = function (tab) {
  currentTab = tab;

  // Update Active State (Horizontal Tabs)
  document.querySelectorAll('.nav-tab').forEach(el => el.classList.remove('active'));
  const activeTab = document.getElementById(`tab${tab.charAt(0).toUpperCase() + tab.slice(1)}`);
  if (activeTab) activeTab.classList.add('active');

  // Update Active State (Mobile)
  document.querySelectorAll('.mobile-nav-item').forEach(el => el.classList.remove('active'));
  const activeMobile = document.querySelector(`.mobile-nav-item[data-tab="${tab}"]`);
  if (activeMobile) activeMobile.classList.add('active');

  dom.content.innerHTML = '<div class="loading-spinner">Cargando...</div>';

  switch (tab) {
    case 'marketplace':
      dom.pageTitle.textContent = 'Mercado';
      dom.pageSubtitle.textContent = 'Explora los mejores productos locales';
      loadMarketplace();
      break;
    case 'cart':
      dom.pageTitle.textContent = 'Tu Carrito';
      dom.pageSubtitle.textContent = 'Revisa tus productos antes de comprar';
      loadCartPage();
      break;
    case 'orders':
      dom.pageTitle.textContent = 'Mis Pedidos';
      dom.pageSubtitle.textContent = 'Historial de tus compras';
      loadMyOrders();
      break;
    case 'products':
      dom.pageTitle.textContent = 'Mis Productos';
      dom.pageSubtitle.textContent = 'Gestiona tu inventario';
      loadMyProducts();
      break;
    case 'publish':
      dom.pageTitle.textContent = 'Publicar Producto';
      dom.pageSubtitle.textContent = 'Añade un nuevo producto a tu catálogo';
      loadPublishTab();
      break;
    case 'incoming':
      dom.pageTitle.textContent = 'Pedidos Entrantes';
      dom.pageSubtitle.textContent = 'Solicitudes de compra';
      loadIncomingOrders();
      break;
  }
}

// ===== CARGADORES DE CONTENIDO =====
async function loadMarketplace() {
  const result = await ProductsAPI.getCatalog();
  if (result.success && result.data.length > 0) {
    dom.content.innerHTML = `
      <div class="products-grid">
        ${result.data.map(product => renderProductCard(product)).join('')}
      </div>
    `;
  } else {
    renderEmptyState('No hay productos disponibles en este momento.');
  }
}

function loadCartPage() {
  if (cart.length === 0) {
    renderEmptyState('Tu carrito está vacío. ¡Ve al Mercado y agrega productos!');
    return;
  }

  let total = 0;
  const cartItemsHtml = cart.map(item => {
    const itemTotal = item.price * item.quantity;
    total += itemTotal;

    const imageHtml = item.image
      ? `<img src="${item.image}" class="cart-item-image">`
      : `<div class="cart-item-image" style="background:#f3f4f6; display:flex; align-items:center; justify-content:center;">🌱</div>`;

    return `
            <div class="cart-item">
                ${imageHtml}
                <div class="cart-item-details">
                    <div class="cart-item-title">${item.name}</div>
                    <div class="cart-item-price">$${item.price} / ${item.unit}</div>
                    <div class="cart-item-controls">
                        <button class="qty-btn" onclick="updateQuantity('${item._id}', -1)">-</button>
                        <span>${item.quantity}</span>
                        <button class="qty-btn" onclick="updateQuantity('${item._id}', 1)">+</button>
                        <button class="cart-item-remove" onclick="removeFromCart('${item._id}')">🗑️</button>
                    </div>
                </div>
                <div style="font-weight: 600; color: var(--primary-dark); margin-left: 1rem;">
                    $${itemTotal.toFixed(2)}
                </div>
            </div>
        `;
  }).join('');

  dom.content.innerHTML = `
        <div class="cart-page-container" style="max-width: 800px; margin: 0 auto;">
            <div class="cart-items-list">
                ${cartItemsHtml}
            </div>
            <div class="cart-summary" style="margin-top: 2rem; padding: 1.5rem; background: white; border-radius: 12px; border: 1px solid rgba(0,0,0,0.05);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; font-size: 1.5rem; font-weight: 700; color: var(--primary-dark);">
                    <span>Total:</span>
                    <span id="cartPageTotal">$${total.toFixed(2)}</span>
                </div>
                <button class="btn btn-primary btn-block" onclick="checkout()" id="checkoutBtn" style="width: 100%; justify-content: center; padding: 1rem; font-size: 1.1rem;">
                    Proceder al Pago
                </button>
            </div>
        </div>
    `;
}

async function loadMyOrders() {
  const result = await OrdersAPI.getMy();
  if (result.success && result.data.length > 0) {
    dom.content.innerHTML = `
      <div class="orders-list">
        ${result.data.map(order => renderOrderCard(order)).join('')}
      </div>
    `;
  } else {
    renderEmptyState('Aún no has realizado ninguna compra.');
  }
}

async function loadMyProducts() {
  const result = await ProductsAPI.getMyProducts();
  if (result.success && result.data.length > 0) {
    dom.content.innerHTML = `
        <div class="products-grid">
            ${result.data.map(product => renderProductCard(product, true)).join('')}
        </div>
      `;
  } else {
    renderEmptyState('No tienes productos publicados. Ve a la pestaña "Publicar" para comenzar.');
  }
}

async function loadIncomingOrders() {
  const result = await OrdersAPI.getIncoming();
  if (result.success && result.data.length > 0) {
    dom.content.innerHTML = `
            <div class="orders-list">
                ${result.data.map(order => renderIncomingOrderCard(order)).join('')}
            </div>
        `;
  } else {
    renderEmptyState('No tienes pedidos pendientes.');
  }
}

function loadPublishTab() {
  dom.content.innerHTML = `
        <div class="publish-card">
            <form id="publishForm">
                <div class="form-group">
                    <label class="form-label">Nombre del Producto</label>
                    <input type="text" id="publishName" class="form-input" placeholder="Ej. Tomates Orgánicos" required>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">Precio ($)</label>
                        <input type="number" id="publishPrice" class="form-input" placeholder="0.00" step="0.01" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Unidad</label>
                        <select id="publishUnit" class="form-input" required>
                            <option value="kg">Kilogramo (kg)</option>
                            <option value="gr">Gramo (gr)</option>
                            <option value="pz">Pieza (pz)</option>
                            <option value="manojo">Manojo</option>
                            <option value="litro">Litro</option>
                        </select>
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label">Descripción</label>
                    <textarea id="publishDescription" class="form-input" rows="5" placeholder="Incluye detalles como origen, fecha de cosecha, notas de sabor, certificación orgánica..." required></textarea>
                </div>
                <div class="form-group">
                    <label class="form-label">Imagen del Producto</label>
                    <div class="image-upload-zone" id="imageUploadZone">
                        <input type="file" id="publishImage" accept="image/*" hidden>
                        <div id="imagePreview" class="image-preview hidden"></div>
                        <div id="uploadPlaceholder" class="upload-placeholder">
                            <span style="font-size: 2rem;">📸</span>
                            <p>Haz clic o arrastra una imagen aquí</p>
                        </div>
                    </div>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="switchTab('products')">Cancelar</button>
                    <button type="submit" class="btn btn-primary">Publicar Producto</button>
                </div>
            </form>
        </div>
    `;

  // Attach listeners immediately after rendering
  const form = document.getElementById('publishForm');
  const zone = document.getElementById('imageUploadZone');
  const input = document.getElementById('publishImage');
  const preview = document.getElementById('imagePreview');
  const placeholder = document.getElementById('uploadPlaceholder');

  // Reset state
  currentImageBase64 = null;

  if (zone && input) {
    zone.addEventListener('click', () => input.click());
    zone.addEventListener('dragover', (e) => {
      e.preventDefault();
      zone.style.borderColor = 'var(--primary-color)';
      zone.style.background = '#f0fdf4';
    });
    zone.addEventListener('dragleave', (e) => {
      e.preventDefault();
      zone.style.borderColor = 'rgba(0,0,0,0.1)';
      zone.style.background = '#f9fafb';
    });
    zone.addEventListener('drop', (e) => {
      e.preventDefault();
      zone.style.borderColor = 'rgba(0,0,0,0.1)';
      zone.style.background = '#f9fafb';
      if (e.dataTransfer.files[0]) handleImageSelect(e.dataTransfer.files[0], preview, placeholder);
    });
    input.addEventListener('change', (e) => {
      if (e.target.files[0]) handleImageSelect(e.target.files[0], preview, placeholder);
    });
  }

  if (form) {
    form.addEventListener('submit', handlePublishSubmit);
  }
}

function handleImageSelect(file, previewElement, placeholderElement) {
  if (!file.type.startsWith('image/')) {
    alert('Por favor selecciona una imagen válida');
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    currentImageBase64 = e.target.result;
    previewElement.style.backgroundImage = `url(${currentImageBase64})`;
    previewElement.classList.remove('hidden');
    placeholderElement.style.opacity = '0';
  };
  reader.readAsDataURL(file);
}

async function handlePublishSubmit(e) {
  e.preventDefault();
  const submitBtn = e.target.querySelector('button[type="submit"]');
  const originalText = submitBtn.textContent;
  submitBtn.textContent = 'Publicando...';
  submitBtn.disabled = true;

  const productData = {
    name: document.getElementById('publishName').value,
    price: parseFloat(document.getElementById('publishPrice').value),
    unit: document.getElementById('publishUnit').value,
    description: document.getElementById('publishDescription').value,
    stock: 100,
    image: currentImageBase64
  };

  try {
    const result = await ProductsAPI.create(productData);

    if (result.success) {
      alert('✅ ¡Producto publicado con éxito!');
      updateFarmerStats();
      switchTab('products'); // Redirect to products list
    } else {
      alert('❌ Error: ' + result.error);
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
    }
  } catch (error) {
    if (!navigator.onLine || error.message === 'Offline') {
      saveOfflineProduct(productData);
      alert('📡 Estás desconectado. Tu producto se ha guardado y se publicará automáticamente cuando recuperes la conexión.');
      switchTab('products');
    } else {
      alert('❌ Error de conexión');
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
    }
  }
}


// ===== RENDERIZADORES =====
function renderProductCard(product, isOwner = false) {
  const imageHtml = product.image
    ? `<img src="${product.image}" alt="${product.name}" class="product-image">`
    : `<div class="product-placeholder">🌱</div>`;

  // Encode product data safely for onclick
  const productJson = JSON.stringify(product).replace(/"/g, '&quot;');

  const actionBtn = isOwner
    ? `<span class="badge badge-success">${product.status}</span>`
    : `<button class="btn btn-primary" style="width: 100%;" onclick="addToCart(${productJson})">
         🛒 Agregar
       </button>`;

  const description = product.description || 'Producto fresco y de calidad.';
  const isLongDescription = description.length > 100;

  const descriptionHtml = `
    <p class="product-description" id="desc-${product._id}">
        ${description}
    </p>
    ${isLongDescription ? `
        <button class="read-more-btn" onclick="toggleDescription('${product._id}')" id="btn-desc-${product._id}">
            Ver más
        </button>
    ` : ''}
  `;

  return `
    <div class="product-card">
      <div class="product-image-container">
        ${imageHtml}
      </div>
      <div class="product-content">
        <div class="product-header">
            <h3 class="product-title">${product.name}</h3>
            <span class="product-price">$${product.price}</span>
        </div>
        <div class="product-unit">
            <span>por ${product.unit}</span>
            ${!isOwner ? `
            <div class="farmer-info">
                <span>👨‍🌾</span> ${product.farmer.name}
            </div>` : ''}
        </div>
        
        ${descriptionHtml}
        
        <div class="product-meta">
            ${actionBtn}
        </div>
      </div>
    </div>
  `;
}

window.toggleDescription = (id) => {
  const desc = document.getElementById(`desc-${id}`);
  const btn = document.getElementById(`btn-desc-${id}`);

  if (desc.classList.contains('expanded')) {
    desc.classList.remove('expanded');
    btn.textContent = 'Ver más';
  } else {
    desc.classList.add('expanded');
    btn.textContent = 'Ver menos';
  }
};

function renderOrderCard(order) {
  const statusColors = {
    pending: 'status-pending',
    accepted: 'status-accepted',
    prepared: 'status-prepared',
    on_way: 'status-on_way',
    delivered: 'status-delivered',
    cancelled: 'status-cancelled'
  };

  const statusLabels = {
    pending: 'Pendiente',
    accepted: 'Aceptado',
    prepared: 'Preparado',
    on_way: 'En camino',
    delivered: 'Entregado',
    cancelled: 'Cancelado'
  };

  const orderDate = order.createdAt ? new Date(order.createdAt).toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }) : '';

  // Safe encode for onclick
  const orderJson = JSON.stringify(order).replace(/"/g, '&quot;');

  return `
    <div class="order-card">
      <div class="order-info">
        <h4>Pedido de ${order.quantity} unidades</h4>
        <div class="order-meta">
            <div style="margin-bottom: 0.5rem;">
                👨‍🌾 Agricultor: ${order.farmer.name}
            </div>
            <div>
                <span style="font-weight: 600; color: var(--primary-color);">Total: $${(order.price * order.quantity).toFixed(2)}</span>
                ${orderDate ? ` • ${orderDate}` : ''}
            </div>
        </div>
      </div>
      <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 0.5rem;">
        <span class="status-badge ${statusColors[order.status] || ''}">
            ${statusLabels[order.status] || order.status}
        </span>
        <button class="btn btn-sm btn-secondary" onclick="showOrderDetails(${orderJson})">
            Ver Detalles
        </button>
        ${order.status === 'pending' ? `
            <button class="btn btn-sm" onclick="cancelOrder('${order._id}')" style="font-size: 0.75rem; padding: 0.25rem 0.5rem; background: #fee2e2; color: #991b1b; border: none;">
                ✕ Cancelar
            </button>
        ` : ''}
      </div>
    </div>
  `;
}

function renderIncomingOrderCard(order) {
  const statusOptions = [
    { value: 'pending', label: 'Pendiente' },
    { value: 'accepted', label: 'Aceptado' },
    { value: 'prepared', label: 'Preparado' },
    { value: 'on_way', label: 'En camino' },
    { value: 'delivered', label: 'Entregado' },
    { value: 'cancelled', label: 'Cancelado' }
  ];

  const optionsHtml = statusOptions.map(opt =>
    `<option value="${opt.value}" ${order.status === opt.value ? 'selected' : ''}>${opt.label}</option>`
  ).join('');

  // Safe encode for onclick
  const orderJson = JSON.stringify(order).replace(/"/g, '&quot;');

  return `
      <div class="order-card">
        <div class="order-info">
          <h4>${order.buyer.name} solicita ${order.quantity} unidades</h4>
          <div class="order-meta">
              Total: $${(order.price * order.quantity).toFixed(2)}
          </div>
        </div>
        <div style="display: flex; flex-direction: column; gap: 0.5rem; align-items: flex-end;">
            <select class="form-input status-badge status-${order.status}" style="padding: 0.25rem; font-size: 0.9rem; width: auto;" onchange="updateOrderStatus('${order._id}', this.value)">
                ${optionsHtml}
            </select>
            <button class="btn btn-sm btn-secondary" onclick="showOrderDetails(${orderJson})">
                Ver Detalles
            </button>
        </div>
      </div>
    `;
}

window.showOrderDetails = (order) => {
  // Create modal if not exists
  let modal = document.getElementById('orderDetailModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'orderDetailModal';
    modal.className = 'modal';
    document.body.appendChild(modal);
  }

  const statusLabels = {
    pending: 'Pendiente',
    accepted: 'Aceptado',
    prepared: 'Preparado',
    on_way: 'En camino',
    delivered: 'Entregado',
    cancelled: 'Cancelado'
  };

  const isFarmer = userRole === 'farmer';
  const otherPartyLabel = isFarmer ? 'Comprador' : 'Agricultor';
  const otherPartyName = isFarmer ? order.buyer.name : order.farmer.name;
  const otherPartyEmail = isFarmer ? order.buyer.email : order.farmer.email;

  modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3 class="modal-title">Detalles del Pedido</h3>
                <button class="close-modal" onclick="document.getElementById('orderDetailModal').classList.remove('active')">×</button>
            </div>
            <div class="modal-body">
                <div class="detail-row">
                    <span class="detail-label">ID Pedido:</span>
                    <span class="detail-value" style="font-size: 0.8rem;">${order._id}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Producto:</span>
                    <span class="detail-value">${order.product.name}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Cantidad:</span>
                    <span class="detail-value">${order.quantity} ${order.product.unit || 'unidades'}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Total:</span>
                    <span class="detail-value">$${(order.price * order.quantity).toFixed(2)}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Estado:</span>
                    <span class="detail-value">${statusLabels[order.status] || order.status}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Fecha:</span>
                    <span class="detail-value">${new Date(order.createdAt).toLocaleString()}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">${otherPartyLabel}:</span>
                    <span class="detail-value">${otherPartyName}</span>
                </div>
                 <div class="detail-row">
                    <span class="detail-label">Email:</span>
                    <span class="detail-value">${otherPartyEmail}</span>
                </div>
            </div>
            <div style="text-align: right;">
                <button class="btn btn-primary" onclick="document.getElementById('orderDetailModal').classList.remove('active')">Cerrar</button>
            </div>
        </div>
    `;

  setTimeout(() => modal.classList.add('active'), 10);
};

window.updateOrderStatus = async (orderId, newStatus) => {
  console.log('🔄 updateOrderStatus called with:', { orderId, newStatus }); // DEBUG
  const result = await OrdersAPI.updateStatus(orderId, newStatus);
  console.log('✅ updateOrderStatus result:', result); // DEBUG
  if (result.success) {
    // Refresh list
    loadIncomingOrders();
    // Also update stats
    // Also update stats
    updateSidebarStats();
    updateFarmerStats();
  } else {
    alert('Error al actualizar estado: ' + result.error);
  }
};

function renderEmptyState(message) {
  dom.content.innerHTML = `
    <div style="text-align: center; padding: 4rem; color: var(--text-secondary);">
      <div style="font-size: 3rem; margin-bottom: 1rem;">🍃</div>
      <p>${message}</p>
    </div>
  `;
}

// ===== SHOPPING CART LOGIC =====

window.addToCart = (product) => {
  const existingItem = cart.find(item => item._id === product._id);

  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({
      ...product,
      quantity: 1
    });
  }

  saveCart();
  updateCartBadges();

  // Show feedback
  const btn = event.target;
  const originalText = btn.innerHTML;
  btn.innerHTML = '✅ Agregado';
  btn.classList.add('btn-success');
  setTimeout(() => {
    btn.innerHTML = originalText;
    btn.classList.remove('btn-success');
  }, 1000);
};

window.removeFromCart = (productId) => {
  cart = cart.filter(item => item._id !== productId);
  saveCart();
  if (currentTab === 'cart') loadCartPage();
  updateCartBadges();
};

window.updateQuantity = (productId, change) => {
  const item = cart.find(item => item._id === productId);
  if (item) {
    item.quantity += change;
    if (item.quantity <= 0) {
      removeFromCart(productId);
    } else {
      saveCart();
      if (currentTab === 'cart') loadCartPage();
      updateCartBadges();
    }
  }
};

function saveCart() {
  localStorage.setItem('cart', JSON.stringify(cart));
}

function updateCartBadges() {
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  if (dom.navCartBadge) {
    dom.navCartBadge.textContent = totalItems;
    dom.navCartBadge.style.display = totalItems > 0 ? 'inline-flex' : 'none';
  }

  if (dom.mobileCartBadge) {
    dom.mobileCartBadge.textContent = totalItems;
    dom.mobileCartBadge.style.display = totalItems > 0 ? 'flex' : 'none';
  }
}

window.checkout = async () => {
  if (cart.length === 0) return;

  const totalText = document.getElementById('cartPageTotal').textContent;
  if (!confirm(`¿Confirmar compra por ${totalText}?`)) return;

  const checkoutBtn = document.getElementById('checkoutBtn');
  checkoutBtn.textContent = 'Procesando...';
  checkoutBtn.disabled = true;

  let successCount = 0;
  let errors = [];

  // Process orders sequentially
  for (const item of cart) {
    const orderData = {
      productId: item._id,
      quantity: item.quantity,
      price: item.price,
      farmerId: item.farmer._id
    };

    try {
      const result = await OrdersAPI.create(orderData);
      if (result.success) {
        successCount++;
      } else {
        errors.push(`${item.name}: ${result.error}`);
      }
    } catch (error) {
      if (!navigator.onLine || error.message === 'Offline') {
        saveOfflineOrder(orderData);
        successCount++; // Treat as success for UI flow
        console.log('🌐 Offline: Order queued');
      } else {
        errors.push(`${item.name}: Error de conexión`);
      }
    }
  }

  if (successCount === cart.length) {
    if (!navigator.onLine) {
      alert('📡 Estás desconectado. Tu pedido se ha guardado y se enviará automáticamente cuando recuperes la conexión.');
    } else {
      alert('✅ ¡Compra realizada con éxito!');
    }
    cart = [];
    saveCart();
    updateCartBadges();
    switchTab('orders');
  } else {
    alert(`⚠️ Se procesaron ${successCount} de ${cart.length} productos.\nErrores: \n${errors.join('\n')} `);
    // Remove successful items from cart
    // (Optional: implement logic to keep failed items)
    updateCartBadges();
    loadCartPage();
  }
};

// ===== OFFLINE SYNC LOGIC =====
// ===== OFFLINE SYNC LOGIC =====
function saveOfflineOrder(orderData) {
  const offlineOrders = JSON.parse(localStorage.getItem('offline_orders')) || [];
  offlineOrders.push({
    data: orderData,
    timestamp: Date.now()
  });
  localStorage.setItem('offline_orders', JSON.stringify(offlineOrders));
  console.log('📦 Order saved offline:', orderData);
}

function saveOfflineProduct(productData) {
  const offlineProducts = JSON.parse(localStorage.getItem('offline_products')) || [];
  offlineProducts.push({
    data: productData,
    timestamp: Date.now()
  });
  localStorage.setItem('offline_products', JSON.stringify(offlineProducts));
  console.log('📦 Product saved offline:', productData);
}

async function syncOfflineOrders() {
  if (!navigator.onLine) return;

  const offlineOrders = JSON.parse(localStorage.getItem('offline_orders')) || [];
  if (offlineOrders.length === 0) return;

  console.log(`🔄 Syncing ${offlineOrders.length} offline orders...`);

  const remainingOrders = [];
  let syncedCount = 0;

  for (const item of offlineOrders) {
    try {
      const result = await OrdersAPI.create(item.data);
      if (result.success) {
        syncedCount++;
        console.log('✅ Offline order synced:', item.data.productId);
      } else {
        console.error('❌ Failed to sync order:', result.error);
        remainingOrders.push(item);
      }
    } catch (error) {
      console.error('❌ Network error during sync:', error);
      remainingOrders.push(item);
    }
  }

  localStorage.setItem('offline_orders', JSON.stringify(remainingOrders));

  if (syncedCount > 0) {
    alert(`🌐 Conexión recuperada: Se enviaron ${syncedCount} pedidos pendientes.`);
    if (userRole === 'buyer') loadMyOrders();
    updateSidebarStats();
  }
}

async function syncOfflineProducts() {
  if (!navigator.onLine) return;

  const offlineProducts = JSON.parse(localStorage.getItem('offline_products')) || [];
  if (offlineProducts.length === 0) return;

  console.log(`🔄 Syncing ${offlineProducts.length} offline products...`);

  const remainingProducts = [];
  let syncedCount = 0;

  for (const item of offlineProducts) {
    try {
      const result = await ProductsAPI.create(item.data);
      if (result.success) {
        syncedCount++;
        console.log('✅ Offline product synced:', item.data.name);
      } else {
        console.error('❌ Failed to sync product:', result.error);
        remainingProducts.push(item);
      }
    } catch (error) {
      console.error('❌ Network error during sync:', error);
      remainingProducts.push(item);
    }
  }

  localStorage.setItem('offline_products', JSON.stringify(remainingProducts));

  if (syncedCount > 0) {
    alert(`🌐 Conexión recuperada: Se publicaron ${syncedCount} productos pendientes.`);
    if (userRole === 'farmer') loadMyProducts();
    updateFarmerStats();
  }
}

function syncAllOfflineData() {
  syncOfflineOrders();
  syncOfflineProducts();
}

// Listen for online status
window.addEventListener('online', syncAllOfflineData);

// Start
init();
// Try to sync on load
syncAllOfflineData();
