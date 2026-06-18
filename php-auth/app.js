document.querySelectorAll('.toggle-password').forEach(button => {
    button.addEventListener('click', () => {
        const target = document.querySelector(button.dataset.target);
        if (!target) return;
        if (target.type === 'password') {
            target.type = 'text';
            button.textContent = 'Ocultar';
        } else {
            target.type = 'password';
            button.textContent = 'Mostrar';
        }
    });
});

const passwordInputs = document.querySelectorAll('input[type="password"]');
const strengthBar = document.createElement('div');
strengthBar.className = 'password-strength';
passwordInputs.forEach(input => {
    const wrapper = input.parentElement;
    if (wrapper) {
        wrapper.appendChild(strengthBar.cloneNode());
    }
});

function calculateStrength(value) {
    let score = 0;
    if (value.length >= 8) score += 1;
    if (/[A-Z]/.test(value)) score += 1;
    if (/[a-z]/.test(value)) score += 1;
    if (/[0-9]/.test(value)) score += 1;
    if (/[^A-Za-z0-9]/.test(value)) score += 1;
    return score;
}

document.querySelectorAll('input[type="password"]').forEach(input => {
    input.addEventListener('input', () => {
        const strength = calculateStrength(input.value);
        const bar = input.parentElement.querySelector('.password-strength');
        if (!bar) return;
        bar.style.height = '6px';
        bar.style.borderRadius = '8px';
        bar.style.marginTop = '6px';
        bar.style.background = '#e5e7eb';
        bar.innerHTML = '';

        const fill = document.createElement('span');
        fill.style.display = 'block';
        fill.style.height = '100%';
        fill.style.width = `${(strength / 5) * 100}%`;
        fill.style.borderRadius = '8px';
        fill.style.background = strength <= 2 ? '#ef4444' : strength <= 4 ? '#f59e0b' : '#22c55e';
        bar.appendChild(fill);
    });
});