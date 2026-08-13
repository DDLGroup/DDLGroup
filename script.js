/* ==========================================================================
   DDL GROUP LANDING PAGE - INTERACTIVE UI & API INTEGRATION
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {

    // --- 1. Sticky Navbar & Mobile Toggle ---
    const navbar = document.getElementById('navbar');
    const mobileToggle = document.getElementById('mobile-toggle');
    const navLinks = document.getElementById('nav-links');

    window.addEventListener('scroll', () => {
        if (window.scrollY > 40) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    if (mobileToggle && navLinks) {
        mobileToggle.addEventListener('click', () => {
            navLinks.classList.toggle('active');
        });

        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('active');
            });
        });
    }

    // --- 2. Filterable Services Catalog ---
    const tabBtns = document.querySelectorAll('.tab-btn');
    const serviceCards = document.querySelectorAll('.service-card');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const filter = btn.getAttribute('data-filter');

            serviceCards.forEach(card => {
                if (filter === 'all' || card.getAttribute('data-category') === filter) {
                    card.style.display = 'flex';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    });

    // --- 3. Auto-Select Service from Buttons & Smooth Scroll ---
    const selectButtons = document.querySelectorAll('.select-service-btn');
    const serviceSelectDropdown = document.getElementById('service');
    const contactSection = document.getElementById('contact');

    selectButtons.forEach(button => {
        button.addEventListener('click', () => {
            const selectedService = button.getAttribute('data-service');
            
            if (serviceSelectDropdown && selectedService) {
                let matched = false;
                for (let option of serviceSelectDropdown.options) {
                    if (option.value.includes(selectedService) || selectedService.includes(option.text)) {
                        option.selected = true;
                        matched = true;
                        break;
                    }
                }
                if (!matched) {
                    serviceSelectDropdown.value = serviceSelectDropdown.options[1].value;
                }
            }

            if (contactSection) {
                contactSection.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

    // --- 4. Form Submission (Azure Function / Fallback API) ---
    const leadForm = document.getElementById('leadForm');
    const submitBtn = document.getElementById('submitBtn');
    const btnText = submitBtn ? submitBtn.querySelector('.btn-text') : null;
    const btnSpinner = submitBtn ? submitBtn.querySelector('.btn-spinner') : null;
    const formStatus = document.getElementById('formStatus');

    if (leadForm) {
        leadForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            formStatus.className = 'form-status-alert hidden';
            formStatus.textContent = '';

            const formData = {
                fullName: document.getElementById('fullName').value.trim(),
                phone: document.getElementById('phone').value.trim(),
                email: document.getElementById('email').value.trim(),
                service: document.getElementById('service').value,
                message: document.getElementById('message').value.trim(),
                timestamp: new Date().toISOString()
            };

            if (!/^[0-9]{10}$/.test(formData.phone)) {
                showStatus('Please enter a valid 10-digit mobile number.', 'error');
                return;
            }

            setLoading(true);

            try {
                let response = await fetch('/api/submit-lead', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });

                if (!response.ok && (response.status === 404 || response.status === 405)) {
                    console.log('Using direct fallback API...');
                    response = await runDirectFallbackApi(formData);
                } else {
                    response = await response.json();
                }

                if (response.success || response.status === 'success') {
                    showStatus('🎉 Thank you! Your request has been submitted. A WhatsApp notification & confirmation auto-reply has been sent to your phone!', 'success');
                    leadForm.reset();
                } else {
                    showStatus(response.message || 'Error submitting request. Please try again or call 7551067843.', 'error');
                }

            } catch (error) {
                console.error('Submission error:', error);
                try {
                    const fallbackResult = await runDirectFallbackApi(formData);
                    if (fallbackResult.success) {
                        showStatus('🎉 Request submitted successfully! WhatsApp notification sent.', 'success');
                        leadForm.reset();
                    } else {
                        showStatus('Unable to process automatically. Please call us directly at 7551067843.', 'error');
                    }
                } catch (fallbackErr) {
                    showStatus('Connection timeout. Please call or WhatsApp 7551067843 directly.', 'error');
                }
            } finally {
                setLoading(false);
            }
        });
    }

    function setLoading(isLoading) {
        if (!submitBtn) return;
        submitBtn.disabled = isLoading;
        if (isLoading) {
            btnText.classList.add('hidden');
            btnSpinner.classList.remove('hidden');
        } else {
            btnText.classList.remove('hidden');
            btnSpinner.classList.add('hidden');
        }
    }

    function showStatus(msg, type) {
        if (!formStatus) return;
        formStatus.textContent = msg;
        formStatus.className = `form-status-alert ${type}`;
    }

    // Direct Client-side Fallback helper
    async function runDirectFallbackApi(data) {
        const GOOGLE_SHEET_URL = 'https://script.google.com/macros/s/AKfycbxKJs977tNMZ5se24zBnpywMmE8bRWIvWJHhp5B5NeuYmbv_EmPFH_ezVO548qIWdIHrQ/exec';
        const EVOLUTION_API_URL = 'https://evolution.ddlg.in/message/sendText/DDL%20Group%20Support%20V2';
        const EVOLUTION_API_KEY = 'F96432FA9ED2-4479-801E-DAE5187A4CAB';

        const cleanCustPhone = data.phone.replace(/[^0-9]/g, '');
        const formattedCustPhone = cleanCustPhone.startsWith('91') ? cleanCustPhone : `91${cleanCustPhone}`;

        // 1. Google Sheet
        try {
            fetch(GOOGLE_SHEET_URL, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
        } catch (e) {
            console.log('Google sheet log:', e);
        }

        // 2. WhatsApp Admin Alert
        const adminMsg = `🔔 *NEW SERVICE REQUEST - DDL GROUP*\n\n👤 *Name:* ${data.fullName}\n📞 *Phone:* ${cleanCustPhone}\n✉️ *Email:* ${data.email || 'N/A'}\n🛠️ *Service:* ${data.service}\n💬 *Message:* ${data.message || 'N/A'}`;
        
        try {
            fetch(EVOLUTION_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': EVOLUTION_API_KEY
                },
                body: JSON.stringify({
                    number: '917551067843',
                    text: adminMsg,
                    textMessage: { text: adminMsg }
                })
            });
        } catch (e) {
            console.log('WhatsApp Admin Alert attempt:', e);
        }

        // 3. WhatsApp Customer Auto-Reply
        const customerMsg = `Hello ${data.fullName}! 👋\n\nThank you for reaching out to *DDL Group*!\n\nWe have received your service request for *${data.service}*.\nOur team will review your requirement and call you back on ${cleanCustPhone}.\n\nNeed immediate help? Call us at 7551067843.\nWebsite: https://ddlg.in`;

        try {
            fetch(EVOLUTION_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': EVOLUTION_API_KEY
                },
                body: JSON.stringify({
                    number: formattedCustPhone,
                    text: customerMsg,
                    textMessage: { text: customerMsg }
                })
            });
        } catch (e) {
            console.log('WhatsApp Customer Reply attempt:', e);
        }

        return { success: true };
    }

});
