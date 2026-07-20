const products = {
    'a3-poster': { name: 'A3 Poster', image: 'images/shop/a3-poster.jpg', price: 24.99 },
    'a4-poster': { name: 'A4 Poster', image: 'images/shop/a4-poster.jpg', price: 19.99 },
    'a5-poster': { name: 'A5 Poster', image: 'images/shop/a5-poster.jpg', price: 14.99 },
    'fine-art-print': { name: 'Fine Art Print', image: 'images/shop/fine-art-print.jpg', price: 29.99 },
    't-shirt': { name: 'T-Shirt', image: 'images/shop/t-shirt.jpg', price: 24.99 },
    'hoodie': { name: 'Hoodie', image: 'images/shop/hoodie.jpg', price: 39.99 },
    'mug': { name: 'Mug', image: 'images/shop/mug.jpg', price: 14.99 },
    'phone-case': { name: 'Phone Case', image: 'images/shop/phone-case.jpg', price: 19.99 },
    'fridge-magnet': { name: 'Fridge Magnet', image: 'images/shop/fridge-magnet.jpg', price: 11.99 }
};

const form = document.querySelector('#order-form');
const productSelect = document.querySelector('#product');
const quantityInput = document.querySelector('#quantity');
const shirtSizeField = document.querySelector('#shirt-size-field');
const shirtSizeSelect = document.querySelector('#shirt-size');
const phoneModelField = document.querySelector('#phone-model-field');
const phoneModelInput = document.querySelector('#phone-model');
const emailInput = document.querySelector('#email');
const firstNameInput = document.querySelector('#first-name');
const submitButton = document.querySelector('#shopify-button');
const submitButtonLabel = submitButton.querySelector('.button-label');
const checkoutMessage = document.querySelector('#checkout-message');
const artworkError = document.querySelector('#artwork-error');
const addressInput = document.querySelector('#address');
const notesInput = document.querySelector('#notes');

const summaryProductImage = document.querySelector('#summary-product-image');
const summaryProduct = document.querySelector('#summary-product');
const summaryQuantity = document.querySelector('#summary-quantity');
const summaryArtwork = document.querySelector('#summary-artwork');
const summaryEmail = document.querySelector('#summary-email');
const summaryOptionRow = document.querySelector('#summary-option-row');
const summaryOption = document.querySelector('#summary-option');
const summaryPrice = document.querySelector('#summary-price');

// Leave this as the relative API path when the site is deployed with
// ruben_backend.py. For a separately hosted frontend, set data-email-api-url
// on the <body> to the exact, deployed backend address instead.
const emailApiUrl = document.body.dataset.emailApiUrl || '/api/send-confirmation';

const requestedProduct = new URLSearchParams(window.location.search).get('product');
if (requestedProduct && products[requestedProduct]) {
    productSelect.value = requestedProduct;
}

function updateProduct() {
    const selected = products[productSelect.value];
    summaryProduct.textContent = selected.name;
    summaryProductImage.src = selected.image;
    summaryProductImage.alt = `${selected.name} product preview`;

    const isShirt = ['t-shirt', 'hoodie'].includes(productSelect.value);
    const isPhoneCase = productSelect.value === 'phone-case';

    shirtSizeField.hidden = !isShirt;
    shirtSizeSelect.required = isShirt;
    phoneModelField.hidden = !isPhoneCase;
    phoneModelInput.required = isPhoneCase;

    if (!isShirt) shirtSizeSelect.value = '';
    if (!isPhoneCase) phoneModelInput.value = '';
    updateProductOption();
    updatePrice();
}

function updateProductOption() {
    let detail = '';
    if (['t-shirt', 'hoodie'].includes(productSelect.value) && shirtSizeSelect.value) {
        detail = `Size ${shirtSizeSelect.value}`;
    }
    if (productSelect.value === 'phone-case' && phoneModelInput.value.trim()) {
        detail = phoneModelInput.value.trim();
    }
    summaryOptionRow.hidden = !detail;
    summaryOption.textContent = detail;
}

function updateQuantity() {
    const quantity = Math.max(1, Number(quantityInput.value) || 1);
    summaryQuantity.textContent = `${quantity}×`;
    updatePrice();
}

function updatePrice() {
    const selected = products[productSelect.value];
    const quantity = Math.max(1, Number(quantityInput.value) || 1);
    const total = selected.price * quantity;

    summaryPrice.textContent = new Intl.NumberFormat('nl-NL', {
        style: 'currency',
        currency: 'EUR'
    }).format(total);
}


function showValidationError() {
    const artworkSelected = form.querySelector('input[name="artwork"]:checked');
    if (!artworkSelected) {
        artworkError.textContent = 'Choose one artwork for your product.';
    }

    if (form.checkValidity() && artworkSelected) return false;

    form.reportValidity();
    const firstInvalid = form.querySelector(':invalid');
    if (firstInvalid) {
        firstInvalid.focus({ preventScroll: true });
        firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    checkoutMessage.textContent = 'Please complete the required fields before continuing.';
    return true;
}

productSelect.addEventListener('change', updateProduct);
quantityInput.addEventListener('input', updateQuantity);
shirtSizeSelect.addEventListener('change', updateProductOption);
phoneModelInput.addEventListener('input', updateProductOption);
emailInput.addEventListener('input', () => {
    summaryEmail.textContent = emailInput.value.trim() || 'Not entered yet';
});

document.querySelectorAll('input[name="artwork"]').forEach((input) => {
    input.addEventListener('change', () => {
        summaryArtwork.textContent = input.value;
        artworkError.textContent = '';
    });
});

form.addEventListener('submit', async (event) => {
    event.preventDefault();
    checkoutMessage.textContent = '';

    if (showValidationError()) return;

    const selectedArtwork = form.querySelector('input[name="artwork"]:checked');

    submitButton.disabled = true;
    submitButtonLabel.textContent = 'Sending…';

    try {
        const response = await fetch(emailApiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: emailInput.value.trim(),
                name: firstNameInput.value.trim(),
                address: addressInput.value.trim(),
                product: productSelect.value,
                artwork: selectedArtwork.value,
                phonemodel: phoneModelInput.value.trim(),
                size: shirtSizeSelect.value,
                order_notes: notesInput.value.trim(),
                quantity: quantityInput.value.trim()
            })
        });
        const result = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(result.message || 'The email could not be sent.');
        }

        checkoutMessage.textContent = 'Bedankt! Het bevestigingsbericht is verstuurd.';
        submitButtonlabel.textContent = 'Order Received';
    } catch (error) {
        checkoutMessage.textContent = error.message || 'Er ging iets mis bij het versturen. Probeer het opnieuw.';
        submitButton.disabled = false;
        submitButtonLabel.textContent = 'Buy this artwork';
    }
});

updateProduct();
updateQuantity();
