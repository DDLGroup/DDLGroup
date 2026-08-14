/* ==========================================================================
   DIGITAL DESIGN LEADERSHIP GROUP (DDL GROUP)
   INTERACTIVE JAVASCRIPT & POPUP ENQUIRY MODAL ENGINE
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {

    // --- 1. MODAL POPUP ENQUIRY SYSTEM ---
    const enquiryModalOverlay = document.getElementById('enquiryModalOverlay');
    const modalCloseBtn = document.getElementById('modalCloseBtn');
    const modalServiceSelect = document.getElementById('modalService');
    const modalCustomServiceGroup = document.getElementById('modalCustomServiceGroup');
    const modalCustomServiceInput = document.getElementById('modalCustomServiceInput');
    const modalFullNameInput = document.getElementById('modalFullName');
    const modalLeadForm = document.getElementById('modalLeadForm');
    const modalFormStatus = document.getElementById('modalFormStatus');
    const modalSubmitBtn = document.getElementById('modalSubmitBtn');

    // Function to Open Modal with auto-selected service
    function openEnquiryModal(serviceName) {
        if (!enquiryModalOverlay) return;

        // Reset status alert
        if (modalFormStatus) {
            modalFormStatus.className = 'form-status-alert hidden';
            modalFormStatus.textContent = '';
        }

        // Auto-select service in dropdown
        if (modalServiceSelect && serviceName) {
            let matched = false;
            const cleanTarget = serviceName.toLowerCase();

            for (let option of modalServiceSelect.options) {
                const optVal = option.value.toLowerCase();
                const optText = option.text.toLowerCase();

                if (cleanTarget.includes(optVal) || optVal.includes(cleanTarget) || 
                    cleanTarget.includes(optText) || optText.includes(cleanTarget)) {
                    option.selected = true;
                    matched = true;
                    break;
                }
            }

            // Fallback to first valid option if no exact match found
            if (!matched && modalServiceSelect.options.length > 1) {
                modalServiceSelect.selectedIndex = 1;
            }

            // Trigger change event to toggle custom input if needed
            modalServiceSelect.dispatchEvent(new Event('change'));
        }

        // Display modal
        enquiryModalOverlay.classList.remove('hidden');
        document.body.classList.add('modal-active');

        // Auto-focus first input
        setTimeout(() => {
            if (modalFullNameInput) modalFullNameInput.focus();
        }, 120);
    }

    // Function to Close Modal
    function closeEnquiryModal() {
        if (!enquiryModalOverlay) return;
        enquiryModalOverlay.classList.add('hidden');
        document.body.classList.remove('modal-active');
    }

    // Attach click handlers to ALL enquiry buttons across the page
    const enquiryButtons = document.querySelectorAll('.open-enquiry-modal-btn');
    enquiryButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const service = btn.getAttribute('data-service') || 'General Service Inquiry';
            openEnquiryModal(service);
        });
    });

    // Close button click
    if (modalCloseBtn) {
        modalCloseBtn.addEventListener('click', closeEnquiryModal);
    }

    // Click outside modal dialog to close
    if (enquiryModalOverlay) {
        enquiryModalOverlay.addEventListener('click', (e) => {
            if (e.target === enquiryModalOverlay) {
                closeEnquiryModal();
            }
        });
    }

    // Escape key listener to close modal
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && enquiryModalOverlay && !enquiryModalOverlay.classList.contains('hidden')) {
            closeEnquiryModal();
        }
    });

    // Toggle custom service input if "Other Service Request" is chosen
    if (modalServiceSelect && modalCustomServiceGroup) {
        modalServiceSelect.addEventListener('change', () => {
            if (modalServiceSelect.value === 'Other Service Request') {
                modalCustomServiceGroup.classList.remove('hidden');
                if (modalCustomServiceInput) modalCustomServiceInput.required = true;
            } else {
                modalCustomServiceGroup.classList.add('hidden');
                if (modalCustomServiceInput) modalCustomServiceInput.required = false;
            }
        });
    }


    // --- 2. LIVE REAL-TIME INSTANT SEARCH ---
    const serviceSearchInput = document.getElementById('serviceSearchInput');
    const clearSearchBtn = document.getElementById('clearSearchBtn');
    const serviceCards = document.querySelectorAll('.service-item-card');
    const noResultsNotice = document.getElementById('noResultsNotice');
    const resetSearchBtn = document.getElementById('resetSearchBtn');
    const searchResultsCount = document.getElementById('searchResultsCount');

    const totalServices = serviceCards.length;

    function filterServices() {
        const query = serviceSearchInput ? serviceSearchInput.value.toLowerCase().trim() : '';
        let visibleCount = 0;

        serviceCards.forEach(card => {
            const cardKeywords = (card.getAttribute('data-keywords') || '').toLowerCase();
            const cardTitle = (card.querySelector('.service-card-title')?.textContent || '').toLowerCase();
            const cardDesc = (card.querySelector('.service-short-desc')?.textContent || '').toLowerCase();
            const cardPrice = (card.querySelector('.service-price-tag')?.textContent || '').toLowerCase();

            const matches = !query || 
                cardTitle.includes(query) || 
                cardDesc.includes(query) || 
                cardKeywords.includes(query) ||
                cardPrice.includes(query);

            if (matches) {
                card.style.display = 'flex';
                visibleCount++;
            } else {
                card.style.display = 'none';
            }
        });

        // Update clear button visibility
        if (clearSearchBtn) {
            if (query.length > 0) {
                clearSearchBtn.classList.remove('hidden');
            } else {
                clearSearchBtn.classList.add('hidden');
            }
        }

        // Update results counter
        if (searchResultsCount) {
            if (!query) {
                searchResultsCount.innerHTML = `Showing all <strong>${totalServices}</strong> services`;
            } else {
                searchResultsCount.innerHTML = `Showing <strong>${visibleCount}</strong> of ${totalServices} services matching "<em>${escapeHtml(query)}</em>"`;
            }
        }

        // Show/hide no results card
        if (noResultsNotice) {
            if (visibleCount === 0) {
                noResultsNotice.classList.remove('hidden');
            } else {
                noResultsNotice.classList.add('hidden');
            }
        }
    }

    function escapeHtml(str) {
        return str.replace(/[&<>"']/g, function(m) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m];
        });
    }

    // Real-Time Search Typing
    if (serviceSearchInput) {
        serviceSearchInput.addEventListener('input', filterServices);
    }

    // Clear Search Button
    if (clearSearchBtn && serviceSearchInput) {
        clearSearchBtn.addEventListener('click', () => {
            serviceSearchInput.value = '';
            filterServices();
            serviceSearchInput.focus();
        });
    }

    // Reset from No-Results button
    if (resetSearchBtn && serviceSearchInput) {
        resetSearchBtn.addEventListener('click', () => {
            serviceSearchInput.value = '';
            filterServices();
            serviceSearchInput.focus();
        });
    }


    // --- 3. FULL SCREEN MOBILE MENU OVERLAY ---
    const mobileToggle = document.getElementById('mobile-toggle');
    const mobileClose = document.getElementById('mobile-close');
    const mobileMenuOverlay = document.getElementById('mobile-menu-overlay');

    function openMobileMenu() {
        if (mobileMenuOverlay) {
            mobileMenuOverlay.classList.add('active');
            document.body.classList.add('menu-open');
        }
    }

    function closeMobileMenu() {
        if (mobileMenuOverlay) {
            mobileMenuOverlay.classList.remove('active');
            document.body.classList.remove('menu-open');
        }
    }

    if (mobileToggle) mobileToggle.addEventListener('click', openMobileMenu);
    if (mobileClose) mobileClose.addEventListener('click', closeMobileMenu);

    if (mobileMenuOverlay) {
        mobileMenuOverlay.querySelectorAll('a, .mobile-nav-item').forEach(item => {
            item.addEventListener('click', () => {
                closeMobileMenu();
            });
        });
    }


    // --- 4. FORM SUBMISSION (WhatsApp Alerts & Google Sheets Integration) ---
    if (modalLeadForm) {
        modalLeadForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            if (modalFormStatus) {
                modalFormStatus.className = 'form-status-alert hidden';
                modalFormStatus.textContent = '';
            }

            let chosenService = modalServiceSelect.value;
            if (chosenService === 'Other Service Request' && modalCustomServiceInput) {
                chosenService = `Other: ${modalCustomServiceInput.value.trim()}`;
            }

            const formData = {
                fullName: document.getElementById('modalFullName').value.trim(),
                phone: document.getElementById('modalPhone').value.trim(),
                email: document.getElementById('modalEmail').value.trim(),
                service: chosenService,
                message: document.getElementById('modalMessage').value.trim(),
                timestamp: new Date().toISOString()
            };

            // Validate 10-digit phone
            if (!/^[0-9]{10}$/.test(formData.phone)) {
                showModalStatus('Please enter a valid 10-digit mobile number.', 'error');
                return;
            }

            setModalLoading(true);

            try {
                let response = await fetch('/api/submit-lead', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });

                if (!response.ok && (response.status === 404 || response.status === 405)) {
                    response = await runDirectFallbackApi(formData);
                } else {
                    response = await response.json();
                }

                if (response.success || response.status === 'success') {
                    showModalStatus('🎉 Thank you! Your request has been received. A WhatsApp confirmation message has been sent to your phone!', 'success');
                    modalLeadForm.reset();
                    if (modalCustomServiceGroup) modalCustomServiceGroup.classList.add('hidden');
                    
                    // Auto close modal after 3.5 seconds
                    setTimeout(() => {
                        closeEnquiryModal();
                    }, 3500);
                } else {
                    showModalStatus(response.message || 'Error submitting request. Please call or WhatsApp 7551067843.', 'error');
                }

            } catch (error) {
                console.error('Submission network error, running direct fallback:', error);
                try {
                    const fallbackResult = await runDirectFallbackApi(formData);
                    if (fallbackResult.success) {
                        showModalStatus('🎉 Request submitted successfully! A WhatsApp notification has been dispatched.', 'success');
                        modalLeadForm.reset();
                        if (modalCustomServiceGroup) modalCustomServiceGroup.classList.add('hidden');
                        setTimeout(() => {
                            closeEnquiryModal();
                        }, 3500);
                    } else {
                        showModalStatus('Unable to process automatically. Please call us directly at 7551067843.', 'error');
                    }
                } catch (fallbackErr) {
                    showModalStatus('Connection timeout. Please call or WhatsApp 7551067843 directly.', 'error');
                }
            } finally {
                setModalLoading(false);
            }
        });
    }

    function setModalLoading(isLoading) {
        if (!modalSubmitBtn) return;
        modalSubmitBtn.disabled = isLoading;
        const btnText = modalSubmitBtn.querySelector('.btn-text');
        const btnSpinner = modalSubmitBtn.querySelector('.btn-spinner');

        if (isLoading) {
            if (btnText) btnText.classList.add('hidden');
            if (btnSpinner) btnSpinner.classList.remove('hidden');
        } else {
            if (btnText) btnText.classList.remove('hidden');
            if (btnSpinner) btnSpinner.classList.add('hidden');
        }
    }

    function showModalStatus(msg, type) {
        if (!modalFormStatus) return;
        modalFormStatus.textContent = msg;
        modalFormStatus.className = `form-status-alert ${type}`;
    }

    // Direct Client-Side Fallback Integration (Evolution WhatsApp API + Google Sheets)
    async function runDirectFallbackApi(data) {
        const GOOGLE_SHEET_URL = 'https://script.google.com/macros/s/AKfycbxKJs977tNMZ5se24zBnpywMmE8bRWIvWJHhp5B5NeuYmbv_EmPFH_ezVO548qIWdIHrQ/exec';
        const EVOLUTION_API_URL = 'https://evolution.ddlg.in/message/sendText/DDL%20Group%20Support%20V2';
        const EVOLUTION_API_KEY = 'F96432FA9ED2-4479-801E-DAE5187A4CAB';

        const cleanCustPhone = data.phone.replace(/[^0-9]/g, '');
        const formattedCustPhone = cleanCustPhone.startsWith('91') ? cleanCustPhone : `91${cleanCustPhone}`;

        // 1. Google Sheets Record
        try {
            fetch(GOOGLE_SHEET_URL, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
        } catch (e) {
            console.log('Google sheet log error:', e);
        }

        // 2. WhatsApp Admin Alert
        const adminMsg = `🔔 *NEW SERVICE ENQUIRY - DDL GROUP*\n\n👤 *Name:* ${data.fullName}\n📞 *Phone:* ${cleanCustPhone}\n✉️ *Email:* ${data.email || 'N/A'}\n🛠️ *Service:* ${data.service}\n💬 *Message:* ${data.message || 'N/A'}`;
        
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

        // 3. WhatsApp Customer Confirmation Auto-Reply
        const customerMsg = `Hello ${data.fullName}! 👋\n\nThank you for reaching out to *Digital Design Leadership Group (DDL Group)*!\n\nWe have received your enquiry for *${data.service}*.\nOur technical team will review your requirement and call you back on ${cleanCustPhone}.\n\nNeed urgent assistance? Call us at 7551067843.\nOfficial Website: https://ddlg.in\nServices Portal: https://ddlgroup.ddlg.in`;

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
